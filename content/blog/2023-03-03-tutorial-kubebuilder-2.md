---
.formatter: # (@formatter:off)
title: Tutorial - Kubernetes Operator with Kubebuilder part 2
draft: false
toc: true
authors:
  - janos-miko
tags:
  - kubernetes
  - kubebuilder
  - aks
  - eks
  - gke
  - cloud-native
  - cloudnative
  - openshift
categories: tech
date: '2023-03-03'
lastmod: '2023-03-04'
sitemap_exclude: false
featuredImage: /images/blog/2023-03-02-tutorial-kubebuilder/tutorial-kubebuilder-2.png
featuredImage_webp: /images/blog/2023-03-02-tutorial-kubebuilder/tutorial-kubebuilder-2.webp

---

Creating an API and a Controller

<!--more-->

## Intro

This article is a part of a tutorial series about creating a Kubernetes operator with Kubebuilder in Go. We are covering
the following topics:

- Creating a development cluster
- Tracing, Logging, Kubernetes event recording
- Lifecycle of a Resource in Kubernetes, including Finalizers
- Triggering the reconciliation manually (based on a custom annotation)
- Search indexing
- Formatting the output of `kubectl get`

The articles of the series are:
- [Part 1 - Preparing a development cluster](/blog/2023-03-02-tutorial-kubebuilder-1/)
- [Part 2 - Creating an API and a Controller](/blog/2023-03-03-tutorial-kubebuilder-2/)
- [Part 3 - Extending the operator](/blog/2023-03-04-tutorial-kubebuilder-3/)
- Source code: [https://github.com/janosmiko/tutorial-kubebuilder](https://github.com/janosmiko/tutorial-kubebuilder)

## Creating an API

```bash
$ kubebuilder create api --version v1alpha1 --kind Domainresolver --resource --controller --make

$ make generate && make manifests
```

### Allow unsigned CRDs

Add the following kubebuilder tag to the `api/domainresolver_types.go` file just above the `Domainresolver` struct.

```go
//+kubebuilder:metadata:annotations="api-approved.kubernetes.io=https://janosmiko.com"
```

### Extend Custom Resource's Status

Extend the DomainresolverStatus struct in the `api/domainresolver_types.go` with some status indicators.

- `Ready` will be true when the Resource is ready.
- `Failed` is a counter showing how many times the process failed.
- `Phase` and `Conditions` are structs defined in the metav1 package. Phase is the current state of the Resource. Conditions is a slice of the previous Phases.
- `SpecHash` contains the hash of the current Spec. It will allow us to watch if the spec of the Resource changed and restart the reconciliation process.

```go
type DomainresolverStatus struct {
	Ready      bool               `json:"ready"`
	Failed     int                `json:"failed,omitempty"`
	Phase      metav1.Condition   `json:"phase,omitempty"`
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type" protobuf:"bytes,1,rep,name=conditions"`
	SpecHash   string             `json:"specHash,omitempty"`
	IPAddress  string             `json:"ipAddress,omitempty"`
}
```

### Define Status Phases

Add the following lines to `api/domainresolver_types.go`. We are going to use these phases through the Reconciliation process.

- Pending: can be useful when the Resource cannot be created because it is waiting for another Resource to be ready. (Eg: you are creating a user, but it’s team is not yet created)
- Creating: the reconciler started to create the Resource. As it can be a long process it’s worth to create a dedicated status while the process is running.
- Created: the reconciler finished the creation of the Resource. The Resource is ready.
- Terminating: the reconciler started to delete the Resource.
- Deleted: the reconciler finished to delete the Resource. In this phase we are going to remove the finalizer so Kubernetes can remove the Custom Resource.
- Error: an error occurred during the process.

```go
type DomainresolverStatusPhase string

const (
	DomainresolverStatusPhasePending        DomainresolverStatusPhase = "Pending"
	DomainresolverStatusPhaseCreating       DomainresolverStatusPhase = "Creating"
	DomainresolverStatusPhaseCreated        DomainresolverStatusPhase = "Created"
	DomainresolverStatusPhaseTerminating    DomainresolverStatusPhase = "Terminating"
	DomainresolverStatusPhaseDeleted        DomainresolverStatusPhase = "Deleted"
	DomainresolverStatusPhaseError          DomainresolverStatusPhase = "Error"
)
```

### Define the Custom Resource’s Spec

We will add two attributes to the DomainResolver.

- Id: the identifier of the Resource. Assuming it’s required and it cannot be changed we can add some validations.
- Domain: a custom domain. We are going to fetch the domain’s IP address and store it in the Resource’s `status.ipAddress` field.

```go
type DomainresolverSpec struct {
	//+kubebuilder:validation:Required
	//+kubebuilder:validation:MinLength=1
	//+kubebuilder:validation:XValidation:rule="self == oldSelf",message="Value is immutable"
	Id string `json:"id"`

	//+kubebuilder:validation:Required
	//+kubebuilder:validation:MinLength=1
	Domain string `json:"domain"`
}
```

### Update the controller

#### Make it namespace scoped

Just below the beginning of the main function, add a new variable and bind to a flag.

```go
func main() {
	var namespace string
	flag.StringVar(&namespace, "namespace", "", "The namespace the controller will watch")
  ...
```

Add it to the controller manager initialization

```go
mgr, err := ctrl.NewManager(
		ctrl.GetConfigOrDie(), ctrl.Options{
			Namespace:              namespace,
			Scheme:                 scheme,
			MetricsBindAddress:     metricsAddr,
			Port:                   9443,
			HealthProbeBindAddress: probeAddr,
			LeaderElection:         enableLeaderElection,
			LeaderElectionID:       "1e00d489.janosmiko.com",
```

### Initialize tracing

Add OTEL dependencies:

```go
go get go.opentelemetry.io/otel
go get go.opentelemetry.io/otel/exporters/jaeger
go get go.opentelemetry.io/otel/sdk/trace
go get go.opentelemetry.io/otel/semconv/v1.17.0
```

```go
// Create the Jaeger exporter
exp, err := jaeger.New(jaeger.WithCollectorEndpoint(jaeger.WithEndpoint("http://localhost:14268/api/traces")))
if err != nil {
	panic(err)
}
provider := trace.NewTracerProvider(
	trace.WithBatcher(exp),
	trace.WithResource(
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName("tutorial-kubebuilder"),
		),
	),
)
flush := func() {
	_ = provider.Shutdown(context.TODO())
}
defer flush()

otel.SetTracerProvider(provider)
```

### Logging, tracing and event recording

Update the controller struct in `internal/controller/domainresolver_controller.go` and add a Logger, a Tracer and a Recorder.

```go
// DomainresolverReconciler reconciles a Domainresolver resource
type DomainresolverReconciler struct {
	client.Client
	Scheme *runtime.Scheme
	Logger    logr.Logger
	Recorder  record.EventRecorder
	Tracer    trace.Tracer
}
```

Go back to the `main.go` file and pass the logger, recorder and tracer to the Controller.

```go
if err = (&controller.DomainresolverReconciler{
	Client: mgr.GetClient(),
	Scheme: mgr.GetScheme(),
	Logger: mgr.GetLogger(),
	Recorder: mgr.GetEventRecorderFor("tutorial-kubebuilder"),
	Tracer:    otel.Tracer("tutorial-kubebuilder"),
}).SetupWithManager(mgr); err != nil {
	setupLog.Error(err, "unable to create controller", "controller", "Domainresolver")
	os.Exit(1)
}
```

### Build and run

Now we are ready to build and install the first version of the Operator to the cluster.

But before doing that… **Make sure the Kubernetes cluster is not trying to download the latest image from Docker Hub (as this image will not available there)**.

Update the deployment spec in `config/manager/manager.yaml` and add `imagePullPolicy: Never`.

```yaml
containers:
  - command:
    - /manager
  args:
    - --leader-elect
  image: controller:latest
  imagePullPolicy: Never
```

Now we can install and deploy the controller.

```bash
$ make generate && make manifests && make install
$ make docker-build IMG=controller:latest
$ kind load docker-image controller:latest -n test
$ make deploy IMG=controller:latest
```

## Further reading
- [Operator best practices](https://github.com/slaise/community-operators/blob/master/docs/best-practices.md)
- [Kubebuilder book](https://book.kubebuilder.io/)
- [Kubebuilder docs](https://pkg.go.dev/sigs.k8s.io/kubebuilder)
- The featured image was generated using [gopherize.me](https://gopherize.me/).

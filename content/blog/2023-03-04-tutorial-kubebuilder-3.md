---
.formatter: # (@formatter:off)
title: Tutorial - Kubernetes Operator with Kubebuilder part 3
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
date: '2023-03-04'
lastmod: '2023-03-04'
sitemap_exclude: false
featuredImage: /images/blog/2023-03-02-tutorial-kubebuilder/tutorial-kubebuilder-3.png
featuredImage_webp: /images/blog/2023-03-02-tutorial-kubebuilder/tutorial-kubebuilder-3.webp

---

Extending the Operator

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

## Extending the Operator

### The Reconciliation loop

In the next step we are going to do the following:

- Prepare a context with deadline to make sure we don’t get stuck in the loop.
- Prepare the logger and the tracer.
- Move the Resource to terminating state if the Resource’s `DeletionTimestamp` is not zero - and restart the reconciliation.
- Add a Finalizer to our Resource if it doesn’t contain one - and restart the reconciliation.

```go
if !o.ObjectMeta.DeletionTimestamp.IsZero() &&
	v1alpha1.DomainresolverStatusPhase(o.Status.Phase.Type) != v1alpha1.DomainresolverStatusPhaseTerminating {
	span.AddEvent("DomainResolver is being deleted, setting it's status to terminating")
	log.Info("DomainResolver is being deleted, setting it's status to terminating")

	err := r.statusNext(
		ctx,
		o,
		v1alpha1.DomainresolverStatusPhaseTerminating,
		"DomainResolver terminating",
		DomainresolverReasonTerminating,
		false,
	)
	if err != nil {
		span.RecordError(err)

		return ctrl.Result{}, err
	}

	return ctrl.Result{Requeue: true}, nil
}

if !controllerutil.ContainsFinalizer(o, DomainresolverFinalizerName) {
	span.AddEvent("Adding finalizer to the DomainResolver")
	log.Info("Adding finalizer to the DomainResolver")

	patch := client.MergeFrom(o.DeepCopy())
	controllerutil.AddFinalizer(o, DomainresolverFinalizerName)

	err = r.Client.Patch(ctx, o, patch)
	if err != nil {
		span.RecordError(err)

		return ctrl.Result{}, err
	}

	return ctrl.Result{Requeue: true}, nil
}

switch v1alpha1.DomainresolverStatusPhase(o.Status.Phase.Type) {
case "":
	return r.ReconcileNew(ctx, o)

case v1alpha1.DomainresolverStatusPhasePending:
	return r.ReconcilePending(ctx, o)

case v1alpha1.DomainresolverStatusPhaseCreating:
	return r.ReconcileCreating(ctx, o)

case v1alpha1.DomainresolverStatusPhaseCreated:
	return r.ReconcileCreated(ctx, o)

case v1alpha1.DomainresolverStatusPhaseTerminating:
	return r.ReconcileTerminating(ctx, o)

case v1alpha1.DomainresolverStatusPhaseDeleted:
	return r.ReconcileDeleted(ctx, o)

case v1alpha1.DomainresolverStatusPhaseError:
	return r.ReconcileError(ctx, o)

default:
	return ctrl.Result{}, fmt.Errorf("unknown status: %s", o.Status.Phase.Type)
}
```

### Additional functions

```go
// TODO: StatusUpdate, StatusNext, CreateSpecHash functions
```

### Add a manual trigger

We can also add a trigger to make it easy to restart the reconciliation process from the beginning.

To do so, define a checkTrigger function. This is going to look for an annotation that have to contain a date. If it’s 
newer than the last transition time, it’s going to return true.

```go
func (r *DomainresolverReconciler) checkTrigger(o *v1alpha1.Domainresolver) bool {
	reset := o.GetAnnotations()["tutorial.janosmiko.com/reset"]

	// Parse date from trigger annotation if it's formatted: `date -Iseconds -r 1533415339`
	layout := time.RFC3339
	t, err := time.Parse(layout, reset)
	if err != nil {
		return false
	}

	// Check if trigger is newer than the last transition time
	if t.After(o.Status.Phase.LastTransitionTime.Time) {
		return true
	}

	return false
}
```

Now inject that function to the main reconciliation loop.

```go
if r.checkTrigger(o) {
	return r.ReconcileReset(ctx, o)
}
```

Trigger the trigger
```
kubectl annotate -n default domainresolver.tutorial.janosmiko.com domainresolver-sample --overwrite \                                                                      ─╯
 tutorial.janosmiko.com/reset="$(date -Iseconds)"
```

### Create an example indexer

First of all, to enable access to additional resources, you’ll have to add the following annotation to the beginning of the ``internal/controller/domainresolver_controller.go` file:

```go
//+kubebuilder:rbac:groups="*",resources=pods,verbs=get;list
```

Next, add an indexer to the SetupWithManager function.

The following example is going to index the Pods by the first container’s names inside them.

Using this indexer we will be able to search for all Pods whose first container’s name is “x”.

```go
if err := mgr.GetFieldIndexer().IndexField(
	context.Background(),
	&apiv1.Pod{},
	".customIndexer.pods.byFirstContainerName",
	func(rawObj client.Object) []string {
		pod, ok := rawObj.(*apiv1.Pod)
		if !ok {
			return nil
		}

		return []string{pod.Spec.Containers[0].Name}
	},
); err != nil {
	return err
}
```

### Rebuild and Restart

```bash
$ make generate && make manifests && make install
$ make docker-build IMG=controller:latest
$ kind load docker-image controller:latest -n test
$ make deploy IMG=controller:latest
$ kubectl rollout restart deployment -n tutorial-kubebuilder-system tutorial-kubebuilder-controller-manager
```

### Define and Apply our Custom Resource

```bash
$ cat << EOF >config/samples/_v1alpha1_domainresolver.yaml
apiVersion: tutorial.janosmiko.com/v1alpha1
kind: Domainresolver
metadata:
  labels:
    app.kubernetes.io/name: domainresolver
    app.kubernetes.io/instance: domainresolver-sample
    app.kubernetes.io/part-of: tutorial-kubebuilder
    app.kubernetes.io/managed-by: kustomize
    app.kubernetes.io/created-by: tutorial-kubebuilder
  name: domainresolver-sample
spec:
  id: test
  domain: janosmiko.com
EOF

$ kubectl apply -f config/samples/_v1alpha1_domainresolver.yaml
```

### The results

We can check the custom resource’s status by running

```go
kubectl get domainresolver.tutorial.janosmiko.com domainresolver-sample -o yaml
```

```yaml
...
status:
  conditions:
    - lastTransitionTime: '2023-03-03T22:38:00Z'
      message: DomainResolver created
      reason: DomainresolverCreated
      status: 'True'
      type: Created
    - lastTransitionTime: '2023-03-03T22:38:00Z'
      message: DomainResolver creating
      reason: DomainresolverCreating
      status: 'False'
      type: Creating
    - lastTransitionTime: '2023-03-03T22:38:00Z'
      message: Preparing DomainResolver
      reason: DomainresolverNew
      status: 'False'
      type: Pending
  ipAddress: 185.199.109.153
  phase:
    lastTransitionTime: '2023-03-03T22:38:00Z'
    message: DomainResolver created
    reason: DomainresolverCreated
    status: 'True'
    type: Created
  ready: true
  specHash: b442cc366de2547e17f97cf4dd72f9f90340639570f583bc801f2d570df820a1
spec:
  domain: janosmiko.com
  id: test
```

### Formatting

If we print the results in regular format, we will not see anything from the spec or the status.

```bash
$ kubectl get domainresolver.tutorial.janosmiko.com domainresolver-sample -o wide
```
```text
NAME                  AGE
domainresolver-sample   5m24s
```

But it is possible to add custom columns to make the `kubectl get` output prettier.

Add the following lines to the `api/v1alpha1/domainresolver_types.go` to get better results.

```go
//+kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp",description="The age of the domainresolver"
//+kubebuilder:printcolumn:name="Domain",type="string",JSONPath=".spec.domain",description="The domain name assigned to the domainresolver"
//+kubebuilder:printcolumn:name="IP Address",type="string",JSONPath=".status.ipAddress",description="The IP address assigned to the domainresolver"
//+kubebuilder:printcolumn:name="Image ID",type="string",JSONPath=".status.controllerImageID",description="The Image ID of the kube-rbac-proxy"
```

Now rebuild and check the results again.

```bash
$ kubectl get domainresolver.tutorial.janosmiko.com domainresolver-sample -o wide
```

```text
NAME                  AGE   DOMAIN          IP ADDRESS        IMAGE ID
domainresolver-sample   12s   janosmiko.com   185.199.109.153   blabla
```

### Tracing

We can also see the traces of the reconciliation process in Jaeger.

![jaeger.png](/images/blog/2023-03-02-tutorial-kubebuilder/jaeger.png)

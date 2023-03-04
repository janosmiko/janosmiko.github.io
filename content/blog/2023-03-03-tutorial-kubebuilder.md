---
title: Tutorial - Kubernetes Operator with Kubebuilder part 1 - Preparing a development cluster
draft: false
toc: true
authors:

- janos-miko
  tags:
- kubernetes
- aks
- eks
- gke
- cloud-native
- cloudnative
- openshift
  categories: tech
  date: '2023-03-03'
  lastmod: '2023-03-03'
  sitemap_exclude: false
  featuredImage: /images/blog/2023-03-03-tutorial-kubernetes-operator-with-kubebuilder/kubernetes-operator-1.png
  featuredImage_webp: /images/blog/2023-03-03-tutorial-kubernetes-operator-with-kubebuilder/kubernetes-operator-1.webp

---

How to create a Kuberentes Operator with Kubebuilder.

<!--more-->

# Preparing a development cluster

## Intro

This document is part of a tutorial series about creating a Kubernetes operator with Kubebuilder in Go. We are covering
the following topics:

- Creating a development cluster
- Tracing, Logging, Kubernetes event recording
- Lifecycle of an Object in Kubernetes, including Finalizers
- Triggering the reconciliation manually (based on a custom annotation)
- Search indexing
- Formatting the output of `kubectl get`
- Adding webhooks

The operator will be simple. Our Custom Resource Definition will describe the following Object structure.

```bash
apiVersion: janosmiko.com/v1alpha1
kind: CustomObject
metadata:
  name: customobject-sample
spec:
  id: test
  domain: janosmiko.com
```

The operator will take the domain we give in the `spec.domain` attribute, get the domain’s IP address and write it to
the object’s status field with a bunch of additional useful information. It will also determine the Controller Pod’s
kube-rbac-proxy container’s image (demonstrating indexing Pods by a custom field).

```bash
apiVersion: janosmiko.com/v1alpha1
kind: CustomObject
metadata:
  name: customobject-sample
status:
  conditions:
    - lastTransitionTime: '2023-03-03T22:38:00Z'
      message: Object created
      reason: CustomObjectCreated
      status: 'True'
      type: Created
    - lastTransitionTime: '2023-03-03T22:38:00Z'
      message: Object creating
      reason: CustomObjectCreating
      status: 'False'
      type: Creating
    - lastTransitionTime: '2023-03-03T22:38:00Z'
      message: Preparing object
      reason: CustomObjectNew
      status: 'False'
      type: Pending
  ipAddress: 185.199.109.153
  phase:
    lastTransitionTime: '2023-03-03T22:38:00Z'
    message: Object created
    reason: CustomObjectCreated
    status: 'True'
    type: Created
  ready: true
  specHash: b442cc366de2547e17f97cf4dd72f9f90340639570f583bc801f2d570df820a1
spec:
  id: test
  domain: janosmiko.com
```

## Prerequisites

- Golang 1.19
- Docker Desktop
- Kind
- Kubectl
- Helm
- Make

## Initialize a kubebuilder project

```bash
kubebuilder init --plugins=go/v4-alpha --domain janosmiko.com --repo github.com/janosmiko/tutorial-kubebuilder
```

## Create a test Kubernetes Cluster with Kind, expose port 80 and 443

Of course, it’s possible to use Docker Desktop’s Kubernetes, Rancher Desktop or - put your favourite Kubernetes
distribution here -.

```bash
cat << EOF >hack/kind.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: test
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
  - role: worker
EOF

kind create cluster --config hack/kind.yaml

```

When the Cluster is ready make sure to change the Kubernetes context:

```bash
kubectl config use-context kind-test

```

### Enable cert-manager and ingress-nginx

```bash
kubectl config use-context kind-test

kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

kubectl wait --namespace ingress-nginx \
	--for=condition=ready pod \
	--selector=app.kubernetes.io/component=controller \
	--timeout=90s
```

### Test ingress + cert-manager

```bash
kubectl create deployment web --image=gcr.io/google-samples/hello-app:1.0

kubectl expose deployment web --type=ClusterIP --port=8080

mkdir -p test
cat << EOF > test/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  rules:
    - host: localhost
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 8080
EOF

kubectl apply -f test/ingress.yaml
```

You can test if the ingress works with curl:

```bash
curl http://localhost:80

Hello, world!
Version: 1.0.0
Hostname: web-84fb9498c7-xgmmq
```

### Cleanup

```bash
kubectl delete deployment web
kubectl delete svc web
kubectl delete -f test/ingress.yaml
```

## Install Jaeger to the cluster

```bash
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts

cat <<EOF > hack/jaeger-values.yaml
provisionDataStore:
  cassandra: false
allInOne:
  enabled: true
  ingress:
    enabled: true
    hosts:
      - jaeger-query.jaeger
agent:
  enabled: false
query:
  enabled: false
collector:
  enabled: false
storage:
  type: none

extraObjects:
  - apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: jaeger-collector
      namespace: jaeger
    spec:
      rules:
        - host: jaeger-collector.jaeger
          http:
            paths:
              - path: /
                pathType: ImplementationSpecific
                backend:
                  service:
                    name: jaeger-collector
                    port:
                      number: 14268
  - apiVersion: v1
    kind: Service
    metadata:
      name: jaeger-collector-exposed
      namespace: jaeger
    spec:
      ports:
        - name: http-zipkin
          protocol: TCP
          port: 9411
          targetPort: 9411
        - name: grpc-http
          protocol: TCP
          port: 14250
          targetPort: 14250
        - name: c-tchan-trft
          protocol: TCP
          port: 14267
          targetPort: 14267
        - name: http-c-binary-trft
          protocol: TCP
          port: 14268
          targetPort: 14268
        - name: otlp-grpc
          protocol: TCP
          port: 4317
          targetPort: 4317
        - name: otlp-http
          protocol: TCP
          port: 4318
          targetPort: 4318
      selector:
        app.kubernetes.io/component: all-in-one
        app.kubernetes.io/instance: jaeger
        app.kubernetes.io/name: jaeger
      clusterIP: ""
      type: ClusterIP
EOF

helm upgrade --install jaeger jaegertracing/jaeger \
	--namespace jaeger \
	--create-namespace \
	-f hack/jaeger-values.yaml
```

If you add the following line to your hosts file you’ll be able to reach Jaeger’s frontend in your browser without
port-forwarding.

Note: we are using the same domain as it can be reached inside the Kubernetes cluster. With this you can send traces
even if your application is running on your host machine (and not inside the Kubernetes cluster). E.g. if you are
debugging it locally.

```bash
127.0.0.1 jaeger-collector.jaeger jaeger-query.jaeger
```

http://jaeger-query.jaeger
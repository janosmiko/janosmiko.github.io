---
.formatter: # (@formatter:off)title: Creating a Postgres tunnel in Kubernetes
title: Creating a Postgres tunnel in Kubernetes
draft: false
toc: false
authors:
  - janos-miko
tags:
  - postgresql
  - kubernetes
categories: 
  - tech
date: '2024-06-12'
lastmod: '2024-06-12'
sitemap_exclude: false
---

<!--more-->

```bash
# This is only required on WINDOWS Powershell: make sure $USER contains your username
# $USER = $env:UserName

# Create a socat container to tunnel to the postgres service
# This will run in foreground so you'll need a separate terminal to open the port-forward
kubectl -n __KUBERNETES_NAMESPACE__ run postgres-tunnel-$USER -it --image=alpine/socat --tty --rm --expose=true --port=5432 tcp-listen:5432,fork,reuseaddr tcp-connect:__POSTGRES_SERVICE_NAME__:5432

######
# IN ANOTHER TERMINAL
######
# Open a port-forward to the socat container
kubectl -n __KUBERNETES_NAMESPACE__ port-forward svc/postgres-tunnel-$USER 54320:5432

# Now you can connect using your favorite postgres client using 
host: localhost
port: 54320
```

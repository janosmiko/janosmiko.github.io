---
.formatter: # (@formatter:off)title: Creating a Postgres tunnel in Kubernetes
title: Fixing Sentry Snuba migrations
draft: false
toc: false
authors:
  - janos-miko
tags:
  - sentry
  - snuba
  - helm
  - kubernetes
categories:
  - tech
date: '2024-06-12'
lastmod: '2024-06-12'
sitemap_exclude: false
---

<!--more-->

Get a shell inside the `snuba-api` pod:

```bash
kubectl exec -it -n sentry \
  $(kubectl get pod -n sentry -l app=sentry -l role=snuba-api -o jsonpath="{.items[0].metadata.name}") \
  -- sh -c "/bin/bash"
```

And run the following in it:

```bash
# This will give you the list of migrations and you will see the migration id for the failed migration
snuba migrations list

# Determine the __MIGRATION_GROUP__ and the __MIGRATION_ID__ from the list

# This will revert the failed migration
snuba migrations reverse --group __MIGRATION_GROUP__ --migration-id __MIGRATION_ID__
# E.g.:
# snuba migrations reverse --group profile_chunks --migration-id 0001_create_profile_chunks_table

# If everything is fine, you can reapply the migrations
snuba migrations migrate --force
```

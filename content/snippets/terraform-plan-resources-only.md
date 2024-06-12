---
.formatter: # (@formatter:off)
title: Terraform plan show resource names only
draft: false
toc: false
authors:
  - janos-miko
tags:
  - terraform
categories:
  - tech
date: '2024-06-12'
lastmod: '2024-06-12'
sitemap_exclude: false
---

<!--more-->

## Requirements
- terraform
- jq

```bash
# Dump terraform output to a file
terraform plan -out tfplan

# Show only the resource name and the action of those that will be updated or recreated
terraform show -json tfplan \
  | jq -r '.resource_changes[] | select (.change.actions | inside(["create","update","delete"])) |  [ .address, ( .change.actions | join(" ")) ] | @csv' \
  | sed -e "s/delete\screate/replace/g" -e "s/create\sdelete/replace/g"
```

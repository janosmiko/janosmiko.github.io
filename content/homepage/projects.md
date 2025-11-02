---
title: Projects
draft: false
weight: 7

widget:
  handler: projects

  # Options: sm, md, lg and xl. Default is md.
  width: lg

  sidebar:
    # Options: left and right. Leave blank to hide.
    position: left
    # Options: sm, md, lg and xl. Default is md.
    scale: md

  background:
    # Options: primary, secondary, tertiary or any valid color value. Default is primary.
    color: primary
    #image: images/funky-lines.png
    # Options: auto, cover and contain. Default is auto.
    size:
    # Options: center, top, right, bottom, left.
    position: center
    # Options: fixed, local, scroll.
    attachment: fixed

projects:
  - title: Reward
    url: https://github.com/rewardenv/reward
    dates: 2021-2022
    logo: https://github.com/rewardenv/reward/raw/main/docs/imgs/reward-logo.png
    writeup: |
      - Reward is a Swiss Army knife CLI utility for orchestrating Docker based development environments.
      - It makes possible to run multiple local environments simultaneously without port conflicts by utilizing common services proxying requests to the correct environment's containers.
      - Reward is written in Go, and it supports Linux, macOS and Windows (and WSL2).

  - title: Hetzner K3s
    url: https://github.com/janosmiko/hetzner-k3s
    dates: 2022
    logo: /images/hetzner-k3s.png
    writeup: |
      - This tool is able to create Lightweight Kubernetes (k3s) clusters in Hetzner Cloud in minutes.
      - It can install Highly-Available kubernetes clusters with multiple masters
      - It supports static node pools or (multiple) autoscaling node pools
      - It automatically installs the required kubernetes addons for Hetzner (CCM, CSI driver, cluster-autoscaler, etc.)

  - title: Easy Helm
    url: https://github.com/janosmiko/easyhelm
    dates: 2023
    logo: /images/easyhelm.png
    writeup: |
      - Generate Helm charts with ease (based on a single config file).

  - title: Gitea LDAP Sync
    url: https://github.com/janosmiko/gitea-ldap-sync
    dates: 2022
    logo: /images/gitea-ldap-sync.png
    writeup: |
      - LDAP Synchronization in Gitea is very limited so I created a tool which is able to sync Organizations, Teams, Users and the relation (memberships) between these entities.
      - This tool provides advanced configuration for sync like attribute mapping, exclusions (list or regex based), full (addition and deletion) or assert-only syncing, and many more.
      - It provides support for Docker and Kubernetes.
---

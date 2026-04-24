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
  - title: LFK
    url: https://github.com/janosmiko/lfk
    dates: 2026
    logo: https://github.com/janosmiko/lfk/raw/main/docs/imgs/logo.png
    writeup: |
      - LFK (Lightning Fast Kubernetes navigator) is a keyboard-focused, terminal user interface for navigating and managing Kubernetes clusters.
      - Built-in integrations with ArgoCD and Helm, multi-cluster and multi-context support via merged kubeconfig loading, and context-aware actions for logs, exec, attach, debug, scale, restart, port-forward, and more.
      - Includes an API Explorer, Can-I RBAC browser, ConfigMap and Secret editors, YAML preview with syntax highlighting, and a lot more.

  - title: Vau
    url: https://github.com/janosmiko/vau
    dates: 2026
    logo: https://github.com/hashicorp/vault/raw/f22d202cde2018f9455dec755118a9b84586e082/Vault_PrimaryLogo_Black.png
    writeup: |
      - Vau (Vault Navigator) is a terminal UI for browsing and editing HashiCorp Vault KV secrets.
      - Features include vim-style navigation, in-place secret editing, recursive copy/move/delete operations and more.
      - Vau is written in Go and is distributed via Homebrew, Docker, Debian/RPM packages and pre-built binaries for Linux and macOS.

  - title: Reward
    url: https://github.com/rewardenv/reward
    dates: 2021-2026
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
---

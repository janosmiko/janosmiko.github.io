---
title: Projects
draft: false
projects:
  - title: Reward
    url: https://github.com/rewardenv/reward
    dates: 2021
    logo: https://github.com/rewardenv/reward/raw/main/docs/imgs/reward-github-card.png
    writeup: |
      - Reward is a Swiss Army knife CLI utility for orchestrating Docker based development environments.
      - It makes possible to run multiple local environments simultaneously without port conflicts by utilizing common services proxying requests to the correct environment's containers.
      - Reward is written in Go, and it supports Linux, macOS and Windows (and WSL2).

weight: 6
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
---

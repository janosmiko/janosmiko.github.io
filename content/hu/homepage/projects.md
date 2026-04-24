---
title: Projektek
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
      - Az LFK (Lightning Fast Kubernetes navigator) egy billentyűzetes navigáció fókuszú TUI Kubernetes clusterek kezeléséhez.
      - Beépített integrációk ArgoCD-vel és Helm-mel, támogat több clustert és több kontextust, valamint számtalan hasznos funkciót skálázáshoz, logok olvasáshoz, debugoláshoz, stb.
      - Tartalmaz API Explorert, Can-I RBAC böngészőt, ConfigMap és Secret szerkesztőket, YAML előnézetet szintaxis kiemeléssel, és még sok mást.

  - title: Vau
    url: https://github.com/janosmiko/vau
    dates: 2026
    logo: https://github.com/hashicorp/vault/raw/f22d202cde2018f9455dec755118a9b84586e082/Vault_PrimaryLogo_Black.png
    writeup: |
      - A Vau (Vault Navigator) egy TUI felület HashiCorp Vault KV secretek böngészéséhez és szerkesztéséhez.
      - Funkciói között megtalálható a vim-stílusú navigáció, secretek szerkesztése, rekurzív másolás/áthelyezés/törlés műveletek és még sok más.

  - title: Reward
    url: https://github.com/rewardenv/reward
    dates: 2021-2022
    logo: https://github.com/rewardenv/reward/raw/main/docs/imgs/reward-logo.png
    writeup: |
      - A Reward egy parancssori eszköz, amely Docker alapú fejlesztői környezetek futtatását könnyíti meg.
      - Segítségével lehetővé válik több fejlesztői környezet egyidejű, párhuzamos futtatása port ütközés nélkül. 
      - A Reward Go nyelven íródott és fut Linuxon, macOS-en és Windows-on (valamint támogatja  WSL2-t).

  - title: Hetzner K3s
    url: https://github.com/janosmiko/hetzner-k3s
    dates: 2022
    logo: /images/hetzner-k3s.png
    writeup: |
      - Ezzel a CLI programmal percek alatt készíthetünk K3s alapú kubernetes clustereket a Hetzner Cloud felhőjében.
      - Képes nagy rendelkezésre állású (HA) cluster telepítésére több master node létrehozásával.
      - Támogatja statikus és automatikusan skálázódó node poolok létrehozását.
      - Automatikusan telepítí a Hetznerhez szükséges kubernetes "addonokat" (CCM, CSI, cluster-autoscaler, stb.).
---

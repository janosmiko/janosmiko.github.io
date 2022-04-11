---
title: Projektek
draft: false
projects:
  - title: Reward
    url: https://github.com/rewardenv/reward
    dates: 2021-2022
    logo: https://github.com/rewardenv/reward/raw/main/docs/imgs/reward-logo.png
    writeup: |
      - A Reward egy parancssori eszköz, amely Docker alapú fejlesztői környezetek futtatását könnyíti meg.
      - Segítségével lehetővé válik több fejlesztői környezet egyidejű, párhuzamos futtatása port ütközés nélkül. 
      - A Reward Go nyelven íródott és fut Linuxon, macOS-en és Windows-on (valamint támogatja  WSL2-t).

  - title: Gitea LDAP Sync
    url: https://github.com/janosmiko/gitea-ldap-sync
    dates: 2022
    logo: /images/gitea-ldap-sync.png
    writeup: |
      - A Gitea-ben lévő LDAP szinkronizáció nagyon limitált, ezért elkészítettem egy külső eszközt, amely képes szinkronizálni a felhasználókon túl a csoportokat (Organizations, Teams) és a köztük fennálló kapcsolatokat is.
      - Olyan haladó beállításokkal, mint attribútumok társítása (attribute mapping), kivételek kezelése (listából vagy reguláris kifejezések alapján), teljes (entitások felvétele és törlése) vagy részleges (csak entitások felvétele) szinkron, stb.
      - Docker és Kubernetes támogatással.


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

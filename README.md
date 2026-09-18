# 16:59 — Útěk z kanclu

Komediální 3D third-person stealth hra zasazená do kanceláře. Cíl: dostat se z práce dřív, než tě někdo zastaví větou „Máš minutku?“.

## Co hra obsahuje

- 10 plnohodnotných levelů s postupně rostoucí obtížností
- third-person 3D pohyb a kameru
- stealth AI s kužely vidění, line-of-sight, kolizemi, A* obcházením překážek a stavy patrol / suspicious / investigate / alert
- krytí za nábytkem a stěnami
- checkpointy a časovou penalizaci za chycení
- social stealth: předstírání práce, desky, headset, badge
- kancelářské diverze: kávovar, mikrovlnka, kopírka, telefon, občerstvení, projektor, meeting, výtah, zaseknutá tiskárna
- obědový závod s rivalem
- výsledky, hvězdy, Ghost průchod a best time
- ukládání postupu do `localStorage`
- desktop i mobilní ovládání
- syntetické WebAudio zvuky bez externích audio souborů
- automatický GitHub Pages deploy přes GitHub Actions

## Ovládání

- `WASD` / šipky — pohyb
- myš / touch drag — kamera
- `Shift` — sprint
- `C` nebo `Ctrl` — stealth chůze
- `E` — interakce
- `Q` — rychlá aktivace nejbližší použitelné diverze
- `Tab` — tactical view
- `Esc` — pauza

Na mobilu se automaticky zobrazí virtuální joystick a akční tlačítka.

## Lokální spuštění

Vyžaduje Node.js 22.12 nebo novější.

```bash
npm install
npm run dev
```

Před spuštěním nebo nahráním můžeš pustit kompletní automatickou kontrolu:

```bash
npm test
```

Produkční build:

```bash
npm run build
npm run preview
```

## GitHub Pages

1. Nahraj celý obsah tohoto repozitáře na GitHub.
2. Otevři **Settings → Pages**.
3. V části **Build and deployment** nastav **Source: GitHub Actions**.
4. Push na `main` nebo `master` spustí workflow `.github/workflows/pages.yml`.
5. Po dokončení workflow bude hra dostupná na GitHub Pages URL repozitáře.

`vite.config.js` používá `base: './'`, takže build funguje i pod adresou typu `https://uzivatel.github.io/nazev-repa/`.

## Poznámka k assetům

Hra je záměrně postavená z procedurální geometrie Three.js. Nepotřebuje externí 3D modely, textury, zvuky ani CDN, takže po `npm install` je build samostatný a vhodný pro GitHub Pages.


## Automatické testy

`npm test` před deployem kontroluje:

- geometrii a průchodnost všech 10 levelů,
- dosažitelnost povinných interakcí a cílů,
- dveře, turnikety, badge a dynamické odstranění blokátorů,
- NPC patrol pointy a jejich trasy,
- shodu HTML prvků se selektory používanými v JavaScriptu,
- runtime start a dokončení všech 10 misí,
- A* pathfinding po otevření potřebných průchodů,
- zamčené levely, chycení hráče, obědové selhání a časový limit,
- syntaxi hlavních JavaScriptových souborů.

Stejný test se automaticky spustí v GitHub Actions ještě před produkčním buildem a deployem. Podrobný záznam kontroly je v `TEST_REPORT.md`.

# Test report — 16:59: Útěk z kanclu

Datum revize: 18. 9. 2026

## Rozsah kontroly

Projekt byl po první verzi znovu prověřen jako herní logika, ne jen jako syntakticky platný web. Kontrola pokrývá všech 10 levelů, dynamické překážky, interakce, postup kampaně, NPC navigaci a GitHub Pages konfiguraci.

## Opravené chyby

1. **Level 3 — Kafe zachraňuje životy:** povinný kávovar/mikrovlnka byly původně uvnitř uzavřené kuchyňky bez skutečně průchozích dveří. Přidán samostatný dveřní blokátor a interakce, která otevírá právě tento průchod.
2. **Level 4 — 1000 kopií:** povinná kopírka byla uvnitř uzavřené copy room. Přidány funkční dveře a přesné odstranění jejich kolize.
3. **Level 7 — IT incident:** průchod do servisní části se dříve spoléhal na odstranění „nejbližší stěny“, takže mohl zmizet jiný segment. Dveře nyní odkazují na konkrétní ID překážky.
4. **Dveře obecně:** interakce už nemaže náhodnou celou stěnu podle vzdálenosti; primárně otevírá konkrétní dveřní segment.
5. **Turnikety:** badge se musí nejen sebrat, ale i skutečně použít. Level 6 a 10 vyžadují interakci `badge-door` a odstraňují konkrétní turniket.
6. **Povinné interakce:** neúspěšný pokus o použití prvku s chybějícím předmětem se už nezapočítá jako splněná mechanika.
7. **Diverze:** požadavek na více diverzí se vyhodnocuje podle různých typů, takže opakované mačkání jednoho prvku nesplní více různých diverzí.
8. **NPC kolize:** NPC dříve mohly při patrolování procházet stěnami. Dostaly vlastní A* navigaci nad aktivními překážkami a při změně dveří/turniketů se trasa přepočítá.
9. **NPC patrol pointy:** několik bodů leželo v recepci, kuchyňce nebo kolizní geometrii. Body a trasy byly upraveny.
10. **Výsledková obrazovka:** dokončenou misi už nelze omylem znovu „resume“ a vrátit se do zamrzlého stavu.
11. **Paměť:** při restartu levelu se správně uvolňují geometrie, materiály a textury předchozího levelu.
12. **Mobilní sprint a kamera:** doplněn `pointercancel` a globální ukončení sprintu, aby tlačítko po ztrátě pointeru nezůstalo viset.
13. **localStorage/WebAudio:** přidány ochrany pro prostředí, kde je úložiště nebo AudioContext omezený.
14. **Fail UI:** společná fail obrazovka už není označená pouze jako obědová katastrofa, protože ji používá i časový limit finální mise.
15. **Build dependency:** Vite byl aktualizován na 8.3.0; projekt deklaruje Node.js 22.12+.
16. **Klávesnice a restart:** jednorázové klávesy ignorují browser key-repeat; při startu levelu a při ztrátě focusu se resetují dočasné vstupy, takže nezůstane viset sprint, joystick ani stará interakce.
17. **Procedurální geometrie:** opraven překlep v segmentaci koulí pro rostliny (`SphereGeometry`), aby se nepředával neplatný desetinný počet segmentů.

## Automatické testy

### `tests/validate-levels.mjs`

Pro každý level kontroluje mimo jiné:

- validní start a exit,
- start/exit mimo kolizní geometrii,
- unikátní ID dynamických překážek,
- platné odkazy `opens`,
- existenci všech povinných interakcí,
- dosažitelnost interakcí při postupném otevírání dveří,
- dosažitelnost checkpointů a exitu,
- dosažitelnost patrol pointů NPC,
- splnitelnost `required`, `requiredAny` a `minDiversions`.

### `tests/source-sanity.mjs`

Kontroluje:

- že JavaScript neodkazuje na neexistující HTML ID,
- správný module entrypoint,
- relativní Vite base pro GitHub Pages,
- přítomnost testovacího kroku v GitHub Actions,
- očekávané závislosti,
- zbytky TODO/FIXME/PLACEHOLDER značek.

### `tests/runtime-smoke.mjs`

Inicializuje skutečný `main.js` proti testovacím DOM/Three stubům a kontroluje:

- boot a hlavní menu,
- zákaz spuštění zamčeného levelu,
- start a dokončení všech 10 levelů,
- pickupy, dveře, badge gates a diverze,
- herní A* pathfinding po odstranění potřebných blokátorů,
- povinné cíle a result overlay,
- catch/penalty logiku,
- obědové selhání,
- selhání časového limitu,
- nemožnost obnovit již dokončenou misi.

## GitHub Actions

Workflow před každým deployem provede:

1. `npm install --no-audit --no-fund`
2. `npm run test`
3. `npm run build`
4. upload výsledného `dist/`
5. deploy na GitHub Pages

Pokud test nebo build selže, deploy se nespustí.

## Omezení lokální revize

V tomto pracovním sandboxu není povolen síťový `npm install`, takže zde nebylo možné fyzicky stáhnout npm balíčky a pustit produkční Vite build. Chromium je současně administrativně blokovaný pro lokální/file URL, takže nebylo možné udělat skutečný WebGL headless průchod. Proto jsou tyto dvě kontroly záměrně přesunuty do GitHub Actions a runtime logika je zde navíc pokryta stubovým smoke testem.

Vite 8.3.0 a požadavek Node.js 22.12+ odpovídají aktuální dokumentaci Vite k datu revize.

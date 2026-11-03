# Mišić i sir / Mouse & Cheese

🇭🇷 Web igrica kodiranja za djecu vrtićke dobi. Pomozi mišiću da dođe do sira:
složi plan od strelica (↑ naprijed, ↓ natrag, ← okret ulijevo, → okret udesno), pa
pritisni Kreni! Strelice su iz mišićeve perspektive, baš kao kod pravih robotića
za najmlađe. Radi na mobitelu, tabletu i računalu, bez instalacije.

🇬🇧 A coding game for kindergarten kids. Help the mouse reach the cheese: build a
plan from arrows (↑ forward, ↓ back, ← turn left, → turn right), then press Go!
The arrows are from the mouse's point of view, just like with real floor robots
for young children. Works on phones, tablets and desktops, nothing to install.

## Značajke / Features

- 14 ugrađenih razina u 4 težine (Početnik, Lako, Srednje, Teško) / 14 built-in levels in 4 difficulties
- Način **Plan** (složi pa provjeri) i **Slobodno** (svaka strelica odmah pomiče mišića)
  / **Plan** mode and **Free play** mode
- Uređivač razina i dijeljenje linkom / Level editor and share-by-link
- Hrvatski (zadano) i engleski / Croatian (default) and English
- Radi i bez interneta (PWA) / Works offline (PWA)

## Pokretanje lokalno / Run locally

Bilo koji statički poslužitelj, npr. / Any static server, e.g.:

```bash
npx serve .
```

Testovi razina / Level tests:

```bash
node --test
```

## Struktura / Structure

- `index.html`, `css/style.css` – ljuska i stilovi / shell and styles
- `js/engine.js` – logika igre (čista, testirana) / game logic (pure, tested)
- `js/levels.js` – 14 ugrađenih razina / the 14 built-in levels
- `js/i18n.js` – prijevodi HR/EN / translations
- `js/audio.js` – zvukovi (Web Audio) / sounds
- `js/app.js` – sučelje / UI
- `sw.js`, `manifest.webmanifest`, `icons/` – PWA

Napravljeno s ljubavlju za Karmen. / Made with love for Karmen.

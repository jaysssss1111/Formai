# formai — verkkosivusto

formai on AI-natiivi design-studio. Tämä repositorio sisältää studion verkkosivuston, joka on rakennettu toimitetusta lähdepaketista (`formai-lahdetiedostot.zip`) samoilla kielillä kuin alkuperäinen: **HTML, CSS ja JavaScript**. Sivusto on staattinen, eikä se tarvitse build-vaihetta tai riippuvuuksia.

## Rakenne

```
index.html              Sivun rakenne (hero, menetelmä, palvelut, auditointi, asiakkaat, ajanvaraus, yhteydenotto)
assets/css/styles.css   Tyylit, teemat (tumma/vaalea) ja animaatiot
assets/js/i18n.js       Kaikki tekstit englanniksi ja suomeksi
assets/js/main.js       Toiminnallisuus: latausanimaatio, teema, kieli, mobiilivalikko,
                        evästesuostumus, tietosuoja- ja evästeseloste, yhteydenottolomake, ajanvarauskalenteri
assets/fonts/           DM Sans ja DM Mono (omalla palvelimella, ei Google Fontsia)
assets/logos/           Sanamerkki ja silmämerkki (cream/charcoal)
brand/                  Alkuperäinen brändiohje (BRAND.md), design-tokenit (tokens.json) ja lähdekomponentti (Main.dc.html)
```

## Paikallinen esikatselu

```bash
python3 -m http.server 8000
# avaa http://localhost:8000
```

(Fontit eivät lataudu, jos `index.html` avataan suoraan `file://`-osoitteesta, joten käytä paikallista palvelinta.)

## Julkaisu

`.github/workflows/pages.yml` julkaisee sivuston GitHub Pagesiin aina, kun `main`-haaraan pusketaan. Ota käyttöön kerran: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Täydennettävää ennen julkaisua

- **Lomakkeiden lähetys:** yhteydenotto- ja ajanvarauslomake vahvistavat lähetyksen käyttäjälle, mutta eivät vielä lähetä tietoja minnekään. Kytke ne palveluun kohdissa `// TODO` tiedostossa `assets/js/main.js` (esim. Formspree, Netlify Forms, Cal.com tai Cloudflare Worker).
- **Oikeudelliset tiedot:** tietosuojaselosteessa ja evästekäytännössä on paikkamerkkejä, kuten `[COMPANY NAME]`, `[YOUR EMAIL]` ja `[DATE]` (tiedosto `assets/js/i18n.js`).

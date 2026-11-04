# formai — verkkosivusto

formai on AI-natiivi design-studio. Tämä repositorio sisältää studion verkkosivuston, joka on rakennettu toimitetusta lähdepaketista (`formai-lahdetiedostot.zip`) samoilla kielillä kuin alkuperäinen: **HTML, CSS ja JavaScript**. Sivusto on staattinen, eikä se tarvitse build-vaihetta tai riippuvuuksia.

## Rakenne

```
index.html              Sivun rakenne (hero, menetelmä, palvelut, auditointi, asiakkaat, ajanvaraus, yhteydenotto)
assets/css/styles.css   Tyylit, teemat (tumma/vaalea) ja animaatiot
assets/js/config.js     Lomakkeiden Formspree-osoitteet
assets/js/i18n.js       Kaikki tekstit englanniksi ja suomeksi
assets/js/main.js       Toiminnallisuus: latausanimaatio, teema, kieli, mobiilivalikko,
                        evästesuostumus, tietosuoja- ja evästeseloste, yhteydenottolomake, ajanvarauskalenteri
assets/js/film.js       Method-osion animaatio (audit → sprint → ship), tekstit i18n.js:ssä kohdassa `film`
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

Julkaisuajo kirjoittaa sivun tekstit valmiiksi HTML:ään skriptillä `tools/prerender.mjs`. Hakukoneet saavat näin englanninkielisen sivun osoitteesta `/` ja suomenkielisen osoitteesta `/fi/`. Mukana ovat myös hreflang-linkit, FAQ:n strukturoitu data ja `sitemap.xml`. Paikallinen esikatselu toimii kuten ennenkin; tekstit tulevat silloin JavaScriptillä.

`.github/workflows/pages.yml` julkaisee sivuston GitHub Pagesiin aina, kun `main`-haaraan pusketaan. Ota käyttöön kerran: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Täydennettävää ennen julkaisua

- **Lomakkeiden lähetys:** yhteydenotto- ja ajanvarauslomake lähettävät tiedot Formspreehen (https://formspree.io). Liitä lomakkeen osoite (`https://formspree.io/f/…`) tiedostoon `assets/js/config.js`. Kun osoite puuttuu, lomake näyttää vahvistuksen mutta ei lähetä mitään. Ajanvaraus tulee sähköpostiin varauspyyntönä, joka vahvistetaan käsin.
- **Varatut ajat kaikille kävijöille:** varattu aika sumennetaan ja lukitaan Supabasen avulla (ilmainen tietokanta). Aja `docs/supabase-booked-slots.sql` Supabasen SQL Editorissa ja lisää projektin URL ja publishable key tiedostoon `assets/js/config.js`. Supabaseen tallentuu vain päivä ja kellonaika, ei nimiä eikä sähköposteja. Peruttu aika vapautetaan poistamalla sen rivi taulusta `booked_slots`.
- **Oikeudelliset tiedot:** tietosuojaselosteessa ja evästekäytännössä on paikkamerkkejä, kuten `[COMPANY NAME]`, `[YOUR EMAIL]` ja `[DATE]` (tiedosto `assets/js/i18n.js`).

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

## Työkalut-nauha

"Keitä olemme" -osion nauha näyttää työkalut, joilla rakennamme. Anthropicin, Claude Coden, GitHubin ja Vercelin merkit ovat Simple Icons -kirjastosta (CC0). Merkit ovat omistajiensa tavaramerkkejä, ja niitä käytetään vain kertomaan, mitä työkaluja käytämme. OpenAI:lle, Codexille ja Antigravitylle ei ole saatavilla vapaata merkkiä, joten niistä näytetään vain nimi. Nauhaa muokataan tiedostossa `index.html` (luokka `fm-tools`).

## Tekoälyuutiset

Uutiskaruselli täyttyy tiedostosta `assets/data/news.json`.

- **Automaattisesti:** `.github/workflows/news.yml` hakee joka maanantai artikkeleita alan uutissyötteistä (lista tiedostossa `tools/fetch-news.mjs`). Se valitsee aiheisiin (suunnittelu, koodi, agentit ja automaatio, sääntely, haku) osuvat artikkelit, lisää enintään kolme uutta ja julkaisee sivun. Ajon voi käynnistää myös käsin: Actions → Update news feed → Run workflow.
- **Käsin:** lisää tiedostoon rivi `{ "title": "…", "url": "https://…", "source": "Julkaisija", "date": "2026-11-04", "summary": "Lyhyt kuvaus omin sanoin.", "topic": "design", "manual": true }`. Merkinnällä `"manual": true` artikkeli pysyy listan alussa, eikä automaattinen haku poista sitä. Aiheet: `design`, `code`, `agents`, `regulation`, `search`.
- Kansikuvat piirretään brändin tyyliin aiheen mukaan, joten kolmansien osapuolten kuvia ei käytetä.

## Täydennettävää ennen julkaisua

- **Lomakkeiden lähetys:** yhteydenotto- ja ajanvarauslomake lähettävät tiedot Formspreehen (https://formspree.io). Liitä lomakkeen osoite (`https://formspree.io/f/…`) tiedostoon `assets/js/config.js`. Kun osoite puuttuu, lomake näyttää vahvistuksen mutta ei lähetä mitään. Ajanvaraus tulee sähköpostiin varauspyyntönä, joka vahvistetaan käsin.
- **Varatut ajat kaikille kävijöille:** varattu aika sumennetaan ja lukitaan Supabasen avulla (ilmainen tietokanta). Aja `docs/supabase-booked-slots.sql` Supabasen SQL Editorissa ja lisää projektin URL ja publishable key tiedostoon `assets/js/config.js`. Supabaseen tallentuu vain päivä ja kellonaika, ei nimiä eikä sähköposteja. Peruttu aika vapautetaan poistamalla sen rivi taulusta `booked_slots`.
- **Oikeudelliset tiedot:** tietosuojaselosteessa ja evästekäytännössä on paikkamerkkejä, kuten `[COMPANY NAME]`, `[YOUR EMAIL]` ja `[DATE]` (tiedosto `assets/js/i18n.js`).

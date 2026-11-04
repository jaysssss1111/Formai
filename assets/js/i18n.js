/* formai — copy in English and Finnish. Edit text here. */
(function () {
const T = {
  en: {
    langLabel: 'Language', loading: 'Loading', home: 'formai, home', navLabel: 'Main', menu: 'Menu', skip: 'Skip to content', pause: 'Pause animations', play: 'Play animations',navServices: 'Services', navMethod: 'Method', navAudit: 'Audit', cta: 'Book an audit', cta2: 'See what we make',
    eyebrow: 'AI-native studio', h1: 'built', h2: 'at', h3: 'machine', h4: 'pace.',
    heroP: 'Brand, product, software and automation for startups, studios and legacy brands. AI runs through every step of how we work, so you get in days what agencies quote in weeks.',
    methodLabel: 'Method', methodTitle: 'ai in every step',
    m1: 'audit', m1p: 'We study your product, brand and workflows, then send the three changes that matter most. Before any contract.',
    m2: 'sprint', m2p: 'People and AI agents work in the same loop. Designs, code and automations arrive as working files, not decks.',
    m3: 'ship', m3p: 'You get a working whole: a brand, a product and the automations your team and tools can build on.',
    servicesLabel: 'Services', servicesTitle: 'from brand to automation',
    s1Label: 'Brand', s1: 'identity', s1p: 'Logo, type, color and a living design system, delivered as files that people and AI agents can build on.',
    s2Label: 'Web and product', s2: 'interfaces', s2p: 'Landing pages, app screens and UI systems, designed and handed over as clickable prototypes ready to build.',
    s3Label: 'Motion', s3: 'film', s3p: 'Launch films, social cuts and product explainers that carry the identity from the first frame.',
    s4Label: 'Software', s4: 'development', s4p: 'Web apps, internal tools and integrations, built on the same design system, so what we design is what ships.',
    s5Label: 'Automation', s5: 'automation', s5p: 'AI agents and automated workflows that take repetitive work off your team and connect to the tools you already use.',
    s6Label: 'AI products', s6: 'intelligence', s6p: 'Assistants, smart search and AI features your customers use, designed and built into your product, tested before they ship.',
    tags6: ['AI assistants', 'Smart search', 'Recommendations', 'Conversational UI', 'LLM integration', 'Evaluation'],
    artAi: 'AI / ASSIST', artQuery: 'how do I return an order?', artAnswer: 'ANSWERED / 3 SOURCES',
    tags1: ['Logo', 'Visual identity', 'Brand guidelines', 'Design system', 'Packaging', 'Print and signage'],
    tags2: ['Websites', 'Landing pages', 'Web shops', 'App UI', 'UX research', 'Prototypes'],
    tags3: ['Brand films', 'Product videos', 'Social content', 'Ads', 'Motion graphics', 'Editing'],
    tags4: ['Web apps', 'Mobile apps', 'Internal tools', 'Integrations', 'APIs', 'Maintenance'],
    tags5: ['AI agents', 'Chatbots', 'Workflow automation', 'Document processing', 'Reporting', 'AI training'],
    artBuild: 'BUILD PASSED', artN1: 'TRIGGER', artN2: 'AGENT', artN3: 'CHECK', artN4: 'ACTION', artFlow: 'FLOW / 24/7',
    tagSystem: 'System', tagWeb: 'Web', tagSocial: 'Social', artMark: 'MARK / CONSTRUCTION', artScreen: 'SCREEN / 01',
    auditLabel: 'The unsolicited audit', auditTitle: 'we find the problem before you ask',
    auditP: 'We pick one screen or one workflow of your business, find what costs you users or hours, and send the fix. No pitch deck, no call. If it helps, we talk.',
    auditCta: 'Request your audit',
    segLabel: 'Who we work with', segTitle: 'three kinds of team',
    g1: 'startups', g1p: 'Launch with a brand and a product that look funded before they are.',
    g2: 'studios', g2p: 'Add design, development and AI capacity for a project or a season, without adding headcount.',
    g3: 'legacy brands', g3p: 'Modernize the identity, the interfaces and the processes behind them, without losing what people already trust.',
    contactTitle: 'send us the screen or task that slows you down', email: '[YOUR EMAIL]',
    film: {
      label: 'Method / film', play: 'Play film', pause: 'Pause film', replay: 'Replay film', script: 'Read the script',
      ann: ['CTA BELOW THE FOLD', 'NINE FORM FIELDS', '4.2 S TO LOAD'], fold: 'FOLD',
      cardLabel: 'AUDIT / 3 CHANGES', cardText: 'before any contract',
      day: 'DAY', people: 'PEOPLE', agents: 'AI AGENTS',
      agency: 'agency quote · 6 weeks', us: 'formai · 5 days',
      files: ['brand.svg', 'app.ts', 'flow.yml'],
      fix: ['CTA ABOVE THE FOLD', 'THREE FIELDS', '0.9 S TO LOAD'], live: 'LIVE',
      deliver: ['BRAND', 'PRODUCT', 'AUTOMATIONS'],
      endTitle: 'your turn',
      lines: [
        [0.3, 'It starts with one screen of yours.'],
        [2.2, 'We look at it the way your users do.'],
        [4.6, 'And name the three changes that matter most.'],
        [6.4, 'You get the audit before any contract.'],
        [9.2, 'Say go, and the sprint begins.'],
        [11.0, 'People and AI agents work in the same loop.'],
        [13.4, 'Designs, code and automations arrive as working files.'],
        [15.6, 'Agencies quote weeks. You get it in days.'],
        [18.2, 'Then it ships.'],
        [19.8, 'Every fix from the audit, live in your product.'],
        [22.6, 'A brand, a product and the automations behind it, working as one.'],
        [24.8, 'Your turn. Send us the screen that slows you down.']
      ]
    },
    ticker: ['ai-native', 'brand identity', 'design systems', 'web', 'ui / ux', 'software', 'automation', 'ai agents', 'motion', 'delivered in days']
  },
  fi: {
    langLabel: 'Kieli', loading: 'Ladataan', home: 'formai, etusivu', navLabel: 'Päävalikko', menu: 'Valikko', skip: 'Siirry sisältöön', pause: 'Pysäytä animaatiot', play: 'Käynnistä animaatiot',navServices: 'Palvelut', navMethod: 'Menetelmä', navAudit: 'Auditointi', cta: 'Varaa auditointi', cta2: 'Katso mitä teemme',
    eyebrow: 'AI-natiivi studio', h1: 'ideasta', h2: 'tuotteeksi', h3: 'koneen', h4: 'tahdissa.',
    heroP: 'Brändi, tuotteet, ohjelmistot ja automaatio startupeille, studioille ja perinteisille brändeille. Tekoäly kulkee mukana jokaisessa työvaiheessa, joten saat päivissä sen, mihin toimistot arvioivat viikkoja.',
    methodLabel: 'Menetelmä', methodTitle: 'tekoäly joka vaiheessa',
    m1: 'auditointi', m1p: 'Tutkimme tuotteesi, brändisi ja työnkulkusi ja lähetämme kolme tärkeintä muutosta. Jo ennen sopimusta.',
    m2: 'sprintti', m2p: 'Ihmiset ja tekoälyagentit työskentelevät samassa silmukassa. Suunnitelmat, koodi ja automaatiot tulevat toimivina tiedostoina, eivät esityksinä.',
    m3: 'julkaisu', m3p: 'Saat toimivan kokonaisuuden: brändin, tuotteen ja automaatiot, joiden päälle tiimisi ja työkalusi voivat rakentaa.',
    servicesLabel: 'Palvelut', servicesTitle: 'brändistä automaatioon',
    s1Label: 'Brändi', s1: 'identiteetti', s1p: 'Logo, typografia, värit ja elävä design-järjestelmä tiedostoina, joiden päälle ihmiset ja tekoälyagentit voivat rakentaa.',
    s2Label: 'Verkko ja tuote', s2: 'käyttöliittymät', s2p: 'Laskeutumissivut, sovellusnäkymät ja UI-järjestelmät, suunniteltuina ja luovutettuina klikattavina prototyyppeinä.',
    s3Label: 'Liike', s3: 'video', s3p: 'Lanseerausvideot, somemateriaalit ja tuote-esittelyt, joissa identiteetti näkyy ensimmäisestä ruudusta lähtien.',
    s4Label: 'Ohjelmisto', s4: 'ohjelmistokehitys', s4p: 'Verkkosovellukset, sisäiset työkalut ja integraatiot samalle design-järjestelmälle rakennettuina, joten se mikä suunnitellaan, myös julkaistaan.',
    s5Label: 'Automaatio', s5: 'automaatio', s5p: 'Tekoälyagentit ja automatisoidut työnkulut, jotka vievät toistuvan työn tiimiltäsi ja toimivat jo käyttämiesi työkalujen kanssa.',
    s6Label: 'Tekoälytuotteet', s6: 'älykkyys', s6p: 'Avustajat, älykäs haku ja tekoälyominaisuudet, joita asiakkaasi käyttävät, suunniteltuina ja rakennettuina tuotteeseesi ja testattuina ennen julkaisua.',
    tags6: ['Tekoälyavustajat', 'Älykäs haku', 'Suositukset', 'Keskustelukäyttöliittymät', 'LLM-integraatiot', 'Laadun arviointi'],
    artAi: 'TEKOÄLY / AVUSTAJA', artQuery: 'miten palautan tilauksen?', artAnswer: 'VASTATTU / 3 LÄHDETTÄ',
    tags1: ['Logo', 'Visuaalinen identiteetti', 'Brändiohjeisto', 'Design-järjestelmä', 'Pakkaukset', 'Painotuotteet'],
    tags2: ['Verkkosivut', 'Laskeutumissivut', 'Verkkokaupat', 'Sovellusten UI', 'UX-tutkimus', 'Prototyypit'],
    tags3: ['Brändivideot', 'Tuotevideot', 'Somesisällöt', 'Mainokset', 'Liikegrafiikka', 'Editointi'],
    tags4: ['Verkkosovellukset', 'Mobiilisovellukset', 'Sisäiset työkalut', 'Integraatiot', 'Rajapinnat', 'Ylläpito'],
    tags5: ['Tekoälyagentit', 'Chatbotit', 'Työnkulkujen automaatio', 'Dokumenttien käsittely', 'Raportointi', 'Tekoälykoulutus'],
    artBuild: 'KÄÄNNÖS ONNISTUI', artN1: 'LAUKAISU', artN2: 'AGENTTI', artN3: 'TARKISTUS', artN4: 'TOIMINTO', artFlow: 'TYÖNKULKU / 24/7',
    tagSystem: 'Järjestelmä', tagWeb: 'Verkko', tagSocial: 'Some', artMark: 'MERKKI / RAKENNE', artScreen: 'NÄKYMÄ / 01',
    auditLabel: 'Pyytämätön auditointi', auditTitle: 'löydämme ongelman ennen kuin kysyt',
    auditP: 'Valitsemme yrityksestäsi yhden näkymän tai työnkulun, etsimme sen, mikä maksaa sinulle käyttäjiä tai työtunteja, ja lähetämme korjauksen. Ei myyntiesitystä, ei puhelua. Jos siitä on apua, jutellaan.',
    auditCta: 'Pyydä auditointi',
    segLabel: 'Kenen kanssa teemme töitä', segTitle: 'kolmenlaisia tiimejä',
    g1: 'startupit', g1p: 'Lanseeraa brändillä ja tuotteella, jotka näyttävät rahoitetuilta jo ennen kuin ovat.',
    g2: 'studiot', g2p: 'Lisää suunnittelu-, kehitys- ja tekoälykapasiteettia projektiin tai sesonkiin ilman uusia rekrytointeja.',
    g3: 'perinteiset brändit', g3p: 'Uudista identiteetti, käyttöliittymät ja niiden taustalla olevat prosessit menettämättä sitä, mihin ihmiset jo luottavat.',
    contactTitle: 'lähetä meille näkymä tai tehtävä, joka hidastaa teitä', email: '[SÄHKÖPOSTIOSOITTEESI]',
    film: {
      label: 'Menetelmä / video', play: 'Toista video', pause: 'Pysäytä video', replay: 'Toista video uudelleen', script: 'Lue käsikirjoitus',
      ann: ['CTA TAITTEEN ALLA', 'YHDEKSÄN KENTTÄÄ', 'LATAUS 4,2 S'], fold: 'TAITE',
      cardLabel: 'AUDITOINTI / 3 MUUTOSTA', cardText: 'ennen sopimusta',
      day: 'PÄIVÄ', people: 'IHMISET', agents: 'TEKOÄLYAGENTIT',
      agency: 'toimiston arvio · 6 viikkoa', us: 'formai · 5 päivää',
      files: ['brand.svg', 'app.ts', 'flow.yml'],
      fix: ['CTA TAITTEEN YLLÄ', 'KOLME KENTTÄÄ', 'LATAUS 0,9 S'], live: 'KÄYTÖSSÄ',
      deliver: ['BRÄNDI', 'TUOTE', 'AUTOMAATIOT'],
      endTitle: 'sinun vuorosi',
      lines: [
        [0.3, 'Kaikki alkaa yhdestä näkymästäsi.'],
        [2.2, 'Katsomme sitä niin kuin käyttäjäsi.'],
        [4.6, 'Ja nimeämme kolme tärkeintä muutosta.'],
        [6.4, 'Saat auditoinnin jo ennen sopimusta.'],
        [9.2, 'Kun sanot kyllä, sprintti alkaa.'],
        [11.0, 'Ihmiset ja tekoälyagentit työskentelevät samassa silmukassa.'],
        [13.4, 'Suunnitelmat, koodi ja automaatiot tulevat toimivina tiedostoina.'],
        [15.6, 'Toimistot arvioivat viikkoja. Sinä saat sen päivissä.'],
        [18.2, 'Sitten se julkaistaan.'],
        [19.8, 'Jokainen auditoinnin korjaus käytössä tuotteessasi.'],
        [22.6, 'Brändi, tuote ja niiden taustalla toimivat automaatiot yhtenä kokonaisuutena.'],
        [24.8, 'Sinun vuorosi. Lähetä meille näkymä, joka hidastaa teitä.']
      ]
    },
    ticker: ['ai-natiivi', 'brändi-identiteetti', 'design-järjestelmät', 'verkko', 'ui / ux', 'ohjelmistot', 'automaatio', 'tekoälyagentit', 'liike', 'valmiina päivissä']
  }
};
const LEGAL = {
  en: {
    legalNav: 'Legal',
    navBook: 'Book a time',
    bk: {
      label: 'Book a time', title: 'book a 30-minute consultation',
      intro: 'Pick a day and a time that suits you. Consultations last 30 minutes, Monday to Friday, 11:00–20:00 Finnish time.',
      prev: 'Previous month', next: 'Next month',
      weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      legendOpen: 'Free times', legendSel: 'Selected', tzNote: 'Finnish time', unavailable: 'no free times',
      pickDay: 'Select a day in the calendar to see its free times.',
      slotsFor: 'Free times', cont: 'Continue', back: 'Back to times', selected: 'Selected time',
      topic: 'What would you like to talk about?', confirm: 'Confirm booking',
      noneYet: 'No time selected', doneTitle: 'booked',
      doneText: 'We will confirm the booking and send the meeting details by email.', again: 'Book another time'
    },
    cf: {
      open: 'Send us a message', label: 'Contact', title: 'tell us what slows you down',
      intro: 'Send a short note about your product, brand or workflow. We read every message and reply by email.',
      name: 'Name', email: 'Email', company: 'Company', optional: 'optional',
      interest: 'What are you interested in?',
      interests: ['Brand identity', 'Web and product', 'Video', 'Software', 'Automation', 'Design audit'],
      message: 'Message', messageHint: 'A screen, a task or an idea is enough to start.',
      privacy: 'We use your details only to reply to you.',
      required: '* Required', send: 'Send message',
      errSummary: 'Check the highlighted fields.',
      errName: 'Please enter your name.',
      errEmail: 'Please enter a valid email address, like name@company.com.',
      errMessage: 'Tell us briefly what you need (at least 10 characters).',
      thanksTitle: 'thanks, message received', thanksText: 'We will get back to you by email.', done: 'Close'
    },
    rowLabels: { purpose: 'Purpose', type: 'Type', duration: 'Duration', category: 'Category' },
    ck: {
      label: 'Cookies', title: 'your choice, your data',
      intro: 'We only use what the site needs to work. Anything more, like remembering your settings or measuring visits, needs your permission. You can change your mind at any time from Cookie settings in the footer.',
      howTitle: 'How to choose',
      how: ['Accept all turns every category on.', 'Reject all keeps only the strictly necessary storage.', 'Or set the switches yourself and press Confirm choices.'],
      nec: 'Strictly necessary', necD: 'Stores your cookie choice and shows the loading animation only once per visit. The site cannot work properly without these, so they are always on.',
      pref: 'Preferences', prefD: 'Remembers your theme, language and animation choice for your next visit.',
      an: 'Analytics', anD: 'Would help us understand anonymously how visitors use the site. Not in use yet: nothing is collected even if you switch this on.',
      mk: 'Marketing', mkD: 'Would let us measure campaigns and show relevant ads elsewhere. Not in use yet: nothing is collected even if you switch this on.',
      on: 'On', off: 'Off', always: 'Always on',
      reject: 'Reject all', accept: 'Accept all', confirm: 'Confirm choices',
      more: 'Read more:', cookiePolicy: 'Cookie policy', privacy: 'Privacy notice', settings: 'Cookie settings', close: 'Close'
    },
    cookieDoc: {
      title: 'cookie policy', updated: 'Last updated: [DATE]',
      a: [
        { h: 'What cookies are', ps: ['Cookies and similar technologies, such as your browser’s local storage, are small pieces of data a website saves in your browser. We use them only as described below. Anything beyond the strictly necessary requires your consent under the EU General Data Protection Regulation and the Finnish Act on Electronic Communications Services (section 205).'] },
        { h: 'What we use', ps: ['This is everything the site stores in your browser.'] }
      ],
      rows: [
        { name: 'fm-consent', purpose: 'Stores your cookie choices and when you made them', type: 'Local storage', duration: '12 months', category: 'Strictly necessary' },
        { name: 'fm-seen', purpose: 'Shows the loading animation only once per visit', type: 'Session storage', duration: 'Until you close the tab', category: 'Strictly necessary' },
        { name: 'fm-mode', purpose: 'Remembers the light or dark theme', type: 'Local storage', duration: 'Until you clear it or withdraw consent', category: 'Preferences' },
        { name: 'fm-lang', purpose: 'Remembers your language', type: 'Local storage', duration: 'Until you clear it or withdraw consent', category: 'Preferences' },
        { name: 'fm-paused', purpose: 'Remembers whether animations are paused', type: 'Local storage', duration: 'Until you clear it or withdraw consent', category: 'Preferences' }
      ],
      b: [
        { h: 'Third parties', ps: ['Fonts are hosted on our own server, so no data is sent to third parties when the page opens.', 'We do not currently use analytics or marketing cookies. If we add them, we will update this list and ask for your consent before anything is stored.'] },
        { h: 'Changing your choices', ps: ['Open Cookie settings in the footer at any time to change or withdraw your consent. Withdrawing consent deletes the preference data immediately. You can also clear stored data in your browser settings.'] },
        { h: 'Contact', ps: ['Questions about cookies: [YOUR EMAIL].'] }
      ]
    },
    privacyDoc: {
      title: 'privacy notice', updated: 'Last updated: [DATE]',
      a: [
        { h: '1. Controller', ps: ['[COMPANY NAME], business ID [BUSINESS ID]', '[STREET ADDRESS], [POSTCODE AND CITY], Finland', 'Contact for privacy matters: [NAME], [YOUR EMAIL]'] },
        { h: '2. What data we process', ps: ['When you contact us: your name, email address, company and the content of your message.', 'When you use the site: your cookie choices and the preference data listed in the cookie policy. Our hosting provider may log technical data such as your IP address for security. [CHECK WITH YOUR HOSTING PROVIDER]', 'For design audits and business outreach: publicly available work contact details of company representatives, such as name, job title and work email.'] },
        { h: '3. Purpose and legal basis', ps: ['Answering enquiries and preparing offers: steps prior to entering a contract (GDPR Art. 6(1)(b)) and our legitimate interest (Art. 6(1)(f)).', 'Business outreach and unsolicited audits: our legitimate interest in offering our services to companies (Art. 6(1)(f)). You can object at any time and we will stop.', 'Preference and analytics storage: your consent (Art. 6(1)(a)). Strictly necessary storage: our legitimate interest in a working website.'] },
        { h: '4. How long we keep data', ps: ['Enquiries and business contact data: up to 24 months from the last contact, unless a customer relationship begins. [CHECK]', 'Cookies and local storage: as listed in the cookie policy.'] },
        { h: '5. Recipients and transfers', ps: ['We do not sell your data. Service providers process data on our behalf: [EMAIL PROVIDER], [HOSTING PROVIDER], [OTHER TOOLS]. If data is transferred outside the EU or EEA, we use the European Commission’s standard contractual clauses or another lawful transfer mechanism.'] },
        { h: '6. Your rights', ps: ['You have the right to access, correct and delete your data, to restrict or object to processing, to receive your data in a portable format, and to withdraw consent at any time. Contact us at [YOUR EMAIL].', 'If you believe we process your data unlawfully, you can lodge a complaint with the Office of the Data Protection Ombudsman (tietosuoja.fi).'] },
        { h: '7. Automated decisions', ps: ['We do not make decisions about you based solely on automated processing, including profiling.'] },
        { h: '8. Changes', ps: ['We update this notice when our processing changes. The date at the top shows the latest version.'] }
      ],
      b: []
    }
  },
  fi: {
    legalNav: 'Oikeudelliset tiedot',
    navBook: 'Varaa aika',
    bk: {
      label: 'Varaa aika', title: 'varaa 30 minuutin konsultaatio',
      intro: 'Valitse sinulle sopiva päivä ja aika. Konsultaatio kestää 30 minuuttia, ja aikoja on maanantaista perjantaihin klo 11.00–20.00 Suomen aikaa.',
      prev: 'Edellinen kuukausi', next: 'Seuraava kuukausi',
      weekdays: ['ma', 'ti', 'ke', 'to', 'pe', 'la', 'su'],
      legendOpen: 'Vapaita aikoja', legendSel: 'Valittu', tzNote: 'Suomen aikaa', unavailable: 'ei vapaita aikoja',
      pickDay: 'Valitse kalenterista päivä, niin näet sen vapaat ajat.',
      slotsFor: 'Vapaat ajat', cont: 'Jatka', back: 'Takaisin aikoihin', selected: 'Valittu aika',
      topic: 'Mistä haluaisit puhua?', confirm: 'Vahvista varaus',
      noneYet: 'Aikaa ei ole valittu', doneTitle: 'varattu',
      doneText: 'Vahvistamme varauksen ja lähetämme tapaamisen tiedot sähköpostilla.', again: 'Varaa toinen aika'
    },
    cf: {
      open: 'Lähetä meille viesti', label: 'Yhteydenotto', title: 'kerro, mikä teitä hidastaa',
      intro: 'Lähetä lyhyt viesti tuotteestasi, brändistäsi tai työnkulustasi. Luemme jokaisen viestin ja vastaamme sähköpostilla.',
      name: 'Nimi', email: 'Sähköposti', company: 'Yritys', optional: 'vapaaehtoinen',
      interest: 'Mistä olet kiinnostunut?',
      interests: ['Brändi-identiteetti', 'Verkko ja tuote', 'Video', 'Ohjelmistot', 'Automaatio', 'Design-auditointi'],
      message: 'Viesti', messageHint: 'Yksi näkymä, tehtävä tai idea riittää alkuun.',
      privacy: 'Käytämme tietojasi vain vastataksemme sinulle.',
      required: '* Pakollinen', send: 'Lähetä viesti',
      errSummary: 'Tarkista merkityt kentät.',
      errName: 'Kirjoita nimesi.',
      errEmail: 'Kirjoita toimiva sähköpostiosoite, esim. nimi@yritys.fi.',
      errMessage: 'Kerro lyhyesti, mitä tarvitset (vähintään 10 merkkiä).',
      thanksTitle: 'kiitos, viesti vastaanotettu', thanksText: 'Palaamme asiaan sähköpostilla.', done: 'Sulje'
    },
    rowLabels: { purpose: 'Tarkoitus', type: 'Tyyppi', duration: 'Säilytysaika', category: 'Luokka' },
    ck: {
      label: 'Evästeet', title: 'sinun valintasi, sinun tietosi',
      intro: 'Käytämme vain sitä, mitä sivusto tarvitsee toimiakseen. Kaikkeen muuhun, kuten asetustesi muistamiseen tai käyntien mittaamiseen, tarvitsemme luvan. Voit muuttaa valintojasi milloin tahansa alatunnisteen Evästeasetukset-linkistä.',
      howTitle: 'Näin valitset',
      how: ['Hyväksy kaikki kytkee kaikki luokat päälle.', 'Hylkää kaikki jättää käyttöön vain välttämättömät.', 'Tai valitse itse liukukytkimillä ja paina Vahvista valinnat.'],
      nec: 'Välttämättömät', necD: 'Tallentavat evästevalintasi ja näyttävät latausanimaation vain kerran käynnin aikana. Sivusto ei toimi kunnolla ilman näitä, joten ne ovat aina päällä.',
      pref: 'Asetukset', prefD: 'Muistavat teeman, kielen ja animaatiovalintasi seuraavaa käyntiä varten.',
      an: 'Analytiikka', anD: 'Auttaisi meitä ymmärtämään nimettömästi, miten sivustoa käytetään. Ei vielä käytössä: mitään ei kerätä, vaikka kytket tämän päälle.',
      mk: 'Markkinointi', mkD: 'Mahdollistaisi kampanjoiden mittaamisen ja kohdennetut mainokset muualla. Ei vielä käytössä: mitään ei kerätä, vaikka kytket tämän päälle.',
      on: 'Päällä', off: 'Pois', always: 'Aina päällä',
      reject: 'Hylkää kaikki', accept: 'Hyväksy kaikki', confirm: 'Vahvista valinnat',
      more: 'Lue lisää:', cookiePolicy: 'Evästekäytäntö', privacy: 'Tietosuojaseloste', settings: 'Evästeasetukset', close: 'Sulje'
    },
    cookieDoc: {
      title: 'evästekäytäntö', updated: 'Päivitetty: [PÄIVÄMÄÄRÄ]',
      a: [
        { h: 'Mitä evästeet ovat', ps: ['Evästeet ja vastaavat tekniikat, kuten selaimen paikallinen tallennustila, ovat pieniä tietoja, joita verkkosivusto tallentaa selaimeesi. Käytämme niitä vain alla kuvatulla tavalla. Kaikki välttämätöntä laajempi käyttö edellyttää suostumustasi EU:n tietosuoja-asetuksen ja sähköisen viestinnän palveluista annetun lain (205 §) mukaisesti.'] },
        { h: 'Mitä käytämme', ps: ['Tässä on kaikki, mitä sivusto tallentaa selaimeesi.'] }
      ],
      rows: [
        { name: 'fm-consent', purpose: 'Tallentaa evästevalintasi ja niiden ajankohdan', type: 'Paikallinen tallennustila', duration: '12 kuukautta', category: 'Välttämätön' },
        { name: 'fm-seen', purpose: 'Näyttää latausanimaation vain kerran käynnin aikana', type: 'Istuntotallennus', duration: 'Kunnes suljet välilehden', category: 'Välttämätön' },
        { name: 'fm-mode', purpose: 'Muistaa vaalean tai tumman teeman', type: 'Paikallinen tallennustila', duration: 'Kunnes tyhjennät sen tai peruutat suostumuksen', category: 'Asetukset' },
        { name: 'fm-lang', purpose: 'Muistaa kielivalintasi', type: 'Paikallinen tallennustila', duration: 'Kunnes tyhjennät sen tai peruutat suostumuksen', category: 'Asetukset' },
        { name: 'fm-paused', purpose: 'Muistaa, onko animaatiot pysäytetty', type: 'Paikallinen tallennustila', duration: 'Kunnes tyhjennät sen tai peruutat suostumuksen', category: 'Asetukset' }
      ],
      b: [
        { h: 'Kolmannet osapuolet', ps: ['Fontit ladataan omalta palvelimeltamme, joten sivun avautuessa tietoja ei välity kolmansille osapuolille.', 'Emme tällä hetkellä käytä analytiikka- tai markkinointievästeitä. Jos otamme niitä käyttöön, päivitämme tämän luettelon ja pyydämme suostumuksesi ennen kuin mitään tallennetaan.'] },
        { h: 'Valintojen muuttaminen', ps: ['Voit muuttaa tai peruuttaa suostumuksesi milloin tahansa alatunnisteen Evästeasetukset-linkistä. Kun peruutat suostumuksen, asetustiedot poistetaan heti. Voit myös tyhjentää tallennetut tiedot selaimesi asetuksista.'] },
        { h: 'Yhteystiedot', ps: ['Evästeitä koskevat kysymykset: [SÄHKÖPOSTIOSOITTEESI].'] }
      ]
    },
    privacyDoc: {
      title: 'tietosuojaseloste', updated: 'Päivitetty: [PÄIVÄMÄÄRÄ]',
      a: [
        { h: '1. Rekisterinpitäjä', ps: ['[YRITYKSEN NIMI], Y-tunnus [Y-TUNNUS]', '[KATUOSOITE], [POSTINUMERO JA -TOIMIPAIKKA]', 'Yhteyshenkilö tietosuoja-asioissa: [NIMI], [SÄHKÖPOSTIOSOITTEESI]'] },
        { h: '2. Mitä tietoja käsittelemme', ps: ['Kun otat meihin yhteyttä: nimesi, sähköpostiosoitteesi, yrityksesi ja viestisi sisältö.', 'Kun käytät sivustoa: evästevalintasi ja evästekäytännössä luetellut asetustiedot. Palveluntarjoajamme voi tallentaa teknisiä tietoja, kuten IP-osoitteen, tietoturvan vuoksi. [TARKISTA PALVELUNTARJOAJALTASI]', 'Design-auditointeja ja yritysyhteydenottoja varten: yritysten edustajien julkisesti saatavilla olevat työyhteystiedot, kuten nimi, tehtävänimike ja työsähköposti.'] },
        { h: '3. Käsittelyn tarkoitus ja oikeusperuste', ps: ['Yhteydenottoihin vastaaminen ja tarjousten laatiminen: sopimusta edeltävät toimenpiteet (tietosuoja-asetuksen 6 artiklan 1 kohdan b alakohta) ja oikeutettu etumme (f alakohta).', 'Yritysyhteydenotot ja pyytämättömät auditoinnit: oikeutettu etumme tarjota palveluitamme yrityksille (f alakohta). Voit vastustaa käsittelyä milloin tahansa, ja lopetamme sen.', 'Asetus- ja analytiikkatiedot: suostumuksesi (a alakohta). Välttämättömät tallennukset: oikeutettu etumme toimivaan verkkosivustoon.'] },
        { h: '4. Säilytysaika', ps: ['Yhteydenotto- ja yritysyhteystiedot: enintään 24 kuukautta viimeisestä yhteydenotosta, ellei asiakassuhde ala. [TARKISTA]', 'Evästeet ja paikallinen tallennustila: evästekäytännön mukaisesti.'] },
        { h: '5. Tietojen vastaanottajat ja siirrot', ps: ['Emme myy tietojasi. Puolestamme tietoja käsittelevät palveluntarjoajat: [SÄHKÖPOSTIPALVELU], [VERKKOHOTELLI], [MUUT TYÖKALUT]. Jos tietoja siirretään EU:n tai ETA:n ulkopuolelle, käytämme Euroopan komission vakiosopimuslausekkeita tai muuta lainmukaista siirtoperustetta.'] },
        { h: '6. Oikeutesi', ps: ['Sinulla on oikeus saada pääsy tietoihisi, oikaista ja poistaa niitä, rajoittaa tai vastustaa käsittelyä, siirtää tiedot järjestelmästä toiseen sekä peruuttaa suostumuksesi milloin tahansa. Ota yhteyttä: [SÄHKÖPOSTIOSOITTEESI].', 'Jos katsot, että käsittelemme tietojasi lainvastaisesti, voit tehdä valituksen tietosuojavaltuutetun toimistolle (tietosuoja.fi).'] },
        { h: '7. Automaattinen päätöksenteko', ps: ['Emme tee sinua koskevia päätöksiä pelkästään automaattisen käsittelyn, kuten profiloinnin, perusteella.'] },
        { h: '8. Muutokset', ps: ['Päivitämme tämän selosteen, kun tietojen käsittely muuttuu. Uusimman version päivämäärä näkyy selosteen alussa.'] }
      ],
      b: []
    }
  }
};
window.FM_I18N = { T: T, LEGAL: LEGAL };
})();

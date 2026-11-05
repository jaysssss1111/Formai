/* formai — form connections.
 * Formspree delivers contact messages and booking requests to your email.
 * Both forms can use the same URL; the email subject tells them apart.
 * While a value is empty the form shows its confirmation but sends nothing.
 *
 * Supabase stores which times are booked, so a booked time is blurred and
 * unavailable for every visitor. Only the date and time are stored there,
 * never names or emails. Leave both empty to turn this off (then a booked
 * time is only blocked in the browser that booked it).
 */
window.FM_CONFIG = {
  contactEndpoint: 'https://formspree.io/f/mgaadkpg',
  bookingEndpoint: 'https://formspree.io/f/mgaadkpg',
  // auditEndpoint: '',  // optional: a separate Formspree form for audit requests (defaults to contactEndpoint)
  // Social profiles shown as icons in the footer. Paste the full profile address;
  // an icon becomes a link as soon as its address is set.
  social: {
    x: '',          // e.g. https://x.com/formai
    instagram: '',  // e.g. https://www.instagram.com/formai
    linkedin: '',   // e.g. https://www.linkedin.com/company/formai
    facebook: ''    // e.g. https://www.facebook.com/formai
  },
  // Who we are: a short note from the founder and the people in the studio.
  // Both stay hidden on the site until filled in. Photos go in assets/img/
  // (square, at least 240 x 240 px); leave photo empty to show initials.
  team: {
    note: { en: '', fi: '' },   // 3-4 sentences in your own voice, e.g. why you started formai
    noteBy: '',                 // the name under the note, e.g. 'Jay, founder'
    // Add each person's name and a photo (assets/img/…, square) when ready.
    // Until a name is set, the card shows the role as its title.
    // Hidden for now. To bring the three staff cards back, move these entries
    // back inside people: [ … ] (remove the // in front of each line).
    //   { name: '', photo: '',
    //     role: { en: 'Brand and interface design', fi: 'Brändi- ja käyttöliittymäsuunnittelu' },
    //     line: { en: 'Shapes how a company looks and how its product feels to use.', fi: 'Muotoilee, miltä yritys näyttää ja miltä sen tuote tuntuu käyttää.' },
    //     does: { en: ['Identity and design systems', 'Websites and app screens', 'Clickable prototypes'], fi: ['Identiteetti ja design-järjestelmät', 'Verkkosivut ja sovellusnäkymät', 'Klikattavat prototyypit'] } },
    //   { name: '', photo: '',
    //     role: { en: 'Development and AI', fi: 'Kehitys ja tekoäly' },
    //     line: { en: 'Builds what we design and the AI features inside it, tested before it ships.', fi: 'Rakentaa sen, minkä suunnittelemme, ja sen sisällä toimivat tekoälyominaisuudet, testattuina ennen julkaisua.' },
    //     does: { en: ['Web apps and integrations', 'AI assistants and smart search', 'Code review of agent output'], fi: ['Verkkosovellukset ja integraatiot', 'Tekoälyavustajat ja älykäs haku', 'Agenttien tuottaman koodin tarkistus'] } },
    //   { name: '', photo: '',
    //     role: { en: 'Automation and motion', fi: 'Automaatio ja liike' },
    //     line: { en: 'Takes repetitive work off your team and makes the films that launch the work.', fi: 'Vie toistuvan työn tiimiltänne ja tekee videot, joilla työ lanseerataan.' },
    //     does: { en: ['AI agents and workflows', 'Connecting the tools you use', 'Launch films and social cuts'], fi: ['Tekoälyagentit ja työnkulut', 'Käyttämienne työkalujen yhdistäminen', 'Lanseerausvideot ja someleikkeet'] } }
    people: []
  },
  // Company details shown in the footer (required on a Finnish business site).
  // PLACEHOLDERS: replace every value with the real details before launch.
  company: {
    name: 'formai Oy',
    businessId: '0000000-0',          // Y-tunnus
    street: 'Esimerkkikatu 1',
    city: '00100 Helsinki',
    email: 'hello@example.com'
  },
  supabaseUrl: 'https://lbffcataydbzwyyypiip.supabase.co',
  supabaseKey: 'sb_publishable_K04nYpPk4CcktUmZktxd0A_pw_bAEnM' // publishable key, safe to publish
};

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
    people: [
      // { name: 'First Last', role: { en: 'Brand and interface design', fi: '…' }, line: { en: 'One line on what they do.', fi: '…' }, photo: 'assets/img/first.jpg' }
    ]
  },
  // A sample team, shown only when the address ends in ?team-preview, to see the
  // layout before the real details are in. Visitors never see it.
  teamPreview: {
    note: { en: 'We started formai because good design and working software should not take an agency three months. With AI agents doing the drafting and testing, a small team can stay close to every decision and still ship in days. You always talk to the people doing the work.',
            fi: 'Perustimme formain, koska hyvän suunnittelun ja toimivan ohjelmiston ei pitäisi viedä toimistolta kolmea kuukautta. Kun tekoälyagentit luonnostelevat ja testaavat, pieni tiimi pysyy lähellä jokaista päätöstä ja julkaisee silti päivissä. Puhut aina niiden ihmisten kanssa, jotka työn tekevät.' },
    noteBy: 'Aino K., founder',
    people: [
      { name: 'Aino K.', role: { en: 'Founder · Brand and interfaces', fi: 'Perustaja · Brändi ja käyttöliittymät' }, line: { en: 'Turns a fuzzy brief into a clear brand and the screens that carry it.', fi: 'Tekee sumeasta toimeksiannosta selkeän brändin ja sitä kantavat näkymät.' }, photo: 'assets/img/team-sample-1.svg' },
      { name: 'Mikko L.', role: { en: 'Development and AI agents', fi: 'Kehitys ja tekoälyagentit' }, line: { en: 'Builds the product and sets up the agents that draft, test and check.', fi: 'Rakentaa tuotteen ja agentit, jotka luonnostelevat, testaavat ja tarkistavat.' }, photo: 'assets/img/team-sample-2.svg' },
      { name: 'Sara N.', role: { en: 'Automation and motion', fi: 'Automaatio ja liike' }, line: { en: 'Connects the tools you use and makes the films that launch the work.', fi: 'Yhdistää käyttämänne työkalut ja tekee videot, joilla työ lanseerataan.' }, photo: 'assets/img/team-sample-3.svg' }
    ]
  },
  supabaseUrl: 'https://lbffcataydbzwyyypiip.supabase.co',
  supabaseKey: 'sb_publishable_K04nYpPk4CcktUmZktxd0A_pw_bAEnM' // publishable key, safe to publish
};

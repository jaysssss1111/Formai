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
      // { name: 'First Last', role: { en: 'Brand and interface design', fi: 'Brändi- ja käyttöliittymäsuunnittelu' }, photo: 'assets/img/first.jpg' }
    ]
  },
  supabaseUrl: 'https://lbffcataydbzwyyypiip.supabase.co',
  supabaseKey: 'sb_publishable_K04nYpPk4CcktUmZktxd0A_pw_bAEnM' // publishable key, safe to publish
};

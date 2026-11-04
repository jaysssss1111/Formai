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
  supabaseUrl: '',   // e.g. https://abcdefgh.supabase.co
  supabaseKey: ''    // the project's publishable (anon) key, safe to publish
};

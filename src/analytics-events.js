/**
 * Custom GA4 events layered on top of the gtag.js snippet already in
 * <head> (index.html/privacy.html/cookies.html). Nothing here needs any
 * setup in the GA4 UI to start showing up — custom event names just
 * appear in Reports → Engagement → Events (and immediately in Realtime/
 * DebugView) the first time they're sent. The one optional step is
 * marking an event as a "Key event" in GA4 Admin → Events, if you want
 * it to count as a conversion — that's a GA4-side toggle, not code.
 *
 * Deliberately distinct names from GA4's own Enhanced Measurement
 * auto-events (e.g. its automatic `form_start`/`click`) so this can't
 * double-count against those regardless of which Enhanced Measurement
 * toggles happen to be on.
 */
function track(name, params) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

/** Phone / Telegram / Instagram link clicks, anywhere on the page. */
export function initContactClickTracking() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    let method = null;
    if (href.startsWith('tel:')) method = 'phone';
    else if (href.includes('t.me/')) method = 'telegram';
    else if (href.includes('instagram.com')) method = 'instagram';
    if (!method) return;

    track('contact_click', {
      method,
      link_location: link.closest('.site-footer') ? 'footer' : link.closest('.contact__links') ? 'contact_section' : 'other',
    });
  });
}

/** Fires once per page view, the first time someone interacts with the contact form. */
export function initFormStartTracking(form) {
  if (!form) return;
  let fired = false;
  form.addEventListener(
    'focusin',
    () => {
      if (fired) return;
      fired = true;
      track('contact_form_start', { form_name: 'contact' });
    },
    { once: true }
  );
}

/** Fires once the form actually succeeds — the real conversion event. */
export function trackLeadSubmit() {
  track('generate_lead', { form_name: 'contact' });
}

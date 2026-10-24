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

/**
 * Attaches once to a given <video>. Returns a function to call every time
 * that element starts playing a (possibly new) clip — fires `video_play`
 * immediately and arms 25/50/75/100% `video_progress` milestones for
 * *that* viewing (so re-opening the same or a different clip in the same
 * modal re-arms cleanly instead of re-firing stale milestones).
 */
export function createVideoProgressTracker(video) {
  let name = null;
  let fired = new Set();

  function maybeFireProgress() {
    if (!name || !video.duration || !Number.isFinite(video.duration)) return;
    const pct = (video.currentTime / video.duration) * 100;
    for (const milestone of [25, 50, 75, 100]) {
      if (pct >= milestone && !fired.has(milestone)) {
        fired.add(milestone);
        track('video_progress', { video_name: name, percent: milestone });
      }
    }
  }

  video.addEventListener('timeupdate', maybeFireProgress);
  // timeupdate granularity can land just under 100% at the real end —
  // 'ended' is the reliable backstop for the completion milestone.
  video.addEventListener('ended', () => {
    if (name && !fired.has(100)) {
      fired.add(100);
      track('video_progress', { video_name: name, percent: 100 });
    }
  });

  return function startTracking(videoName) {
    name = videoName;
    fired = new Set();
    track('video_play', { video_name: videoName });
  };
}

/** Fires once per page view, the first time each tracked section becomes visible. */
export function initSectionViewTracking(sectionIds) {
  const seen = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target.id)) continue;
        seen.add(entry.target.id);
        track('section_view', { section: entry.target.id });
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.5 }
  );
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }
}

export function trackPortfolioPhotoView(index) {
  track('portfolio_photo_view', { index });
}

export function trackReviewView(name) {
  track('review_view', { name });
}

/** Native <details> FAQ accordion — fires only on expand, not collapse. */
export function initFaqTracking() {
  document.querySelectorAll('.faq-item').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      const question = details.querySelector('.faq-item__summary')?.firstChild?.textContent?.trim();
      if (question) track('faq_expand', { question });
    });
  });
}

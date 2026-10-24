/**
 * Plain autoplay-with-controls popup for the 3 portfolio video clips
 * ([data-clip-src] triggers) — replaces the old shared Instagram/video
 * lightbox now that Instagram is gone: no next/prev (only one video is
 * ever open at a time), no "view on Instagram" link. Distinct from
 * gallery-lightbox.js because there's nothing to page between here.
 */
import { createVideoProgressTracker } from './analytics-events.js';

export function initClipModal() {
  const modal = document.getElementById('clip-modal');
  const video = document.getElementById('clip-modal-video');
  const triggers = document.querySelectorAll('[data-clip-src]');
  if (!modal || !video || !triggers.length) return;

  const trackPlay = createVideoProgressTracker(video);
  let lastTrigger = null;

  function open(trigger) {
    lastTrigger = trigger;
    video.src = trigger.dataset.clipSrc;
    modal.hidden = false;
    document.body.classList.add('lightbox-open');
    video.play().catch(() => {
      // Blocked autoplay just leaves it paused on the first frame — the
      // visible <video controls> lets the visitor start it manually.
    });
    // aria-label is already a human-readable "Відтворити відео: Київ" —
    // strip the fixed prefix rather than inventing a parallel name per clip.
    const label = trigger.getAttribute('aria-label') || 'clip';
    trackPlay(label.replace(/^Відтворити відео:?\s*/i, '') || label);
    modal.querySelector('.lightbox__close')?.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove('lightbox-open');
    video.pause();
    video.removeAttribute('src');
    video.load();
    lastTrigger?.focus();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => open(trigger));
  });

  modal.querySelectorAll('[data-clip-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });
}

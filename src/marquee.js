const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initMarquee() {
  const track = document.getElementById('marquee-track')
  if (!track) return

  if (REDUCED) {
    // Keep visible but static
    track.querySelectorAll('.marquee-text').forEach(el => {
      el.style.animationPlayState = 'paused'
    })
  }
  // CSS animation handles it — nothing else needed
}

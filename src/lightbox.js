import { projects } from './projects.js'

let currentProject = null
let currentSlide = 0
let previouslyFocused = null

const lb = document.getElementById('lightbox')
const lbTitle = document.getElementById('lightbox-title')
const lbMainImg = document.getElementById('lb-main-img')
const lbThumbs = document.getElementById('lb-thumbnails')
const lbClose = document.getElementById('lightbox-close')
const lbPrev = document.getElementById('lb-prev')
const lbNext = document.getElementById('lb-next')

function open(projectIndex) {
  currentProject = projects[projectIndex]
  currentSlide = 0
  previouslyFocused = document.activeElement

  // Populate
  lbTitle.textContent = `${currentProject.title} — ${currentProject.subtitle}`

  // Thumbnails
  lbThumbs.innerHTML = ''
  currentProject.slides.forEach((src, i) => {
    const btn = document.createElement('button')
    btn.className = 'lb-thumb' + (i === 0 ? ' active' : '')
    btn.setAttribute('role', 'tab')
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false')
    btn.setAttribute('aria-label', `Slide ${i + 1}`)
    btn.setAttribute('tabindex', i === 0 ? '0' : '-1')
    const img = document.createElement('img')
    img.src = src
    img.alt = ''
    img.loading = 'lazy'
    btn.appendChild(img)
    btn.addEventListener('click', () => goTo(i))
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goTo(Math.min(currentProject.slides.length - 1, currentSlide + 1))
      if (e.key === 'ArrowLeft') goTo(Math.max(0, currentSlide - 1))
    })
    lbThumbs.appendChild(btn)
  })

  setSlide(0, false)

  lb.removeAttribute('hidden')
  document.body.style.overflow = 'hidden'

  // Trigger open animation
  requestAnimationFrame(() => {
    lb.classList.add('lb-open')
    lbClose.focus()
  })
}

function close() {
  lb.classList.remove('lb-open')
  setTimeout(() => {
    lb.setAttribute('hidden', '')
    document.body.style.overflow = ''
    previouslyFocused?.focus()
  }, 300)
}

function setSlide(idx, animate = true) {
  currentSlide = idx
  if (animate) {
    lbMainImg.style.opacity = '0'
    setTimeout(() => {
      lbMainImg.src = currentProject.slides[idx]
      lbMainImg.alt = `${currentProject.title} slide ${idx + 1}`
      lbMainImg.style.opacity = '1'
    }, 130)
  } else {
    lbMainImg.src = currentProject.slides[idx]
    lbMainImg.alt = `${currentProject.title} slide ${idx + 1}`
  }

  // Update thumbnails
  lbThumbs.querySelectorAll('.lb-thumb').forEach((btn, i) => {
    const active = i === idx
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-selected', active ? 'true' : 'false')
    btn.setAttribute('tabindex', active ? '0' : '-1')
    if (active) {
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }
  })

  // Nav button states
  lbPrev.disabled = idx === 0
  lbNext.disabled = idx === currentProject.slides.length - 1
  lbPrev.style.opacity = idx === 0 ? '0.3' : '1'
  lbNext.style.opacity = idx === currentProject.slides.length - 1 ? '0.3' : '1'
}

function goTo(idx) {
  idx = Math.max(0, Math.min(currentProject.slides.length - 1, idx))
  if (idx === currentSlide) return
  setSlide(idx)
}

// Nav button handlers
lbPrev?.addEventListener('click', () => goTo(currentSlide - 1))
lbNext?.addEventListener('click', () => goTo(currentSlide + 1))
lbClose?.addEventListener('click', close)

// Backdrop click
lb?.addEventListener('click', (e) => {
  if (e.target === lb) close()
})

// Keyboard
document.addEventListener('keydown', (e) => {
  if (lb.hasAttribute('hidden')) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') goTo(currentSlide - 1)
  if (e.key === 'ArrowRight') goTo(currentSlide + 1)
})

// Focus trap
lb?.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return
  const focusable = lb.querySelectorAll('button:not([disabled]), [tabindex="0"]')
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
    e.preventDefault()
    ;(e.shiftKey ? last : first).focus()
  }
})

// Swipe support
let touchStartX = 0
lb?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX }, { passive: true })
lb?.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 50) goTo(dx < 0 ? currentSlide + 1 : currentSlide - 1)
}, { passive: true })

export function initLightbox() {
  // Wire up card clicks
  document.querySelectorAll('.project-card').forEach((card) => {
    const idx = parseInt(card.dataset.project, 10)

    card.addEventListener('click', () => open(idx))
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        open(idx)
      }
    })
  })
}

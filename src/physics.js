import Matter from 'matter-js'

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const LABELS = [
  'UI/UX DESIGN',
  'MOTION\nMICRO-UX',
  'WEB3\nCRYPTO UI',
  'DASHBOARD\nDESIGN',
  'BRANDING',
  'LANDING\nPAGES',
  'USER FLOW\nOPTI.',
  'WEB APP\nDESIGN',
  'DESIGN\nSYSTEMS',
  'MOBILE\nDESIGN',
]

const BASE_RADII = [62, 52, 56, 60, 44, 50, 54, 58, 56, 50]

export function initPhysics() {
  const container = document.getElementById('physics-container')
  const world = document.getElementById('physics-world')
  if (!container || !world) return

  let engine, runner, dragConstraint, draggedBody, draggedElement, activePointerId, lastDragPoint
  let bodyList = []   // Matter.js bodies (parallel array with domList)
  let domList = []    // DOM elements
  let walls = []
  let observer
  let started = false
  let resizeTimer

  function getWorldSize() {
    return { W: world.offsetWidth || 800, H: world.offsetHeight || 400 }
  }

  function isMobile() { return window.innerWidth <= 600 }
  function sf() { return isMobile() ? 0.7 : 1 }

  function buildWalls(W, H) {
    if (walls.length) walls.forEach(w => Matter.Composite.remove(engine.world, w))
    const t = 60
    walls = [
      Matter.Bodies.rectangle(W / 2, H + t / 2, W + 120, t, { isStatic: true }),
      Matter.Bodies.rectangle(-t / 2, H / 2, t, H * 3, { isStatic: true }),
      Matter.Bodies.rectangle(W + t / 2, H / 2, t, H * 3, { isStatic: true }),
      Matter.Bodies.rectangle(W / 2, -t / 2, W + 120, t, { isStatic: true }),
    ]
    walls.forEach(w => Matter.Composite.add(engine.world, w))
  }

  function spawnCircles(W, H) {
    // Remove old
    if (bodyList.length) bodyList.forEach(b => Matter.Composite.remove(engine.world, b))
    bodyList = []
    domList.forEach(el => el.remove())
    domList = []

    const s = sf()
    const cols = isMobile() ? 3 : 5
    const colW = W / cols

    LABELS.forEach((label, i) => {
      const r = Math.round(BASE_RADII[i] * s)
      const col = i % cols
      const baseX = col * colW + colW * 0.5
      const jitter = (Math.random() - 0.5) * colW * 0.4
      const spawnX = Math.max(r + 4, Math.min(W - r - 4, baseX + jitter))
      // Start every ball inside the ceiling.  The previous positions were
      // above the top wall, so that wall stopped the balls before they could
      // enter the visible play area.
      const row = Math.floor(i / cols)
      const spawnY = r + 18 + row * 20 + Math.random() * 18

      // A small stagger makes the first arrival read as a drop, rather than
      // placing every ball in the world at the same instant.
      const delay = i * 90 + Math.random() * 70

      setTimeout(() => {
        if (!engine) return

        const body = Matter.Bodies.circle(spawnX, spawnY, r, {
          restitution: 0.68 + Math.random() * 0.22,
          friction: 0.015,
          frictionAir: 0.008,
          density: 0.001 + i * 0.00003,
          slop: 0.5,
        })
        Matter.Composite.add(engine.world, body)
        bodyList.push(body)

        const el = document.createElement('div')
        el.className = 'physics-circle'
        const d = r * 2
        el.style.cssText = `width:${d}px;height:${d}px;position:absolute;left:0;top:0;margin-left:-${r}px;margin-top:-${r}px;`
        el.textContent = label.replace(/\n/g, ' ')
        el.setAttribute('aria-label', label.replace(/\n/g, ' '))
        world.appendChild(el)
        domList.push(el)
      }, delay)
    })
  }

  function syncDOM() {
    bodyList.forEach((body, i) => {
      const el = domList[i]
      if (!el) return
      const { x, y } = body.position
      const a = body.angle
      el.style.transform = `translate(${x}px,${y}px) rotate(${a}rad)`
    })
  }

  function capVelocities() {
    const MAX = 26
    bodyList.forEach(body => {
      const { x, y } = body.velocity
      const spd = Math.sqrt(x * x + y * y)
      if (spd > MAX) {
        Matter.Body.setVelocity(body, { x: x / spd * MAX, y: y / spd * MAX })
      }
    })
  }

  function pointFromEvent(event) {
    const rect = world.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (world.offsetWidth / rect.width),
      y: (event.clientY - rect.top) * (world.offsetHeight / rect.height),
    }
  }

  function releaseDrag() {
    if (dragConstraint) Matter.Composite.remove(engine.world, dragConstraint)
    if (draggedBody && lastDragPoint?.velocity) {
      const { x, y } = lastDragPoint.velocity
      Matter.Body.setVelocity(draggedBody, {
        x: Math.max(-18, Math.min(18, x)),
        y: Math.max(-18, Math.min(18, y)),
      })
    }
    dragConstraint = null
    draggedBody = null
    if (draggedElement) draggedElement.classList.remove('is-dragging')
    draggedElement = null
    activePointerId = null
    lastDragPoint = null
    world.classList.remove('is-dragging')
  }

  function enableDragging() {
    const beginDrag = (event, inputId) => {
      const isTouch = event.pointerType === 'touch'
      if (activePointerId !== null || (!isTouch && event.button !== 0)) return
      const rect = world.getBoundingClientRect()
      const isInsideWorld = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom
      if (!isInsideWorld) return
      const point = pointFromEvent(event)
      const body = Matter.Query.point(bodyList, point)[0]
      if (!body) return

      if (event.cancelable) event.preventDefault()
      activePointerId = inputId
      draggedBody = body
      draggedElement = domList[bodyList.indexOf(body)]
      if (draggedElement) draggedElement.classList.add('is-dragging')
      world.classList.add('is-dragging')
      Matter.Sleeping.set(body, false)
      lastDragPoint = {
        point,
        time: performance.now(),
        velocity: { x: 0, y: 0 },
      }
      dragConstraint = Matter.Constraint.create({
        pointA: point,
        bodyB: body,
        pointB: { x: point.x - body.position.x, y: point.y - body.position.y },
        stiffness: 0.34,
        damping: 0.06,
        length: 0,
      })
      Matter.Composite.add(engine.world, dragConstraint)
    }

    const moveDrag = (event, inputId) => {
      if (!dragConstraint || inputId !== activePointerId) return
      if (event.cancelable) event.preventDefault()
      const point = pointFromEvent(event)
      const now = performance.now()
      const elapsed = Math.max(16, now - lastDragPoint.time)
      lastDragPoint.velocity = {
        x: ((point.x - lastDragPoint.point.x) / elapsed) * 16.67,
        y: ((point.y - lastDragPoint.point.y) / elapsed) * 16.67,
      }
      lastDragPoint.point = point
      lastDragPoint.time = now
      dragConstraint.pointA = point
    }

    const finishDrag = inputId => {
      if (inputId === activePointerId) releaseDrag()
    }

    // Prefer Pointer Events for mouse, touch and pen. Some embedded browsers
    // only expose classic mouse events, so give those browsers a real fallback.
    if ('PointerEvent' in window) {
      world.addEventListener('pointerdown', event => {
        const inputId = `pointer:${event.pointerId}`
        beginDrag(event, inputId)
        if (activePointerId === inputId) world.setPointerCapture?.(event.pointerId)
      })
      window.addEventListener('pointermove', event => moveDrag(event, `pointer:${event.pointerId}`))
      window.addEventListener('pointerup', event => finishDrag(`pointer:${event.pointerId}`))
      window.addEventListener('pointercancel', event => finishDrag(`pointer:${event.pointerId}`))
      return
    }

    world.addEventListener('mousedown', event => beginDrag(event, 'mouse'))
    window.addEventListener('mousemove', event => moveDrag(event, 'mouse'))
    window.addEventListener('mouseup', () => finishDrag('mouse'))
  }

  function startPhysics() {
    if (started) return
    started = true

    const { W, H } = getWorldSize()

    engine = Matter.Engine.create({ gravity: { y: 1 } })
    runner = Matter.Runner.create()

    buildWalls(W, H)
    spawnCircles(W, H)

    // Mouse / touch constraint — no Render needed, just the MouseConstraint
    // The visible DOM circles sit above the simulation, so use Pointer Events
    // directly for a dependable mouse and touch drag constraint.
    enableDragging()

    // Sync DOM every engine tick
    Matter.Events.on(engine, 'afterUpdate', () => {
      capVelocities()
      syncDOM()
    })

    Matter.Runner.run(runner, engine)

    // Forward touch events to the mouse element so Matter.js picks them up
    // Matter.Mouse already listens to its element; we map touches → pointer-style events
  }

  function rebuild() {
    if (!started || !engine) return
    const { W, H } = getWorldSize()
    buildWalls(W, H)
    if (bodyList.length) bodyList.forEach(b => Matter.Composite.remove(engine.world, b))
    bodyList = []
    domList.forEach(el => el.remove())
    domList = []
    spawnCircles(W, H)
  }

  // Static fallback for reduced motion
  if (REDUCED) {
    const s = sf()
    const { W } = getWorldSize()
    let x = 16, y = 80, row = 0
    LABELS.forEach((label, i) => {
      const r = Math.round(BASE_RADII[i] * s)
      if (x + r * 2 + 16 > W) { x = 16; row++ }
      const el = document.createElement('div')
      el.className = 'physics-circle'
      const d = r * 2
      el.style.cssText = `width:${d}px;height:${d}px;position:absolute;left:${x}px;top:${16 + row * (d + 12)}px;`
      el.textContent = label.replace(/\n/g, ' ')
      world.appendChild(el)
      x += r * 2 + 12
    })
    return
  }

  // Lazy-init on scroll into view
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      startPhysics()
      observer.disconnect()
    }
  }, { threshold: 0.1 })
  observer.observe(container)

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(rebuild, 300)
  }, { passive: true })
}

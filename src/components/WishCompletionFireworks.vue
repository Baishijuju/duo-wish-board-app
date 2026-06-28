<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

interface FireworkParticle {
  alpha: number
  color: string
  life: number
  maxLife: number
  radius: number
  vx: number
  vy: number
  x: number
  y: number
}

interface FireworkRocket {
  color: string
  exploded: boolean
  size: number
  targetY: number
  vx: number
  vy: number
  x: number
  y: number
}

const props = withDefaults(defineProps<{
  active: boolean
  colors?: string[]
  durationMs?: number
  population?: number
}>(), {
  colors: () => ['#ff9fb7', '#d9799a', '#f6c35f', '#8fb49a', '#fff9f2'],
  durationMs: 3800,
  population: 5,
})

const emit = defineEmits<{
  finished: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isVisible = ref(false)
const isReducedMotion = ref(false)

let animationFrameId = 0
let completionTimerId = 0
let resizeObserver: ResizeObserver | null = null
let startedAt = 0
let lastFrameAt = 0
let nextLaunchAt = 0
let rockets: FireworkRocket[] = []
let particles: FireworkParticle[] = []

watch(() => props.active, (active) => {
  if (active) {
    void startFireworks()
  } else {
    stopFireworks(false)
  }
})

onBeforeUnmount(() => {
  stopFireworks(false)
})

async function startFireworks() {
  stopFireworks(false)
  isVisible.value = true
  await nextTick()

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  isReducedMotion.value = mediaQuery.matches

  if (isReducedMotion.value) {
    completionTimerId = window.setTimeout(() => stopFireworks(true), 1000)
    return
  }

  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    stopFireworks(true)
    return
  }

  resizeCanvas()
  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)

  startedAt = performance.now()
  lastFrameAt = startedAt
  nextLaunchAt = startedAt
  rockets = []
  particles = []
  animationFrameId = window.requestAnimationFrame(drawFrame)
}

function stopFireworks(shouldEmit: boolean) {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }

  if (completionTimerId) {
    window.clearTimeout(completionTimerId)
    completionTimerId = 0
  }

  resizeObserver?.disconnect()
  resizeObserver = null
  rockets = []
  particles = []

  const context = canvasRef.value?.getContext('2d')
  if (context && canvasRef.value) {
    context.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }

  if (isVisible.value) {
    isVisible.value = false
  }

  if (shouldEmit) {
    emit('finished')
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    return
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function drawFrame(frameAt: number) {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    stopFireworks(true)
    return
  }

  const elapsed = frameAt - startedAt
  const delta = Math.min((frameAt - lastFrameAt) / 16.67, 2)
  lastFrameAt = frameAt

  context.clearRect(0, 0, window.innerWidth, window.innerHeight)

  if (elapsed < props.durationMs * 0.72 && frameAt >= nextLaunchAt) {
    launchRocket()
    nextLaunchAt = frameAt + randomBetween(260, 560)
  }

  updateRockets(context, delta)
  updateParticles(context, delta)

  if (elapsed >= props.durationMs && rockets.length === 0 && particles.length === 0) {
    stopFireworks(true)
    return
  }

  animationFrameId = window.requestAnimationFrame(drawFrame)
}

function launchRocket() {
  const width = window.innerWidth
  const height = window.innerHeight
  const color = props.colors[Math.floor(Math.random() * props.colors.length)] ?? '#ff9fb7'

  rockets.push({
    color,
    exploded: false,
    size: randomBetween(2.5, 4.4),
    targetY: randomBetween(height * 0.16, height * 0.48),
    vx: randomBetween(-0.9, 0.9),
    vy: randomBetween(-8.6, -6.2),
    x: randomBetween(width * 0.12, width * 0.88),
    y: height + 12,
  })
}

function updateRockets(context: CanvasRenderingContext2D, delta: number) {
  rockets = rockets.filter((rocket) => {
    rocket.x += rocket.vx * delta
    rocket.y += rocket.vy * delta
    rocket.vy += 0.045 * delta

    drawGlow(context, rocket.x, rocket.y, rocket.size * 2, rocket.color, 0.9)

    if (rocket.y <= rocket.targetY || rocket.vy >= -1.2) {
      explodeRocket(rocket)
      return false
    }

    return true
  })
}

function explodeRocket(rocket: FireworkRocket) {
  const particleCount = Math.round(randomBetween(24, 42) * Math.max(1, props.population / 5))

  for (let index = 0; index < particleCount; index += 1) {
    const angle = (Math.PI * 2 * index) / particleCount + randomBetween(-0.08, 0.08)
    const speed = randomBetween(2.1, 6.2)
    const color = Math.random() > 0.18 ? rocket.color : props.colors[Math.floor(Math.random() * props.colors.length)] ?? rocket.color

    particles.push({
      alpha: 1,
      color,
      life: 0,
      maxLife: randomBetween(46, 78),
      radius: randomBetween(1.2, 3.2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      x: rocket.x,
      y: rocket.y,
    })
  }
}

function updateParticles(context: CanvasRenderingContext2D, delta: number) {
  context.globalCompositeOperation = 'lighter'

  particles = particles.filter((particle) => {
    particle.life += delta
    particle.x += particle.vx * delta
    particle.y += particle.vy * delta
    particle.vy += 0.072 * delta
    particle.vx *= 0.989
    particle.vy *= 0.991
    particle.alpha = Math.max(0, 1 - particle.life / particle.maxLife)

    if (particle.alpha <= 0.02) {
      return false
    }

    drawGlow(context, particle.x, particle.y, particle.radius, particle.color, particle.alpha)
    return true
  })

  context.globalCompositeOperation = 'source-over'
}

function drawGlow(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) {
  context.save()
  context.globalAlpha = alpha
  context.fillStyle = color
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}
</script>

<template>
  <div v-if="isVisible" class="wish-completion-fireworks" :class="{ 'is-reduced-motion': isReducedMotion }" aria-hidden="true">
    <canvas ref="canvasRef"></canvas>
    <span class="wish-completion-fireworks-glow"></span>
  </div>
</template>

<style scoped>
.wish-completion-fireworks {
  position: fixed;
  inset: 0;
  z-index: 80;
  overflow: hidden;
  pointer-events: none;
}

.wish-completion-fireworks canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.wish-completion-fireworks-glow {
  position: absolute;
  inset: auto 12% 10% 12%;
  height: 34%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 159, 183, 0.22), transparent 66%);
  opacity: 0;
  animation: wish-completion-glow 1000ms ease-out both;
}

.wish-completion-fireworks.is-reduced-motion .wish-completion-fireworks-glow {
  inset: 24% 18% auto;
  height: 26%;
  opacity: 1;
}

@keyframes wish-completion-glow {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.86);
  }

  35% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(-8px) scale(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wish-completion-fireworks-glow {
    animation-duration: 900ms;
  }
}
</style>
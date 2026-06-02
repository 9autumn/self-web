<template>
  <div class="app-shell" :style="cursorStyle">
    <div class="cursor-capture" aria-hidden="true"></div>
    <div class="cursor-core" aria-hidden="true"></div>

    <header class="topbar">
      <div class="brand">灰色轨迹</div>
      <nav class="nav">
        <a href="#home">首页</a>
        <a href="#life">生活</a>
        <a href="#travel">旅游</a>
        <a href="#games">游戏</a>
        <a href="#music">音乐</a>
        <a href="#projects">项目</a>
      </nav>
    </header>

    <main class="page">
      <section class="hero" id="home">
        <p class="eyebrow">Hello world</p>

        <div ref="titleStackRef" class="title-stack">
          <div class="title-layer title-layer--en">
            <h1 class="hero-title">HELLO I'M<br/>GREY TRACK</h1>
          </div>
          <div class="title-layer title-layer--cn">
            <h1 class="hero-title">你好，我是<br/>灰色轨迹</h1>
          </div>
        </div>

        <p class="subcopy">
          Living at the intersection of code, travel, music, and play. A personal universe in the making.
        </p>
        <div class="scroll-hint">
          <span class="scroll-arrow"></span>
        </div>
      </section>

      <!-- 生活 -->
      <section
        class="panel flip-panel"
        :class="{ flipped: flippedPanels.has('life') }"
        id="life"
        @mouseenter="flipOn('life')"
      >
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <h2>生活</h2>
            <span class="panel-tag">LIFE</span>
          </div>
          <div class="flip-card-back">
            <h2>生活</h2>
            <div class="back-content">
              <p class="back-label">LIFE</p>
              <p class="back-desc">
                记录日常的点滴瞬间。代码之外的咖啡、书籍、健身和思考。每一天都在重新定义自己。
              </p>
              <div class="tech-grid">
                <div class="tech-dot" v-for="n in 6" :key="n"></div>
              </div>
            </div>
          </div>
          <div class="wipe-line"></div>
        </div>
      </section>

      <!-- 旅游 -->
      <section
        class="panel flip-panel"
        :class="{ flipped: flippedPanels.has('travel') }"
        id="travel"
        @mouseenter="flipOn('travel')"
      >
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <h2>旅游</h2>
            <span class="panel-tag">TRAVEL</span>
          </div>
          <div class="flip-card-back">
            <h2>旅游</h2>
            <div class="back-content">
              <p class="back-label">TRAVEL</p>
              <p class="back-desc">
                用脚步丈量世界，用镜头记录风景。从城市街巷到山川湖海，每一次出发都是新的冒险。
              </p>
              <div class="geo-shape"></div>
            </div>
          </div>
          <div class="wipe-line"></div>
        </div>
      </section>

      <!-- 游戏 -->
      <section
        class="panel flip-panel"
        :class="{ flipped: flippedPanels.has('games') }"
        id="games"
        @mouseenter="flipOn('games')"
      >
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <h2>游戏</h2>
            <span class="panel-tag">GAMES</span>
          </div>
          <div class="flip-card-back">
            <h2>游戏</h2>
            <div class="back-content">
              <p class="back-label">GAMES</p>
              <p class="back-desc">
                虚拟世界中的策略与反应。从独立游戏到3A大作，游戏是交互艺术的终极表达。
              </p>
              <div class="glitch-bars">
                <span v-for="n in 5" :key="n"></span>
              </div>
            </div>
          </div>
          <div class="wipe-line"></div>
        </div>
      </section>

      <!-- 音乐 -->
      <section
        class="panel flip-panel"
        :class="{ flipped: flippedPanels.has('music') }"
        id="music"
        @mouseenter="flipOn('music')"
      >
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <h2>音乐</h2>
            <span class="panel-tag">MUSIC</span>
          </div>
          <div class="flip-card-back">
            <h2>音乐</h2>
            <div class="back-content">
              <p class="back-label">MUSIC</p>
              <p class="back-desc">
                旋律是灵魂的语言。从古典到电子，每一个音符都在讲述故事、传递情绪。
              </p>
              <div class="waveform"></div>
            </div>
          </div>
          <div class="wipe-line"></div>
        </div>
      </section>

      <!-- 项目 -->
      <section
        class="panel flip-panel footer"
        :class="{ flipped: flippedPanels.has('projects') }"
        id="projects"
        @mouseenter="flipOn('projects')"
      >
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <h2>项目</h2>
            <span class="panel-tag">PROJECTS</span>
          </div>
          <div class="flip-card-back">
            <h2>项目</h2>
            <div class="back-content">
              <p class="back-label">PROJECTS</p>
              <p class="back-desc">
                动手构建，持续打磨。从前端实验到全栈应用，每一个项目都是一次技术探索。
              </p>
              <a href="https://github.com/BOATCHUANGU" target="_blank" rel="noreferrer" class="cyber-link">
                <span class="link-icon">&#9654;</span> GITHUB / BOATCHUANGU
              </a>
            </div>
          </div>
          <div class="wipe-line"></div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const cursorX = ref(window.innerWidth / 2)
const cursorY = ref(window.innerHeight / 2)
const maskX = ref(window.innerWidth / 2)
const maskY = ref(window.innerHeight / 2)
const titleStackRef = ref(null)
const flippedPanels = ref(new Set())

const flipOn = (id) => {
  if (flippedPanels.value.has(id)) return
  const next = new Set(flippedPanels.value)
  next.add(id)
  flippedPanels.value = next
}

let cleanup = () => {}

const cursorStyle = computed(() => ({
  '--cursor-x': `${cursorX.value}px`,
  '--cursor-y': `${cursorY.value}px`,
  '--mask-x': `${maskX.value}px`,
  '--mask-y': `${maskY.value}px`,
}))

onMounted(() => {
  const update = (clientX, clientY) => {
    cursorX.value = clientX
    cursorY.value = clientY

    const rect = titleStackRef.value?.getBoundingClientRect()
    if (rect) {
      maskX.value = clientX - rect.left
      maskY.value = clientY - rect.top
    }
  }

  const onMove = (event) => {
    update(event.clientX, event.clientY)
  }

  document.addEventListener('mousemove', onMove, { passive: true })
  document.body.style.cursor = 'none'

  const touchSet = (event) => {
    const point = event.touches?.[0]
    if (!point) return
    update(point.clientX, point.clientY)
  }

  document.addEventListener('touchmove', touchSet, { passive: true })

  cleanup = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('touchmove', touchSet)
  }
})

onBeforeUnmount(() => cleanup())
</script>

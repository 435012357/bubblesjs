<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import PackageCommand from './PackageCommand.vue'

const { lang } = useData()
const english = computed(() => lang.value.startsWith('en'))
const localLink = (path: string) => withBase(`${english.value ? '/en' : ''}${path}`)
const features = computed(() =>
  english.value
    ? [
        {
          icon: 'bolt',
          title: 'An idea to a running app',
          text: 'Start with create-bubbles. Pick a template, name your project, and make it yours.',
          link: '/guide/start/quick-start',
        },
        {
          icon: 'code',
          title: 'Your framework, your way',
          text: 'React, Vue, Taro, or Next.js. Find the right starting point for what you want to build.',
          link: '/templates/',
        },
        {
          icon: 'box',
          title: 'Small packages. Big help.',
          text: 'Requests, utilities, AI charts, and Vue components. Bring in just what your project needs.',
          link: '/packages/',
        },
        {
          icon: 'tools',
          title: 'A thoughtful toolchain',
          text: 'Vite+, Rsbuild, and ready-to-use code quality tools, already connected in each template.',
          link: '/templates/vp-react',
        },
        {
          icon: 'palette',
          title: 'Room for your own style',
          text: 'Start with Ant Design or shadcn/ui, then shape the interface around your ideas.',
          link: '/templates/vp-react-shadcn',
        },
        {
          icon: 'layers',
          title: 'Space to grow',
          text: 'From a single app to a monorepo. Customize your build, styles, and workflow as you grow.',
          link: '/templates/vp-monorepo-react-nestjs',
        },
      ]
    : [
        {
          icon: 'bolt',
          title: '从灵感，到启动',
          text: '一行 create-bubbles，选好模板，取个名字。把搭建的时间，留给真正想做的事。',
          link: '/guide/start/quick-start',
        },
        {
          icon: 'code',
          title: '熟悉的框架，自由的选择',
          text: 'React、Vue、Taro、Next.js，为不同的想法，找到合适的起点。',
          link: '/templates/',
        },
        {
          icon: 'box',
          title: '小巧的包，恰好的帮助',
          text: '请求、工具函数、AI 图表与 Vue 组件。需要哪一块，就带走哪一块。',
          link: '/packages/',
        },
        {
          icon: 'tools',
          title: '顺手的现代工具链',
          text: 'Vite+、Rsbuild 与代码质量工具，已在模板中配好，打开项目就能专注开发。',
          link: '/templates/vp-react',
        },
        {
          icon: 'palette',
          title: '好看，也有你的风格',
          text: '从 Ant Design 或 shadcn/ui 出发，自由调整组件与样式，让界面长成你的样子。',
          link: '/templates/vp-react-shadcn',
        },
        {
          icon: 'layers',
          title: '陪项目一起长大',
          text: '从单个应用到 Monorepo，灵活组织代码，自定义构建、样式与开发流程。',
          link: '/templates/vp-monorepo-react-nestjs',
        },
      ],
)
const iconPaths: Record<string, string> = {
  bolt: 'm13 2-9 12h7l-1 8 10-12h-7l1-8Z',
  code: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16',
  box: 'm12 3 9 5v9l-9 5-9-5V8l9-5Zm0 9 9-4M12 12 3 8m9 4v10M7.5 5.5l9 5',
  tools: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  palette:
    'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.5 1.5 0 0 1 .8-2.8H17a4 4 0 0 0 4-4C21 6 17 3 12 3ZM7 10h.01M10 6.5h.01M15 6.5h.01M18 10h.01',
  layers: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
}
</script>

<template>
  <div class="bubbles-home">
    <section class="bubbles-hero" aria-labelledby="bubbles-title">
      <div class="bubbles-copy">
        <p class="bubbles-wordmark">Bubbles</p>
        <h1 id="bubbles-title">
          <template v-if="english">A lighter way<br />to build.</template>
          <template v-else>让前端开发<br />轻盈一点。</template>
        </h1>
        <p class="bubbles-tagline">
          {{
            english
              ? 'From your first idea to your next creation.'
              : '从一个想法，到你的下一个作品。'
          }}<br />
          {{
            english
              ? 'Your frontend toolkit. Ready when you are.'
              : '轻量、顺手、开箱即用的前端开发工具包。'
          }}
        </p>
        <div class="bubbles-actions">
          <a class="bubbles-button primary" :href="localLink('/guide/start/quick-start')">
            {{ english ? 'Get started' : '快速开始' }} <span aria-hidden="true">→</span>
          </a>
          <a class="bubbles-button secondary" :href="localLink('/templates/')">{{
            english ? 'Explore templates' : '探索模板'
          }}</a>
        </div>
        <PackageCommand />
      </div>

      <div
        class="bubbles-visual"
        role="img"
        :aria-label="
          english
            ? 'An app preview floating among iridescent bubbles'
            : '漂浮在彩色泡泡间的 Bubbles 应用预览'
        "
      >
        <div class="bubble-orbit orbit-back"></div>
        <div class="bubble bubble-top"></div>
        <div class="bubble bubble-tiny"></div>
        <div class="bubble-window">
          <div class="bubble-window-bar">
            <span class="window-brand"
              ><img :src="withBase('/bubbles-icon.svg')" alt="" /> Bubbles</span
            >
            <span class="window-dots"><i></i><i></i><i></i></span>
          </div>
          <div class="bubble-window-body">
            <div class="window-sidebar">
              <span class="sidebar-active"></span><span></span><span></span><span></span
              ><span></span>
            </div>
            <div class="window-content">
              <div class="preview-title">
                <span>#</span> Hello Bubbles<span class="hello-dot">.</span>
              </div>
              <div class="preview-placeholder"></div>
              <div class="preview-placeholder short"></div>
              <div class="preview-code">
                <div class="preview-filename">
                  <span class="vue-mark">V</span> App.vue <span>●</span>
                </div>
                <div class="preview-code-lines">
                  <div><span class="syntax-pink">&lt;script setup&gt;</span></div>
                  <div>
                    <span class="syntax-purple">import</span> { ref }
                    <span class="syntax-purple">from</span> <span class="syntax-green">'vue'</span>
                  </div>
                  <div class="code-space"></div>
                  <div>
                    <span class="syntax-purple">const</span> message =
                    <span class="syntax-blue">ref</span>(
                  </div>
                  <div>&nbsp;&nbsp;<span class="syntax-green">'Hello, Bubbles!'</span></div>
                  <div>)</div>
                  <div><span class="syntax-pink">&lt;/script&gt;</span></div>
                </div>
              </div>
              <div class="preview-status">
                <span></span>
                {{ english ? 'Ready for your next idea' : '准备好，迎接你的下一个灵感' }}
              </div>
            </div>
          </div>
        </div>
        <div class="bubble bubble-main">
          <span class="bubble-face"><i></i><i></i><b></b></span>
        </div>
        <div class="bubble bubble-small"></div>
        <div class="bubble bubble-bottom"></div>
        <span class="bubble-sparkle sparkle-one">✧</span
        ><span class="bubble-sparkle sparkle-two">✧</span>
      </div>
    </section>

    <section
      class="bubbles-features"
      :aria-label="english ? 'Made for your next project' : '为你的下一个项目准备'"
    >
      <a
        v-for="feature in features"
        :key="feature.icon"
        :href="localLink(feature.link)"
        class="bubbles-feature"
      >
        <div class="feature-icon" :class="`icon-${feature.icon}`">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="iconPaths[feature.icon]" />
          </svg>
        </div>
        <h2>{{ feature.title }}</h2>
        <p>{{ feature.text }}</p>
        <span class="feature-arrow" aria-hidden="true">↗</span>
      </a>
    </section>

    <section class="bubbles-start">
      <img :src="withBase('/bubbles-icon.svg')" alt="" width="32" height="32" />
      <h2>{{ english ? 'Let your next idea take shape.' : '让下一个想法，冒个泡。' }}</h2>
      <a :href="localLink('/guide/')"
        >{{ english ? 'Meet Bubbles' : '认识 Bubbles' }} <span aria-hidden="true">→</span></a
      >
    </section>
  </div>
</template>

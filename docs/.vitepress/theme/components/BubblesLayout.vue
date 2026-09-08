<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const { lang, frontmatter, page } = useData()
const english = computed(() => lang.value.startsWith('en'))
const isHome = computed(() => frontmatter.value.layout === 'home')
const section = computed(() => {
  const key = page.value.relativePath.replace(/^(zh|en)\//, '').split('/')[0]
  const sections: Record<string, [string, string]> = {
    guide: ['指南', 'Guide'],
    packages: ['工具包', 'Packages'],
    templates: ['项目模板', 'Templates'],
  }
  const label = sections[key]
  return label
    ? { text: label[english.value ? 1 : 0], link: `${english.value ? '/en' : ''}/${key}/` }
    : undefined
})
</script>

<template>
  <DefaultTheme.Layout :class="{ 'bubbles-docs': !isHome }">
    <template #layout-top>
      <a
        v-if="isHome"
        class="bubble-announcement"
        :href="withBase(english ? '/en/templates/' : '/templates/')"
      >
        <img :src="withBase('/bubbles-icon.svg')" alt="" width="20" height="20" />
        {{
          english
            ? 'A little idea. A world of possibilities. Explore the templates'
            : '给下一个灵感，一个轻盈的开始。探索 Bubbles 项目模板'
        }}
        <span aria-hidden="true">→</span>
      </a>
    </template>
    <template #nav-bar-title-after>
      <span v-if="!isHome" class="bubbles-docs-label">{{ english ? 'Docs' : '文档' }}</span>
    </template>
    <template #doc-before>
      <nav
        v-if="section"
        class="bubbles-breadcrumb"
        :aria-label="english ? 'Breadcrumb' : '面包屑导航'"
      >
        <a :href="withBase(section.link)">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 5.2C8.3 3.8 5.7 3.4 2.8 4.1v11.4c2.9-.7 5.5-.3 7.2 1.1m0-11.4c1.7-1.4 4.3-1.8 7.2-1.1v11.4c-2.9-.7-5.5-.3-7.2 1.1m0-11.4v11.4"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linejoin="round"
            />
          </svg>
          {{ section.text }}
        </a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{{ page.title }}</span>
      </nav>
    </template>
  </DefaultTheme.Layout>
</template>

import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  base: '/bubblesjs/',
  title: 'Bubbles',
  icon: 'https://assets.rspack.dev/rsbuild/favicon-128x128.png',
  logo: {
    light: 'https://assets.rspack.dev/rsbuild/navbar-logo-light.png',
    dark: 'https://assets.rspack.dev/rsbuild/navbar-logo-dark.png',
  },
  lang: 'zh',
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'Bubbles',
      description: 'Bubbles is a modern, lightweight, and fast component library.',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'Bubbles',
      description: 'Bubbles 是一个现代、轻量级且快速的组件库。',
    },
  ],
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/435012357/bubblesjs',
      },
    ],
    locales: [
      {
        lang: 'en',
        label: 'On this page',
      },
      {
        lang: 'zh',
        label: '大纲',
      },
    ],
  },
});

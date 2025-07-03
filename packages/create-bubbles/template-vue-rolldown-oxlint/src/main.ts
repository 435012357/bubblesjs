import { createApp } from 'vue'

import '@/styles/index.scss'
import '@/styles/element-plus-variables.css'

import App from './App.vue'
import { setupRouter } from './router'
import { setupStore } from './store'

import 'virtual:svg-icons-register'

const app = createApp(App)
setupRouter(app)
setupStore(app)
app.mount('#app')

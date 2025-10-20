import '@/styles/element-plus-variables.css'
import '@/styles/index.scss'
import 'virtual:svg-icons-register'
import 'virtual:uno.css'

import { createApp } from 'vue'

import App from './App.vue'
import { setupRouter } from './router'
import { setupStore } from './store'

const app = createApp(App)
setupRouter(app)
setupStore(app)
app.mount('#app')

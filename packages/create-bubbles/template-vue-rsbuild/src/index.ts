import { createApp } from 'vue';

import App from './App.vue';

import '@/styles/index.css';
import { setupRouter } from './router';

const app = createApp(App);

setupRouter(app);

app.mount('#root');

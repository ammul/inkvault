import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { i18n } from './i18n'
import App from './App.vue'
import './assets/main.css'

if (!globalThis.crypto?.subtle) {
  document.body.innerHTML =
    '<p style="color:red;padding:2rem;font-family:sans-serif">InkVault requires a secure context (HTTPS or localhost). Web Crypto API is unavailable.</p>'
  throw new Error('Web Crypto API unavailable.')
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')

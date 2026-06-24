import './assets/main.css'
import 'notivue/notifications.css'
import 'notivue/animations.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createNotivue } from 'notivue'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
const notivue = createNotivue()

app.use(pinia)
app.use(router)
app.use(notivue)

app.mount('#app')

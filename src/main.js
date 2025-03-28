import './assets/base.css'
import './assets/markdown.css'
import { createApp } from 'vue'
import App from './App.vue'

// 导入highlight.js样式
import 'highlight.js/styles/github.css' // 可选择其他样式如atom-one-dark.css等

createApp(App).mount('#app')

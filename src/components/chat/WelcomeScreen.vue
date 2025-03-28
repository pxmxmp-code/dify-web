<template>
  <div class="h-full flex flex-col items-center justify-center">
    <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
      <LeafIcon class="h-10 w-10 text-green-500" />
    </div>
    <h2 class="text-xl font-semibold text-gray-800 mb-2">欢迎使用农业规划 AI</h2>
    <p class="text-gray-500 text-center max-w-md mb-8">请点击左侧"新对话"按钮开始与AI助手交流，或选择历史会话继续对话。</p>
    <button 
      class="flex items-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
      @click="$emit('start-new-chat')"
    >
      <PlusIcon class="h-4 w-4" />
      <span>开始新对话</span>
    </button>
  </div>
</template>

<script>
import { Leaf as LeafIcon, Plus as PlusIcon } from 'lucide-vue-next';

export default {
  name: 'WelcomeScreen',
  components: {
    LeafIcon,
    PlusIcon
  },
  emits: ['start-new-chat']
}
</script>

<style scoped>
/* 欢迎界面的过渡动画 */
.welcome-enter-active,
.welcome-leave-active {
  transition: opacity 0.5s ease;
}

.welcome-enter-from,
.welcome-leave-to {
  opacity: 0;
}
</style> 
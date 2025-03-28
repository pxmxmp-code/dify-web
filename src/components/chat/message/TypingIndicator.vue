<template>
  <transition name="typing">
    <div class="flex justify-start">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mr-3 mt-1 relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" :class="'animate-pulse'"></div>
        <LeafIcon class="h-4 w-4 text-white" />
      </div>
      <div class="bg-white text-gray-800 border border-green-100 rounded-2xl rounded-tl-sm shadow-md px-5 py-4">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce" style="animation-delay: 200ms"></div>
          <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce" style="animation-delay: 400ms"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { Leaf as LeafIcon } from 'lucide-vue-next';

export default {
  name: 'TypingIndicator',
  components: {
    LeafIcon
  }
}
</script>

<style scoped>
/* 动画样式 */
.typing-enter-active,
.typing-leave-active {
  transition: all 0.3s ease;
}
.typing-enter-from,
.typing-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 跳动动画 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
.animate-bounce {
  animation: bounce 0.6s infinite;
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.9;
  }
}
.animate-pulse {
  animation: pulse 2s infinite;
}
</style> 
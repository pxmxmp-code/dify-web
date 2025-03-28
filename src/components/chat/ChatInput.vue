<template>
  <div class="border-t border-green-100 p-4 bg-white">
    <form @submit.prevent="handleSubmit" class="flex items-center gap-2">
      <div class="flex-1 relative">
        <input
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          placeholder="输入您的问题或需求..."
          class="w-full py-2 px-4 pr-12 bg-white border border-green-200 text-gray-800 focus:ring-green-500/30 focus:border-green-500/50 rounded-full transition-all duration-200"
          :disabled="isTyping"
        />
        <!-- 根据状态显示发送或停止按钮 -->
        <button 
          v-if="!isTyping"
          type="submit" 
          class="absolute right-1 top-1 h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 flex items-center justify-center transform transition-transform duration-200 hover:scale-105 active:scale-95"
          :disabled="!modelValue.trim()"
        >
          <SendIcon class="h-4 w-4" />
        </button>
        <button 
          v-else
          type="button"
          @click="$emit('stop-response')"
          class="absolute right-1 top-1 h-8 w-8 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 flex items-center justify-center transform transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <XIcon class="h-4 w-4" />
        </button>
      </div>
    </form>
    <div class="flex items-center mt-2 text-xs text-gray-500 px-3">
      <ZapIcon class="h-3 w-3 mr-1 text-green-600" />
      <span>AI模型正在分析农业数据，可提供精准规划建议</span>
    </div>
  </div>
</template>

<script>
import { 
  Send as SendIcon,
  X as XIcon,
  Zap as ZapIcon
} from 'lucide-vue-next';

export default {
  name: 'ChatInput',
  components: {
    SendIcon,
    XIcon,
    ZapIcon
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    isTyping: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'send', 'stop-response'],
  methods: {
    handleSubmit() {
      if (!this.modelValue.trim() || this.isTyping) return;
      this.$emit('send');
    }
  }
}
</script>

<style scoped>
/* 输入框过渡效果 */
input {
  transition: all 0.3s ease;
}

input:focus {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

button {
  transition: all 0.2s ease;
}
</style> 
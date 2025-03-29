<template>
  <div class="border-t border-green-100 p-4 bg-white">
    <form @submit.prevent="handleSubmit" class="flex items-start gap-2">
      <div class="flex-1 relative">
        <textarea
          ref="inputRef"
          :value="modelValue"
          @input="handleInput"
          @keydown="handleKeyDown"
          @focus="isFocused = true"
          @blur="isFocused = false"
          placeholder="输入您的问题或需求..."
          class="w-full py-2 px-4 pr-12 bg-white border border-green-200 text-gray-800 rounded-2xl transition-all duration-200 resize-none overflow-hidden min-h-[44px]"
          :class="{ 'pb-10': isFocused && !isMobile && modelValue.length > 0 }"
          :disabled="isTyping"
          rows="1"
        ></textarea>
        <!-- 根据状态显示发送或停止按钮 -->
        <button 
          v-if="!isTyping"
          type="submit" 
          class="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 flex items-center justify-center transform transition-transform duration-200 hover:scale-105 active:scale-95"
          :disabled="!modelValue.trim()"
        >
          <SendIcon class="h-4 w-4" />
        </button>
        <button 
          v-else
          type="button"
          @click="$emit('stop-response')"
          class="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 flex items-center justify-center transform transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <XIcon class="h-4 w-4" />
        </button>
        
        <!-- 键盘快捷键提示 -->
        <div v-if="!isTyping && !isMobile" class="submit-hint">
          按 <kbd>Enter</kbd> 发送， <kbd>Shift+Enter</kbd> 换行
        </div>
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
import { ref, onMounted, nextTick } from 'vue';

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
  setup(props) {
    const inputRef = ref(null);
    const isMobile = ref(false);
    const isFocused = ref(false);
    
    // 检测是否为移动设备
    onMounted(() => {
      isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      nextTick(() => {
        adjustHeight();
      });
    });
    
    // 自动调整文本域高度
    const adjustHeight = () => {
      const textarea = inputRef.value;
      if (!textarea) return;
      
      // 重置高度，以便正确计算
      textarea.style.height = 'auto';
      
      // 计算文本内容高度
      let newHeight = Math.min(textarea.scrollHeight, 200);
      
      // 如果有提示，增加底部填充高度
      if (isFocused.value && !isMobile.value && props.modelValue.length > 0) {
        newHeight = Math.max(newHeight, 65); // 确保有足够空间显示提示
      }
      
      textarea.style.height = `${newHeight}px`;
    };
    
    return {
      inputRef,
      adjustHeight,
      isMobile,
      isFocused
    };
  },
  methods: {
    handleSubmit() {
      if (!this.modelValue.trim() || this.isTyping) return;
      this.$emit('send');
    },
    handleInput(e) {
      this.$emit('update:modelValue', e.target.value);
      this.adjustHeight();
    },
    handleKeyDown(e) {
      // 如果按下Enter键但没有按下Shift键
      if (e.key === 'Enter' && !e.shiftKey) {
        // 如果可以发送消息
        if (this.modelValue.trim() && !this.isTyping) {
          e.preventDefault(); // 阻止默认的换行
          this.handleSubmit();
        }
      }
    }
  },
  watch: {
    modelValue() {
      this.$nextTick(() => {
        this.adjustHeight();
      });
    },
    isFocused() {
      this.$nextTick(() => {
        this.adjustHeight();
      });
    }
  }
}
</script>

<style scoped>
/* 文本域样式 */
textarea {
  transition: all 0.3s ease;
  border-radius: 1rem !important; /* 确保圆角样式 */
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto; /* 超出部分显示滚动条 */
}

textarea:focus {
  box-shadow: 0 0 0 2px var(--primary-light) !important;
  border-color: var(--primary-border) !important;
  outline: none;
}

textarea:hover:not(:focus):not(:disabled) {
  border-color: var(--primary-hover);
}

textarea:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: rgba(249, 250, 251, 0.5);
}

/* 自定义滚动条样式 */
textarea::-webkit-scrollbar {
  width: 4px;
}

textarea::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}

/* 键盘Enter快捷键提示 */
.submit-hint {
  position: absolute;
  right: 3.5rem;
  bottom: 0.75rem;
  font-size: 0.65rem;
  color: #9ca3af;
  white-space: nowrap;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1px 4px;
  border-radius: 4px;
  backdrop-filter: blur(2px);
}

.submit-hint kbd {
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
  color: #374151;
  display: inline-block;
  font-size: 0.6rem;
  font-family: monospace;
  line-height: 1;
  padding: 1px 3px;
  margin: 0 1px;
  vertical-align: middle;
}

button {
  transition: all 0.2s ease;
  z-index: 10; /* 确保按钮在最上层 */
}
</style> 
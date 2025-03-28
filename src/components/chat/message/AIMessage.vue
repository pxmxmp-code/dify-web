<template>
  <div class="flex justify-start">
    <!-- AI头像 -->
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mr-3 mt-1 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" :class="'animate-pulse'"></div>
      <LeafIcon class="h-4 w-4 text-white" />
    </div>
    
    <!-- 消息气泡 -->
    <div class="max-w-[80%] bg-white text-gray-800 border border-green-100 rounded-2xl rounded-tl-sm shadow-md">
      <!-- 消息内容 -->
      <div class="px-5 py-4">
        <div class="text-sm markdown-content" v-html="renderedContent"></div>
      </div>
      
      <!-- 消息底部 -->
      <div class="flex items-center justify-between px-5 py-2 border-t border-green-100">
        <div class="flex items-center">
          <ClockIcon class="h-3 w-3 text-green-500" />
          <span class="text-xs ml-1 text-gray-500">
            {{ formatTime(message.timestamp) }}
          </span>
          
          <!-- 引用文档按钮 -->
          <button 
            v-if="message.hasReferences"
            class="ml-2 text-green-500 hover:text-green-600 transform transition-transform duration-200 hover:scale-110"
            @click="$emit('toggle-references', message.id)"
          >
            <FileTextIcon class="h-3 w-3" />
          </button>
        </div>
        
        <div class="flex items-center space-x-1">
          <!-- AI徽章 -->
          <div class="relative">
            <div class="absolute -inset-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full blur-[2px] opacity-70 animate-pulse"></div>
            <div class="relative flex items-center bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-full px-2 h-4">
              <SparklesIcon class="h-2.5 w-2.5 mr-0.5 text-green-600" />
              <span class="text-[10px] font-medium">AI</span>
            </div>
          </div>
          
          <!-- 反馈按钮 -->
          <FeedbackButtons 
            :feedback="message.feedback" 
            @feedback="(type) => $emit('feedback', message.id, type)" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { 
  Leaf as LeafIcon,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  Sparkles as SparklesIcon
} from 'lucide-vue-next';
import FeedbackButtons from './FeedbackButtons.vue';
import { useMarkdownRenderer } from '../../../composables/useMarkdownRenderer';

export default {
  name: 'AIMessage',
  components: {
    LeafIcon,
    ClockIcon,
    FileTextIcon,
    SparklesIcon,
    FeedbackButtons
  },
  props: {
    message: {
      type: Object,
      required: true
    },
    isReferenceShowing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-references', 'feedback'],
  setup(props) {
    const { renderMarkdown } = useMarkdownRenderer();
    
    const renderedContent = computed(() => {
      return renderMarkdown(props.message.content);
    });
    
    return {
      renderedContent
    };
  },
  methods: {
    formatTime(timestamp) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}
</script>

<style scoped>
/* AI消息容器的样式可在此添加 */
</style> 
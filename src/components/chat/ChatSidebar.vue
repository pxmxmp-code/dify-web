<template>
  <div class="w-72 border-r border-green-100 flex flex-col p-4 bg-white">
    <!-- 标题栏 -->
    <div class="flex items-center gap-2 mb-6 px-2">
      <div class="bg-green-600 p-2 rounded-lg">
        <LeafIcon class="h-5 w-5 text-white" />
      </div>
      <h1 class="text-lg font-semibold text-gray-800">农业规划 <span class="text-green-600">AI</span></h1>
    </div>
    
    <!-- 新对话按钮 -->
    <button 
      class="flex items-center justify-start mb-3 w-full py-2 px-4 bg-white border border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors duration-200 rounded-md"
      @click="$emit('new-chat')"
      :disabled="isCreatingChat"
      :class="{ 
        'transform hover:scale-[1.02] active:scale-[0.98]': !isCreatingChat,
        'opacity-50 cursor-not-allowed': isCreatingChat 
      }"
    >
      <PlusIcon class="h-4 w-4 mr-2" />
      {{ isCreatingChat ? '创建中...' : '新对话' }}
    </button>
    
    <!-- 会话列表 -->
    <div class="mb-6 flex-1 overflow-auto conversation-list">
      <h2 class="text-xs uppercase text-gray-500 font-semibold mb-2 px-2">最近对话</h2>
      <div class="space-y-1" v-if="recentConversations.length > 0">
        <div 
          v-for="conversation in recentConversations" 
          :key="conversation.id"
          class="flex w-full items-center group justify-between py-2 px-4 text-gray-600 hover:text-gray-900 hover:bg-green-50 transition-colors duration-200 rounded-md"
          :class="{ 
            'bg-green-50 text-green-700': conversation.id === conversationId 
          }"
        >
          <button 
            class="flex items-center flex-1 min-w-0 text-left transform hover:translate-x-1"
            @click="$emit('switch-conversation', conversation.id, conversation.name)"
          >
            <MessageSquareIcon class="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
            <span class="truncate">{{ conversation.name }}</span>
          </button>
          
          <button 
            class="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity duration-200 flex-shrink-0"
            @click="$emit('delete-conversation', conversation.id)"
          >
            <XIcon class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 text-xs py-4">
        暂无历史对话
      </div>
    </div>
    
    <!-- 状态面板 -->
    <div class="mt-auto">
      <div 
        class="bg-green-50 rounded-lg p-3 mb-3 border border-green-100 shadow-sm transition-all duration-200"
        :class="{ 'transform hover:-translate-y-0.5 hover:shadow-md': true }"
      >
        <div class="flex items-center gap-2 mb-2">
          <DatabaseIcon class="h-4 w-4 text-green-600" />
          <span class="text-xs font-medium text-gray-600">数据库状态</span>
          <span class="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">在线</span>
        </div>
        <div class="flex items-center gap-2">
          <ZapIcon class="h-4 w-4 text-green-600" />
          <span class="text-xs font-medium text-gray-600">模型版本</span>
          <span class="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">v2.5.1</span>
        </div>
      </div>
      <div class="text-xs text-gray-400 px-2">
        © 农业十五五规划 2025
      </div>
    </div>
  </div>
</template>

<script>
import { 
  Leaf as LeafIcon, 
  Plus as PlusIcon, 
  MessageSquare as MessageSquareIcon,
  Database as DatabaseIcon,
  Zap as ZapIcon,
  X as XIcon
} from 'lucide-vue-next';

export default {
  name: 'ChatSidebar',
  components: {
    LeafIcon,
    PlusIcon,
    MessageSquareIcon,
    DatabaseIcon,
    ZapIcon,
    XIcon
  },
  props: {
    recentConversations: {
      type: Array,
      required: true
    },
    conversationId: {
      type: String,
      default: ''
    },
    isCreatingChat: {
      type: Boolean,
      default: false
    }
  },
  emits: ['new-chat', 'switch-conversation', 'delete-conversation']
}
</script>

<style scoped>
/* 修复滚动条问题 */
.conversation-list {
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.conversation-list::-webkit-scrollbar {
  width: 4px;
}

.conversation-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}
</style> 
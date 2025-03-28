<template>
  <div class="flex h-screen bg-[#f8faf8]">
    <!-- 侧边栏组件 -->
    <ChatSidebar 
      :recent-conversations="recentConversations" 
      :conversation-id="conversationId"
      :is-creating-chat="isCreatingChat"
      @new-chat="startNewChat"
      @switch-conversation="switchConversation"
      @delete-conversation="deleteConversation"
    />
    
    <!-- 主内容部分 -->
    <div class="flex-1 flex flex-col">
      <!-- 标题栏 -->
      <div class="border-b border-green-100 p-4 bg-white">
        <h1 class="text-lg font-medium text-gray-800">农业十五五规划 AI</h1>
      </div>
      
      <!-- 消息区域 -->
      <div ref="messagesContainer" class="flex-1 overflow-auto p-6 space-y-6 bg-[#f8faf8]">
        <!-- 欢迎界面组件 -->
        <WelcomeScreen v-if="!conversationId" @start-new-chat="startNewChat" />
        
        <!-- 消息列表组件 -->
        <MessageList 
          v-else
          :messages="messages"
          :is-loading-history="isLoadingHistory"
          :is-typing="isTyping"
          :show-references="showReferences"
          :reference-documents="referenceDocuments"
          @toggle-references="toggleReferences"
          @feedback="handleFeedback"
        />
      </div>
      
      <!-- 输入组件 -->
      <ChatInput 
        v-if="conversationId"
        v-model="input"
        :is-typing="isTyping"
        @send="handleSendMessage"
        @stop-response="stopResponse"
      />
    </div>
  </div>
</template>

<script>
import { ref, watch, computed, onMounted } from 'vue';
import ChatSidebar from './chat/ChatSidebar.vue';
import MessageList from './chat/MessageList.vue';
import WelcomeScreen from './chat/WelcomeScreen.vue';
import ChatInput from './chat/ChatInput.vue';
import { useConversation } from '../composables/useConversation';
import { useMessages } from '../composables/useMessages';
import { useFeedback } from '../composables/useFeedback';

export default {
  name: 'AgriAIChat',
  components: {
    ChatSidebar,
    MessageList,
    WelcomeScreen,
    ChatInput
  },
  setup() {
    // 消息容器DOM引用
    const messagesContainer = ref(null);
    
    // 输入框内容
    const input = ref('');
    
    // 从组合式API中获取功能
    const { 
      conversationId, 
      recentConversations, 
      isCreatingChat,
      startNewChat, 
      switchConversation, 
      deleteConversation, 
      loadConversations,
      updateTempIdToReal
    } = useConversation();
    
    const { 
      messages, 
      isTyping, 
      isLoadingHistory,
      showReferences,
      referenceDocuments,
      handleSendMessage: sendMessage,
      loadHistoryMessages,
      stopResponse,
      toggleReferences
    } = useMessages(conversationId, loadConversations, updateTempIdToReal);
    
    const { handleFeedback } = useFeedback(messages);
    
    // 重新包装startNewChat函数，以确保消息列表在新对话时被正确重置
    const handleStartNewChat = async () => {
      const result = await startNewChat();
      
      // 无论返回结果如何，都清空消息列表，确保新会话为空白
      console.log('创建新会话，清空消息列表');
      messages.value = [];
      
      return result;
    };
    
    // 发送消息包装函数
    const handleSendMessage = () => {
      if (!input.value.trim() || isTyping.value) return;
      
      const message = input.value;
      input.value = '';
      
      sendMessage(message);
    };
    
    // 自动滚动到底部
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };
    
    // 监听消息变化和状态变化，自动滚动
    watch([messages, showReferences, isTyping], scrollToBottom);
    
    // 组件挂载时初始化
    onMounted(() => {
      scrollToBottom();
      
      // 初始化会话列表和历史消息
      loadConversations();
      if (conversationId.value) {
        loadHistoryMessages(conversationId.value);
      }
    });
    
    return {
      // 状态
      conversationId,
      recentConversations,
      messages,
      isCreatingChat,
      isTyping,
      isLoadingHistory,
      showReferences,
      referenceDocuments,
      input,
      messagesContainer,
      
      // 方法
      startNewChat: handleStartNewChat,
      switchConversation,
      deleteConversation,
      handleSendMessage,
      stopResponse,
      toggleReferences,
      handleFeedback
    };
  }
}
</script>

<style scoped>
/* 保留主要的全局样式，组件特定样式将移动到对应组件中 */
</style> 
<template>
  <div class="flex h-screen bg-[#f8faf8]">
    <!-- 侧边栏组件 -->
    <ChatSidebar 
      :recent-conversations="recentConversations" 
      :conversation-id="conversationId"
      :is-creating-chat="isCreatingChat"
      :is-responding="isAiResponding"
      @new-chat="startNewChat"
      @switch-conversation="handleSwitchConversation"
      @delete-conversation="handleDeleteConversation"
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
import { ref, watch, onMounted } from 'vue';
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
      startNewChat: apiStartNewChat, 
      switchConversation: apiSwitchConversation, 
      deleteConversation: apiDeleteConversation, 
      loadConversations,
      updateTempIdToReal
    } = useConversation();
    
    const { 
      messages, 
      isTyping, 
      isLoadingHistory,
      showReferences,
      referenceDocuments,
      isResponding,
      canSwitchConversation,
      handleSendMessage: sendMessage,
      loadHistoryMessages,
      stopResponse,
      toggleReferences
    } = useMessages(conversationId, loadConversations, updateTempIdToReal);
    
    const { handleFeedback } = useFeedback(messages);
    
    // 重命名isResponding为isAiResponding以避免与模板中的名称冲突
    const isAiResponding = isResponding;
    
    // 重新包装startNewChat函数，以确保消息列表在新对话时被正确重置
    const startNewChat = async () => {
      if (!canSwitchConversation()) {
        alert('请等待AI回复完成再创建新会话');
        return;
      }
      
      const result = await apiStartNewChat();
      
      // 无论返回结果如何，都清空消息列表，确保新会话为空白
      console.log('创建新会话，清空消息列表');
      messages.value = [];
      
      return result;
    };
    
    // 自定义会话切换处理函数
    const handleSwitchConversation = (convoId, name) => {
      if (!canSwitchConversation()) {
        alert('请等待AI回复完成再切换会话');
        return;
      }
      
      apiSwitchConversation(convoId, name);
    };
    
    // 自定义删除会话处理函数
    const handleDeleteConversation = (convoId) => {
      if (convoId === conversationId.value && !canSwitchConversation()) {
        alert('请等待AI回复完成再删除当前会话');
        return;
      }
      
      apiDeleteConversation(convoId);
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
        // 获取当前位置
        const currentScrollTop = messagesContainer.value.scrollTop;
        const currentScrollHeight = messagesContainer.value.scrollHeight;
        const containerHeight = messagesContainer.value.clientHeight;
        const scrollBottom = currentScrollTop + containerHeight;
        
        // 如果用户已经滚动到接近底部（距离底部不超过200px）或者是AI正在回复，就滚动到底部
        // 这样可以避免用户正在查看历史消息时被强制拉到底部
        const isNearBottom = currentScrollHeight - scrollBottom < 200;
        
        if (isNearBottom || isAiResponding.value) {
          // 立即滚动到底部，不使用平滑滚动，避免动画导致的闪烁问题
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
          
          // 对于AI响应中的情况，使用 RAF 确保在每一帧渲染后都滚动到底部
          if (isAiResponding.value) {
            requestAnimationFrame(() => {
              if (messagesContainer.value) {
                messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
              }
            });
          }
        }
      }
    };
    
    // 监听消息变化和状态变化，自动滚动
    watch([messages, showReferences, isTyping], scrollToBottom);
    
    // 监听消息内容变化，实现打字过程中的平滑滚动
    // 这里单独监听消息内容，因为流式响应中内容会不断更新但消息对象引用不变
    const lastMessageContent = ref('');
    
    watch(() => {
      // 获取最后一条消息的内容
      if (messages.value.length > 0) {
        return messages.value[messages.value.length - 1].content;
      }
      return '';
    }, (newContent) => {
      // 只有内容变长时才滚动（避免编辑或删除内容时的滚动）
      if (newContent && newContent.length > lastMessageContent.value.length) {
        lastMessageContent.value = newContent;
        scrollToBottom();
      } else {
        lastMessageContent.value = newContent;
      }
    });
    
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
      isAiResponding,
      isLoadingHistory,
      showReferences,
      referenceDocuments,
      input,
      messagesContainer,
      
      // 方法
      startNewChat,
      handleSwitchConversation,
      handleDeleteConversation,
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 平滑滚动 */
.overflow-auto {
  scroll-behavior: smooth;
}
</style> 
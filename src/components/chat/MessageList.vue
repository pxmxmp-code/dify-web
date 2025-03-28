<template>
  <div>
    <!-- 加载历史消息指示器 -->
    <div v-if="isLoadingHistory" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
    </div>
    
    <!-- 消息列表 -->
    <transition-group name="message">
      <div v-for="message in messages" :key="message.id" class="relative">
        <!-- 消息气泡 - 根据发送方决定使用哪个组件 -->
        <div v-if="message.sender === 'user'">
          <UserMessage 
            :message="message" 
            @toggle-references="$emit('toggle-references', message.id)" 
          />
        </div>
        <div v-else>
          <AIMessage 
            :message="message" 
            :is-reference-showing="showReferences === message.id"
            @toggle-references="$emit('toggle-references', message.id)"
            @feedback="handleFeedback"
          />
        </div>
        
        <!-- 引用文档面板 -->
        <ReferencesPanel 
          v-if="message.sender === 'ai' && showReferences === message.id"
          :documents="referenceDocuments"
          @close="$emit('toggle-references', null)"
        />
      </div>
    </transition-group>
    
    <!-- 打字指示器 -->
    <TypingIndicator v-if="isTyping" />
  </div>
</template>

<script>
import UserMessage from './message/UserMessage.vue';
import AIMessage from './message/AIMessage.vue';
import ReferencesPanel from './message/ReferencesPanel.vue';
import TypingIndicator from './message/TypingIndicator.vue';

export default {
  name: 'MessageList',
  components: {
    UserMessage,
    AIMessage,
    ReferencesPanel,
    TypingIndicator
  },
  props: {
    messages: {
      type: Array,
      required: true
    },
    isLoadingHistory: {
      type: Boolean,
      default: false
    },
    isTyping: {
      type: Boolean,
      default: false
    },
    showReferences: {
      type: [String, Number, null],
      default: null
    },
    referenceDocuments: {
      type: Array,
      default: () => []
    }
  },
  emits: ['toggle-references', 'feedback'],
  methods: {
    handleFeedback(messageId, type) {
      this.$emit('feedback', messageId, type);
    }
  }
}
</script>

<style scoped>
/* 消息动画 */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}
.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.message-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style> 
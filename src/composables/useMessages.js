import { ref, watch } from 'vue';
import agriAIApi from '../utils/api';
import storageService from '../utils/storage';

export function useMessages(conversationId, loadConversations, updateTempIdToReal) {
  // 状态变量
  const messages = ref([]);
  const isTyping = ref(false);
  const isLoadingHistory = ref(false);
  const showReferences = ref(null);
  const referenceDocuments = ref([]);
  const currentTaskId = ref('');
  
  // 标记是否正在进行ID更新，避免重复加载
  const isUpdatingId = ref(false);
  
  // 用户ID
  const userId = ref(storageService.getUserId());
  
  // 记录上一个ID，用于判断是否是从临时ID切换到真实ID
  let previousId = conversationId.value;
  
  // 发送消息
  const handleSendMessage = async (content) => {
    if (!content.trim() || isTyping.value) return;
    
    // 添加用户消息到界面
    const userMessage = {
      id: Date.now(),
      content,
      sender: "user",
      timestamp: new Date()
    };
    
    messages.value.push(userMessage);
    
    // 显示AI正在输入状态
    isTyping.value = true;
    
    try {
      // 准备收集AI回复的完整内容
      let fullAnswer = '';
      let messageId = '';
      
      // 定义流式响应处理回调
      const callbacks = {
        // 处理消息块
        message: (data) => {
          // 收到第一个消息块时，隐藏波点，显示AI回复框
          if (isTyping.value) {
            isTyping.value = false;
            messageId = data.message_id;
            messages.value.push({
              id: messageId || Date.now(),
              content: data.answer || '',  // 初始内容为第一个块的内容
              sender: "ai",
              timestamp: new Date(),
              hasReferences: false
            });
            fullAnswer = data.answer || '';
          } else {
            // 后续消息块，更新最后一条消息内容
            fullAnswer += data.answer;
            const lastMessage = messages.value[messages.value.length - 1];
            if (lastMessage.sender === 'ai') {
              lastMessage.content = fullAnswer;
            }
          }
          
          currentTaskId.value = data.task_id;
          
          // 处理会话ID
          handleConversationId(data.conversation_id);
        },
        
        // 处理消息结束
        message_end: (data) => {
          // 确保波点已隐藏
          isTyping.value = false;
          currentTaskId.value = '';
          
          // 处理引用资源
          handleReferences(data);
        },
        
        // 处理错误
        error: (data) => {
          console.error('API错误:', data);
          isTyping.value = false;
          // 显示错误消息
          messages.value.push({
            id: Date.now(),
            content: `发生错误: ${data.message}`,
            sender: "ai",
            timestamp: new Date(),
            hasReferences: false
          });
        }
      };
      
      // 准备API请求参数
      const params = {
        query: content,
        user: userId.value,
        response_mode: 'streaming'
      };
      
      // 只有在有效的UUID时才添加会话ID
      // 如果是临时ID（以local-开头），不传递给API
      if (conversationId.value && 
          !conversationId.value.toString().startsWith('local-') &&
          isValidUUID(conversationId.value)) {
        params.conversation_id = conversationId.value;
      }
      
      // 发送消息到API
      await agriAIApi.sendChatMessage(params, callbacks);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      isTyping.value = false;
      // 显示错误消息
      messages.value.push({
        id: Date.now(),
        content: `发送消息失败: ${error.message}`,
        sender: "ai",
        timestamp: new Date(),
        hasReferences: false
      });
    }
  };
  
  // 处理会话ID
  const handleConversationId = (newId) => {
    if (!newId) return;
    
    // 如果当前ID已经是这个ID，不做任何处理
    if (conversationId.value === newId) return;
    
    // 检查当前ID是否是临时ID
    const isCurrentIdTemporary = conversationId.value && 
                               conversationId.value.toString().startsWith('local-');
    
    // 检查是否有消息内容（表明这是当前正在进行的会话）
    const hasMessages = messages.value.length > 0;
    
    // 如果当前是临时ID、有消息内容（表明是当前会话）、且收到了真实ID，才执行ID替换
    // 这确保只有在用户发送第一条消息后收到服务器响应时才会替换ID
    if (isCurrentIdTemporary && hasMessages && isValidUUID(newId)) {
      // 记录原始的临时ID
      const oldTempId = conversationId.value;
      
      console.log(`替换临时ID ${oldTempId} 为真实ID ${newId}`);
      
      // 使用updateTempIdToReal函数无感更新ID
      if (typeof updateTempIdToReal === 'function') {
        // 使用这个函数将临时ID更新为真实ID，同时从会话列表中移除临时会话
        updateTempIdToReal(oldTempId, newId);
      } else {
        // 如果没有提供updateTempIdToReal函数，则按原来的方式更新
        conversationId.value = newId;
        storageService.saveConversationId(newId);
        
        // 延迟更新会话列表
        setTimeout(() => {
          if (typeof loadConversations === 'function') {
            loadConversations();
          }
        }, 0);
      }
    }
  };
  
  // 处理引用资源
  const handleReferences = (data) => {
    if (data.metadata && data.metadata.retriever_resources) {
      referenceDocuments.value = data.metadata.retriever_resources;
      
      // 更新最后一条AI消息，添加引用标记
      if (messages.value.length > 0) {
        const lastMessage = messages.value[messages.value.length - 1];
        if (lastMessage.sender === 'ai') {
          lastMessage.hasReferences = true;
        }
      }
    }
  };
  
  // 加载历史消息
  const loadHistoryMessages = async (convoId) => {
    // 如果ID无效，则显示默认问候消息
    if (!convoId || !isValidUUID(convoId)) {
      console.log('会话ID无效或为空，不加载历史消息:', convoId);
      showDefaultGreeting();
      return;
    }
    
    try {
      isLoadingHistory.value = true;
      
      // 开始加载前先清空消息列表，避免显示之前的消息
      messages.value = [];
      
      const { data } = await agriAIApi.getMessages(convoId, userId.value);
      
      if (data && data.data && data.data.length > 0) {
        // 按时间顺序添加消息
        data.data.sort((a, b) => a.created_at - b.created_at).forEach(msg => {
          // 用户消息
          if (msg.query) {
            messages.value.push({
              id: msg.id,
              content: msg.query || '',
              sender: 'user',
              timestamp: new Date(msg.created_at * 1000),
              hasReferences: false
            });
          }
          
          // AI回复
          if (msg.answer) {
            messages.value.push({
              id: msg.id + '-response',
              content: msg.answer,
              sender: 'ai',
              timestamp: new Date(msg.created_at * 1000),
              hasReferences: msg.retriever_resources && msg.retriever_resources.length > 0,
              feedback: msg.feedback ? msg.feedback.rating : null
            });
          }
        });
      } else {
        // 如果没有历史消息，显示默认的问候消息
        showDefaultGreeting();
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
      showDefaultGreeting();
    } finally {
      isLoadingHistory.value = false;
    }
  };
  
  // 显示默认问候消息
  const showDefaultGreeting = () => {
    messages.value = [];
  };
  
  // 切换引用面板
  const toggleReferences = (messageId) => {
    if (showReferences.value === messageId) {
      showReferences.value = null;
    } else {
      showReferences.value = messageId;
    }
  };
  
  // 停止AI响应
  const stopResponse = async () => {
    if (currentTaskId.value) {
      try {
        await agriAIApi.stopResponse(currentTaskId.value, userId.value);
        isTyping.value = false;
        currentTaskId.value = '';
      } catch (error) {
        console.error('停止响应失败:', error);
      }
    }
  };
  
  // 监听conversationId的变化
  watch(conversationId, (newId, oldId) => {
    console.log(`对话ID变更: ${oldId} -> ${newId}`);
    
    // 如果新ID为空，直接返回
    if (!newId) return;
    
    // 检查ID变化类型
    const isFromTempToReal = oldId?.startsWith('local-') && isValidUUID(newId);
    const isNewTempChat = newId?.startsWith('local-');
    const isExistingChat = isValidUUID(newId);
    
    // 如果是从临时ID更新为真实ID，保留当前消息状态
    if (isFromTempToReal && messages.value.length > 0) {
      console.log(`从临时ID更新为真实ID: ${oldId} -> ${newId}, 保留当前消息状态`);
      // 不重新加载消息，保持当前状态
      return;
    }
    
    // 处理新的临时聊天（清空消息）
    if (isNewTempChat) {
      console.log(`切换到新的临时对话: ${newId}, 清空消息列表`);
      messages.value = [];
      return;
    }
    
    // 处理现有的聊天（加载历史消息）
    if (isExistingChat) {
      console.log(`切换到现有对话: ${newId}, 加载历史消息`);
      loadHistoryMessages(newId);
    }
  });
  
  // 辅助函数：检查是否是有效的UUID
  function isValidUUID(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }
  
  return {
    messages,
    isTyping,
    isLoadingHistory,
    showReferences,
    referenceDocuments,
    handleSendMessage,
    loadHistoryMessages,
    stopResponse,
    toggleReferences
  };
} 
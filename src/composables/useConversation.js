import { ref } from 'vue';
import agriAIApi from '../utils/api';
import storageService from '../utils/storage';

export function useConversation() {
  // 获取用户ID和会话ID
  const userId = ref(storageService.getUserId());
  const conversationId = ref(storageService.getConversationId() || '');
  
  // 会话状态
  const recentConversations = ref(storageService.getRecentConversations());
  const isCreatingChat = ref(false);
  
  // 创建新会话
  const startNewChat = async () => {
    // 如果正在创建，防止重复点击
    if (isCreatingChat.value) return;
    
    // 设置创建状态为true，禁用按钮
    isCreatingChat.value = true;
    
    try {
      // 生成临时ID，用于前端显示，使用prefix确保容易识别
      const tempId = 'local-' + Date.now();
      
      // 更新会话ID（仅用于前端显示，不传给API）
      conversationId.value = tempId;
      
      // 注意不要保存临时ID到本地存储，避免页面刷新后尝试使用它
      // 但我们需要清除之前的会话ID
      storageService.saveConversationId('');
      
      // 获取当前会话ID（保存临时变量）
      const oldConversationId = storageService.getConversationId();
      
      // 立即更新会话列表的选中状态
      if (oldConversationId) {
        // 使用新数组替换，触发Vue响应式更新
        recentConversations.value = recentConversations.value.map(conv => ({
          ...conv,
          selected: false // 清除所有选中状态
        }));
      }
      
      // 创建临时会话对象，添加到列表中
      const tempConversation = {
        id: tempId,
        name: '新会话',
        updated_at: Math.floor(Date.now() / 1000)
      };
      
      // 将临时会话添加到列表顶部
      recentConversations.value = [tempConversation, ...recentConversations.value];
      
      // 关闭创建状态
      isCreatingChat.value = false;
      
      return {
        conversationId: tempId,
        isNewChat: true // 标记这是新对话，用于接收方判断是否要重置消息
      };
    } catch (error) {
      console.error('创建新会话失败:', error);
      isCreatingChat.value = false;
    }
  };
  
  // 切换会话
  const switchConversation = async (convoId, name) => {
    if (conversationId.value === convoId) return;
    
    // 检查是否是有效的UUID或临时ID
    // 临时ID以local-开头，允许切换
    if (!convoId.toString().startsWith('local-') && 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(convoId)) {
      console.warn('会话ID格式无效，无法切换:', convoId);
      return;
    }
    
    conversationId.value = convoId;
    
    // 只有真实会话ID才保存到本地存储
    if (!convoId.toString().startsWith('local-')) {
      storageService.saveConversationId(convoId);
    } else {
      // 临时ID不保存到本地存储，清空存储的会话ID
      storageService.saveConversationId('');
    }
    
    return convoId;
  };
  
  // 将临时ID更新为真实ID并从会话列表中移除临时会话
  const updateTempIdToReal = (tempId, realId, sessionName = null) => {
    if (!tempId || !realId) return;
    
    console.log(`将临时ID ${tempId} 更新为真实ID ${realId}`);
    
    // 从会话列表中找到临时会话
    const tempConversationIndex = recentConversations.value.findIndex(conv => conv.id === tempId);
    
    if (tempConversationIndex !== -1) {
      // 获取临时会话对象
      const tempConversation = recentConversations.value[tempConversationIndex];
      
      // 创建对应的真实会话对象
      const realConversation = {
        id: realId,
        name: sessionName || tempConversation.name,
        updated_at: Math.floor(Date.now() / 1000)
      };
      
      // 直接修改会话ID，避免多余的切换
      conversationId.value = realId;
      
      // 保存到本地存储
      storageService.saveConversationId(realId);
      
      // 从会话列表中移除临时会话，并添加真实会话
      recentConversations.value.splice(tempConversationIndex, 1);
      recentConversations.value.unshift(realConversation);
      
      // 延迟加载会话列表，避免UI闪烁
      setTimeout(() => {
        loadConversations();
      }, 300);
      
      return true;
    }
    
    return false;
  };
  
  // 删除会话
  const deleteConversation = async (convoId) => {
    try {
      // 如果是临时ID，只需要从UI移除
      if (convoId.toString().startsWith('local-')) {
        // 更新会话列表
        recentConversations.value = recentConversations.value.filter(conv => conv.id !== convoId);
        
        // 如果删除的是当前会话
        if (conversationId.value === convoId) {
          handleAfterDelete();
        }
        return;
      }
      
      // 检查是否是有效的UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(convoId)) {
        console.warn('会话ID不是有效的UUID格式，无法删除:', convoId);
        return;
      }
      
      // 记录是否是当前会话
      const isCurrentConversation = conversationId.value === convoId;
      
      // 发送API请求
      await agriAIApi.deleteConversation(convoId, userId.value);
      
      // 从本地存储中删除
      storageService.removeConversation(convoId);
      
      // 更新会话列表
      recentConversations.value = recentConversations.value.filter(conv => conv.id !== convoId);
      
      // 如果删除的是当前会话
      if (isCurrentConversation) {
        handleAfterDelete();
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };
  
  // 删除会话后的处理逻辑
  const handleAfterDelete = () => {
    // 检查是否还有其他会话
    if (recentConversations.value.length > 0) {
      // 切换到列表中的第一个会话
      const nextConversation = recentConversations.value[0];
      switchConversation(nextConversation.id, nextConversation.name);
    } else {
      // 如果没有其他会话，清空当前会话ID
      conversationId.value = '';
      storageService.saveConversationId('');
    }
  };
  
  // 加载会话列表
  const loadConversations = async () => {
    try {
      const { data } = await agriAIApi.getConversations(userId.value);
      
      if (data && data.data) {
        // 确保获取最新的对话列表，避免重复
        const uniqueConversations = [];
        const conversationIds = new Set();
        
        // 转换数据并确保唯一性
        data.data.forEach(convo => {
          if (!conversationIds.has(convo.id)) {
            conversationIds.add(convo.id);
            uniqueConversations.push({
              id: convo.id,
              name: convo.name,
              updated_at: convo.updated_at
            });
          }
        });
        
        // 按更新时间排序（最新的在前）
        uniqueConversations.sort((a, b) => b.updated_at - a.updated_at);
        
        // 找出当前所有临时会话（以local-开头）
        const tempConversations = recentConversations.value.filter(conv => 
          conv.id.toString().startsWith('local-')
        );
        
        // 获取当前选中的会话ID
        const currentId = conversationId.value;
        
        // 合并临时会话和服务器返回的会话
        const mergedConversations = [...tempConversations, ...uniqueConversations];
        
        // 更新到本地存储（只存储真实会话）
        storageService.saveRecentConversations(uniqueConversations);
        
        // 更新UI显示（包括临时会话）
        recentConversations.value = mergedConversations;
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  };
  
  // 初始化，获取应用参数
  const initApp = async () => {
    try {
      // 获取应用参数
      const { data } = await agriAIApi.getParameters(userId.value);
      
      // 不再缓存introduction
    } catch (error) {
      console.error('初始化应用失败:', error);
    }
  };
  
  // 初始化
  initApp();
  
  return {
    // 状态
    userId,
    conversationId,
    recentConversations,
    isCreatingChat,
    
    // 方法
    startNewChat,
    switchConversation,
    deleteConversation,
    loadConversations,
    updateTempIdToReal
  };
} 
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
      // 使用已缓存的introduction或默认问候语
      const cachedIntroduction = localStorage.getItem('cached_introduction') || 
        "您好，我是农业十五五规划AI助手。我可以帮助您分析数据、制定规划方案、预测趋势和提供政策建议。";
      
      // 创建临时会话
      const tempId = 'temp-' + Date.now();
      const tempConversation = {
        id: tempId,
        name: '新会话',
        updated_at: Math.floor(Date.now() / 1000)
      };
      
      // 保存临时会话ID
      conversationId.value = tempId;
      
      // 获取当前会话ID（保存临时变量）
      const oldConversationId = storageService.getConversationId();
      
      // 清空存储的会话ID
      storageService.saveConversationId('');
      
      // 立即更新会话列表的选中状态
      if (oldConversationId) {
        // 使用新数组替换，触发Vue响应式更新
        recentConversations.value = recentConversations.value.map(conv => ({
          ...conv,
          selected: false // 清除所有选中状态
        }));
      }
      
      // 将临时会话添加到列表顶部
      recentConversations.value = [tempConversation, ...recentConversations.value];
      
      // 关闭创建状态
      isCreatingChat.value = false;
      
      // 返回临时ID和问候语，供调用者更新UI
      return {
        conversationId: tempId,
        greeting: cachedIntroduction
      };
    } catch (error) {
      console.error('创建新会话失败:', error);
      isCreatingChat.value = false;
      return null;
    }
  };
  
  // 切换会话
  const switchConversation = async (convoId, name) => {
    if (conversationId.value === convoId) return;
    
    // 不要尝试切换到临时ID的会话
    if (convoId.toString().startsWith('temp-')) {
      console.warn('不能切换到临时会话:', convoId);
      return;
    }
    
    // 检查是否是有效的UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(convoId)) {
      console.warn('会话ID不是有效的UUID格式，无法切换:', convoId);
      return;
    }
    
    conversationId.value = convoId;
    storageService.saveConversationId(convoId);
    
    return convoId;
  };
  
  // 删除会话
  const deleteConversation = async (convoId) => {
    try {
      // 如果是临时ID，仅从UI中移除，不发送API请求
      if (convoId.toString().startsWith('temp-')) {
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
        
        // 找出当前可能存在的临时会话
        const tempConversations = recentConversations.value.filter(conv => 
          conv.id.toString().startsWith('temp-')
        );
        
        // 合并临时会话和服务器返回的会话列表
        const mergedConversations = [...tempConversations, ...uniqueConversations];
        
        // 更新到本地存储
        storageService.saveRecentConversations(uniqueConversations); // 只保存真实会话到存储
        recentConversations.value = mergedConversations; // UI显示包括临时会话
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
      
      // 缓存introduction，供后续使用
      if (data && data.introduction) {
        localStorage.setItem('cached_introduction', data.introduction);
      }
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
    loadConversations
  };
} 
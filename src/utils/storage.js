/**
 * 存储服务 - 负责本地数据的存储和读取
 */

// 存储键名
const STORAGE_KEYS = {
  USER_ID: 'agri_ai_user_id',
  CONVERSATION_ID: 'agri_ai_conversation_id',
  RECENT_CONVERSATIONS: 'agri_ai_recent_conversations'
};

/**
 * 获取或创建用户ID
 * @returns {string} 用户ID
 */
export const getUserId = () => {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  if (!userId) {
    userId = 'user-' + Date.now();
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  
  return userId;
};

/**
 * 获取当前会话ID
 * @returns {string|null} 会话ID，如果没有则返回null
 */
export const getConversationId = () => {
  return localStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
};

/**
 * 保存当前会话ID
 * @param {string} conversationId 会话ID
 */
export const saveConversationId = (conversationId) => {
  if (conversationId) {
    localStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, conversationId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATION_ID);
  }
};

/**
 * 获取最近的会话列表
 * @returns {Array} 会话列表
 */
export const getRecentConversations = () => {
  const conversationsJson = localStorage.getItem(STORAGE_KEYS.RECENT_CONVERSATIONS);
  return conversationsJson ? JSON.parse(conversationsJson) : [];
};

/**
 * 保存最近的会话列表
 * @param {Array} conversations 会话列表
 */
export const saveRecentConversations = (conversations) => {
  localStorage.setItem(STORAGE_KEYS.RECENT_CONVERSATIONS, JSON.stringify(conversations));
};

/**
 * 添加或更新一个会话到最近列表
 * @param {Object} conversation 会话对象
 */
export const addOrUpdateConversation = (conversation) => {
  if (!conversation || !conversation.id) return;
  
  const conversations = getRecentConversations();
  const index = conversations.findIndex(item => item.id === conversation.id);
  
  if (index >= 0) {
    // 更新现有会话
    conversations[index] = { ...conversations[index], ...conversation };
  } else {
    // 添加新会话
    conversations.unshift(conversation);
    
    // 最多保存10个最近会话
    if (conversations.length > 10) {
      conversations.pop();
    }
  }
  
  saveRecentConversations(conversations);
};

/**
 * 从最近列表中删除一个会话
 * @param {string} conversationId 会话ID
 */
export const removeConversation = (conversationId) => {
  if (!conversationId) return;
  
  const conversations = getRecentConversations();
  const filtered = conversations.filter(item => item.id !== conversationId);
  
  saveRecentConversations(filtered);
  
  // 如果删除的是当前会话，也清除当前会话ID
  if (getConversationId() === conversationId) {
    saveConversationId(null);
  }
};

export default {
  getUserId,
  getConversationId,
  saveConversationId,
  getRecentConversations,
  saveRecentConversations,
  addOrUpdateConversation,
  removeConversation
}; 
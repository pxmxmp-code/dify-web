import axios from 'axios';

// 从环境变量获取配置
const API_URL = import.meta.env.VITE_API_URL || 'http://193.112.190.60/v1';
const API_KEY = import.meta.env.VITE_API_KEY || 'app-tGFAlJQY860J7QBTsmZFrZTp';
const DEFAULT_INPUTS = import.meta.env.VITE_DEFAULT_INPUTS ? JSON.parse(import.meta.env.VITE_DEFAULT_INPUTS) : {};

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// 农业AI API服务类
class AgriAIApi {
  constructor() {
    this.apiClient = apiClient;
  }

  // 处理SSE流式响应
  handleStreamResponse(response, callbacks) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processChunk = ({ done, value }) => {
      if (done) {
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop();

      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (callbacks[data.event]) {
              callbacks[data.event](data);
            }
          } catch (e) {
            console.error('解析SSE数据失败:', e);
          }
        }
      });

      reader.read().then(processChunk);
    };

    reader.read().then(processChunk);
  }

  /**
   * 发送对话消息
   * @param {Object} params 请求参数
   * @param {string} params.query 用户输入/提问内容
   * @param {Object} params.inputs 允许传入App定义的各变量值
   * @param {string} params.response_mode 响应模式：streaming 或 blocking
   * @param {string} params.user 用户标识
   * @param {string} params.conversation_id 会话ID
   * @param {Array} params.files 文件列表
   * @param {boolean} params.auto_generate_name 是否自动生成标题
   * @param {Object} callbacks 回调函数集合，用于流式响应
   * @returns {Promise} 请求结果
   */
  async sendChatMessage(params, callbacks = {}) {
    const defaults = {
      inputs: DEFAULT_INPUTS,
      response_mode: 'streaming',
      user: 'user-' + Date.now(),
      auto_generate_name: true
    };

    const data = { ...defaults, ...params };

    if (data.response_mode === 'streaming') {
      const response = await fetch(`${API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`发送消息失败: ${response.status} ${errorText}`);
      }

      this.handleStreamResponse(response, callbacks);
      return null;
    } else {
      return this.apiClient.post('/chat-messages', data);
    }
  }

  /**
   * 上传文件
   * @param {File} file 要上传的文件
   * @param {string} user 用户标识
   * @returns {Promise} 上传结果
   */
  async uploadFile(file, user) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);

    return this.apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * 停止响应
   * @param {string} taskId 任务ID
   * @param {string} user 用户标识
   * @returns {Promise} 请求结果
   */
  async stopResponse(taskId, user) {
    return this.apiClient.post(`/chat-messages/${taskId}/stop`, { user });
  }

  /**
   * 消息反馈（点赞/点踩）
   * @param {string} messageId 消息ID
   * @param {string} rating 反馈类型：like, dislike, null(撤销)
   * @param {string} user 用户标识
   * @param {string} content 反馈具体信息
   * @returns {Promise} 请求结果
   */
  async feedbackMessage(messageId, rating, user, content = '') {
    return this.apiClient.post(`/messages/${messageId}/feedbacks`, {
      rating,
      user,
      content
    });
  }

  /**
   * 获取下一轮建议问题列表
   * @param {string} messageId 消息ID
   * @param {string} user 用户标识
   * @returns {Promise} 请求结果
   */
  async getSuggestedQuestions(messageId, user) {
    return this.apiClient.get(`/messages/${messageId}/suggested`, {
      params: { user }
    });
  }

  /**
   * 获取会话历史消息
   * @param {string} conversationId 会话ID
   * @param {string} user 用户标识
   * @param {string} firstId 当前页第一条记录ID
   * @param {number} limit 一次请求返回的记录数
   * @returns {Promise} 请求结果
   */
  async getMessages(conversationId, user, firstId = null, limit = 20) {
    return this.apiClient.get('/messages', {
      params: {
        conversation_id: conversationId,
        user,
        first_id: firstId,
        limit
      }
    });
  }

  /**
   * 获取会话列表
   * @param {string} user 用户标识
   * @param {string} lastId 当前页最后一条记录ID
   * @param {number} limit 一次请求返回的记录数
   * @param {string} sortBy 排序字段
   * @returns {Promise} 请求结果
   */
  async getConversations(user, lastId = null, limit = 20, sortBy = '-updated_at') {
    return this.apiClient.get('/conversations', {
      params: {
        user,
        last_id: lastId,
        limit,
        sort_by: sortBy
      }
    });
  }

  /**
   * 删除会话
   * @param {string} conversationId 会话ID
   * @param {string} user 用户标识
   * @returns {Promise} 请求结果
   */
  async deleteConversation(conversationId, user) {
    return this.apiClient.delete(`/conversations/${conversationId}`, {
      data: { user }
    });
  }

  /**
   * 会话重命名
   * @param {string} conversationId 会话ID
   * @param {string} name 新名称
   * @param {boolean} autoGenerate 是否自动生成标题
   * @param {string} user 用户标识
   * @returns {Promise} 请求结果
   */
  async renameConversation(conversationId, name, user, autoGenerate = false) {
    return this.apiClient.post(`/conversations/${conversationId}/name`, {
      name,
      auto_generate: autoGenerate,
      user
    });
  }

  /**
   * 语音转文字
   * @param {File} audioFile 语音文件
   * @param {string} user 用户标识
   * @returns {Promise} 请求结果
   */
  async audioToText(audioFile, user) {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('user', user);

    return this.apiClient.post('/audio-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * 文字转语音
   * @param {Object} params 请求参数
   * @param {string} params.messageId 消息ID
   * @param {string} params.text 文本内容
   * @param {string} params.user 用户标识
   * @returns {Promise} 请求结果
   */
  async textToAudio(params) {
    const { messageId, text, user } = params;
    
    return this.apiClient.post('/text-to-audio', {
      message_id: messageId,
      text,
      user
    }, {
      responseType: 'blob'
    });
  }

  /**
   * 获取应用基本信息
   * @returns {Promise} 请求结果
   */
  async getAppInfo() {
    return this.apiClient.get('/info');
  }

  /**
   * 获取应用参数
   * @param {string} user 用户标识
   * @returns {Promise} 请求结果
   */
  async getParameters(user = '') {
    const params = user ? { user } : {};
    return this.apiClient.get('/parameters', { params });
  }

  /**
   * 获取应用Meta信息
   * @returns {Promise} 请求结果
   */
  async getMeta() {
    return this.apiClient.get('/meta');
  }
}

// 导出单例实例
const agriAIApi = new AgriAIApi();

export default agriAIApi; 
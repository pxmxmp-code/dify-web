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
  // 新增：标记AI是否正在响应（包括正在输入和其他处理过程）
  const isResponding = ref(false);
  
  // 标记是否正在进行ID更新，避免重复加载
  const isUpdatingId = ref(false);
  
  // 用户ID
  const userId = ref(storageService.getUserId());
  
  // 记录上一个ID，用于判断是否是从临时ID切换到真实ID
  let previousId = conversationId.value;
  
  // 发送消息
  const handleSendMessage = async (content) => {
    if (!content.trim() || isResponding.value) return;
    
    // 添加用户消息到界面
    const userMessage = {
      id: Date.now(),
      content,
      sender: "user",
      timestamp: new Date()
    };
    
    messages.value.push(userMessage);
    
    // 显示AI正在输入状态和响应状态
    isTyping.value = true;
    isResponding.value = true;
    
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
            
            // 检查并处理回答中的引用文档内容
            const { cleanedAnswer, extractedReferences } = extractReferencesFromAnswer(data.answer || '');
            
            // 计算引用文档数量并判断是否真的有引用文档
            const extractedDocs = extractedReferences ? processExtractedReferences(extractedReferences) : [];
            const hasRealReferences = extractedDocs.length > 0;
            const extractedReferencesCount = extractedDocs.length;
            
            messages.value.push({
              id: messageId || Date.now(),
              content: cleanedAnswer,  // 使用清理后的内容
              sender: "ai",
              timestamp: new Date(),
              hasReferences: hasRealReferences,
              referencesCount: hasRealReferences ? extractedReferencesCount : 0
            });
            
            // 如果确实提取到了引用文档内容，则更新引用文档
            if (hasRealReferences) {
              referenceDocuments.value = extractedDocs;
            }
            
            fullAnswer = cleanedAnswer;
          } else {
            // 对于后续消息块，也需要处理可能包含的引用文档内容
            const { cleanedAnswer, extractedReferences } = extractReferencesFromAnswer(data.answer || '');
            
            // 后续消息块，更新最后一条消息内容
            fullAnswer += cleanedAnswer;
            const lastMessage = messages.value[messages.value.length - 1];
            if (lastMessage.sender === 'ai') {
              lastMessage.content = fullAnswer;
              
              // 如果在中间消息块中发现引用文档，也需要先检查是否真的有引用文档
              if (extractedReferences) {
                const extractedDocs = processExtractedReferences(extractedReferences);
                const hasRealReferences = extractedDocs.length > 0;
                
                // 只有真的有引用文档时才更新状态
                if (hasRealReferences && !lastMessage.hasReferences) {
                  lastMessage.hasReferences = true;
                  lastMessage.referencesCount = extractedDocs.length;
                  referenceDocuments.value = extractedDocs;
                }
              }
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
          isResponding.value = false;  // 设置响应结束状态
          currentTaskId.value = '';
          
          // 处理引用资源
          handleReferences(data);
        },
        
        // 处理错误
        error: (data) => {
          console.error('API错误:', data);
          isTyping.value = false;
          isResponding.value = false;  // 错误时也需要结束响应状态
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
      isResponding.value = false;  // 捕获到错误时也需要结束响应状态
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
    if (data.metadata && data.metadata.retriever_resources && data.metadata.retriever_resources.length > 0) {
      // 只有在有实际引用资源时才处理
      // 如果之前已经从回复中提取了引用内容，则与API返回的资源合并
      let totalReferencesCount = 0;
      
      if (referenceDocuments.value.length > 0) {
        const apiResources = data.metadata.retriever_resources.map(resource => {
          return {
            ...resource,
            fromApi: true // 标记来源于API的资源
          };
        });
        referenceDocuments.value = [...referenceDocuments.value, ...apiResources];
        totalReferencesCount = referenceDocuments.value.length;
      } else {
        referenceDocuments.value = data.metadata.retriever_resources;
        totalReferencesCount = data.metadata.retriever_resources.length;
      }
      
      // 更新最后一条AI消息，添加引用标记和数量
      if (messages.value.length > 0) {
        const lastMessage = messages.value[messages.value.length - 1];
        if (lastMessage.sender === 'ai') {
          lastMessage.hasReferences = true;
          
          // 如果已经设置了引用数量，则累加API引用数量
          if (lastMessage.referencesCount) {
            lastMessage.referencesCount += data.metadata.retriever_resources.length;
          } else {
            lastMessage.referencesCount = totalReferencesCount;
          }
        }
      }
    }
  };
  
  // 提取回复中的引用文档内容
  const extractReferencesFromAnswer = (answer) => {
    // 检查是否包含"# 农业知识参考资料"标记
    const referenceMarker = "# 农业知识参考资料";
    const index = answer.indexOf(referenceMarker);
    
    if (index === -1) {
      // 没有找到引用标记，返回原始回答
      return { cleanedAnswer: answer, extractedReferences: null };
    }
    
    // 分离回答内容和引用文档
    const cleanedAnswer = answer.substring(0, index).trim();
    const extractedReferences = answer.substring(index).trim();
    
    // 检查提取的引用文档是否包含"没有找到与您问题相关的信息"
    if (extractedReferences.includes("很抱歉，没有找到与您问题相关的信息")) {
      // 有引用文档标记但内容是没有找到相关信息，返回清理后的回答但标记为无引用
      return { cleanedAnswer, extractedReferences: null };
    }
    
    return { cleanedAnswer, extractedReferences };
  };
  
  // 处理提取的引用文档，转换为结构化数据
  const processExtractedReferences = (referencesText) => {
    // 分析引用文档文本，将其转换为结构化数据
    const references = [];
    
    // 如果引用为空或者包含"没有找到相关信息"的文本，返回空数组
    if (!referencesText || referencesText.includes("很抱歉，没有找到与您问题相关的信息")) {
      return references;
    }
    
    // 使用正则表达式匹配各个部分
    const sections = referencesText.split(/^## /m).filter(Boolean);
    
    // 第一个部分应该是标题"农业知识参考资料"，可以跳过或单独处理
    if (sections.length > 0) {
      const headerSection = sections[0];
      if (headerSection.trim() === "农业知识参考资料") {
        sections.shift(); // 移除标题部分
      }
    }
    
    // 如果没有实际章节，返回空数组
    if (sections.length === 0) {
      return references;
    }
    
    // 处理各个部分
    for (const section of sections) {
      // 提取部分标题和内容
      const sectionTitleMatch = section.match(/^(.+?)\n\n([\s\S]+)/);
      
      if (sectionTitleMatch) {
        const [, sectionTitle, sectionContent] = sectionTitleMatch;
        
        // 使用正则表达式匹配各个文档条目
        const itemRegex = /---\n\*\*文档\*\*: ([^\n]+)(?:\n\*\*来源\*\*: ([^\n]+))?(?:\n\*\*相关度\*\*: ([^\n]+))?\n\n([\s\S]+?)(?=\n---|\n$|$)/g;
        
        let match;
        while ((match = itemRegex.exec(sectionContent)) !== null) {
          const [, documentName, datasetName, score, content] = match;
          
          references.push({
            document_name: documentName.trim(),
            dataset_name: datasetName ? datasetName.trim() : "农业知识库",
            score: score ? parseFloat(score) : 1.0,
            content: content.trim(),
            category: sectionTitle.trim(),
            fromTemplate: true // 标记来源于模板的资源
          });
        }
        
        // 如果没有匹配到任何文档条目，但有内容，则添加整个部分作为一个条目
        if (references.length === 0 && sectionContent.trim() !== "") {
          references.push({
            document_name: sectionTitle.trim(),
            dataset_name: "农业知识库",
            content: sectionContent.trim(),
            category: sectionTitle.trim(),
            fromTemplate: true
          });
        }
      }
    }
    
    return references;
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
            // 检查并处理历史消息中的引用文档内容
            const { cleanedAnswer, extractedReferences } = extractReferencesFromAnswer(msg.answer);
            
            // 计算引用文档数量
            let referencesCount = 0;
            let hasRealReferences = false;
            
            // 如果有API返回的引用文档，计入数量
            if (msg.retriever_resources && msg.retriever_resources.length > 0) {
              referencesCount += msg.retriever_resources.length;
              hasRealReferences = true;
            }
            
            // 如果有提取的引用文档，检查是否真的有内容
            if (extractedReferences) {
              const extractedDocs = processExtractedReferences(extractedReferences);
              if (extractedDocs.length > 0) {
                referencesCount += extractedDocs.length;
                hasRealReferences = true;
              }
            }
            
            // 创建消息对象
            const aiMessage = {
              id: msg.id + '-response',
              content: cleanedAnswer, // 使用清理后的内容
              sender: 'ai',
              timestamp: new Date(msg.created_at * 1000),
              hasReferences: hasRealReferences,
              referencesCount: hasRealReferences ? referencesCount : 0,
              feedback: msg.feedback ? msg.feedback.rating : null
            };
            
            // 添加消息到列表
            messages.value.push(aiMessage);
            
            // 如果提取到了引用文档内容，则存储于消息对象中
            if (extractedReferences) {
              const extractedDocs = processExtractedReferences(extractedReferences);
              if (extractedDocs.length > 0) {
                aiMessage.extractedReferences = extractedDocs;
              }
            }
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
      
      // 查找对应的消息
      const message = messages.value.find(msg => msg.id === messageId);
      
      // 如果消息存在且有提取的引用
      if (message && message.extractedReferences) {
        referenceDocuments.value = message.extractedReferences;
      } else if (message && message.hasReferences) {
        // 如果没有提取的引用但标记为有引用，可能需要从API获取
        // 这里可能需要添加获取引用资源的逻辑
      }
    }
  };
  
  // 停止AI响应
  const stopResponse = async () => {
    if (currentTaskId.value) {
      try {
        await agriAIApi.stopResponse(currentTaskId.value, userId.value);
        isTyping.value = false;
        isResponding.value = false;  // 手动停止响应也需要更新状态
        currentTaskId.value = '';
      } catch (error) {
        console.error('停止响应失败:', error);
      }
    }
  };
  
  // 检查是否可以切换会话
  const canSwitchConversation = () => {
    return !isResponding.value;
  };
  
  // 监听conversationId的变化
  watch(conversationId, (newId, oldId) => {
    console.log(`对话ID变更: ${oldId} -> ${newId}`);
    
    // 如果新ID为空，直接返回
    if (!newId) return;
    
    // AI正在响应时，不允许切换会话（但允许临时ID更新为真实ID的情况）
    const isFromTempToReal = oldId?.startsWith('local-') && isValidUUID(newId);
    if (isResponding.value && !isFromTempToReal) {
      console.log('AI正在响应，不允许切换会话');
      return;
    }
    
    // 检查ID变化类型
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
    isResponding,         // 暴露响应状态
    canSwitchConversation, // 暴露检查函数
    handleSendMessage,
    loadHistoryMessages,
    stopResponse,
    toggleReferences
  };
} 
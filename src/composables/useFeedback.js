import { ref } from 'vue';
import agriAIApi from '../utils/api';
import storageService from '../utils/storage';
import { showSuccessToast, showErrorToast } from '../utils/toast';

export function useFeedback(messages) {
  const userId = ref(storageService.getUserId());
  
  // 处理反馈
  const handleFeedback = async (messageId, type) => {
    try {
      // 检查是否是取消操作（再次点击相同的按钮）
      const message = messages.value.find(msg => msg.id === messageId);
      const newFeedback = message && message.feedback === type ? null : type;
      
      // 先在UI上反映变化
      messages.value = messages.value.map(message => 
        message.id === messageId 
          ? { ...message, feedback: newFeedback } 
          : message
      );
      
      // 然后发送到API
      await agriAIApi.feedbackMessage(messageId, newFeedback, userId.value);
      
      // 显示操作成功提示
      showFeedbackToast(newFeedback);
      
    } catch (error) {
      console.error('发送反馈失败:', error);
      
      // 失败时显示错误提示
      showErrorToast('反馈发送失败，请稍后重试');
    }
  };
  
  // 显示反馈成功提示
  const showFeedbackToast = (feedbackType) => {
    const feedbackText = feedbackType === 'like' ? '谢谢您的点赞！' : 
                          feedbackType === 'dislike' ? '感谢您的反馈，我们会继续改进。' :
                          '已取消反馈';
    
    showSuccessToast(feedbackText);
  };
  
  return {
    handleFeedback
  };
} 
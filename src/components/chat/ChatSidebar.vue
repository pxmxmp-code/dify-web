<template>
  <div class="relative">
    <!-- 收缩按钮 - 移到外部确保总是可见 -->
    <div 
      class="fixed bg-green-600 text-white shadow-md cursor-pointer transform transition-all hover:bg-green-500 z-50 flex items-center justify-center"
      :class="[
        isCollapsed ? 'left-0 top-16 h-10 w-6 rounded-r-md' : 'left-[18rem] top-16 h-10 w-6 rounded-l-md',
        {'opacity-80 hover:opacity-100': true}
      ]"
      @click="toggleSidebar"
    >
      <ChevronLeftIcon v-if="!isCollapsed" class="h-4 w-4" />
      <ChevronRightIcon v-else class="h-4 w-4" />
    </div>
    
    <div 
      class="sidebar-container border-r border-green-100 bg-white flex flex-col transition-all duration-300 ease-in-out"
      :class="[
        isCollapsed ? 'w-0 border-r-0' : 'w-72',
        isMobile && isCollapsed ? '-ml-0' : ''
      ]"
    >
      <!-- 内容区域 - 只在展开时显示 -->
      <div :class="{'invisible overflow-hidden': isCollapsed, 'visible': !isCollapsed}" class="flex-1 flex flex-col h-screen">
        <!-- 标题栏 -->
        <div class="flex items-center gap-2 mb-6 p-4">
          <div class="bg-green-600 p-2 rounded-lg flex-shrink-0">
            <LeafIcon class="h-5 w-5 text-white" />
          </div>
          <h1 class="text-lg font-semibold text-gray-800 truncate">农业规划 <span class="text-green-600">AI</span></h1>
        </div>
        
        <!-- 新对话按钮 -->
        <button 
          class="flex items-center justify-start mb-3 mx-4 py-2 px-4 bg-white border border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors duration-200 rounded-md"
          @click="$emit('new-chat')"
          :disabled="isCreatingChat || isResponding"
          :class="{ 
            'transform hover:scale-[1.02] active:scale-[0.98]': !isCreatingChat && !isResponding,
            'opacity-50 cursor-not-allowed': isCreatingChat || isResponding
          }"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          <span>
            <template v-if="isResponding">AI正在回复...</template>
            <template v-else>{{ isCreatingChat ? '创建中...' : '新对话' }}</template>
          </span>
        </button>
        
        <!-- 会话列表 -->
        <div class="mb-6 flex-1 overflow-auto conversation-list">
          <h2 class="text-xs uppercase text-gray-500 font-semibold mb-2 px-4">最近对话</h2>
          <div class="space-y-1" v-if="recentConversations.length > 0">
            <div 
              v-for="conversation in recentConversations" 
              :key="conversation.id"
              class="conversation-item flex w-full items-center group justify-between py-2 px-4 text-gray-600 hover:text-gray-900 hover:bg-green-50 transition-colors duration-200 rounded-md cursor-pointer"
              :class="{ 
                'bg-green-50 text-green-700 active-conversation': conversation.id === conversationId,
                'opacity-60 cursor-not-allowed': isResponding && conversation.id !== conversationId
              }"
              @click="handleConversationClick(conversation)"
            >
              <div class="flex items-center flex-1 min-w-0 text-left">
                <MessageSquareIcon class="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                <span class="truncate">{{ conversation.name }}</span>
              </div>
              
              <button 
                class="ml-2 flex-shrink-0 transition-opacity duration-200"
                :class="{ 
                  'opacity-0 group-hover:opacity-100 hover:text-red-500': !isMobile, 
                  'opacity-70 hover:opacity-100 text-gray-500 hover:text-red-500': isMobile,
                  'pointer-events-none opacity-30': isResponding && conversation.id === conversationId 
                }"
                @click.stop="$emit('delete-conversation', conversation.id)"
              >
                <XIcon class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 text-xs py-4">
            暂无历史对话
          </div>
        </div>
        
        <!-- 状态面板 -->
        <div class="mt-auto px-4 pb-4">
          <div 
            class="bg-green-50 rounded-lg p-3 mb-3 border border-green-100 shadow-sm transition-all duration-200"
            :class="{ 'transform hover:-translate-y-0.5 hover:shadow-md': true }"
          >
            <div class="flex items-center gap-2 mb-2">
              <DatabaseIcon class="h-4 w-4 text-green-600" />
              <span class="text-xs font-medium text-gray-600">服务后端状态</span>
              <span class="ml-auto text-xs px-2 py-0.5 rounded-full" :class="backendStatusClass">{{ backendStatus }}</span>
            </div>
            <div class="flex items-center gap-2">
              <ZapIcon class="h-4 w-4 text-green-600" />
              <span class="text-xs font-medium text-gray-600">大语言模型</span>
              <span class="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">DeepSeek-R1</span>
            </div>
          </div>
          <div class="text-xs text-gray-400 text-center">
            © 农业十五五规划 2025
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  Leaf as LeafIcon, 
  Plus as PlusIcon, 
  MessageSquare as MessageSquareIcon,
  Database as DatabaseIcon,
  Zap as ZapIcon,
  X as XIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-vue-next';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import agriAIApi from '../../utils/api';

export default {
  name: 'ChatSidebar',
  components: {
    LeafIcon,
    PlusIcon,
    MessageSquareIcon,
    DatabaseIcon,
    ZapIcon,
    XIcon,
    ChevronLeftIcon,
    ChevronRightIcon
  },
  props: {
    recentConversations: {
      type: Array,
      required: true
    },
    conversationId: {
      type: String,
      default: ''
    },
    isCreatingChat: {
      type: Boolean,
      default: false
    },
    isResponding: {
      type: Boolean,
      default: false
    }
  },
  emits: ['new-chat', 'switch-conversation', 'delete-conversation'],
  setup() {
    const isCollapsed = ref(false);
    const isMobile = ref(false);
    const backendStatus = ref('检测中');
    const backendStatusClass = ref('bg-yellow-100 text-yellow-700');
    const checkInterval = ref(null);
    
    // 检查后端状态
    const checkBackendStatus = async () => {
      try {
        // 将状态设为"连接中"以避免频繁变化
        if (backendStatus.value === '离线') {
          backendStatus.value = '连接中';
          backendStatusClass.value = 'bg-yellow-100 text-yellow-700';
        }
        
        const response = await agriAIApi.getMeta();
        if (response && response.status === 200) {
          backendStatus.value = '在线';
          backendStatusClass.value = 'bg-green-100 text-green-700';
          
          // 保存最后一次成功连接时间
          localStorage.setItem('lastSuccessfulConnection', Date.now().toString());
          
          // 如果一直在线，可以延长检查间隔（5分钟）
          if (checkInterval.value) {
            clearInterval(checkInterval.value);
            checkInterval.value = setInterval(checkBackendStatus, 5 * 60 * 1000);
          }
        } else {
          backendStatus.value = '离线';
          backendStatusClass.value = 'bg-red-100 text-red-700';
          
          // 如果后端离线，缩短检查间隔（30秒）
          if (checkInterval.value) {
            clearInterval(checkInterval.value);
            checkInterval.value = setInterval(checkBackendStatus, 30 * 1000);
          }
        }
      } catch (error) {
        console.error('检测后端状态失败:', error);
        backendStatus.value = '离线';
        backendStatusClass.value = 'bg-red-100 text-red-700';
        
        // 如果发生错误，缩短检查间隔（30秒）
        if (checkInterval.value) {
          clearInterval(checkInterval.value);
          checkInterval.value = setInterval(checkBackendStatus, 30 * 1000);
        }
      }
    };
    
    // 检查是否为移动设备
    const checkMobile = () => {
      isMobile.value = window.innerWidth < 768;
      
      // 在移动设备上默认收起侧边栏
      if (isMobile.value && !isCollapsed.value) {
        isCollapsed.value = true;
      }
    };
    
    // 切换侧边栏展开/收缩状态
    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value;
      
      // 保存用户偏好到本地存储
      if (!isMobile.value) {
        localStorage.setItem('sidebarCollapsed', isCollapsed.value.toString());
      }
    };
    
    // 处理页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 只有当距离上次成功连接超过1分钟时才重新检测
        const lastConnection = localStorage.getItem('lastSuccessfulConnection');
        if (!lastConnection || (Date.now() - parseInt(lastConnection)) > 60 * 1000) {
          checkBackendStatus();
        }
      }
    };
    
    // 监听窗口大小变化
    onMounted(() => {
      // 首次加载时获取用户偏好
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null && !isMobile.value) {
        isCollapsed.value = savedState === 'true';
      }
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      // 检查是否需要立即检测状态
      const lastSuccessfulConnection = localStorage.getItem('lastSuccessfulConnection');
      const now = Date.now();
      
      // 如果上次成功连接在10分钟内，显示"在线"状态，延迟检测
      if (lastSuccessfulConnection && (now - parseInt(lastSuccessfulConnection)) < 10 * 60 * 1000) {
        backendStatus.value = '在线';
        backendStatusClass.value = 'bg-green-100 text-green-700';
        
        // 设置5分钟后再次检测
        setTimeout(checkBackendStatus, 5 * 60 * 1000);
      } else {
        // 否则立即检测状态
        checkBackendStatus();
      }
      
      // 设置检测间隔（默认5分钟）
      checkInterval.value = setInterval(checkBackendStatus, 5 * 60 * 1000);
      
      // 添加可见性变化事件监听器，页面重新获得焦点时检测状态
      document.addEventListener('visibilitychange', handleVisibilityChange);
    });
    
    // 组件销毁前移除事件监听和清除定时器
    onBeforeUnmount(() => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (checkInterval.value) {
        clearInterval(checkInterval.value);
      }
    });
    
    return {
      isCollapsed,
      isMobile,
      toggleSidebar,
      backendStatus,
      backendStatusClass
    };
  },
  methods: {
    handleConversationClick(conversation) {
      // 如果AI正在回复且不是当前会话，忽略点击
      if (this.isResponding && conversation.id !== this.conversationId) {
        return;
      }
      
      // 否则触发切换事件
      this.$emit('switch-conversation', conversation.id, conversation.name);
      
      // 在移动设备上点击会话后自动收起侧边栏
      if (this.isMobile && !this.isCollapsed) {
        this.toggleSidebar();
      }
    }
  }
}
</script>

<style scoped>
/* 侧边栏容器样式 */
.sidebar-container {
  position: relative;
  height: 100vh;
  z-index: 30;
  overflow: hidden;
}

/* 修复滚动条问题 */
.conversation-list {
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.conversation-list::-webkit-scrollbar {
  width: 4px;
}

.conversation-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}

/* 会话项交互效果 */
.conversation-list .conversation-item {
  position: relative;
  transition: all 0.2s ease;
}

.conversation-list .conversation-item:hover {
  transform: translateX(2px);
}

.conversation-list .conversation-item:active {
  transform: translateX(3px) scale(0.99);
}

.conversation-list .conversation-item::after {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 60%;
  background-color: #22c55e;
  border-radius: 2px;
  transition: width 0.2s ease;
}

.conversation-list .conversation-item:hover::after {
  width: 3px;
}

.conversation-list .active-conversation::after {
  width: 3px;
}

/* 移动设备样式 */
@media (max-width: 768px) {
  .sidebar-container {
    position: absolute;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
}
</style> 
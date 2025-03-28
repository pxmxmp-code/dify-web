<template>
  <div class="flex justify-end">
    <!-- 消息内容 -->
    <div class="max-w-[80%] bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl rounded-tr-sm shadow-lg">
      <div class="px-5 py-4">
        <p class="text-sm">{{ message.content }}</p>
      </div>
      
      <!-- 消息底部信息 -->
      <div class="flex items-center justify-between px-5 py-2 border-t border-green-400/30">
        <div class="flex items-center">
          <ClockIcon class="h-3 w-3 text-green-200" />
          <span class="text-xs ml-1 text-green-100">
            {{ formatTime(message.timestamp) }}
          </span>
        </div>
        
        <div>
          <CheckCheckIcon class="h-3 w-3 text-green-200" />
        </div>
      </div>
    </div>
    
    <!-- 用户头像 -->
    <div class="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center ml-3 mt-1">
      <span class="text-xs font-medium text-green-700">您</span>
    </div>
  </div>
</template>

<script>
import { Clock as ClockIcon, CheckCheck as CheckCheckIcon } from 'lucide-vue-next';

export default {
  name: 'UserMessage',
  components: {
    ClockIcon,
    CheckCheckIcon
  },
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatTime(timestamp) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}
</script> 
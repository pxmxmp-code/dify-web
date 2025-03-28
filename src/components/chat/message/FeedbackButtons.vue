<template>
  <div class="flex items-center ml-2">
    <!-- 点赞按钮 -->
    <button 
      :class="[
        'p-1 rounded-full relative group transition-all duration-200 transform hover:scale-110',
        feedback === 'like' 
          ? 'bg-green-100 text-green-700 ring-2 ring-green-300 ring-opacity-50' 
          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
      ]"
      @click="$emit('feedback', 'like')"
    >
      <ThumbsUpIcon class="h-3 w-3" />
      <span 
        :class="[
          'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 transition-opacity duration-200',
          'group-hover:opacity-100'
        ]"
      >
        {{ feedback === 'like' ? '取消点赞' : '有帮助' }}
      </span>
      <span 
        v-if="feedback === 'like'"
        class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
      ></span>
    </button>
    
    <!-- 点踩按钮 -->
    <button 
      :class="[
        'p-1 rounded-full relative group transition-all duration-200 transform hover:scale-110 ml-2',
        feedback === 'dislike' 
          ? 'bg-red-100 text-red-700 ring-2 ring-red-300 ring-opacity-50' 
          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
      ]"
      @click="$emit('feedback', 'dislike')"
    >
      <ThumbsDownIcon class="h-3 w-3" />
      <span 
        :class="[
          'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 transition-opacity duration-200',
          'group-hover:opacity-100'
        ]"
      >
        {{ feedback === 'dislike' ? '取消反馈' : '需改进' }}
      </span>
      <span 
        v-if="feedback === 'dislike'"
        class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
      ></span>
    </button>
  </div>
</template>

<script>
import { ThumbsUp as ThumbsUpIcon, ThumbsDown as ThumbsDownIcon } from 'lucide-vue-next';

export default {
  name: 'FeedbackButtons',
  components: {
    ThumbsUpIcon,
    ThumbsDownIcon
  },
  props: {
    feedback: {
      type: String,
      default: null
    }
  },
  emits: ['feedback']
}
</script> 
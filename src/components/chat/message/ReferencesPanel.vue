<template>
  <transition name="references">
    <div class="mt-2 ml-11 bg-white border border-green-100 rounded-lg shadow-md p-4 max-w-[80%] relative">
      <button 
        class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transform transition-transform duration-200 hover:rotate-90"
        @click="$emit('close')"
      >
        <XIcon class="h-4 w-4" />
      </button>
      
      <h3 class="text-sm font-medium text-gray-800 mb-2 flex items-center">
        <FileTextIcon class="h-4 w-4 mr-1 text-green-600" />
        引用文档
      </h3>
      
      <div class="space-y-2">
        <transition-group name="reference-item">
          <div 
            v-for="(doc, index) in documents" 
            :key="doc.segment_id || index"
            class="p-2 bg-green-50 rounded border border-green-100 text-xs text-gray-700 transform transition-transform duration-200 hover:translate-x-0.5"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="font-medium text-green-700 mb-1">
              {{ doc.document_name || doc.dataset_name || '引用资料' }} 
              <span v-if="doc.score" class="text-[10px] text-gray-500">(相似度: {{ Math.round(doc.score * 100) }}%)</span>
            </div>
            <p>{{ doc.content }}</p>
          </div>
        </transition-group>
      </div>
    </div>
  </transition>
</template>

<script>
import { FileText as FileTextIcon, X as XIcon } from 'lucide-vue-next';

export default {
  name: 'ReferencesPanel',
  components: {
    FileTextIcon,
    XIcon
  },
  props: {
    documents: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close']
}
</script>

<style scoped>
/* 引用面板动画 */
.references-enter-active,
.references-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
}
.references-enter-from,
.references-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

/* 引用条目动画 */
.reference-item-enter-active {
  transition: all 0.3s ease;
}
.reference-item-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
</style> 
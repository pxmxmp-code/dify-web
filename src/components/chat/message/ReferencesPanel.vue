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
        <span class="ml-1 text-xs text-gray-500">
          (共 {{ totalDocumentsCount }} 条)
        </span>
      </h3>
      
      <div class="space-y-2">
        <!-- 分类显示引用文档 -->
        <div v-for="(categoryDocs, categoryName) in categorizedDocuments" :key="categoryName" class="mb-3">
          <!-- 显示分类名称 -->
          <div v-if="categoryName !== 'default'" class="text-xs font-medium text-green-700 mb-1 border-b border-green-100 pb-1">
            {{ categoryName }}
          </div>
          
          <transition-group name="reference-item">
            <div 
              v-for="(doc, index) in categoryDocs" 
              :key="doc.segment_id || doc.document_name + index"
              class="p-2 bg-green-50 rounded border border-green-100 text-xs text-gray-700 transform transition-transform duration-200 hover:translate-x-0.5 mb-2"
              :style="{ transitionDelay: `${index * 100}ms` }"
            >
              <div class="font-medium text-green-700 mb-1">
                {{ doc.document_name || doc.dataset_name || '引用资料' }} 
                <span v-if="doc.score" class="text-[10px] text-gray-500">
                  (相关度: {{ typeof doc.score === 'number' ? Math.round(doc.score * 100) : doc.score }}%)
                </span>
              </div>
              <p>{{ doc.content }}</p>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { computed } from 'vue';
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
  emits: ['close'],
  setup(props) {
    // 引用文档总数
    const totalDocumentsCount = computed(() => props.documents.length);
    
    // 将文档按分类进行分组
    const categorizedDocuments = computed(() => {
      const categories = {};
      
      // 遍历所有文档
      props.documents.forEach(doc => {
        // 确定文档所属分类
        const category = doc.category || doc.metadata?.category || 'default';
        
        // 如果分类不存在，创建一个新数组
        if (!categories[category]) {
          categories[category] = [];
        }
        
        // 将文档添加到对应分类
        categories[category].push(doc);
      });
      
      // 如果有默认分类且还有其他分类，将默认分类放在最后
      if (categories.default && Object.keys(categories).length > 1) {
        const defaultDocs = categories.default;
        delete categories.default;
        categories.default = defaultDocs;
      }
      
      return categories;
    });
    
    return {
      categorizedDocuments,
      totalDocumentsCount
    };
  }
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
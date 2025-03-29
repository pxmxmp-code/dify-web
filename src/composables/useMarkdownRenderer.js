import { marked } from 'marked';
import hljs from 'highlight.js';

export function useMarkdownRenderer() {
  // 初始化 marked 配置
  const setupMarked = () => {
    // 配置 marked 选项
    marked.setOptions({
      renderer: new marked.Renderer(),
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-', // highlight.js css 需要的前缀
      pedantic: false,
      gfm: true,
      breaks: true,
      sanitize: false, // 不对 HTML 进行转义，输出为 HTML
      smartypants: false, // 不使用智能标点
      mangle: false, // 不对邮箱地址进行模糊处理
      headerIds: true, // 生成标题的 id
      headerPrefix: '', // 标题 id 前缀
    });

    // 自定义渲染器
    const renderer = new marked.Renderer();

    // 自定义链接渲染，添加 target="_blank" 属性
    renderer.link = function(href, title, text) {
      const link = marked.Renderer.prototype.link.call(this, href, title, text);
      return link.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
    };

    // 自定义表格渲染，添加包装容器
    renderer.table = function(header, body) {
      return '<div class="table-container">' +
        '<table>\n' +
        '<thead>\n' +
        header +
        '</thead>\n' +
        '<tbody>\n' +
        body +
        '</tbody>\n' +
        '</table>\n' +
        '</div>';
    };

    // 应用自定义渲染器
    marked.use({ renderer });
  };

  // 初始化配置
  setupMarked();

  // 渲染 Markdown 为 HTML
  const renderMarkdown = (content) => {
    if (!content) return '';
    
    // 预处理：检查并移除模板生成的引用文档部分
    let processedContent = content;
    
    // 移除"# 农业知识参考资料"及其后的所有内容
    const referenceMarker = "# 农业知识参考资料";
    const referenceIndex = processedContent.indexOf(referenceMarker);
    if (referenceIndex !== -1) {
      processedContent = processedContent.substring(0, referenceIndex).trim();
    }
    
    // 确保有序列表能被正确识别 - 确保数字后面有空格
    processedContent = processedContent.replace(/^(\d+)\.(?!\s)/gm, '$1. ');
    
    // 使用 marked 解析处理后的内容
    let html = marked(processedContent);
    
    // 后处理：
    // 1. 处理没有被识别为有序列表的序号段落
    html = html.replace(/<p>(\d+)\.\s+(.*?)<\/p>/g, 
      '<p class="list-like-paragraph"><span class="list-number">$1.</span> $2</p>');
      
    // 2. 修复特殊标记 - 捕获和修复可能的特殊标记，如 NUMLIST_START
    html = html.replace(/<p>.*?NUMLIST_START_(\d+)_(.*?)_NUMLIST_END.*?<\/p>/g,
      '<p class="list-like-paragraph"><span class="list-number">$1.</span> $2</p>');
      
    // 3. 再次检查是否有数字列表项被嵌套在其他标签中
    html = html.replace(/(^|>)NUMLIST_START_(\d+)_(.*?)_NUMLIST_END($|<)/g,
      '$1<span class="list-like-inline"><span class="list-number">$2.</span> $3</span>$4');
    
    return html;
  };

  return {
    renderMarkdown
  };
} 
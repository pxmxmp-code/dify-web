/**
 * 显示提示消息
 * @param {string} text - 提示文本
 * @param {string} type - 提示类型，可选值：success, error, warning, info
 * @param {number} duration - 提示显示时间，默认2000毫秒
 */
export function showToast(text, type = 'success', duration = 2000) {
  // 创建提示元素
  const toastElement = document.createElement('div');
  
  // 根据类型设置不同的样式
  let bgColor = 'bg-green-600';
  if (type === 'error') bgColor = 'bg-red-600';
  else if (type === 'warning') bgColor = 'bg-yellow-600';
  else if (type === 'info') bgColor = 'bg-blue-600';
  
  toastElement.className = `fixed bottom-20 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm opacity-0 transition-opacity duration-300`;
  toastElement.textContent = text;
  document.body.appendChild(toastElement);
  
  // 添加到DOM后，延迟一帧再显示，确保过渡效果生效
  requestAnimationFrame(() => {
    toastElement.style.opacity = '1';
  });
  
  // 持续时间后移除提示
  setTimeout(() => {
    // 淡出效果
    toastElement.style.opacity = '0';
    
    // 等待淡出完成后移除DOM元素
    setTimeout(() => {
      document.body.removeChild(toastElement);
    }, 300); // 与CSS过渡时间匹配
  }, duration);
}

/**
 * 显示成功提示
 * @param {string} text - 提示文本
 * @param {number} duration - 提示显示时间
 */
export function showSuccessToast(text, duration = 2000) {
  showToast(text, 'success', duration);
}

/**
 * 显示错误提示
 * @param {string} text - 提示文本
 * @param {number} duration - 提示显示时间
 */
export function showErrorToast(text, duration = 2000) {
  showToast(text, 'error', duration);
}

/**
 * 显示警告提示
 * @param {string} text - 提示文本
 * @param {number} duration - 提示显示时间
 */
export function showWarningToast(text, duration = 2000) {
  showToast(text, 'warning', duration);
}

/**
 * 显示信息提示
 * @param {string} text - 提示文本
 * @param {number} duration - 提示显示时间
 */
export function showInfoToast(text, duration = 2000) {
  showToast(text, 'info', duration);
} 
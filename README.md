# 农业规划AI聊天助手

## 项目概述

农业规划AI聊天助手是一个基于Vue.js开发的智能对话平台，专为农业规划领域设计。本系统利用AI技术，帮助用户分析数据、制定规划方案、预测趋势和提供政策建议，提高农业生产效率和可持续发展能力。

## 技术栈

- **前端框架**：Vue.js 3
- **构建工具**：Vite
- **UI组件库**：自定义组件 + Lucide Vue图标
- **代码高亮**：highlight.js
- **Markdown渲染**：marked
- **HTTP请求**：Axios (API服务)
- **CSS框架**：Tailwind CSS (推测)

## 项目结构

```
dify-web/
├── src/
│   ├── assets/               # 静态资源
│   │   ├── base.css          # 基础样式
│   │   └── markdown.css      # Markdown渲染样式
│   ├── components/           # 组件目录
│   │   ├── AgriAIChat.vue    # 主聊天界面
│   │   └── chat/             # 聊天组件
│   │       ├── ChatInput.vue       # 输入框组件
│   │       ├── MessageList.vue     # 消息列表组件
│   │       └── message/            # 消息类型组件
│   │           ├── AIMessage.vue      # AI消息组件
│   │           ├── UserMessage.vue    # 用户消息组件
│   │           ├── FeedbackButtons.vue # 反馈按钮组件
│   │           ├── ReferencesPanel.vue # 引用文档面板
│   │           └── TypingIndicator.vue # 打字指示器
│   ├── composables/          # 逻辑抽象层
│   │   ├── useConversation.js # 会话管理
│   │   ├── useMessages.js     # 消息处理
│   │   ├── useFeedback.js     # 反馈处理
│   │   └── useMarkdownRenderer.js # Markdown渲染
│   ├── utils/                # 工具函数
│   │   ├── api.js            # API请求封装
│   │   ├── storage.js        # 本地存储工具
│   │   └── toast.js          # 提示消息工具
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
├── public/                   # 公共资源
└── package.json              # 项目配置
```

## 组件架构

### 主要组件

1. **AgriAIChat.vue** - 主聊天界面，整合所有子组件
2. **ChatInput.vue** - 用户输入框，负责发送消息和停止AI响应
3. **MessageList.vue** - 消息列表，显示对话记录
4. **AIMessage.vue** - AI消息气泡，支持Markdown渲染和反馈功能
5. **UserMessage.vue** - 用户消息气泡
6. **FeedbackButtons.vue** - 点赞/点踩反馈组件
7. **ReferencesPanel.vue** - 引用文档面板，显示AI回答的资料来源
8. **TypingIndicator.vue** - AI正在输入的指示器

### 组合式API (Composables)

1. **useConversation.js** - 会话管理逻辑
   - 创建、切换、删除会话
   - 处理临时会话和服务器会话同步
   
2. **useMessages.js** - 消息处理逻辑
   - 发送消息到服务器
   - 处理流式响应
   - 加载历史消息
   
3. **useFeedback.js** - 反馈处理逻辑
   - 点赞/点踩功能
   - 取消反馈
   
4. **useMarkdownRenderer.js** - Markdown渲染逻辑
   - 配置marked库
   - 自定义渲染规则

## 核心功能

### 1. 会话管理

- **新建会话**：创建临时会话，在发送第一条消息后转换为真实会话
- **切换会话**：在不同对话间切换，自动加载历史消息
- **删除会话**：支持删除本地或远程会话

```javascript
// 示例：创建新会话
const { startNewChat } = useConversation();
await startNewChat();
```

### 2. 消息交互

- **发送消息**：支持文本消息发送和流式响应接收
- **消息历史**：自动加载和显示历史消息
- **停止生成**：支持中断AI回答生成

```javascript
// 示例：发送消息
const { handleSendMessage } = useMessages(conversationId);
await handleSendMessage('请分析华北地区的农业生产情况');
```

### 3. 引用文档显示

- 显示AI回答引用的数据来源
- 包含文档标题、相关度和内容摘要

### 4. 反馈系统

- 对AI回答进行点赞/点踩
- 支持取消已有反馈
- 反馈结果实时显示

```javascript
// 示例：提交反馈
const { handleFeedback } = useFeedback(messages);
await handleFeedback(messageId, 'like'); // 或 'dislike'
```

### 5. Markdown渲染

- 支持渲染AI回答中的富文本格式
- 包含代码高亮、表格、列表等格式化内容
- 自定义农业主题样式

## 安装和运行

### 前提条件

- Node.js 14+
- npm, yarn 或 bun

### 安装步骤

1. 克隆仓库
```bash
git clone [仓库URL]
cd dify-web
```

2. 安装依赖
```bash
npm install
# 或
yarn install
# 或
bun install
```

3. 开发模式运行
```bash
npm run dev
# 或
yarn dev
# 或
bun dev
```

4. 构建生产版本
```bash
npm run build
# 或
yarn build
# 或
bun run build
```

## API集成

本应用通过`agriAIApi`与后端服务通信，主要包括以下接口：

### 核心API

1. **发送消息**
   - `sendChatMessage(params, callbacks)`：发送消息并接收流式响应
   
2. **会话管理**
   - `getConversations(userId)`：获取会话列表
   - `deleteConversation(conversationId, userId)`：删除会话
   
3. **消息历史**
   - `getMessages(conversationId, userId)`：获取历史消息
   
4. **反馈**
   - `feedbackMessage(messageId, type, userId)`：提交反馈
   
5. **应用配置**
   - `getParameters(userId)`：获取应用参数

### 集成自定义后端

如需替换后端服务，请修改`src/utils/api.js`中的API实现。确保新API遵循相同的请求/响应格式。

## 自定义和扩展

### 样式定制

- **Markdown样式**：修改`src/assets/markdown.css`调整AI回答的渲染样式
- **组件样式**：各组件内包含scoped CSS，可单独修改

### 添加新功能

1. **新消息类型**：
   - 在`message/`文件夹中创建新组件
   - 在`MessageList.vue`中添加条件渲染

2. **新的交互模式**：
   - 扩展现有composables或创建新的composables
   - 在主组件中集成新逻辑

## 临时会话处理

系统采用了临时会话机制，主要流程如下：

1. 点击"新会话"按钮创建带`temp-`前缀的临时ID
2. 用户发送第一条消息时，服务器返回真实会话ID
3. 系统自动将临时ID替换为真实ID
4. 会话列表也会相应更新

这种设计确保了良好的用户体验，用户无需等待服务器响应即可开始新对话。

## 已知问题和解决方案

### 会话列表刷新

如果会话列表不能及时更新，请检查：
- `loadConversations`函数中的合并逻辑
- 本地存储与服务器数据的同步机制

### 代码高亮

如需修改代码高亮样式，请在`main.js`中更改highlight.js主题：
```javascript
import 'highlight.js/styles/另一个主题.css'
```

## 维护指南

### 关键依赖项

1. **marked** - Markdown解析和渲染
2. **highlight.js** - 代码语法高亮
3. **Vue.js** - 前端框架

### 性能优化

1. **消息列表渲染**：使用`v-for`的`key`优化对话历史渲染
2. **按需加载**：长对话中考虑使用虚拟滚动
3. **缓存策略**：本地存储会话和配置数据

### 调试技巧

1. 临时会话问题：检查ID前缀为`temp-`的会话处理逻辑
2. API响应问题：检查`callbacks`处理函数
3. UI渲染问题：检查组件间数据流传递

## 贡献指南

欢迎对项目做出贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 项目设置及开发指南

### 推荐的IDE

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (并禁用Vetur)。

### Vite配置

有关更多配置信息，请参阅[Vite配置参考](https://vite.dev/config/)。

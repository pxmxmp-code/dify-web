# 农业规划AI聊天助手

## 项目概述

农业规划AI聊天助手是一个基于Vue.js开发的智能对话平台，专为农业规划领域设计。本系统利用AI技术，帮助用户分析数据、制定规划方案、预测趋势和提供政策建议，提高农业生产效率和可持续发展能力。系统采用响应式设计，支持PC和移动端展示，强化了用户交互体验。

## 技术栈

- **前端框架**：Vue.js 3 + Composition API
- **构建工具**：Vite
- **UI组件库**：自定义组件 + Lucide Vue图标
- **代码高亮**：highlight.js
- **Markdown渲染**：marked
- **HTTP请求**：Axios (API服务)
- **CSS框架**：Tailwind CSS
- **容器化**：Docker + Docker Compose

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
│   │       ├── ChatSidebar.vue     # 侧边栏组件
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
├── Dockerfile                # Docker构建文件
├── docker-compose.yml        # Docker编排文件
├── .dockerignore             # Docker忽略文件
└── package.json              # 项目配置
```

## 组件架构

### 主要组件

1. **AgriAIChat.vue** - 主聊天界面，整合所有子组件
2. **ChatInput.vue** - 用户输入框，支持自动高度调整和快捷键操作
3. **ChatSidebar.vue** - 侧边栏组件，支持折叠/展开和会话管理
4. **MessageList.vue** - 消息列表，显示对话记录
5. **AIMessage.vue** - AI消息气泡，支持Markdown渲染、思考过程显示和反馈功能
6. **UserMessage.vue** - 用户消息气泡
7. **FeedbackButtons.vue** - 点赞/点踩反馈组件
8. **ReferencesPanel.vue** - 引用文档面板，显示AI回答的资料来源
9. **TypingIndicator.vue** - AI正在输入的指示器

### 组合式API (Composables)

1. **useConversation.js** - 会话管理逻辑
   - 创建、切换、删除会话
   - 处理临时会话和服务器会话同步
   
2. **useMessages.js** - 消息处理逻辑
   - 发送消息到服务器
   - 处理流式响应
   - 加载历史消息
   - 自动会话重命名
   
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
- **自动重命名**：基于用户首条消息自动为会话设置名称

```javascript
// 示例：创建新会话
const { startNewChat } = useConversation();
await startNewChat();
```

### 2. 消息交互

- **发送消息**：支持文本消息发送和流式响应接收
- **消息历史**：自动加载和显示历史消息
- **停止生成**：支持中断AI回答生成
- **自适应输入框**：根据内容自动调整高度
- **快捷键**：支持Enter发送，Shift+Enter换行

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

### 6. 响应式设计

- **侧边栏折叠**：支持完全折叠侧边栏，最大化内容区域
- **移动设备适配**：自动检测移动设备并调整布局
- **本地存储偏好**：记住用户的侧边栏偏好设置

### 7. AI思考过程展示

- 通过`<think>...</think>`标签显示AI思考过程
- 使用特殊样式区分思考内容和最终回答
- 支持折叠/展开思考内容

## 安装和运行

### 前提条件

- Node.js 14+
- npm, yarn 或 bun

### 开发环境安装

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

### Docker部署

项目支持使用Docker进行一键部署，无需本地环境配置：

1. 确保服务器已安装Docker和Docker Compose

2. 克隆仓库并进入项目目录
```bash
git clone [仓库URL]
cd dify-web
```

3. 启动容器
```bash
docker-compose up -d
```

4. 访问应用
```
http://服务器IP:8888
```

#### 环境变量配置

Docker部署支持以下环境变量配置（在docker-compose.yml中设置）：

- `VITE_APP_ID` - Dify应用ID
- `VITE_API_KEY` - Dify API密钥
- `VITE_API_URL` - 后端API地址
- `VITE_DEFAULT_INPUTS` - 默认输入参数

## API集成

本应用通过`agriAIApi`与后端服务通信，主要包括以下接口：

### 核心API

1. **发送消息**
   - `sendChatMessage(params, callbacks)`：发送消息并接收流式响应
   
2. **会话管理**
   - `getConversations(userId)`：获取会话列表
   - `deleteConversation(conversationId, userId)`：删除会话
   - `renameConversation(conversationId, name)`：重命名会话
   
3. **消息历史**
   - `getMessages(conversationId, userId)`：获取历史消息
   
4. **反馈**
   - `feedbackMessage(messageId, type, userId)`：提交反馈
   
5. **应用配置**
   - `getParameters(userId)`：获取应用参数
   - `getMeta()`：获取后端状态信息

### 集成自定义后端

如需替换后端服务，请修改`src/utils/api.js`中的API实现。确保新API遵循相同的请求/响应格式。在Docker环境中，只需修改`VITE_API_URL`环境变量指向新后端。

## 最佳实践和维护指南

### 代码组织与风格

1. **组件拆分原则**
   - 遵循单一职责原则
   - 将复杂功能拆分为子组件
   - 使用Vue 3 Composition API组织逻辑

2. **CSS样式管理**
   - 全局样式放在`assets/base.css`
   - 组件样式使用scoped CSS
   - 使用Tailwind工具类保持一致性

3. **状态管理**
   - 组合式API管理状态
   - localStorage存储持久化数据
   - 使用`ref`和`reactive`管理响应式数据

### 常见问题与解决方案

#### 会话列表刷新

如果会话列表不能及时更新，请检查：
- `loadConversations`函数中的合并逻辑
- 本地存储与服务器数据的同步机制
- 确保`localStorage`中的临时会话ID正确替换

#### 移动端适配问题

如果移动端显示异常：
- 检查`ChatSidebar.vue`中的移动设备检测逻辑
- 调整侧边栏折叠按钮的位置和z-index
- 验证媒体查询断点设置

#### 消息渲染问题

如果消息渲染出现异常：
- 检查`AIMessage.vue`中的Markdown渲染配置
- 查看思考过程(`<think>`)标签的处理逻辑
- 确认代码高亮设置正确

#### Docker部署问题

常见Docker问题解决：
- 端口占用：修改`docker-compose.yml`中的端口映射
- 环境变量：确认环境变量正确设置
- 容器访问：检查防火墙规则是否允许8888端口

### 性能优化

1. **消息列表渲染**
   - 使用`v-for`的`key`优化对话历史渲染
   - 考虑实现虚拟滚动处理长对话
   - 懒加载历史消息减少初始加载时间

2. **资源加载**
   - 使用Vite的代码分割减小首屏加载时间
   - 优化图标和静态资源加载
   - 使用缓存策略提高二次访问速度

3. **动画优化**
   - 使用CSS transitions代替JavaScript动画
   - 避免不必要的DOM操作
   - 对复杂动画使用`will-change`属性

### 扩展与定制

#### 添加新功能

1. **新消息类型**：
   - 在`message/`文件夹中创建新组件
   - 在`MessageList.vue`中添加条件渲染
   - 更新消息处理逻辑

2. **新的交互模式**：
   - 扩展现有composables或创建新的composables
   - 在主组件中集成新逻辑
   - 添加相应的UI元素

#### 样式定制

- **主题定制**：修改`base.css`中的CSS变量
- **Markdown样式**：调整`markdown.css`中的渲染样式
- **组件样式**：修改各组件中的scoped CSS

#### 后端集成

- **替换API端点**：修改`api.js`中的请求URL
- **添加新接口**：扩展API客户端，添加新方法
- **认证机制**：更新请求头和认证逻辑

### 前后端协作

- **API契约**：维护前后端接口文档
- **错误处理**：统一错误响应格式
- **版本兼容**：考虑API版本控制

## AI技术展示

本项目特别展示了以下AI交互技术：

1. **流式响应**：使用流式API接收实时生成的内容
2. **思考过程**：展示AI推理和思考的中间步骤
3. **上下文记忆**：基于历史对话提供连贯回答
4. **引用来源**：自动提供信息来源的引用
5. **用户反馈**：通过点赞/点踩优化AI性能

## 技术债务与改进计划

### 已知待优化项

1. **代码模块化**：进一步拆分大型组件
2. **状态管理优化**：考虑使用Pinia统一状态管理
3. **测试覆盖**：添加单元测试和集成测试
4. **国际化支持**：添加多语言支持框架
5. **主题支持**：实现浅色/深色主题切换

### 长期规划

1. **离线支持**：实现基本的离线功能
2. **插件系统**：设计可扩展的插件架构
3. **数据导出**：支持对话导出为多种格式
4. **语音交互**：集成语音输入和输出

## 贡献指南

欢迎对项目做出贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 开发环境设置

推荐使用[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (并禁用Vetur)进行开发。

### 编码规范

- 使用ESLint进行代码检查
- 遵循Vue 3风格指南
- 使用Prettier进行代码格式化

## 版权信息

本项目基于[LICENSE]开源，供学习和非商业用途使用。如需商业使用，请联系项目维护者。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 问题反馈：创建GitHub Issue
- 技术讨论：加入技术交流群
- 合作咨询：发送邮件至[邮箱地址]

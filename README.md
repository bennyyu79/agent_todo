# Agent Teams 看板应用

一个用于展示 Agent Teams 协作对话过程的最小化 MVP 看板应用。

## 功能特性

- **任务管理**: 创建、编辑、删除任务
- **看板视图**: 三列看板 (待处理/进行中/已完成)
- **拖拽功能**: 拖拽任务改变状态
- **实时聊天**: 展示 Agent Teams 的协作对话
- **WebSocket 实时更新**: 任务变更和消息实时推送
- **任务详情**: 点击任务查看详细信息
- **过滤器**: 按关键词和负责人筛选任务
- **统计面板**: 实时显示任务统计和完成率

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS + Vite
- **后端**: Node.js + Express + WebSocket
- **文件监听**: chokidar
- **拖拽**: react-beautiful-dnd

## 项目结构

```
agent_todo/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.tsx          # 看板组件
│   │   │   ├── TaskCard.tsx       # 任务卡片
│   │   │   ├── ChatPanel.tsx      # 聊天面板
│   │   │   ├── MessageBubble.tsx  # 消息气泡
│   │   │   ├── CreateTaskForm.tsx # 创建任务表单
│   │   │   ├── TaskModal.tsx      # 任务详情弹窗
│   │   │   └── StatsPanel.tsx     # 统计面板
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts    # WebSocket 钩子
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript 类型定义
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── backend/                  # Node.js 后端
│   ├── src/
│   │   ├── server.ts          # Express + WebSocket 服务器
│   │   ├── routes/
│   │   │   ├── tasks.ts       # 任务 API
│   │   │   └── messages.ts    # 消息 API
│   │   ├── fileWatcher.ts     # 文件监听器
│   │   └── simulator.ts       # Agent 对话模拟器
│   └── package.json
├── shared/                   # 共享类型定义
│   └── types.ts
├── README.md
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
cd agent_todo
npm install
```

### 2. 启动开发服务器

```bash
# 启动所有服务 (推荐)
npm run dev

# 或分别启动
npm run dev:backend   # 后端 API 服务器 (端口 3001)
npm run dev:frontend  # 前端开发服务器 (端口 5173)
```

### 3. 访问应用

打开浏览器访问 http://localhost:5173

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/tasks | 获取所有任务 |
| GET | /api/tasks/:id | 获取单个任务 |
| POST | /api/tasks | 创建新任务 |
| PUT | /api/tasks/:id | 更新任务 |
| DELETE | /api/tasks/:id | 删除任务 |
| GET | /api/messages/recent | 获取最近消息 |
| GET | /api/messages/team/:teamId | 获取团队消息 |
| GET | /health | 健康检查 |
| WS | /ws | WebSocket 实时连接 |

## WebSocket 事件

| 事件类型 | 描述 |
|----------|------|
| task_created | 任务创建 |
| task_updated | 任务更新 |
| task_deleted | 任务删除 |
| message_received | 收到新消息 |
| team_updated | 团队配置更新 |

## Agent 模拟器

内置的 Agent 对话模拟器会模拟多个 Agent 之间的对话:

- **team-lead**: 团队负责人 (蓝色)
- **backend-dev**: 后端开发 (绿色)
- **frontend-dev**: 前端开发 (黄色)
- **tester**: 测试人员 (红色)

模拟器每 5 秒发送一条消息，模拟真实的协作场景。

## 真实集成

应用可以监听实际的 `~/.claude/teams/` 和 `~/.claude/tasks/` 目录，显示真实的 Agent Teams 通信。如果目录不存在，将自动使用模拟模式。

## 开发说明

### 添加新组件

1. 在 `frontend/src/components/` 创建新组件
2. 在 `frontend/src/types/index.ts` 添加类型定义
3. 在 `App.tsx` 中导入并使用

### 添加新 API 端点

1. 在 `backend/src/routes/` 创建新路由文件
2. 在 `backend/src/server.ts` 中注册路由

## 许可证

MIT

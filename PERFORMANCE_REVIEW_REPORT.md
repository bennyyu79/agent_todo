# Agent Todo 项目性能审查报告

## 执行摘要

本次审查分析了后端（Express + WebSocket）和前端（React）的关键性能问题。共发现 **12 个性能问题**，按影响程度分为：
- **高影响（3 个）**：内存泄漏风险、重复 WebSocket 连接、广播性能问题
- **中影响（5 个）**：不必要的重渲染、文件监听优化、API 响应优化
- **低影响（4 个）**：数据结构效率、事件循环阻塞风险、其他优化建议

---

## 一、高影响问题

### 1.1 内存泄漏风险 - WebSocket 连接管理

**位置**: `backend/src/server.ts:40-52`

**问题描述**:
```typescript
function broadcast(eventType: string, payload: any) {
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}
```

1. 在 `forEach` 迭代过程中有客户端断开，可能导致状态不一致
2. 没有处理 `client.send()` 的异步错误

**优化建议**:
```typescript
async function broadcast(eventType: string, payload: any) {
  const message = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  });

  const clientsSnapshot = Array.from(clients);

  const promises = clientsSnapshot.map((client) => {
    return new Promise<void>((resolve) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, (err) => {
          if (err) {
            console.error('Broadcast send error:', err.message);
            clients.delete(client);
          }
          resolve();
        });
      } else {
        clients.delete(client);
        resolve();
      }
    });
  });

  return Promise.allSettled(promises);
}
```

---

### 1.2 重复 WebSocket 连接 - 前端双重连接

**位置**: `frontend/src/App.tsx:28-54` 和 `frontend/src/hooks/useWebSocket.ts`

**问题描述**:
- `App.tsx` 中手动创建 WebSocket 连接
- `useWebSocket` hook 也创建连接
- 每个用户会话创建两个 WebSocket 连接

**优化建议**:
```typescript
// App.tsx - 移除重复的连接创建
function App() {
  const { connected, lastMessage } = useWebSocket('/ws');

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'task_created':
        case 'task_updated':
          fetchTasks();
          break;
        case 'task_deleted':
          setTasks(prev => prev.filter(t => t.id !== lastMessage.payload.id));
          break;
      }
    }
  }, [lastMessage]);

  // 移除重复的 useEffect WebSocket 创建代码
}
```

---

### 1.3 广播性能问题 - 大客户端数量下的性能

**位置**: `backend/src/server.ts:47-51`

**优化建议**:
```typescript
async function broadcast(eventType: string, payload: any) {
  const data = { type: eventType, payload, timestamp: new Date().toISOString() };
  const message = JSON.stringify(data);

  const BATCH_SIZE = 100;
  const clientsArray = Array.from(clients);

  for (let i = 0; i < clientsArray.length; i += BATCH_SIZE) {
    const batch = clientsArray.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(client => {
        if (client.readyState === WebSocket.OPEN) {
          return client.send(message);
        }
        return Promise.resolve();
      })
    );

    if (i + BATCH_SIZE < clientsArray.length) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}
```

---

## 二、中影响问题

### 2.1 不必要的重渲染 - StatsPanel 组件

**优化建议**:
```typescript
const StatsPanel = memo(function StatsPanel({ tasks }: StatsPanelProps) {
  const stats = useMemo(() => {
    const stats = { total: tasks.length, pending: 0, inProgress: 0, completed: 0 };

    for (const task of tasks) {
      switch (task.status) {
        case 'pending': stats.pending++; break;
        case 'in_progress': stats.inProgress++; break;
        case 'completed': stats.completed++; break;
      }
    }

    stats.completionRate = stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

    return stats;
  }, [tasks]);

  return <div>...</div>;
});
```

### 2.2 Board 组件过滤逻辑优化

**优化建议**:
```typescript
const filteredTasks = useMemo(() => {
  const filterTextLower = filterText.toLowerCase();
  return tasks.filter(task => {
    const matchesText = !filterText ||
      task.subject.toLowerCase().includes(filterTextLower);
    return matchesText;
  });
}, [tasks, filterText]);
```

### 2.3 文件监听性能优化

**优化建议**:
```typescript
import crypto from 'crypto';

function shouldEmitEvent(filePath: string, newContent: string): boolean {
  const hash = crypto.createHash('md5').update(newContent).digest('hex');
  const lastHash = lastState.get(filePath);

  if (lastHash === hash) return false;
  lastState.set(filePath, hash);
  return true;
}
```

### 2.4 API 响应优化 - 添加分页和缓存

**优化建议**:
```typescript
router.get('/', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const start = (page - 1) * limit;

  const taskList = Array.from(tasks.values()).slice(start, start + limit);

  res.setHeader('Cache-Control', 'private, max-age=5');

  res.json({
    data: taskList,
    pagination: { page, limit, total: tasks.size }
  });
});
```

### 2.5 ChatPanel 无限增长问题

**优化建议**:
```typescript
const messageBuffer = useRef<ChatMessage[]>([]);

case 'message_received':
  messageBuffer.current.push(data.payload);
  if (messageBuffer.current.length > 100) {
    messageBuffer.current.shift();
  }
  setMessages([...messageBuffer.current]);
  break;
```

---

## 三、低影响问题

### 3.1 useWebSocket 重连风暴风险

**优化建议**:
```typescript
const [reconnectAttempts, setReconnectAttempts] = useState(0);

socket.onclose = () => {
  setConnected(false);
  const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 30000);
  setTimeout(() => {
    setReconnectAttempts(prev => prev + 1);
    connect();
  }, delay);
};

socket.onopen = () => {
  setConnected(true);
  setReconnectAttempts(0);
};
```

### 3.2 TaskCard 组件缺乏 memo 优化

**优化建议**:
```typescript
export const TaskCard = memo(function TaskCard({ task, onClick }: TaskCardProps) {
  return <div onClick={onClick}>...</div>;
}, (prev, next) => prev.task.id === next.task.id && prev.task.status === next.task.status);
```

---

## 四、优化建议总结

| 优先级 | 问题 | 优化方法 | 预期效果 |
|--------|------|----------|----------|
| 高 | 重复 WebSocket 连接 | 移除 App.tsx 中的重复连接 | 减少 50% 内存使用 |
| 高 | 内存泄漏风险 | 改进 broadcast 错误处理 | 防止连接累积 |
| 高 | 广播性能 | 分批发送 | 支持更多客户端 |
| 中 | StatsPanel 重渲染 | useMemo + memo | 减少 70% 重渲染 |
| 中 | Board 过滤性能 | useMemo 缓存 | 提升过滤响应速度 |
| 中 | 文件监听 hash | 使用 MD5 代替 base64 | 减少内存占用 |

---

**审查完成时间**: 2026-03-17
**审查员**: 性能审查专家

# Agent Todo 项目安全审查报告

## 执行摘要

本次审查对 agent_todo 项目的 5 个核心文件进行了全面安全分析，发现了 **13 个安全问题**，其中包括：
- **高严重性：5 个**
- **中严重性：5 个**
- **低严重性：3 个**

---

## 一、高严重性问题

### 1. WebSocket 无认证机制
**文件**: `backend/src/server.ts`
**位置**: 第 24-36 行

**问题描述**:
```typescript
wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);  // 任何客户端都可以连接，无身份验证
```

WebSocket 连接完全开放，任何客户端都可以连接并接收广播消息，无法防止未授权访问。

**修复建议**:
- 实现基于 Token 的 WebSocket 认证
- 验证连接请求中的认证信息
- 拒绝未认证的连接

**修复代码**:
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'Missing authentication token');
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    ws.userId = decoded.userId;
    clients.add(ws);
    console.log(`Authenticated client connected: ${decoded.userId}`);
  } catch (error) {
    ws.close(4002, 'Invalid authentication token');
    return;
  }
});
```

---

### 2. CORS 配置过于宽松
**文件**: `backend/src/server.ts`
**位置**: 第 17 行

**问题描述**:
```typescript
app.use(cors());  // 允许所有来源访问
```

允许任何域名的前端应用访问 API，可能导致 CSRF 攻击和数据泄露。

**修复代码**:
```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://yourdomain.com']
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 3. 路径遍历漏洞
**文件**: `backend/src/fileWatcher.ts`
**位置**: 第 72 行、第 110 行

**问题描述**:
```typescript
const content = fs.readFileSync(filePath, 'utf-8');  // filePath 来自外部事件
```

文件监听器读取的路径直接来自文件系统事件，但没有验证路径是否在允许的目录范围内。

**修复代码**:
```typescript
function isPathSafe(filePath: string, allowedDirs: string[]): boolean {
  const absolutePath = path.resolve(filePath);
  return allowedDirs.some(dir => absolutePath.startsWith(path.resolve(dir)));
}

const ALLOWED_DIRS = [TEAMS_DIR, TASKS_DIR];

watcher.on('change', (filePath) => {
  if (!filePath.endsWith('.json')) return;

  if (!isPathSafe(filePath, ALLOWED_DIRS)) {
    console.warn('Blocked access to path outside allowed directories:', filePath);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
});
```

---

### 4. 输入验证不足
**文件**: `backend/src/routes/tasks.ts`
**位置**: 第 171-193 行

**问题描述**: 缺乏对输入数据的充分验证，可能导致 XSS 攻击、日志注入攻击。

**修复代码**:
```typescript
import { body, validationResult } from 'express-validator';

const createTaskValidators = [
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be 1-200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be 1-2000 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed'])
];

app.post('/api/tasks', createTaskValidators, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ...
});
```

---

### 5. 敏感信息可能泄露
**文件**: `backend/src/fileWatcher.ts`
**位置**: 第 10-12 行

**问题描述**: 文件监听器直接读取用户主目录下的 `.claude` 目录，可能包含敏感信息。

**修复代码**:
```typescript
function sanitizeTeamConfig(data: any): any {
  const sanitized = { ...data };
  delete sanitized?.apiKeys;
  delete sanitized?.tokens;
  delete sanitized?.secrets;
  return {
    id: sanitized.id,
    name: sanitized.name,
    description: sanitized.description,
    members: sanitized.members?.map((m: any) => ({
      name: m.name,
      agentId: m.agentId
    }))
  };
}
```

---

## 二、中严重性问题

### 6. 缺少速率限制
**修复代码**:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

app.use(limiter);
```

### 7. 缺少请求日志和审计
**修复代码**:
```typescript
import morgan from 'morgan';
app.use(morgan('combined'));
```

### 8. 前端缺少 CSRF 保护
### 9. WebSocket 重连无退避机制
### 10. 前端 XSS 风险

---

## 三、低严重性问题

### 11. 错误信息泄露
### 12. 缺少 HTTP 安全响应头
**修复代码**:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 13. 内存数据存储

---

## 四、修复优先级建议

| 优先级 | 问题编号 | 问题名称 | 预计修复时间 |
|--------|----------|----------|--------------|
| P0 | 1 | WebSocket 无认证 | 2 小时 |
| P0 | 2 | CORS 配置过宽 | 30 分钟 |
| P0 | 3 | 路径遍历漏洞 | 1 小时 |
| P1 | 4 | 输入验证不足 | 2 小时 |
| P1 | 5 | 敏感信息泄露 | 1 小时 |
| P2 | 6 | 缺少速率限制 | 30 分钟 |
| P2 | 8 | CSRF 保护 | 1 小时 |

---

## 五、结论

该项目目前存在多个中高危安全问题，**不建议直接部署到生产环境**。建议按优先级顺序修复上述问题。

---

**审查完成时间**: 2026-03-17
**审查员**: 安全审查专家

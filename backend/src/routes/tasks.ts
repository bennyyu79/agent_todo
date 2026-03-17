import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../../../shared/types';

const router = Router();

// In-memory task storage (in production, use a database)
const tasks: Map<string, Task> = new Map();

// Initialize with some sample tasks
function initializeSampleTasks() {
  const sampleTasks: Task[] = [
    {
      id: uuidv4(),
      subject: '初始化项目结构和配置',
      description: '创建 monorepo 项目结构，配置 TypeScript、ESLint、package.json 等基础配置文件',
      status: 'completed',
      owner: 'team-lead',
      activeForm: '初始化项目结构',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: uuidv4(),
      subject: '实现后端 REST API 和 WebSocket 服务器',
      description: '实现 Express 服务器、REST API 路由、WebSocket 服务器用于实时推送',
      status: 'in_progress',
      owner: 'backend-dev',
      activeForm: '实现后端 API',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      subject: '实现前端看板组件',
      description: '实现三列看板、任务卡片、拖拽功能',
      status: 'pending',
      owner: 'frontend-dev',
      activeForm: '实现看板组件',
      blockedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      subject: '实现聊天面板组件',
      description: '实现聊天面板显示 Agent 对话历史',
      status: 'pending',
      owner: 'frontend-dev',
      blockedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  sampleTasks.forEach(task => tasks.set(task.id, task));
}

// Initialize if empty
if (tasks.size === 0) {
  initializeSampleTasks();
}

// GET all tasks
router.get('/', (_req: Request, res: Response) => {
  const taskList = Array.from(tasks.values());
  res.json(taskList);
});

// GET task by ID
router.get('/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// CREATE task
router.post('/', (req: Request, res: Response) => {
  const { subject, description, status, owner }: CreateTaskRequest = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required' });
  }

  const now = new Date().toISOString();
  const newTask: Task = {
    id: uuidv4(),
    subject,
    description,
    status: status || 'pending',
    owner,
    createdAt: now,
    updatedAt: now
  };

  tasks.set(newTask.id, newTask);

  // Broadcast to WebSocket clients
  (res as any).broadcast('task_created', newTask);

  res.status(201).json(newTask);
});

// UPDATE task
router.put('/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { subject, description, status, owner, addBlocks, addBlockedBy }: UpdateTaskRequest = req.body;

  const updatedTask: Task = {
    ...task,
    subject: subject ?? task.subject,
    description: description ?? task.description,
    status: status ?? task.status,
    owner: owner ?? task.owner,
    blocks: addBlocks ? [...(task.blocks || []), ...addBlocks] : task.blocks,
    blockedBy: addBlockedBy ? [...(task.blockedBy || []), ...addBlockedBy] : task.blockedBy,
    updatedAt: new Date().toISOString()
  };

  tasks.set(updatedTask.id, updatedTask);

  // Broadcast to WebSocket clients
  (res as any).broadcast('task_updated', updatedTask);

  res.json(updatedTask);
});

// DELETE task
router.delete('/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.delete(req.params.id);

  // Broadcast to WebSocket clients
  (res as any).broadcast('task_deleted', { id: req.params.id });

  res.status(204).send();
});

export const applyTaskRoutes = (app: any, broadcast: any) => {
  // Broadcast function wrapper
  const broadcastTask = (eventType: string, payload: any) => {
    broadcast(eventType, payload);
  };

  // GET all tasks
  app.get('/api/tasks', (_req: Request, res: Response) => {
    const taskList = Array.from(tasks.values());
    res.json(taskList);
  });

  // GET task by ID
  app.get('/api/tasks/:id', (req: Request, res: Response) => {
    const task = tasks.get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  });

  // CREATE task
  app.post('/api/tasks', (req: Request, res: Response) => {
    const { subject, description, status, owner }: CreateTaskRequest = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      subject,
      description,
      status: status || 'pending',
      owner,
      createdAt: now,
      updatedAt: now
    };

    tasks.set(newTask.id, newTask);
    broadcastTask('task_created', newTask);

    res.status(201).json(newTask);
  });

  // UPDATE task
  app.put('/api/tasks/:id', (req: Request, res: Response) => {
    const task = tasks.get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { subject, description, status, owner, addBlocks, addBlockedBy }: UpdateTaskRequest = req.body;

    const updatedTask: Task = {
      ...task,
      subject: subject ?? task.subject,
      description: description ?? task.description,
      status: status ?? task.status,
      owner: owner ?? task.owner,
      blocks: addBlocks ? [...(task.blocks || []), ...addBlocks] : task.blocks,
      blockedBy: addBlockedBy ? [...(task.blockedBy || []), ...addBlockedBy] : task.blockedBy,
      updatedAt: new Date().toISOString()
    };

    tasks.set(updatedTask.id, updatedTask);
    broadcastTask('task_updated', updatedTask);

    res.json(updatedTask);
  });

  // DELETE task
  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    const task = tasks.get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    tasks.delete(req.params.id);
    broadcastTask('task_deleted', { id: req.params.id });

    res.status(204).send();
  });
};

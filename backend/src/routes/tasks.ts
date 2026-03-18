import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../../../shared/types';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

const router = Router();

// Real data directories
const CLAUDE_DIR = path.join(homedir(), '.claude');
const TASKS_DIR = path.join(CLAUDE_DIR, 'tasks');

// In-memory task storage for tasks created via API (not from real files)
const apiTasks: Map<string, Task> = new Map();

// Helper function to read JSON file safely
function readJsonFile(filePath: string): any {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// Load tasks from real .claude/tasks directory
function loadTasksFromFiles(): Task[] {
  const tasks: Task[] = [];

  if (!fs.existsSync(TASKS_DIR)) {
    console.log('Tasks directory not found:', TASKS_DIR);
    return tasks;
  }

  const taskDirs = fs.readdirSync(TASKS_DIR);

  for (const taskDir of taskDirs) {
    const taskPath = path.join(TASKS_DIR, taskDir);

    if (fs.statSync(taskPath).isDirectory()) {
      const files = fs.readdirSync(taskPath);
      for (const file of files) {
        // Skip .lock files and .highwatermark files
        if (file.startsWith('.') || !file.endsWith('.json')) {
          continue;
        }

        const filePath = path.join(taskPath, file);
        const taskData = readJsonFile(filePath);

        if (taskData && taskData.subject) {
          // Convert to Task format
          const task: Task = {
            id: taskData.id || `${taskDir}-${file.replace('.json', '')}`,
            subject: taskData.subject,
            description: taskData.description || '',
            status: (taskData.status as TaskStatus) || 'pending',
            owner: taskData.owner || 'unassigned',
            activeForm: taskData.activeForm,
            blockedBy: taskData.blockedBy || [],
            blocks: taskData.blocks || [],
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: taskData.updatedAt || new Date().toISOString(),
            teamId: taskDir // Add team association
          };
          tasks.push(task);
        }
      }
    }
  }

  console.log(`Loaded ${tasks.length} tasks from ${TASKS_DIR}`);
  return tasks;
}

// Load tasks on startup
const fileTasks = loadTasksFromFiles();

// GET all tasks (from real files + API tasks)
router.get('/', (_req: Request, res: Response) => {
  const taskList = [...fileTasks, ...apiTasks.values()];
  res.json(taskList);
});

// GET task by ID
router.get('/:id', (req: Request, res: Response) => {
  const task = apiTasks.get(req.params.id);
  if (task) {
    return res.json(task);
  }

  // Also search in file tasks
  const fileTask = fileTasks.find(t => t.id === req.params.id);
  if (fileTask) {
    return res.json(fileTask);
  }

  return res.status(404).json({ error: 'Task not found' });
});

// CREATE task (via API)
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

  apiTasks.set(newTask.id, newTask);

  // Broadcast to WebSocket clients
  (res as any).broadcast('task_created', newTask);

  res.status(201).json(newTask);
});

// UPDATE task
router.put('/:id', (req: Request, res: Response) => {
  let task = apiTasks.get(req.params.id);

  // Also check file tasks
  if (!task) {
    const fileTaskIndex = fileTasks.findIndex(t => t.id === req.params.id);
    if (fileTaskIndex >= 0) {
      task = { ...fileTasks[fileTaskIndex] };
    }
  }

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

  // Update in memory
  apiTasks.set(updatedTask.id, updatedTask);

  // Broadcast to WebSocket clients
  (res as any).broadcast('task_updated', updatedTask);

  res.json(updatedTask);
});

// DELETE task
router.delete('/:id', (req: Request, res: Response) => {
  const task = apiTasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  apiTasks.delete(req.params.id);

  // Broadcast to WebSocket clients
  (res as any).broadcast('task_deleted', { id: req.params.id });

  res.status(204).send();
});

export const applyTaskRoutes = (app: any, broadcast: any) => {
  // Broadcast function wrapper
  const broadcastTask = (eventType: string, payload: any) => {
    broadcast(eventType, payload);
  };

  // GET all tasks (from real files + API tasks)
  app.get('/api/tasks', (_req: Request, res: Response) => {
    const taskList = [...fileTasks, ...apiTasks.values()];
    res.json(taskList);
  });

  // GET task by ID
  app.get('/api/tasks/:id', (req: Request, res: Response) => {
    let task = apiTasks.get(req.params.id);

    // Also search in file tasks
    if (!task) {
      task = fileTasks.find(t => t.id === req.params.id);
    }

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  });

  // CREATE task (via API)
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

    apiTasks.set(newTask.id, newTask);
    broadcastTask('task_created', newTask);

    res.status(201).json(newTask);
  });

  // UPDATE task
  app.put('/api/tasks/:id', (req: Request, res: Response) => {
    let task = apiTasks.get(req.params.id);

    // Also check file tasks
    if (!task) {
      const fileTaskIndex = fileTasks.findIndex(t => t.id === req.params.id);
      if (fileTaskIndex >= 0) {
        task = { ...fileTasks[fileTaskIndex] };
      }
    }

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

    apiTasks.set(updatedTask.id, updatedTask);
    broadcastTask('task_updated', updatedTask);

    res.json(updatedTask);
  });

  // DELETE task
  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    const task = apiTasks.get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    apiTasks.delete(req.params.id);
    broadcastTask('task_deleted', { id: req.params.id });

    res.status(204).send();
  });
};

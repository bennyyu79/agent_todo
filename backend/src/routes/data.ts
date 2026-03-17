import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

const router = Router();

const CLAUDE_DIR = path.join(homedir(), '.claude');
const TEAMS_DIR = path.join(CLAUDE_DIR, 'teams');
const TASKS_DIR = path.join(CLAUDE_DIR, 'tasks');
const INBOXES_DIR = path.join(CLAUDE_DIR, 'inboxes');

interface TeamConfig {
  name: string;
  description?: string;
  agent_type?: string;
  members?: Array<{
    name: string;
    agentId: string;
    agentType: string;
  }>;
}

interface TaskData {
  id: string;
  subject: string;
  description: string;
  status?: string;
  owner?: string;
  activeForm?: string;
  blockedBy?: string[];
  blocks?: string[];
  createdAt?: string;
  updatedAt?: string;
}

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

// Helper function to read all team configs
function readAllTeams(): Array<TeamConfig & { id: string; path: string }> {
  const teams: Array<TeamConfig & { id: string; path: string }> = [];

  if (!fs.existsSync(TEAMS_DIR)) {
    return teams;
  }

  const teamDirs = fs.readdirSync(TEAMS_DIR);

  for (const teamDir of teamDirs) {
    const teamPath = path.join(TEAMS_DIR, teamDir);
    const configPath = path.join(teamPath, 'config.json');

    if (fs.statSync(teamPath).isDirectory()) {
      const config = readJsonFile(configPath);
      if (config) {
        teams.push({
          ...config,
          id: teamDir,
          path: teamPath
        });
      }
    }
  }

  return teams;
}

// Helper function to read all tasks
function readAllTasks(): TaskData[] {
  const tasks: TaskData[] = [];

  if (!fs.existsSync(TASKS_DIR)) {
    return tasks;
  }

  const taskDirs = fs.readdirSync(TASKS_DIR);

  for (const taskDir of taskDirs) {
    const taskPath = path.join(TASKS_DIR, taskDir);

    if (fs.statSync(taskPath).isDirectory()) {
      // Read all JSON files in the task directory
      const files = fs.readdirSync(taskPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(taskPath, file);
          const taskData = readJsonFile(filePath);
          if (taskData) {
            tasks.push({
              ...taskData,
              id: taskData.id || `${taskDir}-${file}`
            });
          }
        }
      }
    }
  }

  return tasks;
}

// Helper function to read all inbox messages
function readAllInboxes(): Array<any & { teamId: string; path: string }> {
  const messages: Array<any & { teamId: string; path: string }> = [];

  if (!fs.existsSync(INBOXES_DIR)) {
    return messages;
  }

  const inboxDirs = fs.readdirSync(INBOXES_DIR);

  for (const inboxDir of inboxDirs) {
    const inboxPath = path.join(INBOXES_DIR, inboxDir);

    if (fs.statSync(inboxPath).isDirectory()) {
      const files = fs.readdirSync(inboxPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(inboxPath, file);
          const messageData = readJsonFile(filePath);
          if (messageData) {
            messages.push({
              ...messageData,
              teamId: inboxDir,
              path: filePath
            });
          }
        }
      }
    }
  }

  return messages;
}

// GET all teams
router.get('/teams', (_req: Request, res: Response) => {
  const teams = readAllTeams();
  res.json(teams);
});

// GET all tasks
router.get('/tasks/all', (_req: Request, res: Response) => {
  const tasks = readAllTasks();
  res.json(tasks);
});

// GET all inbox messages
router.get('/inboxes/all', (_req: Request, res: Response) => {
  const messages = readAllInboxes();
  res.json(messages);
});

// GET all data (teams, tasks, messages)
router.get('/all', (_req: Request, res: Response) => {
  const teams = readAllTeams();
  const tasks = readAllTasks();
  const messages = readAllInboxes();

  res.json({
    teams,
    tasks,
    messages,
    stats: {
      totalTeams: teams.length,
      totalTasks: tasks.length,
      totalMessages: messages.length,
      tasksByStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length
      }
    }
  });
});

// GET team by ID
router.get('/teams/:teamId', (req: Request, res: Response) => {
  const { teamId } = req.params;
  const teamPath = path.join(TEAMS_DIR, teamId, 'config.json');
  const team = readJsonFile(teamPath);

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  res.json({ ...team, id: teamId });
});

// GET tasks for a specific team
router.get('/teams/:teamId/tasks', (req: Request, res: Response) => {
  const { teamId } = req.params;
  const allTasks = readAllTasks();
  // Filter tasks by team (assuming task has owner or team reference)
  const teamTasks = allTasks.filter(task =>
    task.owner === teamId || task.description?.includes(teamId)
  );
  res.json(teamTasks);
});

// GET messages for a specific team
router.get('/teams/:teamId/messages', (req: Request, res: Response) => {
  const { teamId } = req.params;
  const allMessages = readAllInboxes();
  const teamMessages = allMessages.filter(msg => msg.teamId === teamId);
  res.json(teamMessages);
});

export const applyDataRoutes = (app: any) => {
  app.use('/api/data', router);
};

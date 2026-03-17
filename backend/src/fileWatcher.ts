import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { homedir } from 'os';

// Broadcast function type
type BroadcastFn = (eventType: string, payload: any) => void;

// Watched directories
const CLAUDE_DIR = path.join(homedir(), '.claude');
const TEAMS_DIR = path.join(CLAUDE_DIR, 'teams');
const TASKS_DIR = path.join(CLAUDE_DIR, 'tasks');

// Track last known state to avoid duplicate events
const lastState = new Map<string, string>();

function shouldEmitEvent(filePath: string, newContent: string): boolean {
  const hash = Buffer.from(newContent).toString('base64');
  const lastHash = lastState.get(filePath);

  if (lastHash === hash) {
    return false;
  }

  lastState.set(filePath, hash);
  return true;
}

function parseTeamConfig(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function parseTaskFile(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function setupFileWatcher(broadcast: BroadcastFn) {
  // Check if directories exist
  if (!fs.existsSync(CLAUDE_DIR)) {
    console.log('Claude directory not found at:', CLAUDE_DIR);
    console.log('Running in simulation mode only');
    return;
  }

  console.log('Setting up file watcher for:', CLAUDE_DIR);

  const watcher = chokidar.watch([
    TEAMS_DIR,
    TASKS_DIR
  ], {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  // Handle team config changes
  watcher.on('change', (filePath) => {
    if (!filePath.endsWith('.json')) return;

    const content = fs.readFileSync(filePath, 'utf-8');

    if (!shouldEmitEvent(filePath, content)) {
      return;
    }

    // Team config file
    if (filePath.includes('/teams/') && filePath.endsWith('/config.json')) {
      const teamData = parseTeamConfig(content);
      if (teamData) {
        console.log('Team config updated:', teamData.name || filePath);
        broadcast('team_updated', teamData);
      }
    }

    // Task file changes
    if (filePath.includes('/tasks/')) {
      const taskData = parseTaskFile(content);
      if (taskData) {
        console.log('Task file updated:', filePath);
        broadcast('task_updated', taskData);
      }
    }

    // Inbox message files
    if (filePath.includes('/inboxes/')) {
      const messageData = parseTaskFile(content);
      if (messageData) {
        console.log('Message received in inbox:', filePath);
        broadcast('message_received', messageData);
      }
    }
  });

  watcher.on('add', (filePath) => {
    console.log('File added:', filePath);

    if (filePath.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf-8');

      if (filePath.includes('/tasks/') && !filePath.includes('/inboxes/')) {
        const taskData = parseTaskFile(content);
        if (taskData) {
          broadcast('task_created', taskData);
        }
      }
    }
  });

  watcher.on('unlink', (filePath) => {
    console.log('File removed:', filePath);
    lastState.delete(filePath);
  });

  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  watcher.on('ready', () => {
    console.log('File watcher ready');
  });

  return watcher;
}

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
const INBOXES_DIR = path.join(CLAUDE_DIR, 'inboxes');

// Debug logging
function debugLog(message: string, ...args: any[]) {
  console.log('[FileWatcher]', message, ...args);
}

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

// Load initial data from a directory
function loadInitialData(directory: string, broadcast: BroadcastFn) {
  if (!fs.existsSync(directory)) return;

  try {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const itemPath = path.join(directory, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Recursively load subdirectories
        loadInitialData(itemPath, broadcast);
      } else if (item.endsWith('.json')) {
        // Load JSON file
        const content = fs.readFileSync(itemPath, 'utf-8');

        // Set initial state to avoid re-broadcasting on watch
        lastState.set(itemPath, Buffer.from(content).toString('base64'));

        // Team config file
        if (itemPath.includes('teams') && item.endsWith('/config.json')) {
          const teamData = parseTeamConfig(content);
          if (teamData) {
            debugLog('Loaded team config:', teamData.name || itemPath);
          }
        }
        // Task file
        else if (itemPath.includes('tasks') && !itemPath.includes('inboxes')) {
          const taskData = parseTaskFile(content);
          if (taskData) {
            debugLog('Loaded task:', taskData.subject || itemPath);
          }
        }
        // Inbox message
        else if (itemPath.includes('inboxes')) {
          const messageData = parseTaskFile(content);
          if (messageData) {
            debugLog('Loaded message:', itemPath);
            // Broadcast existing messages
            broadcast('message_received', messageData);
          }
        }
      }
    }
  } catch (error) {
    debugLog('Error loading initial data from', directory, error);
  }
}

export function setupFileWatcher(broadcast: BroadcastFn) {
  // Check if directories exist
  const existingDirs: string[] = [];

  if (!fs.existsSync(CLAUDE_DIR)) {
    debugLog('Claude directory not found at:', CLAUDE_DIR);
    debugLog('Cannot monitor real data - .claude directory does not exist');
    return null;
  }

  // Check which directories exist and add them to watch list
  [TEAMS_DIR, TASKS_DIR, INBOXES_DIR].forEach(dir => {
    if (fs.existsSync(dir)) {
      existingDirs.push(dir);
      debugLog('Directory exists and will be watched:', dir);
    } else {
      debugLog('Directory does not exist, skipping:', dir);
    }
  });

  if (existingDirs.length === 0) {
    debugLog('No valid directories to watch (.claude/teams, .claude/tasks, or .claude/inboxes not found)');
    return null;
  }

  debugLog('Setting up file watcher for directories:', existingDirs);

  // Load initial data from all directories
  debugLog('Loading initial data from .claude directories...');
  existingDirs.forEach(dir => loadInitialData(dir, broadcast));
  debugLog('Initial data loading complete');

  const watcher = chokidar.watch(
    existingDirs,
    {
      ignored: /node_modules/,
      ignoreInitial: true,
      persistent: true,
      recursive: true, // 递归监听子目录
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      },
      usePolling: false, // 使用原生文件系统事件
      depth: 99 // 监听深度
    }
  );

  // Handle team config changes
  watcher.on('change', (filePath) => {
    debugLog('File changed:', filePath);

    if (!filePath.endsWith('.json')) return;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      if (!shouldEmitEvent(filePath, content)) {
        debugLog('File content unchanged, skipping');
        return;
      }

      // Team config file - use cross-platform path matching
      if (filePath.includes('teams') && filePath.endsWith('/config.json')) {
        const teamData = parseTeamConfig(content);
        if (teamData) {
          debugLog('Team config updated:', teamData.name || filePath);
          broadcast('team_updated', teamData);
        }
      }
      // Task file changes
      else if (filePath.includes('tasks') && !filePath.includes('inboxes')) {
        const taskData = parseTaskFile(content);
        if (taskData) {
          debugLog('Task file updated:', filePath);
          broadcast('task_updated', taskData);
        }
      }
      // Inbox message files
      else if (filePath.includes('inboxes')) {
        const messageData = parseTaskFile(content);
        if (messageData) {
          debugLog('Message received in inbox:', filePath);
          broadcast('message_received', messageData);
        }
      }
    } catch (error) {
      debugLog('Error reading file:', filePath, error);
    }
  });

  watcher.on('add', (filePath) => {
    debugLog('File added:', filePath);

    if (!filePath.endsWith('.json')) return;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Team config file
      if (filePath.includes('teams') && filePath.endsWith('/config.json')) {
        const teamData = parseTeamConfig(content);
        if (teamData) {
          debugLog('New team config:', teamData.name);
          broadcast('team_updated', teamData);
        }
      }
      // Task file
      else if (filePath.includes('tasks') && !filePath.includes('inboxes')) {
        const taskData = parseTaskFile(content);
        if (taskData) {
          debugLog('Task created:', filePath);
          broadcast('task_created', taskData);
        }
      }
      // Inbox message
      else if (filePath.includes('inboxes')) {
        const messageData = parseTaskFile(content);
        if (messageData) {
          debugLog('New inbox message:', filePath);
          broadcast('message_received', messageData);
        }
      }
    } catch (error) {
      debugLog('Error reading new file:', filePath, error);
    }
  });

  watcher.on('unlink', (filePath) => {
    debugLog('File removed:', filePath);
    lastState.delete(filePath);
  });

  watcher.on('error', (error) => {
    debugLog('Watcher error:', error);
  });

  watcher.on('ready', () => {
    debugLog('File watcher ready');
    debugLog('Watching directories:', existingDirs);
    debugLog('Real-time updates enabled for .claude directory');
  });

  return watcher;
}

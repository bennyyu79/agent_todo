import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../../../shared/types';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

const CLAUDE_DIR = path.join(homedir(), '.claude');
const TEAMS_DIR = path.join(CLAUDE_DIR, 'teams');

// In-memory message storage for messages added via API
const apiMessages: Map<string, ChatMessage[]> = new Map();

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

// Load messages from real .claude/teams/*/inboxes directory
function loadMessagesFromFiles(): ChatMessage[] {
  const messages: ChatMessage[] = [];

  if (!fs.existsSync(TEAMS_DIR)) {
    console.log('Teams directory not found:', TEAMS_DIR);
    return messages;
  }

  const teamDirs = fs.readdirSync(TEAMS_DIR);

  for (const teamDir of teamDirs) {
    const teamPath = path.join(TEAMS_DIR, teamDir);
    const inboxesPath = path.join(teamPath, 'inboxes');

    // Check if this is a directory and has an inboxes subdirectory
    if (fs.statSync(teamPath).isDirectory() && fs.existsSync(inboxesPath)) {
      const files = fs.readdirSync(inboxesPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(inboxesPath, file);
          const messageData = readJsonFile(filePath);
          if (messageData) {
            // messageData can be an array (inbox file) or a single message object
            if (Array.isArray(messageData)) {
              // Inbox file contains an array of messages
              messageData.forEach((msg: any) => {
                // Convert to ChatMessage format
                const chatMessage: ChatMessage = {
                  id: uuidv4(),
                  sender: msg.from || 'unknown',
                  senderType: msg.from === 'team-lead' ? 'lead' : 'agent',
                  content: msg.text || '',
                  timestamp: msg.timestamp || new Date().toISOString(),
                  teamId: teamDir,
                  isProtocol: msg.text && msg.text.startsWith('{'),
                  color: msg.color
                };
                messages.push(chatMessage);
              });
            } else {
              // Single message object
              const chatMessage: ChatMessage = {
                id: uuidv4(),
                sender: messageData.from || 'unknown',
                senderType: messageData.from === 'team-lead' ? 'lead' : 'agent',
                content: messageData.text || '',
                timestamp: messageData.timestamp || new Date().toISOString(),
                teamId: teamDir,
                isProtocol: messageData.text && messageData.text.startsWith('{'),
                color: messageData.color
              };
              messages.push(chatMessage);
            }
          }
        }
      }
    }
  }

  console.log(`Loaded ${messages.length} messages from ${TEAMS_DIR}/inboxes`);
  return messages;
}

// Load messages on startup
const fileMessages = loadMessagesFromFiles();

// Add a message (used by API and file watcher)
export function addMessage(message: ChatMessage) {
  const key = message.teamId || 'default';
  if (!apiMessages.has(key)) {
    apiMessages.set(key, []);
  }
  apiMessages.get(key)!.push(message);

  // Keep only last 1000 messages per team
  const teamMessages = apiMessages.get(key)!;
  if (teamMessages.length > 1000) {
    teamMessages.shift();
  }
}

// Get all messages (from files + API)
function getAllMessages(): ChatMessage[] {
  const allMessages = [...fileMessages];
  apiMessages.forEach((teamMessages) => {
    allMessages.push(...teamMessages);
  });
  return allMessages;
}

export const applyMessageRoutes = (app: any, broadcast: any) => {
  // Get messages for a team
  app.get('/api/messages/team/:teamId', (req: Request, res: Response) => {
    const teamId = req.params.teamId;
    const allMessages = getAllMessages();
    const teamMessages = allMessages.filter(m => m.teamId === teamId);
    res.json(teamMessages);
  });

  // Get recent messages (last N)
  app.get('/api/messages/recent/:limit?', (req: Request, res: Response) => {
    const limit = parseInt(req.params.limit || '50', 10);
    const allMessages = getAllMessages();

    // Sort by timestamp and get recent
    allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(allMessages.slice(0, limit));
  });

  // Add a message via API
  app.post('/api/messages/add', (req: Request, res: Response) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      sender: req.body.sender || 'system',
      senderType: req.body.senderType || 'system',
      content: req.body.content,
      timestamp: new Date().toISOString(),
      teamId: req.body.teamId || 'default',
      isProtocol: req.body.isProtocol || false
    };

    addMessage(newMessage);
    res.json(newMessage);
  });
};

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../../../shared/types';

// In-memory message storage
const messages: Map<string, ChatMessage[]> = new Map();

// Add a message (used by simulator and file watcher)
export function addMessage(message: ChatMessage) {
  if (!messages.has(message.teamId)) {
    messages.set(message.teamId, []);
  }
  messages.get(message.teamId)!.push(message);

  // Keep only last 1000 messages per team
  const teamMessages = messages.get(message.teamId)!;
  if (teamMessages.length > 1000) {
    teamMessages.shift();
  }
}

export const applyMessageRoutes = (app: any, broadcast: any) => {
  // Get messages for a team
  app.get('/api/messages/team/:teamId', (req: Request, res: Response) => {
    const teamId = req.params.teamId;
    const teamMessages = messages.get(teamId) || [];
    res.json(teamMessages);
  });

  // Get recent messages (last N)
  app.get('/api/messages/recent/:limit?', (req: Request, res: Response) => {
    const limit = parseInt(req.params.limit || '50', 10);
    const allMessages: ChatMessage[] = [];

    messages.forEach((teamMessages) => {
      allMessages.push(...teamMessages);
    });

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

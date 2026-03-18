// Frontend TypeScript types

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  subject: string;
  description: string;
  status: TaskStatus;
  owner?: string;
  activeForm?: string;
  metadata?: Record<string, any>;
  blocks?: string[];
  blockedBy?: string[];
  createdAt: string;
  updatedAt: string;
  teamId?: string; // Team association for tasks loaded from .claude directory
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderType: 'agent' | 'lead' | 'user' | 'system';
  content: string;
  timestamp: string;
  teamId: string;
  isProtocol?: boolean;
  color?: string; // Optional color for visual distinction
  inboxMemberName?: string; // Name of the member who received this message (inbox file name)
}

export interface ColumnType {
  id: TaskStatus;
  title: string;
}

export const COLUMNS: ColumnType[] = [
  { id: 'pending', title: '待处理' },
  { id: 'in_progress', title: '进行中' },
  { id: 'completed', title: '已完成' }
];

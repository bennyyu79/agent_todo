// Shared TypeScript types for Agent Teams Kanban Board

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
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: string;
}

export interface TeamMember {
  name: string;
  agentId: string;
  agentType: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  type: 'text' | 'protocol';
  content: string | ProtocolMessage;
  timestamp: string;
  teamId: string;
}

export interface ProtocolMessage {
  type: 'shutdown_request' | 'shutdown_response' | 'plan_approval_request' | 'plan_approval_response';
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderType: 'agent' | 'user' | 'system';
  content: string;
  timestamp: string;
  teamId: string;
  isProtocol?: boolean;
}

export interface WebSocketEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'message_received' | 'team_updated';
  payload: any;
  timestamp: string;
}

// API Request/Response types
export interface CreateTaskRequest {
  subject: string;
  description: string;
  status?: TaskStatus;
  owner?: string;
}

export interface UpdateTaskRequest {
  subject?: string;
  description?: string;
  status?: TaskStatus;
  owner?: string;
  addBlocks?: string[];
  addBlockedBy?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

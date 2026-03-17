import { v4 as uuidv4 } from 'uuid';
import { addMessage } from './routes/messages';

// Broadcast function type
type BroadcastFn = (eventType: string, payload: any) => void;

// Agent definitions
interface Agent {
  name: string;
  type: string;
  color: string;
}

const AGENTS: Agent[] = [
  { name: 'team-lead', type: 'team-lead', color: '#3B82F6' },
  { name: 'backend-dev', type: 'backend-dev', color: '#10B981' },
  { name: 'frontend-dev', type: 'frontend-dev', color: '#F59E0B' },
  { name: 'tester', type: 'tester', color: '#EF4444' }
];

// Simulated conversation templates
const CONVERSATION_TEMPLATES = [
  {
    from: 'team-lead',
    to: '*',
    content: '大家好！让我们开始今天的开发工作。请各成员查看任务列表并开始工作。'
  },
  {
    from: 'backend-dev',
    to: 'team-lead',
    content: '收到！我正在查看后端 API 相关的任务。'
  },
  {
    from: 'frontend-dev',
    to: 'team-lead',
    content: '前端这边也准备好了，会开始实现看板组件。'
  },
  {
    from: 'team-lead',
    to: 'backend-dev',
    content: '请先实现任务 CRUD 接口，前端会依赖这些 API。'
  },
  {
    from: 'backend-dev',
    to: 'team-lead',
    content: '明白！我会先完成 Express 服务器和 REST API 的实现。'
  },
  {
    from: 'backend-dev',
    to: '*',
    content: '后端 API 已完成：GET/POST/PUT/DELETE /api/tasks 都已实现。'
  },
  {
    from: 'frontend-dev',
    to: 'team-lead',
    content: '看板组件已完成！支持拖拽改变任务状态。'
  },
  {
    from: 'tester',
    to: '*',
    content: '测试通过！所有 API 响应正常，前端交互流畅。'
  },
  {
    from: 'team-lead',
    to: '*',
    content: '太好了！大家辛苦了。接下来我们集成 WebSocket 实时更新功能。'
  },
  {
    from: 'backend-dev',
    to: 'team-lead',
    content: 'WebSocket 服务器已就绪，支持任务创建、更新、删除的实时推送。'
  },
  {
    from: 'frontend-dev',
    to: 'team-lead',
    content: '前端 WebSocket 连接已实现，使用 useWebSocket 钩子管理连接状态。'
  },
  {
    from: 'team-lead',
    to: '*',
    content: '完美！Agent Teams 看板应用 MVP 版本已完成。'
  }
];

let messageIndex = 0;
let simulatorInterval: NodeJS.Timeout | null = null;

function generateMessage(fromAgent: Agent, to: string, content: string) {
  return {
    id: uuidv4(),
    sender: fromAgent.name,
    senderType: 'agent' as const,
    content,
    timestamp: new Date().toISOString(),
    teamId: 'agent-todo-board',
    agentColor: fromAgent.color
  };
}

function sendProtocolMessage(fromAgent: Agent, to: string, protocolType: string) {
  const protocolMessages = [
    { type: 'shutdown_request', reason: '任务已完成' },
    { type: 'shutdown_response', request_id: uuidv4(), approve: true },
    { type: 'plan_approval_response', request_id: uuidv4(), approve: true }
  ];

  const protocolMsg = protocolMessages[Math.floor(Math.random() * protocolMessages.length)];

  return {
    id: uuidv4(),
    sender: fromAgent.name,
    senderType: 'agent' as const,
    content: JSON.stringify(protocolMsg, null, 2),
    timestamp: new Date().toISOString(),
    teamId: 'agent-todo-board',
    isProtocol: true,
    agentColor: fromAgent.color
  };
}

export function startSimulator(broadcast: BroadcastFn) {
  console.log('Starting Agent conversation simulator...');

  // Send initial message after a short delay
  setTimeout(() => {
    if (messageIndex < CONVERSATION_TEMPLATES.length) {
      const template = CONVERSATION_TEMPLATES[messageIndex];
      const fromAgent = AGENTS.find(a => a.name === template.from)!;

      const message = generateMessage(fromAgent, template.to, template.content);
      addMessage(message);
      broadcast('message_received', message);

      messageIndex++;
    }
  }, 2000);

  // Continue sending messages
  simulatorInterval = setInterval(() => {
    if (messageIndex >= CONVERSATION_TEMPLATES.length) {
      // Reset and start over after all messages are sent
      messageIndex = 0;
    }

    if (messageIndex < CONVERSATION_TEMPLATES.length) {
      const template = CONVERSATION_TEMPLATES[messageIndex];
      const fromAgent = AGENTS.find(a => a.name === template.from)!;

      // Occasionally send a protocol message
      const isProtocol = Math.random() < 0.1;

      if (isProtocol) {
        const message = sendProtocolMessage(fromAgent, template.to, 'protocol');
        addMessage(message);
        broadcast('message_received', message);
      } else {
        const message = generateMessage(fromAgent, template.to, template.content);
        addMessage(message);
        broadcast('message_received', message);
      }

      messageIndex++;
    }
  }, 5000);

  // Also simulate task updates occasionally
  setInterval(() => {
    const randomAgent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const actions = [
      '正在处理任务...',
      '任务进度更新',
      '完成了一个子任务',
      '遇到了一个小问题，正在解决',
      '代码提交完成'
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const message = generateMessage(randomAgent, '*', `${action}`);
    addMessage(message);
    broadcast('message_received', message);
  }, 15000);

  console.log('Simulator started. Messages will be sent every 5 seconds.');

  return {
    stop: () => {
      if (simulatorInterval) {
        clearInterval(simulatorInterval);
        simulatorInterval = null;
      }
      console.log('Simulator stopped.');
    }
  };
}

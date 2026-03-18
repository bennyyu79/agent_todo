import React from 'react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const agentColors: Record<string, string> = {
  'team-lead': 'bg-purple-600',
  'backend-dev': 'bg-green-500',
  'frontend-dev': 'bg-blue-500',
  'tester': 'bg-red-500',
  'architect': 'bg-indigo-500',
  'tech-architect': 'bg-cyan-500',
  'technical-architect': 'bg-cyan-500',
  'ux-designer': 'bg-pink-500',
  'ux-researcher': 'bg-rose-500',
  'ux-analyst': 'bg-orange-500',
  'ux-explorer': 'bg-amber-500',
  'devil-advocate': 'bg-slate-600',
  'devils-advocate': 'bg-slate-600',
  'critic': 'bg-gray-600',
  'skeptical-reviewer': 'bg-zinc-600',
  'integrator': 'bg-emerald-500',
  'local-investigator': 'bg-violet-500',
  'pr-investigator': 'bg-fuchsia-500',
  'external-investigator': 'bg-lime-500',
  'observer': 'bg-teal-500',
  'teammate': 'bg-gray-400',
  default: 'bg-gray-500'
};

const getAgentColor = (sender: string) => {
  return agentColors[sender] || agentColors.default;
};

const getBorderColor = (sender: string) => {
  const colorMap: Record<string, string> = {
    'team-lead': 'border-purple-500',
    'backend-dev': 'border-green-500',
    'frontend-dev': 'border-blue-500',
    'tester': 'border-red-500',
    'architect': 'border-indigo-500',
    'tech-architect': 'border-cyan-500',
    'technical-architect': 'border-cyan-500',
    'ux-designer': 'border-pink-500',
    'ux-researcher': 'border-rose-500',
    'ux-analyst': 'border-orange-500',
    'ux-explorer': 'border-amber-500',
    'devil-advocate': 'border-slate-600',
    'devils-advocate': 'border-slate-600',
    'critic': 'border-gray-600',
    'skeptical-reviewer': 'border-zinc-600',
    'integrator': 'border-emerald-500',
    'local-investigator': 'border-violet-500',
    'pr-investigator': 'border-fuchsia-500',
    'external-investigator': 'border-lime-500',
    'observer': 'border-teal-500',
    'teammate': 'border-gray-400',
    default: 'border-gray-500'
  };
  return colorMap[sender] || colorMap.default;
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isProtocol = message.isProtocol || false;
  const isTeamLead = message.sender === 'team-lead';

  if (isProtocol) {
    return (
      <div className="flex items-start gap-3 py-2">
        <div className={`w-8 h-8 rounded-full ${getAgentColor(message.sender)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {isTeamLead ? '👑' : message.sender.substring(0, 2).toUpperCase()}
        </div>
        <div className={`flex-1 bg-yellow-50 border ${getBorderColor(message.sender)} rounded-lg p-3 text-sm`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-700">
              {message.sender}
              {isTeamLead && <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Team Lead</span>}
              <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">协议消息</span>
            </span>
            <span className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
          </div>
          <pre className="bg-gray-100 rounded p-2 overflow-x-auto text-xs text-gray-700">
            {message.content}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-8 h-8 rounded-full ${getAgentColor(message.sender)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
        {isTeamLead ? '👑' : message.sender.substring(0, 2).toUpperCase()}
      </div>
      <div className={`flex-1 bg-white border ${isTeamLead ? 'border-purple-300' : 'border-gray-200'} rounded-lg p-3`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-700">
            {message.sender}
            {isTeamLead && <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Team Lead</span>}
          </span>
          <span className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

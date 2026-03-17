import React from 'react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const agentColors: Record<string, string> = {
  'team-lead': 'bg-blue-500',
  'backend-dev': 'bg-green-500',
  'frontend-dev': 'bg-yellow-500',
  'tester': 'bg-red-500',
  default: 'bg-gray-500'
};

const getAgentColor = (sender: string) => {
  return agentColors[sender] || agentColors.default;
};

const getBorderColor = (sender: string) => {
  const colorMap: Record<string, string> = {
    'team-lead': 'border-blue-500',
    'backend-dev': 'border-green-500',
    'frontend-dev': 'border-yellow-500',
    'tester': 'border-red-500',
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

  if (isProtocol) {
    return (
      <div className="flex items-start gap-3 py-2">
        <div className={`w-8 h-8 rounded-full ${getAgentColor(message.sender)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {message.sender.substring(0, 2).toUpperCase()}
        </div>
        <div className={`flex-1 bg-yellow-50 border ${getBorderColor(message.sender)} rounded-lg p-3 text-sm`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-700">
              {message.sender}
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
        {message.sender.substring(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-700">{message.sender}</span>
          <span className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  messages: ChatMessage[];
}

export function ChatPanel({ messages }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700">Agent 对话</h2>
        <p className="text-sm text-gray-500">实时协作消息</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            暂无消息
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-400 text-center">
          消息自动滚动到底部
        </div>
      </div>
    </div>
  );
}

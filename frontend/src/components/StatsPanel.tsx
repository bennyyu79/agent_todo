import React from 'react';
import { Task } from '../types';

interface StatsPanelProps {
  tasks: Task[];
}

export function StatsPanel({ tasks }: StatsPanelProps) {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex gap-4 px-6 py-3 bg-white border-b border-gray-200">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800">{total}</div>
        <div className="text-xs text-gray-500">总任务</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-400">{pending}</div>
        <div className="text-xs text-gray-500">待处理</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-500">{inProgress}</div>
        <div className="text-xs text-gray-500">进行中</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-500">{completed}</div>
        <div className="text-xs text-gray-500">已完成</div>
      </div>
      <div className="text-center ml-4 border-l border-gray-200 pl-4">
        <div className="text-2xl font-bold text-purple-500">{completionRate}%</div>
        <div className="text-xs text-gray-500">完成率</div>
      </div>
    </div>
  );
}

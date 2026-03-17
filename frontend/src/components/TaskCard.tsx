import React from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 border-l-4 border-gray-400',
  in_progress: 'bg-blue-50 border-l-4 border-blue-500',
  completed: 'bg-green-50 border-l-4 border-green-500'
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成'
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${statusColors[task.status]}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded-full ${
          task.status === 'completed' ? 'bg-green-200 text-green-800' :
          task.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
          'bg-gray-200 text-gray-800'
        }`}>
          {statusLabels[task.status]}
        </span>
        {task.owner && (
          <span className="text-xs text-gray-500">@{task.owner}</span>
        )}
      </div>

      <h3 className="font-medium text-gray-900 mb-1">{task.subject}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>

      {task.blockedBy && task.blockedBy.length > 0 && (
        <div className="text-xs text-orange-600 mb-2">
          阻塞于 {task.blockedBy.length} 个任务
        </div>
      )}

      <div className="text-xs text-gray-400">
        更新于 {formatDate(task.updatedAt)}
      </div>
    </div>
  );
}

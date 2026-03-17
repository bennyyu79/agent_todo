import React from 'react';
import { Task } from '../types';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (task: Partial<Task>) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成'
};

export function TaskModal({ task, onClose, onUpdate }: TaskModalProps) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">{task.subject}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">状态</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {statusLabels[task.status]}
                </span>
              </div>
            </div>

            {task.owner && (
              <div>
                <label className="text-sm font-medium text-gray-500">负责人</label>
                <div className="mt-1 text-gray-800">@{task.owner}</div>
              </div>
            )}

            {task.activeForm && (
              <div>
                <label className="text-sm font-medium text-gray-500">当前任务</label>
                <div className="mt-1 text-gray-800">{task.activeForm}</div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">描述</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                {task.description}
              </div>
            </div>

            {task.blockedBy && task.blockedBy.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">阻塞任务</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {task.blockedBy.map((id, idx) => (
                    <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-400">
                <div>创建时间：{formatDate(task.createdAt)}</div>
                <div>更新时间：{formatDate(task.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

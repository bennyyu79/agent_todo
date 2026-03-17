import React, { useState } from 'react';
import { TaskStatus } from '../types';

interface CreateTaskFormProps {
  onSubmit: (subject: string, description: string, status: TaskStatus) => void;
  onCancel: () => void;
}

export function CreateTaskForm({ onSubmit, onCancel }: CreateTaskFormProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    onSubmit(subject, description, status);
    setSubject('');
    setDescription('');
    setStatus('pending');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          任务标题 *
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="输入任务标题..."
          required
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          描述 *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="输入任务描述..."
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          状态
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="pending">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          创建任务
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

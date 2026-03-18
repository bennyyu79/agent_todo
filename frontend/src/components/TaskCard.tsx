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

// Member color mapping
const memberColors: Record<string, string> = {
  'team-lead': 'bg-purple-100 text-purple-700',
  'backend-dev': 'bg-green-100 text-green-700',
  'frontend-dev': 'bg-blue-100 text-blue-700',
  'tester': 'bg-red-100 text-red-700',
  'architect': 'bg-indigo-100 text-indigo-700',
  'tech-architect': 'bg-cyan-100 text-cyan-700',
  'technical-architect': 'bg-cyan-100 text-cyan-700',
  'ux-designer': 'bg-pink-100 text-pink-700',
  'ux-researcher': 'bg-rose-100 text-rose-700',
  'ux-analyst': 'bg-orange-100 text-orange-700',
  'ux-explorer': 'bg-amber-100 text-amber-700',
  'devil-advocate': 'bg-slate-100 text-slate-700',
  'devils-advocate': 'bg-slate-100 text-slate-700',
  'critic': 'bg-gray-100 text-gray-700',
  'skeptical-reviewer': 'bg-zinc-100 text-zinc-700',
  'integrator': 'bg-emerald-100 text-emerald-700',
  'local-investigator': 'bg-violet-100 text-violet-700',
  'pr-investigator': 'bg-fuchsia-100 text-fuchsia-700',
  'external-investigator': 'bg-lime-100 text-lime-700',
  'observer': 'bg-teal-100 text-teal-700',
  'teammate': 'bg-gray-100 text-gray-700',
  default: 'bg-gray-100 text-gray-700'
};

const getMemberColor = (member: string) => {
  return memberColors[member] || memberColors.default;
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

  const isTeamLead = task.owner === 'team-lead';

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
          <span className={`text-xs px-2 py-1 rounded-full ${getMemberColor(task.owner)} ${isTeamLead ? 'font-semibold' : ''}`}>
            {isTeamLead ? '👑 ' : ''}@{task.owner}
          </span>
        )}
      </div>

      <h3 className="font-medium text-gray-900 mb-1">{task.subject}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>

      {task.teamId && (
        <div className="text-xs text-purple-600 mb-2 flex items-center gap-1">
          <span>📁</span>
          <span className="truncate">{task.teamId}</span>
        </div>
      )}

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

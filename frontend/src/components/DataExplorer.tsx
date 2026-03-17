import React, { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  description?: string;
  members?: Array<{
    name: string;
    agentId: string;
    agentType: string;
  }>;
}

interface Task {
  id: string;
  subject: string;
  description: string;
  status?: string;
  owner?: string;
  createdAt?: string;
}

interface Message {
  id?: string;
  teamId: string;
  content?: string;
  sender?: string;
  timestamp?: string;
}

interface DataResponse {
  teams: Team[];
  tasks: Task[];
  messages: Message[];
  stats: {
    totalTeams: number;
    totalTasks: number;
    totalMessages: number;
    tasksByStatus: {
      pending: number;
      in_progress: number;
      completed: number;
    };
  };
}

export function DataExplorer() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'tasks' | 'messages'>('overview');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data/all');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">无法加载数据</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">数据浏览器</h2>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            刷新
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded ${
              activeTab === 'overview'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            概览
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 rounded ${
              activeTab === 'teams'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            团队 ({data.teams.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded ${
              activeTab === 'tasks'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            任务 ({data.tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded ${
              activeTab === 'messages'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            消息 ({data.messages.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{data.stats.totalTeams}</div>
                <div className="text-sm text-gray-600">团队总数</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data.stats.totalTasks}</div>
                <div className="text-sm text-gray-600">任务总数</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{data.stats.totalMessages}</div>
                <div className="text-sm text-gray-600">消息总数</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {data.stats.totalTasks > 0
                    ? Math.round((data.stats.tasksByStatus.completed / data.stats.totalTasks) * 100)
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">完成率</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">{data.stats.tasksByStatus.pending}</div>
                <div className="text-sm text-gray-500">待处理</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">{data.stats.tasksByStatus.in_progress}</div>
                <div className="text-sm text-gray-500">进行中</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">{data.stats.tasksByStatus.completed}</div>
                <div className="text-sm text-gray-500">已完成</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-2">
            {data.teams.length === 0 ? (
              <div className="text-gray-500 text-center py-8">暂无团队数据</div>
            ) : (
              data.teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id === selectedTeam ? null : team.id)}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      {team.description && (
                        <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {team.members?.length || 0} 成员
                    </span>
                  </div>
                  {selectedTeam === team.id && team.members && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600">
                        {team.members.map((member, idx) => (
                          <div key={idx} className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {member.name}
                            </span>
                            <span className="text-xs text-gray-500">{member.agentType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {data.tasks.length === 0 ? (
              <div className="text-gray-500 text-center py-8">暂无任务数据</div>
            ) : (
              data.tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{task.subject}</h3>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      {task.owner && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {task.owner}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.status === 'completed'
                        ? '已完成'
                        : task.status === 'in_progress'
                        ? '进行中'
                        : '待处理'}
                    </span>
                  </div>
                  {task.createdAt && (
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-2">
            {data.messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">暂无消息数据</div>
            ) : (
              data.messages.map((msg, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {msg.sender && (
                        <span className="text-sm font-medium text-gray-700">{msg.sender}</span>
                      )}
                      {msg.content && (
                        <p className="text-sm text-gray-600 mt-1">{msg.content}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{msg.teamId}</span>
                  </div>
                  {msg.timestamp && (
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(msg.timestamp).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

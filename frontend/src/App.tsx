import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, ChatMessage } from './types';
import { Board } from './components/Board';
import { ChatPanel } from './components/ChatPanel';
import { CreateTaskForm } from './components/CreateTaskForm';
import { TaskModal } from './components/TaskModal';
import { StatsPanel } from './components/StatsPanel';
import { DataExplorer } from './components/DataExplorer';
import { useWebSocket } from './hooks/useWebSocket';

const API_BASE = 'http://localhost:3001/api';

interface TeamMember {
  name: string;
  agentId: string;
  agentType: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members?: TeamMember[];
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'data'>('board');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const { connected } = useWebSocket('/ws');

  // Fetch data on mount
  useEffect(() => {
    fetchTeams();
    fetchTasks();
    fetchMessages();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'task_created':
          case 'task_updated':
            if (selectedTeam) {
              await fetchTasks(selectedTeam.id);
            } else {
              await fetchTasks();
            }
            break;
          case 'task_deleted':
            setTasks(prev => prev.filter(t => t.id !== data.payload.id));
            break;
          case 'message_received': {
            // Check if the new message belongs to the current team and member filter
            const newMessage = data.payload;
            const shouldAddMessage = () => {
              // If no team selected, add all messages
              if (!selectedTeam) {
                return true;
              }
              // If team selected but no member filter, add messages for this team
              if (!selectedMember) {
                return newMessage.teamId === selectedTeam.id;
              }
              // If member filter is active, only add messages for this member's inbox
              return newMessage.teamId === selectedTeam.id &&
                     newMessage.inboxMemberName === selectedMember;
            };

            if (shouldAddMessage()) {
              setMessages(prev => [...prev, newMessage].slice(-100));
              console.log(`[WebSocket] Added message from ${newMessage.sender} to ${newMessage.inboxMemberName}'s inbox`);
            } else {
              console.log(`[WebSocket] Skipped message (team: ${newMessage.teamId}, inbox: ${newMessage.inboxMemberName}, filter: ${selectedTeam?.name}/${selectedMember})`);
            }
            break;
          }
        }
      } catch (e) {
        console.error('Failed to handle WebSocket message:', e);
      }
    };

    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onmessage = handleWebSocketMessage;

    return () => ws.close();
  }, [selectedTeam, selectedMember]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE}/data/teams`);
      const data = await response.json();
      setTeams(data);
      console.log(`Loaded ${data.length} teams`);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchTasks = async (teamId?: string) => {
    try {
      // Use real data from .claude directory
      const url = teamId ? `${API_BASE}/data/teams/${teamId}/tasks` : `${API_BASE}/tasks`;
      const response = await fetch(url);
      const data = await response.json();
      setTasks(data);
      console.log(`Loaded ${data.length} tasks${teamId ? ` for team ${teamId}` : ''}`);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMessages = async (teamId: string, memberName?: string) => {
    try {
      // Clear existing messages first to avoid duplicate keys
      setMessages([]);

      // Pass memberName to backend API for filtering
      const url = memberName
        ? `${API_BASE}/data/teams/${teamId}/messages?memberName=${encodeURIComponent(memberName)}`
        : `${API_BASE}/data/teams/${teamId}/messages`;

      const response = await fetch(url);
      const data = await response.json();
      console.log(`[fetchTeamMessages] Fetched ${data.length} messages for team ${teamId}${memberName ? ` (member: ${memberName})` : ''}`);

      // Transform the data to ChatMessage format
      const messages = data.map((msg: any) => {
        // Extract inbox file name from path (e.g., "team-lead.json" from "/path/to/inboxes/team-lead.json")
        const inboxFileName = msg.path ? msg.path.split('/').pop() || '' : '';
        const inboxMemberName = inboxFileName.replace('.json', '');

        return {
          id: msg.path || Math.random().toString(36),
          sender: msg.from || 'unknown',
          senderType: msg.from === 'team-lead' ? 'lead' : 'agent',
          content: msg.text || '',
          timestamp: msg.timestamp || new Date().toISOString(),
          teamId: msg.teamId || teamId,
          isProtocol: msg.text && msg.text.startsWith('{'),
          color: msg.color,
          inboxMemberName: inboxMemberName // Add inbox member name for filtering
        };
      });

      setMessages(messages);
      console.log(`[fetchTeamMessages] Final: ${messages.length} messages${memberName ? ` for member ${memberName}` : ''} in team ${teamId}`);
    } catch (error) {
      console.error('Failed to fetch team messages:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      // Use real data from .claude directory via data API
      const response = await fetch(`${API_BASE}/data/inboxes/all`);
      const data = await response.json();
      // Transform the data to ChatMessage format
      const messages = data.map((msg: any) => {
        // Extract inbox file name from path
        const inboxFileName = msg.path ? msg.path.split('/').pop() || '' : '';
        const inboxMemberName = inboxFileName.replace('.json', '');
        return {
          id: msg.path || Math.random().toString(36),
          sender: msg.from || 'unknown',
          senderType: msg.from === 'team-lead' ? 'lead' : 'agent',
          content: msg.text || '',
          timestamp: msg.timestamp || new Date().toISOString(),
          teamId: msg.teamId || 'default',
          isProtocol: msg.text && msg.text.startsWith('{'),
          color: msg.color,
          inboxMemberName: inboxMemberName
        };
      });
      setMessages(messages);
      console.log(`Loaded ${messages.length} messages from real inbox files`);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleCreateTask = async (subject: string, description: string, status: TaskStatus) => {
    try {
      await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description, status })
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除此任务吗？')) return;
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Agent Teams 看板</h1>
            <p className="text-sm text-gray-500 mt-1">
              实时监控 Agent 协作对话和任务进度
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Team Selector */}
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const teamId = e.target.value;
                if (teamId) {
                  const team = teams.find(t => t.id === teamId);
                  if (team) {
                    setSelectedTeam(team);
                    setSelectedMember(null); // Reset member selection when switching teams
                    fetchTasks(teamId);
                    fetchTeamMessages(teamId);
                  }
                } else {
                  setSelectedTeam(null);
                  setSelectedMember(null);
                  fetchTasks();
                  fetchMessages();
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有团队</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.members?.length || 0} 成员)
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'board'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                看板
              </button>
              <button
                onClick={() => setViewMode('data')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'data'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                数据浏览器
              </button>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">{connected ? '已连接' : '断开连接'}</span>
            </div>
            {viewMode === 'board' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                + 新建任务
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Panel */}
      <div className="bg-white border-b border-gray-200">
        <StatsPanel tasks={tasks} />
        {selectedTeam && (
          <div className="flex items-center justify-between px-6 py-2 bg-blue-50 border-t border-blue-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-800">当前团队:</span>
              <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">{selectedTeam.name}</span>
              {selectedMember && (
                <>
                  <span className="text-sm font-medium text-purple-800">当前成员:</span>
                  <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-sm">{selectedMember}</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {selectedMember && (
                <button
                  onClick={() => {
                    setSelectedMember(null);
                    if (selectedTeam) {
                      fetchTasks(selectedTeam.id);
                      fetchTeamMessages(selectedTeam.id);
                    }
                  }}
                  className="text-sm text-purple-600 hover:text-purple-800 underline"
                >
                  清除成员过滤器
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setSelectedMember(null);
                  fetchTasks();
                  fetchMessages();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                清除团队过滤器
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {viewMode === 'board' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Board */}
          <Board
            tasks={tasks}
            members={selectedTeam?.members || undefined}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskClick={handleTaskClick}
            onMemberClick={(memberName) => {
              console.log(`[Board] onMemberClick called with: ${memberName}, selectedTeam: ${selectedTeam?.name}`);
              setSelectedMember(memberName);
              if (selectedTeam) {
                // When clicking a member, filter tasks by that member
                if (memberName) {
                  const filteredTasks = tasks.filter(t => t.owner === memberName);
                  setTasks(filteredTasks);
                  console.log(`[Board] Filtered tasks from ${tasks.length} to ${filteredTasks.length} for member ${memberName}`);
                } else {
                  // Reset to all tasks for the team
                  fetchTasks(selectedTeam.id);
                }
                // Fetch messages for that member (messages sent TO that member)
                fetchTeamMessages(selectedTeam.id, memberName || undefined);
              }
            }}
          />

          {/* Chat Panel */}
          <ChatPanel messages={messages} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <DataExplorer onTeamSelect={(team) => {
            setSelectedTeam(team);
            setSelectedMember(null); // Reset member selection when switching teams
            setViewMode('board');
            fetchTasks(team.id);
            fetchTeamMessages(team.id);
          }} />
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">创建新任务</h2>
            </div>
            <div className="p-4">
              <CreateTaskForm
                onSubmit={handleCreateTask}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (updates) => {
            try {
              await fetch(`${API_BASE}/tasks/${selectedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
              });
            } catch (error) {
              console.error('Failed to update task:', error);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, ChatMessage } from './types';
import { Board } from './components/Board';
import { ChatPanel } from './components/ChatPanel';
import { CreateTaskForm } from './components/CreateTaskForm';
import { TaskModal } from './components/TaskModal';
import { StatsPanel } from './components/StatsPanel';
import { useWebSocket } from './hooks/useWebSocket';

const API_BASE = '/api';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const { connected } = useWebSocket('/ws');

  // Fetch tasks on mount
  useEffect(() => {
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
            await fetchTasks();
            break;
          case 'task_deleted':
            setTasks(prev => prev.filter(t => t.id !== data.payload.id));
            break;
          case 'message_received':
            setMessages(prev => [...prev, data.payload].slice(-100));
            break;
        }
      } catch (e) {
        console.error('Failed to handle WebSocket message:', e);
      }
    };

    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onmessage = handleWebSocketMessage;

    return () => ws.close();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE}/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/messages/recent/100`);
      const data = await response.json();
      setMessages(data);
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
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">{connected ? '已连接' : '断开连接'}</span>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              + 新建任务
            </button>
          </div>
        </div>
      </header>

      {/* Stats Panel */}
      <StatsPanel tasks={tasks} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Board */}
        <Board
          tasks={tasks}
          onTaskStatusChange={handleTaskStatusChange}
          onTaskClick={handleTaskClick}
        />

        {/* Chat Panel */}
        <ChatPanel messages={messages} />
      </div>

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

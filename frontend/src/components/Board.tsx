import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus, COLUMNS } from '../types';
import { TaskCard } from './TaskCard';

interface TeamMember {
  name: string;
  agentId: string;
  agentType: string;
}

interface BoardProps {
  tasks: Task[];
  members?: TeamMember[]; // Team members from config.json
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onMemberClick?: (memberName: string | null) => void; // Callback when clicking on a member
}

// Member color mapping for avatars
const memberColors: Record<string, string> = {
  'team-lead': 'bg-purple-500',
  'backend-dev': 'bg-green-500',
  'frontend-dev': 'bg-blue-500',
  'tester': 'bg-red-500',
  'architect': 'bg-indigo-500',
  'tech-architect': 'bg-cyan-500',
  'technical-architect': 'bg-cyan-500',
  'ux-designer': 'bg-pink-500',
  'ux-researcher': 'bg-rose-500',
  'ux-analyst': 'bg-orange-500',
  'ux-explorer': 'bg-amber-500',
  'devil-advocate': 'bg-slate-600',
  'devils-advocate': 'bg-slate-600',
  'critic': 'bg-gray-600',
  'skeptical-reviewer': 'bg-zinc-600',
  'integrator': 'bg-emerald-500',
  'local-investigator': 'bg-violet-500',
  'pr-investigator': 'bg-fuchsia-500',
  'external-investigator': 'bg-lime-500',
  'observer': 'bg-teal-500',
  'teammate': 'bg-gray-400',
  default: 'bg-gray-500'
};

const getMemberColor = (member: string) => {
  return memberColors[member] || memberColors.default;
};

export function Board({ tasks, members, onTaskStatusChange, onTaskClick, onMemberClick }: BoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [filterText, setFilterText] = useState('');
  const [filterOwner, setFilterOwner] = useState<string>('all');

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Get unique owners (members) for filter and display
  // Priority: use members from team config, fallback to task owners
  const ownersFromConfig = members?.map(m => m.name) || [];
  const ownersFromTasks = Array.from(new Set(tasks.map(t => t.owner || 'unassigned')));
  // Combine both: all config members + any task owners not in config
  const owners = Array.from(new Set([...ownersFromConfig, ...ownersFromTasks]));

  // Calculate task count per member
  const memberTaskCounts = owners.reduce((acc, owner) => {
    acc[owner] = tasks.filter(t => t.owner === owner).length;
    return acc;
  }, {} as Record<string, number>);

  // Filter tasks
  const filteredTasks = localTasks.filter(task => {
    const matchesText = !filterText ||
      task.subject.toLowerCase().includes(filterText.toLowerCase()) ||
      task.description.toLowerCase().includes(filterText.toLowerCase());
    const matchesOwner = filterOwner === 'all' ||
      filterOwner === 'unassigned' ? !task.owner :
      task.owner === filterOwner;
    return matchesText && matchesOwner;
  });

  const handleOnDragEnd = (dropResult: DropResult) => {
    const { destination, source, draggableId } = dropResult;

    if (
      !destination ||
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update task status based on destination column
    const newStatus = destination.droppableId as TaskStatus;
    onTaskStatusChange(draggableId, newStatus);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Filter Bar with Member Stats */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex gap-4 flex-wrap items-center">
          <input
            type="text"
            placeholder="搜索任务..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有负责人</option>
            {owners.map(owner => (
              <option key={owner} value={owner}>
                {owner === 'unassigned' ? '未分配' : `@${owner}`}
              </option>
            ))}
          </select>

          {/* Member Stats */}
          <div className="flex gap-2 ml-auto">
            {owners.map(owner => {
              const isTeamLead = owner === 'team-lead';
              return (
                <div
                  key={owner}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer ${
                    filterOwner === owner ? 'ring-2 ring-blue-500' : ''
                  } hover:bg-gray-100`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterOwner(owner);
                    if (onMemberClick && owner !== 'unassigned') {
                      onMemberClick(owner);
                    }
                  }}
                >
                  <div className={`w-6 h-6 rounded-full ${getMemberColor(owner)} flex items-center justify-center text-white text-xs font-bold`}>
                    {isTeamLead ? '👑' : owner.substring(0, 2).toUpperCase()}
                  </div>
                  <span className={`text-xs ${isTeamLead ? 'font-semibold text-purple-700' : 'text-gray-600'}`}>
                    {owner === 'unassigned' ? '未分配' : owner}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({memberTaskCounts[owner] || 0})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="flex gap-4 p-4 min-w-max">
          {COLUMNS.map(column => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-80 flex-shrink-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-700">{column.title}</h2>
                    <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
                      {getTasksByStatus(column.id).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {getTasksByStatus(column.id).map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'shadow-lg' : ''}
                          >
                            <TaskCard
                              task={task}
                              onClick={() => onTaskClick(task)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      </div>
    </div>
  );
}

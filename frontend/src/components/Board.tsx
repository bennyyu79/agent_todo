import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus, COLUMNS } from '../types';
import { TaskCard } from './TaskCard';

interface BoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

export function Board({ tasks, onTaskStatusChange, onTaskClick }: BoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [filterText, setFilterText] = useState('');
  const [filterOwner, setFilterOwner] = useState<string>('all');

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Get unique owners for filter
  const owners = Array.from(new Set(tasks.map(t => t.owner || 'unassigned')));

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
      {/* Filter Bar */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex gap-4">
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

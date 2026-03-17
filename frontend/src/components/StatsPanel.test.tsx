import { render, screen } from '@testing-library/react';
import { StatsPanel } from '../StatsPanel';
import { Task } from '../../types';

describe('StatsPanel', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      subject: 'Task 1',
      description: 'Description 1',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      subject: 'Task 2',
      description: 'Description 2',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      subject: 'Task 3',
      description: 'Description 3',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  it('renders total task count', () => {
    render(<StatsPanel tasks={mockTasks} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('总任务')).toBeInTheDocument();
  });

  it('renders task counts by status', () => {
    render(<StatsPanel tasks={mockTasks} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders completion rate', () => {
    render(<StatsPanel tasks={mockTasks} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('renders empty state when no tasks', () => {
    render(<StatsPanel tasks={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

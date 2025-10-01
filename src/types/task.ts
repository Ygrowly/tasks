export interface Task {
  id: string
  title: string
  description?: string
  category: TaskCategory
  status: TaskStatus
  plannedTomatoes: number
  completedTomatoes: number
  estimatedMinutes?: number
  actualMinutes?: number
  createdAt: string
  updatedAt: string
  scheduledDate: string
  completedAt?: string
  priority: TaskPriority
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled'

export type TaskCategory = 'work' | 'study' | 'life' | 'other'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskFormData {
  title: string
  description?: string
  category: TaskCategory
  plannedTomatoes: number
  scheduledDate: string
  priority: TaskPriority
}

export interface TaskFilter {
  status?: TaskStatus[]
  category?: TaskCategory[]
  dateRange?: {
    start: string
    end: string
  }
  priority?: TaskPriority[]
}

export interface TaskStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  totalPlannedTomatoes: number
  totalCompletedTomatoes: number
  completionRate: number
  averageTomatoesPerTask: number
}
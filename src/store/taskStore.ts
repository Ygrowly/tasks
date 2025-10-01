import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, TaskFormData, TaskFilter, TaskStats } from '../types/task'
import { generateId, formatDate } from '../utils/helpers'

interface TaskState {
  tasks: Task[]
  filter: TaskFilter
  loading: boolean
  error: string | null
}

interface TaskActions {
  // 任务CRUD操作
  addTask: (taskData: TaskFormData) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskStatus: (id: string) => void
  
  // 番茄钟相关
  incrementTomato: (id: string) => void
  decrementTomato: (id: string) => void
  
  // 筛选和查询
  setFilter: (filter: Partial<TaskFilter>) => void
  clearFilter: () => void
  getTasksByDate: (date: string) => Task[]
  getTasksByStatus: (status: Task['status']) => Task[]
  getTasksByCategory: (category: Task['category']) => Task[]
  
  // 统计
  getTaskStats: () => TaskStats
  getTodayStats: () => TaskStats
  
  // 数据管理
  clearAllTasks: () => void
  importTasks: (tasks: Task[]) => void
  exportTasks: () => Task[]
}

type TaskStore = TaskState & TaskActions

const initialFilter: TaskFilter = {}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      tasks: [],
      filter: initialFilter,
      loading: false,
      error: null,

      // 添加任务
      addTask: (taskData: TaskFormData) => {
        const newTask: Task = {
          id: generateId(),
          ...taskData,
          status: 'todo',
          completedTomatoes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
          error: null
        }))
      },

      // 更新任务
      updateTask: (id: string, updates: Partial<Task>) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
          error: null
        }))
      },

      // 删除任务
      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          error: null
        }))
      },

      // 切换任务状态
      toggleTaskStatus: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              let newStatus: Task['status']
              switch (task.status) {
                case 'todo':
                  newStatus = 'in-progress'
                  break
                case 'in-progress':
                  newStatus = 'completed'
                  break
                case 'completed':
                  newStatus = 'todo'
                  break
                default:
                  newStatus = 'todo'
              }
              
              return {
                ...task,
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString()
              }
            }
            return task
          }),
          error: null
        }))
      },

      // 增加番茄数
      incrementTomato: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completedTomatoes: task.completedTomatoes + 1,
                  updatedAt: new Date().toISOString()
                }
              : task
          ),
          error: null
        }))
      },

      // 减少番茄数
      decrementTomato: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id && task.completedTomatoes > 0
              ? {
                  ...task,
                  completedTomatoes: task.completedTomatoes - 1,
                  updatedAt: new Date().toISOString()
                }
              : task
          ),
          error: null
        }))
      },

      // 设置筛选条件
      setFilter: (filter: Partial<TaskFilter>) => {
        set((state) => ({
          filter: { ...state.filter, ...filter }
        }))
      },

      // 清除筛选条件
      clearFilter: () => {
        set({ filter: initialFilter })
      },

      // 按日期获取任务
      getTasksByDate: (date: string) => {
        const { tasks } = get()
        return tasks.filter((task) => task.scheduledDate === date)
      },

      // 按状态获取任务
      getTasksByStatus: (status: Task['status']) => {
        const { tasks } = get()
        return tasks.filter((task) => task.status === status)
      },

      // 按分类获取任务
      getTasksByCategory: (category: Task['category']) => {
        const { tasks } = get()
        return tasks.filter((task) => task.category === category)
      },

      // 获取任务统计
      getTaskStats: () => {
        const { tasks } = get()
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((task) => task.status === 'completed').length
        const inProgressTasks = tasks.filter((task) => task.status === 'in-progress').length
        const todoTasks = tasks.filter((task) => task.status === 'todo').length
        const totalPlannedTomatoes = tasks.reduce((sum, task) => sum + task.plannedTomatoes, 0)
        const totalCompletedTomatoes = tasks.reduce((sum, task) => sum + task.completedTomatoes, 0)
        
        return {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          totalPlannedTomatoes,
          totalCompletedTomatoes,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          averageTomatoesPerTask: totalTasks > 0 ? totalCompletedTomatoes / totalTasks : 0
        }
      },

      // 获取今日统计
      getTodayStats: () => {
        const { tasks } = get()
        const today = formatDate(new Date())
        const todayTasks = tasks.filter((task) => task.scheduledDate === today)
        
        const totalTasks = todayTasks.length
        const completedTasks = todayTasks.filter((task) => task.status === 'completed').length
        const inProgressTasks = todayTasks.filter((task) => task.status === 'in-progress').length
        const todoTasks = todayTasks.filter((task) => task.status === 'todo').length
        const totalPlannedTomatoes = todayTasks.reduce((sum, task) => sum + task.plannedTomatoes, 0)
        const totalCompletedTomatoes = todayTasks.reduce((sum, task) => sum + task.completedTomatoes, 0)
        
        return {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          totalPlannedTomatoes,
          totalCompletedTomatoes,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          averageTomatoesPerTask: totalTasks > 0 ? totalCompletedTomatoes / totalTasks : 0
        }
      },

      // 清除所有任务
      clearAllTasks: () => {
        set({ tasks: [], error: null })
      },

      // 导入任务
      importTasks: (tasks: Task[]) => {
        set({ tasks, error: null })
      },

      // 导出任务
      exportTasks: () => {
        const { tasks } = get()
        return tasks
      }
    }),
    {
      name: 'task-store',
      partialize: (state) => ({ tasks: state.tasks })
    }
  )
)
/**
 * 任务管理Hook
 * 封装任务相关的状态管理和操作逻辑
 */

import { useCallback, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { useTaskStore } from '../store/taskStore'
import { TaskService } from '../services/taskService'
import { Task, TaskStatus, TaskCategory, TaskPriority } from '../types/task'
import { formatDate, getToday } from '../utils/date'

export interface UseTasksOptions {
  autoRefresh?: boolean
  category?: TaskCategory
  status?: TaskStatus
  priority?: TaskPriority
  date?: string
}

export interface UseTasksReturn {
  // 任务数据
  tasks: Task[]
  loading: boolean
  error: string | null
  
  // 任务操作
  createTask: (taskData: any) => Promise<Task | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
  toggleTaskStatus: (id: string) => Promise<Task | null>
  
  // 批量操作
  batchUpdateStatus: (ids: string[], status: TaskStatus) => Promise<boolean>
  batchDelete: (ids: string[]) => Promise<boolean>
  
  // 任务查询
  getTaskById: (id: string) => Task | undefined
  getTasksByDate: (date: string) => Task[]
  getTasksByCategory: (category: TaskCategory) => Task[]
  getTasksByStatus: (status: TaskStatus) => Task[]
  
  // 任务统计
  todayStats: {
    total: number
    completed: number
    inProgress: number
    todo: number
    completionRate: number
    totalPomodoros: number
    estimatedPomodoros: number
  }
  
  // 任务筛选和排序
  filteredTasks: Task[]
  sortTasks: (tasks: Task[], sortBy: 'priority' | 'date' | 'status' | 'category') => Task[]
  
  // 刷新数据
  refresh: () => Promise<void>
}

/**
 * 任务管理Hook
 */
export const useTasks = (options: UseTasksOptions = {}): UseTasksReturn => {
  const {
    tasks,
    loading,
    error,
    addTask,
    updateTask: storeUpdateTask,
    deleteTask: storeDeleteTask,
    toggleTaskStatus: storeToggleTaskStatus,
    getTodayStats,
    getTasksByDate,
    getTasksByCategory,
    getTasksByStatus,
    loadTasks
  } = useTaskStore()

  // 创建任务
  const createTask = useCallback(async (taskData: {
    title: string
    description?: string
    category: TaskCategory
    priority: TaskPriority
    estimatedPomodoros: number
    plannedDate: string
    tags?: string[]
  }): Promise<Task | null> => {
    try {
      Taro.showLoading({ title: '创建中...' })
      
      const newTask = await TaskService.createTask(taskData)
      addTask(newTask)
      
      Taro.hideLoading()
      Taro.showToast({
        title: '任务创建成功',
        icon: 'success'
      })
      
      return newTask
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '创建失败',
        icon: 'error'
      })
      console.error('创建任务失败:', error)
      return null
    }
  }, [addTask])

  // 更新任务
  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    try {
      Taro.showLoading({ title: '更新中...' })
      
      const updatedTask = await TaskService.updateTask({ id, ...updates })
      storeUpdateTask(id, updates)
      
      Taro.hideLoading()
      Taro.showToast({
        title: '更新成功',
        icon: 'success'
      })
      
      return updatedTask
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '更新失败',
        icon: 'error'
      })
      console.error('更新任务失败:', error)
      return null
    }
  }, [storeUpdateTask])

  // 删除任务
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个任务吗？此操作不可恢复。',
        confirmText: '删除',
        confirmColor: '#dc3545'
      })
      
      if (!result.confirm) {
        return false
      }
      
      Taro.showLoading({ title: '删除中...' })
      
      await TaskService.deleteTask(id)
      storeDeleteTask(id)
      
      Taro.hideLoading()
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })
      
      return true
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '删除失败',
        icon: 'error'
      })
      console.error('删除任务失败:', error)
      return false
    }
  }, [storeDeleteTask])

  // 切换任务状态
  const toggleTaskStatus = useCallback(async (id: string): Promise<Task | null> => {
    try {
      const task = tasks.find(t => t.id === id)
      if (!task) return null
      
      let newStatus: TaskStatus
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
      
      const updatedTask = await TaskService.updateTask({
        id,
        status: newStatus,
        ...(newStatus === 'completed' && { completedAt: new Date().toISOString() })
      })
      
      storeToggleTaskStatus(id)
      
      const statusMessages = {
        'todo': '任务已重置为待办',
        'in-progress': '任务已开始',
        'completed': '任务已完成'
      }
      
      Taro.showToast({
        title: statusMessages[newStatus],
        icon: 'success'
      })
      
      return updatedTask
    } catch (error) {
      Taro.showToast({
        title: '状态更新失败',
        icon: 'error'
      })
      console.error('切换任务状态失败:', error)
      return null
    }
  }, [tasks, storeToggleTaskStatus])

  // 批量更新状态
  const batchUpdateStatus = useCallback(async (ids: string[], status: TaskStatus): Promise<boolean> => {
    try {
      if (ids.length === 0) return false
      
      const result = await Taro.showModal({
        title: '批量操作确认',
        content: `确定要将 ${ids.length} 个任务的状态更改为"${getStatusText(status)}"吗？`
      })
      
      if (!result.confirm) return false
      
      Taro.showLoading({ title: '更新中...' })
      
      await TaskService.batchUpdateTaskStatus(ids, status)
      
      // 更新本地状态
      ids.forEach(id => {
        storeUpdateTask(id, { 
          status,
          ...(status === 'completed' && { completedAt: new Date().toISOString() })
        })
      })
      
      Taro.hideLoading()
      Taro.showToast({
        title: `已更新 ${ids.length} 个任务`,
        icon: 'success'
      })
      
      return true
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '批量更新失败',
        icon: 'error'
      })
      console.error('批量更新状态失败:', error)
      return false
    }
  }, [storeUpdateTask])

  // 批量删除
  const batchDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      if (ids.length === 0) return false
      
      const result = await Taro.showModal({
        title: '批量删除确认',
        content: `确定要删除 ${ids.length} 个任务吗？此操作不可恢复。`,
        confirmText: '删除',
        confirmColor: '#dc3545'
      })
      
      if (!result.confirm) return false
      
      Taro.showLoading({ title: '删除中...' })
      
      // 逐个删除任务
      for (const id of ids) {
        await TaskService.deleteTask(id)
        storeDeleteTask(id)
      }
      
      Taro.hideLoading()
      Taro.showToast({
        title: `已删除 ${ids.length} 个任务`,
        icon: 'success'
      })
      
      return true
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '批量删除失败',
        icon: 'error'
      })
      console.error('批量删除失败:', error)
      return false
    }
  }, [storeDeleteTask])

  // 根据ID获取任务
  const getTaskById = useCallback((id: string): Task | undefined => {
    return tasks.find(task => task.id === id)
  }, [tasks])

  // 任务排序
  const sortTasks = useCallback((tasksToSort: Task[], sortBy: 'priority' | 'date' | 'status' | 'category'): Task[] => {
    const sorted = [...tasksToSort]
    
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 }
        return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      
      case 'date':
        return sorted.sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
      
      case 'status':
        const statusOrder = { 'in-progress': 0, 'todo': 1, 'completed': 2, 'cancelled': 3 }
        return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
      
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category))
      
      default:
        return sorted
    }
  }, [])

  // 过滤任务
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]
    
    if (options.category) {
      filtered = filtered.filter(task => task.category === options.category)
    }
    
    if (options.status) {
      filtered = filtered.filter(task => task.status === options.status)
    }
    
    if (options.priority) {
      filtered = filtered.filter(task => task.priority === options.priority)
    }
    
    if (options.date) {
      filtered = filtered.filter(task => task.plannedDate === options.date)
    }
    
    return filtered
  }, [tasks, options])

  // 今日统计
  const todayStats = useMemo(() => {
    return getTodayStats()
  }, [getTodayStats])

  // 刷新数据
  const refresh = useCallback(async () => {
    try {
      await loadTasks()
    } catch (error) {
      console.error('刷新任务数据失败:', error)
    }
  }, [loadTasks])

  return {
    // 任务数据
    tasks,
    loading,
    error,
    
    // 任务操作
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    
    // 批量操作
    batchUpdateStatus,
    batchDelete,
    
    // 任务查询
    getTaskById,
    getTasksByDate,
    getTasksByCategory,
    getTasksByStatus,
    
    // 任务统计
    todayStats,
    
    // 任务筛选和排序
    filteredTasks,
    sortTasks,
    
    // 刷新数据
    refresh
  }
}

// 辅助函数：获取状态文本
function getStatusText(status: TaskStatus): string {
  const statusMap = {
    'todo': '待办',
    'in-progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status]
}

export default useTasks

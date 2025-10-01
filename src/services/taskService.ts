/**
 * 任务相关API服务
 * 处理任务的CRUD操作和相关业务逻辑
 */

import { ApiClient } from './api'
import { Task, TaskStatus, TaskCategory, TaskPriority } from '../types/task'
import { getStorageSync, setStorageSync } from '../utils/storage'

// 任务API接口定义
export interface TaskCreateRequest {
  title: string
  description?: string
  category: TaskCategory
  priority: TaskPriority
  estimatedPomodoros: number
  plannedDate: string
  tags?: string[]
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {
  id: string
  status?: TaskStatus
  actualPomodoros?: number
  completedAt?: string
}

export interface TaskListRequest {
  page?: number
  pageSize?: number
  status?: TaskStatus
  category?: TaskCategory
  priority?: TaskPriority
  startDate?: string
  endDate?: string
  keyword?: string
}

export interface TaskListResponse {
  tasks: Task[]
  total: number
  page: number
  pageSize: number
}

/**
 * 任务服务类
 */
export class TaskService {
  private static readonly STORAGE_KEY = 'tasks'

  /**
   * 获取任务列表
   */
  static async getTasks(params?: TaskListRequest): Promise<TaskListResponse> {
    try {
      // 在实际项目中，这里会调用真实的API
      // return ApiClient.get<TaskListResponse>('/api/tasks', params)
      
      // 当前使用本地存储模拟
      const allTasks = getStorageSync<Task[]>(this.STORAGE_KEY, [])
      let filteredTasks = [...allTasks]

      // 应用过滤条件
      if (params) {
        if (params.status) {
          filteredTasks = filteredTasks.filter(task => task.status === params.status)
        }
        if (params.category) {
          filteredTasks = filteredTasks.filter(task => task.category === params.category)
        }
        if (params.priority) {
          filteredTasks = filteredTasks.filter(task => task.priority === params.priority)
        }
        if (params.startDate && params.endDate) {
          filteredTasks = filteredTasks.filter(task => 
            task.plannedDate >= params.startDate! && task.plannedDate <= params.endDate!
          )
        }
        if (params.keyword) {
          const keyword = params.keyword.toLowerCase()
          filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(keyword) ||
            task.description?.toLowerCase().includes(keyword)
          )
        }
      }

      // 分页处理
      const page = params?.page || 1
      const pageSize = params?.pageSize || 20
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

      return {
        tasks: paginatedTasks,
        total: filteredTasks.length,
        page,
        pageSize
      }
    } catch (error) {
      console.error('获取任务列表失败:', error)
      throw new Error('获取任务列表失败')
    }
  }

  /**
   * 根据ID获取单个任务
   */
  static async getTaskById(id: string): Promise<Task | null> {
    try {
      // return ApiClient.get<Task>(`/api/tasks/${id}`)
      
      const tasks = getStorageSync<Task[]>(this.STORAGE_KEY, [])
      return tasks.find(task => task.id === id) || null
    } catch (error) {
      console.error('获取任务详情失败:', error)
      throw new Error('获取任务详情失败')
    }
  }

  /**
   * 创建新任务
   */
  static async createTask(taskData: TaskCreateRequest): Promise<Task> {
    try {
      // return ApiClient.post<Task>('/api/tasks', taskData)
      
      const newTask: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: taskData.title,
        description: taskData.description || '',
        category: taskData.category,
        priority: taskData.priority,
        status: 'todo',
        estimatedPomodoros: taskData.estimatedPomodoros,
        actualPomodoros: 0,
        plannedDate: taskData.plannedDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: taskData.tags || []
      }

      const tasks = getStorageSync<Task[]>(this.STORAGE_KEY, [])
      tasks.push(newTask)
      setStorageSync(this.STORAGE_KEY, tasks)

      return newTask
    } catch (error) {
      console.error('创建任务失败:', error)
      throw new Error('创建任务失败')
    }
  }

  /**
   * 更新任务
   */
  static async updateTask(taskData: TaskUpdateRequest): Promise<Task> {
    try {
      // return ApiClient.put<Task>(`/api/tasks/${taskData.id}`, taskData)
      
      const tasks = getStorageSync<Task[]>(this.STORAGE_KEY, [])
      const taskIndex = tasks.findIndex(task => task.id === taskData.id)
      
      if (taskIndex === -1) {
        throw new Error('任务不存在')
      }

      const updatedTask: Task = {
        ...tasks[taskIndex],
        ...taskData,
        updatedAt: new Date().toISOString(),
        ...(taskData.status === 'completed' && !tasks[taskIndex].completedAt && {
          completedAt: new Date().toISOString()
        })
      }

      tasks[taskIndex] = updatedTask
      setStorageSync(this.STORAGE_KEY, tasks)

      return updatedTask
    } catch (error) {
      console.error('更新任务失败:', error)
      throw new Error('更新任务失败')
    }
  }

  /**
   * 删除任务
   */
  static async deleteTask(id: string): Promise<void> {
    try {
      // return ApiClient.delete(`/api/tasks/${id}`)
      
      const tasks = getStorageSync<Task[]>(this.STORAGE_KEY, [])
      const filteredTasks = tasks.filter(task => task.id !== id)
      setStorageSync(this.STORAGE_KEY, filteredTasks)
    } catch (error) {
      console.error('删除任务失败:', error)
      throw new Error('删除任务失败')
    }
  }

  /**
   * 批量更新任务状态
   */
  static async batchUpdateTaskStatus(ids: string[], status: TaskStatus): Promise<void> {
    try {
      // return ApiClient.put('/api/tasks/batch-status', { ids, status })
      
      const tasks = getStorageSync<Task[]>(this.STORAGE_KEY, [])
      const updatedTasks = tasks.map(task => {
        if (ids.includes(task.id)) {
          return {
            ...task,
            status,
            updatedAt: new Date().toISOString(),
            ...(status === 'completed' && !task.completedAt && {
              completedAt: new Date().toISOString()
            })
          }
        }
        return task
      })
      
      setStorageSync(this.STORAGE_KEY, updatedTasks)
    } catch (error) {
      console.error('批量更新任务状态失败:', error)
      throw new Error('批量更新任务状态失败')
    }
  }

  /**
   * 获取今日任务
   */
  static async getTodayTasks(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0]
    const response = await this.getTasks({
      startDate: today,
      endDate: today
    })
    return response.tasks
  }

  /**
   * 获取任务统计信息
   */
  static async getTaskStats(startDate?: string, endDate?: string) {
    try {
      const params: TaskListRequest = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const response = await this.getTasks(params)
      const tasks = response.tasks

      return {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length,
        totalPomodoros: tasks.reduce((sum, t) => sum + t.actualPomodoros, 0),
        estimatedPomodoros: tasks.reduce((sum, t) => sum + t.estimatedPomodoros, 0)
      }
    } catch (error) {
      console.error('获取任务统计失败:', error)
      throw new Error('获取任务统计失败')
    }
  }
}

export default TaskService

import { Task } from '../types/task'
import { PomodoroSession } from '../types/pomodoro'
import { generateId, getToday } from './helpers'

// 示例任务数据
export const sampleTasks: Task[] = [
  {
    id: generateId(),
    title: '完成产品原型设计',
    description: '设计新功能的用户界面原型，包括主要页面流程',
    category: 'work',
    status: 'in-progress',
    plannedTomatoes: 4,
    completedTomatoes: 2,
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledDate: getToday()
  },
  {
    id: generateId(),
    title: '准备会议材料',
    description: '整理本周项目进度报告和下周计划',
    category: 'work',
    status: 'completed',
    plannedTomatoes: 2,
    completedTomatoes: 2,
    priority: 'medium',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 昨天
    updatedAt: new Date().toISOString(),
    scheduledDate: getToday(),
    completedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    title: '学习React新特性',
    description: '深入了解React 18的新功能和最佳实践',
    category: 'study',
    status: 'todo',
    plannedTomatoes: 3,
    completedTomatoes: 0,
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledDate: getToday()
  },
  {
    id: generateId(),
    title: '阅读技术文档',
    description: '阅读Taro框架的最新文档和最佳实践',
    category: 'study',
    status: 'todo',
    plannedTomatoes: 2,
    completedTomatoes: 0,
    priority: 'low',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledDate: getToday()
  },
  {
    id: generateId(),
    title: '整理房间',
    description: '清理桌面，整理书籍和文件',
    category: 'life',
    status: 'todo',
    plannedTomatoes: 1,
    completedTomatoes: 0,
    priority: 'low',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledDate: getToday()
  },
  {
    id: generateId(),
    title: '制定下周计划',
    description: '规划下周的工作任务和学习目标',
    category: 'work',
    status: 'todo',
    plannedTomatoes: 1,
    completedTomatoes: 0,
    priority: 'urgent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledDate: (() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    })()
  }
]

// 示例番茄钟会话数据
export const sampleSessions: PomodoroSession[] = [
  {
    id: generateId(),
    taskId: sampleTasks[0].id,
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1小时前
    endTime: new Date(Date.now() - 2100000).toISOString(), // 35分钟前
    duration: 1500, // 25分钟
    plannedDuration: 1500,
    type: 'focus',
    status: 'completed',
    interruptions: 0
  },
  {
    id: generateId(),
    taskId: sampleTasks[0].id,
    startTime: new Date(Date.now() - 1800000).toISOString(), // 30分钟前
    endTime: new Date(Date.now() - 300000).toISOString(), // 5分钟前
    duration: 1500, // 25分钟
    plannedDuration: 1500,
    type: 'focus',
    status: 'completed',
    interruptions: 1
  },
  {
    id: generateId(),
    taskId: sampleTasks[1].id,
    startTime: new Date(Date.now() - 7200000).toISOString(), // 2小时前
    endTime: new Date(Date.now() - 5700000).toISOString(), // 1.5小时前
    duration: 1500, // 25分钟
    plannedDuration: 1500,
    type: 'focus',
    status: 'completed',
    interruptions: 0
  },
  {
    id: generateId(),
    taskId: sampleTasks[1].id,
    startTime: new Date(Date.now() - 5400000).toISOString(), // 1.5小时前
    endTime: new Date(Date.now() - 3900000).toISOString(), // 1小时5分钟前
    duration: 1500, // 25分钟
    plannedDuration: 1500,
    type: 'focus',
    status: 'completed',
    interruptions: 0
  }
]

/**
 * 清理重复的任务ID
 */
function cleanupDuplicateTaskIds(tasks: Task[]): Task[] {
  const seenIds = new Set<string>()
  const cleanedTasks: Task[] = []
  
  for (const task of tasks) {
    if (!seenIds.has(task.id)) {
      seenIds.add(task.id)
      cleanedTasks.push(task)
    } else {
      // 为重复的任务生成新ID
      const newTask = { ...task, id: generateId() }
      cleanedTasks.push(newTask)
      console.warn('Found duplicate task ID, generated new ID:', task.id, '->', newTask.id)
    }
  }
  
  return cleanedTasks
}

/**
 * 初始化示例数据
 */
export function initializeSampleData() {
  // 检查是否已有数据
  const existingTasks = localStorage.getItem('task-store')
  const existingPomodoro = localStorage.getItem('pomodoro-store')
  
  if (!existingTasks) {
    // 初始化任务数据
    const taskStore = {
      state: {
        tasks: cleanupDuplicateTaskIds(sampleTasks)
      },
      version: 0
    }
    localStorage.setItem('task-store', JSON.stringify(taskStore))
  } else {
    // 检查现有数据是否有重复ID
    try {
      const taskStore = JSON.parse(existingTasks)
      if (taskStore.state && taskStore.state.tasks) {
        const cleanedTasks = cleanupDuplicateTaskIds(taskStore.state.tasks)
        if (cleanedTasks.length !== taskStore.state.tasks.length || 
            cleanedTasks.some((task, index) => task.id !== taskStore.state.tasks[index]?.id)) {
          // 有重复ID，更新数据
          taskStore.state.tasks = cleanedTasks
          localStorage.setItem('task-store', JSON.stringify(taskStore))
          console.log('Cleaned up duplicate task IDs')
        }
      }
    } catch (error) {
      console.error('Error cleaning up task data:', error)
    }
  }
  
  if (!existingPomodoro) {
    // 初始化番茄钟数据
    const pomodoroStore = {
      state: {
        sessions: sampleSessions,
        settings: {
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartPomodoros: false,
          soundEnabled: true,
          notificationEnabled: true
        },
        timer: {
          completedPomodoros: 4,
          currentCycle: 1
        }
      },
      version: 0
    }
    localStorage.setItem('pomodoro-store', JSON.stringify(pomodoroStore))
  }
}

/**
 * 清除所有数据
 */
export function clearAllData() {
  localStorage.removeItem('task-store')
  localStorage.removeItem('pomodoro-store')
  localStorage.removeItem('stats-store')
}

/**
 * 重置为示例数据
 */
export function resetToSampleData() {
  clearAllData()
  initializeSampleData()
}

/**
 * 修复现有数据中的问题（重复ID等）
 */
export function fixExistingData() {
  try {
    const existingTasks = localStorage.getItem('task-store')
    if (existingTasks) {
      const taskStore = JSON.parse(existingTasks)
      if (taskStore.state && taskStore.state.tasks) {
        const cleanedTasks = cleanupDuplicateTaskIds(taskStore.state.tasks)
        taskStore.state.tasks = cleanedTasks
        localStorage.setItem('task-store', JSON.stringify(taskStore))
        console.log('Fixed existing task data')
        return true
      }
    }
  } catch (error) {
    console.error('Error fixing existing data:', error)
  }
  return false
}
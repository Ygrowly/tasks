/**
 * 生成唯一ID
 */
export function generateId(): string {
  // 使用时间戳 + 随机数 + 计数器确保唯一性
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  const counter = (generateId as any).counter = ((generateId as any).counter || 0) + 1
  return `${timestamp}-${random}-${counter.toString(36)}`
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export function formatDate(date: Date | string): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date)
      // 返回今天的日期作为fallback
      return new Date().toISOString().split('T')[0]
    }
    
    return dateObj.toISOString().split('T')[0]
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    // 返回今天的日期作为fallback
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * 格式化时间为 HH:MM 格式
 */
export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

/**
 * 格式化日期时间为本地化字符串
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 格式化秒数为 MM:SS 格式
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * 格式化分钟数为可读格式
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}小时`
  }
  
  return `${hours}小时${remainingMinutes}分钟`
}

/**
 * 获取今天的日期字符串
 */
export function getToday(): string {
  return formatDate(new Date())
}

/**
 * 获取本周开始日期（周一）
 */
export function getWeekStart(date?: Date): string {
  const d = date || new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 调整为周一开始
  const monday = new Date(d.setDate(diff))
  return formatDate(monday)
}

/**
 * 获取本月开始日期
 */
export function getMonthStart(date?: Date): string {
  const d = date || new Date()
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1))
}

/**
 * 计算两个日期之间的天数差
 */
export function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 检查日期是否为今天
 */
export function isToday(date: string): boolean {
  return date === getToday()
}

/**
 * 检查日期是否为本周
 */
export function isThisWeek(date: string): boolean {
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  
  return date >= weekStart && date <= formatDate(weekEnd)
}

/**
 * 获取日期的显示文本
 */
export function getDateDisplayText(date: string): string {
  const today = getToday()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatDate(yesterday)
  
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = formatDate(tomorrow)
  
  if (date === today) {
    return '今天'
  } else if (date === yesterdayStr) {
    return '昨天'
  } else if (date === tomorrowStr) {
    return '明天'
  } else {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  
  return obj
}

/**
 * 计算完成率百分比
 */
export function calculatePercentage(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * 获取任务状态的显示文本
 */
export function getTaskStatusText(status: string): string {
  const statusMap = {
    'todo': '待办',
    'in-progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

/**
 * 获取任务分类的显示文本
 */
export function getTaskCategoryText(category: string): string {
  const categoryMap = {
    'work': '工作',
    'study': '学习',
    'life': '生活',
    'other': '其他'
  }
  return categoryMap[category] || category
}

/**
 * 获取任务优先级的显示文本
 */
export function getTaskPriorityText(priority: string): string {
  const priorityMap = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'urgent': '紧急'
  }
  return priorityMap[priority] || priority
}

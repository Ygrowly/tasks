import { create } from 'zustand'
import { DailyStats, WeeklyStats, MonthlyStats, OverallStats, ChartData, CategoryStats } from '../types/stats'
import { Task } from '../types/task'
import { PomodoroSession } from '../types/pomodoro'

interface StatsState {
  dailyStats: DailyStats[]
  weeklyStats: WeeklyStats[]
  monthlyStats: MonthlyStats[]
  overallStats: OverallStats | null
  loading: boolean
  error: string | null
}

interface StatsActions {
  // 计算统计数据
  calculateDailyStats: (date: string, tasks: Task[], sessions: PomodoroSession[]) => DailyStats
  calculateWeeklyStats: (weekStart: string, tasks: Task[], sessions: PomodoroSession[]) => WeeklyStats
  calculateMonthlyStats: (month: string, year: number, tasks: Task[], sessions: PomodoroSession[]) => MonthlyStats
  calculateOverallStats: (tasks: Task[], sessions: PomodoroSession[]) => OverallStats
  
  // 更新统计数据
  updateDailyStats: (stats: DailyStats) => void
  updateWeeklyStats: (stats: WeeklyStats) => void
  updateMonthlyStats: (stats: MonthlyStats) => void
  updateOverallStats: (stats: OverallStats) => void
  
  // 获取图表数据
  getTrendChartData: (period: 'week' | 'month') => ChartData
  getCategoryChartData: (period: 'week' | 'month') => ChartData
  getProductivityChartData: (period: 'week' | 'month') => ChartData
  
  // 获取统计数据
  getDailyStats: (date: string) => DailyStats | undefined
  getWeeklyStats: (weekStart: string) => WeeklyStats | undefined
  getMonthlyStats: (month: string, year: number) => MonthlyStats | undefined
  
  // 数据管理
  clearAllStats: () => void
  refreshStats: (tasks: Task[], sessions: PomodoroSession[]) => void
}

type StatsStore = StatsState & StatsActions

const initialOverallStats: OverallStats = {
  totalDays: 0,
  totalTasks: 0,
  totalTomatoes: 0,
  totalFocusTime: 0,
  averageDailyTomatoes: 0,
  longestStreak: 0,
  currentStreak: 0,
  mostProductiveDay: '',
  favoriteCategory: '',
  completionRate: 0
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  // 初始状态
  dailyStats: [],
  weeklyStats: [],
  monthlyStats: [],
  overallStats: null,
  loading: false,
  error: null,

  // 计算每日统计
  calculateDailyStats: (date: string, tasks: Task[], sessions: PomodoroSession[]) => {
    const dayTasks = tasks.filter(task => task.scheduledDate === date)
    const daySessions = sessions.filter(session => 
      session.startTime.startsWith(date) && session.status === 'completed' && session.type === 'focus'
    )
    
    const completedTasks = dayTasks.filter(task => task.status === 'completed').length
    const completedTomatoes = daySessions.length
    const focusTime = daySessions.reduce((sum, session) => sum + session.duration, 0) / 60
    
    // 按分类统计
    const categoryMap = new Map<string, CategoryStats>()
    dayTasks.forEach(task => {
      const category = task.category
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          taskCount: 0,
          tomatoCount: 0,
          focusTime: 0,
          completionRate: 0
        })
      }
      
      const stats = categoryMap.get(category)!
      stats.taskCount += 1
      stats.tomatoCount += task.completedTomatoes
      
      if (task.status === 'completed') {
        stats.completionRate += 1
      }
    })
    
    // 计算完成率
    categoryMap.forEach((stats, category) => {
      stats.completionRate = stats.taskCount > 0 ? (stats.completionRate / stats.taskCount) * 100 : 0
      
      // 计算该分类的专注时间
      const categorySessions = daySessions.filter(session => {
        const task = dayTasks.find(t => t.id === session.taskId)
        return task?.category === category
      })
      stats.focusTime = categorySessions.reduce((sum, session) => sum + session.duration, 0) / 60
    })
    
    return {
      date,
      completedTasks,
      completedTomatoes,
      focusTime,
      categories: Array.from(categoryMap.values())
    }
  },

  // 计算周统计
  calculateWeeklyStats: (weekStart: string, tasks: Task[], sessions: PomodoroSession[]) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    
    const weekTasks = tasks.filter(task => 
      task.scheduledDate >= weekStart && task.scheduledDate <= weekEndStr
    )
    
    const weekSessions = sessions.filter(session => {
      const sessionDate = session.startTime.split('T')[0]
      return sessionDate >= weekStart && sessionDate <= weekEndStr && 
             session.status === 'completed' && session.type === 'focus'
    })
    
    const totalTasks = weekTasks.length
    const completedTasks = weekTasks.filter(task => task.status === 'completed').length
    const totalTomatoes = weekSessions.length
    const totalFocusTime = weekSessions.reduce((sum, session) => sum + session.duration, 0) / 60
    
    // 计算每日统计
    const dailyStats: DailyStats[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      dailyStats.push(get().calculateDailyStats(dateStr, tasks, sessions))
    }
    
    return {
      weekStart,
      weekEnd: weekEndStr,
      totalTasks,
      completedTasks,
      totalTomatoes,
      totalFocusTime,
      dailyStats,
      averageDaily: {
        tasks: totalTasks / 7,
        tomatoes: totalTomatoes / 7,
        focusTime: totalFocusTime / 7
      }
    }
  },

  // 计算月统计
  calculateMonthlyStats: (month: string, year: number, tasks: Task[], sessions: PomodoroSession[]) => {
    const monthStart = `${year}-${month.padStart(2, '0')}-01`
    const monthEnd = new Date(year, parseInt(month) - 1 + 1, 0).toISOString().split('T')[0]
    
    const monthTasks = tasks.filter(task => 
      task.scheduledDate >= monthStart && task.scheduledDate <= monthEnd
    )
    
    const monthSessions = sessions.filter(session => {
      const sessionDate = session.startTime.split('T')[0]
      return sessionDate >= monthStart && sessionDate <= monthEnd && 
             session.status === 'completed' && session.type === 'focus'
    })
    
    const totalTasks = monthTasks.length
    const completedTasks = monthTasks.filter(task => task.status === 'completed').length
    const totalTomatoes = monthSessions.length
    const totalFocusTime = monthSessions.reduce((sum, session) => sum + session.duration, 0) / 60
    
    // 计算分类统计
    const categoryMap = new Map<string, CategoryStats>()
    monthTasks.forEach(task => {
      const category = task.category
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          taskCount: 0,
          tomatoCount: 0,
          focusTime: 0,
          completionRate: 0
        })
      }
      
      const stats = categoryMap.get(category)!
      stats.taskCount += 1
      stats.tomatoCount += task.completedTomatoes
      
      if (task.status === 'completed') {
        stats.completionRate += 1
      }
    })
    
    categoryMap.forEach((stats) => {
      stats.completionRate = stats.taskCount > 0 ? (stats.completionRate / stats.taskCount) * 100 : 0
    })
    
    return {
      month,
      year,
      totalTasks,
      completedTasks,
      totalTomatoes,
      totalFocusTime,
      weeklyStats: [], // TODO: 计算周统计
      categoryBreakdown: Array.from(categoryMap.values()),
      productivityTrend: [] // TODO: 计算生产力趋势
    }
  },

  // 计算总体统计
  calculateOverallStats: (tasks: Task[], sessions: PomodoroSession[]) => {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.type === 'focus')
    const completedTasks = tasks.filter(task => task.status === 'completed')
    
    const totalTasks = tasks.length
    const totalTomatoes = completedSessions.length
    const totalFocusTime = completedSessions.reduce((sum, session) => sum + session.duration, 0) / 60
    
    // 计算活跃天数
    const activeDays = new Set(
      completedSessions.map(session => session.startTime.split('T')[0])
    ).size
    
    // 计算最喜欢的分类
    const categoryCount = new Map<string, number>()
    tasks.forEach(task => {
      categoryCount.set(task.category, (categoryCount.get(task.category) || 0) + 1)
    })
    
    let favoriteCategory = ''
    let maxCount = 0
    categoryCount.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count
        favoriteCategory = category
      }
    })
    
    return {
      totalDays: activeDays,
      totalTasks,
      totalTomatoes,
      totalFocusTime,
      averageDailyTomatoes: activeDays > 0 ? totalTomatoes / activeDays : 0,
      longestStreak: 0, // TODO: 计算最长连续天数
      currentStreak: 0, // TODO: 计算当前连续天数
      mostProductiveDay: '', // TODO: 计算最高效的一天
      favoriteCategory,
      completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0
    }
  },

  // 更新统计数据
  updateDailyStats: (stats: DailyStats) => {
    set((state) => ({
      dailyStats: [
        ...state.dailyStats.filter(s => s.date !== stats.date),
        stats
      ]
    }))
  },

  updateWeeklyStats: (stats: WeeklyStats) => {
    set((state) => ({
      weeklyStats: [
        ...state.weeklyStats.filter(s => s.weekStart !== stats.weekStart),
        stats
      ]
    }))
  },

  updateMonthlyStats: (stats: MonthlyStats) => {
    set((state) => ({
      monthlyStats: [
        ...state.monthlyStats.filter(s => !(s.month === stats.month && s.year === stats.year)),
        stats
      ]
    }))
  },

  updateOverallStats: (stats: OverallStats) => {
    set({ overallStats: stats })
  },

  // 获取图表数据
  getTrendChartData: (period: 'week' | 'month') => {
    const { dailyStats } = get()
    
    // 获取最近7天或30天的数据
    const days = period === 'week' ? 7 : 30
    const today = new Date()
    const labels: string[] = []
    const data: number[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      labels.push(date.toLocaleDateString('zh-CN', { 
        month: 'short', 
        day: 'numeric' 
      }))
      
      const dayStats = dailyStats.find(s => s.date === dateStr)
      data.push(dayStats?.completedTomatoes || 0)
    }
    
    return {
      labels,
      datasets: [{
        label: '完成番茄数',
        data,
        backgroundColor: 'rgba(74, 111, 165, 0.7)',
        borderColor: 'rgba(74, 111, 165, 1)',
        borderWidth: 2
      }]
    }
  },

  getCategoryChartData: (period: 'week' | 'month') => {
    const { dailyStats } = get()
    
    // 聚合分类数据
    const categoryMap = new Map<string, number>()
    const days = period === 'week' ? 7 : 30
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayStats = dailyStats.find(s => s.date === dateStr)
      if (dayStats) {
        dayStats.categories.forEach(cat => {
          categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + cat.tomatoCount)
        })
      }
    }
    
    const labels = Array.from(categoryMap.keys())
    const data = Array.from(categoryMap.values())
    
    return {
      labels,
      datasets: [{
        label: '番茄数分布',
        data,
        backgroundColor: [
          'rgba(74, 111, 165, 0.7)',
          'rgba(107, 140, 188, 0.7)',
          'rgba(255, 107, 107, 0.7)',
          'rgba(108, 117, 125, 0.7)'
        ]
      }]
    }
  },

  getProductivityChartData: (period: 'week' | 'month') => {
    // TODO: 实现生产力图表数据
    return {
      labels: [],
      datasets: []
    }
  },

  // 获取统计数据
  getDailyStats: (date: string) => {
    const { dailyStats } = get()
    return dailyStats.find(s => s.date === date)
  },

  getWeeklyStats: (weekStart: string) => {
    const { weeklyStats } = get()
    return weeklyStats.find(s => s.weekStart === weekStart)
  },

  getMonthlyStats: (month: string, year: number) => {
    const { monthlyStats } = get()
    return monthlyStats.find(s => s.month === month && s.year === year)
  },

  // 数据管理
  clearAllStats: () => {
    set({
      dailyStats: [],
      weeklyStats: [],
      monthlyStats: [],
      overallStats: null
    })
  },

  refreshStats: (tasks: Task[], sessions: PomodoroSession[]) => {
    const { calculateOverallStats } = get()
    const overallStats = calculateOverallStats(tasks, sessions)
    set({ overallStats })
  }
}))
export interface DailyStats {
  date: string
  completedTasks: number
  completedTomatoes: number
  focusTime: number // 专注时间（分钟）
  categories: CategoryStats[]
}

export interface CategoryStats {
  category: string
  taskCount: number
  tomatoCount: number
  focusTime: number
  completionRate: number
}

export interface WeeklyStats {
  weekStart: string
  weekEnd: string
  totalTasks: number
  completedTasks: number
  totalTomatoes: number
  totalFocusTime: number
  dailyStats: DailyStats[]
  averageDaily: {
    tasks: number
    tomatoes: number
    focusTime: number
  }
}

export interface MonthlyStats {
  month: string
  year: number
  totalTasks: number
  completedTasks: number
  totalTomatoes: number
  totalFocusTime: number
  weeklyStats: WeeklyStats[]
  categoryBreakdown: CategoryStats[]
  productivityTrend: {
    date: string
    productivity: number // 0-100
  }[]
}

export interface OverallStats {
  totalDays: number
  totalTasks: number
  totalTomatoes: number
  totalFocusTime: number
  averageDailyTomatoes: number
  longestStreak: number
  currentStreak: number
  mostProductiveDay: string
  favoriteCategory: string
  completionRate: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

export interface TrendData {
  date: string
  value: number
  label?: string
}
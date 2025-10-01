/**
 * 统计相关API服务
 * 处理数据统计、分析和报表生成
 */

import { ApiClient } from './api'
import { TaskService } from './taskService'
import { Task } from '../types/task'
import { DailyStats, WeeklyStats, MonthlyStats, OverallStats, ChartData, CategoryStats } from '../types/stats'
import { PomodoroSession } from '../types/pomodoro'
import { getStorageSync } from '../utils/storage'
import { 
  getDateRange, 
  formatDate, 
  getWeekRange, 
  getMonthRange,
  getDayOfWeek,
  getWeekOfYear 
} from '../utils/date'

/**
 * 统计服务类
 */
export class StatsService {
  private static readonly POMODORO_SESSIONS_KEY = 'pomodoro_sessions'

  /**
   * 获取每日统计数据
   */
  static async getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
    try {
      // 在实际项目中调用API
      // return ApiClient.get<DailyStats[]>('/api/stats/daily', { startDate, endDate })

      const tasks = await TaskService.getTasks({ startDate, endDate })
      const sessions = getStorageSync<PomodoroSession[]>(this.POMODORO_SESSIONS_KEY, [])
      
      const dateRange = getDateRange(startDate, endDate)
      const dailyStats: DailyStats[] = []

      for (const date of dateRange) {
        const dayTasks = tasks.tasks.filter(task => task.plannedDate === date)
        const daySessions = sessions.filter(session => 
          session.startTime.startsWith(date) && session.completed
        )

        const stats: DailyStats = {
          date,
          totalTasks: dayTasks.length,
          completedTasks: dayTasks.filter(t => t.status === 'completed').length,
          totalPomodoros: daySessions.length,
          focusTime: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
          productivity: this.calculateProductivity(dayTasks, daySessions),
          categories: this.calculateCategoryStats(dayTasks),
          interruptions: daySessions.reduce((sum, s) => sum + (s.interruptions || 0), 0)
        }

        dailyStats.push(stats)
      }

      return dailyStats
    } catch (error) {
      console.error('获取每日统计失败:', error)
      throw new Error('获取每日统计失败')
    }
  }

  /**
   * 获取每周统计数据
   */
  static async getWeeklyStats(year: number, weekCount: number = 12): Promise<WeeklyStats[]> {
    try {
      // return ApiClient.get<WeeklyStats[]>('/api/stats/weekly', { year, weekCount })

      const weeklyStats: WeeklyStats[] = []
      const currentWeek = getWeekOfYear(new Date())

      for (let i = 0; i < weekCount; i++) {
        const weekNumber = currentWeek - i
        if (weekNumber <= 0) break

        const weekRange = getWeekRange(year, weekNumber)
        const dailyStats = await this.getDailyStats(weekRange.start, weekRange.end)

        const stats: WeeklyStats = {
          year,
          week: weekNumber,
          startDate: weekRange.start,
          endDate: weekRange.end,
          totalTasks: dailyStats.reduce((sum, d) => sum + d.totalTasks, 0),
          completedTasks: dailyStats.reduce((sum, d) => sum + d.completedTasks, 0),
          totalPomodoros: dailyStats.reduce((sum, d) => sum + d.totalPomodoros, 0),
          focusTime: dailyStats.reduce((sum, d) => sum + d.focusTime, 0),
          averageProductivity: dailyStats.reduce((sum, d) => sum + d.productivity, 0) / dailyStats.length,
          dailyBreakdown: dailyStats,
          bestDay: this.findBestDay(dailyStats),
          totalInterruptions: dailyStats.reduce((sum, d) => sum + d.interruptions, 0)
        }

        weeklyStats.push(stats)
      }

      return weeklyStats.reverse() // 按时间正序排列
    } catch (error) {
      console.error('获取每周统计失败:', error)
      throw new Error('获取每周统计失败')
    }
  }

  /**
   * 获取每月统计数据
   */
  static async getMonthlyStats(year: number, monthCount: number = 6): Promise<MonthlyStats[]> {
    try {
      // return ApiClient.get<MonthlyStats[]>('/api/stats/monthly', { year, monthCount })

      const monthlyStats: MonthlyStats[] = []
      const currentMonth = new Date().getMonth() + 1

      for (let i = 0; i < monthCount; i++) {
        const month = currentMonth - i
        if (month <= 0) break

        const monthRange = getMonthRange(year, month)
        const dailyStats = await this.getDailyStats(monthRange.start, monthRange.end)

        const stats: MonthlyStats = {
          year,
          month,
          totalTasks: dailyStats.reduce((sum, d) => sum + d.totalTasks, 0),
          completedTasks: dailyStats.reduce((sum, d) => sum + d.completedTasks, 0),
          totalPomodoros: dailyStats.reduce((sum, d) => sum + d.totalPomodoros, 0),
          focusTime: dailyStats.reduce((sum, d) => sum + d.focusTime, 0),
          averageProductivity: dailyStats.reduce((sum, d) => sum + d.productivity, 0) / dailyStats.length,
          categoryDistribution: this.mergeCategoryStats(dailyStats.map(d => d.categories)),
          weeklyTrend: this.calculateWeeklyTrend(dailyStats),
          completionRate: this.calculateCompletionRate(dailyStats)
        }

        monthlyStats.push(stats)
      }

      return monthlyStats.reverse()
    } catch (error) {
      console.error('获取每月统计失败:', error)
      throw new Error('获取每月统计失败')
    }
  }

  /**
   * 获取总体统计数据
   */
  static async getOverallStats(): Promise<OverallStats> {
    try {
      // return ApiClient.get<OverallStats>('/api/stats/overall')

      const allTasks = await TaskService.getTasks()
      const allSessions = getStorageSync<PomodoroSession[]>(this.POMODORO_SESSIONS_KEY, [])
      const completedSessions = allSessions.filter(s => s.completed)

      const firstTaskDate = allTasks.tasks.length > 0 
        ? allTasks.tasks.reduce((earliest, task) => 
            task.createdAt < earliest ? task.createdAt : earliest, 
            allTasks.tasks[0].createdAt
          ).split('T')[0]
        : formatDate(new Date())

      const today = formatDate(new Date())
      const totalDays = Math.ceil((new Date(today).getTime() - new Date(firstTaskDate).getTime()) / (1000 * 60 * 60 * 24)) + 1

      return {
        totalTasks: allTasks.total,
        completedTasks: allTasks.tasks.filter(t => t.status === 'completed').length,
        totalPomodoros: completedSessions.length,
        totalFocusTime: completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        averageTasksPerDay: allTasks.total / totalDays,
        averagePomodorosPerDay: completedSessions.length / totalDays,
        longestStreak: await this.calculateLongestStreak(),
        currentStreak: await this.calculateCurrentStreak(),
        mostProductiveDay: await this.findMostProductiveDay(),
        categoryBreakdown: this.calculateOverallCategoryStats(allTasks.tasks),
        monthlyTrend: await this.getMonthlyTrend(),
        estimationAccuracy: this.calculateEstimationAccuracy(allTasks.tasks)
      }
    } catch (error) {
      console.error('获取总体统计失败:', error)
      throw new Error('获取总体统计失败')
    }
  }

  /**
   * 获取图表数据
   */
  static async getChartData(type: 'daily' | 'weekly' | 'monthly', period: number = 7): Promise<ChartData> {
    try {
      const today = new Date()
      let startDate: string
      let endDate: string = formatDate(today)

      switch (type) {
        case 'daily':
          startDate = formatDate(new Date(today.getTime() - (period - 1) * 24 * 60 * 60 * 1000))
          break
        case 'weekly':
          startDate = formatDate(new Date(today.getTime() - (period - 1) * 7 * 24 * 60 * 60 * 1000))
          break
        case 'monthly':
          startDate = formatDate(new Date(today.getFullYear(), today.getMonth() - (period - 1), 1))
          break
      }

      const dailyStats = await this.getDailyStats(startDate, endDate)

      return {
        labels: dailyStats.map(d => d.date),
        datasets: [
          {
            name: '完成任务',
            data: dailyStats.map(d => d.completedTasks),
            color: '#28a745'
          },
          {
            name: '番茄数',
            data: dailyStats.map(d => d.totalPomodoros),
            color: '#4a6fa5'
          },
          {
            name: '专注时间(小时)',
            data: dailyStats.map(d => Math.round(d.focusTime / 60)),
            color: '#ff6b6b'
          }
        ]
      }
    } catch (error) {
      console.error('获取图表数据失败:', error)
      throw new Error('获取图表数据失败')
    }
  }

  /**
   * 计算生产力指数
   */
  private static calculateProductivity(tasks: Task[], sessions: PomodoroSession[]): number {
    if (tasks.length === 0) return 0

    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const completionRate = completedTasks / tasks.length

    const totalEstimated = tasks.reduce((sum, t) => sum + t.estimatedPomodoros, 0)
    const totalActual = sessions.length
    const efficiencyRate = totalEstimated > 0 ? Math.min(totalActual / totalEstimated, 1) : 0

    return Math.round((completionRate * 0.6 + efficiencyRate * 0.4) * 100)
  }

  /**
   * 计算分类统计
   */
  private static calculateCategoryStats(tasks: Task[]): CategoryStats[] {
    const categoryMap = new Map<string, { total: number; completed: number }>()

    tasks.forEach(task => {
      const category = task.category
      const current = categoryMap.get(category) || { total: 0, completed: 0 }
      current.total++
      if (task.status === 'completed') {
        current.completed++
      }
      categoryMap.set(category, current)
    })

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category: category as any,
      total: stats.total,
      completed: stats.completed,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }))
  }

  /**
   * 查找最佳日期
   */
  private static findBestDay(dailyStats: DailyStats[]): string {
    return dailyStats.reduce((best, current) => 
      current.productivity > best.productivity ? current : best
    ).date
  }

  /**
   * 合并分类统计
   */
  private static mergeCategoryStats(categoryStatsList: CategoryStats[][]): CategoryStats[] {
    const merged = new Map<string, { total: number; completed: number }>()

    categoryStatsList.forEach(categoryStats => {
      categoryStats.forEach(stat => {
        const current = merged.get(stat.category) || { total: 0, completed: 0 }
        current.total += stat.total
        current.completed += stat.completed
        merged.set(stat.category, current)
      })
    })

    return Array.from(merged.entries()).map(([category, stats]) => ({
      category: category as any,
      total: stats.total,
      completed: stats.completed,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }))
  }

  /**
   * 计算周趋势
   */
  private static calculateWeeklyTrend(dailyStats: DailyStats[]): number[] {
    const weeks = Math.ceil(dailyStats.length / 7)
    const weeklyTrend: number[] = []

    for (let i = 0; i < weeks; i++) {
      const weekStart = i * 7
      const weekEnd = Math.min(weekStart + 7, dailyStats.length)
      const weekStats = dailyStats.slice(weekStart, weekEnd)
      const weekTotal = weekStats.reduce((sum, d) => sum + d.completedTasks, 0)
      weeklyTrend.push(weekTotal)
    }

    return weeklyTrend
  }

  /**
   * 计算完成率
   */
  private static calculateCompletionRate(dailyStats: DailyStats[]): number {
    const totalTasks = dailyStats.reduce((sum, d) => sum + d.totalTasks, 0)
    const completedTasks = dailyStats.reduce((sum, d) => sum + d.completedTasks, 0)
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }

  /**
   * 计算最长连续天数
   */
  private static async calculateLongestStreak(): Promise<number> {
    // 实现连续完成任务天数的计算逻辑
    return 0 // 简化实现
  }

  /**
   * 计算当前连续天数
   */
  private static async calculateCurrentStreak(): Promise<number> {
    // 实现当前连续完成任务天数的计算逻辑
    return 0 // 简化实现
  }

  /**
   * 查找最高效的一天
   */
  private static async findMostProductiveDay(): Promise<string> {
    const today = formatDate(new Date())
    const lastWeek = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    const dailyStats = await this.getDailyStats(lastWeek, today)
    
    return dailyStats.reduce((best, current) => 
      current.productivity > best.productivity ? current : best
    ).date
  }

  /**
   * 计算总体分类统计
   */
  private static calculateOverallCategoryStats(tasks: Task[]): CategoryStats[] {
    return this.calculateCategoryStats(tasks)
  }

  /**
   * 获取月度趋势
   */
  private static async getMonthlyTrend(): Promise<number[]> {
    const monthlyStats = await this.getMonthlyStats(new Date().getFullYear(), 6)
    return monthlyStats.map(m => m.completedTasks)
  }

  /**
   * 计算预估准确性
   */
  private static calculateEstimationAccuracy(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.actualPomodoros > 0)
    if (completedTasks.length === 0) return 0

    const accuracySum = completedTasks.reduce((sum, task) => {
      const accuracy = Math.min(task.estimatedPomodoros, task.actualPomodoros) / 
                      Math.max(task.estimatedPomodoros, task.actualPomodoros)
      return sum + accuracy
    }, 0)

    return Math.round((accuracySum / completedTasks.length) * 100)
  }
}

export default StatsService

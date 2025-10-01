/**
 * 统计数据Hook
 * 封装统计数据的获取和计算逻辑
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStatsStore } from '../store/statsStore'
import { StatsService } from '../services/statsService'
import { DailyStats, WeeklyStats, MonthlyStats, OverallStats, ChartData, CategoryStats } from '../types/stats'
import { formatDate, getDateRange } from '../utils/date'

export interface UseStatsOptions {
  autoLoad?: boolean
  refreshInterval?: number
}

export interface UseStatsReturn {
  // 统计数据
  dailyStats: DailyStats[]
  weeklyStats: WeeklyStats[]
  monthlyStats: MonthlyStats[]
  overallStats: OverallStats | null
  
  // 加载状态
  loading: boolean
  error: string | null
  
  // 数据操作
  loadDailyStats: (startDate: string, endDate: string) => Promise<void>
  loadWeeklyStats: (year: number, weekCount?: number) => Promise<void>
  loadMonthlyStats: (year: number, monthCount?: number) => Promise<void>
  loadOverallStats: () => Promise<void>
  refreshAllStats: () => Promise<void>
  
  // 图表数据
  getChartData: (type: 'daily' | 'weekly' | 'monthly', period?: number) => Promise<ChartData | null>
  
  // 快捷统计
  todayStats: DailyStats | null
  thisWeekStats: WeeklyStats | null
  thisMonthStats: MonthlyStats | null
  
  // 趋势分析
  productivityTrend: number[]
  completionTrend: number[]
  focusTimeTrend: number[]
  
  // 分类统计
  categoryStats: CategoryStats[]
  topCategories: CategoryStats[]
  
  // 成就和里程碑
  achievements: {
    totalPomodoros: number
    totalFocusHours: number
    longestStreak: number
    currentStreak: number
    completionRate: number
  }
}

/**
 * 统计数据Hook
 */
export const useStats = (options: UseStatsOptions = {}): UseStatsReturn => {
  const {
    dailyStats,
    weeklyStats,
    monthlyStats,
    overallStats,
    loading,
    error,
    calculateDailyStats,
    calculateWeeklyStats,
    calculateMonthlyStats,
    calculateOverallStats,
    setLoading,
    setError
  } = useStatsStore()

  const [chartCache, setChartCache] = useState<Map<string, ChartData>>(new Map())

  // 加载每日统计
  const loadDailyStats = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const stats = await StatsService.getDailyStats(startDate, endDate)
      calculateDailyStats(stats)
    } catch (error) {
      console.error('加载每日统计失败:', error)
      setError('加载每日统计失败')
    } finally {
      setLoading(false)
    }
  }, [calculateDailyStats, setLoading, setError])

  // 加载每周统计
  const loadWeeklyStats = useCallback(async (year: number, weekCount: number = 12) => {
    try {
      setLoading(true)
      setError(null)
      
      const stats = await StatsService.getWeeklyStats(year, weekCount)
      calculateWeeklyStats(stats)
    } catch (error) {
      console.error('加载每周统计失败:', error)
      setError('加载每周统计失败')
    } finally {
      setLoading(false)
    }
  }, [calculateWeeklyStats, setLoading, setError])

  // 加载每月统计
  const loadMonthlyStats = useCallback(async (year: number, monthCount: number = 6) => {
    try {
      setLoading(true)
      setError(null)
      
      const stats = await StatsService.getMonthlyStats(year, monthCount)
      calculateMonthlyStats(stats)
    } catch (error) {
      console.error('加载每月统计失败:', error)
      setError('加载每月统计失败')
    } finally {
      setLoading(false)
    }
  }, [calculateMonthlyStats, setLoading, setError])

  // 加载总体统计
  const loadOverallStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const stats = await StatsService.getOverallStats()
      calculateOverallStats(stats)
    } catch (error) {
      console.error('加载总体统计失败:', error)
      setError('加载总体统计失败')
    } finally {
      setLoading(false)
    }
  }, [calculateOverallStats, setLoading, setError])

  // 刷新所有统计数据
  const refreshAllStats = useCallback(async () => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    await Promise.all([
      loadDailyStats(formatDate(lastWeek), formatDate(today)),
      loadWeeklyStats(currentYear, 12),
      loadMonthlyStats(currentYear, 6),
      loadOverallStats()
    ])
    
    // 清空图表缓存
    setChartCache(new Map())
  }, [loadDailyStats, loadWeeklyStats, loadMonthlyStats, loadOverallStats])

  // 获取图表数据
  const getChartData = useCallback(async (
    type: 'daily' | 'weekly' | 'monthly', 
    period: number = 7
  ): Promise<ChartData | null> => {
    try {
      const cacheKey = `${type}-${period}`
      
      // 检查缓存
      if (chartCache.has(cacheKey)) {
        return chartCache.get(cacheKey)!
      }
      
      const chartData = await StatsService.getChartData(type, period)
      
      // 更新缓存
      setChartCache(prev => new Map(prev).set(cacheKey, chartData))
      
      return chartData
    } catch (error) {
      console.error('获取图表数据失败:', error)
      return null
    }
  }, [chartCache])

  // 今日统计
  const todayStats = useMemo(() => {
    const today = formatDate(new Date())
    return dailyStats.find(stats => stats.date === today) || null
  }, [dailyStats])

  // 本周统计
  const thisWeekStats = useMemo(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentWeek = Math.ceil(today.getDate() / 7)
    
    return weeklyStats.find(stats => 
      stats.year === currentYear && stats.week === currentWeek
    ) || null
  }, [weeklyStats])

  // 本月统计
  const thisMonthStats = useMemo(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    
    return monthlyStats.find(stats => 
      stats.year === currentYear && stats.month === currentMonth
    ) || null
  }, [monthlyStats])

  // 生产力趋势
  const productivityTrend = useMemo(() => {
    return dailyStats.slice(-7).map(stats => stats.productivity)
  }, [dailyStats])

  // 完成率趋势
  const completionTrend = useMemo(() => {
    return dailyStats.slice(-7).map(stats => 
      stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
    )
  }, [dailyStats])

  // 专注时间趋势
  const focusTimeTrend = useMemo(() => {
    return dailyStats.slice(-7).map(stats => Math.round(stats.focusTime / 60)) // 转换为小时
  }, [dailyStats])

  // 分类统计
  const categoryStats = useMemo(() => {
    if (!todayStats) return []
    return todayStats.categories
  }, [todayStats])

  // 热门分类
  const topCategories = useMemo(() => {
    const categoryMap = new Map<string, { total: number; completed: number }>()
    
    dailyStats.forEach(dayStats => {
      dayStats.categories.forEach(cat => {
        const current = categoryMap.get(cat.category) || { total: 0, completed: 0 }
        current.total += cat.total
        current.completed += cat.completed
        categoryMap.set(cat.category, current)
      })
    })
    
    return Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category: category as any,
        total: stats.total,
        completed: stats.completed,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [dailyStats])

  // 成就和里程碑
  const achievements = useMemo(() => {
    if (!overallStats) {
      return {
        totalPomodoros: 0,
        totalFocusHours: 0,
        longestStreak: 0,
        currentStreak: 0,
        completionRate: 0
      }
    }
    
    return {
      totalPomodoros: overallStats.totalPomodoros,
      totalFocusHours: Math.round(overallStats.totalFocusTime / 60),
      longestStreak: overallStats.longestStreak,
      currentStreak: overallStats.currentStreak,
      completionRate: overallStats.completedTasks > 0 
        ? Math.round((overallStats.completedTasks / overallStats.totalTasks) * 100)
        : 0
    }
  }, [overallStats])

  // 自动加载数据
  useEffect(() => {
    if (options.autoLoad !== false) {
      refreshAllStats()
    }
  }, [options.autoLoad, refreshAllStats])

  // 定时刷新
  useEffect(() => {
    if (options.refreshInterval && options.refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshAllStats()
      }, options.refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [options.refreshInterval, refreshAllStats])

  return {
    // 统计数据
    dailyStats,
    weeklyStats,
    monthlyStats,
    overallStats,
    
    // 加载状态
    loading,
    error,
    
    // 数据操作
    loadDailyStats,
    loadWeeklyStats,
    loadMonthlyStats,
    loadOverallStats,
    refreshAllStats,
    
    // 图表数据
    getChartData,
    
    // 快捷统计
    todayStats,
    thisWeekStats,
    thisMonthStats,
    
    // 趋势分析
    productivityTrend,
    completionTrend,
    focusTimeTrend,
    
    // 分类统计
    categoryStats,
    topCategories,
    
    // 成就和里程碑
    achievements
  }
}

export default useStats

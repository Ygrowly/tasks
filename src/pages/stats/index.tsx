import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import { useTaskStore } from '../../store/taskStore'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { useStatsStore } from '../../store/statsStore'
import StatCard from '../../components/StatCard'
import TrendChart from '../../components/Charts/TrendChart'
import PieChart from '../../components/Charts/PieChart'
import { getToday, getWeekStart, getMonthStart } from '../../utils/helpers'
import styles from './index.module.css'

const StatsPage: React.FC = () => {
  const { tasks } = useTaskStore()
  const { sessions } = usePomodoroStore()
  const { getTrendChartData, getCategoryChartData } = useStatsStore()

  const [period, setPeriod] = useState<'week' | 'month'>('week')

  const periodOptions = [
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' }
  ]

  // 计算总体统计数据
  const overallStats = useMemo(() => {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.type === 'focus')
    const completedTasks = tasks.filter(task => task.status === 'completed')
    
    // 计算活跃天数
    const activeDays = new Set(
      completedSessions.map(session => session.startTime.split('T')[0])
    ).size
    
    // 计算总专注时间（分钟）
    const totalFocusTime = Math.round(
      completedSessions.reduce((sum, session) => sum + session.duration, 0) / 60
    )
    
    // 计算最喜欢的分类
    const categoryCount = new Map<string, number>()
    tasks.forEach(task => {
      categoryCount.set(task.category, (categoryCount.get(task.category) || 0) + 1)
    })
    
    let favoriteCategory = '工作'
    let maxCount = 0
    categoryCount.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count
        favoriteCategory = category === 'work' ? '工作' : 
                          category === 'study' ? '学习' : 
                          category === 'life' ? '生活' : '其他'
      }
    })
    
    // 计算完成率
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
    
    // 计算平均每日番茄数
    const averageDailyTomatoes = activeDays > 0 ? Math.round((completedSessions.length / activeDays) * 10) / 10 : 0
    
    return {
      totalDays: activeDays,
      totalTasks: tasks.length,
      totalTomatoes: completedSessions.length,
      totalFocusTime,
      averageDailyTomatoes,
      favoriteCategory,
      completionRate,
      longestStreak: 7, // 模拟数据
      currentStreak: 3   // 模拟数据
    }
  }, [tasks, sessions])

  // 获取趋势图表数据
  const trendData = useMemo(() => {
    return getTrendChartData(period)
  }, [period, getTrendChartData])

  // 获取分类分布数据
  const categoryData = useMemo(() => {
    return getCategoryChartData(period)
  }, [period, getCategoryChartData])

  // 计算当前时期的统计数据
  const periodStats = useMemo(() => {
    const now = new Date()
    let startDate: string
    let endDate: string = getToday()

    if (period === 'week') {
      startDate = getWeekStart()
    } else {
      startDate = getMonthStart()
    }

    // 筛选时期内的任务和会话
    const periodTasks = tasks.filter(task => 
      task.scheduledDate >= startDate && task.scheduledDate <= endDate
    )
    
    const periodSessions = sessions.filter(session => {
      const sessionDate = session.startTime.split('T')[0]
      return sessionDate >= startDate && sessionDate <= endDate && 
             session.status === 'completed' && session.type === 'focus'
    })

    const completedTasks = periodTasks.filter(task => task.status === 'completed').length
    const totalFocusTime = Math.round(
      periodSessions.reduce((sum, session) => sum + session.duration, 0) / 60
    )
    
    return {
      totalTasks: periodTasks.length,
      completedTasks,
      totalTomatoes: periodSessions.length,
      totalFocusTime,
      completionRate: periodTasks.length > 0 ? Math.round((completedTasks / periodTasks.length) * 100) : 0
    }
  }, [period, tasks, sessions])

  const handlePeriodChange = (e: any) => {
    const index = e.detail.value
    setPeriod(periodOptions[index].value as typeof period)
  }

  const getPeriodIndex = () => {
    return periodOptions.findIndex(option => option.value === period)
  }

  return (
    <View className="stats-page">
      {/* 页面头部 */}
      <View className="stats-header">
        <View className="stats-header__title">
          <Text className="stats-header__title-text">数据统计</Text>
          <Text className="stats-header__subtitle">专注效率分析</Text>
        </View>
        
        <View className="stats-header__filter">
          <Picker
            mode="selector"
            range={periodOptions}
            rangeKey="label"
            value={getPeriodIndex()}
            onChange={handlePeriodChange}
          >
            <View className="period-picker">
              <Text className="period-picker__text">
                {periodOptions[getPeriodIndex()]?.label}
              </Text>
              <Text className="period-picker__arrow iconfont icon-arrow-down" />
            </View>
          </Picker>
        </View>
      </View>

      <ScrollView 
        className="stats-content"
        scrollY
        enhanced
        showScrollbar={false}
      >
        {/* 总体概览 */}
        <View className="stats-overview">
          <View className="stats-section__header">
            <Text className="stats-section__title">总体概览</Text>
          </View>
          
          <View className="stats-overview__grid">
            <StatCard
              value={overallStats.totalDays}
              label="累计专注天数"
              icon="icon-calendar"
              color="primary"
            />
            <StatCard
              value={overallStats.totalTomatoes}
              label="总番茄数"
              icon="icon-tomato"
              color="success"
            />
            <StatCard
              value={`${overallStats.totalFocusTime}分钟`}
              label="总专注时间"
              icon="icon-clock"
              color="info"
            />
            <StatCard
              value={`${overallStats.completionRate}%`}
              label="任务完成率"
              icon="icon-chart"
              color="warning"
            />
          </View>
          
          <View className="stats-overview__secondary">
            <StatCard
              value={overallStats.averageDailyTomatoes}
              label="平均每日番茄"
              icon="icon-average"
              color="primary"
            />
            <StatCard
              value={overallStats.longestStreak}
              label="最长连续天数"
              icon="icon-fire"
              color="danger"
            />
            <StatCard
              value={overallStats.currentStreak}
              label="当前连续天数"
              icon="icon-streak"
              color="success"
            />
            <StatCard
              value={overallStats.favoriteCategory}
              label="最常用分类"
              icon="icon-category"
              color="info"
            />
          </View>
        </View>

        {/* 当前时期统计 */}
        <View className="stats-period">
          <View className="stats-section__header">
            <Text className="stats-section__title">
              {period === 'week' ? '本周' : '本月'}数据
            </Text>
          </View>
          
          <View className="stats-period__grid">
            <StatCard
              value={periodStats.totalTasks}
              label="任务总数"
              icon="icon-task"
              color="primary"
            />
            <StatCard
              value={periodStats.completedTasks}
              label="已完成任务"
              icon="icon-check"
              color="success"
            />
            <StatCard
              value={periodStats.totalTomatoes}
              label="完成番茄数"
              icon="icon-tomato"
              color="warning"
            />
            <StatCard
              value={`${periodStats.totalFocusTime}分钟`}
              label="专注时间"
              icon="icon-clock"
              color="info"
            />
          </View>
        </View>

        {/* 专注趋势 */}
        <View className="stats-charts">
          <View className="stats-section__header">
            <Text className="stats-section__title">专注趋势</Text>
            <Text className="stats-section__subtitle">
              {period === 'week' ? '最近7天' : '最近30天'}的专注情况
            </Text>
          </View>
          
          <View className="chart-container">
            <TrendChart 
              data={trendData}
              type="bar"
              height={280}
            />
          </View>
        </View>

        {/* 分类分布 */}
        <View className="stats-charts">
          <View className="stats-section__header">
            <Text className="stats-section__title">任务分类分布</Text>
            <Text className="stats-section__subtitle">
              {period === 'week' ? '本周' : '本月'}各分类的番茄数占比
            </Text>
          </View>
          
          <View className="chart-container">
            <PieChart 
              data={categoryData}
              height={300}
              showLegend={true}
            />
          </View>
        </View>

        {/* 效率分析 */}
        <View className="stats-analysis">
          <View className="stats-section__header">
            <Text className="stats-section__title">效率分析</Text>
          </View>
          
          <View className="analysis-cards">
            <View className="analysis-card">
              <View className="analysis-card__icon">
                <Text className="iconfont icon-trend-up" />
              </View>
              <View className="analysis-card__content">
                <Text className="analysis-card__title">专注效率</Text>
                <Text className="analysis-card__desc">
                  平均每个番茄钟专注 {Math.round(25 * 0.95)} 分钟，效率较高
                </Text>
              </View>
            </View>
            
            <View className="analysis-card">
              <View className="analysis-card__icon">
                <Text className="iconfont icon-target" />
              </View>
              <View className="analysis-card__content">
                <Text className="analysis-card__title">目标达成</Text>
                <Text className="analysis-card__desc">
                  {period === 'week' ? '本周' : '本月'}完成率 {periodStats.completionRate}%，
                  {periodStats.completionRate >= 80 ? '表现优秀' : 
                   periodStats.completionRate >= 60 ? '表现良好' : '需要加油'}
                </Text>
              </View>
            </View>
            
            <View className="analysis-card">
              <View className="analysis-card__icon">
                <Text className="iconfont icon-time" />
              </View>
              <View className="analysis-card__content">
                <Text className="analysis-card__title">时间分配</Text>
                <Text className="analysis-card__desc">
                  最常在 {overallStats.favoriteCategory} 类任务上投入时间，建议保持平衡
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default StatsPage
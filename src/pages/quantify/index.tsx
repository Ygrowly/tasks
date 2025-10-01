import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import { useTaskStore } from '../../store/taskStore'
import { usePomodoroStore } from '../../store/pomodoroStore'
import StatCard from '../../components/StatCard'
import { getToday, getWeekStart, getMonthStart, calculatePercentage } from '../../utils/helpers'
import styles from './index.module.css'

const QuantifyPage: React.FC = () => {
  const { tasks, getTasksByDate } = useTaskStore()
  const { sessions } = usePomodoroStore()

  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')

  const periodOptions = [
    { label: '今天', value: 'today' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' }
  ]

  // 根据选择的时间段获取任务数据
  const periodData = useMemo(() => {
    let startDate: string
    let endDate: string
    const today = getToday()

    switch (period) {
      case 'today':
        startDate = endDate = today
        break
      case 'week':
        startDate = getWeekStart()
        const weekEnd = new Date(startDate)
        weekEnd.setDate(weekEnd.getDate() + 6)
        endDate = weekEnd.toISOString().split('T')[0]
        break
      case 'month':
        startDate = getMonthStart()
        const monthEnd = new Date(startDate)
        monthEnd.setMonth(monthEnd.getMonth() + 1)
        monthEnd.setDate(monthEnd.getDate() - 1)
        endDate = monthEnd.toISOString().split('T')[0]
        break
      default:
        startDate = endDate = today
    }

    // 筛选时间段内的任务
    const periodTasks = tasks.filter(task => 
      task.scheduledDate >= startDate && task.scheduledDate <= endDate
    )

    // 筛选时间段内的番茄钟会话
    const periodSessions = sessions.filter(session => {
      const sessionDate = session.startTime.split('T')[0]
      return sessionDate >= startDate && sessionDate <= endDate && 
             session.status === 'completed' && session.type === 'focus'
    })

    return { periodTasks, periodSessions, startDate, endDate }
  }, [period, tasks, sessions])

  // 计算统计数据
  const stats = useMemo(() => {
    const { periodTasks, periodSessions } = periodData
    
    const totalPlannedTomatoes = periodTasks.reduce((sum, task) => sum + task.plannedTomatoes, 0)
    const totalActualTomatoes = periodSessions.length
    const completionRate = totalPlannedTomatoes > 0 
      ? calculatePercentage(totalActualTomatoes, totalPlannedTomatoes)
      : 0

    const totalTasks = periodTasks.length
    const completedTasks = periodTasks.filter(task => task.status === 'completed').length
    const taskCompletionRate = totalTasks > 0 
      ? calculatePercentage(completedTasks, totalTasks)
      : 0

    const totalFocusTime = periodSessions.reduce((sum, session) => sum + session.duration, 0) / 60 // 转换为分钟
    const averageTomatoPerTask = totalTasks > 0 ? (totalActualTomatoes / totalTasks).toFixed(1) : '0'

    return {
      totalPlannedTomatoes,
      totalActualTomatoes,
      completionRate,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      totalFocusTime: Math.round(totalFocusTime),
      averageTomatoPerTask
    }
  }, [periodData])

  // 按任务分组的量化数据
  const taskQuantifyData = useMemo(() => {
    const { periodTasks, periodSessions } = periodData
    
    return periodTasks.map(task => {
      // 找到该任务相关的番茄钟会话
      const taskSessions = periodSessions.filter(session => session.taskId === task.id)
      const actualTomatoes = taskSessions.length
      const completionRate = task.plannedTomatoes > 0 
        ? calculatePercentage(actualTomatoes, task.plannedTomatoes)
        : 0
      
      // 计算偏差
      const deviation = actualTomatoes - task.plannedTomatoes
      const deviationRate = task.plannedTomatoes > 0 
        ? Math.round((deviation / task.plannedTomatoes) * 100)
        : 0

      return {
        ...task,
        actualTomatoes,
        completionRate,
        deviation,
        deviationRate,
        focusTime: Math.round(taskSessions.reduce((sum, session) => sum + session.duration, 0) / 60)
      }
    }).sort((a, b) => {
      // 按完成率排序，未完成的任务排在前面
      if (a.status !== 'completed' && b.status === 'completed') return -1
      if (a.status === 'completed' && b.status !== 'completed') return 1
      return b.completionRate - a.completionRate
    })
  }, [periodData])

  const handlePeriodChange = (e: any) => {
    const index = e.detail.value
    setPeriod(periodOptions[index].value as typeof period)
  }

  const getPeriodIndex = () => {
    return periodOptions.findIndex(option => option.value === period)
  }

  const getPeriodTitle = () => {
    switch (period) {
      case 'today': return '今日量化'
      case 'week': return '本周量化'
      case 'month': return '本月量化'
      default: return '任务量化'
    }
  }

  return (
    <View className={styles.quantifyPage}>
      {/* 页面头部 */}
      <View className={styles.quantifyHeader}>
        <View className={styles.quantifyHeaderTitle}>
          <Text className={styles.quantifyHeaderTitleText}>
            {getPeriodTitle()}
          </Text>
        </View>
        
        <View className={styles.quantifyHeaderFilter}>
          <Picker
            mode="selector"
            range={periodOptions}
            rangeKey="label"
            value={getPeriodIndex()}
            onChange={handlePeriodChange}
          >
            <View className={styles.periodPicker}>
              <Text className={styles.periodPickerText}>
                {periodOptions[getPeriodIndex()]?.label}
              </Text>
              <Text className={`${styles.periodPickerArrow} iconfont icon-arrow-down`} />
            </View>
          </Picker>
        </View>
      </View>

      <ScrollView 
        className={styles.quantifyContent}
        scrollY
        enhanced
        showScrollbar={false}
      >
        {/* 总体统计 */}
        <View className={styles.quantifyStats}>
          <View className={styles.quantifyStatsGrid}>
            <StatCard
              value={stats.totalPlannedTomatoes}
              label="预计番茄"
              icon="icon-target"
              color="primary"
            />
            <StatCard
              value={stats.totalActualTomatoes}
              label="实际番茄"
              icon="icon-tomato"
              color="success"
            />
            <StatCard
              value={`${stats.completionRate}%`}
              label="番茄完成率"
              icon="icon-chart"
              color="info"
            />
            <StatCard
              value={`${stats.taskCompletionRate}%`}
              label="任务完成率"
              icon="icon-check"
              color="warning"
            />
          </View>
          
          <View className={styles.quantifyStatsSecondary}>
            <StatCard
              value={`${stats.totalFocusTime}分钟`}
              label="总专注时间"
              icon="icon-clock"
              color="primary"
            />
            <StatCard
              value={stats.averageTomatoPerTask}
              label="平均番茄/任务"
              icon="icon-average"
              color="secondary"
            />
          </View>
        </View>

        {/* 任务量化详情 */}
        <View className={styles.quantifyTasks}>
          <View className={styles.quantifySectionHeader}>
            <Text className={styles.quantifySectionTitle}>任务量化详情</Text>
            <Text className={styles.quantifySectionSubtitle}>
              预估准确性分析
            </Text>
          </View>
          
          {taskQuantifyData.length > 0 ? (
            <View className={styles.quantifyTaskList}>
              {taskQuantifyData.map((task) => (
                <View key={task.id} className={styles.quantifyTaskCard}>
                  <View className={styles.quantifyTaskCardHeader}>
                    <View className={styles.quantifyTaskCardTitleSection}>
                      <Text className={styles.quantifyTaskCardTitle}>
                        {task.title}
                      </Text>
                      <Text className={`${styles.quantifyTaskCardStatus} ${styles[`quantifyTaskCardStatus${task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', '')}`] || ''}`}>
                        {task.status === 'completed' ? '已完成' : 
                         task.status === 'in-progress' ? '进行中' : '待办'}
                      </Text>
                    </View>
                    
                    <View className={styles.quantifyTaskCardCompletion}>
                      <Text className={styles.quantifyTaskCardCompletionRate}>
                        {task.completionRate}%
                      </Text>
                    </View>
                  </View>

                  <View className={styles.quantifyTaskCardMetrics}>
                    <View className={styles.quantifyMetric}>
                      <Text className={styles.quantifyMetricLabel}>预计</Text>
                      <Text className={styles.quantifyMetricValue}>
                        {task.plannedTomatoes} 番茄
                      </Text>
                    </View>
                    
                    <View className={styles.quantifyMetric}>
                      <Text className={styles.quantifyMetricLabel}>实际</Text>
                      <Text className={styles.quantifyMetricValue}>
                        {task.actualTomatoes} 番茄
                      </Text>
                    </View>
                    
                    <View className={styles.quantifyMetric}>
                      <Text className={styles.quantifyMetricLabel}>偏差</Text>
                      <Text className={`${styles.quantifyMetricValue} ${
                        task.deviation > 0 ? styles.quantifyMetricValuePositive :
                        task.deviation < 0 ? styles.quantifyMetricValueNegative : ''
                      }`}>
                        {task.deviation > 0 ? '+' : ''}{task.deviation}
                      </Text>
                    </View>
                    
                    <View className={styles.quantifyMetric}>
                      <Text className={styles.quantifyMetricLabel}>专注时间</Text>
                      <Text className={styles.quantifyMetricValue}>
                        {task.focusTime}分钟
                      </Text>
                    </View>
                  </View>

                  <View className={styles.quantifyTaskCardProgress}>
                    <View className={styles.quantifyProgressBar}>
                      <View 
                        className={styles.quantifyProgressFill}
                        style={{ width: `${Math.min(100, task.completionRate)}%` }}
                      />
                      {task.completionRate > 100 && (
                        <View 
                          className={styles.quantifyProgressOverflow}
                          style={{ 
                            width: `${Math.min(50, task.completionRate - 100)}%`,
                            left: '100%'
                          }}
                        />
                      )}
                    </View>
                    
                    {task.deviationRate !== 0 && (
                      <Text className={`${styles.quantifyDeviation} ${
                        task.deviationRate > 0 ? styles.quantifyDeviationOver : styles.quantifyDeviationUnder
                      }`}>
                        {task.deviationRate > 0 ? '超出' : '不足'} {Math.abs(task.deviationRate)}%
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <View className={styles.emptyStateIcon}>
                <Text className="iconfont icon-empty" />
              </View>
              <Text className={styles.emptyStateText}>
                {period === 'today' ? '今天' : period === 'week' ? '本周' : '本月'}还没有任务数据
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default QuantifyPage
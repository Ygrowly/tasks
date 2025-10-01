import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useTaskStore } from '../../store/taskStore'
import { usePomodoroStore } from '../../store/pomodoroStore'
import StatCard from '../../components/StatCard'
import TaskCard from '../../components/TaskCard'
import PomodoroTimer from '../../components/PomodoroTimer'
import { getToday, getDateDisplayText } from '../../utils/helpers'
import styles from './index.module.css'

const HomePage: React.FC = () => {
  const { 
    tasks, 
    getTodayStats, 
    getTasksByDate,
    toggleTaskStatus,
    incrementTomato
  } = useTaskStore()
  
  const { 
    timer,
    setCurrentTask
  } = usePomodoroStore()

  const [showTimer, setShowTimer] = useState(false)
  const [currentTask, setCurrentTaskState] = useState<any>(null)

  const today = getToday()
  const todayTasks = getTasksByDate(today)
  const todayStats = getTodayStats()

  // 获取正在进行的任务
  const inProgressTask = todayTasks.find(task => task.status === 'in-progress')
  
  // 获取下一个待办任务
  const nextTodoTask = todayTasks.find(task => task.status === 'todo')

  useEffect(() => {
    // 页面加载时检查是否有正在运行的计时器
    if (timer.isRunning && timer.currentSession) {
      const task = tasks.find(t => t.id === timer.currentSession?.taskId)
      if (task) {
        setCurrentTaskState(task)
        setShowTimer(true)
      }
    }
  }, [timer, tasks])

  const handleStartTask = (task: any) => {
    setCurrentTaskState(task)
    setCurrentTask(task.id)
    setShowTimer(true)
  }

  const handleTaskClick = (task: any) => {
    if (task.status !== 'completed') {
      handleStartTask(task)
    }
  }

  const handleTimerComplete = () => {
    if (currentTask) {
      // 增加番茄数
      incrementTomato(currentTask.id)
      
      // 检查是否完成任务
      const updatedTask = tasks.find(t => t.id === currentTask.id)
      if (updatedTask && updatedTask.completedTomatoes >= updatedTask.plannedTomatoes) {
        toggleTaskStatus(currentTask.id)
      }
    }
    
    setShowTimer(false)
    setCurrentTaskState(null)
  }

  const handleTimerCancel = () => {
    setShowTimer(false)
    setCurrentTaskState(null)
  }

  const handleQuickStart = () => {
    const taskToStart = inProgressTask || nextTodoTask
    if (taskToStart) {
      handleStartTask(taskToStart)
    } else {
      Taro.showToast({
        title: '今天没有待办任务',
        icon: 'none'
      })
    }
  }

  const navigateToTasks = () => {
    Taro.switchTab({
      url: '/pages/tasks/index'
    })
  }

  return (
    <View className={styles.homePage}>
      {/* 页面头部 */}
      <View className={styles.homeHeader}>
        <View className={styles.homeHeaderDate}>
          <Text className={styles.homeHeaderDateText}>
            {getDateDisplayText(today)}
          </Text>
          <Text className={styles.homeHeaderDateFull}>
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </Text>
        </View>
        
        <View className={styles.homeHeaderGreeting}>
          <Text className={styles.homeHeaderGreetingText}>
            专注每一刻，成就每一天
          </Text>
        </View>
      </View>

      <ScrollView 
        className={styles.homeContent}
        scrollY
        enhanced
        showScrollbar={false}
      >
        {/* 统计卡片 */}
        <View className={styles.homeStats}>
          <View className={styles.homeStatsGrid}>
            <StatCard
              value={todayStats.totalPlannedTomatoes}
              label="预计番茄"
              icon="icon-target"
              color="primary"
            />
            <StatCard
              value={todayStats.totalCompletedTomatoes}
              label="已完成"
              icon="icon-tomato"
              color="success"
            />
            <StatCard
              value={todayStats.todoTasks}
              label="待办任务"
              icon="icon-todo"
              color="warning"
            />
            <StatCard
              value={`${Math.round(todayStats.completionRate)}%`}
              label="完成率"
              icon="icon-chart"
              color="info"
            />
          </View>
        </View>

        {/* 快速开始 */}
        <View className={styles.homeQuickStart}>
          <View className={styles.homeSectionHeader}>
            <Text className={styles.homeSectionTitle}>快速开始</Text>
          </View>
          
          {inProgressTask || nextTodoTask ? (
            <View className={styles.quickStartCard} onClick={handleQuickStart}>
              <View className={styles.quickStartCardIcon}>
                <Text className="iconfont icon-play" />
              </View>
              <View className={styles.quickStartCardContent}>
                <Text className={styles.quickStartCardTitle}>
                  {inProgressTask ? '继续任务' : '开始任务'}
                </Text>
                <Text className={styles.quickStartCardSubtitle}>
                  {(inProgressTask || nextTodoTask)?.title}
                </Text>
              </View>
              <View className={styles.quickStartCardArrow}>
                <Text className="iconfont icon-arrow-right" />
              </View>
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyStateText}>
                今天还没有任务，
              </Text>
              <Text 
                className={styles.emptyStateLink}
                onClick={navigateToTasks}
              >
                去添加一个吧
              </Text>
            </View>
          )}
        </View>

        {/* 今日任务 */}
        <View className={styles.homeTasks}>
          <View className={styles.homeSectionHeader}>
            <Text className={styles.homeSectionTitle}>今日任务</Text>
            <Text 
              className={styles.homeSectionAction}
              onClick={navigateToTasks}
            >
              查看全部
            </Text>
          </View>
          
          {todayTasks.length > 0 ? (
            <View className={styles.homeTasksList}>
              {todayTasks.slice(0, 3).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={handleTaskClick}
                />
              ))}
              
              {todayTasks.length > 3 && (
                <View 
                  className={styles.homeTasksMore}
                  onClick={navigateToTasks}
                >
                  <Text className={styles.homeTasksMoreText}>
                    还有 {todayTasks.length - 3} 个任务
                  </Text>
                  <Text className="iconfont icon-arrow-right" />
                </View>
              )}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyStateText}>
                今天还没有安排任务
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 番茄钟弹窗 */}
      {showTimer && (
        <View className={styles.timerModal}>
          <View className={styles.timerModalBackdrop} onClick={handleTimerCancel} />
          <View className={styles.timerModalContent}>
            <PomodoroTimer
              taskId={currentTask?.id}
              taskTitle={currentTask?.title}
              onComplete={handleTimerComplete}
              onCancel={handleTimerCancel}
            />
          </View>
        </View>
      )}
    </View>
  )
}

export default HomePage
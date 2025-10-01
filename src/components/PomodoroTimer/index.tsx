import React, { useEffect, useRef } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { formatDuration } from '../../utils/helpers'
import styles from './index.module.css'

interface PomodoroTimerProps {
  taskId?: string
  taskTitle?: string
  onComplete?: () => void
  onCancel?: () => void
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  taskId,
  taskTitle,
  onComplete,
  onCancel
}) => {
  const {
    timer,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tick,
    completeSession,
    setCurrentTask
  } = usePomodoroStore()

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 设置当前任务
  useEffect(() => {
    if (taskId) {
      setCurrentTask(taskId)
    }
  }, [taskId, setCurrentTask])

  // 计时器逻辑
  useEffect(() => {
    if (timer.isRunning && !timer.isPaused) {
      intervalRef.current = setInterval(() => {
        tick()
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timer.isRunning, timer.isPaused, tick])

  // 时间到的处理
  useEffect(() => {
    if (timer.remainingTime === 0 && timer.isRunning) {
      handleTimeUp()
    }
  }, [timer.remainingTime, timer.isRunning])

  const handleTimeUp = async () => {
    // 播放提醒音（如果启用）
    if (settings.soundEnabled) {
      try {
        // 在小程序中播放系统提示音
        await Taro.showToast({
          title: '时间到！',
          icon: 'success',
          duration: 2000
        })
      } catch (error) {
        console.log('播放提示音失败:', error)
      }
    }

    // 显示通知（如果启用）
    if (settings.notificationEnabled) {
      const message = timer.currentType === 'focus' 
        ? '专注时间结束，该休息一下了！' 
        : '休息时间结束，开始下一个专注时段！'
      
      Taro.showModal({
        title: '番茄钟提醒',
        content: message,
        showCancel: false,
        confirmText: '知道了'
      })
    }

    completeSession()
    
    if (onComplete) {
      onComplete()
    }
  }

  const handleStart = () => {
    if (timer.isPaused) {
      resumeTimer()
    } else {
      startTimer(taskId)
    }
  }

  const handlePause = () => {
    pauseTimer()
  }

  const handleStop = () => {
    stopTimer()
    if (onCancel) {
      onCancel()
    }
  }

  const getTimerTypeText = () => {
    switch (timer.currentType) {
      case 'focus':
        return '专注时间'
      case 'short-break':
        return '短休息'
      case 'long-break':
        return '长休息'
      default:
        return '番茄钟'
    }
  }

  const getTimerTypeIcon = () => {
    switch (timer.currentType) {
      case 'focus':
        return 'icon-focus'
      case 'short-break':
        return 'icon-coffee'
      case 'long-break':
        return 'icon-rest'
      default:
        return 'icon-timer'
    }
  }

  return (
    <View className={`${styles.pomodoroTimer} ${styles[`pomodoroTimer${timer.currentType.charAt(0).toUpperCase() + timer.currentType.slice(1).replace('-', '')}`] || ''}`}>
      <View className={styles.pomodoroTimerHeader}>
        <View className={styles.pomodoroTimerType}>
          <Text className={`${styles.pomodoroTimerTypeIcon} iconfont ${getTimerTypeIcon()}`} />
          <Text className={styles.pomodoroTimerTypeText}>
            {getTimerTypeText()}
          </Text>
        </View>
        
        {taskTitle && (
          <View className={styles.pomodoroTimerTask}>
            <Text className={styles.pomodoroTimerTaskTitle}>
              {taskTitle}
            </Text>
          </View>
        )}
      </View>

      <View className={styles.pomodoroTimerDisplay}>
        <Text className={styles.pomodoroTimerTime}>
          {formatDuration(timer.remainingTime)}
        </Text>
        
        <View className={styles.pomodoroTimerProgress}>
          <View className={styles.pomodoroTimerProgressBar}>
            <View 
              className={styles.pomodoroTimerProgressFill}
              style={{
                width: `${((timer.currentSession?.plannedDuration || 0) - timer.remainingTime) / (timer.currentSession?.plannedDuration || 1) * 100}%`
              }}
            />
          </View>
        </View>
      </View>

      <View className={styles.pomodoroTimerControls}>
        {!timer.isRunning || timer.isPaused ? (
          <Button 
            className={`${styles.pomodoroTimerBtn} ${styles.pomodoroTimerBtnStart}`}
            onClick={handleStart}
          >
            {timer.isPaused ? '继续' : '开始'}
          </Button>
        ) : (
          <Button 
            className={`${styles.pomodoroTimerBtn} ${styles.pomodoroTimerBtnPause}`}
            onClick={handlePause}
          >
            暂停
          </Button>
        )}
        
        <Button 
          className={`${styles.pomodoroTimerBtn} ${styles.pomodoroTimerBtnStop}`}
          onClick={handleStop}
        >
          停止
        </Button>
      </View>

      <View className={styles.pomodoroTimerStats}>
        <View className={styles.pomodoroTimerStat}>
          <Text className={styles.pomodoroTimerStatValue}>
            {timer.completedPomodoros}
          </Text>
          <Text className={styles.pomodoroTimerStatLabel}>
            今日完成
          </Text>
        </View>
        
        <View className={styles.pomodoroTimerStat}>
          <Text className={styles.pomodoroTimerStatValue}>
            {timer.currentCycle}
          </Text>
          <Text className={styles.pomodoroTimerStatLabel}>
            当前周期
          </Text>
        </View>
      </View>
    </View>
  )
}

export default PomodoroTimer
/**
 * 番茄钟计时器Hook
 * 封装番茄钟计时器的状态管理和操作逻辑
 */

import { useCallback, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { usePomodoroStore } from '../store/pomodoroStore'
import { PomodoroPhase, PomodoroSession } from '../types/pomodoro'

export interface UseTimerReturn {
  // 计时器状态
  isRunning: boolean
  isPaused: boolean
  timeLeft: number
  currentPhase: PomodoroPhase
  sessionCount: number
  currentTaskId: string | null
  
  // 计时器操作
  startTimer: (taskId?: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  skipPhase: () => void
  
  // 设置操作
  updateSettings: (settings: Partial<any>) => void
  
  // 会话信息
  currentSession: PomodoroSession | null
  todaySessions: PomodoroSession[]
  
  // 统计信息
  todayPomodoros: number
  todayFocusTime: number
  todayBreaks: number
}

/**
 * 番茄钟计时器Hook
 */
export const useTimer = (): UseTimerReturn => {
  const {
    timer,
    settings,
    sessions,
    currentTaskId,
    startTimer: storeStartTimer,
    pauseTimer: storePauseTimer,
    resumeTimer: storeResumeTimer,
    stopTimer: storeStopTimer,
    skipPhase: storeSkipPhase,
    updateSettings: storeUpdateSettings,
    completeSession,
    addInterruption
  } = usePomodoroStore()

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTickRef = useRef<number>(Date.now())

  // 计时器tick处理
  const tick = useCallback(() => {
    const now = Date.now()
    const elapsed = Math.floor((now - lastTickRef.current) / 1000)
    lastTickRef.current = now

    if (timer.timeLeft <= elapsed) {
      // 时间到，处理阶段完成
      handlePhaseComplete()
    } else {
      // 更新剩余时间
      usePomodoroStore.setState(state => ({
        timer: {
          ...state.timer,
          timeLeft: state.timer.timeLeft - elapsed
        }
      }))
    }
  }, [timer.timeLeft])

  // 处理阶段完成
  const handlePhaseComplete = useCallback(() => {
    const { currentPhase, sessionCount } = timer
    
    // 播放提示音
    if (settings.soundEnabled) {
      playNotificationSound()
    }
    
    // 显示通知
    showPhaseCompleteNotification(currentPhase)
    
    // 完成当前会话
    if (timer.currentSession) {
      completeSession(timer.currentSession.id)
    }
    
    // 确定下一个阶段
    let nextPhase: PomodoroPhase
    let nextDuration: number
    
    if (currentPhase === 'focus') {
      // 专注阶段结束，进入休息
      if ((sessionCount + 1) % settings.longBreakInterval === 0) {
        nextPhase = 'longBreak'
        nextDuration = settings.longBreakDuration
      } else {
        nextPhase = 'shortBreak'
        nextDuration = settings.shortBreakDuration
      }
    } else {
      // 休息阶段结束，进入专注
      nextPhase = 'focus'
      nextDuration = settings.focusDuration
    }
    
    // 更新计时器状态
    usePomodoroStore.setState(state => ({
      timer: {
        ...state.timer,
        currentPhase: nextPhase,
        timeLeft: nextDuration * 60,
        sessionCount: currentPhase === 'focus' ? state.timer.sessionCount + 1 : state.timer.sessionCount,
        isRunning: settings.autoStartBreaks || nextPhase === 'focus'
      }
    }))
    
    // 如果不自动开始，暂停计时器
    if (!settings.autoStartBreaks && nextPhase !== 'focus') {
      pauseTimer()
    }
  }, [timer, settings])

  // 播放提示音
  const playNotificationSound = useCallback(() => {
    try {
      // 在小程序中播放提示音
      Taro.playBackgroundAudio({
        dataUrl: '/assets/sounds/notification.mp3'
      }).catch(() => {
        // 如果播放失败，使用系统提示音
        Taro.showToast({
          title: '时间到！',
          icon: 'success',
          duration: 2000
        })
      })
    } catch (error) {
      console.warn('播放提示音失败:', error)
    }
  }, [])

  // 显示阶段完成通知
  const showPhaseCompleteNotification = useCallback((phase: PomodoroPhase) => {
    const messages = {
      focus: '专注时间结束，休息一下吧！',
      shortBreak: '短休息结束，继续专注！',
      longBreak: '长休息结束，开始新的专注周期！'
    }
    
    Taro.showToast({
      title: messages[phase],
      icon: 'success',
      duration: 3000
    })
    
    // 如果支持，发送系统通知
    if (Taro.getEnv() === 'WEB') {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('番茄时钟', {
            body: messages[phase],
            icon: '/assets/icons/tomato.png'
          })
        }
      } catch (error) {
        console.warn('发送系统通知失败:', error)
      }
    }
  }, [])

  // 启动计时器
  const startTimer = useCallback((taskId?: string) => {
    storeStartTimer(taskId)
    lastTickRef.current = Date.now()
  }, [storeStartTimer])

  // 暂停计时器
  const pauseTimer = useCallback(() => {
    storePauseTimer()
  }, [storePauseTimer])

  // 恢复计时器
  const resumeTimer = useCallback(() => {
    storeResumeTimer()
    lastTickRef.current = Date.now()
  }, [storeResumeTimer])

  // 停止计时器
  const stopTimer = useCallback(() => {
    storeStopTimer()
  }, [storeStopTimer])

  // 跳过当前阶段
  const skipPhase = useCallback(() => {
    storeSkipPhase()
    handlePhaseComplete()
  }, [storeSkipPhase, handlePhaseComplete])

  // 更新设置
  const updateSettings = useCallback((newSettings: Partial<any>) => {
    storeUpdateSettings(newSettings)
  }, [storeUpdateSettings])

  // 添加中断
  const handleInterruption = useCallback((reason?: string) => {
    if (timer.currentSession) {
      addInterruption(timer.currentSession.id, reason)
    }
  }, [timer.currentSession, addInterruption])

  // 设置定时器
  useEffect(() => {
    if (timer.isRunning && !timer.isPaused) {
      intervalRef.current = setInterval(tick, 1000)
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

  // 计算今日统计
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(session => 
    session.startTime.startsWith(today) && session.completed
  )
  
  const todayPomodoros = todaySessions.filter(s => s.type === 'focus').length
  const todayFocusTime = todaySessions
    .filter(s => s.type === 'focus')
    .reduce((sum, s) => sum + (s.duration || 0), 0)
  const todayBreaks = todaySessions.filter(s => s.type !== 'focus').length

  // 处理应用进入后台和前台
  useEffect(() => {
    const handleAppShow = () => {
      // 应用从后台回到前台时，同步计时器状态
      if (timer.isRunning && timer.currentSession) {
        const now = Date.now()
        const sessionStart = new Date(timer.currentSession.startTime).getTime()
        const elapsed = Math.floor((now - sessionStart) / 1000)
        const expectedDuration = timer.currentSession.expectedDuration * 60
        
        if (elapsed >= expectedDuration) {
          // 时间已到，处理完成
          handlePhaseComplete()
        } else {
          // 更新剩余时间
          const timeLeft = expectedDuration - elapsed
          usePomodoroStore.setState(state => ({
            timer: {
              ...state.timer,
              timeLeft: Math.max(0, timeLeft)
            }
          }))
        }
      }
    }

    const handleAppHide = () => {
      // 应用进入后台时的处理
      lastTickRef.current = Date.now()
    }

    // 监听应用生命周期
    Taro.onAppShow(handleAppShow)
    Taro.onAppHide(handleAppHide)

    return () => {
      // 清理监听器（Taro可能不支持off方法，这里仅作示意）
      try {
        Taro.offAppShow?.(handleAppShow)
        Taro.offAppHide?.(handleAppHide)
      } catch (error) {
        // 忽略清理错误
      }
    }
  }, [timer, handlePhaseComplete])

  return {
    // 计时器状态
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    timeLeft: timer.timeLeft,
    currentPhase: timer.currentPhase,
    sessionCount: timer.sessionCount,
    currentTaskId,
    
    // 计时器操作
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipPhase,
    
    // 设置操作
    updateSettings,
    
    // 会话信息
    currentSession: timer.currentSession,
    todaySessions,
    
    // 统计信息
    todayPomodoros,
    todayFocusTime,
    todayBreaks
  }
}

export default useTimer

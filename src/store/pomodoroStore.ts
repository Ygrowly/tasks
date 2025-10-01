import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PomodoroSession, PomodoroSettings, PomodoroTimer, PomodoroStats } from '../types/pomodoro'
import { generateId } from '../utils/helpers'

interface PomodoroState {
  timer: PomodoroTimer
  settings: PomodoroSettings
  sessions: PomodoroSession[]
  currentTaskId: string | null
  loading: boolean
  error: string | null
}

interface PomodoroActions {
  // 计时器控制
  startTimer: (taskId?: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  tick: () => void
  
  // 会话管理
  completeSession: () => void
  cancelSession: () => void
  addInterruption: () => void
  
  // 设置管理
  updateSettings: (settings: Partial<PomodoroSettings>) => void
  resetSettings: () => void
  
  // 统计数据
  getStats: () => PomodoroStats
  getTodayStats: () => PomodoroStats
  getSessionsByDate: (date: string) => PomodoroSession[]
  
  // 数据管理
  clearAllSessions: () => void
  setCurrentTask: (taskId: string | null) => void
}

type PomodoroStore = PomodoroState & PomodoroActions

const defaultSettings: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationEnabled: true
}

const initialTimer: PomodoroTimer = {
  remainingTime: 25 * 60, // 25分钟转换为秒
  isRunning: false,
  isPaused: false,
  currentType: 'focus',
  completedPomodoros: 0,
  currentCycle: 1
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      timer: initialTimer,
      settings: defaultSettings,
      sessions: [],
      currentTaskId: null,
      loading: false,
      error: null,

      // 开始计时器
      startTimer: (taskId?: string) => {
        const { timer, settings, currentTaskId } = get()
        
        if (timer.isRunning) return
        
        const newSession: PomodoroSession = {
          id: generateId(),
          taskId: taskId || currentTaskId || '',
          startTime: new Date().toISOString(),
          duration: 0,
          plannedDuration: timer.currentType === 'focus' 
            ? settings.focusDuration * 60
            : timer.currentType === 'short-break'
            ? settings.shortBreakDuration * 60
            : settings.longBreakDuration * 60,
          type: timer.currentType,
          status: 'running',
          interruptions: 0
        }
        
        set((state) => ({
          timer: {
            ...state.timer,
            isRunning: true,
            isPaused: false,
            currentSession: newSession
          },
          sessions: [...state.sessions, newSession],
          currentTaskId: taskId || state.currentTaskId,
          error: null
        }))
      },

      // 暂停计时器
      pauseTimer: () => {
        set((state) => ({
          timer: {
            ...state.timer,
            isRunning: false,
            isPaused: true
          }
        }))
      },

      // 恢复计时器
      resumeTimer: () => {
        const { timer } = get()
        if (timer.isPaused) {
          set((state) => ({
            timer: {
              ...state.timer,
              isRunning: true,
              isPaused: false
            }
          }))
        }
      },

      // 停止计时器
      stopTimer: () => {
        const { timer, sessions } = get()
        
        if (timer.currentSession) {
          const updatedSessions = sessions.map((session) =>
            session.id === timer.currentSession?.id
              ? {
                  ...session,
                  endTime: new Date().toISOString(),
                  status: 'cancelled' as const,
                  duration: timer.currentSession.plannedDuration - timer.remainingTime
                }
              : session
          )
          
          set((state) => ({
            timer: {
              ...initialTimer,
              currentType: state.timer.currentType,
              completedPomodoros: state.timer.completedPomodoros,
              currentCycle: state.timer.currentCycle
            },
            sessions: updatedSessions
          }))
        }
      },

      // 重置计时器
      resetTimer: () => {
        const { settings } = get()
        set((state) => ({
          timer: {
            ...initialTimer,
            remainingTime: settings.focusDuration * 60
          }
        }))
      },

      // 计时器滴答
      tick: () => {
        const { timer } = get()
        
        if (!timer.isRunning || timer.isPaused) return
        
        if (timer.remainingTime > 0) {
          set((state) => ({
            timer: {
              ...state.timer,
              remainingTime: state.timer.remainingTime - 1
            }
          }))
        } else {
          // 时间到，完成当前会话
          get().completeSession()
        }
      },

      // 完成会话
      completeSession: () => {
        const { timer, sessions, settings } = get()
        
        if (!timer.currentSession) return
        
        const updatedSessions = sessions.map((session) =>
          session.id === timer.currentSession?.id
            ? {
                ...session,
                endTime: new Date().toISOString(),
                status: 'completed' as const,
                duration: session.plannedDuration
              }
            : session
        )
        
        let nextType: PomodoroTimer['currentType'] = 'focus'
        let nextDuration = settings.focusDuration * 60
        let completedPomodoros = timer.completedPomodoros
        let currentCycle = timer.currentCycle
        
        if (timer.currentType === 'focus') {
          completedPomodoros += 1
          
          // 判断是长休息还是短休息
          if (completedPomodoros % settings.longBreakInterval === 0) {
            nextType = 'long-break'
            nextDuration = settings.longBreakDuration * 60
          } else {
            nextType = 'short-break'
            nextDuration = settings.shortBreakDuration * 60
          }
        } else {
          // 休息结束，开始下一个专注时段
          nextType = 'focus'
          nextDuration = settings.focusDuration * 60
          currentCycle += 1
        }
        
        set({
          timer: {
            currentSession: undefined,
            remainingTime: nextDuration,
            isRunning: false,
            isPaused: false,
            currentType: nextType,
            completedPomodoros,
            currentCycle
          },
          sessions: updatedSessions
        })
      },

      // 取消会话
      cancelSession: () => {
        get().stopTimer()
      },

      // 添加中断
      addInterruption: () => {
        const { timer, sessions } = get()
        
        if (timer.currentSession) {
          const updatedSessions = sessions.map((session) =>
            session.id === timer.currentSession?.id
              ? { ...session, interruptions: session.interruptions + 1 }
              : session
          )
          
          set({ sessions: updatedSessions })
        }
      },

      // 更新设置
      updateSettings: (newSettings: Partial<PomodoroSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      // 重置设置
      resetSettings: () => {
        set({ settings: defaultSettings })
      },

      // 获取统计数据
      getStats: () => {
        const { sessions } = get()
        const completedSessions = sessions.filter((s) => s.status === 'completed')
        const focusSessions = completedSessions.filter((s) => s.type === 'focus')
        
        const totalFocusTime = focusSessions.reduce((sum, session) => sum + session.duration, 0) / 60
        const averageSessionDuration = completedSessions.length > 0 
          ? completedSessions.reduce((sum, session) => sum + session.duration, 0) / completedSessions.length / 60
          : 0
        
        return {
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          totalFocusTime,
          averageSessionDuration,
          longestStreak: 0, // TODO: 计算最长连续天数
          currentStreak: 0, // TODO: 计算当前连续天数
          dailyGoal: 8, // 默认每日目标
          weeklyStats: [] // TODO: 计算周统计
        }
      },

      // 获取今日统计
      getTodayStats: () => {
        const { sessions } = get()
        const today = new Date().toISOString().split('T')[0]
        const todaySessions = sessions.filter((session) => 
          session.startTime.startsWith(today)
        )
        
        const completedSessions = todaySessions.filter((s) => s.status === 'completed')
        const focusSessions = completedSessions.filter((s) => s.type === 'focus')
        
        const totalFocusTime = focusSessions.reduce((sum, session) => sum + session.duration, 0) / 60
        
        return {
          totalSessions: todaySessions.length,
          completedSessions: completedSessions.length,
          totalFocusTime,
          averageSessionDuration: 0,
          longestStreak: 0,
          currentStreak: 0,
          dailyGoal: 8,
          weeklyStats: []
        }
      },

      // 按日期获取会话
      getSessionsByDate: (date: string) => {
        const { sessions } = get()
        return sessions.filter((session) => session.startTime.startsWith(date))
      },

      // 清除所有会话
      clearAllSessions: () => {
        set({ sessions: [] })
      },

      // 设置当前任务
      setCurrentTask: (taskId: string | null) => {
        set({ currentTaskId: taskId })
      }
    }),
    {
      name: 'pomodoro-store',
      partialize: (state) => ({ 
        sessions: state.sessions, 
        settings: state.settings,
        timer: {
          completedPomodoros: state.timer.completedPomodoros,
          currentCycle: state.timer.currentCycle
        }
      })
    }
  )
)
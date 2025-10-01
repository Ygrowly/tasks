export interface PomodoroSession {
  id: string
  taskId: string
  startTime: string
  endTime?: string
  duration: number // 实际时长（秒）
  plannedDuration: number // 计划时长（秒）
  type: PomodoroType
  status: PomodoroStatus
  interruptions: number
  notes?: string
}

export type PomodoroType = 'focus' | 'short-break' | 'long-break'

export type PomodoroStatus = 'running' | 'paused' | 'completed' | 'cancelled'

export interface PomodoroSettings {
  focusDuration: number // 专注时长（分钟）
  shortBreakDuration: number // 短休息时长（分钟）
  longBreakDuration: number // 长休息时长（分钟）
  longBreakInterval: number // 长休息间隔（几个番茄后）
  autoStartBreaks: boolean // 自动开始休息
  autoStartPomodoros: boolean // 自动开始番茄钟
  soundEnabled: boolean // 声音提醒
  notificationEnabled: boolean // 通知提醒
}

export interface PomodoroTimer {
  currentSession?: PomodoroSession
  remainingTime: number // 剩余时间（秒）
  isRunning: boolean
  isPaused: boolean
  currentType: PomodoroType
  completedPomodoros: number // 今日完成的番茄数
  currentCycle: number // 当前周期数
}

export interface PomodoroStats {
  totalSessions: number
  completedSessions: number
  totalFocusTime: number // 总专注时间（分钟）
  averageSessionDuration: number
  longestStreak: number // 最长连续专注天数
  currentStreak: number // 当前连续专注天数
  dailyGoal: number // 每日目标番茄数
  weeklyStats: {
    date: string
    completedPomodoros: number
    focusTime: number
  }[]
}
/**
 * 导航控制Hook
 * 封装页面导航和路由控制逻辑
 */

import { useCallback, useEffect, useState } from 'react'
import Taro, { useRouter, useDidShow, useDidHide } from '@tarojs/taro'

export interface NavigationItem {
  path: string
  title: string
  icon?: string
  badge?: number
}

export interface UseNavigationOptions {
  trackHistory?: boolean
  maxHistoryLength?: number
}

export interface UseNavigationReturn {
  // 当前页面信息
  currentPath: string
  currentParams: Record<string, any>
  
  // 导航操作
  navigateTo: (path: string, params?: Record<string, any>) => Promise<void>
  redirectTo: (path: string, params?: Record<string, any>) => Promise<void>
  switchTab: (path: string) => Promise<void>
  navigateBack: (delta?: number) => Promise<void>
  reLaunch: (path: string, params?: Record<string, any>) => Promise<void>
  
  // 页面历史
  history: string[]
  canGoBack: boolean
  
  // 标签页管理
  tabBarList: NavigationItem[]
  currentTabIndex: number
  
  // 页面状态
  isVisible: boolean
  isActive: boolean
  
  // 工具方法
  buildUrl: (path: string, params?: Record<string, any>) => string
  parseUrl: (url: string) => { path: string; params: Record<string, any> }
  isTabBarPage: (path: string) => boolean
  
  // 页面生命周期回调
  onPageShow: (callback: () => void) => void
  onPageHide: (callback: () => void) => void
}

/**
 * 导航控制Hook
 */
export const useNavigation = (options: UseNavigationOptions = {}): UseNavigationReturn => {
  const router = useRouter()
  const [history, setHistory] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [showCallbacks, setShowCallbacks] = useState<(() => void)[]>([])
  const [hideCallbacks, setHideCallbacks] = useState<(() => void)[]>([])

  const maxHistoryLength = options.maxHistoryLength || 10

  // 标签页配置
  const tabBarList: NavigationItem[] = [
    {
      path: '/pages/home/index',
      title: '今日聚焦',
      icon: 'home'
    },
    {
      path: '/pages/tasks/index',
      title: '任务管理',
      icon: 'task'
    },
    {
      path: '/pages/quantify/index',
      title: '任务量化',
      icon: 'chart'
    },
    {
      path: '/pages/stats/index',
      title: '数据统计',
      icon: 'stats'
    }
  ]

  // 当前路径和参数
  const currentPath = router.path
  const currentParams = router.params || {}

  // 当前标签页索引
  const currentTabIndex = tabBarList.findIndex(tab => tab.path === currentPath)

  // 是否可以返回
  const canGoBack = history.length > 1

  // 构建URL
  const buildUrl = useCallback((path: string, params?: Record<string, any>): string => {
    if (!params || Object.keys(params).length === 0) {
      return path
    }
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')
    
    return `${path}?${queryString}`
  }, [])

  // 解析URL
  const parseUrl = useCallback((url: string): { path: string; params: Record<string, any> } => {
    const [path, queryString] = url.split('?')
    const params: Record<string, any> = {}
    
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=')
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value)
        }
      })
    }
    
    return { path, params }
  }, [])

  // 判断是否为标签页
  const isTabBarPage = useCallback((path: string): boolean => {
    return tabBarList.some(tab => tab.path === path)
  }, [tabBarList])

  // 更新历史记录
  const updateHistory = useCallback((path: string) => {
    if (options.trackHistory !== false) {
      setHistory(prev => {
        const newHistory = [path, ...prev.filter(p => p !== path)]
        return newHistory.slice(0, maxHistoryLength)
      })
    }
  }, [options.trackHistory, maxHistoryLength])

  // 导航到指定页面
  const navigateTo = useCallback(async (path: string, params?: Record<string, any>) => {
    try {
      const url = buildUrl(path, params)
      await Taro.navigateTo({ url })
      updateHistory(path)
    } catch (error) {
      console.error('导航失败:', error)
      Taro.showToast({
        title: '页面跳转失败',
        icon: 'error'
      })
    }
  }, [buildUrl, updateHistory])

  // 重定向到指定页面
  const redirectTo = useCallback(async (path: string, params?: Record<string, any>) => {
    try {
      const url = buildUrl(path, params)
      await Taro.redirectTo({ url })
      updateHistory(path)
    } catch (error) {
      console.error('重定向失败:', error)
      Taro.showToast({
        title: '页面跳转失败',
        icon: 'error'
      })
    }
  }, [buildUrl, updateHistory])

  // 切换标签页
  const switchTab = useCallback(async (path: string) => {
    try {
      if (!isTabBarPage(path)) {
        throw new Error('不是标签页路径')
      }
      
      await Taro.switchTab({ url: path })
      updateHistory(path)
    } catch (error) {
      console.error('切换标签页失败:', error)
      Taro.showToast({
        title: '页面切换失败',
        icon: 'error'
      })
    }
  }, [isTabBarPage, updateHistory])

  // 返回上一页
  const navigateBack = useCallback(async (delta: number = 1) => {
    try {
      await Taro.navigateBack({ delta })
      
      // 更新历史记录
      if (options.trackHistory !== false) {
        setHistory(prev => prev.slice(delta))
      }
    } catch (error) {
      console.error('返回失败:', error)
      Taro.showToast({
        title: '返回失败',
        icon: 'error'
      })
    }
  }, [options.trackHistory])

  // 重新启动应用
  const reLaunch = useCallback(async (path: string, params?: Record<string, any>) => {
    try {
      const url = buildUrl(path, params)
      await Taro.reLaunch({ url })
      
      // 清空历史记录
      setHistory([path])
    } catch (error) {
      console.error('重启应用失败:', error)
      Taro.showToast({
        title: '页面跳转失败',
        icon: 'error'
      })
    }
  }, [buildUrl])

  // 页面显示回调
  const onPageShow = useCallback((callback: () => void) => {
    setShowCallbacks(prev => [...prev, callback])
  }, [])

  // 页面隐藏回调
  const onPageHide = useCallback((callback: () => void) => {
    setHideCallbacks(prev => [...prev, callback])
  }, [])

  // 页面显示时的处理
  useDidShow(() => {
    setIsVisible(true)
    setIsActive(true)
    updateHistory(currentPath)
    
    // 执行显示回调
    showCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('页面显示回调执行失败:', error)
      }
    })
  })

  // 页面隐藏时的处理
  useDidHide(() => {
    setIsVisible(false)
    setIsActive(false)
    
    // 执行隐藏回调
    hideCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('页面隐藏回调执行失败:', error)
      }
    })
  })

  // 监听应用前后台切换
  useEffect(() => {
    const handleAppShow = () => {
      setIsActive(true)
    }

    const handleAppHide = () => {
      setIsActive(false)
    }

    // 监听应用生命周期
    Taro.onAppShow(handleAppShow)
    Taro.onAppHide(handleAppHide)

    return () => {
      // 清理监听器
      try {
        Taro.offAppShow?.(handleAppShow)
        Taro.offAppHide?.(handleAppHide)
      } catch (error) {
        // 忽略清理错误
      }
    }
  }, [])

  // 预加载页面
  const preloadPage = useCallback(async (path: string) => {
    try {
      // 在支持的平台上预加载页面
      if (Taro.preloadPage) {
        await Taro.preloadPage({ url: path })
      }
    } catch (error) {
      console.warn('预加载页面失败:', error)
    }
  }, [])

  // 获取页面栈信息
  const getPageStack = useCallback(() => {
    try {
      return Taro.getCurrentPages()
    } catch (error) {
      console.error('获取页面栈失败:', error)
      return []
    }
  }, [])

  return {
    // 当前页面信息
    currentPath,
    currentParams,
    
    // 导航操作
    navigateTo,
    redirectTo,
    switchTab,
    navigateBack,
    reLaunch,
    
    // 页面历史
    history,
    canGoBack,
    
    // 标签页管理
    tabBarList,
    currentTabIndex,
    
    // 页面状态
    isVisible,
    isActive,
    
    // 工具方法
    buildUrl,
    parseUrl,
    isTabBarPage,
    
    // 页面生命周期回调
    onPageShow,
    onPageHide
  }
}

export default useNavigation

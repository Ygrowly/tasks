/**
 * 路由守卫
 * 处理路由权限控制和页面访问限制
 */

import Taro from '@tarojs/taro'

// 路由守卫类型定义
export interface RouteGuard {
  name: string
  guard: (to: RouteInfo, from: RouteInfo) => Promise<boolean | string>
}

export interface RouteInfo {
  path: string
  params: Record<string, any>
  query: Record<string, any>
}

// 全局路由守卫集合
const globalGuards: RouteGuard[] = []

/**
 * 添加全局路由守卫
 */
export function addGlobalGuard(guard: RouteGuard): void {
  globalGuards.push(guard)
}

/**
 * 移除全局路由守卫
 */
export function removeGlobalGuard(name: string): void {
  const index = globalGuards.findIndex(guard => guard.name === name)
  if (index > -1) {
    globalGuards.splice(index, 1)
  }
}

/**
 * 执行路由守卫检查
 */
export async function executeGuards(to: RouteInfo, from: RouteInfo): Promise<boolean | string> {
  for (const guard of globalGuards) {
    try {
      const result = await guard.guard(to, from)
      if (result !== true) {
        return result
      }
    } catch (error) {
      console.error(`路由守卫 ${guard.name} 执行失败:`, error)
      return false
    }
  }
  return true
}

/**
 * 解析路由信息
 */
export function parseRouteInfo(url: string): RouteInfo {
  const [path, queryString] = url.split('?')
  const params: Record<string, any> = {}
  const query: Record<string, any> = {}
  
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=')
      if (key && value) {
        const decodedKey = decodeURIComponent(key)
        const decodedValue = decodeURIComponent(value)
        query[decodedKey] = decodedValue
        params[decodedKey] = decodedValue
      }
    })
  }
  
  return { path, params, query }
}

/**
 * 认证守卫 - 检查用户登录状态
 */
export const authGuard: RouteGuard = {
  name: 'auth',
  guard: async (to: RouteInfo, from: RouteInfo) => {
    // 不需要认证的页面
    const publicPages = [
      '/pages/index/index',
      '/pages/home/index',
      '/pages/login/index',
      '/pages/register/index'
    ]
    
    if (publicPages.includes(to.path)) {
      return true
    }
    
    // 检查用户登录状态
    const token = Taro.getStorageSync('auth_token')
    const userInfo = Taro.getStorageSync('user_info')
    
    if (!token || !userInfo) {
      // 未登录，跳转到登录页
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return '/pages/login/index'
    }
    
    // 验证token有效性
    try {
      const tokenExpiry = Taro.getStorageSync('token_expiry')
      if (tokenExpiry && Date.now() > tokenExpiry) {
        // token已过期
        Taro.removeStorageSync('auth_token')
        Taro.removeStorageSync('user_info')
        Taro.removeStorageSync('token_expiry')
        
        Taro.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none'
        })
        return '/pages/login/index'
      }
    } catch (error) {
      console.error('验证token失败:', error)
    }
    
    return true
  }
}

/**
 * 权限守卫 - 检查页面访问权限
 */
export const permissionGuard: RouteGuard = {
  name: 'permission',
  guard: async (to: RouteInfo, from: RouteInfo) => {
    // 需要特殊权限的页面
    const restrictedPages: Record<string, string[]> = {
      '/pages/admin/index': ['admin'],
      '/pages/settings/index': ['user', 'admin'],
      '/pages/export/index': ['premium', 'admin']
    }
    
    const requiredPermissions = restrictedPages[to.path]
    if (!requiredPermissions) {
      return true
    }
    
    // 获取用户权限
    const userInfo = Taro.getStorageSync('user_info')
    const userPermissions = userInfo?.permissions || []
    
    // 检查是否有所需权限
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    )
    
    if (!hasPermission) {
      Taro.showToast({
        title: '权限不足',
        icon: 'error'
      })
      return false
    }
    
    return true
  }
}

/**
 * 数据预加载守卫 - 在进入页面前预加载必要数据
 */
export const dataPreloadGuard: RouteGuard = {
  name: 'dataPreload',
  guard: async (to: RouteInfo, from: RouteInfo) => {
    // 需要预加载数据的页面
    const preloadPages = [
      '/pages/stats/index',
      '/pages/quantify/index'
    ]
    
    if (!preloadPages.includes(to.path)) {
      return true
    }
    
    try {
      // 显示加载提示
      Taro.showLoading({ title: '加载中...' })
      
      // 根据页面预加载不同的数据
      switch (to.path) {
        case '/pages/stats/index':
          // 预加载统计数据
          await preloadStatsData()
          break
        case '/pages/quantify/index':
          // 预加载量化数据
          await preloadQuantifyData()
          break
      }
      
      Taro.hideLoading()
      return true
    } catch (error) {
      Taro.hideLoading()
      console.error('数据预加载失败:', error)
      
      Taro.showToast({
        title: '数据加载失败',
        icon: 'error'
      })
      
      // 允许继续访问，但数据可能不完整
      return true
    }
  }
}

/**
 * 页面访问频率限制守卫
 */
export const rateLimitGuard: RouteGuard = {
  name: 'rateLimit',
  guard: async (to: RouteInfo, from: RouteInfo) => {
    const rateLimitPages = [
      '/pages/export/index',
      '/pages/backup/index'
    ]
    
    if (!rateLimitPages.includes(to.path)) {
      return true
    }
    
    const key = `rate_limit_${to.path}`
    const lastAccess = Taro.getStorageSync(key)
    const now = Date.now()
    const cooldown = 60 * 1000 // 1分钟冷却时间
    
    if (lastAccess && (now - lastAccess) < cooldown) {
      const remainingTime = Math.ceil((cooldown - (now - lastAccess)) / 1000)
      Taro.showToast({
        title: `请等待 ${remainingTime} 秒后再试`,
        icon: 'none'
      })
      return false
    }
    
    // 记录访问时间
    Taro.setStorageSync(key, now)
    return true
  }
}

/**
 * 网络状态检查守卫
 */
export const networkGuard: RouteGuard = {
  name: 'network',
  guard: async (to: RouteInfo, from: RouteInfo) => {
    // 需要网络连接的页面
    const networkRequiredPages = [
      '/pages/sync/index',
      '/pages/backup/index',
      '/pages/export/index'
    ]
    
    if (!networkRequiredPages.includes(to.path)) {
      return true
    }
    
    try {
      const networkInfo = await Taro.getNetworkType()
      
      if (networkInfo.networkType === 'none') {
        Taro.showToast({
          title: '网络连接不可用',
          icon: 'error'
        })
        return false
      }
      
      return true
    } catch (error) {
      console.error('网络状态检查失败:', error)
      return true // 检查失败时允许访问
    }
  }
}

// 预加载统计数据
async function preloadStatsData(): Promise<void> {
  // 这里可以调用统计服务预加载数据
  // 实际实现时应该调用相应的服务方法
  await new Promise(resolve => setTimeout(resolve, 500)) // 模拟异步操作
}

// 预加载量化数据
async function preloadQuantifyData(): Promise<void> {
  // 这里可以调用量化服务预加载数据
  await new Promise(resolve => setTimeout(resolve, 500)) // 模拟异步操作
}

/**
 * 初始化默认路由守卫
 */
export function initializeDefaultGuards(): void {
  // 根据应用需求添加默认守卫
  // addGlobalGuard(authGuard)
  // addGlobalGuard(permissionGuard)
  addGlobalGuard(dataPreloadGuard)
  addGlobalGuard(rateLimitGuard)
  addGlobalGuard(networkGuard)
}

/**
 * 路由导航拦截器
 * 在实际的路由跳转前执行守卫检查
 */
export async function interceptNavigation(
  navigateFunction: (url: string) => Promise<any>,
  url: string,
  from?: string
): Promise<boolean> {
  const to = parseRouteInfo(url)
  const fromInfo = from ? parseRouteInfo(from) : { path: '', params: {}, query: {} }
  
  const guardResult = await executeGuards(to, fromInfo)
  
  if (guardResult === true) {
    // 守卫通过，执行导航
    try {
      await navigateFunction(url)
      return true
    } catch (error) {
      console.error('导航执行失败:', error)
      return false
    }
  } else if (typeof guardResult === 'string') {
    // 守卫返回重定向路径
    try {
      await navigateFunction(guardResult)
      return true
    } catch (error) {
      console.error('重定向失败:', error)
      return false
    }
  } else {
    // 守卫拒绝访问
    return false
  }
}

// 导出默认配置
export default {
  addGlobalGuard,
  removeGlobalGuard,
  executeGuards,
  parseRouteInfo,
  interceptNavigation,
  initializeDefaultGuards,
  // 预定义守卫
  guards: {
    auth: authGuard,
    permission: permissionGuard,
    dataPreload: dataPreloadGuard,
    rateLimit: rateLimitGuard,
    network: networkGuard
  }
}

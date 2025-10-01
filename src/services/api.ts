/**
 * API 基础配置和拦截器
 * 提供统一的HTTP请求配置和错误处理
 */

import Taro from '@tarojs/taro'

// API 基础配置
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.tomato-task.com' 
    : 'http://localhost:3000',
  timeout: 10000,
  header: {
    'Content-Type': 'application/json'
  }
}

// 请求拦截器
const requestInterceptor = (config: any) => {
  // 添加认证token（如果需要）
  const token = Taro.getStorageSync('auth_token')
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  // 添加请求时间戳
  config.header['X-Request-Time'] = Date.now().toString()
  
  console.log('API请求:', config)
  return config
}

// 响应拦截器
const responseInterceptor = (response: any) => {
  console.log('API响应:', response)
  
  // 统一处理响应状态
  if (response.statusCode === 200) {
    return response.data
  }
  
  // 处理错误状态码
  switch (response.statusCode) {
    case 401:
      // 未授权，清除token并跳转登录
      Taro.removeStorageSync('auth_token')
      Taro.showToast({
        title: '请重新登录',
        icon: 'none'
      })
      break
    case 403:
      Taro.showToast({
        title: '权限不足',
        icon: 'none'
      })
      break
    case 404:
      Taro.showToast({
        title: '请求的资源不存在',
        icon: 'none'
      })
      break
    case 500:
      Taro.showToast({
        title: '服务器错误',
        icon: 'none'
      })
      break
    default:
      Taro.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
  }
  
  return Promise.reject(response)
}

// 错误处理拦截器
const errorInterceptor = (error: any) => {
  console.error('API请求错误:', error)
  
  Taro.showToast({
    title: '网络连接失败',
    icon: 'none'
  })
  
  return Promise.reject(error)
}

// 设置拦截器
Taro.addInterceptor(Taro.interceptors.logInterceptor)
Taro.addInterceptor({
  invoke: requestInterceptor,
  success: responseInterceptor,
  fail: errorInterceptor
})

/**
 * 通用HTTP请求方法
 */
export class ApiClient {
  /**
   * GET 请求
   */
  static async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return Taro.request({
      url: `${API_CONFIG.baseURL}${url}`,
      method: 'GET',
      data: params,
      timeout: API_CONFIG.timeout,
      header: API_CONFIG.header
    })
  }

  /**
   * POST 请求
   */
  static async post<T = any>(url: string, data?: Record<string, any>): Promise<T> {
    return Taro.request({
      url: `${API_CONFIG.baseURL}${url}`,
      method: 'POST',
      data,
      timeout: API_CONFIG.timeout,
      header: API_CONFIG.header
    })
  }

  /**
   * PUT 请求
   */
  static async put<T = any>(url: string, data?: Record<string, any>): Promise<T> {
    return Taro.request({
      url: `${API_CONFIG.baseURL}${url}`,
      method: 'PUT',
      data,
      timeout: API_CONFIG.timeout,
      header: API_CONFIG.header
    })
  }

  /**
   * DELETE 请求
   */
  static async delete<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return Taro.request({
      url: `${API_CONFIG.baseURL}${url}`,
      method: 'DELETE',
      data: params,
      timeout: API_CONFIG.timeout,
      header: API_CONFIG.header
    })
  }

  /**
   * 上传文件
   */
  static async upload(url: string, filePath: string, formData?: Record<string, any>) {
    return Taro.uploadFile({
      url: `${API_CONFIG.baseURL}${url}`,
      filePath,
      name: 'file',
      formData,
      header: {
        ...API_CONFIG.header,
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * 下载文件
   */
  static async download(url: string, params?: Record<string, any>) {
    return Taro.downloadFile({
      url: `${API_CONFIG.baseURL}${url}`,
      header: API_CONFIG.header
    })
  }
}

export default ApiClient

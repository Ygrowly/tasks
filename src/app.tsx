import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { initializeSampleData, fixExistingData } from './utils/sampleData'
import { initializeDefaultGuards } from './router/guards'

import './app.css'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
    
    // 初始化路由守卫
    try {
      initializeDefaultGuards()
    } catch (error) {
      console.error('初始化路由守卫失败:', error)
    }
    
    // 修复现有数据中的问题
    try {
      fixExistingData()
    } catch (error) {
      console.error('修复现有数据失败:', error)
    }
    
    // 初始化示例数据（仅在首次启动时）
    try {
      initializeSampleData()
    } catch (error) {
      console.error('初始化示例数据失败:', error)
    }
  })

  // children 是将要会渲染的页面
  return children
}

export default App

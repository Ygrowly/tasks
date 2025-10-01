import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.css'

interface NavigationItem {
  key: string
  title: string
  icon: string
  path: string
}

interface NavigationProps {
  currentPath?: string
  onNavigate?: (path: string) => void
}

const Navigation: React.FC<NavigationProps> = ({
  currentPath = '',
  onNavigate
}) => {
  const navigationItems: NavigationItem[] = [
    {
      key: 'home',
      title: '今日聚焦',
      icon: 'icon-home',
      path: '/pages/home/index'
    },
    {
      key: 'tasks',
      title: '任务管理',
      icon: 'icon-tasks',
      path: '/pages/tasks/index'
    },
    {
      key: 'quantify',
      title: '任务量化',
      icon: 'icon-quantify',
      path: '/pages/quantify/index'
    },
    {
      key: 'stats',
      title: '数据统计',
      icon: 'icon-stats',
      path: '/pages/stats/index'
    }
  ]

  const handleNavigate = (item: NavigationItem) => {
    if (onNavigate) {
      onNavigate(item.path)
    } else {
      Taro.switchTab({
        url: item.path
      }).catch(() => {
        Taro.navigateTo({
          url: item.path
        })
      })
    }
  }

  const isActive = (path: string) => {
    return currentPath.includes(path.split('/').pop() || '')
  }

  return (
    <View className={styles.navigation}>
      <View className={styles.navigationList}>
        {navigationItems.map((item) => (
          <View
            key={item.key}
            className={`${styles.navigationItem} ${isActive(item.path) ? styles.navigationItemActive : ''}`}
            onClick={() => handleNavigate(item)}
          >
            <View className={styles.navigationIcon}>
              <Text className={`iconfont ${item.icon}`} />
            </View>
            <Text className={styles.navigationTitle}>
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default Navigation

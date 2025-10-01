import React, { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.css'

const IndexPage: React.FC = () => {
  useEffect(() => {
    // 自动跳转到主页
    const timer = setTimeout(() => {
      Taro.switchTab({
        url: '/pages/home/index'
      }).catch(() => {
        Taro.redirectTo({
          url: '/pages/home/index'
        })
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View className={styles.indexPage}>
      <View className={styles.indexPageContent}>
        <View className={styles.indexPageLogo}>
          <Text className={styles.indexPageLogoIcon}>🍅</Text>
          <Text className={styles.indexPageLogoText}>番茄时钟</Text>
        </View>
        
        <View className={styles.indexPageSubtitle}>
          <Text>专注每一刻，成就每一天</Text>
        </View>
        
        <View className={styles.indexPageLoading}>
          <View className={styles.loadingDots}>
            <View className={styles.loadingDot} />
            <View className={styles.loadingDot} />
            <View className={styles.loadingDot} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default IndexPage

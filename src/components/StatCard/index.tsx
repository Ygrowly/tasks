import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.css'

interface StatCardProps {
  value: string | number
  label: string
  icon?: string
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  color = 'primary',
  trend,
  onClick
}) => {
  return (
    <View 
      className={`${styles.statCard} ${styles[`statCard${color.charAt(0).toUpperCase() + color.slice(1)}`]} ${onClick ? styles.statCardClickable : ''}`}
      onClick={onClick}
    >
      {icon && (
        <View className={styles.statCardIcon}>
          <Text className={`iconfont ${icon}`} />
        </View>
      )}
      
      <View className={styles.statCardContent}>
        <View className={styles.statCardValue}>
          {value}
        </View>
        
        <View className={styles.statCardLabel}>
          {label}
        </View>
        
        {trend && (
          <View className={`${styles.statCardTrend} ${trend.isPositive ? styles.statCardTrendPositive : styles.statCardTrendNegative}`}>
            <Text className={`iconfont ${trend.isPositive ? 'icon-arrow-up' : 'icon-arrow-down'}`} />
            <Text className={styles.statCardTrendValue}>
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default StatCard
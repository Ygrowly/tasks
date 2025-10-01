import React, { useEffect, useRef } from 'react'
import { View } from '@tarojs/components'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { 
  TooltipComponent, 
  LegendComponent 
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ChartData } from '../../types/stats'
import styles from './index.module.css'

// 注册必要的组件
echarts.use([
  PieChart,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

interface PieChartProps {
  data: ChartData
  height?: number
  className?: string
  showLegend?: boolean
}

const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  height = 300,
  className = '',
  showLegend = true
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current || !data.labels.length) return

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // 准备饼图数据
    const pieData = data.labels.map((label, index) => ({
      name: label,
      value: data.datasets[0]?.data[index] || 0
    }))

    const colors = Array.isArray(data.datasets[0]?.backgroundColor) 
      ? data.datasets[0].backgroundColor 
      : ['#4a6fa5', '#6b8cbc', '#ff6b6b', '#28a745', '#ffc107', '#17a2b8']

    // 修正类型名为 EChartsCoreOption
    const option: echarts.EChartsCoreOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: showLegend ? {
        orient: 'horizontal',
        bottom: '0%',
        textStyle: {
          fontSize: 12,
          color: '#666'
        }
      } : undefined,
      series: [
        {
          name: data.datasets[0]?.label || '数据分布',
          type: 'pie',
          radius: showLegend ? ['20%', '60%'] : ['20%', '70%'],
          center: ['50%', showLegend ? '45%' : '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: '{b}\n{c}'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          labelLine: {
            show: false
          },
          data: pieData,
          color: colors
        }
      ]
    }

    chartInstance.current.setOption(option)

    // 响应式处理
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data, showLegend])

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  return (
    <View className={`${styles.pieChart} ${className}`}>
      <View 
        ref={chartRef}
        style={{ 
          width: '100%', 
          height: `${height}px` 
        }}
      />
    </View>
  )
}

export default PieChartComponent
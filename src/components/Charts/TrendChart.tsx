import React, { useEffect, useRef } from 'react'
import { View } from '@tarojs/components'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { 
  GridComponent, 
  TooltipComponent, 
  LegendComponent,
  DataZoomComponent 
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ChartData } from '../../types/stats'
import styles from './index.module.css'

// 注册必要的组件
echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer
])

interface TrendChartProps {
  data: ChartData
  type?: 'bar' | 'line'
  height?: number
  className?: string
}

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  type = 'bar',
  height = 300,
  className = ''
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current || !data.labels.length) return

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const param = params[0]
            return `${param.name}<br/>${param.seriesName}: ${param.value}`
          }
          return ''
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.labels,
        axisTick: {
          alignWithLabel: true
        },
        axisLabel: {
          fontSize: 12,
          color: '#666'
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 12,
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: data.datasets.map(dataset => ({
        name: dataset.label,
        type: type,
        data: dataset.data,
        itemStyle: {
          color: dataset.backgroundColor || '#4a6fa5'
        },
        lineStyle: type === 'line' ? {
          color: dataset.borderColor || '#4a6fa5',
          width: dataset.borderWidth || 2
        } : undefined,
        smooth: type === 'line',
        symbol: type === 'line' ? 'circle' : undefined,
        symbolSize: type === 'line' ? 6 : undefined
      }))
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
  }, [data, type])

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  return (
    <View className={`${styles.trendChart} ${className}`}>
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

export default TrendChart
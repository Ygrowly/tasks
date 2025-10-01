import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import { Task } from '../../types/task'
import { getTaskStatusText, getTaskCategoryText, getTaskPriorityText, formatDate } from '../../utils/helpers'
import { classNames, stateClass } from '../../utils/classNames'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  task: Task
  showActions?: boolean
  onStart?: (task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  onToggleStatus?: (task: Task) => void
  onClick?: (task: Task) => void
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showActions = false,
  onStart,
  onEdit,
  onDelete,
  onToggleStatus,
  onClick
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(task)
    }
  }

  const handleStart = (e: any) => {
    e.stopPropagation()
    if (onStart) {
      onStart(task)
    }
  }

  const handleEdit = (e: any) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(task)
    }
  }

  const handleDelete = (e: any) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(task)
    }
  }

  const handleToggleStatus = (e: any) => {
    e.stopPropagation()
    if (onToggleStatus) {
      onToggleStatus(task)
    }
  }

  const progressPercentage = task.plannedTomatoes > 0 
    ? Math.min(100, (task.completedTomatoes / task.plannedTomatoes) * 100)
    : 0

  const cardClasses = classNames(
    styles.card,
    stateClass(styles, 'card', task.status),
    stateClass(styles, 'cardPriority', task.priority),
    onClick && styles.cardClickable
  )

  return (
    <View 
      className={cardClasses}
      onClick={handleCardClick}
    >
      <View className={styles.header}>
        <View className={styles.titleSection}>
          <Text className={styles.title}>{task.title}</Text>
          <View className={styles.meta}>
            <Text className={stateClass(styles, 'status', task.status)}>
              {getTaskStatusText(task.status)}
            </Text>
            <Text className={stateClass(styles, 'priority', task.priority)}>
              {getTaskPriorityText(task.priority)}
            </Text>
          </View>
        </View>
        
        <View className={styles.category}>
          <Text className={stateClass(styles, 'categoryText', task.category)}>
            {getTaskCategoryText(task.category)}
          </Text>
        </View>
      </View>

      {task.description && (
        <View className={styles.description}>
          <Text>{task.description}</Text>
        </View>
      )}

      <View className={styles.progress}>
        <View className={styles.progressInfo}>
          <View className={styles.tomatoCount}>
            <Text className="iconfont icon-tomato" />
            <Text className={styles.tomatoText}>
              {task.completedTomatoes}/{task.plannedTomatoes} 番茄
            </Text>
          </View>
          <Text className={styles.progressPercentage}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
        
        <View className={styles.progressBar}>
          <View 
            className={styles.progressFill}
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.date}>
          <Text className={styles.dateText}>
            {formatDate(new Date(task.scheduledDate))}
          </Text>
        </View>

        {showActions && (
          <View className={styles.actions}>
            {task.status !== 'completed' && (
              <Button 
                className={classNames(styles.actionBtn, styles.actionBtnPrimary)}
                size="mini"
                onClick={handleStart}
              >
                开始
              </Button>
            )}
            
            <Button 
              className={classNames(styles.actionBtn, styles.actionBtnSecondary)}
              size="mini"
              onClick={handleToggleStatus}
            >
              {task.status === 'completed' ? '重新开始' : '完成'}
            </Button>
            
            <Button 
              className={classNames(styles.actionBtn, styles.actionBtnSecondary)}
              size="mini"
              onClick={handleEdit}
            >
              编辑
            </Button>
            
            <Button 
              className={classNames(styles.actionBtn, styles.actionBtnDanger)}
              size="mini"
              onClick={handleDelete}
            >
              删除
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

export default TaskCard
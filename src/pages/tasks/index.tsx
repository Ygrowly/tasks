import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useTaskStore } from '../../store/taskStore'
import { usePomodoroStore } from '../../store/pomodoroStore'
import TaskCard from '../../components/TaskCard'
import TaskForm from '../../components/TaskForm'
import { Task, TaskFormData, TaskFilter } from '../../types/task'
import styles from './index.module.css'

const TasksPage: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    filter,
    setFilter,
    clearFilter
  } = useTaskStore()

  const { setCurrentTask } = usePomodoroStore()

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all')

  // 筛选任务
  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    // 按状态筛选
    if (activeFilter !== 'all') {
      result = result.filter(task => task.status === activeFilter)
    }

    // 应用其他筛选条件
    if (filter.status && filter.status.length > 0) {
      result = result.filter(task => filter.status!.includes(task.status))
    }

    if (filter.category && filter.category.length > 0) {
      result = result.filter(task => filter.category!.includes(task.category))
    }

    if (filter.priority && filter.priority.length > 0) {
      result = result.filter(task => filter.priority!.includes(task.priority))
    }

    if (filter.dateRange) {
      result = result.filter(task => 
        task.scheduledDate >= filter.dateRange!.start && 
        task.scheduledDate <= filter.dateRange!.end
      )
    }

    // 按日期和优先级排序
    return result.sort((a, b) => {
      // 首先按状态排序：进行中 > 待办 > 已完成
      const statusOrder = { 'in-progress': 0, 'todo': 1, 'completed': 2, 'cancelled': 3 }
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff

      // 然后按优先级排序
      const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // 最后按日期排序
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    })
  }, [tasks, activeFilter, filter])

  const handleAddTask = () => {
    setEditingTask(null)
    setShowForm(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDeleteTask = (task: Task) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除任务"${task.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          deleteTask(task.id)
          Taro.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  }

  const handleStartTask = (task: Task) => {
    setCurrentTask(task.id)
    Taro.navigateTo({
      url: '/pages/pomodoro/index?taskId=' + task.id
    }).catch(() => {
      // 如果没有番茄钟页面，可以在这里处理
      Taro.showToast({
        title: '开始专注',
        icon: 'success'
      })
    })
  }

  const handleFormSubmit = (formData: TaskFormData) => {
    if (editingTask) {
      // 编辑任务
      updateTask(editingTask.id, formData)
      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } else {
      // 新建任务
      addTask(formData)
      Taro.showToast({
        title: '创建成功',
        icon: 'success'
      })
    }
    setShowForm(false)
    setEditingTask(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingTask(null)
  }

  const handleFilterChange = (newFilter: typeof activeFilter) => {
    setActiveFilter(newFilter)
  }

  const getFilterCount = (status: typeof activeFilter) => {
    if (status === 'all') return tasks.length
    return tasks.filter(task => task.status === status).length
  }

  return (
    <View className={styles.tasksPage}>
      {/* 筛选标签 */}
      <View className={styles.tasksFilter}>
        <ScrollView 
          className={styles.tasksFilterScroll}
          scrollX
          enhanced
          showScrollbar={false}
        >
          <View className={styles.tasksFilterList}>
            {[
              { key: 'all', label: '全部', count: getFilterCount('all') },
              { key: 'todo', label: '待办', count: getFilterCount('todo') },
              { key: 'in-progress', label: '进行中', count: getFilterCount('in-progress') },
              { key: 'completed', label: '已完成', count: getFilterCount('completed') }
            ].map((item) => (
              <View
                key={item.key}
                className={`${styles.filterTag} ${activeFilter === item.key ? styles.filterTagActive : ''}`}
                onClick={() => handleFilterChange(item.key as typeof activeFilter)}
              >
                <Text className={styles.filterTagLabel}>{item.label}</Text>
                <Text className={styles.filterTagCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 任务列表 */}
      <ScrollView 
        className={styles.tasksContent}
        scrollY
        enhanced
        showScrollbar={false}
      >
        {filteredTasks.length > 0 ? (
          <View className={styles.tasksList}>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showActions
                onStart={handleStartTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggleStatus={toggleTaskStatus}
              />
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyStateIcon}>
              <Text className="iconfont icon-empty" />
            </View>
            <Text className={styles.emptyStateText}>
              {activeFilter === 'all' ? '还没有任务' : `没有${activeFilter === 'todo' ? '待办' : activeFilter === 'in-progress' ? '进行中' : '已完成'}的任务`}
            </Text>
            {activeFilter === 'all' && (
              <Button 
                className={styles.emptyStateBtn}
                onClick={handleAddTask}
              >
                创建第一个任务
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* 添加按钮 */}
      <View className={styles.tasksFab}>
        <Button 
          className={styles.fabBtn}
          onClick={handleAddTask}
        >
          <Text className="iconfont icon-plus" />
        </Button>
      </View>

      {/* 任务表单弹窗 */}
      {showForm && (
        <View className={styles.formModal}>
          <View className={styles.formModalBackdrop} onClick={handleFormCancel} />
          <View className={styles.formModalContent}>
            <TaskForm
              task={editingTask}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </View>
        </View>
      )}
    </View>
  )
}

export default TasksPage
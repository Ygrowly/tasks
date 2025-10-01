import React, { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Picker, Button } from '@tarojs/components'
import { Task, TaskFormData } from '../../types/task'
import { getToday } from '../../utils/helpers'
import styles from './index.module.css'

interface TaskFormProps {
  task?: Task
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    category: 'work',
    plannedTomatoes: 1,
    scheduledDate: getToday(),
    priority: 'medium'
  })

  const [errors, setErrors] = useState<Partial<TaskFormData>>({})

  const categoryOptions = [
    { label: '工作', value: 'work' },
    { label: '学习', value: 'study' },
    { label: '生活', value: 'life' },
    { label: '其他', value: 'other' }
  ]

  const priorityOptions = [
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high' },
    { label: '紧急', value: 'urgent' }
  ]

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category,
        plannedTomatoes: task.plannedTomatoes,
        scheduledDate: task.scheduledDate,
        priority: task.priority
      })
    }
  }, [task])

  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormData> = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入任务标题'
    }

    if (formData.plannedTomatoes < 1) {
      newErrors.plannedTomatoes = '番茄数不能少于1个'
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = '请选择计划日期'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    let processedValue = value
    
    // 处理数字类型字段
    if (field === 'plannedTomatoes') {
      processedValue = typeof value === 'string' ? parseInt(value) || 1 : value
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }))
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleCategoryChange = (e: any) => {
    const index = e.detail.value
    handleInputChange('category', categoryOptions[index].value)
  }

  const handlePriorityChange = (e: any) => {
    const index = e.detail.value
    handleInputChange('priority', priorityOptions[index].value)
  }

  const getCategoryIndex = () => {
    return categoryOptions.findIndex(option => option.value === formData.category)
  }

  const getPriorityIndex = () => {
    return priorityOptions.findIndex(option => option.value === formData.priority)
  }

  return (
    <View className={styles.taskForm}>
      <View className={styles.taskFormHeader}>
        <Text className={styles.taskFormTitle}>
          {task ? '编辑任务' : '新建任务'}
        </Text>
      </View>

      <View className={styles.taskFormContent}>
        {/* 任务标题 */}
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>
            任务标题 <Text className={styles.formRequired}>*</Text>
          </Text>
          <Input
            className={`${styles.formInput} ${errors.title ? styles.formInputError : ''}`}
            placeholder="输入任务名称"
            value={formData.title}
            onInput={(e) => handleInputChange('title', e.detail.value)}
            maxlength={50}
          />
          {errors.title && (
            <Text className={styles.formError}>{errors.title}</Text>
          )}
        </View>

        {/* 任务描述 */}
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>任务描述</Text>
          <Textarea
            className={styles.formTextarea}
            placeholder="输入任务描述（可选）"
            value={formData.description}
            onInput={(e) => handleInputChange('description', e.detail.value)}
            maxlength={200}
            showConfirmBar={false}
          />
        </View>

        {/* 分类和优先级 */}
        <View className={styles.formRow}>
          <View className={`${styles.formGroup} ${styles.formGroupHalf}`}>
            <Text className={styles.formLabel}>分类</Text>
            <Picker
              mode="selector"
              range={categoryOptions}
              rangeKey="label"
              value={getCategoryIndex()}
              onChange={handleCategoryChange}
            >
              <View className={styles.formPicker}>
                <Text className={styles.formPickerText}>
                  {categoryOptions[getCategoryIndex()]?.label}
                </Text>
                <Text className={`${styles.formPickerArrow} iconfont icon-arrow-down`} />
              </View>
            </Picker>
          </View>

          <View className={`${styles.formGroup} ${styles.formGroupHalf}`}>
            <Text className={styles.formLabel}>优先级</Text>
            <Picker
              mode="selector"
              range={priorityOptions}
              rangeKey="label"
              value={getPriorityIndex()}
              onChange={handlePriorityChange}
            >
              <View className={styles.formPicker}>
                <Text className={`${styles.formPickerText} ${styles[`formPickerText${formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}`] || ''}`}>
                  {priorityOptions[getPriorityIndex()]?.label}
                </Text>
                <Text className={`${styles.formPickerArrow} iconfont icon-arrow-down`} />
              </View>
            </Picker>
          </View>
        </View>

        {/* 番茄数和日期 */}
        <View className={styles.formRow}>
          <View className={`${styles.formGroup} ${styles.formGroupHalf}`}>
            <Text className={styles.formLabel}>
              预计番茄数 <Text className={styles.formRequired}>*</Text>
            </Text>
            <Input
              className={`${styles.formInput} ${errors.plannedTomatoes ? styles.formInputError : ''}`}
              type="number"
              placeholder="1"
              value={formData.plannedTomatoes.toString()}
              onInput={(e) => handleInputChange('plannedTomatoes', parseInt(e.detail.value) || 1)}
            />
            {errors.plannedTomatoes && (
              <Text className={styles.formError}>{errors.plannedTomatoes}</Text>
            )}
          </View>

          <View className={`${styles.formGroup} ${styles.formGroupHalf}`}>
            <Text className={styles.formLabel}>
              计划日期 <Text className={styles.formRequired}>*</Text>
            </Text>
            <Picker
              mode="date"
              value={formData.scheduledDate}
              onChange={(e) => handleInputChange('scheduledDate', e.detail.value)}
            >
              <View className={`${styles.formPicker} ${errors.scheduledDate ? styles.formPickerError : ''}`}>
                <Text className={styles.formPickerText}>
                  {formData.scheduledDate || '选择日期'}
                </Text>
                <Text className={`${styles.formPickerArrow} iconfont icon-calendar`} />
              </View>
            </Picker>
            {errors.scheduledDate && (
              <Text className={styles.formError}>{errors.scheduledDate}</Text>
            )}
          </View>
        </View>
      </View>

      <View className={styles.taskFormActions}>
        <Button 
          className={`${styles.taskFormBtn} ${styles.taskFormBtnCancel}`}
          onClick={onCancel}
        >
          取消
        </Button>
        <Button 
          className={`${styles.taskFormBtn} ${styles.taskFormBtnSubmit}`}
          onClick={handleSubmit}
        >
          {task ? '保存' : '创建'}
        </Button>
      </View>
    </View>
  )
}

export default TaskForm
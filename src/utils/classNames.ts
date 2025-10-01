/**
 * CSS Modules 类名工具函数
 */

/**
 * 合并多个类名，过滤掉空值
 * @param classes 类名数组
 * @returns 合并后的类名字符串
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 根据条件返回类名
 * @param baseClass 基础类名
 * @param condition 条件
 * @param conditionalClass 条件类名
 * @returns 类名字符串
 */
export function conditionalClass(
  baseClass: string, 
  condition: boolean, 
  conditionalClass: string
): string {
  return condition ? `${baseClass} ${conditionalClass}` : baseClass
}

/**
 * 生成带修饰符的类名
 * @param styles CSS Modules 样式对象
 * @param baseClass 基础类名
 * @param modifier 修饰符
 * @returns 类名字符串
 */
export function modifierClass(
  styles: Record<string, string>, 
  baseClass: string, 
  modifier?: string | number | null | undefined
): string {
  if (!modifier) return styles[baseClass] || ''
  
  // 确保modifier是字符串类型，并且不为空
  const modifierStr = String(modifier).trim()
  if (!modifierStr) return styles[baseClass] || ''
  
  const modifierKey = `${baseClass}${modifierStr.charAt(0).toUpperCase() + modifierStr.slice(1)}`
  return classNames(styles[baseClass], styles[modifierKey])
}

/**
 * 生成状态类名
 * @param styles CSS Modules 样式对象
 * @param baseClass 基础类名
 * @param state 状态值
 * @returns 类名字符串
 */
export function stateClass(
  styles: Record<string, string>, 
  baseClass: string, 
  state: string | number | null | undefined
): string {
  return modifierClass(styles, baseClass, state)
}

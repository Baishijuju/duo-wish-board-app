/**
 * 展板待办的排序、分组与进度计算。
 *
 * 为什么单独放一个模块
 *   这些规则会直接决定「用户看到什么、顺序如何」，是最容易出错、
 *   也最值得被测试覆盖的部分。之前它们散在组件的 computed 里，
 *   所以「完成项不收纳」这种问题不会被任何测试发现。
 */

export interface BoardTodoLike {
  created_at: string
  due_date: string
  is_done: boolean
  sort_order: number
}

export interface BoardSubtaskLike {
  is_done: boolean
}

/** 未完成在前、已完成在后的分组结果 */
export interface BoardTodoGroups<T> {
  done: T[]
  open: T[]
}

/**
 * 排序规则：目标日期 → 手动顺序 → 创建时间。
 * 与展板原有的排序保持一致，避免用户感觉顺序变了。
 */
export function sortBoardTodos<T extends BoardTodoLike>(todos: readonly T[]): T[] {
  return [...todos].sort((left, right) =>
    left.due_date.localeCompare(right.due_date)
    || left.sort_order - right.sort_order
    || left.created_at.localeCompare(right.created_at))
}

/**
 * 拆成「未完成」与「已完成」两组。
 *
 * 这是「完成一个待办后它就该从主列表里收走」这条需求的落点：
 * 主列表只渲染 open，已完成收进底部可展开的分组。
 */
export function splitBoardTodos<T extends BoardTodoLike>(todos: readonly T[]): BoardTodoGroups<T> {
  const sorted = sortBoardTodos(todos)
  return {
    done: sorted.filter((todo) => todo.is_done),
    open: sorted.filter((todo) => !todo.is_done),
  }
}

export interface BoardTodoProgress {
  done: number
  open: number
  /** 0–100，列表为空时为 0（避免出现 NaN） */
  percent: number
  total: number
}

export function getBoardTodoProgress(todos: readonly BoardTodoLike[]): BoardTodoProgress {
  const total = todos.length
  const done = todos.filter((todo) => todo.is_done).length

  return {
    done,
    open: total - done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    total,
  }
}

export interface BoardSubtaskProgress {
  done: number
  total: number
}

export function getBoardSubtaskProgress(subtasks: readonly BoardSubtaskLike[]): BoardSubtaskProgress {
  return {
    done: subtasks.filter((subtask) => subtask.is_done).length,
    total: subtasks.length,
  }
}

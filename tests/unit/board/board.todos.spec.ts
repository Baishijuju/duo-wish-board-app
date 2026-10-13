import { describe, expect, it } from 'vitest'
import {
  getBoardSubtaskProgress,
  getBoardTodoProgress,
  sortBoardTodos,
  splitBoardTodos,
} from '../../../src/modules/board/board.todos'

const makeTodo = (overrides: Partial<{
  created_at: string
  due_date: string
  id: string
  is_done: boolean
  sort_order: number
  title: string
}> = {}) => ({
  created_at: '2026-10-01T00:00:00.000Z',
  due_date: '2026-10-13',
  id: 'todo-1',
  is_done: false,
  sort_order: 0,
  title: '待办',
  ...overrides,
})

describe('board.todos', () => {
  it('按目标日期排序', () => {
    const sorted = sortBoardTodos([
      makeTodo({ id: 'b', due_date: '2026-10-20' }),
      makeTodo({ id: 'a', due_date: '2026-10-11' }),
    ])

    expect(sorted.map((todo) => todo.id)).toEqual(['a', 'b'])
  })

  it('同一天时按手动顺序排序', () => {
    const sorted = sortBoardTodos([
      makeTodo({ id: 'b', due_date: '2026-10-13', sort_order: 5 }),
      makeTodo({ id: 'a', due_date: '2026-10-13', sort_order: 1 }),
    ])

    expect(sorted.map((todo) => todo.id)).toEqual(['a', 'b'])
  })

  it('同日期同顺序时按创建时间排序（保证结果稳定）', () => {
    const sorted = sortBoardTodos([
      makeTodo({ id: 'b', created_at: '2026-10-02T00:00:00.000Z' }),
      makeTodo({ id: 'a', created_at: '2026-10-01T00:00:00.000Z' }),
    ])

    expect(sorted.map((todo) => todo.id)).toEqual(['a', 'b'])
  })

  it('未完成与已完成分开，且各自保持排序', () => {
    const groups = splitBoardTodos([
      makeTodo({ id: 'done-late', due_date: '2026-10-20', is_done: true }),
      makeTodo({ id: 'open-b', due_date: '2026-10-14' }),
      makeTodo({ id: 'done-early', due_date: '2026-10-11', is_done: true }),
      makeTodo({ id: 'open-a', due_date: '2026-10-12' }),
    ])

    expect(groups.open.map((todo) => todo.id)).toEqual(['open-a', 'open-b'])
    expect(groups.done.map((todo) => todo.id)).toEqual(['done-early', 'done-late'])
  })

  it('全部完成时未完成分组为空（主列表应收起）', () => {
    const groups = splitBoardTodos([
      makeTodo({ id: 'a', is_done: true }),
      makeTodo({ id: 'b', is_done: true }),
    ])

    expect(groups.open).toHaveLength(0)
    expect(groups.done).toHaveLength(2)
  })

  it('不修改传入的数组', () => {
    const input = [makeTodo({ id: 'b', due_date: '2026-10-20' }), makeTodo({ id: 'a', due_date: '2026-10-11' })]
    const snapshot = input.map((todo) => todo.id)

    sortBoardTodos(input)

    expect(input.map((todo) => todo.id)).toEqual(snapshot)
  })

  it('计算进度与百分比', () => {
    const progress = getBoardTodoProgress([
      makeTodo({ is_done: true }),
      makeTodo({ is_done: true }),
      makeTodo({ is_done: false }),
      makeTodo({ is_done: false }),
    ])

    expect(progress).toEqual({ done: 2, open: 2, percent: 50, total: 4 })
  })

  it('空列表时百分比为 0 而不是 NaN', () => {
    const progress = getBoardTodoProgress([])

    expect(progress).toEqual({ done: 0, open: 0, percent: 0, total: 0 })
    expect(Number.isNaN(progress.percent)).toBe(false)
  })

  it('计算子项完成度', () => {
    expect(getBoardSubtaskProgress([{ is_done: true }, { is_done: false }, { is_done: true }]))
      .toEqual({ done: 2, total: 3 })
    expect(getBoardSubtaskProgress([])).toEqual({ done: 0, total: 0 })
  })
})

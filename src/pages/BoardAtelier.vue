<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  getBoardSubtaskProgress,
  getBoardTodoProgress,
  splitBoardTodos,
} from '../modules/board/board.todos'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createId } from '../shared/ids'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import BoardWeeklyCharts from '../components/BoardWeeklyCharts.vue'
import { createBoardAutoRefresh } from '../modules/sync/board.auto-refresh'

type BoardTextBlock = {
  id: string
  type: 'text'
  title: string
  text: string
}

type SharedBoardRow = {
  id: string
  space_id: string
  title: string
  blocks: unknown
  revision: number
  updated_by: string
  updated_at: string
}

type BoardTodoSubtask = {
  id: string
  title: string
  is_done: boolean
}

type SharedBoardTodo = {
  id: string
  board_id: string
  space_id: string
  due_date: string
  assignee_id: string | null
  title: string
  is_done: boolean
  subtasks: BoardTodoSubtask[]
  sort_order: number
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

/** 「已完成」分组是否展开，记住用户的选择 */
const BOARD_TODO_SHOW_DONE_KEY = 'duo-wish-board-todo-show-done:v1'

/**
 * 勾选完成后停留多久再收进「已完成」分组。
 * 参考成熟待办应用的做法：立刻消失会让人怀疑误删，停留片刻让人确认。
 */
const TODO_COMPLETE_FEEDBACK_MS = 620

function readShowDoneTodos() {
  try {
    return window.localStorage.getItem(BOARD_TODO_SHOW_DONE_KEY) === '1'
  } catch {
    return false
  }
}

function persistShowDoneTodos(value: boolean) {
  try {
    window.localStorage.setItem(BOARD_TODO_SHOW_DONE_KEY, value ? '1' : '0')
  } catch {
    // 隐私模式等场景下不可用，忽略即可：这只是个显示偏好
  }
}

/* ── 全屏看板的按区块缩放 ──────────────────────────────────────
   数值是倍数，1 = 原大小。做成可调是因为「站远看」到底要多大
   只有本人知道 —— 先在面板里调好，再把数值写死成默认值即可。 */

const BOARD_ZOOM_STORAGE_KEY = 'duo-wish-board-zoom:v1'
const BOARD_ZOOM_MIN = 0.8
const BOARD_ZOOM_MAX = 3
/** 步进用 0.2：0.05 要点太多次 */
const BOARD_ZOOM_STEP = 0.2

/**
 * 展板上显示的版本号。
 * 每次发布后加 0.1，用来确认设备上跑的到底是不是最新版
 * （PWA 有 Service Worker 缓存，重开一两次才会换新）。
 */
const BOARD_BUILD_VERSION = 'v1.3'

const BOARD_ZOOM_BLOCKS = [
  { key: 'header', label: '看板标题' },
  { key: 'chart', label: '图表' },
  { key: 'notes', label: '便签' },
  { key: 'todo', label: '待办' },
] as const

type BoardZoomKey = (typeof BOARD_ZOOM_BLOCKS)[number]['key']
type BoardZoomMap = Record<BoardZoomKey, number>

function createDefaultBoardZoom(): BoardZoomMap {
  return { header: 1, chart: 1, notes: 1, todo: 1 }
}

function readBoardZoom(): BoardZoomMap {
  const fallback = createDefaultBoardZoom()

  try {
    const raw = window.localStorage.getItem(BOARD_ZOOM_STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next = createDefaultBoardZoom()

    for (const block of BOARD_ZOOM_BLOCKS) {
      const value = Number(parsed?.[block.key])

      if (Number.isFinite(value) && value >= BOARD_ZOOM_MIN && value <= BOARD_ZOOM_MAX) {
        next[block.key] = value
      }
    }

    return next
  } catch {
    return fallback
  }
}

function persistBoardZoom(value: BoardZoomMap) {
  try {
    window.localStorage.setItem(BOARD_ZOOM_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // 隐私模式等场景下不可用，忽略即可：这只是个显示偏好
  }
}

const authStore = useAuthStore()
const isLoading = ref(false)
const isSaving = ref(false)
const isEditing = ref(false)
const isFullscreen = ref(false)
const boardZoom = ref<BoardZoomMap>(readBoardZoom())
const isZoomPanelOpen = ref(false)
const zoomCopyLabel = ref('复制数值')
const hasRemoteChanges = ref(false)
const boardId = ref('')
const boardTitle = ref('我们的展板')
const boardBlocks = ref<BoardTextBlock[]>([])
const revision = ref(0)
const updatedBy = ref('')
const updatedAt = ref('')
const draftTitle = ref('')
const draftBlocks = ref<BoardTextBlock[]>([])
const feedback = ref('')
const feedbackTone = ref<'success' | 'danger'>('success')
const boardTodos = ref<SharedBoardTodo[]>([])
const boardMainLayout = ref<HTMLElement | null>(null)
const boardTodoPanel = ref<HTMLElement | null>(null)
const leftPaneRatio = ref(42)
const upperPaneRatio = ref(66)
const isTodoComposerOpen = ref(false)
const isCreatingTodo = ref(false)
const todoDraftTitle = ref('')
const todoDraftDate = ref(getBeijingDateKey())
const todoDraftAssignee = ref('')
const todoDraftSubtasks = ref<BoardTodoSubtask[]>([])
const todoSubtaskTitle = ref('')
const editingTodoId = ref('')
const todoEditDraft = ref<SharedBoardTodo | null>(null)
const todoEditSubtaskTitle = ref('')
const pendingTodoWrites = ref(0)
const completingTodoIds = ref<string[]>([])
const showDoneTodos = ref(readShowDoneTodos())

/* ── 区块折叠 ──────────────────────────────────────────────── */
type CollapsedSectionKey = 'chart' | 'todo'

function readCollapsedSections(): Record<CollapsedSectionKey, boolean> {
  const fallback = { chart: true, todo: true }

  try {
    const raw = window.localStorage.getItem('duo-wish-board-collapsed-sections:v1')
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Record<string, unknown>

    return { chart: parsed?.chart !== false, todo: parsed?.todo !== false }
  } catch {
    return fallback
  }
}

const collapsedSections = ref<Record<CollapsedSectionKey, boolean>>(readCollapsedSections())

function toggleCollapsedSection(key: CollapsedSectionKey) {
  const next = { ...collapsedSections.value, [key]: !collapsedSections.value[key] }
  collapsedSections.value = next

  try {
    window.localStorage.setItem('duo-wish-board-collapsed-sections:v1', JSON.stringify(next))
  } catch {
    // 隐私模式等场景下不可用，忽略即可：这只是个显示偏好
  }
}
const editingTitleId = ref('')
const todoTitleDraft = ref('')
const chartRefreshToken = ref(0)
const canAutoRefreshBoard = computed(() => isAuthenticatedSpace.value && !!boardId.value
  && !isLoading.value && !isSaving.value && !isEditing.value
  && !editingTodoId.value && !editingTitleId.value
  && !isTodoComposerOpen.value && !isCreatingTodo.value && pendingTodoWrites.value === 0)
const isAuthenticatedSpace = computed(() => authStore.usesSupabaseSpace && !!authStore.currentSpaceId)
const lastEditorName = computed(() => authStore.members.find((member) => member.id === updatedBy.value)?.displayName ?? '')
const feedbackClass = computed(() => `board-feedback-${feedbackTone.value}`)
// 分组与排序规则在 src/modules/board/board.todos.ts 里，带单测覆盖。
// 未完成永远在主列表；已完成收进底部可展开的分组 —— 否则列表只会越来越长。
const todoGroups = computed(() => splitBoardTodos(boardTodos.value))
const openTodos = computed(() => todoGroups.value.open)
const doneTodos = computed(() => todoGroups.value.done)
const todoProgress = computed(() => getBoardTodoProgress(boardTodos.value))

let boardChannel: RealtimeChannel | null = null
let loadSequence = 0
let previousBodyOverflow = ''
let todoMutationVersion = 0
let todoLoadPromise: Promise<boolean> | null = null
let todoLoadContext = ''
const autoRefresh = createBoardAutoRefresh({
  canRefresh: () => canAutoRefreshBoard.value,
  isVisible: () => document.visibilityState === 'visible',
  isOnline: () => navigator.onLine,
  refresh: refreshBoardData,
})

function handleBoardResume() {
  void autoRefresh.request()
}

async function withTodoMutation<T>(mutate: () => PromiseLike<T>) {
  pendingTodoWrites.value += 1
  todoMutationVersion += 1
  try {
    return await mutate()
  } finally {
    pendingTodoWrites.value -= 1
  }
}

async function refreshBoardData() {
  if (!supabase || !canAutoRefreshBoard.value) return false
  const spaceId = authStore.currentSpaceId
  const currentBoardId = boardId.value
  const sequence = loadSequence
  const { data, error } = await supabase
    .from('shared_boards')
    .select('id, space_id, title, blocks, revision, updated_by, updated_at')
    .eq('id', currentBoardId)
    .eq('space_id', spaceId)
    .single()

  if (error || !data || sequence !== loadSequence || spaceId !== authStore.currentSpaceId) return false
  if (!canAutoRefreshBoard.value) {
    void autoRefresh.request()
    return true
  }
  if ((data as SharedBoardRow).revision > revision.value) applyBoardRow(data as SharedBoardRow)
  const todosUpdated = await loadTodos(currentBoardId)
  if (!canAutoRefreshBoard.value && sequence === loadSequence) {
    void autoRefresh.request()
    return true
  }
  if (sequence === loadSequence && spaceId === authStore.currentSpaceId) chartRefreshToken.value += 1
  return todosUpdated
}
let splitterDrag: { axis: 'vertical' | 'horizontal'; pointerId: number; element: HTMLElement } | null = null

const splitterStyle = computed(() => ({
  '--board-left-pane': `${leftPaneRatio.value}%`,
  '--board-upper-fr': `${upperPaneRatio.value}`,
  '--board-lower-fr': `${100 - upperPaneRatio.value}`,
}))

const boardZoomStyle = computed(() => ({
  '--board-zoom-header': String(boardZoom.value.header),
  '--board-zoom-chart': String(boardZoom.value.chart),
  '--board-zoom-notes': String(boardZoom.value.notes),
  '--board-zoom-todo': String(boardZoom.value.todo),
}))

/** 调好之后把这一行发我即可 */
const boardZoomSummary = computed(() =>
  BOARD_ZOOM_BLOCKS.map((block) => `${block.label} ${boardZoom.value[block.key].toFixed(2)}`).join(' · '))

function stepBoardZoom(key: BoardZoomKey, direction: 1 | -1) {
  const next = Math.min(
    BOARD_ZOOM_MAX,
    Math.max(BOARD_ZOOM_MIN, Number((boardZoom.value[key] + direction * BOARD_ZOOM_STEP).toFixed(2))),
  )

  boardZoom.value = { ...boardZoom.value, [key]: next }
  persistBoardZoom(boardZoom.value)
}

function resetBoardZoom() {
  boardZoom.value = createDefaultBoardZoom()
  persistBoardZoom(boardZoom.value)
}

async function copyBoardZoom() {
  try {
    await navigator.clipboard.writeText(boardZoomSummary.value)
    zoomCopyLabel.value = '已复制'
  } catch {
    zoomCopyLabel.value = '复制失败，请手动读'
  }

  window.setTimeout(() => {
    zoomCopyLabel.value = '复制数值'
  }, 1600)
}

function enterFullscreen() {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  isFullscreen.value = true
}

function exitFullscreen() {
  isFullscreen.value = false
  document.body.style.overflow = previousBodyOverflow
}

function toggleFullscreen() {
  if (isFullscreen.value) {
    exitFullscreen()
    return
  }

  enterFullscreen()
}

function handleFullscreenKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isFullscreen.value) {
    exitFullscreen()
  }
}

function startSplitterDrag(event: PointerEvent, axis: 'vertical' | 'horizontal') {
  const isTabletViewport = window.matchMedia('(min-width: 721px) and (min-height: 900px), (min-width: 900px) and (orientation: landscape)').matches
  if (!isFullscreen.value || !isTabletViewport) {
    return
  }

  const element = event.currentTarget
  if (!(element instanceof HTMLElement)) {
    return
  }

  event.preventDefault()
  element.setPointerCapture(event.pointerId)
  splitterDrag = { axis, pointerId: event.pointerId, element }
}

function moveSplitterDrag(event: PointerEvent) {
  if (!splitterDrag || splitterDrag.pointerId !== event.pointerId) {
    return
  }

  if (splitterDrag.axis === 'vertical' && boardMainLayout.value) {
    const rect = boardMainLayout.value.getBoundingClientRect()
    const nextRatio = ((event.clientX - rect.left) / rect.width) * 100
    leftPaneRatio.value = Math.max(26, Math.min(66, nextRatio))
    return
  }

  if (splitterDrag.axis === 'horizontal' && boardMainLayout.value && boardTodoPanel.value) {
    const mainRect = boardMainLayout.value.getBoundingClientRect()
    const todoRect = boardTodoPanel.value.getBoundingClientRect()
    const availableHeight = todoRect.bottom - mainRect.top
    const nextRatio = ((event.clientY - mainRect.top) / availableHeight) * 100
    upperPaneRatio.value = Math.max(48, Math.min(82, nextRatio))
  }
}

function endSplitterDrag(event: PointerEvent) {
  if (!splitterDrag || splitterDrag.pointerId !== event.pointerId) {
    return
  }

  if (splitterDrag.element.hasPointerCapture(event.pointerId)) {
    splitterDrag.element.releasePointerCapture(event.pointerId)
  }
  splitterDrag = null
}

function nudgeSplitter(axis: 'vertical' | 'horizontal', direction: -1 | 1) {
  if (axis === 'vertical') {
    leftPaneRatio.value = Math.max(26, Math.min(66, leftPaneRatio.value + direction * 3))
  } else {
    upperPaneRatio.value = Math.max(48, Math.min(82, upperPaneRatio.value + direction * 3))
  }
}

function handleSplitterKeydown(event: KeyboardEvent, axis: 'vertical' | 'horizontal') {
  const key = event.key
  const isDecrease = axis === 'vertical' ? key === 'ArrowLeft' : key === 'ArrowUp'
  const isIncrease = axis === 'vertical' ? key === 'ArrowRight' : key === 'ArrowDown'

  if (isDecrease || isIncrease) {
    event.preventDefault()
    nudgeSplitter(axis, isIncrease ? 1 : -1)
  }
}

function normalizeBoardBlocks(value: unknown): BoardTextBlock[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || !('type' in entry) || entry.type !== 'text') {
      return []
    }

    const text = 'text' in entry && typeof entry.text === 'string' ? entry.text : ''
    const id = 'id' in entry && typeof entry.id === 'string' ? entry.id : createId()
    const title = 'title' in entry && typeof entry.title === 'string' ? entry.title : ''
    return [{ id, type: 'text' as const, title, text }]
  })
}

function applyBoardRow(row: SharedBoardRow) {
  boardId.value = row.id
  boardTitle.value = row.title
  boardBlocks.value = normalizeBoardBlocks(row.blocks)
  revision.value = row.revision
  updatedBy.value = row.updated_by
  updatedAt.value = row.updated_at
}

function getBeijingDateKey(date = new Date()) {
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  return `${shifted.getUTCFullYear()}-${`${shifted.getUTCMonth() + 1}`.padStart(2, '0')}-${`${shifted.getUTCDate()}`.padStart(2, '0')}`
}



function normalizeTodoSubtasks(value: unknown): BoardTodoSubtask[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return []
    }

    const id = 'id' in entry && typeof entry.id === 'string' ? entry.id : createId()
    const title = 'title' in entry && typeof entry.title === 'string' ? entry.title : ''
    const isDone = 'is_done' in entry && entry.is_done === true
    return [{ id, title, is_done: isDone }]
  })
}

function applyTodoRows(rows: unknown[]) {
  boardTodos.value = rows.flatMap((row) => {
    if (!row || typeof row !== 'object') {
      return []
    }

    return [{
      ...(row as SharedBoardTodo),
      subtasks: normalizeTodoSubtasks((row as SharedBoardTodo).subtasks),
    }]
  })
}

async function loadTodos(boardIdValue = boardId.value) {
  const context = `${authStore.currentSpaceId}:${boardIdValue}:${loadSequence}`
  if (todoLoadPromise && todoLoadContext === context) return todoLoadPromise
  todoLoadContext = context
  const request = fetchTodos(boardIdValue).finally(() => {
    if (todoLoadPromise === request) todoLoadPromise = null
  })
  todoLoadPromise = request
  return request
}

async function fetchTodos(boardIdValue: string) {
  if (!supabase || !boardIdValue) {
    boardTodos.value = []
    return false
  }

  if (editingTodoId.value || isTodoComposerOpen.value || pendingTodoWrites.value > 0) return false
  const sequence = loadSequence
  const spaceId = authStore.currentSpaceId
  const mutationVersion = todoMutationVersion

  const { data, error } = await supabase
    .from('shared_board_todos')
    .select('id, board_id, space_id, due_date, assignee_id, title, is_done, subtasks, sort_order, created_by, updated_by, created_at, updated_at')
    .eq('board_id', boardIdValue)
    .order('due_date', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!error && sequence === loadSequence && spaceId === authStore.currentSpaceId
    && mutationVersion === todoMutationVersion && boardIdValue === boardId.value
    && !editingTodoId.value && !isTodoComposerOpen.value && pendingTodoWrites.value === 0) {
    applyTodoRows(data ?? [])
    return true
  }
  return false
}

async function updateTodo(todoId: string, updates: Partial<Pick<SharedBoardTodo, 'is_done' | 'subtasks'>>) {
  if (!supabase || !authStore.currentSpaceId || !authStore.currentMemberId) {
    return
  }

  const previous = boardTodos.value.find((todo) => todo.id === todoId)
  if (!previous) {
    return
  }

  boardTodos.value = boardTodos.value.map((todo) => todo.id === todoId ? { ...todo, ...updates } : todo)
  const { data, error } = await withTodoMutation(() => supabase!
    .from('shared_board_todos')
    .update({ ...updates, updated_by: authStore.currentMemberId })
    .eq('id', todoId)
    .eq('space_id', authStore.currentSpaceId)
    .select('id, board_id, space_id, due_date, assignee_id, title, is_done, subtasks, sort_order, created_by, updated_by, created_at, updated_at')
    .single())

  if (error || !data) {
    boardTodos.value = boardTodos.value.map((todo) => todo.id === todoId ? previous : todo)
    feedback.value = error?.message ?? '待办更新失败，请重试。'
    feedbackTone.value = 'danger'
    return
  }

  boardTodos.value = boardTodos.value.map((todo) => todo.id === todoId ? { ...(data as SharedBoardTodo), subtasks: normalizeTodoSubtasks((data as SharedBoardTodo).subtasks) } : todo)
}

function startEditingTodo(todo: SharedBoardTodo) {
  editingTodoId.value = todo.id
  todoEditDraft.value = { ...todo, subtasks: todo.subtasks.map((subtask) => ({ ...subtask })) }
  todoEditSubtaskTitle.value = ''
}

function cancelEditingTodo() {
  editingTodoId.value = ''
  todoEditDraft.value = null
  todoEditSubtaskTitle.value = ''
}

function addTodoEditSubtask() {
  const title = todoEditSubtaskTitle.value.trim()
  if (!title || !todoEditDraft.value) {
    return
  }

  todoEditDraft.value.subtasks.push({ id: createId(), title, is_done: false })
  todoEditSubtaskTitle.value = ''
}

async function saveTodoDetails() {
  if (!supabase || !todoEditDraft.value || !authStore.currentMemberId) {
    return
  }

  const draft = todoEditDraft.value
  const { data, error } = await withTodoMutation(() => supabase!
    .from('shared_board_todos')
    .update({
      due_date: draft.due_date,
      assignee_id: draft.assignee_id,
      title: draft.title.trim(),
      subtasks: draft.subtasks.map((subtask) => ({ ...subtask, title: subtask.title.trim() })).filter((subtask) => subtask.title),
      updated_by: authStore.currentMemberId,
    })
    .eq('id', draft.id)
    .eq('space_id', authStore.currentSpaceId)
    .select('id, board_id, space_id, due_date, assignee_id, title, is_done, subtasks, sort_order, created_by, updated_by, created_at, updated_at')
    .single())

  if (error || !data) {
    feedback.value = error?.message ?? '待办保存失败，请重试。'
    feedbackTone.value = 'danger'
    return
  }

  boardTodos.value = boardTodos.value.map((todo) => todo.id === draft.id
    ? { ...(data as SharedBoardTodo), subtasks: normalizeTodoSubtasks((data as SharedBoardTodo).subtasks) }
    : todo)
  cancelEditingTodo()
}

async function deleteTodo(todoId: string) {
  if (!supabase || !authStore.currentSpaceId) {
    return
  }

  const { error } = await withTodoMutation(() => supabase!
    .from('shared_board_todos')
    .delete()
    .eq('id', todoId)
    .eq('space_id', authStore.currentSpaceId))

  if (error) {
    feedback.value = error.message
    feedbackTone.value = 'danger'
    return
  }

  boardTodos.value = boardTodos.value.filter((todo) => todo.id !== todoId)
  cancelEditingTodo()
}

async function createTodo() {
  if (!supabase || !boardId.value || !authStore.currentSpaceId || !authStore.currentMemberId || isCreatingTodo.value) {
    return
  }

  const title = todoDraftTitle.value.trim()
  if (!title) {
    return
  }

  isCreatingTodo.value = true
  const payload = {
    board_id: boardId.value,
    space_id: authStore.currentSpaceId,
    due_date: todoDraftDate.value,
    assignee_id: todoDraftAssignee.value || null,
    title,
    is_done: false,
    subtasks: todoDraftSubtasks.value.filter((subtask) => subtask.title.trim()).map((subtask) => ({ ...subtask, title: subtask.title.trim() })),
    sort_order: boardTodos.value.length,
    created_by: authStore.currentMemberId,
    updated_by: authStore.currentMemberId,
  }

  const { data, error } = await withTodoMutation(() => supabase!
    .from('shared_board_todos')
    .insert(payload)
    .select('id, board_id, space_id, due_date, assignee_id, title, is_done, subtasks, sort_order, created_by, updated_by, created_at, updated_at')
    .single())

  isCreatingTodo.value = false
  if (error || !data) {
    feedback.value = error?.message ?? '待办创建失败，请重试。'
    feedbackTone.value = 'danger'
    return
  }

  boardTodos.value = [...boardTodos.value, { ...(data as SharedBoardTodo), subtasks: normalizeTodoSubtasks((data as SharedBoardTodo).subtasks) }]
  todoDraftTitle.value = ''
  todoDraftAssignee.value = ''
  todoDraftSubtasks.value = []
  todoDraftDate.value = getBeijingDateKey()
  isTodoComposerOpen.value = false
}

function addTodoDraftSubtask() {
  const title = todoSubtaskTitle.value.trim()
  if (!title) {
    return
  }

  todoDraftSubtasks.value = [...todoDraftSubtasks.value, { id: createId(), title, is_done: false }]
  todoSubtaskTitle.value = ''
}

function toggleTodoSubtask(todo: SharedBoardTodo, subtaskId: string) {
  void updateTodo(todo.id, {
    subtasks: todo.subtasks.map((subtask) => subtask.id === subtaskId ? { ...subtask, is_done: !subtask.is_done } : subtask),
  })
}

/**
 * 勾选完成：先让这一行划线淡出，再真正写入并收进「已完成」。
 *
 * 为什么要延迟：立刻消失会让人怀疑是不是误删了。延迟期间 is_done 还没变，
 * 所以这一行仍在未完成列表里，只是带上了 is-completing 样式。
 */
function completeTodo(todo: SharedBoardTodo) {
  if (todo.is_done || completingTodoIds.value.includes(todo.id)) {
    return
  }

  completingTodoIds.value = [...completingTodoIds.value, todo.id]

  window.setTimeout(() => {
    completingTodoIds.value = completingTodoIds.value.filter((id) => id !== todo.id)
    void updateTodo(todo.id, { is_done: true })
  }, TODO_COMPLETE_FEEDBACK_MS)
}

function toggleShowDoneTodos() {
  showDoneTodos.value = !showDoneTodos.value
  persistShowDoneTodos(showDoneTodos.value)
}

function todoOwnerLabel(todo: SharedBoardTodo) {
  return todo.assignee_id
    ? authStore.members.find((member) => member.id === todo.assignee_id)?.displayName ?? '成员'
    : '所有人'
}

function subtaskDoneCount(todo: SharedBoardTodo) {
  return getBoardSubtaskProgress(todo.subtasks).done
}

/** 让行内改标题的输入框一出现就拿到焦点，省掉一次点击 */
function focusTodoTitleInput(element: unknown) {
  if (element instanceof HTMLInputElement) {
    element.focus()
    element.select()
  }
}

function startTodoTitleEdit(todo: SharedBoardTodo) {
  if (editingTodoId.value === todo.id) {
    return
  }

  editingTitleId.value = todo.id
  todoTitleDraft.value = todo.title
}

function cancelTodoTitleEdit() {
  editingTitleId.value = ''
  todoTitleDraft.value = ''
}

async function saveTodoTitle(todo: SharedBoardTodo) {
  if (editingTitleId.value !== todo.id) {
    return
  }

  const title = todoTitleDraft.value.trim()
  cancelTodoTitleEdit()

  if (!title || title === todo.title || !supabase || !authStore.currentSpaceId) {
    return
  }

  const { data, error } = await withTodoMutation(() => supabase!
    .from('shared_board_todos')
    .update({ title, updated_by: authStore.currentMemberId })
    .eq('id', todo.id)
    .eq('space_id', authStore.currentSpaceId)
    .select('id, board_id, space_id, due_date, assignee_id, title, is_done, subtasks, sort_order, created_by, updated_by, created_at, updated_at')
    .single())

  if (error) {
    feedback.value = error.message
    feedbackTone.value = 'danger'
    return
  }

  boardTodos.value = boardTodos.value.map((item) => item.id === todo.id
    ? { ...(data as SharedBoardTodo), subtasks: normalizeTodoSubtasks((data as SharedBoardTodo).subtasks) }
    : item)
}

function getBoardQuery() {
  return supabase?.from('shared_boards')
}

async function loadBoard(spaceId: string) {
  const sequence = ++loadSequence
  isLoading.value = true
  feedback.value = ''

  try {
    if (!supabase) {
      feedback.value = 'Supabase 尚未配置。'
      feedbackTone.value = 'danger'
      return
    }

    let { data, error } = await supabase
      .from('shared_boards')
      .select('id, space_id, title, blocks, revision, updated_by, updated_at')
      .eq('space_id', spaceId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      const { error: insertError } = await supabase
        .from('shared_boards')
        .upsert({
          space_id: spaceId,
          created_by: authStore.currentMemberId,
          updated_by: authStore.currentMemberId,
          title: '我们的展板',
          blocks: [],
          revision: 0,
        }, { onConflict: 'space_id', ignoreDuplicates: true })

      if (insertError) {
        throw insertError
      }

      const retry = await supabase
        .from('shared_boards')
        .select('id, space_id, title, blocks, revision, updated_by, updated_at')
        .eq('space_id', spaceId)
        .single()

      data = retry.data
      error = retry.error
    }

    if (error) {
      throw error
    }

    if (sequence !== loadSequence || !data) {
      return
    }

    applyBoardRow(data as SharedBoardRow)
    await loadTodos((data as SharedBoardRow).id)
    isEditing.value = false
    hasRemoteChanges.value = false

    if (boardChannel && supabase) {
      void supabase.removeChannel(boardChannel)
    }

    boardChannel = supabase.channel(`shared-board-${spaceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shared_boards',
        filter: `space_id=eq.${spaceId}`,
      }, (payload) => {
        const remoteRow = payload.new as SharedBoardRow | null | undefined

        // Realtime 的 payload 可能**不带行数据** —— 实测本应用的频道会推空对象
        // （与主功能遇到的是同一个现象，详见 src/modules/sync/localWriteEcho.ts）。
        //
        // 这时绝不能当成「与我无关」直接返回：remoteRow.id 会是 undefined，
        // 于是第一个判断永远成立、函数永远提前退出 ——
        // 结果是对方在展板上改的**正文**永远不实时出现，只能等 5 分钟轮询
        // 或重新进入页面。（旁边的待办处理没有这个问题，因为它压根不看 payload，
        // 收到事件就直接重新加载，所以待办一直是实时的。）
        //
        // 改为走已有的自动刷新：它自带编辑保护、并发去重与失败退避，
        // 不会覆盖你正在输入的内容。
        if (!remoteRow || typeof remoteRow.id !== 'string' || typeof remoteRow.revision !== 'number') {
          void autoRefresh.request()
          return
        }

        if (remoteRow.id !== boardId.value || remoteRow.revision <= revision.value) {
          return
        }

        if (isEditing.value) {
          hasRemoteChanges.value = true
          return
        }

        applyBoardRow(remoteRow)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_board_todos',
        filter: `board_id=eq.${(data as SharedBoardRow).id}`,
      }, () => {
        if (editingTodoId.value || isTodoComposerOpen.value || pendingTodoWrites.value > 0) {
          void autoRefresh.request()
          return
        }
        void loadTodos((data as SharedBoardRow).id)
      })
      .subscribe()
  } catch (error) {
    if (sequence === loadSequence) {
      feedback.value = error instanceof Error ? error.message : '展板暂时读取失败。'
      feedbackTone.value = 'danger'
    }
  } finally {
    if (sequence === loadSequence) {
      isLoading.value = false
    }
  }
}

function startEditing() {
  draftTitle.value = boardTitle.value
  draftBlocks.value = boardBlocks.value.length
    ? boardBlocks.value.map((block) => ({ ...block }))
    : [{ id: createId(), type: 'text', title: '', text: '' }]
  hasRemoteChanges.value = false
  isEditing.value = true
  feedback.value = ''
}

function addTextBlock() {
  draftBlocks.value = [...draftBlocks.value, { id: createId(), type: 'text', title: '', text: '' }]
}

function moveTextBlock(blockId: string, offset: -1 | 1) {
  const currentIndex = draftBlocks.value.findIndex((block) => block.id === blockId)
  const nextIndex = currentIndex + offset

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= draftBlocks.value.length) {
    return
  }

  const nextBlocks = [...draftBlocks.value]
  const [block] = nextBlocks.splice(currentIndex, 1)
  nextBlocks.splice(nextIndex, 0, block!)
  draftBlocks.value = nextBlocks
}

function removeTextBlock(blockId: string) {
  draftBlocks.value = draftBlocks.value.filter((block) => block.id !== blockId)
}

function cancelEditing() {
  isEditing.value = false
  hasRemoteChanges.value = false
  feedback.value = ''
}

function reloadLatestBoard() {
  if (authStore.currentSpaceId) {
    void loadBoard(authStore.currentSpaceId)
  }
}

async function saveBoard() {
  const boardQuery = getBoardQuery()
  const spaceId = authStore.currentSpaceId
  const editorId = authStore.currentMemberId

  if (!boardQuery || !spaceId || !editorId || !boardId.value || isSaving.value) {
    return
  }

  if (hasRemoteChanges.value) {
    feedback.value = '心舒刚更新了展板。先重新载入最新内容，再继续编辑。'
    feedbackTone.value = 'danger'
    return
  }

  const nextTitle = draftTitle.value.trim()
  if (!nextTitle) {
    feedback.value = '先给展板写个标题。'
    feedbackTone.value = 'danger'
    return
  }

  const nextBlocks = draftBlocks.value.map((block) => ({ ...block, title: block.title.trim(), text: block.text.trim() }))
    .filter((block) => block.text.length > 0)

  isSaving.value = true
  feedback.value = ''

  try {
    const nextRevision = revision.value + 1
    const { data, error } = await boardQuery
      .update({
        title: nextTitle,
        blocks: nextBlocks,
        revision: nextRevision,
        updated_by: editorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', boardId.value)
      .eq('revision', revision.value)
      .select('id, space_id, title, blocks, revision, updated_by, updated_at')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      hasRemoteChanges.value = true
      feedback.value = '展板刚被另一位成员更新。重新载入后再保存，避免覆盖对方内容。'
      feedbackTone.value = 'danger'
      return
    }

    applyBoardRow(data as SharedBoardRow)
    isEditing.value = false
    hasRemoteChanges.value = false
    feedback.value = '已保存，另一台设备会自动更新。'
    feedbackTone.value = 'success'
  } catch (error) {
    feedback.value = error instanceof Error ? `保存失败：${error.message}` : '保存失败，请稍后重试。'
    feedbackTone.value = 'danger'
  } finally {
    isSaving.value = false
  }
}

watch(
  [() => authStore.currentSpaceId, () => authStore.usesSupabaseSpace],
  ([spaceId, usesSupabaseSpace]) => {
    if (spaceId && usesSupabaseSpace) {
      void loadBoard(spaceId)
    } else {
      loadSequence += 1
      if (boardChannel && supabase) {
        void supabase.removeChannel(boardChannel)
        boardChannel = null
      }
      boardId.value = ''
      boardTitle.value = '我们的展板'
      boardBlocks.value = []
      boardTodos.value = []
      isEditing.value = false
    }
  },
  { immediate: true },
)

watch(canAutoRefreshBoard, (allowed) => {
  if (allowed) void autoRefresh.flush()
})


onBeforeUnmount(() => {
  if (isFullscreen.value) {
    document.body.style.overflow = previousBodyOverflow
  }
  loadSequence += 1
  if (boardChannel && supabase) {
    void supabase.removeChannel(boardChannel)
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleFullscreenKeydown)
  document.addEventListener('visibilitychange', handleBoardResume)
  window.addEventListener('online', handleBoardResume)
  window.addEventListener('pageshow', handleBoardResume)
  autoRefresh.start()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleFullscreenKeydown)
  document.removeEventListener('visibilitychange', handleBoardResume)
  window.removeEventListener('online', handleBoardResume)
  window.removeEventListener('pageshow', handleBoardResume)
  autoRefresh.stop()
})
</script>

<template>
  <section ref="boardRoot" class="shared-board-page" :class="{ 'is-editing': isEditing, 'is-fullscreen': isFullscreen }" :style="[splitterStyle, boardZoomStyle]">
    <header class="shared-board-header">
      <div class="shared-board-heading">
        <h2 v-if="!isEditing">{{ boardTitle }}<span class="shared-board-version">{{ BOARD_BUILD_VERSION }}</span></h2>
        <p v-if="updatedAt && lastEditorName" class="shared-board-meta">最近由{{ lastEditorName }}整理 · {{ formatBoardTime(updatedAt) }}</p>
      </div>
      <div class="shared-board-actions">
        <button
          class="board-fullscreen-button"
          type="button"
          :aria-label="isFullscreen ? '退出全屏' : '全屏显示便签'"
          :title="isFullscreen ? '退出全屏' : '全屏显示便签'"
          @click="toggleFullscreen"
        >
          <span aria-hidden="true">{{ isFullscreen ? '×' : '⛶' }}</span>
        </button>
        <template v-if="isEditing">
          <button class="shared-board-quiet-button" type="button" :disabled="isSaving" @click="cancelEditing">取消</button>
          <button class="shared-board-primary-button" type="button" :disabled="isSaving" @click="void saveBoard()">{{ isSaving ? '保存中…' : '保存' }}</button>
        </template>
        <button v-else class="shared-board-edit-button" type="button" :disabled="isLoading || !isAuthenticatedSpace" @click="startEditing">编辑便签</button>
      </div>
    </header>

    <div class="board-zoom-tools">
      <button
        type="button"
        class="board-zoom-toggle"
        aria-controls="board-zoom-panel"
        :aria-expanded="isZoomPanelOpen"
        @click="isZoomPanelOpen = !isZoomPanelOpen"
      >
        Aa 字号
      </button>

      <div v-if="isZoomPanelOpen" id="board-zoom-panel" class="board-zoom-panel">
        <p class="board-zoom-hint">按区块放大。数值是倍数，1.00 就是原大小。调好后把下面那行发我，我写死成默认值。</p>

        <div v-for="block in BOARD_ZOOM_BLOCKS" :key="block.key" class="board-zoom-row">
          <span class="board-zoom-label">{{ block.label }}</span>
          <button type="button" :aria-label="`缩小${block.label}`" @click="stepBoardZoom(block.key, -1)">−</button>
          <output class="board-zoom-value">{{ boardZoom[block.key].toFixed(2) }}</output>
          <button type="button" :aria-label="`放大${block.label}`" @click="stepBoardZoom(block.key, 1)">＋</button>
        </div>

        <div class="board-zoom-actions">
          <button type="button" @click="resetBoardZoom()">恢复 1.00</button>
          <button type="button" class="is-primary" @click="void copyBoardZoom()">{{ zoomCopyLabel }}</button>
        </div>

        <p class="board-zoom-summary">{{ boardZoomSummary }}</p>
      </div>
    </div>

    <p v-if="!isAuthenticatedSpace" class="shared-board-state">登录共享空间后，就能打开你们的展板。</p>
    <p v-else-if="isLoading" class="shared-board-state">正在打开展板…</p>
    <p v-else-if="feedback && !boardId" :class="['shared-board-feedback', feedbackClass]" role="status" aria-live="polite">{{ feedback }}</p>
    <template v-else>
      <div v-if="feedback || hasRemoteChanges" class="shared-board-notice" :class="{ 'is-danger': feedbackTone === 'danger' || hasRemoteChanges }" role="status" aria-live="polite">
        <span>{{ hasRemoteChanges ? '心舒刚更新了展板。重新载入后再编辑，避免覆盖她的内容。' : feedback }}</span>
        <button v-if="hasRemoteChanges" type="button" @click="reloadLatestBoard">重新载入</button>
      </div>

      <div v-if="isEditing" class="shared-board-title-field">
        <label for="shared-board-title">展板标题</label>
        <input id="shared-board-title" v-model="draftTitle" maxlength="80" placeholder="我们的展板" />
      </div>

      <div ref="boardMainLayout" class="board-main-layout">
        <section class="board-progress-panel" :class="{ 'is-collapsed': collapsedSections.chart }" aria-label="愿望进度回看">
          <button
            type="button"
            class="board-collapse-bar"
            :aria-expanded="!collapsedSections.chart"
            @click="toggleCollapsedSection('chart')"
          >
            <span>推进分布 · 星币入账</span>
            <span class="board-collapse-caret" aria-hidden="true">⌄</span>
          </button>
          <BoardWeeklyCharts :refresh-token="chartRefreshToken" />
        </section>

        <div
          v-if="isFullscreen"
          class="board-splitter board-splitter-vertical"
          role="separator"
          aria-orientation="vertical"
          aria-label="调整进度和便签区域宽度"
          aria-valuemin="26"
          aria-valuemax="66"
          :aria-valuenow="Math.round(leftPaneRatio)"
          tabindex="0"
          @pointerdown="startSplitterDrag($event, 'vertical')"
          @pointermove="moveSplitterDrag"
          @pointerup="endSplitterDrag"
          @pointercancel="endSplitterDrag"
          @keydown="handleSplitterKeydown($event, 'vertical')"
        ><span aria-hidden="true"></span></div>

        <section class="board-notes-panel" aria-label="共享便签">
          <header class="board-section-heading board-notes-heading">
            <h3>{{ isEditing ? '整理便签' : '便签' }}</h3>
            <span class="board-note-count">{{ isEditing ? draftBlocks.length : boardBlocks.length }}</span>
          </header>
          <div v-if="isEditing ? draftBlocks.length : boardBlocks.length" class="shared-board-wall">
            <article
              v-for="(block, index) in (isEditing ? draftBlocks : boardBlocks)"
              :key="block.id"
              class="board-note"
              :class="[`board-note-tone-${index % 3}`, { 'is-long-note': block.text.length > 260 }]"
            >
              <template v-if="isEditing">
                <div class="board-note-toolbar">
                  <span>便签 {{ `${index + 1}`.padStart(2, '0') }}</span>
                  <div class="board-note-order-actions">
                    <button type="button" :disabled="index === 0" :aria-label="`将便签 ${index + 1} 上移`" @click="moveTextBlock(block.id, -1)">↑</button>
                    <button type="button" :disabled="index === draftBlocks.length - 1" :aria-label="`将便签 ${index + 1} 下移`" @click="moveTextBlock(block.id, 1)">↓</button>
                    <button v-if="draftBlocks.length > 1" type="button" :aria-label="`删除便签 ${index + 1}`" @click="removeTextBlock(block.id)">移除</button>
                  </div>
                </div>
                <input v-model="block.title" class="board-note-title-input" maxlength="80" :aria-label="`便签 ${index + 1} 标题`" placeholder="给这张便签起个小标题" />
                <textarea v-model="block.text" rows="5" maxlength="12000" :aria-label="`便签 ${index + 1} 内容`" placeholder="写下你们想记住的事…" />
              </template>
              <template v-else>
                <h3 v-if="block.title">{{ block.title }}</h3>
                <p>{{ block.text }}</p>
              </template>
            </article>
          </div>
          <div v-else class="board-notes-empty">
            <p>暂无便签</p>
            <button v-if="isEditing" type="button" @click="addTextBlock">＋ 写第一张便签</button>
          </div>
          <button v-if="isEditing" class="shared-board-add-button" type="button" @click="addTextBlock">＋ 添加便签</button>
        </section>
      </div>

      <div
        v-if="isFullscreen"
        class="board-splitter board-splitter-horizontal"
        role="separator"
        aria-orientation="horizontal"
        aria-label="调整上部内容和待办区域高度"
        aria-valuemin="48"
        aria-valuemax="82"
        :aria-valuenow="Math.round(upperPaneRatio)"
        tabindex="0"
        @pointerdown="startSplitterDrag($event, 'horizontal')"
        @pointermove="moveSplitterDrag"
        @pointerup="endSplitterDrag"
        @pointercancel="endSplitterDrag"
        @keydown="handleSplitterKeydown($event, 'horizontal')"
      ><span aria-hidden="true"></span></div>

      <section ref="boardTodoPanel" class="board-todo-panel" :class="{ 'is-collapsed': collapsedSections.todo }" aria-label="待办清单">
        <button
          type="button"
          class="board-collapse-bar"
          :aria-expanded="!collapsedSections.todo"
          @click="toggleCollapsedSection('todo')"
        >
          <span>待办 · {{ openTodos.length ? `${openTodos.length} 项待完成` : '全部完成' }}</span>
          <span class="board-collapse-caret" aria-hidden="true">⌄</span>
        </button>
        <header class="board-todo-header">
          <div class="board-section-heading">
            <h3>待办</h3>
            <span class="board-todo-completion">{{ todoProgress.open }} 项待完成</span>
          </div>

          <div v-if="todoProgress.total" class="board-todo-progress">
            <div
              class="board-todo-progress-track"
              role="img"
              :aria-label="`已完成 ${todoProgress.done} / ${todoProgress.total}`"
            >
              <span class="board-todo-progress-fill" :style="{ width: `${todoProgress.percent}%` }"></span>
            </div>
            <span class="board-todo-progress-label">{{ todoProgress.done }} / {{ todoProgress.total }}</span>
          </div>
        </header>

        <div class="board-todo-table">
          <div class="board-todo-list">
            <article
              v-for="todo in openTodos"
              :key="todo.id"
              class="board-todo-row"
              :class="{ 'is-completing': completingTodoIds.includes(todo.id) }"
            >
              <label class="board-todo-check">
                <input
                  type="checkbox"
                  :checked="completingTodoIds.includes(todo.id)"
                  :aria-label="`完成：${todo.title}`"
                  @change="completeTodo(todo)"
                />
              </label>

              <div class="board-todo-body">
                <input
                  v-if="editingTitleId === todo.id"
                  :ref="focusTodoTitleInput"
                  v-model="todoTitleDraft"
                  class="board-todo-title-input"
                  aria-label="事项"
                  maxlength="240"
                  @keydown.enter.prevent="void saveTodoTitle(todo)"
                  @keydown.esc.prevent="cancelTodoTitleEdit()"
                  @blur="void saveTodoTitle(todo)"
                />
                <strong v-else class="board-todo-title" @click="startTodoTitleEdit(todo)">{{ todo.title }}</strong>

                <ul v-if="editingTodoId !== todo.id && todo.subtasks.length" class="board-todo-subtasks">
                  <li v-for="subtask in todo.subtasks" :key="subtask.id">
                    <label>
                      <input
                        type="checkbox"
                        :checked="subtask.is_done"
                        :aria-label="`完成小项：${subtask.title}`"
                        @change="toggleTodoSubtask(todo, subtask.id)"
                      />
                      <span class="board-todo-subtask-title" :class="{ 'is-done': subtask.is_done }">{{ subtask.title }}</span>
                    </label>
                  </li>
                </ul>

                <div v-if="editingTodoId === todo.id && todoEditDraft" class="board-todo-edit-panel">
                  <div class="board-todo-edit-field">
                    <span class="board-todo-edit-label">负责人</span>
                    <select v-model="todoEditDraft.assignee_id" aria-label="所有者">
                      <option value="">所有人</option>
                      <option v-for="member in authStore.members" :key="member.id" :value="member.id">{{ member.displayName }}</option>
                    </select>
                  </div>

                  <div class="board-todo-edit-field">
                    <span class="board-todo-edit-label">目标日期</span>
                    <input v-model="todoEditDraft.due_date" aria-label="目标日期" type="date" />
                  </div>

                  <div class="board-todo-edit-field is-block">
                    <span class="board-todo-edit-label">清单</span>
                    <ul v-if="todoEditDraft.subtasks.length" class="board-todo-subtasks is-editing">
                      <li v-for="subtask in todoEditDraft.subtasks" :key="subtask.id">
                        <label>
                          <input v-model="subtask.is_done" type="checkbox" />
                          <input v-model="subtask.title" aria-label="小项标题" />
                        </label>
                      </li>
                    </ul>
                    <div class="board-todo-subtask-add">
                      <input v-model="todoEditSubtaskTitle" aria-label="新增小项" placeholder="添加小项" @keydown.enter.prevent="addTodoEditSubtask" />
                      <button type="button" @click="addTodoEditSubtask">添加</button>
                    </div>
                  </div>

                  <div class="board-todo-edit-actions">
                    <button type="button" @click="cancelEditingTodo()">取消</button>
                    <button type="button" class="is-primary" @click="void saveTodoDetails()">保存</button>
                  </div>
                </div>
              </div>

              <div class="board-todo-meta">
                <span v-if="todo.subtasks.length" class="board-todo-subtask-badge">{{ subtaskDoneCount(todo) }}/{{ todo.subtasks.length }}</span>
                <span class="board-todo-owner">{{ todoOwnerLabel(todo) }}</span>
                <time class="board-todo-due" :datetime="todo.due_date">{{ formatBoardDueDate(todo.due_date) }}</time>
              </div>

              <div v-if="editingTodoId !== todo.id" class="board-todo-row-actions">
                <button type="button" :aria-label="`编辑待办：${todo.title}`" @click="startEditingTodo(todo)">编辑</button>
                <button type="button" class="board-todo-remove" :aria-label="`删除待办：${todo.title}`" @click="void deleteTodo(todo.id)">删除</button>
              </div>
            </article>

            <p v-if="!todoProgress.total" class="board-todo-empty">还没有待办。</p>
            <p v-else-if="!openTodos.length" class="board-todo-empty">都做完了。</p>

            <div v-if="todoProgress.done" class="board-todo-done-group">
              <button
                type="button"
                class="board-todo-done-summary"
                :aria-expanded="showDoneTodos"
                @click="toggleShowDoneTodos()"
              >
                <span class="board-todo-done-caret" :class="{ 'is-open': showDoneTodos }" aria-hidden="true"></span>
                已完成 {{ todoProgress.done }}
              </button>

              <div v-if="showDoneTodos" class="board-todo-done-list">
                <article v-for="todo in doneTodos" :key="todo.id" class="board-todo-row is-done">
                  <label class="board-todo-check">
                    <input
                      type="checkbox"
                      :checked="true"
                      :aria-label="`取消完成：${todo.title}`"
                      @change="void updateTodo(todo.id, { is_done: false })"
                    />
                  </label>

                  <div class="board-todo-body">
                    <strong class="board-todo-title">{{ todo.title }}</strong>
                    <ul v-if="todo.subtasks.length" class="board-todo-subtasks">
                      <li v-for="subtask in todo.subtasks" :key="subtask.id">
                        <span class="board-todo-subtask-title" :class="{ 'is-done': subtask.is_done }">{{ subtask.title }}</span>
                      </li>
                    </ul>
                  </div>

                  <div class="board-todo-meta">
                    <span v-if="todo.subtasks.length" class="board-todo-subtask-badge">{{ subtaskDoneCount(todo) }}/{{ todo.subtasks.length }}</span>
                    <span class="board-todo-owner">{{ todoOwnerLabel(todo) }}</span>
                    <time class="board-todo-due" :datetime="todo.due_date">{{ formatBoardDueDate(todo.due_date) }}</time>
                  </div>

                  <div class="board-todo-row-actions">
                    <button type="button" class="board-todo-remove" :aria-label="`删除待办：${todo.title}`" @click="void deleteTodo(todo.id)">删除</button>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isTodoComposerOpen" class="board-todo-composer">
          <input v-model="todoDraftTitle" aria-label="待办标题" placeholder="写一项要做的事" maxlength="240" @keydown.enter.prevent="void createTodo()" />
          <input v-model="todoDraftDate" aria-label="到期日" type="date" />
          <select v-model="todoDraftAssignee" aria-label="负责人"><option value="">所有人</option><option v-for="member in authStore.members" :key="member.id" :value="member.id">{{ member.displayName }}</option></select>
          <div v-if="todoDraftSubtasks.length" class="board-todo-draft-subtasks"><label v-for="subtask in todoDraftSubtasks" :key="subtask.id"><input v-model="subtask.is_done" type="checkbox" /><span>{{ subtask.title }}</span></label></div>
          <div class="board-todo-subtask-add"><input v-model="todoSubtaskTitle" aria-label="添加小项" placeholder="小项（可选）" @keydown.enter.prevent="addTodoDraftSubtask" /><button type="button" @click="addTodoDraftSubtask">添加小项</button></div>
          <div class="board-todo-composer-actions"><button type="button" @click="isTodoComposerOpen = false">取消</button><button type="button" :disabled="isCreatingTodo || !todoDraftTitle.trim()" @click="void createTodo()">{{ isCreatingTodo ? '添加中…' : '添加待办' }}</button></div>
        </div>
        <button v-else class="board-todo-add-button" type="button" @click="todoDraftDate = getBeijingDateKey(); isTodoComposerOpen = true">＋ 添加待办</button>
      </section>

    </template>
  </section>
</template>

<script lang="ts">
export function formatBoardTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatBoardDueDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}
</script>

<style scoped>
.shared-board-page {
  --bg: #f5f6f4;
  --surface-card: #fdfdfa;
  --surface-soft: #eff1ee;
  --input-bg: #fdfdfa;
  --text-main: #2b3430;
  --text-soft: #69736e;
  --line: rgba(54, 69, 60, 0.12);
  --line-strong: rgba(54, 69, 60, 0.24);
  --card-border: rgba(54, 69, 60, 0.14);
  width: min(100%, 960px);
  min-height: calc(100dvh - 210px);
  margin: 0 auto;
  padding: 1.1rem 0 5.5rem;
}

.shared-board-page.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  max-width: none;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  padding: calc(0.35rem + env(safe-area-inset-top, 0px)) max(0.75rem, env(safe-area-inset-right, 0px)) calc(0.55rem + env(safe-area-inset-bottom, 0px)) max(0.75rem, env(safe-area-inset-left, 0px));
  overflow: hidden;
  overscroll-behavior: contain;
  background: var(--bg);
}

.shared-board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 0.4rem 0 1.1rem;
}

.shared-board-heading {
  min-width: 0;
}

.shared-board-header h2 {
  margin: 0.3rem 0 0;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 1.65rem;
  line-height: 1.25;
}

.shared-board-kicker,

.shared-board-meta {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-l7-size);
  line-height: var(--type-l7-line);
}

.shared-board-kicker {
  color: var(--accent-dark);
  font-weight: 600;
}

.shared-board-meta {
  margin-top: 0.28rem;
}

.shared-board-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 0.5rem;
}

.board-fullscreen-button {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  color: var(--text-main);
  background: var(--surface-card);
  font: inherit;
  font-size: 1.25rem;
  line-height: 1;
  touch-action: manipulation;
}

.board-fullscreen-button:hover {
  border-color: var(--accent-border);
  background: var(--accent-panel);
}

.shared-board-page.is-fullscreen .shared-board-header {
  align-items: center;
  min-height: 42px;
  margin: 0;
  padding: 0 0.15rem 0.35rem;
  border-bottom: 1px solid var(--line);
}

.shared-board-page.is-fullscreen .shared-board-kicker,

.shared-board-page.is-fullscreen .shared-board-meta {
  display: none;
}

.shared-board-page.is-fullscreen .shared-board-header h2 {
  margin: 0;
  font-size: 1.05rem;
}

.board-main-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.82fr) minmax(0, 1.18fr);
  gap: 0.7rem;
  min-height: 0;
}

.board-progress-panel,

.board-notes-panel,

.board-todo-panel {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.board-progress-panel,

.board-notes-panel {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.75rem;
}

.board-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.board-section-heading p {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-l7-size);
}

.board-section-heading h3 {
  margin: 0.08rem 0 0;
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.35;
}

.board-period-caption,

.board-note-count,

.board-todo-completion {
  flex: 0 0 auto;
  color: var(--text-soft);
  font-size: var(--type-l7-size);
}

.board-progress-days {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.65rem;
}

.board-progress-day {
  padding: 0.65rem 0.7rem;
  border-radius: 9px;
  background: var(--surface-soft);
}

.board-progress-day.is-today {
  background: color-mix(in srgb, var(--accent-panel) 58%, var(--surface-soft));
}

.board-progress-day > header {
  display: flex;
  justify-content: space-between;
  color: var(--text-main);
  font-size: 0.82rem;
}

.board-progress-day > header span,

.board-progress-day small {
  color: var(--text-soft);
  font-size: 0.68rem;
}

.board-progress-day ul,

.board-todo-subtasks {
  display: grid;
  gap: 0.4rem;
  margin: 0.55rem 0 0;
  padding: 0;
  list-style: none;
}

.board-progress-day li {
  display: grid;
  grid-template-columns: 7px minmax(0, 1fr);
  gap: 0.45rem;
  align-items: start;
}

.board-progress-dot {
  width: 6px;
  height: 6px;
  margin-top: 0.42rem;
  border-radius: 50%;
  background: var(--accent-dark);
}

.board-progress-day li strong {
  display: block;
  overflow: hidden;
  color: var(--text-main);
  font-size: 0.76rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-progress-day li p {
  display: -webkit-box;
  margin: 0.1rem 0;
  overflow: hidden;
  color: var(--text-main);
  font-size: 0.74rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.board-progress-empty {
  margin: 0.55rem 0 0;
  color: var(--text-soft);
  font-size: 0.75rem;
}

.board-notes-panel .shared-board-wall {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  padding: 0.6rem 0 0;
}

.board-notes-panel .board-note {
  min-height: 100px;
  padding: 0.8rem;
  border-radius: 8px;
  box-shadow: none;
}

.board-notes-panel .board-note h3 {
  margin: 0 0 0.45rem;
  font-family: var(--font-body);
  font-size: 0.96rem;
}

.board-notes-panel .board-note p {
  font-size: 0.84rem;
  line-height: 1.55;
}

.board-notes-panel .board-note.is-long-note {
  grid-column: 1 / -1;
}

.board-notes-panel .board-note-toolbar > span,

.board-notes-panel .board-note-topline > span:first-child {
  font-size: 0.64rem;
}

.board-notes-panel .board-note-order-actions button {
  min-width: 38px;
  min-height: 38px;
  padding: 0.25rem 0.4rem;
}

.board-notes-panel .board-note-title-input {
  margin: 0.35rem 0 0.25rem;
  font-size: 0.9rem;
}

.board-notes-panel .board-note textarea {
  min-height: 5rem;
  font-size: 0.82rem;
  line-height: 1.5;
}

.board-notes-panel .shared-board-empty {
  padding: 1.2rem 0.7rem;
  margin-top: 0.6rem;
}

.board-notes-panel .shared-board-empty-mark {
  font-size: 1.15rem;
}

.board-notes-panel .shared-board-empty h3 {
  font-size: 0.96rem;
}

.board-notes-panel .shared-board-empty p {
  font-size: 0.76rem;
}

.board-notes-panel .shared-board-add-button {
  min-height: 40px;
  margin-top: 0.55rem;
}

.board-todo-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 0.6rem 0.72rem;
  border-top: 1px solid var(--line-strong);
}

.board-todo-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.45rem;
}

.board-todo-table {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: 7px;
  background: var(--surface-card);
}

.board-todo-list {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.board-todo-row > * {
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border-right: 1px solid var(--line);
}

.board-todo-row > *:last-child {
  border-right: 0;
}

.board-todo-row {
  display: grid;
  grid-template-columns: 32px minmax(160px, 1.35fr) minmax(100px, 0.75fr) minmax(110px, 0.8fr) minmax(170px, 1.2fr) 44px;
  align-items: stretch;
  min-height: 56px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-card);
}

.board-todo-row:last-of-type {
  border-bottom: 0;
}

.board-todo-check {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.55rem;
  min-width: 0;
}

.board-todo-check input,

.board-todo-subtasks input,

.board-todo-draft-subtasks input {
  width: 20px;
  height: 20px;
  accent-color: var(--accent-dark);
}

.board-todo-subtasks {
  display: grid;
  gap: 0.12rem;
  margin: -0.2rem 0 0;
  padding: 0;
  list-style: none;
}

.board-todo-subtasks li label,

.board-todo-draft-subtasks label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--text-main);
  font-size: 0.8rem;
  min-height: 30px;
}

.board-todo-subtasks li,

.board-todo-subtasks label,

.board-todo-subtasks label > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.board-todo-subtasks input[type='checkbox'] {
  flex: 0 0 18px;
}

.board-todo-subtasks input,

.board-todo-draft-subtasks input {
  width: 18px;
  height: 18px;
}

.board-todo-subtasks input:not([type='checkbox']) {
  width: auto;
  min-width: 40px;
  flex: 1 1 auto;
}

.board-todo-subtasks .is-done {
  text-decoration: line-through;
  opacity: 0.68;
}

.board-todo-row-actions {
  display: flex;
  justify-content: center;
  padding: 0.3rem 0.1rem !important;
}

.board-todo-row-actions button {
  min-width: 36px;
  min-height: 34px;
  padding: 0.2rem 0.35rem;
  border: 0;
  border-radius: 7px;
  color: var(--text-soft);
  background: transparent;
  font: inherit;
  font-size: 0.68rem;
}

.board-todo-row-actions button:hover {
  background: var(--surface-soft);
}

.board-todo-empty {
  margin: 0;
  padding: 0.85rem 0.4rem;
  color: var(--text-soft);
  font-size: 0.78rem;
}

.board-todo-add-button {
  min-height: 38px;
  flex: 0 0 auto;
  margin-top: 0.4rem;
  border: 0;
  border-top: 1px solid var(--line);
  border-radius: 0;
  color: var(--text-soft);
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
}

.board-todo-composer {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) 140px 130px;
  gap: 0.4rem;
  flex: 0 0 auto;
  overflow-y: auto;
  max-height: 45%;
  padding-top: 0.45rem;
}

.board-todo-composer > input,

.board-todo-composer > select,

.board-todo-subtask-add input {
  min-width: 0;
  min-height: 36px;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: var(--text-main);
  background: var(--input-bg);
  font: inherit;
  font-size: 0.75rem;
}

.board-todo-draft-subtasks,

.board-todo-subtask-add,

.board-todo-composer-actions {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.board-todo-subtask-add button,

.board-todo-composer-actions button {
  min-height: 36px;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: var(--text-main);
  background: var(--surface-soft);
  font: inherit;
  font-size: 0.75rem;
}

.board-todo-composer-actions {
  justify-content: flex-end;
}

.shared-board-page.is-fullscreen > .board-main-layout {
  flex: var(--board-upper-fr) 1 0;
  grid-template-columns: minmax(0, var(--board-left-pane)) 6px minmax(0, 1fr);
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

.shared-board-page.is-fullscreen {
  gap: 2px;
}

.board-splitter {
  position: relative;
  z-index: 4;
  display: none;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.board-splitter span {
  display: block;
  border-radius: 999px;
  background: color-mix(in srgb, var(--line-strong) 75%, transparent);
  transition: background 140ms ease, transform 140ms ease;
}

.board-splitter:hover span,

.board-splitter:focus-visible span,

.board-splitter:active span {
  background: var(--accent-border);
}

.board-splitter-vertical {
  display: flex;
  width: 6px;
  margin: 0;
  cursor: col-resize;
}

.board-splitter::before {
  content: '';
  position: absolute;
}

.board-splitter-vertical::before {
  top: 0;
  bottom: 0;
  left: -11px;
  right: -11px;
}

.board-splitter-vertical span {
  width: 2px;
  height: 38px;
}

.board-splitter-horizontal {
  display: flex;
  flex: 0 0 6px;
  width: 100%;
  margin: 0;
  cursor: row-resize;
}

.board-splitter-horizontal::before {
  top: -11px;
  bottom: -11px;
  left: 0;
  right: 0;
}

.board-splitter-horizontal span {
  width: 52px;
  height: 2px;
}

.shared-board-page.is-fullscreen .board-progress-panel,

.shared-board-page.is-fullscreen .board-notes-panel {
  overflow-y: auto;
}

.shared-board-page.is-fullscreen > .board-todo-panel {
  flex: var(--board-lower-fr) 1 0;
  min-height: 0;
}

.shared-board-page.is-fullscreen .board-todo-header {
  padding-bottom: 0.35rem;
}

.shared-board-page.is-fullscreen .board-todo-row {
  min-height: 50px;
}

.shared-board-page.is-fullscreen .board-todo-add-button {
  min-height: 34px;
}

.shared-board-page.is-fullscreen .shared-board-title-field {
  margin: 0;
}

.shared-board-page.is-fullscreen .shared-board-title-field input {
  min-height: 38px;
}

.shared-board-primary-button,

.shared-board-quiet-button,

.shared-board-edit-button,

.shared-board-add-button,

.board-note-order-actions button {
  min-height: 44px;
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  color: var(--text-main);
  background: var(--surface-card);
  font: inherit;
  touch-action: manipulation;
}

.shared-board-primary-button {
  border-color: var(--accent-border);
  background: var(--accent-panel);
  font-weight: 600;
}

.shared-board-primary-button:disabled,

.shared-board-quiet-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.shared-board-state {
  padding: 2rem 0;
  color: var(--text-soft);
  line-height: 1.8;
}

.shared-board-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin: 0 0 0.9rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--accent-dark);
  background: var(--surface-soft);
  font-size: var(--type-l6-size);
}

.shared-board-notice.is-danger {
  color: #87483f;
  background: #f8ebe5;
}

.shared-board-notice button {
  min-height: 40px;
  flex: 0 0 auto;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  color: var(--text-main);
  background: var(--surface-card);
  font: inherit;
}

.shared-board-wall {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 0.9rem;
  padding: 0.35rem 0 1.2rem;
}

.board-note {
  min-width: 0;
  min-height: 170px;
  padding: 0.95rem 1rem 1.1rem;
  border: 1px solid var(--card-border);
  border-radius: 13px;
  background: var(--surface-card);
  box-shadow: 0 3px 10px rgba(78, 55, 39, 0.055);
  animation: board-appear 220ms ease both;
  animation-delay: calc(var(--block-index, 0) * 25ms);
}

.board-note-tone-1 {
  background: #f0f5f1;
}

.board-note-tone-2 {
  background: #f8f1ee;
}

.board-note.is-long-note {
  grid-column: 1 / -1;
}

.board-note-topline,

.board-note-toolbar,

.board-note-order-actions {
  display: flex;
  align-items: center;
}

.board-note-topline,

.board-note-toolbar {
  justify-content: space-between;
  gap: 0.6rem;
}

.board-note-topline > span:first-child,

.board-note-toolbar > span {
  color: var(--text-soft);
  font-size: var(--type-l7-size);
}

.board-note-pin {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-panel);
}

.board-note h3 {
  margin: 0.8rem 0 0.5rem;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 1.15rem;
  line-height: 1.45;
}

.board-note p {
  margin: 0;
  color: var(--text-main);
  font-size: 1rem;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.shared-board-title-field {
  display: grid;
  gap: 0.35rem;
  margin: 0.25rem 0 0.8rem;
}

.shared-board-title-field span {
  color: var(--text-soft);
  font-size: var(--type-l7-size);
}

.shared-board-title-field input {
  width: 100%;
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  padding: 0.65rem 0.75rem;
  color: var(--text-main);
  background: var(--input-bg);
  font: inherit;
  font-size: 1rem;
}

.board-note-title-input {
  width: 100%;
  margin: 0.75rem 0 0.5rem;
  padding: 0.35rem 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  outline-offset: 3px;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 1.12rem;
  font-weight: 600;
  background: transparent;
}

.board-note textarea {
  display: block;
  width: 100%;
  min-height: 10rem;
  padding: 0.2rem 0;
  border: 0;
  resize: vertical;
  outline-offset: 3px;
  color: var(--text-main);
  background: transparent;
  font: inherit;
  font-size: 1rem;
  line-height: 1.8;
}

.board-note-order-actions {
  gap: 0.35rem;
}

.board-note-order-actions button {
  min-width: 44px;
  min-height: 44px;
  padding: 0.45rem 0.65rem;
  color: var(--text-soft);
  font-size: var(--type-l7-size);
}

.board-note-order-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.shared-board-add-button {
  min-height: 48px;
  margin: 0.15rem 0 0;
  border-radius: 10px;
  border-style: dashed;
  color: var(--text-soft);
  background: var(--surface-card);
}

.shared-board-empty {
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  padding: 2.3rem 1rem;
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  text-align: center;
  background: var(--surface-card);
}

.shared-board-empty-mark {
  color: var(--accent-dark);
  font-size: 1.5rem;
}

.shared-board-empty h3,

.shared-board-empty p,

.shared-board-edit-hint {
  margin: 0;
}

.shared-board-empty h3 {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 1.15rem;
}

.shared-board-empty p,

.shared-board-edit-hint {
  color: var(--text-soft);
  line-height: 1.7;
}

.shared-board-edit-hint {
  margin-top: 0.7rem;
  font-size: var(--type-l7-size);
}

@keyframes board-appear {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 720px) {
  .shared-board-page {
    min-height: calc(100dvh - 170px);
    padding-top: 0.55rem;
  }

  .shared-board-header h2 {
    font-size: 1.3rem;
  }

  .shared-board-wall {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }

  .board-note.is-long-note {
    grid-column: auto;
  }

  .shared-board-header {
    align-items: flex-start;
  }

  .shared-board-page.is-fullscreen {
    display: block;
    height: 100vh;
    height: 100dvh;
    min-height: 100vh;
    min-height: 100dvh;
    overflow-y: auto;
    padding: calc(0.35rem + env(safe-area-inset-top, 0px)) max(0.7rem, env(safe-area-inset-right, 0px)) calc(1rem + env(safe-area-inset-bottom, 0px)) max(0.7rem, env(safe-area-inset-left, 0px));
  }

  .shared-board-page.is-fullscreen .shared-board-header {
    position: sticky;
    top: calc(-0.35rem - env(safe-area-inset-top, 0px));
    z-index: 5;
    margin: calc(-0.35rem - env(safe-area-inset-top, 0px)) 0 0.65rem;
    padding: calc(0.5rem + env(safe-area-inset-top, 0px)) 0 0.55rem;
    background: var(--bg);
  }

  .shared-board-page.is-fullscreen > .board-main-layout {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .shared-board-page.is-fullscreen .board-splitter {
    display: none;
  }

  .shared-board-page.is-fullscreen .board-progress-panel,

  .shared-board-page.is-fullscreen .board-notes-panel {
    max-height: none;
    overflow: visible;
  }

  .shared-board-page.is-fullscreen > .board-todo-panel {
    flex: initial;
    min-height: 280px;
    margin-top: 0.7rem;
    overflow: visible;
  }

  .board-todo-panel {
    overflow: visible;
  }

  .board-todo-table {
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .board-todo-list {
    display: grid;
    gap: 0.55rem;
    overflow: visible;
  }

  .board-todo-row {
    grid-template-columns: 30px minmax(0, 1fr) 44px;
    min-height: 0;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface-card);
  }

  .board-todo-row > * {
    border-right: 0;
  }

  .board-todo-row-actions {
    grid-column: 3;
    grid-row: 1;
  }

  .board-todo-subtasks {
    display: inline-grid;
    vertical-align: top;
    width: calc(100% - 4.4rem);
  }

  .board-todo-composer {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 721px) and (max-width: 820px) {
  .shared-board-wall {
    grid-template-columns: 1fr;
  }

  .board-note.is-long-note {
    grid-column: auto;
  }

}

@media (min-width: 721px) and (min-height: 900px), (min-width: 900px) and (orientation: landscape) {
  .shared-board-page.is-fullscreen {
    display: flex;
  }

  .shared-board-page.is-fullscreen > .board-main-layout {
    grid-template-columns: minmax(0, var(--board-left-pane)) 6px minmax(0, 1fr);
  }
}

@media (min-width: 721px) and (max-width: 899px) and (orientation: landscape) {
  .shared-board-page.is-fullscreen {
    display: block;
    height: 100vh;
    height: 100dvh;
    min-height: 100vh;
    min-height: 100dvh;
    overflow-y: auto;
  }

  .shared-board-page.is-fullscreen > .board-main-layout {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .shared-board-page.is-fullscreen .board-progress-panel,

  .shared-board-page.is-fullscreen .board-notes-panel {
    max-height: none;
    overflow: visible;
  }

  .shared-board-page.is-fullscreen > .board-todo-panel {
    flex: initial;
    min-height: 280px;
    margin-top: 0.7rem;
    overflow: visible;
  }

  .shared-board-page.is-fullscreen .board-splitter {
    display: none;
  }
}

@media (min-width: 721px) and (max-width: 1180px) and (min-height: 721px) {
  .shared-board-page.is-fullscreen {
    gap: 0.35rem;
  }

  .shared-board-page.is-fullscreen .shared-board-header h2 {
    font-size: 2.25rem;
  }

  .shared-board-page.is-fullscreen .board-progress-panel,

  .shared-board-page.is-fullscreen .board-notes-panel {
    padding: 0.55rem;
  }

  .shared-board-page.is-fullscreen .board-section-heading h3 {
    font-size: 2.05rem;
  }

  .shared-board-page.is-fullscreen .board-note h3 {
    font-size: 2.05rem;
  }

  .shared-board-page.is-fullscreen .board-note p {
    font-size: 1.9rem;
    line-height: 1.45;
  }

  .shared-board-page.is-fullscreen .board-todo-subtasks li label {
    font-size: 1.72rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .board-note {
    animation: none;
  }
}

/* ── 待办清单 v2 ────────────────────────────────────────────────
   从「电子表格」改成「清单」。旧的表格样式仍在上方，这一节放在文件末尾，
   靠「同作用域内后置覆盖」生效：
     去掉表头行与单元格边框 · 去掉序号列 · 子项移到标题下方 ·
     勾选框改为自绘圆形 · 已完成收进底部可折叠分组
   注意：操作按钮**不做 hover 才显示** —— 主要使用设备是 iPad，
   触屏没有 hover，藏起来就点不到了。
   ───────────────────────────────────────────────────────────── */

/* 整块面板做成一张卡片：头部与列表都透明，由面板统一提供底色。
   否则列表会直接露出展板的青绿底，看起来很脏。 */
.board-todo-panel {
  padding: 0.7rem 0.75rem 0.75rem;
  border-radius: 12px;
  background: var(--surface-card);
}

.board-todo-header {
  align-items: center;
  gap: 0.75rem;
  background: transparent;
}

.board-todo-completion {
  color: var(--text-soft);
  font-size: var(--type-l7-size, 0.78rem);
  font-weight: 600;
}

.board-todo-progress {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-left: auto;
}

.board-todo-progress-track {
  width: 96px;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-soft);
  box-shadow: inset 0 0 0 1px var(--line);
}

.board-todo-progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--success);
  transition: width 0.35s ease;
}

.board-todo-progress-label {
  color: var(--text-soft);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

/* 容器：去掉表格边框与表头行，改用分隔线（底色由面板提供） */
.board-todo-table {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.board-todo-list {
  padding: 0.1rem 0;
}

/* 单行：由 6 列 grid 改为 flex 清单行 */
.board-todo-row {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  min-height: 0;
  padding: 0.7rem 0.4rem;
  border-bottom: 1px solid var(--line);
  background: transparent;
  transition: background 0.15s ease, opacity 0.3s ease;
}

.board-todo-row:hover {
  background: var(--surface-soft);
}

.board-todo-row > * {
  min-width: 0;
  padding: 0;
  border-right: 0;
}

/* 勾选框：自绘圆形 + 对勾（appearance: none 覆盖浏览器默认外观） */
.board-todo-check {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  padding-top: 0.1rem;
}

.board-todo-check input[type='checkbox'],

.board-todo-subtasks input[type='checkbox'] {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: 0;
  /* 未勾选时是「空环」，不能填成实心 —— 实心浅色圆看起来就是个白点，
     而且旧样式给 checkbox 加了 padding，不重置 box-sizing 会让它胀大 */
  border: 1.5px solid var(--text-soft);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  appearance: none;
  -webkit-appearance: none;
}

.board-todo-subtasks input[type='checkbox'] {
  width: 16px;
  height: 16px;
  border-width: 1.25px;
}

.board-todo-check input[type='checkbox']:hover,

.board-todo-subtasks input[type='checkbox']:hover {
  border-color: var(--accent);
  background: var(--accent-panel);
}

.board-todo-check input[type='checkbox']:checked,

.board-todo-subtasks input[type='checkbox']:checked {
  border-color: var(--success);
  background: var(--success);
}

.board-todo-check input[type='checkbox']::after,

.board-todo-subtasks input[type='checkbox']::after {
  content: '';
  width: 4px;
  height: 8px;
  border: solid var(--accent-contrast);
  border-width: 0 1.75px 1.75px 0;
  transform: rotate(45deg) translate(-0.5px, -1px) scale(0);
  transition: transform 0.14s ease;
}

.board-todo-subtasks input[type='checkbox']::after {
  width: 3px;
  height: 6px;
}

.board-todo-check input[type='checkbox']:checked::after,

.board-todo-subtasks input[type='checkbox']:checked::after {
  transform: rotate(45deg) translate(-0.5px, -1px) scale(1);
}

.board-todo-check input[type='checkbox']:focus-visible,

.board-todo-subtasks input[type='checkbox']:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* 主体：标题在上，子项缩进在下方 */
.board-todo-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.board-todo-title {
  color: var(--text-main);
  font-size: var(--type-l6-size, 0.95rem);
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
  cursor: text;
}

.board-todo-title:hover {
  color: var(--accent-dark);
}

.board-todo-title-input {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--accent-border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-main);
  font: inherit;
  font-weight: 600;
}

.board-todo-subtasks {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.board-todo-subtasks li {
  border: 0;
}

.board-todo-subtasks li label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.board-todo-subtask-title {
  color: var(--text-soft);
  font-size: 0.8rem;
  line-height: 1.45;
}

.board-todo-subtask-title.is-done {
  text-decoration: line-through;
  opacity: 0.65;
}

.board-todo-subtasks input:not([type='checkbox']) {
  padding: 0.25rem 0.45rem;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--input-bg);
  color: var(--text-main);
  font: inherit;
  font-size: 0.8rem;
}

/* 右侧次要信息：负责人 · 日期 · 子项完成度 */
.board-todo-meta {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.6rem;
  padding-top: 0.15rem;
  color: var(--text-soft);
  font-size: 0.72rem;
  white-space: nowrap;
}

.board-todo-subtask-badge {
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: var(--surface-soft);
  font-variant-numeric: tabular-nums;
}

.board-todo-due {
  font-variant-numeric: tabular-nums;
}

/* 操作按钮：始终可见（触屏没有 hover），hover 时再加重 */
.board-todo-row-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.25rem;
  padding-top: 0.1rem;
  opacity: 0.8;
  transition: opacity 0.15s ease;
}

.board-todo-row:hover .board-todo-row-actions,

.board-todo-row:focus-within .board-todo-row-actions {
  opacity: 1;
}

.board-todo-row-actions button {
  padding: 0.28rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-soft);
  font: inherit;
  font-size: 0.74rem;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.board-todo-row-actions button:hover {
  border-color: var(--line);
  background: var(--surface-card);
  color: var(--accent-dark);
}

.board-todo-row-actions .board-todo-remove:hover {
  border-color: var(--danger-border);
  background: var(--danger-panel);
  color: var(--danger);
}

/* 完成瞬间：先划掉并淡出，稍后才收进「已完成」 */
.board-todo-row.is-completing {
  background: var(--success-panel);
  opacity: 0.55;
}

.board-todo-row.is-completing .board-todo-title,

.board-todo-row.is-completing .board-todo-subtask-title {
  text-decoration: line-through;
}

/* 已完成分组 */
.board-todo-done-group {
  margin-top: 0.35rem;
  border-top: 1px dashed var(--line);
}

.board-todo-done-summary {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.6rem 0.4rem;
  border: 0;
  background: transparent;
  color: var(--text-soft);
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.board-todo-done-summary:hover {
  color: var(--accent-dark);
}

.board-todo-done-caret {
  width: 0;
  height: 0;
  border-top: 3.5px solid transparent;
  border-bottom: 3.5px solid transparent;
  border-left: 4px solid currentColor;
  transition: transform 0.15s ease;
}

.board-todo-done-caret.is-open {
  transform: rotate(90deg);
}

.board-todo-done-list {
  opacity: 0.85;
}

.board-todo-row.is-done .board-todo-title {
  color: var(--text-soft);
  text-decoration: line-through;
}

/* 编辑面板：展开在标题下方，而不是把整行的每一格都变成表单 */
.board-todo-edit-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.6rem;
  margin-top: 0.25rem;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.board-todo-edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.board-todo-edit-field.is-block {
  flex: 1 1 100%;
}

.board-todo-edit-label {
  color: var(--text-soft);
  font-size: 0.68rem;
  font-weight: 600;
}

.board-todo-edit-panel select,

.board-todo-edit-panel input[type='date'] {
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-main);
  font: inherit;
  font-size: 0.8rem;
}

.board-todo-edit-actions {
  display: flex;
  gap: 0.4rem;
  margin-left: auto;
}

.board-todo-edit-actions button {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: var(--surface-card);
  color: var(--text-main);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.board-todo-edit-actions .is-primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-contrast);
}

/* 空状态与添加入口 */
.board-todo-empty {
  padding: 1.1rem 0.4rem;
  color: var(--text-soft);
  font-size: 0.8rem;
  text-align: center;
}

.board-todo-add-button {
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  background: transparent;
  color: var(--text-soft);
}

.board-todo-add-button:hover {
  border-color: var(--accent);
  background: var(--accent-panel);
  color: var(--accent-dark);
}

@media (max-width: 720px) {
  .board-todo-row {
    flex-wrap: wrap;
  }

  .board-todo-check {
    order: 1;
  }

  .board-todo-body {
    order: 2;
    flex: 1 1 0;
  }

  .board-todo-row-actions {
    order: 3;
  }

  .board-todo-meta {
    order: 4;
    flex: 1 1 100%;
    margin-left: 1.75rem;
    padding-top: 0;
  }

  .board-todo-progress-track {
    width: 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .board-todo-row,
  .board-todo-progress-fill,
  .board-todo-done-caret,
  .board-todo-check input[type='checkbox'],
  .board-todo-subtasks input[type='checkbox'],
  .board-todo-check input[type='checkbox']::after,
  .board-todo-subtasks input[type='checkbox']::after {
    transition: none;
  }
}
/* ── 全屏看板：按区块放大 ───────────────────────────────────────
   为什么不用 zoom：在 iPad 的 WebKit 上，zoom 只放大了版面盒子，
   字形没有跟着变大 —— 实测四个区块的文字全都不动，只有边框和间距在变。
   所以图表 / 便签 / 待办改用 transform: scale()：它是绘制层面的缩放，
   任何引擎都会连字形一起放大。
   transform 不改变布局占位，因此按比例补偿宽高，让视觉尺寸仍等于原面板区域。 */

.shared-board-page.is-fullscreen {
  /* iOS Safari 会对文字做「自动调整」以保持可读，这会覆盖页面设定的字号，
     明确关掉它，字号才由我们说了算。 */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* 看板标题：走改字号。
   它由内容撑高，用缩放会和下方内容重叠，所以只能改字号。
   全屏下 h2 的原始字号是 1.05rem。 */
.shared-board-page.is-fullscreen .shared-board-header h2 {
  font-size: calc(1.05rem * var(--board-zoom-header, 1));
}

.shared-board-page.is-fullscreen .board-progress-panel,
.shared-board-page.is-fullscreen .board-notes-panel,
.shared-board-page.is-fullscreen > .board-todo-panel {
  transform-origin: top left;
}

.shared-board-page.is-fullscreen .board-progress-panel {
  transform: scale(var(--board-zoom-chart, 1));
  width: calc(100% / var(--board-zoom-chart, 1));
  height: calc(100% / var(--board-zoom-chart, 1));
}

.shared-board-page.is-fullscreen .board-notes-panel {
  transform: scale(var(--board-zoom-notes, 1));
  width: calc(100% / var(--board-zoom-notes, 1));
  height: calc(100% / var(--board-zoom-notes, 1));
}

.shared-board-page.is-fullscreen > .board-todo-panel {
  transform: scale(var(--board-zoom-todo, 1));
  width: calc(100% / var(--board-zoom-todo, 1));
  height: calc(100% / var(--board-zoom-todo, 1));
}

/* 调参面板：固定在右下角，本身不参与任何区块的缩放 */
.board-zoom-tools {
  position: fixed;
  right: 0.9rem;
  bottom: 0.9rem;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  font-family: var(--font-body);
}

.board-zoom-toggle {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface-card);
  color: var(--text-main);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px var(--accent-shadow-soft);
}

.board-zoom-toggle:hover {
  border-color: var(--accent);
  color: var(--accent-dark);
}

.board-zoom-panel {
  width: min(22rem, calc(100vw - 1.8rem));
  padding: 0.85rem 0.9rem 0.75rem;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: 0 14px 34px var(--accent-shadow-soft);
}

.board-zoom-hint {
  margin: 0 0 0.55rem;
  color: var(--text-soft);
  font-size: 0.73rem;
  line-height: 1.55;
}

.board-zoom-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.32rem 0;
  border-bottom: 1px solid var(--line);
}

.board-zoom-row:last-of-type {
  border-bottom: 0;
}

.board-zoom-label {
  flex: 1 1 auto;
  color: var(--text-main);
  font-size: 0.82rem;
}

.board-zoom-row button {
  width: 2.1rem;
  height: 2.1rem;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: var(--surface-soft);
  color: var(--text-main);
  font: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.board-zoom-row button:hover {
  border-color: var(--accent);
  color: var(--accent-dark);
}

.board-zoom-value {
  min-width: 3.1rem;
  color: var(--text-main);
  font-size: 0.86rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.board-zoom-actions {
  display: flex;
  gap: 0.45rem;
  margin-top: 0.7rem;
}

.board-zoom-actions button {
  flex: 1 1 auto;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: var(--surface-card);
  color: var(--text-main);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.board-zoom-actions .is-primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-contrast);
}

.board-zoom-summary {
  margin: 0.6rem 0 0;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--line);
  color: var(--text-soft);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.55;
  word-break: break-word;
}

/* 展板标题旁的版本号：用来确认设备上是哪一版 */
.shared-board-version {
  margin-left: 0.5rem;
  color: var(--text-soft);
  font-size: 0.6em;
  font-weight: 600;
  letter-spacing: 0.02em;
  vertical-align: middle;
}
/* 非全屏下也允许放大便签。
   你主要在普通视图里读便签，那里才是字最需要变大的地方。
   只对便签生效：标题/图表/待办仍然只在全屏生效，避免动到普通视图的版面。 */
.shared-board-page:not(.is-fullscreen) .board-notes-panel {
  transform: scale(var(--board-zoom-notes, 1));
  transform-origin: top left;
  width: calc(100% / var(--board-zoom-notes, 1));
  height: calc(100% / var(--board-zoom-notes, 1));
}
/* ── 上中下布局（竖屏为主）──────────────────────────────────
   关键：这里必须继续用 grid，不能改成 flex。
   全屏那套布局是围绕 grid 的行列写的，上一版把它换成 flex 之后
   便签面板在网格里分不到高度，全屏下便签直接不渲染。
   所以只做两件事：把列收成一列，行改成「便签吃掉剩余 + 图表自适应」。 */

.board-main-layout {
  grid-template-columns: minmax(0, 1fr) !important;
  grid-template-rows: minmax(0, 1fr) auto !important;
}

.board-notes-panel {
  order: 1;
  min-width: 0;
  min-height: 0;
}

.board-progress-panel {
  order: 2;
  min-width: 0;
  min-height: 0;
}

/* 单列之后没有左右分栏可拖 */
.board-splitter {
  display: none !important;
}

/* 折叠条 */
.board-collapse-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
  color: var(--text-main);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.board-collapse-bar:hover {
  border-color: var(--line-strong);
}

.board-collapse-caret {
  flex: 0 0 auto;
  color: var(--text-soft);
  transition: transform 0.18s ease;
}

.is-collapsed .board-collapse-caret {
  transform: rotate(-90deg);
}

/* 收起时只留折叠条。
   必须用 !important：全屏那批规则（.shared-board-page.is-fullscreen .board-todo-panel > *）
   选择器比重更高，不加就被它们重新显示出来。 */
.shared-board-page .board-progress-panel.is-collapsed > *:not(.board-collapse-bar),
.shared-board-page .board-todo-panel.is-collapsed > *:not(.board-collapse-bar) {
  display: none !important;
}

/* 展开时折叠条与内容留间距 */
.board-progress-panel:not(.is-collapsed) > .board-collapse-bar,
.board-todo-panel:not(.is-collapsed) > .board-collapse-bar {
  margin-bottom: 0.5rem;
}
</style>

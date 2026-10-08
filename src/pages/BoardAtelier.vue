<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createId } from '../shared/ids'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import BoardWeeklyCharts from '../components/BoardWeeklyCharts.vue'

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

const authStore = useAuthStore()
const isLoading = ref(false)
const isSaving = ref(false)
const isEditing = ref(false)
const isFullscreen = ref(false)
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
const isAuthenticatedSpace = computed(() => authStore.usesSupabaseSpace && !!authStore.currentSpaceId)
const lastEditorName = computed(() => authStore.members.find((member) => member.id === updatedBy.value)?.displayName ?? '')
const feedbackClass = computed(() => `board-feedback-${feedbackTone.value}`)
const sortedTodos = computed(() => [...boardTodos.value]
  .sort((left, right) => left.due_date.localeCompare(right.due_date) || left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at)))
const todoProgress = computed(() => {
  const total = sortedTodos.value.length
  const done = sortedTodos.value.filter((todo) => todo.is_done).length
  return { done, total }
})

let boardChannel: RealtimeChannel | null = null
let loadSequence = 0
let previousBodyOverflow = ''
let splitterDrag: { axis: 'vertical' | 'horizontal'; pointerId: number; element: HTMLElement } | null = null

const splitterStyle = computed(() => ({
  '--board-left-pane': `${leftPaneRatio.value}%`,
  '--board-upper-fr': `${upperPaneRatio.value}`,
  '--board-lower-fr': `${100 - upperPaneRatio.value}`,
}))

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
  if (!supabase || !boardIdValue) {
    boardTodos.value = []
    return
  }

  const { data, error } = await supabase
    .from('shared_board_todos')
    .select('id, board_id, space_id, due_date, assignee_id, title, is_done, subtasks, sort_order, created_by, updated_by, created_at, updated_at')
    .eq('board_id', boardIdValue)
    .order('due_date', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!error) {
    applyTodoRows(data ?? [])
  }
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
  const { data, error } = await supabase
    .from('shared_board_todos')
    .update({ ...updates, updated_by: authStore.currentMemberId })
    .eq('id', todoId)
    .eq('space_id', authStore.currentSpaceId)
    .select('id, board_id, space_id, due_date, assignee_id, title, is_done, subtasks, sort_order, created_by, updated_by, created_at, updated_at')
    .single()

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
  const { data, error } = await supabase
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
    .single()

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

  const { error } = await supabase
    .from('shared_board_todos')
    .delete()
    .eq('id', todoId)
    .eq('space_id', authStore.currentSpaceId)

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

  const { data, error } = await supabase
    .from('shared_board_todos')
    .insert(payload)
    .select('id, board_id, space_id, due_date, assignee_id, title, is_done, subtasks, sort_order, created_by, updated_by, created_at, updated_at')
    .single()

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
        const remoteRow = payload.new as SharedBoardRow
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
      boardId.value = ''
      boardTitle.value = '我们的展板'
      boardBlocks.value = []
      isEditing.value = false
    }
  },
  { immediate: true },
)


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
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleFullscreenKeydown)
})
</script>

<template>
  <section ref="boardRoot" class="shared-board-page" :class="{ 'is-editing': isEditing, 'is-fullscreen': isFullscreen }" :style="splitterStyle">
    <header class="shared-board-header">
      <div class="shared-board-heading">
        <h2 v-if="!isEditing">{{ boardTitle }}</h2>
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
        <section class="board-progress-panel" aria-label="愿望进度回看">
          <BoardWeeklyCharts />
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

      <section ref="boardTodoPanel" class="board-todo-panel" aria-label="待办清单">
        <header class="board-todo-header">
          <div class="board-section-heading">
            <h3>待办</h3>
            <span class="board-todo-completion">{{ todoProgress.done }} / {{ todoProgress.total }}</span>
          </div>
        </header>

        <div class="board-todo-columns" aria-hidden="true"><span>完成</span><span>事项 / 到期日</span><span>负责人</span><span></span></div>
        <div class="board-todo-list">
          <article v-for="todo in sortedTodos" :key="todo.id" class="board-todo-row" :class="{ 'is-done': todo.is_done }">
            <label class="board-todo-check"><input :checked="todo.is_done" type="checkbox" :aria-label="`完成：${todo.title}`" @change="void updateTodo(todo.id, { is_done: !todo.is_done })" /></label>
            <div class="board-todo-main">
              <template v-if="editingTodoId === todo.id && todoEditDraft">
                <input v-model="todoEditDraft.title" class="board-todo-edit-title" aria-label="待办标题" maxlength="240" />
                <div class="board-todo-edit-fields">
                  <input v-model="todoEditDraft.due_date" aria-label="到期日" type="date" />
                  <select v-model="todoEditDraft.assignee_id" aria-label="负责人">
                    <option value="">所有人</option>
                    <option v-for="member in authStore.members" :key="member.id" :value="member.id">{{ member.displayName }}</option>
                  </select>
                </div>
                <ul v-if="todoEditDraft.subtasks.length" class="board-todo-subtasks">
                  <li v-for="subtask in todoEditDraft.subtasks" :key="subtask.id">
                    <label><input v-model="subtask.is_done" type="checkbox" /><input v-model="subtask.title" aria-label="小项标题" /></label>
                  </li>
                </ul>
                <div class="board-todo-subtask-add"><input v-model="todoEditSubtaskTitle" aria-label="新增小项" placeholder="添加小项" @keydown.enter.prevent="addTodoEditSubtask" /><button type="button" @click="addTodoEditSubtask">添加</button></div>
              </template>
              <template v-else>
                <strong>{{ todo.title }}</strong>
                <time class="board-todo-due-date" :datetime="todo.due_date">{{ todo.due_date }} 到期</time>
                <ul v-if="todo.subtasks.length" class="board-todo-subtasks">
                  <li v-for="subtask in todo.subtasks" :key="subtask.id">
                    <label><input :checked="subtask.is_done" type="checkbox" :aria-label="`完成小项：${subtask.title}`" @change="toggleTodoSubtask(todo, subtask.id)" /><span :class="{ 'is-done': subtask.is_done }">{{ subtask.title }}</span></label>
                  </li>
                </ul>
              </template>
            </div>
            <span class="board-todo-assignee">{{ todo.assignee_id ? authStore.members.find((member) => member.id === todo.assignee_id)?.displayName ?? '成员' : '所有人' }}</span>
            <div class="board-todo-row-actions">
              <template v-if="editingTodoId === todo.id">
                <button type="button" aria-label="保存待办" @click="void saveTodoDetails()">✓</button>
                <button type="button" aria-label="取消编辑" @click="cancelEditingTodo()">×</button>
              </template>
              <template v-else>
                <details class="board-todo-more">
                  <summary :aria-label="`更多操作：${todo.title}`" title="更多操作">···</summary>
                  <div class="board-todo-menu">
                    <button type="button" :aria-label="`编辑待办：${todo.title}`" @click="startEditingTodo(todo)">编辑</button>
                    <button type="button" :aria-label="`删除待办：${todo.title}`" @click="void deleteTodo(todo.id)">删除</button>
                  </div>
                </details>
              </template>
            </div>
          </article>
          <p v-if="!sortedTodos.length" class="board-todo-empty">还没有待办。</p>
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

.board-todo-date-tabs {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.18rem;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface-soft);
}

.board-todo-date-tabs button {
  min-height: 34px;
  padding: 0.25rem 0.55rem;
  border: 0;
  border-radius: 7px;
  color: var(--text-soft);
  background: transparent;
  font: inherit;
  font-size: 0.75rem;
}

.board-todo-date-tabs button.is-active {
  color: var(--text-main);
  background: var(--surface-card);
  box-shadow: 0 1px 3px rgba(45, 34, 25, 0.12);
}

.board-todo-date-tabs input {
  width: 38px;
  min-height: 34px;
  border: 0;
  color: var(--text-soft);
  background: transparent;
  font: inherit;
  font-size: 0.7rem;
}

.board-todo-columns,
.board-todo-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) minmax(60px, 0.16fr) 48px;
  gap: 0.45rem;
  align-items: center;
}

.board-todo-columns {
  flex: 0 0 auto;
  padding: 0.3rem 0.4rem;
  border-top: 0;
  border-bottom: 1px solid var(--line);
  color: var(--text-soft);
  font-size: 0.67rem;
}

.board-todo-columns span:first-child {
  grid-column: 1;
}

.board-todo-list {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.board-todo-row {
  min-height: 44px;
  padding: 0.5rem 0.4rem;
  align-items: start;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
}

.board-todo-row.is-done .board-todo-main > strong {
  color: var(--text-soft);
  text-decoration: line-through;
}

.board-todo-check {
  display: grid;
  place-items: center;
  min-width: 32px;
  min-height: 38px;
}

.board-todo-check input,
.board-todo-subtasks input,
.board-todo-draft-subtasks input {
  width: 20px;
  height: 20px;
  accent-color: var(--accent-dark);
}

.board-todo-main {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.board-todo-main > strong {
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 600;
}

.board-todo-due-date,
.board-todo-assignee {
  overflow: hidden;
  color: var(--text-soft);
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-todo-assignee {
  padding: 0.35rem 0;
  border-radius: 0;
  background: transparent;
  text-align: right;
}

.board-todo-subtasks {
  width: 100%;
  grid-column: 2 / -1;
  display: grid;
  gap: 0.15rem;
  margin: 0.3rem 0 0;
  padding-left: 0.1rem;
}

.board-todo-subtasks li label,
.board-todo-draft-subtasks label {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  color: var(--text-soft);
  font-size: 0.8rem;
  min-height: 32px;
}

.board-todo-subtasks li,
.board-todo-subtasks label,
.board-todo-subtasks label > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.board-todo-subtasks input[type='checkbox'] {
  flex: 0 0 16px;
}

.board-todo-subtasks input,
.board-todo-draft-subtasks input {
  width: 16px;
  height: 16px;
}

.board-todo-subtasks .is-done {
  text-decoration: line-through;
  opacity: 0.68;
}

.board-todo-row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.15rem;
}

.board-todo-more summary {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  list-style: none;
  cursor: pointer;
  color: var(--text-soft);
  border-radius: 6px;
  font-size: 1.15rem;
}

.board-todo-more summary::-webkit-details-marker {
  display: none;
}

.board-todo-more summary:hover,
.board-todo-more[open] summary {
  background: var(--surface-soft);
}

.board-todo-menu {
  display: grid;
  gap: 2px;
}

.board-todo-menu button {
  min-height: 44px;
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
.board-todo-edit-fields input,
.board-todo-edit-fields select,
.board-todo-edit-title,
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

.board-todo-edit-fields {
  display: flex;
  width: 100%;
  gap: 0.35rem;
}

.board-todo-edit-title {
  width: 100%;
}

.board-todo-edit-fields > * {
  flex: 1 1 0;
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
  min-height: 36px;
}

.shared-board-page.is-fullscreen .board-todo-check {
  min-height: 34px;
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

@media (prefers-reduced-motion: reduce) {
  .board-note {
    animation: none;
  }
}
</style>

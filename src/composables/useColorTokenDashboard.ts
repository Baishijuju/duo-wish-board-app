import { computed, ref } from 'vue'

export const COLOR_TOKEN_STORAGE_KEY = 'duo-wish-board-color-tokens:v1'

export type ColorTokenFormat = 'hex' | 'rgba' | 'css-color'

export type ColorTokenDefinition = {
  name: string
  label: string
  format: ColorTokenFormat
  description: string
}

export type ColorTokenGroup = {
  title: string
  description: string
  tokens: ColorTokenDefinition[]
}

export type ColorAreaControl = {
  label: string
  description: string
  tokens: string[]
  keywords: string[]
}

export type ColorAreaGroup = {
  id: string
  title: string
  pageLabel: string
  description: string
  affected: string[]
  keywords: string[]
  controls: ColorAreaControl[]
}

export type ContrastCheck = {
  label: string
  ratio: number
  passes: boolean
}

export const colorTokenGroups: ColorTokenGroup[] = [
  {
    title: '底色与纸面',
    description: '控制整站暖纸张背景、卡片和浮层，是页面气质的底盘。',
    tokens: [
      { name: '--bg', label: '页面底色', format: 'hex', description: 'body 顶部背景色。' },
      { name: '--bg-deep', label: '页面深底色', format: 'hex', description: 'body 底部背景色。' },
      { name: '--paper', label: '纸张基色', format: 'hex', description: '主要纸面颜色。' },
      { name: '--paper-solid', label: '实纸面', format: 'hex', description: '按钮和强调文字常用的暖白。' },
      { name: '--paper-soft', label: '柔纸面', format: 'hex', description: '弱背景和分区底色。' },
      { name: '--surface-card', label: '卡片表面', format: 'hex', description: 'page-card 和多数卡片的背景。' },
      { name: '--surface-raised', label: '抬起表面', format: 'hex', description: '输入框、徽章和小卡片背景。' },
      { name: '--surface-popover', label: '浮层表面', format: 'hex', description: '浮层、底部导航和聚焦输入背景。' },
    ],
  },
  {
    title: '可见卡片区域',
    description: '用人话命名的卡片、输入框、面板和选中项颜色，优先从这里手搓。',
    tokens: [
      { name: '--card-bg', label: '主卡片底色', format: 'hex', description: '全局 page-card 和大部分主卡片背景。' },
      { name: '--card-bg-raised', label: '抬起小卡片', format: 'hex', description: '徽章、summary-card 和小卡片背景。' },
      { name: '--card-bg-soft', label: '柔卡片底色', format: 'hex', description: '统计块、弱分区和禁用态背景。' },
      { name: '--card-bg-popover', label: '浮层卡片底色', format: 'hex', description: '弹层和聚焦状态的更亮底色。' },
      { name: '--card-border', label: '卡片边线', format: 'rgba', description: '全局卡片、徽章和输入框边线。' },
      { name: '--card-border-soft', label: '柔卡片边线', format: 'rgba', description: '统计块和弱分区边线。' },
      { name: '--panel-bg', label: '透明面板底色', format: 'rgba', description: '半透明工作台面板。' },
      { name: '--panel-bg-strong', label: '实面板底色', format: 'rgba', description: '更实的暖白局部面板。' },
      { name: '--input-bg', label: '输入框底色', format: 'hex', description: '普通输入框、搜索框和文本框背景。' },
      { name: '--input-focus-bg', label: '输入聚焦底色', format: 'hex', description: '输入框 focus 后的背景。' },
      { name: '--active-item-bg', label: '选中项底色', format: 'hex', description: 'active pill、当前导航和选中项底色。' },
      { name: '--active-item-border', label: '选中项边线', format: 'rgba', description: 'active pill、当前项和强调控件边线。' },
    ],
  },
  {
    title: '线条与暖面板',
    description: '控制边框、半透明暖白面板和页面空气感。',
    tokens: [
      { name: '--line', label: '默认边线', format: 'rgba', description: '全局卡片和输入框边线。' },
      { name: '--line-strong', label: '强边线', format: 'rgba', description: '移动导航和重点区域边线。' },
      { name: '--line-soft', label: '轻边线', format: 'rgba', description: '统计卡和列表项的轻边线。' },
      { name: '--warm-border-soft', label: '暖轻边线', format: 'rgba', description: '局部页面的柔和暖棕边线。' },
      { name: '--warm-border', label: '暖边线', format: 'rgba', description: '页面功能区边线。' },
      { name: '--warm-border-strong', label: '暖强边线', format: 'rgba', description: '强调面板或悬停边线。' },
      { name: '--warm-panel', label: '暖透明面板', format: 'rgba', description: '半透明白色工作台面板。' },
      { name: '--warm-panel-strong', label: '暖实面板', format: 'rgba', description: '更实的暖白局部面板。' },
    ],
  },
  {
    title: '强调色',
    description: '控制主按钮、当前导航、焦点环和强调阴影。',
    tokens: [
      { name: '--accent', label: '主强调色', format: 'hex', description: '主要行动按钮和品牌强调。' },
      { name: '--accent-dark', label: '深强调色', format: 'hex', description: '主按钮渐变终点和强调文字。' },
      { name: '--accent-soft', label: '柔强调面', format: 'hex', description: '柔和强调背景。' },
      { name: '--accent-sun', label: '日光强调', format: 'hex', description: '主按钮渐变起点。' },
      { name: '--accent-gradient-end', label: '渐变终点', format: 'hex', description: '主按钮渐变终点。' },
      { name: '--accent-panel', label: '当前项底色', format: 'hex', description: '导航当前项和 hover 底色。' },
      { name: '--accent-border', label: '强调边线', format: 'rgba', description: '当前项、焦点和强调控件边线。' },
      { name: '--accent-ring', label: '焦点光环', format: 'rgba', description: '输入框 focus ring。' },
      { name: '--accent-shadow-soft', label: '轻强调阴影', format: 'rgba', description: '导航 hover 的轻阴影。' },
      { name: '--accent-shadow', label: '强调阴影', format: 'rgba', description: '主按钮和浮起强调控件阴影。' },
      { name: '--accent-contrast', label: '强调文字', format: 'hex', description: '强调色上的文字颜色。' },
    ],
  },
  {
    title: '辅助色与状态',
    description: '控制成功、危险、薄荷、金色等辅助情绪。',
    tokens: [
      { name: '--accent-teal', label: '薄荷强调', format: 'hex', description: 'aurora 卡片和辅助高亮。' },
      { name: '--accent-teal-soft', label: '薄荷柔面', format: 'rgba', description: 'active pill 背景。' },
      { name: '--accent-teal-border', label: '薄荷边线', format: 'rgba', description: 'active pill 边线。' },
      { name: '--accent-gold', label: '金色强调', format: 'hex', description: 'golden 卡片和奖励氛围。' },
      { name: '--sage', label: '鼠尾草绿', format: 'hex', description: '柔绿辅助色。' },
      { name: '--cream', label: '奶油黄', format: 'hex', description: '柔黄辅助色。' },
      { name: '--rose', label: '玫瑰粉', format: 'hex', description: '柔粉辅助色。' },
      { name: '--mist', label: '雾蓝绿', format: 'hex', description: '冷色辅助面。' },
      { name: '--success', label: '成功色', format: 'hex', description: '完成、同步成功和正向状态。' },
      { name: '--success-panel', label: '成功面板', format: 'rgba', description: '成功状态背景。' },
      { name: '--success-border', label: '成功边线', format: 'rgba', description: '成功状态边线。' },
      { name: '--warning', label: '提醒色', format: 'hex', description: '需要注意但不危险的状态。' },
      { name: '--warning-panel', label: '提醒面板', format: 'rgba', description: '提醒状态背景。' },
      { name: '--warning-border', label: '提醒边线', format: 'rgba', description: '提醒状态边线。' },
      { name: '--danger', label: '危险色', format: 'hex', description: '删除、异常和危险动作。' },
      { name: '--danger-panel', label: '危险面板', format: 'rgba', description: '危险状态背景。' },
      { name: '--danger-border', label: '危险边线', format: 'rgba', description: '危险状态边线。' },
    ],
  },
  {
    title: '文字',
    description: '控制标题、正文、弱文案和说明文字层级。',
    tokens: [
      { name: '--text-main', label: '主文字', format: 'hex', description: '标题和主要正文。' },
      { name: '--text-soft', label: '柔文字', format: 'hex', description: '状态、说明和次级正文。' },
      { name: '--text-muted', label: '正文灰', format: 'hex', description: '普通说明文字。' },
      { name: '--text-faint', label: '弱文字', format: 'hex', description: '元信息和辅助标注。' },
    ],
  },
]

export const colorAreaGroups: ColorAreaGroup[] = [
  {
    id: 'global-backdrop',
    title: '全站底色',
    pageLabel: '所有页面',
    description: '网页最底下的暖纸底、页面渐变和柔光。先调这里，再调卡片。',
    affected: ['body 背景', '页面底部渐变', '背景柔光'],
    keywords: ['背景', '底色', '整站', '页面', '暖光'],
    controls: [
      { label: '页面上半部底色', description: '决定页面第一眼的暖纸底。', tokens: ['--bg'], keywords: ['背景', '底色', '上半部'] },
      { label: '页面下半部底色', description: '决定页面纵向渐变的落点。', tokens: ['--bg-deep'], keywords: ['背景', '底色', '下半部'] },
      { label: '暖色背景光', description: '左上和局部暖光的颜色强度。', tokens: ['--warm-glow', '--accent-glow'], keywords: ['光', '暖光', '氛围'] },
      { label: '冷色背景光', description: '页面右上和柔绿光的颜色强度。', tokens: ['--cool-glow', '--sage-glow'], keywords: ['光', '冷光', '绿色'] },
    ],
  },
  {
    id: 'common-cards',
    title: '通用卡片',
    pageLabel: '全站卡片',
    description: '多数大卡片、小卡片、统计卡和列表块都从这里拿颜色。',
    affected: ['主页面卡片', 'summary-card', 'stat-card', 'stack-item', '徽章和 pill'],
    keywords: ['卡片', '纸面', 'summary', '统计', '小卡片', 'page-card'],
    controls: [
      { label: '主卡片底色', description: '大部分 page-card 的背景。', tokens: ['--card-bg'], keywords: ['卡片', '主卡片', 'page-card'] },
      { label: '抬起小卡片底色', description: '输入框、徽章、小统计卡会更亮一点。', tokens: ['--card-bg-raised'], keywords: ['小卡片', '徽章', '输入框', '抬起'] },
      { label: '柔卡片底色', description: '统计块、禁用态和弱分区底色。', tokens: ['--card-bg-soft'], keywords: ['柔', '浅底', '统计'] },
      { label: '浮层亮底色', description: '输入框聚焦、弹层、底部导航更亮的表面。', tokens: ['--card-bg-popover'], keywords: ['浮层', 'focus', '底部导航'] },
      { label: '卡片边线', description: '通用卡片和输入框边线。', tokens: ['--card-border', '--card-border-soft'], keywords: ['边框', '边线', '分割线'] },
    ],
  },
  {
    id: 'inputs-overlays',
    title: '输入与浮层',
    pageLabel: '表单控件',
    description: '搜索框、文本框、导入框和聚焦光环。',
    affected: ['input', 'textarea', 'select', '搜索框', 'JSON 导入框'],
    keywords: ['输入框', '表单', '搜索', '浮层', 'focus'],
    controls: [
      { label: '输入框底色', description: '普通输入框和搜索框的背景。', tokens: ['--input-bg'], keywords: ['输入框', '搜索框', '表单'] },
      { label: '输入框聚焦底色', description: '点进输入框时的亮底色。', tokens: ['--input-focus-bg'], keywords: ['focus', '聚焦', '输入框'] },
      { label: '聚焦边线与光环', description: '键盘 focus ring 和强调边框。', tokens: ['--active-item-border', '--accent-ring'], keywords: ['focus', '光环', '边框'] },
    ],
  },
  {
    id: 'buttons-navigation',
    title: '按钮与导航',
    pageLabel: '行动控件',
    description: '主按钮、当前导航、选中项和 hover 反馈。',
    affected: ['主按钮', '顶部导航', '底部导航', '当前项', 'active pill'],
    keywords: ['按钮', '导航', '选中', '当前', 'hover', 'active'],
    controls: [
      { label: '主按钮渐变', description: '主行动按钮的起点和终点。', tokens: ['--accent-sun', '--accent-gradient-end', '--accent-dark'], keywords: ['按钮', '主按钮', '渐变'] },
      { label: '主按钮文字', description: '强调色上的文字颜色。', tokens: ['--accent-contrast'], keywords: ['按钮', '文字', '对比'] },
      { label: '当前项底色', description: '当前导航和选中态的浅强调面。', tokens: ['--active-item-bg', '--accent-panel'], keywords: ['导航', '选中', '当前'] },
      { label: '强调边线和阴影', description: '选中项边线、hover 阴影和按钮阴影。', tokens: ['--active-item-border', '--accent-shadow-soft', '--accent-shadow'], keywords: ['阴影', '边线', 'hover'] },
    ],
  },
  {
    id: 'list-cards',
    title: '清单页卡片',
    pageLabel: '清单页',
    description: '清单页的筛选按钮、愿望卡片、搜索框和元信息标签。',
    affected: ['清单筛选按钮', '清单愿望卡', '清单搜索框', '卡片 meta pill'],
    keywords: ['清单', '列表', '筛选', '搜索', '愿望卡'],
    controls: [
      { label: '清单卡片底色', description: '清单页愿望卡和工具卡的纸面。', tokens: ['--card-bg', '--panel-bg-strong'], keywords: ['清单', '卡片', '愿望卡'] },
      { label: '清单卡片边线', description: '清单页局部卡片、筛选按钮和 meta pill 边线。', tokens: ['--card-border', '--card-border-soft', '--warm-border-strong'], keywords: ['清单', '边线', '筛选'] },
      { label: '筛选选中项', description: '清单筛选 active pill 和柔强调项。', tokens: ['--active-item-bg', '--active-item-border', '--accent-ring'], keywords: ['筛选', 'active', '选中'] },
      { label: '清单说明文字', description: '卡片说明、meta、弱提示文字。', tokens: ['--text-soft', '--text-muted', '--text-faint'], keywords: ['清单', '文字', '说明'] },
    ],
  },
  {
    id: 'rewards-space',
    title: '空间与奖励',
    pageLabel: '空间页',
    description: '奖励中心、奖励卡片、状态 chip 和金色氛围。第一版先映射到现有辅助色。',
    affected: ['奖励卡片', '奖励货架', 'premium row', '奖励状态 chip', '空间页卡片'],
    keywords: ['空间', '奖励', '金色', '兑换', 'premium', '货架'],
    controls: [
      { label: '奖励卡片纸面', description: '奖励区的暖白卡片底。', tokens: ['--card-bg', '--panel-bg-strong'], keywords: ['奖励', '卡片', '纸面'] },
      { label: '奖励柔底色', description: '奖励货架、弱提示和状态背景。', tokens: ['--warning-panel', '--success-panel', '--danger-panel'], keywords: ['奖励', '状态', '背景'] },
      { label: '奖励金色强调', description: '金币、奖励高亮和金色氛围。', tokens: ['--accent-gold', '--warning'], keywords: ['奖励', '金色', '金币'] },
      { label: '奖励边线', description: '奖励卡片和状态 chip 边线。', tokens: ['--warning-border', '--success-border', '--danger-border'], keywords: ['奖励', '边线', 'chip'] },
    ],
  },
  {
    id: 'wish-bottle',
    title: '首页愿望瓶',
    pageLabel: '首页插画',
    description: '愿望瓶属于对象插画色，第一版先帮你定位相关全局辅助色，后续可继续拆成瓶身、彩带和星星。',
    affected: ['愿望瓶卡片', '玻璃感', '彩带', '星星', '首页情绪图形'],
    keywords: ['首页', '愿望瓶', '瓶子', '玻璃', '彩带', '星星'],
    controls: [
      { label: '愿望瓶暖色', description: '愿望瓶周围的暖粉、珊瑚和日光色。', tokens: ['--rose', '--accent-coral', '--accent-sun'], keywords: ['愿望瓶', '暖色', '彩带'] },
      { label: '愿望瓶冷色', description: '玻璃、雾蓝绿和柔绿辅助色。', tokens: ['--mist', '--sage', '--accent-teal'], keywords: ['愿望瓶', '玻璃', '冷色'] },
      { label: '愿望瓶金色', description: '星星和奖励感的金色。', tokens: ['--accent-gold', '--cream'], keywords: ['愿望瓶', '星星', '金色'] },
    ],
  },
]

const knownColorTokenNames = new Set(colorTokenGroups.flatMap((group) => group.tokens.map((token) => token.name)))
const colorTokenByName = new Map(colorTokenGroups.flatMap((group) => group.tokens.map((token) => [token.name, token])))

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function filterKnownTokenDraft(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  return Object.entries(input).reduce<Record<string, string>>((draft, [name, value]) => {
    if (knownColorTokenNames.has(name) && typeof value === 'string' && value.trim()) {
      draft[name] = value.trim()
    }

    return draft
  }, {})
}

function readStoredTokenDraft() {
  if (!canUseBrowserStorage()) {
    return {}
  }

  try {
    const rawDraft = window.localStorage.getItem(COLOR_TOKEN_STORAGE_KEY)
    return rawDraft ? filterKnownTokenDraft(JSON.parse(rawDraft)) : {}
  } catch {
    return {}
  }
}

function persistTokenDraft(values: Record<string, string>) {
  if (!canUseBrowserStorage()) {
    return
  }

  if (Object.keys(values).length === 0) {
    window.localStorage.removeItem(COLOR_TOKEN_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(COLOR_TOKEN_STORAGE_KEY, JSON.stringify(values, null, 2))
}

function applyInlineToken(name: string, value: string) {
  if (!canUseBrowserStorage()) {
    return
  }

  document.documentElement.style.setProperty(name, value)
}

function resetInlineToken(name: string) {
  if (!canUseBrowserStorage()) {
    return
  }

  document.documentElement.style.removeProperty(name)
}

function readCssDefaultValues() {
  if (!canUseBrowserStorage()) {
    return {}
  }

  const root = document.documentElement
  const previousInlineValues = new Map<string, string>()

  for (const name of knownColorTokenNames) {
    previousInlineValues.set(name, root.style.getPropertyValue(name))
    root.style.removeProperty(name)
  }

  const styles = window.getComputedStyle(root)
  const defaults = colorTokenGroups.reduce<Record<string, string>>((values, group) => {
    for (const token of group.tokens) {
      values[token.name] = styles.getPropertyValue(token.name).trim()
    }

    return values
  }, {})

  previousInlineValues.forEach((value, name) => {
    if (value) {
      root.style.setProperty(name, value)
    } else {
      root.style.removeProperty(name)
    }
  })

  return defaults
}

function applyTokenDraft(values: Record<string, string>) {
  Object.entries(values).forEach(([name, value]) => applyInlineToken(name, value))
}

function normalizeHexColor(value: string) {
  const normalized = value.trim()

  if (/^#[\da-f]{6}$/i.test(normalized)) {
    return normalized
  }

  if (/^#[\da-f]{3}$/i.test(normalized)) {
    const [, red, green, blue] = normalized
    return `#${red}${red}${green}${green}${blue}${blue}`
  }

  return undefined
}

function hexToRgb(value: string) {
  const hex = normalizeHexColor(value)

  if (!hex) {
    return undefined
  }

  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
  }
}

function colorLuminance(value: number) {
  const normalized = value / 255
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

function contrastRatio(foreground: string, background: string) {
  const foregroundRgb = hexToRgb(foreground)
  const backgroundRgb = hexToRgb(background)

  if (!foregroundRgb || !backgroundRgb) {
    return undefined
  }

  const foregroundLuminance =
    0.2126 * colorLuminance(foregroundRgb.red) +
    0.7152 * colorLuminance(foregroundRgb.green) +
    0.0722 * colorLuminance(foregroundRgb.blue)
  const backgroundLuminance =
    0.2126 * colorLuminance(backgroundRgb.red) +
    0.7152 * colorLuminance(backgroundRgb.green) +
    0.0722 * colorLuminance(backgroundRgb.blue)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

function parseImportPayload(payload: string) {
  const parsed = JSON.parse(payload) as unknown

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'tokens' in parsed) {
    return filterKnownTokenDraft((parsed as { tokens: unknown }).tokens)
  }

  return filterKnownTokenDraft(parsed)
}

export function applyStoredColorTokenDraft() {
  applyTokenDraft(readStoredTokenDraft())
}

export function clearStoredColorTokenDraft() {
  for (const name of knownColorTokenNames) {
    resetInlineToken(name)
  }

  persistTokenDraft({})
}

export function useColorTokenDashboard() {
  const defaultValues = ref<Record<string, string>>(readCssDefaultValues())
  const tokenValues = ref<Record<string, string>>(readStoredTokenDraft())
  const importText = ref('')
  const feedbackMessage = ref('')
  const areaSearch = ref('')

  applyTokenDraft(tokenValues.value)

  const exportText = computed(() => JSON.stringify(tokenValues.value, null, 2))
  const overriddenCount = computed(() => Object.keys(tokenValues.value).length)
  const tokenCount = computed(() => colorTokenGroups.reduce((count, group) => count + group.tokens.length, 0))
  const filteredAreaGroups = computed(() => {
    const query = areaSearch.value.trim().toLowerCase()

    if (!query) {
      return colorAreaGroups
    }

    return colorAreaGroups.filter((area) => {
      const searchableText = [
        area.title,
        area.pageLabel,
        area.description,
        ...area.affected,
        ...area.keywords,
        ...area.controls.flatMap((control) => [control.label, control.description, ...control.keywords, ...control.tokens]),
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  })

  function currentValue(name: string) {
    return tokenValues.value[name] ?? defaultValues.value[name] ?? ''
  }

  function defaultValue(name: string) {
    return defaultValues.value[name] ?? ''
  }

  function hasOverride(name: string) {
    return Object.prototype.hasOwnProperty.call(tokenValues.value, name)
  }

  function colorInputValue(name: string) {
    return normalizeHexColor(currentValue(name)) ?? normalizeHexColor(defaultValue(name)) ?? '#000000'
  }

  function tokenDefinition(name: string) {
    return colorTokenByName.get(name)
  }

  function controlTokenDefinitions(control: ColorAreaControl) {
    return control.tokens.flatMap((name) => {
      const token = tokenDefinition(name)
      return token ? [token] : []
    })
  }

  function setFeedback(message: string) {
    feedbackMessage.value = message
  }

  function applyToken(name: string, value: string) {
    if (!knownColorTokenNames.has(name)) {
      return
    }

    const nextValue = value.trim()

    if (!nextValue) {
      resetToken(name)
      return
    }

    const nextValues = {
      ...tokenValues.value,
      [name]: nextValue,
    }

    tokenValues.value = nextValues
    applyInlineToken(name, nextValue)
    persistTokenDraft(nextValues)
  }

  function resetToken(name: string) {
    if (!knownColorTokenNames.has(name)) {
      return
    }

    const nextValues = { ...tokenValues.value }
    delete nextValues[name]
    tokenValues.value = nextValues
    resetInlineToken(name)
    persistTokenDraft(nextValues)
  }

  function resetAllTokens() {
    for (const name of knownColorTokenNames) {
      resetInlineToken(name)
    }

    tokenValues.value = {}
    persistTokenDraft({})
    setFeedback('已恢复 CSS 默认色。')
  }

  function importTokens() {
    try {
      const importedValues = parseImportPayload(importText.value)

      if (Object.keys(importedValues).length === 0) {
        setFeedback('没有找到可用的 token。')
        return
      }

      const nextValues = {
        ...tokenValues.value,
        ...importedValues,
      }

      tokenValues.value = nextValues
      applyTokenDraft(nextValues)
      persistTokenDraft(nextValues)
      setFeedback(`已导入 ${Object.keys(importedValues).length} 个 token。`)
    } catch {
      setFeedback('JSON 格式不对，先检查逗号和引号。')
    }
  }

  const contrastChecks = computed<ContrastCheck[]>(() => {
    const checks = [
      {
        label: '正文 / 卡片',
        ratio: contrastRatio(currentValue('--text-main'), currentValue('--surface-card')),
      },
      {
        label: '弱文字 / 卡片',
        ratio: contrastRatio(currentValue('--text-soft'), currentValue('--surface-card')),
      },
      {
        label: '按钮文字 / 强调色',
        ratio: contrastRatio(currentValue('--accent-contrast'), currentValue('--accent')),
      },
    ]

    return checks.reduce<ContrastCheck[]>((items, check) => {
      if (typeof check.ratio === 'number') {
        items.push({
          label: check.label,
          ratio: check.ratio,
          passes: check.ratio >= 4.5,
        })
      }

      return items
    }, [])
  })

  return {
    groups: colorTokenGroups,
    areaGroups: colorAreaGroups,
    filteredAreaGroups,
    areaSearch,
    importText,
    feedbackMessage,
    exportText,
    overriddenCount,
    tokenCount,
    contrastChecks,
    currentValue,
    defaultValue,
    hasOverride,
    colorInputValue,
    tokenDefinition,
    controlTokenDefinitions,
    applyToken,
    resetToken,
    resetAllTokens,
    importTokens,
    setFeedback,
  }
}
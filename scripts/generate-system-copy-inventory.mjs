import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
const appRoot = resolve(scriptDir, '..')
const docsDir = join(appRoot, 'docs')
const outBase = 'system-copy-inventory'

const sourceFiles = [
  'src/App.vue',
  'src/components/WishBottlePreviewCard.vue',
  'src/composables/useComposePreviewState.ts',
  'src/composables/useComposeWishForm.ts',
  'src/composables/useListWishBoardState.ts',
  'src/composables/useReviewPageState.ts',
  'src/composables/useSpacePageState.ts',
  'src/composables/useSpaceState.ts',
  'src/composables/useWishDetailPageState.ts',
  'src/composables/useWishDetailState.ts',
  'src/pages/ComposeAtelier.vue',
  'src/pages/HomeAtelier.vue',
  'src/pages/List.vue',
  'src/pages/Settings.vue',
  'src/pages/Stats.vue',
  'src/pages/WishDetailAtelier.vue',
  'src/stores/auth.ts',
  'src/stores/filters.ts',
  'src/stores/wishes.ts',
  'src/utils/datetime.ts',
]

const appendixRanges = {
  'src/stores/wishes.ts': [1277, 1584],
}

const moduleLabels = [
  [/src\/App\.vue$/, '全局壳层 / 导航'],
  [/src\/pages\/HomeAtelier\.vue$/, '首页'],
  [/src\/pages\/List\.vue$/, '清单页'],
  [/src\/pages\/ComposeAtelier\.vue$/, '写下页'],
  [/src\/pages\/WishDetailAtelier\.vue$/, '详情页'],
  [/src\/pages\/Stats\.vue$/, '回顾页'],
  [/src\/pages\/Settings\.vue$/, '空间页'],
  [/src\/components\/WishBottlePreviewCard\.vue$/, '愿望瓶组件'],
  [/src\/composables\/useCompose/, '写下页状态/文案构造'],
  [/src\/composables\/useList/, '清单页状态/文案构造'],
  [/src\/composables\/useReview/, '回顾页状态/文案构造'],
  [/src\/composables\/useSpace/, '空间页状态/文案构造'],
  [/src\/composables\/useWishDetail/, '详情页状态/文案构造'],
  [/src\/stores\/auth\.ts$/, '认证与空间状态'],
  [/src\/stores\/wishes\.ts$/, '愿望/奖励/同步状态'],
  [/src\/stores\/filters\.ts$/, '筛选状态'],
  [/src\/utils\/datetime\.ts$/, '日期时间工具'],
]

const staticUiEnglish = new Set([
  'Two Hearts, One Horizon',
  'Wish Board',
  'Wish Detail',
  'Wish Coins',
  'Wish List',
  'Progress',
  'Cover',
  'New Entry',
  'Filters',
  'Space',
  'Home',
])

const internalOnly = [
  /^#[0-9a-f]{3,8}$/i,
  /^rgba?\(/,
  /^oklch\(/,
  /^\.\w/,
  /^[a-z][a-z0-9_-]*$/,
  /^\d+$/,
  /^\d{4}-\d{2}-\d{2}/,
  /^https?:\/\//,
  /^image\//,
  /^@/,
  /^--/,
]

const userValueHints = [
  'displayName',
  'email',
  'inviteCode',
  'titleSnapshot',
  'wishTitle',
  'rewardTitle',
  'title',
  'note',
  'message',
  'category',
  'reason',
  'filename',
]

function normalizePath(path) {
  return path.replaceAll('\\', '/')
}

function classifyModule(path) {
  return moduleLabels.find(([pattern]) => pattern.test(path))?.[1] ?? '其他模块'
}

function hasChinese(text) {
  return /[\u3400-\u9fff]/.test(text)
}

function hasStaticUiEnglish(text) {
  return Array.from(staticUiEnglish).some((phrase) => text.includes(phrase))
}

function normalizeText(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/\{\{\s*/g, '{')
    .replace(/\s*\}\}/g, '}')
    .trim()
}

function shouldKeepText(text) {
  const normalized = normalizeText(text)
  if (!normalized || normalized.length < 2) return false
  if (!hasChinese(normalized) && !hasStaticUiEnglish(normalized)) return false
  if (internalOnly.some((pattern) => pattern.test(normalized))) return false
  return true
}

function simplifyExpression(expression) {
  return String(expression)
    .replace(/\.value/g, '')
    .replace(/\?.*/g, '')
    .replace(/\(.*/g, '')
    .replace(/[`'"{}]/g, '')
    .trim()
    .slice(0, 60)
}

function extractVariables(text) {
  const variables = new Set()
  for (const match of text.matchAll(/\$\{([^}]+)\}/g)) variables.add(simplifyExpression(match[1]))
  for (const match of text.matchAll(/\{\{([^}]+)\}\}/g)) variables.add(simplifyExpression(match[1]))
  for (const hint of userValueHints) {
    if (text.includes(hint)) variables.add(hint)
  }
  return Array.from(variables).filter(Boolean)
}

function toSkeleton(text) {
  return normalizeText(text)
    .replace(/\$\{([^}]+)\}/g, (_, expression) => `{${simplifyExpression(expression)}}`)
    .replace(/\{\{([^}]+)\}\}/g, (_, expression) => `{${simplifyExpression(expression)}}`)
}

function classifyType(text, line) {
  const combined = `${line} ${text}`
  if (/aria-|ariaLabel|sr-only|visually-hidden|aria-live/i.test(combined)) return '可访问性 / aria'
  if (/placeholder/i.test(combined)) return '输入占位符'
  if (/<button|type="button"|submit|RouterLink|class="[^"]*(button|action|link|pill)/i.test(combined)) return '按钮 / 链接'
  if (/role="status"|feedback|syncMessage|authCallbackMessage|error|失败|成功|异常|正在|请稍后|没能|无法/.test(combined)) return '状态 / 反馈 / 错误'
  if (/<h[1-6]|headline|Heading|Title|title|标题/.test(combined)) return '标题'
  if (/empty|空|还没有|暂无|没有/.test(combined)) return '空态 / 缺省'
  if (/label|选项|按.+看|筛选|排序|状态|范围/.test(combined)) return '标签 / 选项'
  return '正文 / 说明'
}

function nearestContext(lines, index) {
  for (let cursor = index; cursor >= Math.max(0, index - 18); cursor -= 1) {
    const line = lines[cursor]
    const functionMatch = line.match(/(?:function|const|async function)\s+([\w$]+)/)
    if (functionMatch) return functionMatch[1]
    const templateMatch = line.match(/<([a-zA-Z][\w-]*)\b[^>]*(?:class="([^"]+)")?/)
    if (templateMatch) return templateMatch[2] || `<${templateMatch[1]}>`
  }
  return '页面/模块渲染或状态计算时'
}

function scenarioFor(path, type, context) {
  const module = classifyModule(path)
  if (type.includes('错误') || type.includes('反馈')) return `在 ${module} 的 ${context} 触发成功、失败、加载或状态更新时出现。`
  if (type.includes('按钮')) return `在 ${module} 的 ${context} 区域作为可点击操作出现。`
  if (type.includes('输入')) return `在 ${module} 的 ${context} 表单输入框为空时作为占位提示出现。`
  if (type.includes('aria')) return `在 ${module} 的 ${context} 区域供屏幕阅读器或辅助技术感知。`
  if (type.includes('空态')) return `在 ${module} 的 ${context} 区域数据为空、不可用或尚未开始时出现。`
  return `在 ${module} 的 ${context} 区域展示。`
}

function extractStringLiterals(line) {
  const results = []
  const regex = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g
  let match
  while ((match = regex.exec(line))) {
    const raw = match[2]
    if (shouldKeepText(raw)) results.push(raw)
  }
  return results
}

function extractVueText(line) {
  if (!hasChinese(line) && !hasStaticUiEnglish(line)) return []
  if (!line.includes('<')) return []
  if (/^\s*(\/\/|\/\*|\*|@|\.|#)/.test(line)) return []
  if (/(const|let|return|=>|function|import|export)\b/.test(line)) return []

  const withoutTags = line
    .replace(/<script[\s\S]*/g, '')
    .replace(/<style[\s\S]*/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')

  const normalized = normalizeText(withoutTags)
  return shouldKeepText(normalized) ? [normalized] : []
}

function lineIsAppendix(path, lineNumber) {
  const range = appendixRanges[path]
  if (!range) return false
  return lineNumber >= range[0] && lineNumber <= range[1]
}

function extractFromFile(sourcePath) {
  const absPath = join(appRoot, sourcePath)
  if (!existsSync(absPath)) return []

  const content = readFileSync(absPath, 'utf8')
  const lines = content.split(/\r?\n/)
  const entries = []

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const context = nearestContext(lines, index)
    const candidates = [...extractStringLiterals(line), ...extractVueText(line)]

    candidates.forEach((candidate) => {
      const text = toSkeleton(candidate)
      if (!shouldKeepText(text)) return
      const type = classifyType(text, line)
      const variables = extractVariables(candidate)
      const appendix = lineIsAppendix(sourcePath, lineNumber)
      entries.push({
        appendix,
        context,
        file: sourcePath,
        line: lineNumber,
        module: classifyModule(sourcePath),
        note: appendix ? '本地演示 seed/sample 内容，单独附录确认。' : '',
        scenario: appendix ? '本地演示模式或初始化示例数据被展示时出现。' : scenarioFor(sourcePath, type, context),
        text,
        type: appendix ? '示例内容附录' : type,
        variables,
      })
    })
  })

  return entries
}

function dedupeEntries(entries) {
  const map = new Map()
  for (const entry of entries) {
    const key = `${entry.appendix ? 'appendix' : 'main'}::${entry.text}::${entry.type}`
    if (!map.has(key)) {
      map.set(key, { ...entry, occurrences: [`${entry.file}:${entry.line}`] })
      continue
    }
    const current = map.get(key)
    current.occurrences.push(`${entry.file}:${entry.line}`)
    if (!current.scenario.includes(entry.module)) current.scenario += `；另见 ${entry.module}。`
  }
  return Array.from(map.values()).sort((left, right) => {
    if (left.appendix !== right.appendix) return left.appendix ? 1 : -1
    return left.file.localeCompare(right.file, 'zh-Hans-CN') || left.line - right.line
  })
}

function makeRows(entries, includeAppendix) {
  return entries
    .filter((entry) => entry.appendix === includeAppendix)
    .map((entry, index) => ({
      id: index + 1,
      text: entry.text,
      module: entry.module,
      type: entry.type,
      scenario: entry.scenario,
      file: entry.file,
      lines: entry.occurrences.join('；'),
      variables: entry.variables.length ? entry.variables.join('；') : '无',
      accessibility: entry.type.includes('aria') ? '是' : '否',
      status: '待确认',
      note: entry.note,
    }))
}

function escapeMarkdown(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}

function escapeCsv(text) {
  const value = String(text).replace(/\r?\n/g, ' ')
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function writeMarkdown(mainRows, appendixRows) {
  const path = join(docsDir, `${outBase}.md`)
  const header = [
    '# 系统文案盘点表',
    '',
    `生成时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`,
    '',
    '范围说明：主表包含应用内所有系统可见或可感知文案，包括标题、按钮、表单占位、空态、toast/状态/错误、校验提示、aria/屏幕阅读器文案与动态系统文案骨架。真实用户输入内容本体不进入主表；动态变量以 `{变量}` 标出。',
    '',
    '确认建议：逐条修改“确认状态”和“备注”。如果需要改文案，可直接在备注栏写新文案。',
    '',
  ]

  const tableHeader = '| 序号 | 文案原文 | 页面/模块 | 类型 | 出现位置/情形 | 文件与行号 | 动态变量 | 辅助感知 | 确认状态 | 备注 |\n|---:|---|---|---|---|---|---|---|---|---|'
  const toLine = (row) => `| ${row.id} | ${escapeMarkdown(row.text)} | ${escapeMarkdown(row.module)} | ${escapeMarkdown(row.type)} | ${escapeMarkdown(row.scenario)} | ${escapeMarkdown(row.lines)} | ${escapeMarkdown(row.variables)} | ${row.accessibility} | ${row.status} | ${escapeMarkdown(row.note)} |`

  const sections = [
    ...header,
    `## 主表：系统文案（${mainRows.length} 条）`,
    '',
    tableHeader,
    ...mainRows.map(toLine),
    '',
    `## 附录：本地演示 seed/sample 内容（${appendixRows.length} 条）`,
    '',
    '这部分属于演示内容，可能在本地演示模式或初始化数据中被看到；不作为系统固定文案处理。',
    '',
    tableHeader,
    ...appendixRows.map(toLine),
    '',
  ]

  writeFileSync(path, sections.join('\n'), 'utf8')
  return path
}

function writeCsv(mainRows, appendixRows) {
  const path = join(docsDir, `${outBase}.csv`)
  const header = ['分组', '序号', '文案原文', '页面/模块', '类型', '出现位置/情形', '文件与行号', '动态变量', '辅助感知', '确认状态', '备注']
  const rows = [
    header,
    ...mainRows.map((row) => ['主表', row.id, row.text, row.module, row.type, row.scenario, row.lines, row.variables, row.accessibility, row.status, row.note]),
    ...appendixRows.map((row) => ['附录', row.id, row.text, row.module, row.type, row.scenario, row.lines, row.variables, row.accessibility, row.status, row.note]),
  ]
  writeFileSync(path, `\ufeff${rows.map((row) => row.map(escapeCsv).join(',')).join('\n')}`, 'utf8')
  return path
}

function paragraph(text, style = '') {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''
  return `<w:p>${styleXml}<w:r><w:rPr><w:rFonts w:ascii="Microsoft YaHei" w:eastAsia="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/><w:lang w:val="zh-CN" w:eastAsia="zh-CN"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
}

function table(rows) {
  const head = ['序号', '文案原文', '页面/模块', '类型', '出现位置/情形', '文件与行号', '变量', '状态']
  const allRows = [head, ...rows.map((row) => [row.id, row.text, row.module, row.type, row.scenario, row.lines, row.variables, row.status])]
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0"/></w:tblPr>${allRows.map((row) => `<w:tr>${row.map((cell) => `<w:tc><w:tcPr><w:tcW w:w="1800" w:type="dxa"/></w:tcPr>${paragraph(String(cell))}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`
}

function writeDocx(mainRows, appendixRows) {
  const tempDir = join(docsDir, '.system-copy-docx')
  const docxPath = join(docsDir, `${outBase}.docx`)
  const zipPath = join(docsDir, `${outBase}.zip`)
  rmSync(tempDir, { force: true, recursive: true })
  rmSync(docxPath, { force: true })
  rmSync(zipPath, { force: true })
  mkdirSync(join(tempDir, '_rels'), { recursive: true })
  mkdirSync(join(tempDir, 'word', '_rels'), { recursive: true })

  writeFileSync(join(tempDir, '[Content_Types].xml'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>')
  writeFileSync(join(tempDir, '_rels', '.rels'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
  writeFileSync(join(tempDir, 'word', '_rels', 'document.xml.rels'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>')
  writeFileSync(join(tempDir, 'word', 'styles.xml'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Microsoft YaHei" w:eastAsia="Microsoft YaHei"/><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr></w:style></w:styles>')

  const documentBody = [
    paragraph('系统文案盘点表', 'Title'),
    paragraph(`生成时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`),
    paragraph('范围：主表包含应用内所有系统可见或可感知文案。真实用户输入内容本体不进入主表；动态变量以 {变量} 标出。'),
    paragraph(`主表：系统文案（${mainRows.length} 条）`, 'Heading1'),
    table(mainRows),
    paragraph(`附录：本地演示 seed/sample 内容（${appendixRows.length} 条）`, 'Heading1'),
    paragraph('这部分属于演示内容，可能在本地演示模式或初始化数据中被看到；不作为系统固定文案处理。'),
    table(appendixRows),
    '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>',
  ].join('')

  writeFileSync(join(tempDir, 'word', 'document.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${documentBody}</w:body></w:document>`, 'utf8')

  execFileSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${zipPath}" -Force`], { stdio: 'inherit' })
  rmSync(tempDir, { force: true, recursive: true })
  execFileSync('powershell.exe', ['-NoProfile', '-Command', `Move-Item -Path "${zipPath}" -Destination "${docxPath}" -Force`], { stdio: 'inherit' })
  return docxPath
}

function htmlTable(rows) {
  const head = ['序号', '文案原文', '页面/模块', '类型', '出现位置/情形', '文件与行号', '动态变量', '辅助感知', '确认状态', '备注']
  const renderRow = (cells, isHead = false) => `<tr>${cells.map((cell) => `${isHead ? '<th>' : '<td>'}${escapeHtml(cell)}${isHead ? '</th>' : '</td>'}`).join('')}</tr>`
  return `<table>${renderRow(head, true)}${rows.map((row) => renderRow([row.id, row.text, row.module, row.type, row.scenario, row.lines, row.variables, row.accessibility, row.status, row.note])).join('')}</table>`
}

function writeWordHtml(mainRows, appendixRows) {
  const htmlPath = join(docsDir, `${outBase}.word.html`)
  const docPath = join(docsDir, `${outBase}.word.doc`)
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>系统文案盘点表</title><style>body{font-family:"Microsoft YaHei",Arial,sans-serif;font-size:12px;line-height:1.45;color:#222}h1{font-size:24px}h2{font-size:18px;margin-top:24px}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #999;padding:6px;vertical-align:top;word-break:break-word}th{background:#f2f2f2}</style></head><body><h1>系统文案盘点表</h1><p>生成时间：${escapeHtml(new Date().toLocaleString('zh-CN', { hour12: false }))}</p><p>范围：主表包含应用内所有系统可见或可感知文案。真实用户输入内容本体不进入主表；动态变量以 {变量} 标出。</p><h2>主表：系统文案（${mainRows.length} 条）</h2>${htmlTable(mainRows)}<h2>附录：本地演示 seed/sample 内容（${appendixRows.length} 条）</h2><p>这部分属于演示内容，可能在本地演示模式或初始化数据中被看到；不作为系统固定文案处理。</p>${htmlTable(appendixRows)}</body></html>`
  writeFileSync(htmlPath, `\ufeff${html}`, 'utf8')
  writeFileSync(docPath, `\ufeff${html}`, 'utf8')
  return { docPath, htmlPath }
}

function columnName(index) {
  let name = ''
  let current = index + 1
  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }
  return name
}

function sheetXml(rows) {
  const head = ['序号', '文案原文', '页面/模块', '类型', '出现位置/情形', '文件与行号', '动态变量', '辅助感知', '确认状态', '备注']
  const data = [head, ...rows.map((row) => [row.id, row.text, row.module, row.type, row.scenario, row.lines, row.variables, row.accessibility, row.status, row.note])]
  const sheetData = data.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((cell, cellIndex) => `<c r="${columnName(cellIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell)}</t></is></c>`).join('')}</row>`).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols><col min="1" max="1" width="8" customWidth="1"/><col min="2" max="2" width="44" customWidth="1"/><col min="3" max="10" width="24" customWidth="1"/></cols><sheetData>${sheetData}</sheetData></worksheet>`
}

function writeXlsx(mainRows, appendixRows) {
  const tempDir = join(docsDir, '.system-copy-xlsx')
  const xlsxPath = join(docsDir, `${outBase}.xlsx`)
  const zipPath = join(docsDir, `${outBase}.xlsx.zip`)
  rmSync(tempDir, { force: true, recursive: true })
  rmSync(xlsxPath, { force: true })
  rmSync(zipPath, { force: true })
  mkdirSync(join(tempDir, '_rels'), { recursive: true })
  mkdirSync(join(tempDir, 'xl', '_rels'), { recursive: true })
  mkdirSync(join(tempDir, 'xl', 'worksheets'), { recursive: true })

  writeFileSync(join(tempDir, '[Content_Types].xml'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
  writeFileSync(join(tempDir, '_rels', '.rels'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
  writeFileSync(join(tempDir, 'xl', '_rels', 'workbook.xml.rels'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>')
  writeFileSync(join(tempDir, 'xl', 'workbook.xml'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="主表" sheetId="1" r:id="rId1"/><sheet name="示例附录" sheetId="2" r:id="rId2"/></sheets></workbook>')
  writeFileSync(join(tempDir, 'xl', 'worksheets', 'sheet1.xml'), sheetXml(mainRows), 'utf8')
  writeFileSync(join(tempDir, 'xl', 'worksheets', 'sheet2.xml'), sheetXml(appendixRows), 'utf8')

  execFileSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${zipPath}" -Force`], { stdio: 'inherit' })
  rmSync(tempDir, { force: true, recursive: true })
  execFileSync('powershell.exe', ['-NoProfile', '-Command', `Move-Item -Path "${zipPath}" -Destination "${xlsxPath}" -Force`], { stdio: 'inherit' })
  return xlsxPath
}

function main() {
  mkdirSync(docsDir, { recursive: true })
  const entries = dedupeEntries(sourceFiles.flatMap(extractFromFile))
  const mainRows = makeRows(entries, false)
  const appendixRows = makeRows(entries, true)
  const markdownPath = writeMarkdown(mainRows, appendixRows)
  const csvPath = writeCsv(mainRows, appendixRows)
  const docxPath = writeDocx(mainRows, appendixRows)
  const { docPath, htmlPath } = writeWordHtml(mainRows, appendixRows)
  const xlsxPath = writeXlsx(mainRows, appendixRows)

  console.log(`主表系统文案：${mainRows.length} 条`)
  console.log(`附录示例内容：${appendixRows.length} 条`)
  console.log(`Markdown: ${normalizePath(relative(appRoot, markdownPath))}`)
  console.log(`CSV: ${normalizePath(relative(appRoot, csvPath))}`)
  console.log(`DOCX: ${normalizePath(relative(appRoot, docxPath))}`)
  console.log(`Word HTML DOC: ${normalizePath(relative(appRoot, docPath))}`)
  console.log(`Word HTML: ${normalizePath(relative(appRoot, htmlPath))}`)
  console.log(`XLSX: ${normalizePath(relative(appRoot, xlsxPath))}`)
}

main()

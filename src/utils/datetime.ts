function buildDatePartMap(value: string, includeTime: boolean) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }
      : {}),
  })

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>
}

export function formatBeijingDate(value: string, emptyLabel = '未设置日期') {
  if (!value) {
    return emptyLabel
  }

  const parts = buildDatePartMap(value, false)

  if (!parts) {
    return emptyLabel
  }

  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatBeijingDateTime(value: string, emptyLabel = '未设置时间') {
  if (!value) {
    return emptyLabel
  }

  const parts = buildDatePartMap(value, true)

  if (!parts) {
    return emptyLabel
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}
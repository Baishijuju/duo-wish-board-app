export type CopyLayer = 'primary' | 'secondary' | 'supporting'

export type CopyPolicyRule = {
  canCollapse: boolean
  collapseLabel: string
  expandLabel: string
  maxChars: number
}

export const COPY_POLICY_RULES: Record<CopyLayer, CopyPolicyRule> = {
  primary: {
    canCollapse: false,
    collapseLabel: '收起主句',
    expandLabel: '展开主句',
    maxChars: 24,
  },
  secondary: {
    canCollapse: false,
    collapseLabel: '收起副句',
    expandLabel: '展开副句',
    maxChars: 36,
  },
  supporting: {
    canCollapse: true,
    collapseLabel: '收起说明',
    expandLabel: '展开说明',
    maxChars: 52,
  },
}

export function getCopyPolicyRule(layer: CopyLayer) {
  return COPY_POLICY_RULES[layer]
}

export function shouldCollapseCopy(text: string, layer: CopyLayer, maxChars = COPY_POLICY_RULES[layer].maxChars) {
  if (!COPY_POLICY_RULES[layer].canCollapse) {
    return false
  }

  return normalizeCopyText(text).length > maxChars
}

export function truncateCopyText(text: string, layer: CopyLayer, maxChars = COPY_POLICY_RULES[layer].maxChars) {
  const normalized = normalizeCopyText(text)

  if (!shouldCollapseCopy(normalized, layer, maxChars)) {
    return normalized
  }

  return `${normalized.slice(0, maxChars).trimEnd()}...`
}

export function normalizeCopyText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

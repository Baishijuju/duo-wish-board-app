const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const BEIJING_TIME_OFFSET_MS = 8 * 60 * 60 * 1000
const WISH_COIN_CYCLE_BOUNDARY_DAY = 5
const WISH_COIN_CYCLE_BOUNDARY_HOUR = 20

function formatCycleBoundaryKey(shiftedTimestamp: number) {
  const shiftedDate = new Date(shiftedTimestamp)
  const year = shiftedDate.getUTCFullYear()
  const month = `${shiftedDate.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${shiftedDate.getUTCDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}T20:00:00+08:00`
}

export function getWishCoinCycle(dateValue: Date | number | string = new Date()) {
  const rawTimestamp = dateValue instanceof Date
    ? dateValue.getTime()
    : typeof dateValue === 'number'
      ? dateValue
      : new Date(dateValue).getTime()
  const baseTimestamp = Number.isNaN(rawTimestamp) ? Date.now() : rawTimestamp
  const shiftedTimestamp = baseTimestamp + BEIJING_TIME_OFFSET_MS
  const shiftedDate = new Date(shiftedTimestamp)
  const currentWeekMilliseconds = (
    ((shiftedDate.getUTCDay() * 24 + shiftedDate.getUTCHours()) * 60 + shiftedDate.getUTCMinutes()) * 60
    + shiftedDate.getUTCSeconds()
  ) * 1000 + shiftedDate.getUTCMilliseconds()
  const boundaryWeekMilliseconds = ((WISH_COIN_CYCLE_BOUNDARY_DAY * 24 + WISH_COIN_CYCLE_BOUNDARY_HOUR) * 60 * 60) * 1000
  let elapsedSinceBoundary = currentWeekMilliseconds - boundaryWeekMilliseconds

  if (elapsedSinceBoundary < 0) {
    elapsedSinceBoundary += 7 * MILLISECONDS_PER_DAY
  }

  const cycleStartShiftedTimestamp = shiftedTimestamp - elapsedSinceBoundary
  const cycleEndShiftedTimestamp = cycleStartShiftedTimestamp + 7 * MILLISECONDS_PER_DAY

  return {
    endsAt: new Date(cycleEndShiftedTimestamp - BEIJING_TIME_OFFSET_MS).toISOString(),
    key: formatCycleBoundaryKey(cycleStartShiftedTimestamp),
    startsAt: new Date(cycleStartShiftedTimestamp - BEIJING_TIME_OFFSET_MS).toISOString(),
  }
}

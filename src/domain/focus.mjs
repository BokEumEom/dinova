export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export function calculateRemainingMs({ durationMs, startedAt, now, pausedDurationMs = 0 }) {
  const elapsed = Math.max(0, now - startedAt - pausedDurationMs)
  return Math.max(0, durationMs - elapsed)
}

export function progressForFocusedMinutes(focusedMinutes, requiredMinutes) {
  if (!Number.isFinite(requiredMinutes) || requiredMinutes <= 0) return 0
  return clamp(focusedMinutes / requiredMinutes)
}

export function formatClock(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function visualMeltStage(progress) {
  const p = clamp(progress)
  if (p >= 1) return 'revived'
  if (p >= 0.9) return 'shell'
  if (p >= 0.7) return 'open'
  if (p >= 0.5) return 'revealed'
  if (p >= 0.3) return 'frost-thin'
  if (p >= 0.15) return 'cracked'
  return 'frozen'
}

import { clamp } from '../domain/focus.mjs'
import { CREATURE_BY_ID, CREATURES } from '../data/creatures.mjs'

export const STORAGE_KEY = 'dinova.game.v1'

function dayOrdinal(timestamp) {
  const d = new Date(timestamp)
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000
}

function dayKey(timestamp) {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function nextStreak(previousKey, currentTimestamp, currentStreak) {
  if (!previousKey) return 1
  const previous = new Date(`${previousKey}T12:00:00`)
  const diff = dayOrdinal(currentTimestamp) - dayOrdinal(previous.getTime())
  if (diff === 0) return Math.max(1, currentStreak)
  if (diff === 1) return Math.max(1, currentStreak) + 1
  return 1
}

export function createInitialGameState() {
  return {
    activeCreatureId: 'brachiosaurus',
    selectedDurationMinutes: 25,
    previewProgress: null,
    progress: Object.fromEntries(CREATURES.map((creature) => [creature.id, 0])),
    revivedIds: [],
    totalFocusMinutes: 0,
    completedSessions: 0,
    streakDays: 0,
    longestFocusMinutes: 0,
    lastFocusDate: null,
    recentSessions: [],
    settings: { sound: true, reduceMotion: false },
    session: {
      status: 'idle',
      startedAt: null,
      pausedAt: null,
      pausedDurationMs: 0,
      durationMinutes: 25,
    },
  }
}

export function startSession(state, now = Date.now(), durationMinutes = state.selectedDurationMinutes) {
  return {
    ...state,
    selectedDurationMinutes: durationMinutes,
    previewProgress: null,
    session: {
      status: 'running',
      startedAt: now,
      pausedAt: null,
      pausedDurationMs: 0,
      durationMinutes,
    },
  }
}

export function pauseSession(state, now = Date.now()) {
  if (state.session.status !== 'running') return state
  return {
    ...state,
    session: { ...state.session, status: 'paused', pausedAt: now },
  }
}

export function resumeSession(state, now = Date.now()) {
  if (state.session.status !== 'paused' || state.session.pausedAt == null) return state
  const pausedDurationMs = state.session.pausedDurationMs + Math.max(0, now - state.session.pausedAt)
  return {
    ...state,
    session: { ...state.session, status: 'running', pausedAt: null, pausedDurationMs },
  }
}

export function completeSession(state, now = Date.now()) {
  const session = state.session
  if (session.startedAt == null) return state
  const creature = CREATURE_BY_ID[state.activeCreatureId]
  const creditedMinutes = session.durationMinutes
  const nextMinutes = (state.progress[state.activeCreatureId] ?? 0) + creditedMinutes
  const revived = nextMinutes >= creature.requiredMinutes
  const revivedIds = revived && !state.revivedIds.includes(creature.id)
    ? [...state.revivedIds, creature.id]
    : state.revivedIds

  const currentDay = dayKey(now)
  const streakDays = nextStreak(state.lastFocusDate, now, state.streakDays)
  const recentSessions = [
    { endedAt: now, durationMinutes: creditedMinutes, creatureId: creature.id },
    ...(state.recentSessions ?? []),
  ].slice(0, 14)

  return {
    ...state,
    progress: { ...state.progress, [creature.id]: nextMinutes },
    revivedIds,
    totalFocusMinutes: state.totalFocusMinutes + creditedMinutes,
    completedSessions: state.completedSessions + 1,
    streakDays,
    longestFocusMinutes: Math.max(state.longestFocusMinutes ?? 0, creditedMinutes),
    lastFocusDate: currentDay,
    recentSessions,
    previewProgress: null,
    session: {
      status: 'idle',
      startedAt: null,
      pausedAt: null,
      pausedDurationMs: 0,
      durationMinutes: state.selectedDurationMinutes,
      completedAt: now,
    },
  }
}

export function resetSession(state) {
  return {
    ...state,
    previewProgress: null,
    session: {
      status: 'idle',
      startedAt: null,
      pausedAt: null,
      pausedDurationMs: 0,
      durationMinutes: state.selectedDurationMinutes,
    },
  }
}

export function setPreviewProgress(state, progress) {
  return { ...state, previewProgress: progress == null ? null : clamp(progress) }
}

export function setDuration(state, minutes) {
  if (state.session.status !== 'idle') return state
  return {
    ...state,
    selectedDurationMinutes: minutes,
    session: { ...state.session, durationMinutes: minutes },
  }
}

export function selectCreature(state, id) {
  if (!CREATURE_BY_ID[id]) return state
  return { ...state, activeCreatureId: id, previewProgress: null }
}

export function setSetting(state, key, value) {
  if (!(key in state.settings)) return state
  return { ...state, settings: { ...state.settings, [key]: value } }
}

export function loadGameState(storage = globalThis.localStorage) {
  const initial = createInitialGameState()
  if (!storage) return initial
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw)
    const progress = { ...initial.progress, ...(parsed.progress ?? {}) }
    const earnedByProgress = CREATURES.filter(creature => (progress[creature.id] ?? 0) >= creature.requiredMinutes).map(creature => creature.id)
    const revivedIds = [...new Set([...(parsed.revivedIds ?? []), ...earnedByProgress])].filter((id) => CREATURE_BY_ID[id])
    return {
      ...initial,
      ...parsed,
      activeCreatureId: CREATURE_BY_ID[parsed.activeCreatureId] ? parsed.activeCreatureId : initial.activeCreatureId,
      progress,
      revivedIds,
      settings: { ...initial.settings, ...(parsed.settings ?? {}) },
      recentSessions: Array.isArray(parsed.recentSessions) ? parsed.recentSessions.slice(0,14) : initial.recentSessions,
      session: { ...initial.session, ...(parsed.session ?? {}) },
    }
  } catch {
    return initial
  }
}

export function saveGameState(state, storage = globalThis.localStorage) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Persistence failure should not block focus flow.
  }
}

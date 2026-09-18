import { clamp } from '../domain/focus.mjs'
import { CREATURE_BY_ID, CREATURES } from '../data/creatures.mjs'

export const STORAGE_KEY = 'dinova.game.v1'

export function createInitialGameState() {
  return {
    activeCreatureId: 'brachiosaurus',
    selectedDurationMinutes: 25,
    previewProgress: null,
    progress: Object.fromEntries(CREATURES.map((creature) => [creature.id, creature.id === 'brachiosaurus' ? 48 : 0])),
    revivedIds: [],
    totalFocusMinutes: 0,
    completedSessions: 0,
    streakDays: 0,
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

  return {
    ...state,
    progress: { ...state.progress, [creature.id]: nextMinutes },
    revivedIds,
    totalFocusMinutes: state.totalFocusMinutes + creditedMinutes,
    completedSessions: state.completedSessions + 1,
    streakDays: Math.max(1, state.streakDays),
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

export function loadGameState(storage = globalThis.localStorage) {
  const initial = createInitialGameState()
  if (!storage) return initial
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw)
    return {
      ...initial,
      ...parsed,
      progress: { ...initial.progress, ...(parsed.progress ?? {}) },
      revivedIds: (parsed.revivedIds ?? []).filter((id) => CREATURE_BY_ID[id]),
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

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createInitialGameState,
  startSession,
  pauseSession,
  resumeSession,
  completeSession,
  setPreviewProgress,
} from './gameStore.mjs'

test('initial state starts with Brachiosaurus selected and preview off', () => {
  const state = createInitialGameState()
  assert.equal(state.activeCreatureId, 'brachiosaurus')
  assert.equal(state.session.status, 'idle')
  assert.equal(state.previewProgress, null)
})

test('start and pause session preserve exact timestamp accounting', () => {
  let state = createInitialGameState()
  state = startSession(state, 1_000, 25)
  assert.equal(state.session.status, 'running')
  assert.equal(state.session.startedAt, 1_000)

  state = pauseSession(state, 61_000)
  assert.equal(state.session.status, 'paused')
  assert.equal(state.session.pausedAt, 61_000)
})

test('resume accumulates paused duration', () => {
  let state = createInitialGameState()
  state = startSession(state, 1_000, 25)
  state = pauseSession(state, 61_000)
  state = resumeSession(state, 121_000)
  assert.equal(state.session.status, 'running')
  assert.equal(state.session.pausedDurationMs, 60_000)
})

test('completing a session credits focus minutes and revives creature at 100%', () => {
  let state = createInitialGameState()
  state.progress.brachiosaurus = 110
  state = startSession(state, 1_000, 15)
  state = completeSession(state, 901_000)
  assert.equal(state.progress.brachiosaurus, 125)
  assert.ok(state.revivedIds.includes('brachiosaurus'))
  assert.equal(state.totalFocusMinutes, 15)
  assert.equal(state.completedSessions, 1)
})

test('preview progress clamps into normalized range', () => {
  let state = createInitialGameState()
  state = setPreviewProgress(state, 1.5)
  assert.equal(state.previewProgress, 1)
  state = setPreviewProgress(state, -1)
  assert.equal(state.previewProgress, 0)
})

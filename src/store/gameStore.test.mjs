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
import { CREATURE_BY_ID } from '../data/creatures.mjs'

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
  state.progress.brachiosaurus = 15
  state = startSession(state, 1_000, 15)
  state = completeSession(state, 901_000)
  assert.equal(state.progress.brachiosaurus, 30)
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


test('settings persist in game state and can be toggled', async () => {
  const { setSetting } = await import('./gameStore.mjs')
  let state = createInitialGameState()
  assert.equal(state.settings.sound, true)
  assert.equal(state.settings.reduceMotion, false)
  state = setSetting(state, 'sound', false)
  state = setSetting(state, 'reduceMotion', true)
  assert.deepEqual(state.settings, { sound:false, reduceMotion:true })
})


test('first Brachiosaurus revival fits one standard 25 minute focus session', () => {
  const state = createInitialGameState()
  assert.equal(state.progress.brachiosaurus, 0)
  assert.equal(CREATURE_BY_ID.brachiosaurus.requiredMinutes, 25)
})

test('streak advances only on consecutive calendar days', () => {
  let state=createInitialGameState()
  state=startSession(state,new Date('2026-09-18T09:00:00').getTime(),25)
  state=completeSession(state,new Date('2026-09-18T09:25:00').getTime())
  assert.equal(state.streakDays,1)
  state=startSession(state,new Date('2026-09-19T09:00:00').getTime(),25)
  state=completeSession(state,new Date('2026-09-19T09:25:00').getTime())
  assert.equal(state.streakDays,2)
  state=startSession(state,new Date('2026-09-22T09:00:00').getTime(),25)
  state=completeSession(state,new Date('2026-09-22T09:25:00').getTime())
  assert.equal(state.streakDays,1)
})

test('completion stores longest focus and recent session history', () => {
  let state=createInitialGameState()
  state=startSession(state,1_000,45)
  state=completeSession(state,2_701_000)
  assert.equal(state.longestFocusMinutes,45)
  assert.equal(state.recentSessions.length,1)
  assert.equal(state.recentSessions[0].durationMinutes,45)
})

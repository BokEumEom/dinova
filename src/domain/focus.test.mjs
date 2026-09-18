import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateRemainingMs, progressForFocusedMinutes, formatClock } from './focus.mjs'

test('remaining time uses timestamps and paused duration', () => {
  const remaining = calculateRemainingMs({
    durationMs: 25 * 60_000,
    startedAt: 1_000_000,
    now: 1_600_000,
    pausedDurationMs: 120_000,
  })
  assert.equal(remaining, 25 * 60_000 - 480_000)
})

test('remaining time never becomes negative', () => {
  assert.equal(calculateRemainingMs({ durationMs: 1_000, startedAt: 0, now: 10_000, pausedDurationMs: 0 }), 0)
})

test('creature progress is clamped between zero and one', () => {
  assert.equal(progressForFocusedMinutes(-20, 100), 0)
  assert.equal(progressForFocusedMinutes(50, 100), 0.5)
  assert.equal(progressForFocusedMinutes(150, 100), 1)
})

test('clock formats milliseconds as mm:ss', () => {
  assert.equal(formatClock(1_499_000), '24:59')
})

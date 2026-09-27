export function remainingSeconds(session, now = Date.now()) {
  if (!session.running || !session.endsAt) return Math.max(0, session.remaining);
  return Math.max(0, Math.ceil((session.endsAt - now) / 1000));
}
export function progressPercent(session, now = Date.now()) {
  return Math.min(100, Math.max(0, (1 - remainingSeconds(session, now) / session.duration) * 100));
}
export function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
export function startSession(session, now = Date.now()) {
  return { ...session, running: true, endsAt: now + session.remaining * 1000 };
}
export function pauseSession(session, now = Date.now()) {
  return { ...session, remaining: remainingSeconds(session, now), running: false, endsAt: null };
}

/** @param {import('./state').Saved} saved @param {number} now */
export function finishSession(saved, now = Date.now()) {
  if (!saved.session.running || remainingSeconds(saved.session, now) > 0) return saved;
  const { target, duration } = saved.session;
  const collected = [...new Set([...saved.collected, target])];
  const next = Array.from({length: 18}, (_, i) => i).find(i => !collected.includes(i));
  return {
    ...saved,
    collected,
    history: [...saved.history, {date: new Date(now).toISOString(), seconds: duration, target}],
    session: {duration, remaining: duration, running: false, endsAt: null, target: next ?? target},
  };
}

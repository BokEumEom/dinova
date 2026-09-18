import React from 'react'
import { CREATURES, CREATURE_BY_ID } from './data/creatures.mjs'
import { calculateRemainingMs, formatClock, progressForFocusedMinutes, visualMeltStage } from './domain/focus.mjs'
import {
  completeSession, loadGameState, pauseSession, resetSession, resumeSession,
  saveGameState, selectCreature, setDuration, setPreviewProgress, startSession,
} from './store/gameStore.mjs'

const ASSETS = {
  brachiosaurus: '/assets/brachiosaurus-master.webp',
}

const NAV = [
  ['meltime', '◷', 'MelTime'],
  ['collection', '▤', 'Collection'],
  ['map', '⌖', 'Map'],
  ['profile', '●', 'Profile'],
]

const percent = (n) => `${Math.round(n * 100)}%`

function liveSessionMinutes(game, now) {
  const s = game.session
  if (s.startedAt == null || s.status === 'idle') return 0
  const end = s.status === 'paused' && s.pausedAt != null ? s.pausedAt : now
  return Math.max(0, end - s.startedAt - s.pausedDurationMs) / 60000
}

function BrandHeader({ title, subtitle, right }) {
  return <header className="screen-header">
    <div><div className="eyebrow">DINOVA</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    {right || null}
  </header>
}

function BottomNav({ tab, onTab }) {
  return <nav className="bottom-nav" aria-label="Primary navigation">
    {NAV.map(([id, icon, label]) => <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} onClick={() => onTab(id)}>
      <span className="nav-icon">{icon}</span><span>{label}</span>
    </button>)}
  </nav>
}

class MeltVisual extends React.Component {
  constructor(props) { super(props); this.canvas = React.createRef(); this.controller = null; this.state = { fallback: false } }
  componentDidMount() { this.mountScene() }
  componentDidUpdate(prev) {
    if (prev.creatureId !== this.props.creatureId) {
      this.controller?.destroy()
      this.mountScene()
    } else if (prev.progress !== this.props.progress) {
      this.controller?.setProgress(this.props.progress)
    }
  }
  componentWillUnmount() { this.controller?.destroy() }
  mountScene() {
    this.setState({ fallback: false })
    import('./three/scenes.js').then(({ createMeltScene }) => {
      this.controller = createMeltScene(this.canvas.current, this.props.progress, this.props.creatureId)
    }).catch(() => this.setState({ fallback: true }))
  }
  render() {
    return <div className="visual-stack">
      <canvas ref={this.canvas} className="three-canvas melt-canvas" aria-label={`3D frozen ${this.props.creatureId} revival scene`} />
      {this.state.fallback && <img className="fallback-creature" src={this.props.fallbackSrc || ASSETS.brachiosaurus} alt={`${this.props.creatureId} visual fallback`} />}
    </div>
  }
}

class MapVisual extends React.Component {
  constructor(props) { super(props); this.canvas = React.createRef(); this.controller = null; this.state = { fallback: false } }
  componentDidMount() { this.mountScene() }
  componentDidUpdate(prev) { if (prev.revivedKey !== this.props.revivedKey) { this.controller?.destroy(); this.mountScene() } }
  componentWillUnmount() { this.controller?.destroy() }
  mountScene() {
    import('./three/scenes.js').then(({ createMeadowScene }) => {
      this.controller = createMeadowScene(this.canvas.current, this.props.revivedIds, this.props.onCreatureClick)
    }).catch(() => this.setState({ fallback: true }))
  }
  render() {
    return <div className="visual-stack map-fallback-bg">
      <canvas ref={this.canvas} className="three-canvas map-canvas" aria-label="Interactive 3D meadow map" />
      {this.state.fallback && <div className="offline-map-fallback"><img src="/assets/brachiosaurus-master.webp" alt="Brachiosaurus" /><span>3D Meadow loads when Three.js is available.</span></div>}
    </div>
  }
}

class MelTimeScreen extends React.Component {
  constructor(props) { super(props); this.state = { now: Date.now() }; this.timer = null }
  componentDidMount() { this.syncTimer() }
  componentDidUpdate(prev) {
    if (prev.game.session.status !== this.props.game.session.status) this.syncTimer()
    if (this.props.game.session.status === 'running' && this.remaining() <= 0) this.props.update(s => completeSession(s, Date.now()))
  }
  componentWillUnmount() { clearInterval(this.timer) }
  syncTimer() {
    clearInterval(this.timer)
    if (this.props.game.session.status === 'running') this.timer = setInterval(() => this.setState({ now: Date.now() }), 250)
  }
  remaining() {
    const game = this.props.game, s = game.session
    if (s.status === 'idle') return game.selectedDurationMinutes * 60000
    return calculateRemainingMs({ durationMs: s.durationMinutes * 60000, startedAt: s.startedAt, now: s.status === 'paused' ? s.pausedAt : this.state.now, pausedDurationMs: s.pausedDurationMs })
  }
  render() {
    const { game, update } = this.props
    const creature = CREATURE_BY_ID[game.activeCreatureId]
    const remaining = this.remaining()
    const focused = (game.progress[creature.id] || 0) + liveSessionMinutes(game, this.state.now)
    const actual = progressForFocusedMinutes(focused, creature.requiredMinutes)
    const melt = game.previewProgress == null ? actual : game.previewProgress
    const toggle = () => {
      const s = game.session.status
      if (s === 'idle') update(x => startSession(x, Date.now(), game.selectedDurationMinutes))
      else if (s === 'running') update(x => pauseSession(x, Date.now()))
      else update(x => resumeSession(x, Date.now()))
    }
    return <section className="screen meltime-screen">
      <BrandHeader title="MelTime" subtitle="집중한 시간만큼 얼음을 녹이고, 생명체를 깨웁니다." right={<span className="day-chip">DAY 01</span>} />
      <div className="revival-stage">
        <MeltVisual progress={melt} creatureId={creature.id} fallbackSrc={ASSETS[creature.id] || ASSETS.brachiosaurus} />
        <div className="creature-tag"><span>{creature.koName}</span><strong>{creature.name}</strong></div>
        <div className="stage-badge">{visualMeltStage(melt).replace('-', ' ')}</div>
      </div>
      <div className="revival-summary">
        <div><span>Revival progress</span><strong>{percent(actual)}</strong></div>
        <div className="progress-track"><i style={{ width: percent(actual) }} /></div>
        <small>{Math.ceil(Math.max(0, creature.requiredMinutes - focused))}분 더 집중하면 이 생명체가 깨어납니다.</small>
      </div>
      <div className="preview-card">
        <div className="card-title-row"><strong>Melt Preview</strong><button className="text-button" onClick={() => update(s => setPreviewProgress(s, null))}>실제 진행률</button></div>
        <input aria-label="Melt preview" type="range" min="0" max="100" value={Math.round(melt * 100)} onInput={(e) => update(s => setPreviewProgress(s, Number(e.currentTarget.value) / 100))} />
        <div className="range-labels"><span>Frozen</span><span>Reveal</span><span>Revived</span></div>
      </div>
      <div className="timer-card">
        <div className="session-progress"><i style={{ width: `${Math.max(0, Math.min(100, (1 - remaining/(game.selectedDurationMinutes*60000))*100))}%` }} /></div>
        <div className="timer">{formatClock(remaining)}</div>
        <button className={`focus-button ${game.session.status}`} onClick={toggle}>{game.session.status === 'running' ? 'Ⅱ' : '▶'}</button>
        <div className="duration-row">{[15,25,45,60].map(n => <button key={n} disabled={game.session.status !== 'idle'} className={game.selectedDurationMinutes === n ? 'selected' : ''} onClick={() => update(s => setDuration(s,n))}>{n}</button>)}</div>
        {game.session.status !== 'idle' && <button className="reset-link" onClick={() => update(resetSession)}>세션 초기화</button>}
      </div>
    </section>
  }
}

function CollectionScreen({ game, update, goMelTime }) {
  const choose = id => { update(s => selectCreature(s,id)); goMelTime() }
  return <section className="screen collection-screen">
    <BrandHeader title="Collection" subtitle="깨어난 생명체들과 함께해요." right={<strong className="count-pill">{game.revivedIds.length} / {CREATURES.length}</strong>} />
    <div className="filter-row"><button className="active">All</button><button>Land</button><button>Sky</button><button>Water</button></div>
    <div className="collection-grid">{CREATURES.map(creature => {
      const p = progressForFocusedMinutes(game.progress[creature.id] || 0, creature.requiredMinutes)
      const revived = game.revivedIds.includes(creature.id)
      const asset = ASSETS[creature.id]
      return <button key={creature.id} className={`collection-card ${game.activeCreatureId===creature.id?'selected-creature':''}`} onClick={() => choose(creature.id)}>
        <div className={`asset-box ${!revived && p === 0 ? 'locked' : ''}`}>{asset ? <img src={asset} alt={creature.name}/> : <div className="silhouette-shape">{creature.name[0]}</div>}{revived && <span className="revived-mark">✓</span>}{!revived && p===0 && <span className="lock-mark">◇</span>}</div>
        <div className="collection-copy"><strong>{p>0 || revived ? creature.name : '???'}</strong><span>{revived ? 'Revived' : p>0 ? `${Math.round(p*100)}% awake` : creature.rarity}</span></div>
        {p>0 && !revived && <div className="mini-progress"><i style={{width:percent(p)}} /></div>}
      </button>
    })}</div>
  </section>
}

class MapScreen extends React.Component {
  constructor(props) { super(props); this.state={ selected:null } }
  render() {
    const { game, update } = this.props
    const selected = this.state.selected ? CREATURE_BY_ID[this.state.selected] : null
    return <section className="screen map-screen">
      <BrandHeader title="World Map" subtitle="집중이 모여, 새로운 세상이 열립니다." right={<span className="count-pill">{game.revivedIds.length} / 6</span>} />
      <div className="map-tabs"><button className="active">Sunny Plains</button><button disabled>Snowy Ridge</button><button disabled>Ancient Forest</button></div>
      <div className="map-stage">
        <MapVisual revivedIds={game.revivedIds} revivedKey={game.revivedIds.join('|')} onCreatureClick={id => this.setState({selected:id})} />
        <div className="map-hud"><span>DRAG TO EXPLORE</span><span>PINCH / WHEEL TO ZOOM</span></div>
        {selected && <div className="map-creature-pop"><span>Habitat resident</span><strong>{selected.name}</strong><button onClick={() => update(s=>selectCreature(s,selected.id))}>집중 대상으로 선택</button></div>}
      </div>
      <div className="map-info-card"><div><span>MAP 01</span><strong>Sunny Plains</strong></div><p>깨어난 생명체가 초원에 합류합니다. 집중할수록 더 많은 친구와 지역이 열립니다.</p></div>
    </section>
  }
}

function ProfileScreen({ game }) {
  const stats = [['Total focus',`${game.totalFocusMinutes}m`,'◷'],['Sessions',game.completedSessions,'▶'],['Revived',`${game.revivedIds.length}/${CREATURES.length}`,'◇'],['Current streak',`${game.streakDays}d`,'⌁'],['Longest focus',`${game.completedSessions ? game.selectedDurationMinutes : 0}m`,'△'],['Maps unlocked','1/5','▱']]
  return <section className="screen profile-screen">
    <BrandHeader title="Explorer" subtitle="오늘도, 조금 더 멋진 세계를 위해." right={<button className="settings-button">⚙</button>} />
    <div className="profile-hero"><div className="avatar-ring"><img src="/assets/brachiosaurus-master.webp" alt="Brachiosaurus companion"/></div><div><span>DINOVA EXPLORER</span><strong>Focus Keeper</strong><p>Focus today. Revive the past.</p></div></div>
    <div className="stats-grid">{stats.map(([label,value,icon]) => <div className="stat-card" key={label}><span className="stat-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>)}</div>
    <div className="achievement-card"><div className="card-title-row"><strong>Achievements</strong><span>0 / 8</span></div><div className="badges"><div>◷<span>First Focus</span></div><div>◇<span>First Revival</span></div><div>△<span>Deep Focus</span></div><div>▱<span>Explorer</span></div></div></div>
    <blockquote>“집중한 시간은 사라지지 않습니다. 이 세계의 한 조각이 됩니다.”</blockquote>
  </section>
}

export default class App extends React.Component {
  constructor(props) { super(props); this.state = { tab:'meltime', game: loadGameState() } }
  update = (transform) => this.setState(prev => { const next = transform(prev.game); saveGameState(next); return { game: next } })
  render() {
    const { tab, game } = this.state
    return <main className="app-shell">
      <div className="ambient-orb orb-one"/><div className="ambient-orb orb-two"/>
      <div className={`app-frame theme-${tab}`}>
        <div className="status-bar"><span className="brand-script">Dinova</span><span className="status-icons">● ◔ ▰</span></div>
        <div className="screen-scroll">
          {tab==='meltime' && <MelTimeScreen game={game} update={this.update}/>} 
          {tab==='collection' && <CollectionScreen game={game} update={this.update} goMelTime={()=>this.setState({tab:'meltime'})}/>} 
          {tab==='map' && <MapScreen game={game} update={this.update}/>} 
          {tab==='profile' && <ProfileScreen game={game}/>} 
        </div>
        <BottomNav tab={tab} onTab={tab => this.setState({tab})}/>
      </div>
      <aside className="desktop-story">
        <span className="story-kicker">FOCUS · MELT · REVIVE</span><h2>집중한 시간으로<br/>살아있는 세계를 만듭니다.</h2><p>첨부한 브라키오사우루스를 Master Art Direction으로 고정해 민트 로우폴리, 아이보리 배, 검은 점눈, 차분한 미소를 전체 캐릭터에 적용합니다.</p>
        <div className="story-creature"><img src="/assets/brachiosaurus-master.webp" alt="DINOVA master Brachiosaurus"/></div>
        <div className="story-note"><b>Master art direction</b><span>Mint low-poly · Ivory belly · Dot eyes · Calm smile</span></div>
      </aside>
    </main>
  }
}


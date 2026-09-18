import React from 'react'
import { CREATURES, CREATURE_BY_ID } from './data/creatures.mjs'
import { MAP_AREAS, mapAreaForCreature } from './data/mapSlots.mjs'
import { calculateRemainingMs, formatClock, progressForFocusedMinutes, visualMeltStage } from './domain/focus.mjs'
import {
  completeSession, createInitialGameState, loadGameState, pauseSession, resetSession, resumeSession,
  saveGameState, selectCreature, setDuration, setPreviewProgress, setSetting, startSession,
} from './store/gameStore.mjs'

const ASSET_SHEET = '/assets/dinova-creatures-15.webp'

function CreatureArt({ creature, className = '', locked = false }) {
  const index = creature?.spriteIndex ?? 0
  const col = index % 3
  const row = Math.floor(index / 3)
  return <span
    className={`creature-art ${className} ${locked ? 'is-locked' : ''}`}
    role="img"
    aria-label={creature?.name || 'DINOVA creature'}
    style={{
      backgroundImage: `url("${ASSET_SHEET}")`,
      backgroundPosition: `${col * 50}% ${row * 25}%`,
    }}
  />
}
const NAV = [
  ['meltime', '◷', '멜타임'],
  ['collection', '▤', '도감'],
  ['map', '⌖', '지도'],
  ['profile', '●', '프로필'],
]

const percent = (n) => `${Math.round(n * 100)}%`

function playCompleteFeedback(settings) {
  if (navigator.vibrate) navigator.vibrate([35, 30, 55])
  if (!settings?.sound) return
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const now = ctx.currentTime
    ;[523.25,659.25,783.99].forEach((frequency,index)=>{
      const osc=ctx.createOscillator(),gain=ctx.createGain()
      osc.type='sine';osc.frequency.value=frequency
      gain.gain.setValueAtTime(.0001,now+index*.09)
      gain.gain.exponentialRampToValueAtTime(.08,now+index*.09+.02)
      gain.gain.exponentialRampToValueAtTime(.0001,now+index*.09+.16)
      osc.connect(gain);gain.connect(ctx.destination);osc.start(now+index*.09);osc.stop(now+index*.09+.18)
    })
    setTimeout(()=>ctx.close().catch(()=>{}),700)
  } catch {}
}

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
    const creature = CREATURE_BY_ID[this.props.creatureId] || CREATURES[0]
    return <div className="visual-stack">
      <CreatureArt creature={creature} className="melt-creature-art" />
      <canvas ref={this.canvas} className="three-canvas melt-canvas" aria-label={`얼음 속 ${creature.name} 해빙 효과`} />
      {this.state.fallback && <div className="ice-fallback" />}
    </div>
  }
}

class MapVisual extends React.Component {
  constructor(props) { super(props); this.canvas = React.createRef(); this.controller = null; this.state = { fallback: false } }
  componentDidMount() { this.mountScene() }
  componentDidUpdate(prev) { if (prev.revivedKey !== this.props.revivedKey || prev.areaId !== this.props.areaId) { this.controller?.destroy(); this.mountScene() } }
  componentWillUnmount() { this.controller?.destroy() }
  resetCamera = () => this.controller?.resetCamera?.()
  mountScene() {
    import('./three/scenes.js').then(({ createMeadowScene }) => {
      this.controller = createMeadowScene(this.canvas.current, this.props.revivedIds, this.props.onCreatureClick, this.props.areaId)
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
  constructor(props) { super(props); this.state = { now: Date.now() }; this.timer = null; this.wakeLock = null }
  componentDidMount() {
    this.syncTimer()
    this.syncDocumentTitle()
    document.addEventListener('visibilitychange', this.handleVisibility)
    window.addEventListener('keydown', this.handleKeyDown)
  }
  componentDidUpdate(prev) {
    if (prev.game.session.status !== this.props.game.session.status) this.syncTimer()
    this.syncDocumentTitle()
    if (this.props.game.session.status === 'running' && this.remaining() <= 0) this.props.update(s => completeSession(s, Date.now()))
  }
  componentWillUnmount() {
    clearInterval(this.timer)
    document.removeEventListener('visibilitychange', this.handleVisibility)
    window.removeEventListener('keydown', this.handleKeyDown)
    this.releaseWakeLock()
    document.title = 'DINOVA — Focus. Melt. Revive.'
  }
  handleVisibility = () => {
    this.setState({ now: Date.now() })
    if (document.visibilityState === 'visible' && this.props.game.session.status === 'running') this.requestWakeLock()
  }
  handleKeyDown = (event) => {
    const tag = event.target?.tagName
    if (event.code !== 'Space' || tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA') return
    event.preventDefault()
    this.toggleSession()
  }
  async requestWakeLock() {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try { this.wakeLock = await navigator.wakeLock.request('screen') } catch {}
  }
  async releaseWakeLock() {
    try { await this.wakeLock?.release() } catch {}
    this.wakeLock = null
  }
  syncTimer() {
    clearInterval(this.timer)
    if (this.props.game.session.status === 'running') {
      this.requestWakeLock()
      this.timer = setInterval(() => this.setState({ now: Date.now() }), 250)
    } else {
      this.releaseWakeLock()
    }
  }
  syncDocumentTitle() {
    if (this.props.game.session.status === 'idle') document.title = 'DINOVA — Focus. Melt. Revive.'
    else document.title = `${formatClock(this.remaining())} · DINOVA`
  }
  toggleSession = () => {
    const { game, update } = this.props
    const status = game.session.status
    if (status === 'idle') update(state => startSession(state, Date.now(), game.selectedDurationMinutes))
    else if (status === 'running') update(state => pauseSession(state, Date.now()))
    else update(state => resumeSession(state, Date.now()))
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
    return <section className="screen meltime-screen">
      <BrandHeader title="MelTime" subtitle="지금, 하나의 집중이 한 친구를 더 가까이 깨워요." right={<span className="day-chip">{creature.biomeName}</span>} />
      <div className="revival-stage">
        <MeltVisual progress={melt} creatureId={creature.id} />
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
        <button className={`focus-button ${game.session.status}`} onClick={this.toggleSession}>{game.session.status === 'running' ? 'Ⅱ' : '▶'}</button>
        <div className="duration-row">{[15,25,45,60].map(n => <button key={n} disabled={game.session.status !== 'idle'} className={game.selectedDurationMinutes === n ? 'selected' : ''} onClick={() => update(s => setDuration(s,n))}>{n}</button>)}</div>
        {game.session.status !== 'idle' && <button className="reset-link" onClick={() => update(resetSession)}>세션 초기화</button>}
      </div>
    </section>
  }
}

function CollectionScreen({ game, update, goMelTime }) {
  const [filter, setFilter] = React.useState('all')
  const [detailId, setDetailId] = React.useState(null)
  const filters = [['all','전체'],['meadow','초원'],['snowy-ridge','설원'],['ancient-forest','고대 숲'],['locked','미발견']]
  const visible = CREATURES.filter((creature) => {
    const p = progressForFocusedMinutes(game.progress[creature.id] || 0, creature.requiredMinutes)
    if (filter === 'all') return true
    if (filter === 'locked') return !game.revivedIds.includes(creature.id) && p === 0
    return creature.biomeId === filter
  })
  const detail = detailId ? CREATURE_BY_ID[detailId] : null
  const choose = id => { update(s => selectCreature(s,id)); setDetailId(null); goMelTime() }

  return <section className="screen collection-screen">
    <BrandHeader title="빙하 도감" subtitle="차가운 얼음 속, 언젠가 다시 만날 친구들." right={<strong className="count-pill">{game.revivedIds.length} / {CREATURES.length}</strong>} />
    <div className="filter-row">{filters.map(([id,label]) => <button key={id} className={filter===id?'active':''} onClick={() => setFilter(id)}>{label}</button>)}</div>
    <div className="collection-grid">{visible.map(creature => {
      const p = progressForFocusedMinutes(game.progress[creature.id] || 0, creature.requiredMinutes)
      const revived = game.revivedIds.includes(creature.id)
      return <button key={creature.id} className={`collection-card ${game.activeCreatureId===creature.id?'selected-creature':''}`} onClick={() => setDetailId(creature.id)}>
        <div className="asset-box"><div className="ice-card-shape" /><CreatureArt creature={creature} locked={!revived && p === 0} />{revived && <span className="revived-mark">✓</span>}{!revived && p===0 && <span className="lock-mark">◇</span>}</div>
        <div className="collection-copy"><strong>{p>0 || revived ? creature.name : '???'}</strong><span>{revived ? 'Revived' : p>0 ? `${Math.round(p*100)}% awake` : creature.biomeName}</span></div>
        <div className="mini-progress"><i style={{width:percent(p)}} /></div>
      </button>
    })}</div>
    {detail && <div className="detail-backdrop" onClick={() => setDetailId(null)}>
      <article className="creature-sheet" onClick={event => event.stopPropagation()}>
        <button className="sheet-close" onClick={() => setDetailId(null)}>×</button>
        <CreatureArt creature={detail} className="sheet-creature" />
        <span className="sheet-kicker">{detail.biomeName} · {detail.rarity.toUpperCase()}</span>
        <h2>{detail.name}</h2>
        <p>{detail.koName}</p>
        <div className="sheet-progress"><span>Revival Progress</span><strong>{percent(progressForFocusedMinutes(game.progress[detail.id] || 0, detail.requiredMinutes))}</strong></div>
        <div className="progress-track"><i style={{width:percent(progressForFocusedMinutes(game.progress[detail.id] || 0, detail.requiredMinutes))}} /></div>
        <button className="primary-cta" onClick={() => choose(detail.id)}>이 친구 깨우기</button>
      </article>
    </div>}
  </section>
}

class MapScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state={ selected:null, areaId:mapAreaForCreature(props.game.activeCreatureId) }
    this.mapRef=React.createRef()
  }
  render() {
    const { game, update } = this.props
    const { areaId } = this.state
    const area = MAP_AREAS.find(item=>item.id===areaId) || MAP_AREAS[0]
    const selected = this.state.selected ? CREATURE_BY_ID[this.state.selected] : null
    const residents = CREATURES.filter(creature=>mapAreaForCreature(creature.id)===areaId)
    const revivedResidents = game.revivedIds.filter(id=>mapAreaForCreature(id)===areaId)
    const active = CREATURE_BY_ID[game.activeCreatureId] || CREATURES[0]
    const activeRemaining = Math.max(0,active.requiredMinutes-(game.progress[active.id]||0))
    return <section className="screen map-screen immersive-map-screen">
      <BrandHeader title="탐험 지도" subtitle="집중이 쌓일수록, 살아있는 공룡 공원이 커집니다." />
      <div className="map-stage dino-park-stage">
        <MapVisual ref={this.mapRef} areaId={areaId} revivedIds={revivedResidents} revivedKey={`${areaId}|${revivedResidents.join('|')}`} onCreatureClick={id => this.setState({selected:id})} />
        <div className="park-status-card">
          <span>{area.koName}</span>
          <strong>{area.name}</strong>
          <div><b>{revivedResidents.length}/{residents.length}</b><i><em style={{width:`${residents.length?revivedResidents.length/residents.length*100:0}%`}} /></i></div>
        </div>
        <div className="park-resource-row">
          <span>🌿 {game.totalFocusMinutes}</span>
          <span>◇ {game.revivedIds.length}</span>
          <button aria-label="카메라 초기화" onClick={()=>this.mapRef.current?.resetCamera()}>↺</button>
        </div>
        <div className="map-area-dock">{MAP_AREAS.map(item=><button key={item.id} className={areaId===item.id?'active':''} onClick={()=>this.setState({areaId:item.id,selected:null})}>{item.koName}</button>)}</div>
        {revivedResidents.length === 0 && <div className="map-empty-state"><span>◇</span><strong>이 지역은 아직 조용해요</strong><p>해당 지역의 친구를 부활시키면 이 3D 공원에 나타납니다.</p></div>}
        {selected && <div className="map-creature-pop"><span>{area.koName} resident</span><strong>{selected.koName}</strong><small>{selected.name}</small><button onClick={() => update(s=>selectCreature(s,selected.id))}>집중 대상으로 선택</button></div>}
        <div className="park-growth-card"><span>🌱 다음 부활까지</span><strong>{activeRemaining}분</strong><small>{active.koName}</small></div>
      </div>
      <div className="map-info-card"><div><span>3D HABITAT</span><strong>{area.name}</strong></div><p>드래그해서 둘러보고 공룡을 탭해 보세요. 부활한 친구만 실제 서식지에 등장합니다.</p></div>
    </section>
  }
}

function ProfileScreen({ game, update }) {
  const [settingsOpen,setSettingsOpen]=React.useState(false)
  const [confirmReset,setConfirmReset]=React.useState(false)
  const active = CREATURE_BY_ID[game.activeCreatureId] || CREATURES[0]
  const stats = [
    ['총 집중 시간',`${game.totalFocusMinutes}m`,'◷'],
    ['완료 세션',game.completedSessions,'▶'],
    ['부활한 친구',`${game.revivedIds.length}/${CREATURES.length}`,'◇'],
    ['연속 집중',`${game.streakDays}일`,'⌁'],
    ['최장 집중',`${game.completedSessions ? game.selectedDurationMinutes : 0}m`,'△'],
    ['방문한 지역',`${new Set(game.revivedIds.map(mapAreaForCreature)).size || 0}/${MAP_AREAS.length}`,'▱'],
  ]
  const badges = [
    ['◷','첫 집중',game.completedSessions > 0],
    ['◇','첫 부활',game.revivedIds.length > 0],
    ['△','1시간 집중',game.totalFocusMinutes >= 60],
    ['▱','탐험가',new Set(game.revivedIds.map(mapAreaForCreature)).size >= 2],
  ]
  const resetAll=()=>{
    if(!confirmReset){setConfirmReset(true);return}
    update(()=>createInitialGameState())
    setConfirmReset(false);setSettingsOpen(false)
  }
  return <section className="screen profile-screen">
    <BrandHeader title="나의 기록" subtitle="작은 시간이 모여, 잊혔던 세계를 다시 푸르게." right={<button className="settings-button" aria-label="설정" onClick={()=>setSettingsOpen(true)}>⚙</button>} />
    <div className="profile-hero"><div className="avatar-ring"><CreatureArt creature={active} /></div><div><span>MY COMPANION</span><strong>{active.koName}</strong><p>{active.name}</p></div></div>
    <div className="stats-grid">{stats.map(([label,value,icon]) => <div className="stat-card" key={label}><span className="stat-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>)}</div>
    <div className="achievement-card"><div className="card-title-row"><strong>나의 배지</strong><span>{badges.filter(([, , earned]) => earned).length} / {badges.length}</span></div><div className="badges">{badges.map(([icon,label,earned]) => <div key={label} className={earned ? 'earned' : ''}>{icon}<span>{label}</span></div>)}</div></div>
    <blockquote>“좋은 집중이, 더 많은 친구를 깨어나게 해요.”</blockquote>
    {settingsOpen && <div className="detail-backdrop" onClick={()=>{setSettingsOpen(false);setConfirmReset(false)}}>
      <article className="settings-sheet" onClick={event=>event.stopPropagation()}>
        <div className="settings-title"><div><span>DINOVA</span><h2>설정</h2></div><button onClick={()=>{setSettingsOpen(false);setConfirmReset(false)}}>×</button></div>
        <label className="setting-row"><div><strong>집중 완료 알림음</strong><span>세션이 끝나면 짧은 소리와 진동으로 알려요.</span></div><input type="checkbox" checked={game.settings.sound} onChange={event=>update(state=>setSetting(state,'sound',event.target.checked))}/></label>
        <label className="setting-row"><div><strong>모션 줄이기</strong><span>전환과 장식 움직임을 최소화해요.</span></div><input type="checkbox" checked={game.settings.reduceMotion} onChange={event=>update(state=>setSetting(state,'reduceMotion',event.target.checked))}/></label>
        <button className={`danger-button ${confirmReset?'confirm':''}`} onClick={resetAll}>{confirmReset?'한 번 더 누르면 모든 기록이 초기화됩니다':'모든 로컬 기록 초기화'}</button>
        <p className="settings-note">모든 데이터는 현재 브라우저의 localStorage에만 저장됩니다.</p>
      </article>
    </div>}
  </section>
}

export default class App extends React.Component {
  constructor(props) { super(props); this.state = { tab:'meltime', game:loadGameState(), celebration:null } }
  update = (transform) => this.setState(prev => {
    const next = transform(prev.game)
    saveGameState(next)
    const completedNow = next.completedSessions > prev.game.completedSessions
    if (completedNow) playCompleteFeedback(next.settings)
    const newRevived = next.revivedIds.find(id => !prev.game.revivedIds.includes(id))
    return { game:next, celebration:newRevived || prev.celebration }
  })
  render() {
    const { tab, game, celebration } = this.state
    const celebratedCreature = celebration ? CREATURE_BY_ID[celebration] : null
    return <main className="app-shell">
      <div className="ambient-orb orb-one"/><div className="ambient-orb orb-two"/>
      <div className={`app-frame theme-${tab} ${game.settings.reduceMotion ? 'reduce-motion' : ''}`}>
        <div className="status-bar"><span className="brand-script">Dinova</span><span className="status-icons">● ◔ ▰</span></div>
        <div className="screen-scroll">
          {tab==='meltime' && <MelTimeScreen game={game} update={this.update}/>}
          {tab==='collection' && <CollectionScreen game={game} update={this.update} goMelTime={()=>this.setState({tab:'meltime'})}/>}
          {tab==='map' && <MapScreen game={game} update={this.update}/>}
          {tab==='profile' && <ProfileScreen game={game} update={this.update}/>} 
        </div>
        <BottomNav tab={tab} onTab={tab => this.setState({tab})}/>
        {celebratedCreature && <div className="revival-celebration">
          <div className="celebration-card">
            <span className="celebration-kicker">REVIVAL COMPLETE</span>
            <CreatureArt creature={celebratedCreature} className="celebration-creature" />
            <h2>{celebratedCreature.koName}</h2>
            <p>{celebratedCreature.name}가 깨어났어요.<br/>이제 3D 초원에서 만날 수 있습니다.</p>
            <button className="primary-cta" onClick={() => this.setState({tab:'map', celebration:null})}>지도에서 만나기</button>
            <button className="celebration-close" onClick={() => this.setState({celebration:null})}>계속 집중하기</button>
          </div>
        </div>}
      </div>
      <aside className="desktop-story">
        <span className="story-kicker">FOCUS · MELT · REVIVE</span><h2>집중한 시간으로<br/>살아있는 세계를 만듭니다.</h2><p>15종의 민트 로우폴리 공룡 에셋과 3D 서식지가 하나의 집중 루프로 연결됩니다.</p>
        <div className="story-creature"><CreatureArt creature={CREATURES[0]} /></div>
        <div className="story-note"><b>Master art direction</b><span>Mint low-poly · Ivory belly · Dot eyes · Calm smile</span></div>
      </aside>
    </main>
  }
}

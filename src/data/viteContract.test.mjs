import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = p => fs.readFileSync(path.join(root,p),'utf8')

test('web app declares React 19, Three and Vite as local package dependencies', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.match(pkg.dependencies.react, /^\^19\./)
  assert.match(pkg.dependencies['react-dom'], /^\^19\./)
  assert.ok(pkg.dependencies.three)
  assert.ok(pkg.devDependencies.vite)
  assert.ok(pkg.devDependencies['@vitejs/plugin-react'])
  assert.equal(pkg.scripts.dev, 'vite')
  assert.equal(pkg.scripts.build, 'vite build')
})

test('index boots Vite React entrypoint without CDN import maps or UMD globals', () => {
  const html = read('index.html')
  assert.match(html, /src="\/src\/main\.jsx"/)
  assert.doesNotMatch(html, /importmap/)
  assert.doesNotMatch(html, /react\.production\.min\.js/)
  assert.doesNotMatch(html, /esm\.sh|jsdelivr|unpkg/)
})


test('MelTimeScreen is declared exactly once so Vite can transform app.jsx', () => {
  const app = read('src/app.jsx')
  const matches = app.match(/class MelTimeScreen extends React\.Component/g) ?? []
  assert.equal(matches.length, 1)
})


test('MeltVisual keeps a canvas ref and MelTimeScreen initializes its clock', () => {
  const app = read('src/app.jsx')
  assert.match(app, /class MeltVisual extends React\.Component[\s\S]*?this\.canvas = React\.createRef\(\)/)
  assert.match(app, /class MelTimeScreen extends React\.Component[\s\S]*?this\.state = \{ now: Date\.now\(\) \}/)
})


test('selected creature is forwarded into the melt scene', () => {
  const app = read('src/app.jsx')
  const scenes = read('src/three/scenes.js')
  assert.match(app, /MeltVisual progress=\{melt\} creatureId=\{creature\.id\}/)
  assert.match(scenes, /createMeltScene\(canvas,progress=0,creatureId='brachiosaurus'\)/)
  assert.match(scenes, /const creature=loadOrFallback\(creatureId,3\.25\)/)
})

test('Meadow creatures have deterministic ambient walking motion', () => {
  const scenes = read('src/three/scenes.js')
  assert.match(scenes, /userData\.motion=\{homeX:/)
  assert.match(scenes, /Math\.cos\(a\)\*m\.radius/)
  assert.match(scenes, /Math\.atan2\(dx,dz\)/)
})


test('app renders the canonical 15-creature generated sheet', () => {
  const app = read('src/app.jsx')
  assert.match(app, /dinova-creatures-15\.webp/)
  assert.match(app, /function CreatureArt/)
  assert.match(app, /melt-creature-art/)
})


test('mobile MVP has service worker and installable manifest hooks', () => {
  const html = read('index.html')
  const main = read('src/main.jsx')
  assert.match(html, /manifest\.webmanifest/)
  assert.match(html, /dinova-icon\.svg/)
  assert.match(main, /serviceWorker\.register\('\/sw\.js'\)/)
})



test('Dino Park reference landmarks are implemented as real Three.js geometry', () => {
  const scenes = read('src/three/scenes.js')
  assert.match(scenes, /function tent\(/)
  assert.match(scenes, /function bridge\(/)
  assert.match(scenes, /function watchTower\(/)
  assert.match(scenes, /function cave\(/)
  assert.match(scenes, /function fence\(/)
  assert.match(scenes, /plateau\(s,0,-5\.25/)
  assert.match(scenes, /waterfall\(s,\.25,-4\.75/)
})


test('MapVisual exposes camera reset for the immersive 3D map HUD', () => {
  const app = read('src/app.jsx')
  assert.match(app, /class MapVisual extends React\.Component[\s\S]*?resetCamera = \(\) => this\.controller\?\.resetCamera\?\.\(\)/)
  assert.doesNotMatch(app, /class MeltVisual extends React\.Component[\s\S]{0,500}?resetCamera =/)
})


test('collection filters use actual 3D habitat areas', () => {
  const app=read('src/app.jsx')
  assert.match(app, /MAP_AREAS\.map\(area=>\[area\.id,area\.koName\]\)/)
  assert.match(app, /mapAreaForCreature\(creature\.id\) === filter/)
})

test('App owns global wake lock and timer title across tabs', () => {
  const app=read('src/app.jsx')
  assert.match(app, /class App extends React\.Component[\s\S]*?syncWakeLock\(\)/)
  assert.match(app, /updateDocumentTitle\(\)/)
  assert.match(app, /navigator\.wakeLock\.request\('screen'\)/)
})


test('MelTime scene uses the same 3D creature factory as the map', () => {
  const scenes=read('src/three/scenes.js')
  assert.match(scenes, /loadOrFallback\(creatureId,3\.25\)/)
  assert.match(scenes, /fitCreatureModel\(createCreature\(id\),height\)/)
})

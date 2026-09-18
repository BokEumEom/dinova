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
  assert.match(app, /CreatureArt creature=\{creature\} className="melt-creature-art"/)
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


test('Sunny Plains scene includes reference diorama landmarks', () => {
  const scenes = read('src/three/scenes.js')
  assert.match(scenes, /stoneArch\(s,-4\.9,-\.4,1\.15\)/)
  assert.match(scenes, /waterfall\(s,4\.75,-2\.62,1\.15,2\.35/)
  assert.match(scenes, /mountain\(s,-5\.8/)
  assert.match(scenes, /brachiosaurus:\[-1\.1,0,-\.3\]/)
  assert.match(scenes, /triceratops:\[-3\.9,0,2\.6\]/)
  assert.match(scenes, /stegosaurus:\[2\.6,0,1\.3\]/)
  assert.match(scenes, /'tyrannosaurus-rex':\[\.9,0,4\.05\]/)
})

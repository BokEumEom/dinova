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

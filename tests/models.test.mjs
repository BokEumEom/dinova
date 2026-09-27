import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const catalog=readFileSync(new URL('../src/catalog.ts',import.meta.url),'utf8');
const ids=[...catalog.split('] as const;')[0].matchAll(/id:'([^']+)'/g)].map(x=>x[1]);
test('all 18 catalog species have valid volumetric GLBs and model thumbnails',()=>{
 assert.equal(ids.length,18);
 for(const id of ids){
  const root=new URL('../public/models/',import.meta.url);
  const data=readFileSync(new URL(`${id}.glb`,root));
  assert.equal(data.readUInt32LE(0),0x46546c67,id);
  const length=data.readUInt32LE(12),gltf=JSON.parse(data.subarray(20,20+length).toString());
  assert.ok(gltf.meshes.length>5,id);
  const bounds=gltf.accessors.filter(a=>a.type==='VEC3'&&a.min&&a.max);
  assert.ok(bounds.some(a=>a.max.every((v,i)=>v-a.min[i]>.1)),`${id} must have geometry with depth`);
  assert.ok(existsSync(new URL(`thumbs/${id}.png`,root)),id);
 }
});

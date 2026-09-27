"""Reference-shaped, hand-faceted glacial block with branching white fissures."""
import bpy, math, random
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
bpy.ops.wm.read_factory_settings(use_empty=True)
random.seed(17)
def mat(name,color,alpha):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,alpha);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Alpha'].default_value=alpha;p.inputs['Roughness'].default_value=.24
 m.surface_render_method='DITHERED';return m
glass=[mat('Ice facet '+str(i),c,a) for i,(c,a) in enumerate([((.63,.85,.93),.30),((.82,.96,1),.24),((.92,.99,1),.40),((.60,.83,.92),.24),((.76,.92,.98),.22)])]
frost=mat('White fractured edges',(.95,1,1),.76)
# Four irregular octagonal layers: a broad uneven base, a narrower slanted crown.
rings=[(-1.65,1.64,-.91,.83,0),(-1.47,1.51,-.86,.80,1.14),(-1.33,1.34,-.78,.75,2.18),(-1.16,1.06,-.62,.62,3.40)]
verts=[]
for layer,(left,right,front,back,z) in enumerate(rings):
 bevel=.15 if layer<3 else .12
 for i,(x,y) in enumerate([(left+bevel,front),(right-bevel,front),(right,front+bevel),(right,back-bevel),(right-bevel,back),(left+bevel,back),(left,back-bevel),(left,front+bevel)]):
  dz=(random.random()-.5)*(.12 if layer==3 else .045)
  verts.append((x,y,max(0,z+dz)))
faces=[]
for l in range(3):
 for i in range(8):
  a=l*8+i;b=l*8+(i+1)%8;c=b+8;d=a+8
  faces.extend([(a,b,d),(b,c,d)] if (l+i)%2 else [(a,b,c),(a,c,d)])
faces.extend([(24,25,26),(24,26,31),(31,26,27),(31,27,30),(30,27,28),(30,28,29)])
mesh=bpy.data.meshes.new('Reference ice facets');mesh.from_pydata(verts,[],faces);mesh.update()
ob=bpy.data.objects.new('Faceted glacier',mesh);bpy.context.collection.objects.link(ob)
for m in glass:ob.data.materials.append(m)
for face in ob.data.polygons:face.material_index=random.randrange(len(glass))
def line(name,points,radius=.009):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=0;curve.resolution_u=1
 poly=curve.splines.new('POLY');poly.points.add(len(points)-1)
 for dst,p in zip(poly.points,points):dst.co=(*p,1)
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.data.materials.append(frost)
def surface(x,z):
 # Slightly offset in front of the actual glass surface.
 for n in range(3):
  if z<=rings[n+1][4]:
   t=(z-rings[n][4])/(rings[n+1][4]-rings[n][4]);return (x,rings[n][2]*(1-t)+rings[n+1][2]*t-.012,z)
 return(x,-.64,z)
paths=[
 [(-1.17,3.30),(-.96,2.89),(-1.10,2.64),(-.81,2.27),(-.96,1.98),(-.70,1.70)],
 [(-.81,2.27),(-.43,2.14),(-.23,1.87),(.18,1.69),(.35,1.29),(.82,1.04),(1.47,.76)],
 [(.35,1.29),(.10,1.02),(.30,.73),(.22,.37),(.43,.02)],
 [(1.10,3.20),(.91,2.91),(1.07,2.58),(.81,2.34),(.93,2.03),(1.24,1.83)],
 [(.81,2.34),(.53,2.28),(.36,2.05)],
 [(-1.54,.22),(-1.19,.53),(-1.03,.94),(-.69,1.11),(-.54,1.36)],
 [(-1.03,.94),(-1.28,1.19),(-1.39,1.45)],
 [(.30,.73),(.72,.60),(.89,.26),(1.37,.17)],
]
for i,path in enumerate(paths):line('Branching fissure '+str(i),[surface(x,z) for x,z in path],.006 if i%3 else .012)
for idx in [0,1,3,5,7]:line('Chipped outer edge '+str(idx),[verts[idx+8*l] for l in range(4)],.013)
line('Crown ridge',[verts[i] for i in [24,25,26,27,28,29,30,31,24]],.015)
# Small white fracture facets around junctions, matching the reference's chipped ice.
for x,z,size in [(-.81,2.27,.10),(.35,1.29,.10),(.91,2.91,.08),(-1.03,.94,.08),(1.37,.17,.13)]:
 points=[surface(x,z),surface(x-size,z+.05),surface(x+.03,z+size*1.6)]
 me=bpy.data.meshes.new('Frost chip');me.from_pydata(points,[],[(0,1,2)]);chip=bpy.data.objects.new('Frost chip',me);bpy.context.collection.objects.link(chip);chip.data.materials.append(frost)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.convert(target='MESH')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'public/models/reference-ice.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/reference-ice.glb'),export_format='GLB',use_selection=True,export_apply=True)
print('Reference-shaped ice exported')

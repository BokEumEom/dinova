"""Reproducible Blender 5.x low-poly assets. Run with blender --background --python tools/build_models.py."""
import bpy, math, random
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(8)
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name, color):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=.82
    return m
skin=[material('Jade '+str(i),c) for i,c in enumerate([(.38,.70,.55),(.40,.73,.58),(.43,.75,.61),(.39,.72,.57),(.45,.76,.62)])]
cream=material('Warm ivory',(.80,.85,.67)); dark=material('Deep forest eyes',(.035,.12,.11)); glint=material('Eye sparkle',(.99,1,.96)); plate=material('Dark jade plates',(.35,.67,.52))

def finish(obj,name,mat=None):
    obj.name=name
    if mat: obj.data.materials.append(mat)
    else:
        for m in skin: obj.data.materials.append(m)
        for p in obj.data.polygons: p.material_index=random.choices(range(5),[1,12,1,1,1])[0]
    return obj

def ico(name, loc, scale, mat=None, sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc)
    o=bpy.context.object; o.scale=scale; return finish(o,name,mat)

def tube(name, points, radii, mat=None, sides=9):
    verts=[]; faces=[]
    for i,p in enumerate(points):
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        tangent.normalize(); a=tangent.cross(Vector((0,1,0))).normalized(); b=tangent.cross(a).normalized()
        for j in range(sides):
            angle=2*math.pi*j/sides
            verts.append(Vector(p)+radii[i]*(math.cos(angle)*a+math.sin(angle)*b))
    for i in range(len(points)-1):
        for j in range(sides):
            a=i*sides+j;b=i*sides+(j+1)%sides;c=b+sides;d=a+sides
            faces.extend([(a,b,d),(b,c,d)])
    faces.extend([tuple(reversed(range(sides))),tuple((len(points)-1)*sides+j for j in range(sides))])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);return finish(o,name,mat)

def eye(x,z,y=.285):
    for side in [-1,1]:
        ico('Obsidian eye',(x,side*y,z),(.065,.032,.095),dark)
        ico('Catchlight',(x-.018,side*(y+.025),z+.032),(.019,.009,.022),glint,1)

def leg(x,y,z=.55,scale=1):
    # Continuous broad shoulder, tapering ankle and flat planted foot.
    tube('Rounded leg',[(x+.02,y,z+.48*scale),(x-.04,y,z+.05),(x-.10,y,.25),(x-.15,y,.12)],[.29*scale,.235*scale,.215*scale,.25*scale],sides=8)
    for dy in [-.14,0,.14]:ico('Ivory toe',(x-.33*scale,y+dy*scale,.12),(.082*scale,.072*scale,.12),cream,1)

def build(kind):
    if kind=='brachiosaurus':
        ico('Body',(0,0,1.08),(.98,.49,.68))
        ico('Ivory belly',(-.16,-.01,.90),(.72,.455,.43),cream)
        for x in [-.62,.58]:
            for y in [-.32,.32]: leg(x,y)
        tube('Long curved neck',[(-.57,0,1.22),(-.75,0,1.65),(-.86,0,2.12),(-.99,0,2.65),(-1.06,0,3.10),(-1.17,0,3.33)],[.37,.32,.26,.21,.20,.22])
        tube('Cream throat',[(-.87,-.005,1.43),(-1.00,-.005,1.83),(-1.09,-.005,2.21),(-1.20,-.005,2.68),(-1.26,-.005,3.12)],[.14,.13,.12,.10,.08],cream)
        ico('Head',(-1.24,0,3.38),(.35,.26,.30))
        ico('Soft snout',(-1.48,0,3.29),(.33,.25,.20))
        eye(-1.27,3.46,.245)
        tube('Smile',[(-1.74,-.172,3.25),(-1.61,-.231,3.21),(-1.44,-.248,3.22)],[.012,.012,.012],dark,5)
        tube('Tapered tail',[(.65,0,1.02),(1.05,0,.91),(1.48,0,.77),(1.86,0,.82),(2.07,0,.94)],[.34,.26,.17,.085,.015])
    elif kind=='triceratops':
        ico('Body',(0,0,.95),(1.05,.53,.61))
        for x in [-.62,.62]:
            for y in [-.36,.36]: leg(x,y,.43,.83)
        ico('Neck frill',(-.76,0,1.47),(.35,.74,.86))
        ico('Head',(-1.07,0,1.10),(.60,.39,.40))
        ico('Soft muzzle',(-1.54,0,1.00),(.33,.32,.23))
        ico('Ivory chin',(-1.45,0,.87),(.33,.29,.11),cream)
        ico('Ivory chest',(-.55,0,.86),(.48,.46,.42),cream)
        tube('Smile',[(-1.84,-.16,.99),(-1.69,-.28,.93),(-1.48,-.32,.96)],[.012]*3,dark,5)
        eye(-1.19,1.28,.362)
        for y in [-.29,.29]: tube('Brow horn',[(-1.04,y,1.44),(-1.31,y,1.73),(-1.45,y,1.87)],[.12,.075,0],cream)
        tube('Nose horn',[(-1.53,0,1.10),(-1.70,0,1.45)],[.12,0],cream)
        for a in [-1.8,-1.2,-.65,0,.65,1.2,1.8]:
            y=math.sin(a)*.61;z=1.44+math.cos(a)*.68
            tube('Frill crown',[(-.79,y,z),(-.82,y*1.20,z+.19)],[.12,0],cream,6)
        tube('Tail',[(.8,0,1),(1.32,0,.81),(1.73,0,.87)],[.3,.16,0])
    else:
        ico('Body',(0,0,.97),(1.12,.48,.63))
        for x in [-.66,.68]:
            for y in [-.32,.32]: leg(x,y,.39,.76)
        tube('Neck',[(-.65,0,1.03),(-1.18,0,.90),(-1.40,0,1.08)],[.37,.25,.19])
        ico('Head',(-1.53,0,1.12),(.35,.23,.24));eye(-1.50,1.2,.218)
        ico('Ivory belly',(-.14,0,.78),(.86,.445,.30),cream)
        tube('Cream throat',[(-1.60,0,.96),(-1.05,0,.70),(-.55,0,.66)],[.14,.20,.22],cream)
        tube('Smile',[(-1.83,-.10,1.06),(-1.73,-.21,1.02),(-1.57,-.23,1.04)],[.01]*3,dark,5)
        tube('Tail',[(.8,0,1.04),(1.32,0,.85),(1.85,0,.79),(2.20,0,.94)],[.32,.23,.12,0])
        for i in range(7):
            x=-.7+i*.29;z=1.4+math.sin((i/6)*math.pi)*.18
            ob=ico('Dorsal plate',(x,0,z+.23),(.25,.12,.49 if i<5 else .32),plate,1);ob.rotation_euler.y=-.2+i*.1
        for x in [1.6,1.9]:
            for y in [-1,1]: tube('Tail spike',[(x,y*.06,.85),(x+.1,y*.40,1.20)],[.10,0],cream,6)

def variant(kind):
    if kind=='diplodocus':
        for o in list(bpy.context.scene.objects):
            if o.type=='MESH':
                bpy.context.view_layer.objects.active=o
                o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.select_set(False)
                for v in o.data.vertices:
                    world=o.matrix_world@v.co
                    world.x*=1.13;world.z*=.79
                    v.co=o.matrix_world.inverted()@world
    elif kind=='amargasaurus':
        for i in range(7):
            z=1.65+i*.23;x=-.70-(z-1.65)*.32
            for y in [-.10,.10]:tube('Neck sail spine',[(x+.16,y,z),(x+.52,y*2,z+.47)],[.075,0],plate,6)
    elif kind=='styracosaurus':
        for o in list(bpy.context.scene.objects):
            if o.name.startswith('Brow horn'):bpy.data.objects.remove(o,do_unlink=True)
        for o in bpy.context.scene.objects:
            if o.name.startswith('Frill crown'):
                for v in o.data.vertices:v.co.z=1.55+(v.co.z-1.55)*1.23
            if o.name.startswith('Nose horn'):
                for v in o.data.vertices:v.co.z=1.1+(v.co.z-1.1)*1.7
    elif kind=='pentaceratops':
        for side in [-1,1]:tube('Cheek horn',[(-1.06,side*.33,1.0),(-1.32,side*.65,.84)],[.12,0],cream,7)
        for o in bpy.context.scene.objects:
            if o.name.startswith('Neck frill'):o.scale.z*=1.2
    elif kind=='kentrosaurus':
        for i in range(4):
            x=.15+i*.34
            for y in [-1,1]:tube('Spinal spike',[(x,y*.13,1.38),(x+.2,y*.4,2.04-i*.1)],[.10,0],cream,6)
        for o in list(bpy.context.scene.objects):
            if o.name.startswith('Dorsal plate') and o.location.x>.1:bpy.data.objects.remove(o,do_unlink=True)
    elif kind=='huayangosaurus':
        for o in bpy.context.scene.objects:
            if o.name.startswith('Dorsal plate'):o.scale.z*=.68;o.scale.x*=1.15
            if o.name=='Head':o.scale*=1.13
        for y in [-1,1]:tube('Shoulder spike',[(-.6,y*.4,1.0),(-.53,y*.85,1.35)],[.10,0],cream,6)

for kind,base in [('brachiosaurus','brachiosaurus'),('triceratops','triceratops'),('stegosaurus','stegosaurus'),('diplodocus','brachiosaurus'),('styracosaurus','triceratops'),('kentrosaurus','stegosaurus'),('amargasaurus','brachiosaurus'),('pentaceratops','triceratops'),('huayangosaurus','stegosaurus')]:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    build(base)
    variant(kind)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{kind}.glb'),export_format='GLB',use_selection=True,export_apply=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'{kind}.blend'))
    print('EXPORTED',kind)

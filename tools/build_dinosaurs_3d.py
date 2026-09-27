"""Build the same 18 volumetric dinosaur assets used by focus, thumbnails and park."""
from pathlib import Path
import bpy, math, sys
ROOT=Path(__file__).resolve().parent.parent
source=(ROOT/'tools/build_models.py').read_text(encoding='utf-8')
exec(source.split("for kind,base in [")[0])
kinds=['brachiosaurus','triceratops','stegosaurus','tyrannosaurus','ankylosaurus','pteranodon','parasaurolophus','velociraptor','spinosaurus','pachycephalosaurus','dilophosaurus','styracosaurus','carnotaurus','therizinosaurus','corythosaurus','kentrosaurus','amargasaurus','iguanodon']

def section_mesh(name,rings,sides=10,ivory_when=None):
    """A continuous faceted volume, so the neck and feet do not look like pipes."""
    verts=[];faces=[]
    for cx,cy,cz,rx,ry in rings:
        for i in range(sides):
            a=math.tau*i/sides
            verts.append((cx+math.cos(a)*rx,cy+math.sin(a)*ry,cz))
    faces.append(tuple(reversed(range(sides))))
    for j in range(len(rings)-1):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.append(tuple((len(rings)-1)*sides+i for i in range(sides)))
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);finish(ob,name)
    if ivory_when:
        ob.data.materials.append(cream);ivory_index=len(ob.data.materials)-1
        for face in me.polygons:
            if face.index==0 or face.index==len(me.polygons)-1:continue
            sector=(face.index-1)%sides
            if ivory_when(sector,sides,face.index):face.material_index=ivory_index
    return ob

def tail_mesh(rings,sides=10):
    verts=[];faces=[]
    for x,y,z,ry,rz in rings:
        for i in range(sides):
            a=math.tau*i/sides
            verts.append((x,y+math.cos(a)*ry,z+math.sin(a)*rz))
    faces.append(tuple(reversed(range(sides))))
    for j in range(len(rings)-1):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.append(tuple((len(rings)-1)*sides+i for i in range(sides)))
    me=bpy.data.meshes.new('Tapered_tail');me.from_pydata(verts,[],faces);me.update()
    ob=bpy.data.objects.new('Tapered_tail',me);bpy.context.collection.objects.link(ob)
    finish(ob,'Tapered_tail');me.materials.append(cream)
    for face in me.polygons:
        if face.index not in (0,len(me.polygons)-1) and math.sin(math.tau*((face.index-1)%sides+.5)/sides)<-.2:
            face.material_index=len(me.materials)-1
    return ob

def reference_brachiosaurus():
    # Silhouette measured from the supplied isolated mint dinosaur: high narrow
    # neck, modest head, full shoulder, four broad feet and a level pointed tail.
    ico('Body',(0,0,1.12),(1.00,.52,.66))
    ico('Ivory belly',(-.12,0,.79),(.80,.48,.33),cream)
    for x in [-.62,.63]:
        for y in [-.34,.34]:
            stance=-.10 if x<0 else .08
            section_mesh('Rounded_leg',[(x+.08,y,1.42,.37,.31),(x,y,1.04,.32,.27),
              (x+stance,y,.50,.255,.23),(x+stance-.06,y,.19,.27,.24),
              (x+stance-.13,y,.10,.32,.27)])
            for offset in [-.15,0,.15]:
                ico('Ivory toe',(x+stance-.43,y+offset,.10),(.082,.073,.105),cream,1)
    neck=[(-.55,0,.86,.52,.35),(-.64,0,1.20,.42,.31),(-.77,0,1.60,.34,.27),
          (-.87,0,2.03,.28,.23),(-.98,0,2.48,.23,.21),(-1.07,0,2.96,.205,.19),
          (-1.12,0,3.25,.215,.20)]
    # Ivory wraps around the forward quadrant of the neck, matching the long
    # pale chest panel in the original artwork from either side view.
    section_mesh('Curved neck',neck,12,lambda i,n,f: 5<=i<=8)
    ico('Head',(-1.18,0,3.36),(.33,.275,.28))
    ico('Soft snout',(-1.43,0,3.31),(.31,.255,.185))
    ico('Lower jaw',(-1.42,0,3.17),(.26,.225,.085),cream)
    eye(-1.20,3.43,.265)
    for side in [-1,1]:
        tube('Smile',[(-1.66,side*.16,3.225),(-1.50,side*.239,3.19),(-1.34,side*.258,3.22)],
             [.009,.011,.008],dark,5)
    tail=[(.64,0,1.14,.40,.34),(.96,0,1.04,.32,.26),(1.32,0,.93,.23,.20),
          (1.67,0,.85,.14,.13),(2.02,0,.87,.05,.05),(2.24,0,.92,.008,.008)]
    tail_mesh(tail)

def biped(kind):
    ico('Body',(0,0,1.27),(.62,.43,.86))
    ico('Ivory belly',(-.35,0,1.15),(.30,.37,.62),cream)
    tube('Neck',[(-.15,0,1.72),(-.48,0,2.15),(-.62,0,2.44)],[.36,.25,.23])
    big=kind in ['tyrannosaurus','velociraptor']
    ico('Head',(-.76,0,2.48),(.49 if big else .32,.29,.32))
    open_mouth=kind in ['tyrannosaurus','velociraptor','carnotaurus','dilophosaurus']
    ico('Snout',(-1.08 if big else -.98,0,2.40),(.43 if big else .26,.27,.18))
    if open_mouth:
        mouth=material('Warm mouth',(.29,.065,.053))
        ico('Mouth interior',(-1.08 if big else -.99,0,2.24),(.35 if big else .22,.235,.16),mouth)
        ico('Lower jaw',(-1.07 if big else -.99,0,2.11),(.38 if big else .24,.25,.105),cream)
        for side in [-1,1]:
            for i in range(3 if big else 1):tube('Small tooth',[(-1.35+i*.15,side*.21,2.35),(-1.31+i*.15,side*.21,2.23)],[.055,0],cream,6)
    else:ico('Chin',(-1.00,0,2.23),(.25,.25,.08),cream)
    tube('Cream throat',[(-.89,0,2.19),(-.76,0,1.89),(-.57,0,1.47)],[.16,.19,.22],cream)
    eye(-.84,2.56,.28)
    if not open_mouth: tube('Smile',[(-1.40 if big else -1.19,-.19,2.28),(-1.17,-.26,2.24),(-.94,-.29,2.27)],[.013]*3,dark,5)
    for side in [-1,1]:
        ico('Thigh',(0.16,side*.34,.80),(.32,.27,.48))
        tube('Leg',[(.20,side*.34,.78),(.34,side*.36,.39),(.15,side*.39,.16)],[.22,.17,.18])
        ico('Foot',(-.03,side*.39,.13),(.36,.25,.14))
        for dy in [-.12,0,.12]:ico('Ivory toe',(-.33,side*.39+dy,.10),(.10,.064,.07),cream,1)
        reach=.55 if kind=='therizinosaurus' else .20
        tube('Arm',[(-.38,side*.34,1.61),(-.55,side*.49,1.4),(-.68,side*.5,1.4-reach)],[.13,.095,.06])
        if kind=='therizinosaurus':
            for dy in [-.06,.03,.12]:tube('Long claw',[(-.68,side*.5+dy,1.0),(-.80,side*.5+dy,.67)],[.035,0],cream,5)
    tube('Tail',[(.37,0,1.15),(.88,0,1.08),(1.43,0,1.05),(1.94,0,1.20)],[.35,.25,.12,0])
    if kind in ['parasaurolophus','corythosaurus']:
        if kind=='parasaurolophus':tube('Crest',[(-.63,0,2.70),(-.23,0,2.99),(.12,0,2.88)],[.16,.15,.035],plate)
        else:ico('Crest',(-.62,0,2.79),(.21,.12,.39),plate,1)
    if kind=='pachycephalosaurus':
        ico('Dome',(-.70,0,2.72),(.36,.30,.29),cream)
        for side in [-1,1]:
            for i in range(4):ico('Dome rim',(-.42,side*.23,2.30+i*.13),(.10,.09,.09),cream,1)
    if kind=='carnotaurus':
        for side in [-1,1]:tube('Brow horn',[(-.73,side*.23,2.68),(-.67,side*.34,2.99)],[.095,0],cream)
    if kind=='dilophosaurus':
        for side in [-1,1]:ico('Crest',(-.85,side*.16,2.76),(.30,.07,.25),plate,1)
    if kind=='spinosaurus':
        for i in range(7):ico('Sail',(.0+i*.16,0,1.95-i*.10),(.18,.095,.56*math.sin((i+1)/8*math.pi)),plate,1)

def ankylosaurus():
    ico('Body',(0,0,.80),(1.0,.58,.51))
    for x in [-.63,.61]:
        for y in [-.38,.38]:leg(x,y,.31,.58)
    ico('Head',(-1.04,0,.65),(.46,.30,.25));eye(-1.15,.74,.28)
    ico('Ivory belly',(-.1,0,.62),(.80,.51,.31),cream)
    tube('Smile',[(-1.48,-.10,.61),(-1.36,-.27,.56),(-1.16,-.3,.59)],[.01]*3,dark,5)
    for x in [-.60,-.20,.20,.60]:
        for y in [-.30,0,.30]:ico('Armour',(x,y,1.20-abs(y)*.25),(.16,.15,.15),cream,1)
    for x in [-.55,-.1,.35,.75]:
        for side in [-1,1]:tube('Armour spike',[(x,side*.45,.9),(x+.1,side*.75,.9)],[.13,0],cream)
    tube('Tail',[(.80,0,.73),(1.25,0,.85),(1.66,0,1.33)],[.24,.14,.10])
    ico('Tail club',(1.81,0,1.43),(.29,.26,.25),plate,1)

def flying():
    ico('Body',(0,0,1.25),(.32,.28,.57));ico('Head',(-.20,0,1.99),(.30,.24,.27));eye(-.28,2.07,.23)
    tube('Beak',[(-.40,0,1.97),(-1.02,0,1.79)],[.20,0])
    tube('Cream throat',[(-.34,0,1.83),(-.26,0,1.48),(-.16,0,1.10)],[.16,.20,.23],cream)
    tube('Crest',[(0,0,2.12),(.65,0,2.64)],[.17,0],plate)
    for side in [-1,1]:
        tube('Wing bone',[(0,side*.2,1.50),(.20,side*.95,1.97),(.55,side*1.75,1.83)],[.13,.085,.015])
        verts=[(0,side*.2,1.50),(.2,side*.95,1.97),(.55,side*1.75,1.83),(.55,side*.75,.95),(.23,side*.18,.95)]
        me=bpy.data.meshes.new('Wing membrane');me.from_pydata(verts,[],[(0,1,3),(1,2,3),(0,3,4)]);me.update();o=bpy.data.objects.new('Wing',me);bpy.context.collection.objects.link(o);o.data.materials.append(cream)
        tube('Leg',[(.08,side*.15,.88),(.25,side*.24,.50)],[.10,.07])
        ico('Foot',(.16,side*.25,.45),(.18,.12,.09))

selected_kind=sys.argv[sys.argv.index('--species')+1] if '--species' in sys.argv else None
if selected_kind and selected_kind not in kinds:raise ValueError(f'Unknown species: {selected_kind}')
for kind in kinds:
    if selected_kind and kind!=selected_kind:continue
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    if kind=='brachiosaurus':reference_brachiosaurus()
    elif kind=='amargasaurus':build('brachiosaurus');variant(kind)
    elif kind=='parasaurolophus':
        build('brachiosaurus')
        # Same friendly quadruped proportions as reference 09, with a swept crest.
        for o in list(bpy.context.scene.objects):
            if o.type=='MESH':
                bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.select_set(False)
                for v in o.data.vertices:
                    w=o.matrix_world@v.co
                    if w.z>1.4:w.z=1.4+(w.z-1.4)*.57
                    v.co=o.matrix_world.inverted()@w
        tube('Swept crest',[(-1.06,0,2.50),(-.70,0,2.76),(-.28,0,2.81),(.02,0,2.67)],[.16,.17,.13,.045])
    elif kind in ['triceratops','styracosaurus']:build('triceratops');variant(kind)
    elif kind in ['stegosaurus','kentrosaurus']:build('stegosaurus');variant(kind)
    elif kind=='ankylosaurus':ankylosaurus()
    elif kind=='pteranodon':flying()
    else:biped(kind)
    if kind=='iguanodon':
        for side in [-1,1]:tube('Thumb spike',[(-.65,side*.5,1.2),(-.94,side*.56,1.5)],[.075,0],cream)
    # Reference proportions: larger expressive head and broad, solid feet.
    if kind in ['triceratops','styracosaurus']:
        head_parts=('Head','Soft muzzle','Ivory chin','Obsidian eye','Catchlight','Brow horn','Nose horn','Smile')
        pivot=Vector((-1.1,0,1.12))
        for o in bpy.context.scene.objects:
            if o.type=='MESH' and o.name.startswith(head_parts):
                o.location=pivot+(o.location-pivot)*1.15;o.scale*=1.15
    if kind=='therizinosaurus':
        for o in bpy.context.scene.objects:
            if o.name.startswith(('Head','Snout','Chin','Obsidian eye','Catchlight','Smile')):o.location.z+=.34
    for o in bpy.context.scene.objects:
        if o.name.startswith('Catchlight'):o.hide_render=True
        # Place the pivot at each mesh's own center; limb motion stays attached.
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY',center='BOUNDS')
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'{kind}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{kind}.glb'),export_format='GLB',use_selection=True,export_apply=True)
    print('3D SPECIES',kind,flush=True)

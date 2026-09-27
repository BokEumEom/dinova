import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent
ids=['brachiosaurus','triceratops','stegosaurus','tyrannosaurus','ankylosaurus','pteranodon','parasaurolophus','velociraptor','spinosaurus','pachycephalosaurus','dilophosaurus','styracosaurus','carnotaurus','therizinosaurus','corythosaurus','kentrosaurus','amargasaurus','iguanodon']
out=ROOT/'public/models/thumbs';out.mkdir(exist_ok=True)
for name in ids:
 bpy.ops.wm.open_mainfile(filepath=str(ROOT/'public/models'/f'{name}.blend'))
 points=[o.matrix_world@Vector(p) for o in bpy.context.scene.objects if o.type=='MESH' for p in o.bound_box]
 low=Vector([min(p[i] for p in points) for i in range(3)]);high=Vector([max(p[i] for p in points) for i in range(3)]);center=(low+high)*.5
 bpy.ops.object.camera_add(location=center+Vector((-5.8,-8,2.5)))
 camera=bpy.context.object;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=max(high.x-low.x,high.y-low.y,high.z-low.z)*1.22
 scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=16
 scene.world=bpy.data.worlds.new('Soft daylight');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.8,.91,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.8
 bpy.ops.object.light_add(type='AREA',location=(-3,-4,7));bpy.context.object.data.energy=450;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
 scene.render.film_transparent=True;scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0
 scene.render.resolution_x=320;scene.render.resolution_y=320;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=str(out/f'{name}.png');bpy.ops.render.render(write_still=True)
 print('THUMBNAIL',name,flush=True)

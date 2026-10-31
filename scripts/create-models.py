"""Original AERIS geometry. Run with Blender 5.2 --background --python.
Deterministic illustrative district; no real-world buildings or measured data.
"""
import bpy, math, random, os
from mathutils import Vector
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'models')
SOURCE = os.path.join(ROOT, 'blender')
os.makedirs(OUT, exist_ok=True)
os.makedirs(SOURCE, exist_ok=True)

def material(name, color, metal=0, rough=.65, emission=0):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=emission
    return m

def box(name, loc, scale, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o=bpy.context.object; o.name=name
    o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Soft architectural edges','BEVEL'); mod.width=bevel; mod.segments=2
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def line(name, coords, mat, radius=.025):
    c=bpy.data.curves.new(name,'CURVE'); c.dimensions='3D'; c.bevel_depth=radius; c.bevel_resolution=2
    p=c.splines.new('POLY'); p.points.add(len(coords)-1)
    for point,co in zip(p.points,coords): point.co=(*co,1)
    o=bpy.data.objects.new(name,c); bpy.context.collection.objects.link(o); o.data.materials.append(mat)
    return o

for chapter in ['city','heat','water','regeneration']:
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    random.seed(47)
    stone=material('Midnight limestone',(.12,.18,.22),.15)
    glass=material('Blue smoked glazing',(.055,.115,.15),.55,.26)
    base=material('District terrain',(.035,.075,.08))
    asphalt=material('Porous streets',(.028,.043,.055))
    water=material('River',(.025,.19,.24),.65,.18)
    grass=material('Living ground',(.035,.15,.105))
    leaf=material('Canopy',(.05,.23,.145))
    trunk=material('Bark',(.13,.10,.07))
    light=material('Warm occupied windows',(.97,.59,.22),.2,.35,2.4)
    cyan=material('Climate sensors',(.15,.85,.83),.3,.25,2)
    hot=material('Illustrative thermal overlay',(.88,.25,.09),.25,.5,.28)
    white=material('Cool reflective roof',(.55,.66,.66),.25)
    # Terrain and river are true geometry; the four files have distinct interventions.
    box('District foundation',(0,0,-.5),(29,22,1),base,.3)
    box('River corridor',(0,-.2,.035),(29,3.5,.08),water,.08)
    for y in [-9,-5,4,8]: box('Avenue',(0,y,.025),(28,.62,.06),asphalt)
    for x in [-12,-6,0,6,12]: box('Cross street',(x,0,.03),(.58,21,.06),asphalt)
    for y in [-2.15,1.8]:
        box('River promenade',(0,y,.08),(28,.35,.16),stone)
        line('Promenade illumination',[(-14,y,.2),(14,y,.2)],light,.018)
    building_count=0
    for x in [-10.5,-7.8,-4.4,-1.8,2,4.5,8,10.5]:
        for y in [-7.1,-3.5,3,6.1,9.2]:
            if (x<0 and y>4) or (x>7 and y==-3.5): continue
            building_count+=1
            h=random.uniform(1.3,4.4)+(2 if x>1 and y>0 else 0)
            w=random.uniform(1.2,1.9); d=random.uniform(1.05,1.55)
            name=f'Building_{building_count:02d}'
            bodymat=hot if chapter=='heat' and building_count%3==0 else glass if building_count%3==0 else stone
            o=box(name,(x,y,h/2+.15),(w,d,h),bodymat,.055)
            o['aeris_kind']='building'; o['district']='Riverside'; o['illustrative']=True
            roofmat=grass if chapter=='regeneration' else white if building_count%4==0 else stone
            box(name+'_roof',(x,y,h+.2),(w+.08,d+.08,.12),roofmat,.03)
            # Efficient single mesh per building for windows and facade fins.
            verts=[]; faces=[]
            def panel(cx,cy,cz,sx,sy,sz):
                idx=len(verts)
                for dx,dy,dz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
                    verts.append((cx+dx*sx/2,cy+dy*sy/2,cz+dz*sz/2))
                for f in [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]: faces.append(tuple(idx+k for k in f))
            for z in range(1,int(h/.35)):
                for k in range(3):
                    if random.random()>.36:
                        panel(x-w/2+(k+.5)*w/3,y-d/2-.012,.25+z*.35,w*.18,.018,.16)
                    if random.random()>.4:
                        panel(x+w/2+.012,y-d/2+(k+.5)*d/3,.25+z*.35,.018,d*.18,.16)
            mesh=bpy.data.meshes.new(name+'_lights'); mesh.from_pydata(verts,[],faces); mesh.update()
            win=bpy.data.objects.new(name+'_windows',mesh); bpy.context.collection.objects.link(win); win.data.materials.append(light)
            if chapter=='regeneration' and building_count%2==0:
                for k in range(3):
                    box('Solar array',(x+(k-1)*.35,y,h+.34),(.28,d*.65,.06),glass)
            if building_count%3==0: box('Rooftop equipment',(x,y,h+.43),(.42,.4,.42),stone,.03)
    # Detailed public park, trees, rain gardens, bridges and sensor masts.
    box('Riverside park',(-6,6,.07),(9,6,.14),grass,.15)
    tree_count=140 if chapter=='regeneration' else 80
    for i in range(tree_count):
        if i<45: x=random.uniform(-10,-2); y=random.uniform(3,9)
        else: x=random.uniform(-13,13); y=random.choice([-8.55,-5.5,2.15,7.5])+random.uniform(-.2,.2)
        z=random.uniform(.5,.9)
        box('Tree trunk',(x,y,z/2),(.08,.08,z),trunk)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.3,.5),location=(x,y,z+.2))
        t=bpy.context.object; t.name='Tree_canopy'; t.scale=(1,1,1.25); t.data.materials.append(leaf)
    for x in [-5.5,6]:
        box('Pedestrian bridge',(x,-.2,.44),(.7,4.5,.18),stone,.04)
        for dx in [-.34,.34]:
            line('Bridge handrail',[(x+dx,-2.3,.83),(x+dx,2,.83)],cyan,.018)
        for y in [-1.8,1.4]: box('Bridge pier',(x,y,.14),(.35,.3,.45),stone)
    for x,y in [(-5,5),(4,5),(8,-5),(-9,-5)]:
        box('Sensor mast',(x,y,.85),(.06,.06,1.7),stone)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=.11,location=(x,y,1.8)); bpy.context.object.name='Climate_sensor'; bpy.context.object.data.materials.append(cyan)
    if chapter=='water':
        flood=material('Illustrative inundation',(.04,.43,.58),.5,.24)
        box('Flood extent',(6,-3.5,.25),(13,3.1,.08),flood,.2)
        for x in [3,6,9]: box('Retention basin',(x,-7.2,.12),(1.7,1.2,.25),water,.15)
    if chapter=='regeneration':
        for x in [3,6,9]: box('Rain garden',(x,-3.2,.13),(1.8,1.1,.26),grass,.15)
    # Embedded lighting is exported; web renderer adds ambient key light.
    world=bpy.context.scene.world
    if world: world.color=(.06,.09,.12)
    bpy.ops.object.light_add(type='AREA',location=(2,-5,18)); bpy.context.object.data.energy=2000; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=18
    bpy.ops.object.camera_add(location=(29,-31,26)); cam=bpy.context.object
    cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=39
    bpy.context.scene.camera=cam
    bpy.context.scene.render.engine='CYCLES'; bpy.context.scene.cycles.samples=24
    bpy.context.scene.render.resolution_x=1440; bpy.context.scene.render.resolution_y=1024; bpy.context.scene.render.resolution_percentage=100
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,f'aeris-{chapter}.blend'))
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,f'{chapter}.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_extras=True)
    print('AERIS_MODEL_COMPLETE',chapter,flush=True)

"""AERIS architectural detailing pass. Run after create-models.py in Blender.
All detail is original, illustrative and batched by material for web rendering.
"""
import bpy, math, os, random
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def mat(name,c,metal=0,rough=.5,emission=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emission
    return m

for chapter in ['city','heat','water','regeneration']:
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'blender',f'aeris-{chapter}.blend'))
    # Idempotent: remove only objects authored by this detailing pass.
    for o in list(bpy.data.objects):
        if o.name.startswith('Detail_'):bpy.data.objects.remove(o,do_unlink=True)
    random.seed(72);buckets={}
    bronze=mat('Detail brushed bronze',(.24,.17,.10),.65,.3)
    pale=mat('Detail architectural limestone',(.27,.34,.36),.25)
    dark=mat('Detail glazing recess',(.025,.065,.09),.65,.2)
    warm=mat('Detail amber lighting',(1,.48,.12),.2,.3,1.3)
    foliage=mat('Detail roof gardens',(.025,.18,.105))
    aqua=mat('Detail river accents',(.09,.53,.60),.5,.2,.4)
    def box(loc,scale,material):
        verts,faces=buckets.setdefault(material.name,([],[]));idx=len(verts)
        x,y,z=loc;sx,sy,sz=scale
        for dx,dy,dz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:verts.append((x+dx*sx/2,y+dy*sy/2,z+dz*sz/2))
        for f in [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]:faces.append(tuple(idx+k for k in f))
    def cable(name,coords,radius,material):
        c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=2
        s=c.splines.new('POLY');s.points.add(len(coords)-1)
        for p,co in zip(s.points,coords):p.co=(*co,1)
        o=bpy.data.objects.new('Detail_'+name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material)
    buildings=[o for o in bpy.data.objects if o.get('aeris_kind')=='building']
    for o in buildings:
        x,y,z=o.location;w,d,h=o.dimensions
        n=int(o.name.split('_')[1]);top=z+h/2
        o['height_units']=round(h,2);o['floors']=max(2,int(h/.35));o['building_id']=n
        o['use_type']=['Residential','Mixed-use','Civic'][n%3]
        # Horizontal mullions, inset vertical frames and articulated rooflines.
        for i in range(1,max(2,int(h/.35))):
            zz=.15+i*.35
            box((x,y-d/2-.015,zz),(w+.025,.035,.025),bronze)
            box((x+w/2+.015,y,zz),(.035,d+.025,.025),bronze)
        for i in range(4):
            xx=x-w/2+(i/3)*w;yy=y-d/2+(i/3)*d
            box((xx,y-d/2-.025,z),(.035,.045,h),pale)
            box((x+w/2+.025,yy,z),(.045,.035,h),pale)
        box((x,y,top+.22),(w+.14,d+.14,.10),bronze)
        box((x,y,top+.30),(w*.78,d*.78,.09),pale)
        if n%3==0:
            box((x,y,top+.53),(w*.58,d*.6,.38),dark)
            box((x,y,top+.74),(w*.64,d*.66,.06),pale)
        # Delicate balcony ledges and planted roof terraces.
        if n%2==0:
            for zz in [.85,1.55,2.25]:
                if zz<h:
                    box((x,y-d/2-.12,zz),(w*.62,.24,.045),pale)
                    box((x,y-d/2-.23,zz+.12),(w*.62,.025,.2),bronze)
        if chapter=='regeneration' or n%5==0:
            for s in [-1,1]:
                box((x+s*w*.32,y,top+.41),(w*.16,d*.58,.18),foliage)
        # Lit lobbies make the model legible at street level.
        box((x,y-d/2-.035,.34),(w*.36,.035,.32),warm)
    # Riverside lighting, seating and slender bridge structures.
    for y in [-2.30,2.02]:
        box((0,y,.20),(28,.1,.24),pale)
        for x in range(-13,14,2):
            box((x,y,.52),(.035,.035,.72),bronze)
            box((x,y,.90),(.10,.10,.08),warm)
            if x%3==0:box((x+.4,y+.2,.28),(.5,.15,.10),bronze)
    for x in [-5.5,6]:
        for y in [-1.5,1.1]:
            box((x,y,1.1),(.065,.065,1.4),pale)
            for offset in [-1,-.5,.5,1]:
                cable('Bridge_cable',[(x,y,1.8),(x,y+offset,.55)],.012,bronze)
    # A civic pavilion, waterfront canopy and sculptural park basin.
    box((-6,6,.12),(2.5,1.8,.2),pale)
    for x in [-7,-5]:
        for y in [5.3,6.7]:box((x,y,.65),(.065,.065,1.1),bronze)
    box((-6,6,1.22),(2.6,1.9,.12),dark)
    for x in [-7.2,-6.8,-6.4,-6,-5.6,-5.2,-4.8]:box((x,6,1.31),(.07,2,.05),bronze)
    for y in [3.4,8.5]:
        cable('Park_path',[(-10,y,.13),(-8,y+.3,.13),(-6,y,.13),(-3,y-.2,.13)],.055,pale)
    # More rounded crowns, with shared muted greens rather than bright toy colors.
    for o in bpy.data.objects:
        if o.name.startswith('Tree_canopy') and not o.modifiers.get('Rounded canopy'):
            m=o.modifiers.new('Rounded canopy','SUBSURF');m.levels=1;m.render_levels=1
            for p in o.data.polygons:p.use_smooth=True
    # Window emission remains amber instead of blowing out to white.
    for m in bpy.data.materials:
        if m.name.startswith('Warm occupied windows') and m.use_nodes:
            p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Strength'].default_value=.65
            p.inputs['Base Color'].default_value=(.82,.40,.10,1);p.inputs['Emission Color'].default_value=(1,.44,.10,1)
    for name,(verts,faces) in buckets.items():
        mesh=bpy.data.meshes.new('Detail_'+name);mesh.from_pydata(verts,[],faces);mesh.update()
        o=bpy.data.objects.new('Detail_'+name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(bpy.data.materials[name])
    bpy.context.scene['aeris_version']='2.0';bpy.context.scene['data']='illustrative'
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender',f'aeris-{chapter}.blend'))
    bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public','models',f'{chapter}.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_extras=True)
    print('AERIS_DETAIL_COMPLETE',chapter,flush=True)

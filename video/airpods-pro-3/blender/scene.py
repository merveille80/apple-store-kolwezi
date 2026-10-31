# Spec ad « All new AirPods Pro 3 » : calque produit 3D (Blender / Cycles).
# Rend le VRAI modèle AR Quick Look d'Apple (airpods-pro-3.usdz, non versionné)
# en PNG RGBA (fond transparent + ombres de contact), sur la timeline globale
# de scene.js : l'image n correspond à t = n / fps.
#
#   blender -b --factory-startup --python scene.py -- \
#       --usdz <airpods-pro-3.usdz> --fmt 9x16|16x9 --out <dossier> \
#       [--height 1080] [--fps 30] [--samples 96] \
#       [--stills 2.15,3.2,...]  (sinon : séquence complète f00000.png…)
#       [--range t0:t1] [--save-blend fichier.blend]
import bpy, sys, math, os, time, argparse
import numpy as np
from mathutils import Vector, Matrix, Quaternion

# ---------- arguments ----------
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--usdz', required=True)
ap.add_argument('--fmt', default='9x16', choices=['9x16', '16x9'])
ap.add_argument('--out', required=True)
ap.add_argument('--height', type=int, default=1080)  # petite dimension de l'image
ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--stills', default='')
ap.add_argument('--range', default='')
ap.add_argument('--save-blend', default='')
ap.add_argument('--resume', action='store_true')  # saute les images déjà présentes
ap.add_argument('--exposure', type=float, default=0.0)
ap.add_argument('--lights', type=float, default=1.0)
ap.add_argument('--world', type=float, default=1.0)
A = ap.parse_args(argv)
os.makedirs(A.out, exist_ok=True)

# ---------- timeline (identique à scene.js) ----------
DUR = 11.1
B = dict(A=0, B=1.4, C=1.9, D=2.4, E=3.8, F=4.4, G=5.8, H=7.0, I=8.8, J=10.0, END=11.1)
SHOTS_3D = [(B['C'], B['E']), (B['F'], B['J'])]  # A, B, E, J : pas de 3D
GREEN = (0x39 / 255, 1.0, 0x6a / 255)
PORTRAIT = A.fmt == '9x16'

def clamp(x, a=0.0, b=1.0): return min(b, max(a, x))
def lerp(a, b, k): return a + (b - a) * k
def prog(t, a, b): return clamp((t - a) / (b - a))
def eio(x): return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
def eout(x): return 1 - (1 - x) ** 3
def ebackout(x):
    c1 = 1.4; c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def srgb2lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
GREEN_LIN = tuple(srgb2lin(c) for c in GREEN) + (1.0,)

# Échelle : 1 unité three.js (scene.js) = largeur du boîtier / 6.06
U = 0.0102

# ---------- import du modèle ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.usd_import(filepath=A.usdz)
sc = bpy.context.scene
O = bpy.data.objects
vl = bpy.context.view_layer

# Pièces du modèle (noms de prims USD, stables dans le fichier d'Apple)
P = dict(
    case='hXJOJrkFTZXXxnW', lid='kpaqGvvhsGowTJD', led='DkuOUpinUveIrMm',
    budL='BLvfImZvTRtJYtd', budR='bqtvQbjelRVbbzz',
    headL='GAWrhnVRfmavzbe', headR='VueAjsuzRiInJsL',      # coque de la tête
    ringL='dExUZHAdVilEsVU', ringR='icrLFoWFxYIeGuq',      # bague du micro en bout de tige
    tipL='aUmxZKsIeXiNHGS', tipR='fPjKvyCtOeXGMAp',        # embouts
    sensL='OIFgTQMBgdXVrUy', sensR='vQqaGWuMqoNxCJL',      # capteur de force de la tige
)

def desc(o):
    r = [o]
    for c in o.children: r += desc(c)
    return r

def mesh_world_verts(o):
    n = len(o.data.vertices)
    v = np.empty(n * 3); o.data.vertices.foreach_get('co', v)
    v = v.reshape(n, 3)
    M = np.array(o.matrix_world)
    return v @ M[:3, :3].T + M[:3, 3]

def center(o):
    v = mesh_world_verts(o)
    return Vector(((v.min(0) + v.max(0)) / 2).tolist())

def bbox(objs):
    v = np.vstack([mesh_world_verts(o) for o in objs if o.type == 'MESH'])
    return Vector(v.min(0).tolist()), Vector(v.max(0).tolist())

# ---------- matières ----------
def principled(m):
    for n in m.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED': return n

def set_in(b, name, val):
    i = b.inputs.get(name)
    if i is not None and not i.is_linked: i.default_value = val

def unlink(m, b, name):
    i = b.inputs.get(name)
    if i is not None:
        for l in list(i.links): m.node_tree.links.remove(l)

def white_plastic(m):
    # plastique blanc brillant (boîtier, coques) : vernis + léger SSS
    b = principled(m)
    for k in ('Base Color', 'Roughness'): unlink(m, b, k)
    set_in(b, 'Base Color', (0.86, 0.86, 0.87, 1))
    set_in(b, 'Roughness', 0.32)
    set_in(b, 'Coat Weight', 1.0)
    set_in(b, 'Coat Roughness', 0.035)
    set_in(b, 'Subsurface Weight', 0.06)
    set_in(b, 'Subsurface Radius', (1.0, 0.9, 0.8))
    set_in(b, 'Subsurface Scale', 0.001)

def silicone(m):
    # embouts : silicone mat, satiné
    b = principled(m)
    for k in ('Base Color', 'Roughness'): unlink(m, b, k)
    set_in(b, 'Base Color', (0.80, 0.80, 0.81, 1))
    set_in(b, 'Roughness', 0.58)
    set_in(b, 'Sheen Weight', 0.35)
    set_in(b, 'Sheen Roughness', 0.5)
    set_in(b, 'Subsurface Weight', 0.25)
    set_in(b, 'Subsurface Radius', (1.0, 0.9, 0.8))
    set_in(b, 'Subsurface Scale', 0.001)
    set_in(b, 'Coat Weight', 0.0)

def dark_plastic(m):
    b = principled(m)
    unlink(m, b, 'Base Color')
    set_in(b, 'Base Color', (0.035, 0.035, 0.037, 1))
    set_in(b, 'Roughness', 0.45)

def emissive_green(m, strength=0.0):
    b = principled(m)
    for k in ('Emission Color', 'Emission Strength'): unlink(m, b, k)
    set_in(b, 'Emission Color', GREEN_LIN)
    set_in(b, 'Emission Strength', strength)
    return b.inputs['Emission Strength']

mats_of = lambda name: [s.material for s in O[name].material_slots if s.material]
for m in bpy.data.materials:
    if not m.node_tree or not principled(m): continue
    nm = m.name.split('.')[0]
    if nm == 'WwrjthXqFCMqrXz': white_plastic(m)          # coques blanches
    elif nm == 'HsvhXbFCGvnKLqR': silicone(m)             # embouts
    elif nm == 'FesGvQOXeqPgsWH': dark_plastic(m)         # intérieurs sombres

# LED du boîtier : matière propre, verte émissive
led_mat = bpy.data.materials.new('LED_vert'); led_mat.use_nodes = True
lb = principled(led_mat)
set_in(lb, 'Base Color', (0.02, 0.08, 0.03, 1)); set_in(lb, 'Roughness', 0.25)
LED_STRENGTH = emissive_green(led_mat, 0.0)
for s in O[P['led']].material_slots: s.material = led_mat

# Capteur de la tige (gauche) : copie de sa matière + émission verte animée
sens_mat = O[P['sensL']].material_slots[0].material.copy(); sens_mat.name = 'Capteur_vert'
white_plastic(sens_mat)
SENS_STRENGTH = emissive_green(sens_mat, 0.0)
SENS_BASE = principled(sens_mat).inputs['Base Color']
for s in O[P['sensL']].material_slots: s.material = sens_mat
for nm in ('sensL', 'sensR'):
    for s in O[P[nm]].material_slots:
        if s.material is not sens_mat: white_plastic(s.material) if s.material.users else None

# ---------- repères canoniques ----------
case = O[P['case']]; lid = O[P['lid']]
# Couvercle : la charnière est un pivot USD (translate:pivot) ; on rouvre / ferme
# en recalculant location = p - R(a) p (p = pivot en cm, repère du parent).
LID_PIVOT = Vector((0.0, 0.11512405, -0.9922344))
LID_OPEN_MODEL = lid.rotation_euler.x  # -115° dans le fichier d'Apple
def set_lid(angle):
    R = Matrix.Rotation(angle, 3, 'X')
    lid.rotation_mode = 'XYZ'
    lid.rotation_euler = (angle, 0, 0)
    lid.location = LID_PIVOT - R @ LID_PIVOT

set_lid(0.0); vl.update()
case_objs = [o for o in desc(case) if o.type == 'MESH']
CASE_MC = case.matrix_world.copy()
cmn, cmx = bbox(case_objs)
CASE_C = (cmn + cmx) / 2
CASE_H = cmx.z - cmn.z
print('BOITIER ferme', tuple(round(x, 4) for x in cmn), tuple(round(x, 4) for x in cmx))

def canon_bud(side):
    bud = O[P['bud' + side]]
    bud.location = (0, 0, 0); bud.rotation_mode = 'XYZ'; bud.rotation_euler = (0, 0, 0); bud.scale = (1, 1, 1)
    vl.update()
    Mc = bud.matrix_world.copy()
    h = center(O[P['head' + side]]); r = center(O[P['ring' + side]]); tp = center(O[P['tip' + side]])
    se = center(O[P['sens' + side]])
    s = (r - h).normalized()                       # axe de la tige (vers le bas de la tige)
    n = (tp - h); n = (n - n.dot(s) * s).normalized()  # direction de l'embout
    # normale du capteur : depuis l'axe de la tige vers le capteur
    q = h + s * (se - h).dot(s)
    m = (se - q); m = (m - m.dot(s) * s).normalized()
    return dict(obj=bud, Mc=Mc, h=h, s=s, n=n, m=m, tip=tp, sens=se)

CAN = {side: canon_bud(side) for side in ('L', 'R')}
for side in 'LR':
    c = CAN[side]
    print('ECOUTEUR', side, 'tige', tuple(round(x, 3) for x in c['s']), 'embout', tuple(round(x, 3) for x in c['n']),
          'capteur', tuple(round(x, 3) for x in c['m']))

# Embouts L/M/S/XS : copies du maillage de l'embout du modèle, centrées
tip_src = O[P['tipL']]
TIP_AXIS = CAN['L']['n']
tv = mesh_world_verts(tip_src); tc = (tv.min(0) + tv.max(0)) / 2
tip_mesh = tip_src.data.copy(); tip_mesh.name = 'embout_libre'
co = (tv - tc).reshape(-1)
tip_mesh.vertices.foreach_set('co', co)
# normales personnalisées éventuelles : on les recalcule sur le maillage déplacé
tip_mesh.update()
TIP_SIZES = [1.0, 0.92, 0.84, 0.76]  # L, M, S, XS
TIPS = []
for i, s in enumerate(TIP_SIZES):
    o = bpy.data.objects.new(f'embout_{"LMSX"[i]}', tip_mesh)
    sc.collection.objects.link(o)
    TIPS.append(o)

# Détache les objets animés de leur parent (on pilote leur matrice monde)
def detach(o):
    M = o.matrix_world.copy(); o.parent = None; o.matrix_world = M
for side in 'LR': detach(CAN[side]['obj'])
detach(case)
for o in [case, CAN['L']['obj'], CAN['R']['obj']] + TIPS:
    o.rotation_mode = 'QUATERNION'

# ---------- poses ----------
def frame_from(a, b):
    a = a.normalized(); b = (b - b.dot(a) * a).normalized()
    return Matrix((a, b, a.cross(b))).transposed()

def bud_matrix(side, pos, s_w, n_w, use_sensor=False, scale=1.0):
    c = CAN[side]
    Fc = frame_from(c['s'], c['m'] if use_sensor else c['n'])
    Fw = frame_from(Vector(s_w), Vector(n_w))
    R = (Fw @ Fc.transposed()).to_4x4()
    return (Matrix.Translation(Vector(pos)) @ R @ Matrix.Scale(scale, 4)
            @ Matrix.Translation(-c['h']) @ c['Mc'])

def case_matrix(pos, yaw, tilt, scale=1.0):
    R = Matrix.Rotation(yaw, 4, 'Z') @ Matrix.Rotation(tilt, 4, 'X')
    return Matrix.Translation(Vector(pos)) @ R @ Matrix.Scale(scale, 4) @ Matrix.Translation(-CASE_C) @ CASE_MC

def nozzle(sx, phi, up=0.0):
    # phi > 0 : embout vers l'arrière (loin de la caméra), < 0 : vers la caméra
    return (-sx * math.cos(phi), math.sin(phi), up)

def tip_matrix(pos, size, tilt=0.95):
    a_w = Vector((0, -math.sin(tilt), math.cos(tilt)))
    R = TIP_AXIS.rotation_difference(a_w).to_matrix().to_4x4()
    return Matrix.Translation(Vector(pos)) @ R @ Matrix.Scale(size, 4)

# hauteur du point le plus bas d'un embout posé (orientation fixe)
_tv = (tv - tc)
def tip_bottom(size, tilt=0.95):
    R = np.array(TIP_AXIS.rotation_difference(Vector((0, -math.sin(tilt), math.cos(tilt)))).to_matrix())
    return float((_tv @ R.T)[:, 2].min()) * size

# ---------- lumière studio ----------
sc.render.engine = 'CYCLES'
cp = bpy.context.preferences.addons['cycles'].preferences
cp.compute_device_type = 'METAL'; cp.get_devices()
for d in cp.devices: d.use = (d.type == 'METAL')
cs = sc.cycles
cs.device = 'GPU'
cs.samples = A.samples
cs.use_adaptive_sampling = True; cs.adaptive_threshold = 0.02
cs.use_denoising = True
try: cs.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
cs.max_bounces = 12; cs.glossy_bounces = 6; cs.transmission_bounces = 6
cs.caustics_reflective = False; cs.caustics_refractive = False
cs.blur_glossy = 0.5
sc.render.film_transparent = True
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.5
sc.view_settings.view_transform = 'Standard'
try: sc.view_settings.look = 'None'
except Exception: pass
sc.view_settings.exposure = A.exposure

# Environnement procédural neutre (studio) : plafond clair, sol plus sombre
world = bpy.data.worlds.new('studio'); sc.world = world
world.use_nodes = True
wn = world.node_tree.nodes; wl = world.node_tree.links
for n in list(wn): wn.remove(n)
out = wn.new('ShaderNodeOutputWorld')
bg = wn.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 0.36
geo = wn.new('ShaderNodeTexCoord')
sep = wn.new('ShaderNodeSeparateXYZ')
ramp = wn.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position = 0.25; ramp.color_ramp.elements[0].color = (0.02, 0.02, 0.02, 1)
ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = (0.95, 0.95, 0.95, 1)
mr = wn.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -1; mr.inputs['From Max'].default_value = 1
# direction de vue = coordonnée "Generated" du monde
wl.new(geo.outputs['Generated'], sep.inputs[0])
wl.new(sep.outputs['Z'], mr.inputs['Value'])
wl.new(mr.outputs['Result'], ramp.inputs['Fac'])
wl.new(ramp.outputs['Color'], bg.inputs['Color'])
wl.new(bg.outputs['Background'], out.inputs['Surface'])
# le fond n'est jamais vu directement (film transparent) : il ne sert qu'aux reflets

def area(name, size, size_y, loc, energy, look_at=(0, 0, 0)):
    L = bpy.data.lights.new(name, 'AREA'); L.shape = 'RECTANGLE'; L.size = size; L.size_y = size_y
    L.energy = energy; L.color = (1, 1, 1)
    o = bpy.data.objects.new(name, L); sc.collection.objects.link(o)
    o.location = loc
    d = (Vector(look_at) - Vector(loc)).normalized()
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return o

# grande softbox au-dessus, deux strips latéraux (réflecteurs), contre-jour doux
LIGHTS = [
    area('softbox_haut', 0.30, 0.30, (0.0, -0.05, 0.32), 1.0),
    area('strip_gauche', 0.05, 0.32, (-0.24, -0.06, 0.06), 0.40),
    area('strip_droit', 0.05, 0.32, (0.24, -0.04, 0.04), 0.32),
    area('contre_jour', 0.30, 0.10, (0.0, 0.30, 0.12), 0.27),
    area('face_douce', 0.40, 0.25, (0.0, -0.40, 0.02), 0.06),
]
for l in LIGHTS: l.data.energy *= A.lights
FACE = LIGHTS[4].data; FACE_E = FACE.energy
bg.inputs['Strength'].default_value *= A.world
RIG = bpy.data.objects.new('rig_lumieres', None); sc.collection.objects.link(RIG)
for l in LIGHTS: l.parent = RIG
# éclairage macro dédié au gros plan H (éteint ailleurs) : la tige reste bien blanche
MACRO = [
    area('macro_strip', 0.012, 0.06, (-0.045, -0.035, 0.01), 0.0),
    area('macro_contre', 0.05, 0.015, (0.03, 0.04, 0.02), 0.0),
    area('macro_face', 0.06, 0.04, (0.012, -0.07, 0.03), 0.0),
]
MACRO_E = [0.030, 0.020, 0.022]
def macro(on):
    for l, e in zip(MACRO, MACRO_E): l.data.energy = e * on * A.lights

# attrape-ombres (ombres de contact sur fond transparent)
bpy.ops.mesh.primitive_plane_add(size=2.0)
floor = bpy.context.active_object; floor.name = 'attrape_ombres'
floor.is_shadow_catcher = True
fm = bpy.data.materials.new('sol'); fm.use_nodes = True
set_in(principled(fm), 'Base Color', (0.82, 0.82, 0.84, 1)); set_in(principled(fm), 'Roughness', 0.9)
floor.data.materials.append(fm)

# ---------- halo (bloom) limité à l'émission ----------
# Image + Glare(passe Émission) ; l'alpha s'étend sous le halo pour qu'il
# reste visible une fois posé sur le fond du montage.
vl.use_pass_emit = True
ct = bpy.data.node_groups.new('compo_halo', 'CompositorNodeTree')
sc.compositing_node_group = ct
cn = ct.nodes; cl = ct.links
ct.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
rl = cn.new('CompositorNodeRLayers'); rl.scene = sc
gl = cn.new('CompositorNodeGlare')
gl.inputs['Type'].default_value = 'Bloom'
gl.inputs['Threshold'].default_value = 0.0
gl.inputs['Size'].default_value = 0.5
gl.inputs['Strength'].default_value = 1.0

cl.new(rl.outputs['Emission' if 'Emission' in rl.outputs else 'Emit'], gl.inputs['Image'])
si = cn.new('CompositorNodeSeparateColor'); cl.new(rl.outputs['Image'], si.inputs['Image'])
sg = cn.new('CompositorNodeSeparateColor'); cl.new(gl.outputs['Glare'], sg.inputs['Image'])
cc = cn.new('CompositorNodeCombineColor')
def mathn(op, a, b=None, clamp=False):
    n = cn.new('ShaderNodeMath'); n.operation = op; n.use_clamp = clamp
    for i, x in enumerate((a, b)):
        if x is None: continue
        if isinstance(x, (int, float)): n.inputs[i].default_value = x
        else: cl.new(x, n.inputs[i])
    return n.outputs[0]
HALO = 2.2
for ch in ('Red', 'Green', 'Blue'):
    cl.new(mathn('ADD', si.outputs[ch], mathn('MULTIPLY', sg.outputs[ch], HALO)), cc.inputs[ch])
gmax = mathn('MAXIMUM', mathn('MAXIMUM', sg.outputs['Red'], sg.outputs['Green']), sg.outputs['Blue'])
cov = mathn('MULTIPLY', mathn('SUBTRACT', 1.0, si.outputs['Alpha']), mathn('MULTIPLY', gmax, HALO), clamp=True)
cl.new(mathn('ADD', si.outputs['Alpha'], cov, clamp=True), cc.inputs['Alpha'])
go = cn.new('NodeGroupOutput'); cl.new(cc.outputs['Image'], go.inputs[0])

# ---------- caméras ----------
def make_cam(name):
    c = bpy.data.cameras.new(name); c.lens = 85; c.sensor_fit = 'AUTO'; c.sensor_width = 36
    c.clip_start = 0.005; c.clip_end = 10
    c.dof.use_dof = True
    o = bpy.data.objects.new(name, c); sc.collection.objects.link(o)
    o.rotation_mode = 'QUATERNION'
    return o
CAM = make_cam('cam_' + A.fmt)
sc.camera = CAM
short = A.height
W, H = (short, round(short * 16 / 9)) if PORTRAIT else (round(short * 16 / 9), short)
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.resolution_percentage = 100
sc.render.fps = A.fps
ASPECT = W / H

def frame_cam(target, direction, S, fstop=8.0):
    # S : taille (m) couverte par la plus petite dimension de l'image
    half_long = math.atan(18.0 / CAM.data.lens)
    half_short = math.atan(math.tan(half_long) * min(ASPECT, 1 / ASPECT))
    dist = S / 2 / math.tan(half_short)
    d = Vector(direction).normalized()
    t = Vector(target)
    CAM.location = t + d * dist
    CAM.rotation_quaternion = (-d).to_track_quat('-Z', 'Y')
    CAM.data.dof.focus_distance = dist
    CAM.data.dof.aperture_fstop = fstop

# ---------- état par instant ----------
budL, budR = CAN['L']['obj'], CAN['R']['obj']
ANIM = [case, budL, budR, CAM] + TIPS

def show(o, v):
    for x in (desc(o) if o in (case, budL, budR) else [o]):
        x.hide_render = not v

def float_y(t, ph=0.0, a=0.0008, f=2.2): return math.sin(t * f + ph) * a

def state(t):
    """Place tous les objets pour l'instant t (secondes). Renvoie False si pas de 3D."""
    for o in [case, budL, budR] + TIPS: show(o, False)
    floor.hide_render = True
    LED_STRENGTH.default_value = 0.0
    SENS_STRENGTH.default_value = 0.0
    SENS_BASE.default_value = (0.86, 0.86, 0.87, 1)
    RIG.rotation_euler = (0, 0, 0)
    FACE.energy = FACE_E
    macro(0.0)
    if B['C'] <= t < B['E']:
        shot_case(t)
    elif B['F'] <= t < B['G']:
        shot_pair(t, B['F'], B['G'], macro=True)
    elif B['G'] <= t < B['H']:
        shot_fit(t)
    elif B['H'] <= t < B['I']:
        shot_touch(t)
    elif B['I'] <= t < B['J']:
        shot_pair(t, B['I'], B['J'], macro=False)
    else:
        return False
    return True

def shot_case(t):
    show(case, True)
    appear = eout(prog(t, B['C'], B['C'] + 0.35))
    s = lerp(0.9, 1.0, appear)
    zc = -0.002 + float_y(t, 0, 0.0008) - (1 - appear) * 0.005
    yaw = math.radians(lerp(-18, -7, eio(prog(t, B['C'], B['E']))))
    case.matrix_world = case_matrix((0, 0, zc), yaw, math.radians(3), s)
    openk = eio(prog(t, B['D'], B['D'] + 0.42))
    set_lid(openk * math.radians(-108))
    ledk = 0.6 + 0.4 * math.sin((t - B['C']) * 6.0) ** 2
    LED_STRENGTH.default_value = 4.0 * ledk * appear
    floor.hide_render = False
    floor.location = (0, 0, zc - CASE_H * s / 2 - 0.011)
    # écouteurs : dans le boîtier, puis ils sortent et montent
    lift = eio(prog(t, B['D'] + 0.28, B['D'] + 1.0))
    Rc = Matrix.Rotation(yaw, 4, 'Z')
    for side, sx, b in (('L', -1, budL), ('R', 1, budR)):
        show(b, openk > 0.05)
        seat = Vector((sx * 0.0142, 0.0008, CASE_H / 2 - 0.016))  # repère boîtier (centre)
        up = Vector((sx * 0.0058 * lift, -0.004 * lift, 0.0425 * lift + float_y(t, sx, 0.0005) * lift))
        pos = Vector((0, 0, zc)) + (Rc @ ((seat + up) * s).to_4d()).to_3d()
        phi = lerp(1.25, 0.6, lift)
        sw = Vector((sx * 0.10 * lift, 0, -1)); nw = Vector(nozzle(sx, phi, 0.15 * lift))
        sw = (Rc.to_3x3() @ sw); nw = (Rc.to_3x3() @ nw)
        b.matrix_world = bud_matrix(side, pos, sw, nw, scale=s)
    camup = eio(prog(t, B['D'], B['D'] + 0.9))
    frame_cam((0, 0, lerp(0.0, 0.013, camup)), (0, -1, lerp(0.22, 0.40, camup)),
              lerp(0.098, 0.118, camup) if PORTRAIT else lerp(0.088, 0.106, camup), fstop=11)

def shot_pair(t, t0, t1, macro):
    k = prog(t, t0, t1)
    for side, sx, b in (('L', -1, budL), ('R', 1, budR)):
        show(b, True)
        bob = float_y(t, sx * 1.3, 0.0007, 2.4)
        if macro:
            pos = (sx * lerp(0.0117, 0.0133, k), sx * lerp(0.0025, -0.0025, eio(k)), 0.0092 + bob + sx * 0.0012)
            phi = -lerp(0.95, 0.35, eio(k))
        else:
            pos = (sx * 0.0158, 0, 0.0097 + bob)
            phi = -lerp(0.42, 0.30, eio(k))
        b.matrix_world = bud_matrix(side, pos, (sx * 0.08, 0, -1), nozzle(sx, phi, 0.05))
    floor.hide_render = False; floor.location = (0, 0, -0.0265)
    if macro:
        a = lerp(-0.22, 0.22, eio(k))
        frame_cam((0, 0, 0.0015), (math.sin(a), -math.cos(a), 0.18),
                  lerp(0.055, 0.049, eio(k)), fstop=8)
        RIG.rotation_euler = (0, 0, a * 0.5)
    else:
        p = eout(k)
        frame_cam((0, 0, -0.002), (0, -1, 0.08), lerp(0.070, 0.064, p) if PORTRAIT else lerp(0.058, 0.053, p), fstop=11)

def shot_fit(t):
    k = prog(t, B['G'], B['H'])
    show(budL, True)
    bx = -0.023 if PORTRAIT else -0.0316
    zf = -0.0145
    budL.matrix_world = bud_matrix('L', (bx, 0, 0.0107 + float_y(t, 0, 0.0004)), (0, 0, -1), nozzle(-1, -0.15, 0.0))
    x0 = -0.0056 if PORTRAIT else -0.0102
    step = 0.0128 if PORTRAIT else 0.0158
    for i, (o, s) in enumerate(zip(TIPS, TIP_SIZES)):
        ti = B['G'] + 0.12 + i * 0.13
        a = ebackout(prog(t, ti, ti + 0.32))
        visible = t >= ti
        show(o, visible)
        if not visible:
            o.matrix_world = tip_matrix((x0 + i * step, 0, zf + 0.01), s * 0.001)
            continue
        drop = (1 - clamp(a)) * 0.008
        o.matrix_world = tip_matrix((x0 + i * step - (1 - s) * 0.003, 0, zf - tip_bottom(s) + drop),
                                    s * max(0.001, min(a, 1.15)))
    floor.hide_render = False; floor.location = (0, 0, zf)
    drift = eio(k)
    frame_cam((0.0015 if PORTRAIT else 0.002, 0, -0.001), (lerp(-0.08, 0.06, drift), -1, 0.28),
              lerp(0.0806, 0.0765, drift) if PORTRAIT else lerp(0.0571, 0.054, drift), fstop=11)

def shot_touch(t):
    k = prog(t, B['H'], B['I'])
    show(budL, True)
    yaw = lerp(0.18, 0.05, eio(k))
    m_w = Vector((math.sin(yaw), -math.cos(yaw), 0.0))
    s_w = Vector((0.10, 0.0, -1.0))
    budL.matrix_world = bud_matrix('L', (0, 0, 0), s_w, m_w, use_sensor=True)
    vl.update()
    sp = center(O[P['sensL']])
    glow = eout(prog(t, B['H'] + 0.45, B['H'] + 0.9))
    breathe = 0.85 + 0.15 * math.sin((t - B['H']) * 7)
    SENS_STRENGTH.default_value = 1.15 * glow * breathe
    SENS_BASE.default_value = tuple(lerp(a, b, glow) for a, b in zip((0.86, 0.86, 0.87, 1), (0.02, 0.36, 0.07, 1)))
    FACE.energy = FACE_E * 9.0  # gros plan : on rapproche la face douce
    macro(1.0)
    off = 0.0042 if PORTRAIT else 0.0077
    target = (sp.x + off, sp.y, sp.z + lerp(0.0025, 0.001, eio(k)))
    frame_cam(target, (-0.12, -1, 0.05),
              lerp(0.0255, 0.0219, eout(k)) if PORTRAIT else lerp(0.0194, 0.0168, eout(k)), fstop=6.3)

# ---------- clés d'animation (flou de mouvement correct, coupes nettes) ----------
SUB = 0.3  # clés à n-0.3, n, n+0.3 évaluées dans le plan de l'image n
_prevq = {}
def key_all(f, t):
    vis = state(t)
    vl.update()
    for o in ANIM + [floor, RIG]:
        if o.rotation_mode == 'QUATERNION':
            q = o.rotation_quaternion.copy()
            pq = _prevq.get(o.name)
            if pq is not None and q.dot(pq) < 0: o.rotation_quaternion = -q
            _prevq[o.name] = o.rotation_quaternion.copy()
        for path in ('location', 'rotation_quaternion' if o.rotation_mode == 'QUATERNION' else 'rotation_euler', 'scale'):
            o.keyframe_insert(path, frame=f)
    for o in [lid]:
        o.keyframe_insert('location', frame=f); o.keyframe_insert('rotation_euler', frame=f)
    for o in set(sum([desc(x) for x in (case, budL, budR)], [])) | set(TIPS) | {floor}:
        o.keyframe_insert('hide_render', frame=f)
    CAM.data.dof.keyframe_insert('focus_distance', frame=f)
    CAM.data.dof.keyframe_insert('aperture_fstop', frame=f)
    LED_STRENGTH.keyframe_insert('default_value', frame=f)
    SENS_STRENGTH.keyframe_insert('default_value', frame=f)
    SENS_BASE.keyframe_insert('default_value', frame=f)
    FACE.keyframe_insert('energy', frame=f)
    for l in MACRO: l.data.keyframe_insert('energy', frame=f)
    return vis

def has3d(t):
    return any(a <= t < b for a, b in SHOTS_3D)

fps = A.fps
if A.stills:
    times = [float(x) for x in A.stills.split(',')]
    frames = [(None, t) for t in times]
else:
    t0, t1 = (0.0, DUR)
    if A.range: t0, t1 = (float(x) for x in A.range.split(':'))
    frames = [(n, n / fps) for n in range(round(t0 * fps), round(t1 * fps))]

bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
# Clés : une image = sa propre timeline locale autour de f (en unités d'image)
FSCALE = 10  # images Blender par image de sortie (sous-images pour les clés)
sc.render.fps = fps * FSCALE
sc.render.motion_blur_shutter = 0.5 * FSCALE  # = 1/2 image de sortie
SHOT_BOUNDS = [(B['C'], B['E']), (B['F'], B['G']), (B['G'], B['H']), (B['H'], B['I']), (B['I'], B['J'])]
def shot_bounds(t):
    for a, b in SHOT_BOUNDS:
        if a <= t < b: return a, b
plan = []
for n, t in frames:
    if not has3d(t): plan.append((n, t, None)); continue
    fbase = round(t * fps * FSCALE)
    a, b = shot_bounds(t)
    # les sous-clés restent dans le plan de l'image (pas de traînée à travers une coupe)
    for dk in (-SUB, 0.0, SUB):
        key_all(fbase + dk * FSCALE, min(max(t + dk / fps, a), b - 1e-4))
    plan.append((n, t, fbase))


if A.save_blend:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(A.save_blend))

# ---------- rendu ----------
EMPTY = None
def write_empty(path):
    global EMPTY
    if EMPTY is None:
        EMPTY = bpy.data.images.new('vide', W, H, alpha=True)
        EMPTY.pixels.foreach_set(np.zeros(W * H * 4, dtype=np.float32))
        EMPTY.filepath_raw = path; EMPTY.file_format = 'PNG'; EMPTY.save()
        return
    import shutil; shutil.copyfile(EMPTY.filepath_raw, path)

sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.image_settings.color_depth = '8'
timings = []
for n, t, fbase in plan:
    name = f't{t:.2f}.png' if n is None else f'f{n:05d}.png'
    path = os.path.join(A.out, name)
    if A.resume and os.path.exists(path): continue
    if fbase is None:
        write_empty(path); continue
    sc.frame_set(fbase)
    t_start = time.time()
    tmp = path[:-4] + '.part.png'  # écriture atomique : une image interrompue n'est jamais sautée
    sc.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    os.replace(tmp, path)
    dt = time.time() - t_start; timings.append(dt)
    print(f'RENDU {name} t={t:.3f}s {dt:.1f}s', flush=True)
if timings:
    print(f'TEMPS moyen {sum(timings)/len(timings):.1f}s/image sur {len(timings)} images')

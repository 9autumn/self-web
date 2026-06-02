/**
 * 灰色轨迹 — Immersive 3D interactive space scene
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.3, 90)
camera.position.set(0, 1.0, 9)
camera.lookAt(0, 0.2, 0)

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('bg'),
  antialias: true,
  alpha: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

// ── Deep space gradient sphere ───────────────────────────────
const bgGeom = new THREE.SphereGeometry(32, 64, 32)
const bgMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  vertexShader: /* glsl */ `
    varying vec3 vPos;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vPos = wp.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vPos;
    void main() {
      float h = normalize(vPos).y;
      vec3 spaceTop    = vec3(0.02, 0.02, 0.06);
      vec3 spaceHigh   = vec3(0.03, 0.03, 0.08);
      vec3 spaceMid    = vec3(0.04, 0.04, 0.10);
      vec3 spaceLow    = vec3(0.05, 0.05, 0.12);
      vec3 spaceBottom = vec3(0.06, 0.06, 0.14);
      float t = smoothstep(-0.1, 0.5, h);
      vec3 col = mix(spaceBottom, spaceLow, t);
      col = mix(col, spaceMid,   smoothstep(0.15, 0.55, h));
      col = mix(col, spaceHigh,  smoothstep(0.40, 0.75, h));
      col = mix(col, spaceTop,   smoothstep(0.65, 0.90, h));
      float n1 = exp(-length(vPos.xz - vec2(-3.5, 2.0)) * 0.35) * 0.04;
      col += vec3(0.02, 0.04, 0.08) * n1;
      float n2 = exp(-length(vPos.xz - vec2(4.0, -1.8)) * 0.40) * 0.03;
      col += vec3(0.05, 0.01, 0.06) * n2;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
})
scene.add(new THREE.Mesh(bgGeom, bgMat))

// ═══════════════════════════════════════════════════════════
//  STARFIELD
// ═══════════════════════════════════════════════════════════
function makeStars(count, spread, size, color, opacity) {
  const g = new THREE.BufferGeometry()
  const p = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    p[i * 3] = (Math.random() - 0.5) * spread
    p[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6
    p[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.5 - 1
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3))
  return new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }))
}

const stars1 = makeStars(800, 20, 0.015, 0x8899cc, 0.7)
const stars2 = makeStars(500, 18, 0.025, 0xaaccff, 0.6)
const stars3 = makeStars(200, 16, 0.045, 0xffffff, 0.8)
const starCluster = makeStars(200, 3.5, 0.022, 0x00e5ff, 0.5)
starCluster.position.set(-4.5, 2.5, -1.5)
const starCluster2 = makeStars(180, 3.0, 0.022, 0x7c4dff, 0.45)
starCluster2.position.set(5.0, 1.0, -2.0)
scene.add(stars1, stars2, stars3, starCluster, starCluster2)

// ═══════════════════════════════════════════════════════════
//  GRID PLANE — tilts & glows near cursor
// ═══════════════════════════════════════════════════════════
const gridGeom = new THREE.PlaneGeometry(18, 12, 50, 32)
const gp = gridGeom.attributes.position
for (let i = 0; i < gp.count; i++) {
  gp.setZ(i, Math.sin(gp.getX(i) * 0.7) * Math.cos(gp.getY(i) * 0.5) * 0.35 - 4)
}
gridGeom.computeVertexNormals()
const gridMat = new THREE.ShaderMaterial({
  wireframe: true, transparent: true, opacity: 0.15, depthWrite: false,
  vertexShader: `varying vec3 vPos; varying float vDist; uniform vec3 uCursor;
    void main() { vec4 wp = modelMatrix * vec4(position,1.0); vPos=wp.xyz; vDist=length(wp.xz-uCursor.xz); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec3 vPos; varying float vDist;
    void main() { float g=exp(-vDist*0.5)*0.6+0.06; float a=0.06+g*0.18; vec3 c=mix(vec3(0,0.35,0.5),vec3(0.3,0.15,0.6),sin(vPos.x*0.7)*0.5+0.5); gl_FragColor=vec4(c,a); }`,
  uniforms: { uCursor: { value: new THREE.Vector3() } },
})
const gridPlane = new THREE.Mesh(gridGeom, gridMat)
gridPlane.position.set(0, -2.2, -2.5)
gridPlane.rotation.x = -0.55
scene.add(gridPlane)

// ═══════════════════════════════════════════════════════════
//  CENTRAL WIREFRAME SPHERE — large, highly visible
// ═══════════════════════════════════════════════════════════
const centralSphereGeom = new THREE.IcosahedronGeometry(0.8, 3)
const centralSphereMat = new THREE.ShaderMaterial({
  wireframe: true, transparent: true, opacity: 0.22, depthWrite: false,
  vertexShader: `varying vec3 vP; varying vec3 vN; uniform vec3 uCursor;
    void main() { vec4 wp = modelMatrix*vec4(position,1.0); vP=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec3 vP; varying vec3 vN;
    uniform vec3 uCursor; uniform float uTime;
    void main() {
      float d = length(vP - uCursor);
      float pulse = 0.15 + sin(uTime*1.5+d*2.0)*0.05;
      float a = pulse + exp(-d*0.4)*0.25;
      vec3 c = mix(vec3(0.0,0.85,1.0), vec3(0.5,0.2,1.0), sin(d*1.5+uTime)*0.5+0.5);
      gl_FragColor = vec4(c, a);
    }`,
  uniforms: { uCursor: { value: new THREE.Vector3() }, uTime: { value: 0 } },
})
const centralSphere = new THREE.Mesh(centralSphereGeom, centralSphereMat)
centralSphere.position.set(0, 1.6, -1.5)
scene.add(centralSphere)

// Inner wireframe rings orbiting central sphere
const ringGroup = new THREE.Group()
centralSphere.add(ringGroup)
for (let i = 0; i < 3; i++) {
  const rGeom = new THREE.TorusGeometry(0.95 + i * 0.2, 0.015, 16, 80)
  const rMat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0x00e5ff : i === 1 ? 0x7c4dff : 0x00e676, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  const ring = new THREE.Mesh(rGeom, rMat)
  ring.rotation.x = Math.PI / 2 + i * 0.5
  ring.rotation.y = i * 0.6
  ring.userData = { speed: 0.5 + i * 0.4, axis: i }
  ringGroup.add(ring)
}

// ═══════════════════════════════════════════════════════════
//  CURSOR ORB — brighter, more visible
// ═══════════════════════════════════════════════════════════
const orbGeom = new THREE.SphereGeometry(0.18, 32, 32)
const orbMat = new THREE.ShaderMaterial({
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  vertexShader: `varying vec3 vN; varying vec3 vP;
    void main() { vec4 wp=modelMatrix*vec4(position,1.0); vP=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec3 vN; varying vec3 vP;
    void main() { vec3 V=normalize(cameraPosition-vP); float rim=1.0-abs(dot(V,vN)); float g=pow(rim,2.2)*0.8; float c=pow(max(dot(V,vN),0.0),6.0)*0.4; float a=g*0.7+c; vec3 col=mix(vec3(0,0.9,1),vec3(0.7,1,1),c); gl_FragColor=vec4(col,a); }`,
})
const cursorOrb = new THREE.Mesh(orbGeom, orbMat)
cursorOrb.position.set(0, 1, -0.3)
scene.add(cursorOrb)

// Outer rings around cursor orb
for (let i = 0; i < 2; i++) {
  const rGeom = new THREE.TorusGeometry(0.28 + i * 0.12, 0.018, 16, 40)
  const rMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.55 - i * 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
  const ring = new THREE.Mesh(rGeom, rMat)
  ring.userData = { speed: 1.5 + i, axis: i }
  cursorOrb.add(ring)
}

// ═══════════════════════════════════════════════════════════
//  PARTICLE SWARM — larger, more responsive
// ═══════════════════════════════════════════════════════════
const swarmCount = 200
const swarmGeom = new THREE.BufferGeometry()
const swarmPos = new Float32Array(swarmCount * 3)
const swarmVel = []
for (let i = 0; i < swarmCount; i++) {
  swarmPos[i * 3] = (Math.random() - 0.5) * 12
  swarmPos[i * 3 + 1] = (Math.random() - 0.5) * 8
  swarmPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1
  swarmVel.push({ vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, vz: (Math.random() - 0.5) * 0.4 })
}
swarmGeom.setAttribute('position', new THREE.BufferAttribute(swarmPos, 3))
const swarm = new THREE.Points(swarmGeom, new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.05, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }))
scene.add(swarm)

// ═══════════════════════════════════════════════════════════
//  RISING DATA PARTICLES — vertical streams
// ═══════════════════════════════════════════════════════════
const dataCount = 300
const dataGeom = new THREE.BufferGeometry()
const dataPos = new Float32Array(dataCount * 3)
const dataBaseY = new Float32Array(dataCount)
for (let i = 0; i < dataCount; i++) {
  dataPos[i * 3] = (Math.random() - 0.5) * 14
  dataPos[i * 3 + 1] = (Math.random() - 0.5) * 9
  dataPos[i * 3 + 2] = (Math.random() - 0.5) * 7 - 1.5
  dataBaseY[i] = dataPos[i * 3 + 1]
}
dataGeom.setAttribute('position', new THREE.BufferAttribute(dataPos, 3))
const dataStream = new THREE.Points(dataGeom, new THREE.PointsMaterial({ color: 0x7c4dff, size: 0.025, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }))
scene.add(dataStream)

// ═══════════════════════════════════════════════════════════
//  FLOATING GEOMETRIC SHAPES
// ═══════════════════════════════════════════════════════════
const techShapes = new THREE.Group()
scene.add(techShapes)

function makeShape(create, pos, speed) {
  const m = create()
  m.position.set(...pos)
  m.userData = { speed, phase: Math.random() * Math.PI * 2, bx: pos[0], by: pos[1], bz: pos[2], baseOpacity: m.material.opacity }
  techShapes.add(m)
  return m
}

const shapes = [
  ...Array.from({ length: 6 }, (_, i) =>
    makeShape(() => new THREE.Mesh(new THREE.IcosahedronGeometry(0.25 + i * 0.04, 1), new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.22, depthWrite: false })), [-5 + i * 2, 2.8 - i * 0.5, -2.2], 0.25 + i * 0.03)),
  ...Array.from({ length: 4 }, (_, i) =>
    makeShape(() => new THREE.Mesh(new THREE.TorusKnotGeometry(0.3 + i * 0.08, 0.06, 64, 8, 2, 3), new THREE.MeshBasicMaterial({ color: 0x7c4dff, wireframe: true, transparent: true, opacity: 0.18, depthWrite: false })), [3.5 + i * 2, 3.0 - i * 1.2, -1.2], 0.15 + i * 0.03)),
  ...Array.from({ length: 5 }, (_, i) =>
    makeShape(() => new THREE.Mesh(new THREE.OctahedronGeometry(0.2 + i * 0.03, 0), new THREE.MeshBasicMaterial({ color: 0x00e676, wireframe: true, transparent: true, opacity: 0.14, depthWrite: false })), [-4 + i * 2.5, 1.2 - i * 0.7, -2], 0.3 + i * 0.02)),
  makeShape(() => new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 16, 80), new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.12, depthWrite: false })), [-6.5, 2.8, -1.8], 0.08),
  makeShape(() => new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.025, 16, 80), new THREE.MeshBasicMaterial({ color: 0x7c4dff, transparent: true, opacity: 0.12, depthWrite: false })), [6, 3.2, -1], 0.1),
]

// ═══════════════════════════════════════════════════════════
//  DYNAMIC LASER LINES — from shapes toward cursor
// ═══════════════════════════════════════════════════════════
const laserGroup = new THREE.Group()
scene.add(laserGroup)
const laserCount = 8
const laserLines = []
for (let i = 0; i < laserCount; i++) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3))
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }))
  laserLines.push({ line: l, sourceIdx: i })
  laserGroup.add(l)
}

// ── Lighting ───────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x111133, 0.3))

// ── Mouse state ────────────────────────────────────────────
const mouse = { x: 0, y: 0 }
const target = { x: 0, y: 0 }
const cursor3D = new THREE.Vector3(0, 1, -0.3)

document.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
})
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ═══════════════════════════════════════════════════════════
//  ANIMATION LOOP
// ═══════════════════════════════════════════════════════════
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.1)
  const t = performance.now() * 0.001

  target.x += (mouse.x - target.x) * 0.045
  target.y += (mouse.y - target.y) * 0.045

  // Stronger camera parallax
  camera.position.x += (target.x * 1.2 - camera.position.x) * 0.035
  camera.position.y += (1.0 + target.y * 0.7 - camera.position.y) * 0.035
  camera.lookAt(target.x * 0.25, 0.15 + target.y * 0.3, 0)

  // 3D cursor
  cursor3D.set(target.x * 7, 1.0 + target.y * 3.5, -0.3)

  // Grid
  gridMat.uniforms.uCursor.value.copy(cursor3D)
  gridPlane.rotation.x = -0.55 + target.y * 0.22
  gridPlane.rotation.z = target.x * 0.15

  // Central sphere
  centralSphere.rotation.x += dt * 0.25
  centralSphere.rotation.y += dt * 0.35
  centralSphere.position.x += (target.x * 2.5 - centralSphere.position.x) * 0.02
  centralSphere.position.y += (1.6 + target.y * 1.5 - centralSphere.position.y) * 0.02
  centralSphereMat.uniforms.uCursor.value.copy(cursor3D)
  centralSphereMat.uniforms.uTime.value = t

  // Central sphere rings
  ringGroup.children.forEach(r => {
    r.rotation.z += dt * r.userData.speed * 0.8
    r.rotation.x += dt * r.userData.speed * 0.3
  })

  // Cursor orb
  cursorOrb.position.lerp(cursor3D, 0.1)
  cursorOrb.children.forEach(r => {
    r.rotation.x += dt * r.userData.speed * 1.5
    r.rotation.y += dt * r.userData.speed * 1.2
  })

  // Swarm
  const sp = swarm.geometry.attributes.position
  for (let i = 0; i < swarmCount; i++) {
    const idx = i * 3
    const dx = cursorOrb.position.x - sp.getX(i)
    const dy = cursorOrb.position.y - sp.getY(i)
    const dz = cursorOrb.position.z - sp.getZ(i)
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01
    const force = Math.min(1.2 / (dist * dist + 0.3), 3.0)
    swarmVel[i].vx += dx / dist * force * dt * 4
    swarmVel[i].vy += dy / dist * force * dt * 4
    swarmVel[i].vz += dz / dist * force * dt * 4
    swarmVel[i].vx *= 0.975; swarmVel[i].vy *= 0.975; swarmVel[i].vz *= 0.975
    const spd = Math.sqrt(swarmVel[i].vx ** 2 + swarmVel[i].vy ** 2 + swarmVel[i].vz ** 2)
    if (spd > 2.0) { swarmVel[i].vx *= 2 / spd; swarmVel[i].vy *= 2 / spd; swarmVel[i].vz *= 2 / spd }
    let px = sp.getX(i) + swarmVel[i].vx * dt
    let py = sp.getY(i) + swarmVel[i].vy * dt
    let pz = sp.getZ(i) + swarmVel[i].vz * dt
    px = Math.max(-6, Math.min(6, px)); py = Math.max(-4, Math.min(6, py)); pz = Math.max(-4, Math.min(4, pz))
    sp.setXYZ(i, px, py, pz)
  }
  sp.needsUpdate = true
  swarm.material.opacity = 0.5 + Math.min(Math.sqrt(cursorOrb.position.x ** 2 + cursorOrb.position.y ** 2) * 0.06, 0.35)

  // Rising data particles
  const dp = dataStream.geometry.attributes.position
  for (let i = 0; i < dataCount; i++) {
    const idx = i * 3
    let y = dp.getY(i) + dt * (0.15 + Math.random() * 0.05)
    if (y > 4.5) y = -4.5
    dp.setY(i, y)
    // Slight horizontal drift toward cursor
    const dx = cursor3D.x - dp.getX(i)
    dp.setX(i, dp.getX(i) + dx * dt * 0.08)
  }
  dp.needsUpdate = true

  // Tech shapes
  shapes.forEach(m => {
    const u = m.userData
    m.rotation.x += dt * u.speed * 0.65
    m.rotation.y += dt * u.speed * 0.85
    m.rotation.z += dt * u.speed * 0.45
    const dx = m.position.x - cursor3D.x, dy = m.position.y - cursor3D.y, dz = m.position.z - cursor3D.z
    const cdist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1
    const repel = Math.min(1.2 / (cdist * cdist), 0.6)
    m.position.x = u.bx + Math.cos(t * 0.35 + u.phase) * 0.25 + dx / cdist * repel * 0.2
    m.position.y = u.by + Math.sin(t * 0.5 + u.phase) * 0.3 + dy / cdist * repel * 0.2
    m.position.z = u.bz + Math.sin(t * 0.4 + u.phase) * 0.2
    m.material.opacity = u.baseOpacity + Math.max(0, 1 - cdist * 0.45) * 0.3
  })

  // Laser lines: from shapes to cursor orb
  laserLines.forEach(({ line, sourceIdx }) => {
    const src = shapes[sourceIdx % shapes.length]
    const positions = line.geometry.attributes.position
    positions.setXYZ(0, src.position.x, src.position.y, src.position.z)
    positions.setXYZ(1, cursorOrb.position.x, cursorOrb.position.y, cursorOrb.position.z)
    positions.needsUpdate = true
    const dist = src.position.distanceTo(cursorOrb.position)
    line.material.opacity = Math.max(0, 0.18 - dist * 0.03)
  })

  // Starfield rotation
  stars1.rotation.y += dt * 0.006
  stars2.rotation.y -= dt * 0.01
  stars3.rotation.y += dt * 0.013
  starCluster.rotation.y -= dt * 0.008
  starCluster2.rotation.y += dt * 0.008
  stars3.material.opacity = 0.65 + Math.sin(t * 1.8) * 0.12 + Math.sin(t * 3.3) * 0.06

  renderer.render(scene, camera)
}

animate()

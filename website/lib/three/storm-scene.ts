import * as THREE from "three"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"

// The hero background: a night-time New York skyline under storm clouds that
// throw red lightning. Everything is generated in code, so there are no
// models or textures to download.
//
// Layout: the camera sits at z = CAMERA_Z looking down -z. Each layer is a flat
// plane at its own depth, sized in "half-heights" of the view at that depth,
// so the composition holds at any aspect ratio and the layers parallax as the
// camera moves.

const CAMERA_Z = 10
const FOV = 45
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
/** Half the visible height of the view at depth z. */
const halfH = (z: number) => TAN * (CAMERA_Z - z)
/** Widest aspect ratio the skyline has to cover, plus parallax margin. */
const MAX_ASPECT = 3.4

const SKY_Z = -40
const STAR_Z = -38

const RED = new THREE.Color("#ff1f3d")

export type StormScene = {
  /** Fires a bolt toward a point on the screen (client coordinates). */
  strikeAt: (clientX: number, clientY: number) => void
  setPointer: (x: number, y: number) => void
  dispose: () => void
}

export type StormOptions = {
  /** Draw one still frame and skip all animation. */
  reducedMotion: boolean
  /** Called once the first frame has been drawn. */
  onReady?: () => void
}

// Seeded so the skyline is the same on every visit.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const range = (rand: () => number, min: number, max: number) => min + rand() * (max - min)

/* -------------------------------------------------------------------------- */
/* Sky and stars                                                              */
/* -------------------------------------------------------------------------- */

function createSky() {
  const h = halfH(SKY_Z) * 2.4
  const w = h * MAX_ASPECT * 1.3
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color("#060c22") },
      uMid: { value: new THREE.Color("#0c1a40") },
      uHorizon: { value: new THREE.Color("#1d2c5e") },
      uHaze: { value: new THREE.Color("#3b1838") },
      uFlash: { value: 0 },
      uFlashX: { value: 0.5 },
      uFlashColor: { value: RED.clone() },
      // Converts uv.x distances into half-heights of the view.
      uWidthScale: { value: w / halfH(SKY_Z) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uMid, uHorizon, uHaze, uFlashColor;
      uniform float uFlash, uFlashX, uWidthScale;
      varying vec2 vUv;
      void main() {
        float y = vUv.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.3, 0.55, y));
        col = mix(col, uTop, smoothstep(0.55, 0.85, y));
        // Light pollution: a warm red haze just above the city.
        col += uHaze * smoothstep(0.48, 0.3, y) * 0.55;
        // Lightning lights up the sky around the bolt.
        float dx = (vUv.x - uFlashX) * uWidthScale;
        col += uFlashColor * uFlash * exp(-dx * dx * 2.5) * smoothstep(0.25, 0.75, y) * 0.22;
        col += uFlashColor * uFlash * 0.012;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material)
  mesh.position.set(0, halfH(SKY_Z) * 0.15, SKY_Z)
  return { mesh, material, width: w }
}

function createStars(rand: () => number) {
  const count = 320
  const hh = halfH(STAR_Z)
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = range(rand, -hh * MAX_ASPECT, hh * MAX_ASPECT)
    // Fewer stars near the horizon, where the city glow washes them out.
    positions[i * 3 + 1] = hh * (1.2 - Math.pow(rand(), 0.7) * 1.15)
    positions[i * 3 + 2] = STAR_Z
    seeds[i] = rand()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uPixelRatio;
      varying float vAlpha;
      void main() {
        vAlpha = (0.25 + 0.55 * aSeed) * (0.7 + 0.3 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 40.0));
        gl_PointSize = (1.0 + aSeed * 1.6) * uPixelRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(vec3(0.8, 0.86, 1.0), a);
      }
    `,
  })
  return { points: new THREE.Points(geometry, material), material }
}

/* -------------------------------------------------------------------------- */
/* Moon                                                                       */
/* -------------------------------------------------------------------------- */

const MOON_Z = -30

/** A glowing white moon, behind the clouds so they drift across it. */
function createMoon() {
  const hh = halfH(MOON_Z)
  const radius = hh * 0.13
  // The plane is much bigger than the disc to leave room for the halo.
  const size = radius * 9
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFlash;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
        return v;
      }

      void main() {
        // Distance from the center, in moon radii (the plane spans 4.5 radii each way).
        vec2 p = (vUv - 0.5) * 9.0;
        float d = length(p);
        float pulse = 0.92 + 0.08 * sin(uTime * 0.6);

        // Disc: dark maria from noise, darker toward the rim.
        float disc = smoothstep(1.0, 0.97, d);
        float maria = smoothstep(0.42, 0.68, fbm(p * 1.6 + 3.0));
        float limb = sqrt(max(0.0, 1.0 - d * d));
        // Kept dim so it sits in the night sky instead of lighting it up.
        vec3 surface = mix(vec3(0.26, 0.27, 0.3), vec3(0.14, 0.15, 0.18), maria) * (0.6 + 0.4 * limb);

        // Halo: a tight glow plus a wide, faint one.
        float halo = exp(-max(d - 1.0, 0.0) * 4.0) * 0.12 + exp(-max(d - 1.0, 0.0) * 1.2) * 0.025;
        // Fade to nothing before the plane's edge so no rectangle shows.
        halo *= smoothstep(4.5, 2.8, d);
        vec3 glow = vec3(0.7, 0.78, 1.0) * halo * (1.0 - disc) * (pulse + uFlash * 0.4);

        vec3 col = surface * disc * pulse + glow;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material)
  mesh.position.set(0, 0.3 * hh, MOON_Z)
  // Keeps the moon tucked against the left edge at any aspect ratio.
  const placeLeft = (aspect: number) => {
    mesh.position.x = -hh * aspect + radius * 1.5
  }
  return { mesh, material, placeLeft }
}

/* -------------------------------------------------------------------------- */
/* Thunderbird signal                                                         */
/* -------------------------------------------------------------------------- */

// A searchlight on a rooftop throws Johnny Thunderbird's head onto the clouds,
// Bat-Signal style. It stands well back in the scene, between the far and
// middle skyline layers and among the clouds, so nearer buildings hide its
// base and clouds drift across the signal.
const SIGNAL_Z = -12

// A plain silhouette of the mascot's head in profile, facing left, on a 512px
// canvas: hooked upper beak over an open lower beak, three crest spikes and a
// short neck.
const THUNDERBIRD_HEAD =
  "M232 168 C192 140 124 150 100 198 C92 220 98 244 112 254 C124 240 160 238 206 252 " +
  "L138 272 C144 292 196 304 232 312 C236 340 236 362 244 384 Q300 400 360 384 " +
  "C352 356 350 330 356 304 L430 292 L376 260 L452 228 L380 208 L438 150 " +
  "C380 150 300 130 232 168 Z"

/** Radius of the lit disc on its 512px canvas. */
const SIGNAL_DISC_R = 236

/** The solid red disc of light with the head cut out of it, lightly grainy. */
function createSignalTexture(rand: () => number) {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")!
  const c = size / 2

  ctx.fillStyle = "#ff1f3d"
  ctx.beginPath()
  ctx.arc(c, c, SIGNAL_DISC_R, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalCompositeOperation = "destination-out"
  ctx.fill(new Path2D(THUNDERBIRD_HEAD))

  // Grain, like light scattering through haze.
  const image = ctx.getImageData(0, 0, size, size)
  for (let i = 3; i < image.data.length; i += 4) {
    image.data[i] *= 0.82 + rand() * 0.18
  }
  ctx.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** The tower's facade: navy with a scatter of lit windows, plus a stepped top. */
function createTowerTexture(rand: () => number) {
  const w = 64
  const h = 512
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = BUILDING_NAVY
  ctx.fillRect(0, 0, w, h)
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.4)
  top.addColorStop(0, BUILDING_NAVY_TOP)
  top.addColorStop(1, BUILDING_NAVY)
  ctx.fillStyle = top
  ctx.fillRect(0, 0, w, h * 0.4)
  for (let y = 14; y < h - 8; y += 12) {
    for (let x = 6; x < w - 6; x += 10) {
      if (rand() < 0.3) {
        ctx.fillStyle = `rgba(255, 214, 140, ${range(rand, 0.25, 0.7)})`
        ctx.fillRect(x, y, 5, 6)
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** A soft round glow for the searchlight's lens. */
function createGlowTexture() {
  const size = 128
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, "rgba(255, 200, 205, 1)")
  g.addColorStop(0.2, "rgba(255, 50, 75, 0.8)")
  g.addColorStop(1, "rgba(255, 31, 61, 0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Not used while the signal is switched off (see where the scene is built).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createSignal(rand: () => number) {
  const hh = halfH(SIGNAL_Z)
  const diameter = hh * 0.4
  const group = new THREE.Group()
  const texture = createSignalTexture(rand)
  // Kept soft so it reads as part of the distant sky.
  const brightness = 0.58

  // The disc is squashed into an oval along the beam, like the base of a
  // cone seen at an angle, and turned square to the beam. (1 makes it a
  // circle.)
  const squash = 0.8
  // The disc's half-width and half-height in world units.
  const rx = (diameter / 2) * (SIGNAL_DISC_R / 256)
  const ry = rx * squash

  // The beam and the disc are one shape, Bat-Signal style: a cone that widens
  // as it climbs from the lamp and ends in the oval with the head cut out.
  // Drawing them together means there's no seam where they meet. It's built
  // along its own axis (x across, y up the beam) and turned into place, so the
  // shader can work in those coordinates.
  const beamGeometry = new THREE.BufferGeometry()
  beamGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(18), 3))
  beamGeometry.setIndex([0, 1, 2, 0, 2, 5, 5, 2, 3, 5, 3, 4])
  const beamMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uIntensity: { value: 1 },
      uColor: { value: new THREE.Color("#ff1f3d") },
      uLen: { value: 1 },
      uBottom: { value: 1 },
      // Where the right side line touches the oval (the left one mirrors it).
      uTangent: { value: new THREE.Vector2(1, 1) },
      uRadii: { value: new THREE.Vector2(rx, ry) },
      uMap: { value: texture },
      uDiameter: { value: diameter },
      uSquash: { value: squash },
      uLevel: { value: brightness },
    },
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      void main() {
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity, uLen, uBottom, uDiameter, uSquash, uLevel;
      uniform vec2 uRadii, uTangent;
      uniform sampler2D uMap;
      varying vec2 vLocal;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      void main() {
        float y = vLocal.y;

        // The cone's straight sides, from the lamp to where each one just
        // touches the oval, so they flow into its curve like a drawn cone.
        float w = mix(uBottom, uTangent.x, clamp(y / uTangent.y, 0.0, 1.0));
        float cone = smoothstep(1.0, 0.98, abs(vLocal.x) / w) * step(y, uTangent.y);

        // The oval the light lands on.
        vec2 e = vec2(vLocal.x, y - uLen) / uRadii;
        float d = dot(e, e);
        float oval = smoothstep(1.0, 0.98, d);

        // One outline: the cone and the oval together.
        float shape = max(cone, oval);

        // One brightness for the whole shape: dimmer at the lamp, rising to
        // full at the middle of the oval. No part is lit on its own, so
        // there's no visible circle inside the beam.
        float level = mix(0.34, uLevel, smoothstep(0.0, uLen, y));

        // The head, cut out of the middle of the oval. Only the cutout is
        // read from the texture, so its rim and grain don't show as a ring.
        vec2 uv = vec2(vLocal.x / uDiameter + 0.5, (y - uLen) / (uDiameter * uSquash) + 0.5);
        float lit = smoothstep(0.25, 0.75, texture2D(uMap, uv).a);
        float core = smoothstep(0.9, 0.86, d);
        float cut = mix(1.0, lit, core);

        float grain = 0.86 + 0.14 * hash(floor(gl_FragCoord.xy));
        gl_FragColor = vec4(uColor, shape * level * cut * grain * uIntensity);
      }
    `,
  })
  const beam = new THREE.Mesh(beamGeometry, beamMaterial)
  beam.frustumCulled = false

  // The building the light stands on: a broad shaft stepping in twice toward
  // the roof, art deco style, with the lamp on top.
  const towerTexture = createTowerTexture(rand)
  const roofY = -hh * 0.18
  const towerW = hh * 0.16
  const step1H = hh * 0.05
  const step2H = hh * 0.035
  const ground = GROUND * hh
  const navy = new THREE.MeshBasicMaterial({ color: BUILDING_NAVY })
  const stepMaterial = new THREE.MeshBasicMaterial({ color: BUILDING_NAVY_TOP })
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(towerW, roofY - ground), new THREE.MeshBasicMaterial({ map: towerTexture }))
  const step1 = new THREE.Mesh(new THREE.PlaneGeometry(towerW * 0.7, step1H), stepMaterial)
  const step2 = new THREE.Mesh(new THREE.PlaneGeometry(towerW * 0.42, step2H), stepMaterial)
  // The lamp housing: a short drum on a stand, tipped toward the clouds. Its
  // mouth is as wide as the base of the beam.
  const beamBottom = hh * 0.03
  const stand = new THREE.Mesh(new THREE.PlaneGeometry(hh * 0.01, hh * 0.024), navy)
  const drum = new THREE.Mesh(new THREE.PlaneGeometry(beamBottom * 2.3, hh * 0.032), navy)
  const glowTexture = createGlowTexture()
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: new THREE.Color(2.4, 1.2, 1.3),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const lens = new THREE.Sprite(glowMaterial)
  lens.scale.set(hh * 0.08, hh * 0.08, 1)

  // Beam behind the tower, so it rises from the lamp rather than across the roof.
  beam.position.z = -0.02
  group.add(beam, shaft, step1, step2, stand, drum, lens)
  group.position.z = SIGNAL_Z

  /** Keeps the disc on the right, and on screen on narrow phones. */
  const place = (aspect: number) => {
    const x = Math.min(aspect * hh * 0.42, hh * 0.75)
    const y = hh * 0.5

    // The building sits down and a little to the right, so the beam points
    // mostly upward with a lean from right to left. It's held inside the
    // right edge of the screen, which straightens the beam a little on phones.
    const tx = Math.min(x + hh * 0.18, aspect * hh * 0.9)
    shaft.position.set(tx, (ground + roofY) / 2, 0)
    step1.position.set(tx, roofY + step1H / 2, 0)
    step2.position.set(tx, roofY + step1H + step2H / 2, 0)
    const deck = roofY + step1H + step2H
    stand.position.set(tx, deck + hh * 0.012, 0.001)
    const lamp: V2 = [tx, deck + hh * 0.03]
    const angle = Math.atan2(y - lamp[1], x - lamp[0])
    const turn = angle - Math.PI / 2
    drum.position.set(lamp[0], lamp[1], 0.002)
    drum.rotation.z = turn
    lens.position.set(lamp[0] + Math.cos(angle) * hh * 0.016, lamp[1] + Math.sin(angle) * hh * 0.016, 0.003)

    // The beam runs from the lamp to the oval's center. Each side line goes
    // from the edge of the lamp to the point where it just touches the oval:
    // for the point (rx cos θ, len + ry sin θ), that's where
    // px·ry·cos θ − rx·len·sin θ = rx·ry, with px the lamp's half-width.
    const len = Math.hypot(x - lamp[0], y - lamp[1])
    beam.position.set(lamp[0], lamp[1], -0.02)
    beam.rotation.z = turn
    const A = beamBottom * ry
    const B = -rx * len
    const R = Math.hypot(A, B)
    const phi = Math.atan2(B, A)
    const spread = Math.acos(Math.min(1, (rx * ry) / R))
    // A line from the lamp touches the oval twice, once on each side; take
    // the one on the right.
    const theta = [phi + spread, phi - spread].reduce((a, b) => (Math.cos(a) > Math.cos(b) ? a : b))
    const tangent: V2 = [rx * Math.cos(theta), len + ry * Math.sin(theta)]

    // The mesh just has to cover the cone and the oval; the shader draws
    // the actual outline.
    const wide = rx * 1.04
    const top = len + ry * 1.04
    const p = beamGeometry.attributes.position as THREE.BufferAttribute
    p.setXYZ(0, -beamBottom, 0, 0)
    p.setXYZ(1, beamBottom, 0, 0)
    p.setXYZ(2, wide, tangent[1], 0)
    p.setXYZ(3, wide, top, 0)
    p.setXYZ(4, -wide, top, 0)
    p.setXYZ(5, -wide, tangent[1], 0)
    p.needsUpdate = true
    beamMaterial.uniforms.uTangent.value.set(tangent[0], tangent[1])
    beamMaterial.uniforms.uLen.value = len
    beamMaterial.uniforms.uBottom.value = beamBottom
  }

  /** A faint shimmer, like an old arc lamp. */
  const update = (time: number) => {
    const shimmer = 0.94 + 0.04 * Math.sin(time * 1.7) + 0.02 * Math.sin(time * 7.3)
    beamMaterial.uniforms.uIntensity.value = shimmer
    glowMaterial.opacity = shimmer
  }

  const dispose = () => {
    texture.dispose()
    towerTexture.dispose()
    glowTexture.dispose()
    glowMaterial.dispose()
  }

  return { group, place, update, dispose }
}

/* -------------------------------------------------------------------------- */
/* Skyline                                                                    */
/* -------------------------------------------------------------------------- */

// Piece kinds, read by the building shader.
const KIND_WINDOWS = 0 // facade with lit windows
const KIND_PLAIN = 1 // spires, masts, rooftop boxes
const KIND_METAL = 2 // Chrysler's steel crown, catches the lightning

type LayerSpec = {
  z: number
  base: string
  top: string
  windows: number // share of windows that are lit
  windowBright: number
  widths: [number, number] // building widths, in half-heights
  heights: [number, number] // building heights above ground, in half-heights
  lightSize: number
}

const BUILDING_NAVY = "#0d1838"
// A touch lighter toward the rooftops.
const BUILDING_NAVY_TOP = "#15224d"

const LAYERS: LayerSpec[] = [
  // Every layer is the same navy; the windows alone set the layers apart.
  { z: -15, base: BUILDING_NAVY, top: BUILDING_NAVY_TOP, windows: 0.3, windowBright: 0.3, widths: [0.05, 0.14], heights: [0.5, 0.9], lightSize: 2 },
  { z: -7, base: BUILDING_NAVY, top: BUILDING_NAVY_TOP, windows: 0.36, windowBright: 0.6, widths: [0.07, 0.19], heights: [0.42, 0.82], lightSize: 3 },
  { z: -1.5, base: BUILDING_NAVY, top: BUILDING_NAVY_TOP, windows: 0.38, windowBright: 0.75, widths: [0.11, 0.28], heights: [0.22, 0.48], lightSize: 4 },
]

/** Ground line, a little below the bottom of the screen, in half-heights. */
const GROUND = -1.15

/** Stretches every building (landmarks included) to make the whole skyline taller. */
const CITY_SCALE = 1.4

class SkylineBuilder {
  positions: number[] = []
  seeds: number[] = []
  kinds: number[] = []
  lights: number[] = []
  z = 0

  private push(points: [number, number][], seed: number, kind: number) {
    for (const [x, y] of points) {
      this.positions.push(x, y, this.z)
      this.seeds.push(seed)
      this.kinds.push(kind)
    }
  }

  /** Axis-aligned block from y0 to y1. */
  rect(x0: number, x1: number, y0: number, y1: number, seed: number, kind = KIND_WINDOWS) {
    this.quad([x0, y0], [x1, y0], [x1, y1], [x0, y1], seed, kind)
  }

  /** Four corners, counter-clockwise from bottom-left. */
  quad(a: [number, number], b: [number, number], c: [number, number], d: [number, number], seed: number, kind: number) {
    this.push([a, b, c, a, c, d], seed, kind)
  }

  tri(a: [number, number], b: [number, number], c: [number, number], seed: number, kind: number) {
    this.push([a, b, c], seed, kind)
  }

  light(x: number, y: number, size: number) {
    this.lights.push(x, y, this.z + 0.01, size)
  }
}

/** Empire State Building, centered at cx. u is one hundredth of a half-height. */
function empireState(b: SkylineBuilder, cx: number, g: number, u: number, seed: number) {
  const r = (x0: number, x1: number, y0: number, y1: number, kind = KIND_WINDOWS) =>
    b.rect(cx + x0 * u, cx + x1 * u, g + y0 * u, g + y1 * u, seed, kind)
  r(-10, 10, 0, 62)
  r(-7.5, 7.5, 0, 92)
  r(-5, 5, 92, 101)
  r(-3.6, 3.6, 101, 106, KIND_PLAIN)
  r(-2.6, 2.6, 106, 112, KIND_PLAIN)
  r(-1.7, 1.7, 112, 117, KIND_PLAIN)
  r(-0.7, 0.7, 117, 128, KIND_PLAIN)
  b.tri([cx - 0.35 * u, g + 128 * u], [cx + 0.35 * u, g + 128 * u], [cx, g + 137 * u], seed, KIND_PLAIN)
  b.light(cx, g + 137 * u, 1)
}

/** Chrysler Building: tiers, a stepped steel crown and a needle. */
function chrysler(b: SkylineBuilder, cx: number, g: number, u: number, seed: number) {
  const r = (x0: number, x1: number, y0: number, y1: number, kind = KIND_WINDOWS) =>
    b.rect(cx + x0 * u, cx + x1 * u, g + y0 * u, g + y1 * u, seed, kind)
  r(-9, 9, 0, 55)
  r(-6.5, 6.5, 0, 88)
  r(-4.8, 4.8, 88, 95)
  // Crown: narrowing steel tiers.
  const tiers = [
    [4.4, 3.4, 95, 99.5],
    [3.4, 2.5, 99.5, 104],
    [2.5, 1.7, 104, 108],
    [1.7, 1.0, 108, 112],
  ]
  for (const [w0, w1, y0, y1] of tiers) {
    b.quad(
      [cx - w0 * u, g + y0 * u],
      [cx + w0 * u, g + y0 * u],
      [cx + w1 * u, g + y1 * u],
      [cx - w1 * u, g + y1 * u],
      seed,
      KIND_METAL,
    )
  }
  b.tri([cx - 1 * u, g + 112 * u], [cx + 1 * u, g + 112 * u], [cx, g + 126 * u], seed, KIND_METAL)
  b.light(cx, g + 126 * u, 1)
}

/** One World Trade Center: a tapering tower and a long spire. */
function oneWtc(b: SkylineBuilder, cx: number, g: number, u: number, seed: number) {
  b.rect(cx - 7 * u, cx + 7 * u, g, g + 22 * u, seed)
  b.quad(
    [cx - 7 * u, g + 22 * u],
    [cx + 7 * u, g + 22 * u],
    [cx + 4.4 * u, g + 104 * u],
    [cx - 4.4 * u, g + 104 * u],
    seed,
    KIND_WINDOWS,
  )
  b.rect(cx - 3.2 * u, cx + 3.2 * u, g + 104 * u, g + 107 * u, seed, KIND_PLAIN)
  b.tri([cx - 0.45 * u, g + 107 * u], [cx + 0.45 * u, g + 107 * u], [cx, g + 130 * u], seed, KIND_PLAIN)
  b.light(cx, g + 130 * u, 1)
}

/** An ordinary tower with a random roof. Heights and widths in world units. */
function genericBuilding(
  b: SkylineBuilder,
  rand: () => number,
  x0: number,
  w: number,
  g: number,
  top: number,
  seed: number,
  isTall: boolean,
) {
  const x1 = x0 + w
  const roll = rand()
  if (roll < 0.35) {
    // Plain block, sometimes with a water tower.
    b.rect(x0, x1, g, top, seed)
    if (rand() < 0.5 && w > 0) {
      const tx = x0 + w * range(rand, 0.2, 0.6)
      const tw = w * 0.18
      b.rect(tx, tx + tw, top, top + tw * 0.9, seed, KIND_PLAIN)
      b.tri([tx - tw * 0.1, top + tw * 0.9], [tx + tw * 1.1, top + tw * 0.9], [tx + tw / 2, top + tw * 1.5], seed, KIND_PLAIN)
    }
  } else if (roll < 0.7) {
    // Wedding-cake setbacks.
    const tiers = 2 + Math.floor(rand() * 2)
    let y = g
    let inset = 0
    const step = (top - g) / (tiers + 1.5)
    for (let t = 0; t < tiers; t++) {
      const yTop = t === tiers - 1 ? top : y + step * (t === 0 ? 2 : 1)
      b.rect(x0 + inset, x1 - inset, g, yTop, seed)
      y = yTop
      inset += w * range(rand, 0.1, 0.16)
    }
  } else if (roll < 0.85) {
    // Pyramid roof.
    b.rect(x0, x1, g, top, seed)
    b.tri([x0 + w * 0.08, top], [x1 - w * 0.08, top], [x0 + w / 2, top + w * 0.45], seed, KIND_PLAIN)
  } else {
    // Slanted roof, like Citigroup Center.
    const rise = w * 0.5
    b.rect(x0, x1, g, top, seed)
    b.tri([x0, top], [x1, top], [x0, top + rise], seed, KIND_PLAIN)
  }
  if (isTall) {
    // Antenna with an aircraft warning light.
    const ax = x0 + w / 2
    const ah = w * range(rand, 0.6, 1.2)
    b.rect(ax - w * 0.02, ax + w * 0.02, top, top + ah, seed, KIND_PLAIN)
    b.light(ax, top + ah, 1)
  }
}

const buildingVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aKind;
  varying vec2 vPos;
  varying float vSeed;
  varying float vKind;
  void main() {
    vPos = position.xy;
    vSeed = aSeed;
    vKind = aKind;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const buildingFragment = /* glsl */ `
  uniform vec3 uBase, uTop, uMetal, uFlashColor;
  uniform vec2 uCell;
  uniform float uWindows, uWindowBright, uTime, uFlash, uFlashX, uHalfH;
  varying vec2 vPos;
  varying float vSeed;
  varying float vKind;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float h01 = clamp((vPos.y + uHalfH * 1.15) / (uHalfH * 1.6), 0.0, 1.0);
    vec3 col = mix(uBase, uTop, h01);

    // Red light from the lightning, strongest near the bolt and on rooftops.
    float d = (vPos.x - uFlashX) / uHalfH;
    float reach = exp(-d * d * 1.2);
    float flash = uFlash * reach * smoothstep(-1.1, 0.4, vPos.y / uHalfH);

    if (vKind < 0.5) {
      vec2 cell = floor(vPos / uCell);
      vec2 f = fract(vPos / uCell);
      float inWindow = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.78);
      float r = hash(cell + vSeed * 17.0);
      float lit = step(1.0 - uWindows, r);
      // Some buildings are mostly dark.
      lit *= step(0.12, fract(vSeed * 7.31));
      // Lights switch on and off now and then.
      lit *= step(0.05, hash(cell * 1.7 + floor(uTime * 0.07 + r * 30.0)));
      vec3 warm = vec3(1.0, 0.72, 0.38);
      vec3 cool = vec3(0.62, 0.74, 1.0);
      vec3 windowColor = mix(warm, cool, step(0.78, hash(cell + 3.1)));
      float bright = (0.35 + 0.65 * hash(cell + 9.7)) * uWindowBright;
      col = mix(col, windowColor * bright, inWindow * lit);
      col += uFlashColor * flash * 0.22;
    } else if (vKind < 1.5) {
      col += uFlashColor * flash * 0.3;
    } else {
      // Same navy as the rest, but the steel still catches the lightning.
      col = uMetal + uFlashColor * flash * 0.9;
    }
    gl_FragColor = vec4(col, 1.0);
  }
`

function createSkyline(rand: () => number) {
  const group = new THREE.Group()
  const materials: THREE.ShaderMaterial[] = []
  const lightMaterials: THREE.ShaderMaterial[] = []

  LAYERS.forEach((spec, layerIndex) => {
    const hh = halfH(spec.z)
    const g = GROUND * hh
    const u = (hh / 100) * CITY_SCALE
    const b = new SkylineBuilder()
    const limit = hh * MAX_ASPECT
    let seed = layerIndex * 1000

    // Landmarks, kept near the center so they show on phones too.
    type Landmark = { x0: number; x1: number }
    const landmarks: Landmark[] = []
    if (layerIndex === 0) {
      oneWtc(b, -0.95 * hh, g, u, ++seed)
      landmarks.push({ x0: -0.95 * hh - 8 * u, x1: -0.95 * hh + 8 * u })
    }
    if (layerIndex === 1) {
      empireState(b, -0.22 * hh, g, u, ++seed)
      chrysler(b, 0.34 * hh, g, u, ++seed)
      landmarks.push({ x0: -0.22 * hh - 11 * u, x1: -0.22 * hh + 11 * u })
      landmarks.push({ x0: 0.34 * hh - 10 * u, x1: 0.34 * hh + 10 * u })
    }

    let x = -limit
    let index = 0
    while (x < limit) {
      const w = range(rand, spec.widths[0], spec.widths[1]) * hh
      const center = x + w / 2
      // Taller in Midtown, lower toward the edges.
      const envelope = 0.75 + 0.35 * Math.exp(-Math.pow(center / (hh * 1.4), 2))
      let height = range(rand, spec.heights[0], spec.heights[1]) * envelope * CITY_SCALE
      // Keep the landmarks clear of anything taller.
      for (const lm of landmarks) {
        if (x + w > lm.x0 && x < lm.x1) height = Math.min(height, 0.68 * CITY_SCALE)
      }
      const isTall = height > spec.heights[1] * 0.92 * CITY_SCALE
      b.z = index * 0.002
      genericBuilding(b, rand, x, w, g, g + height * hh, ++seed, isTall)
      x += w + (rand() < 0.25 ? range(rand, 0, 0.03) * hh : 0)
      index++
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(b.positions, 3))
    geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(b.seeds, 1))
    geometry.setAttribute("aKind", new THREE.Float32BufferAttribute(b.kinds, 1))
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uBase: { value: new THREE.Color(spec.base) },
        uTop: { value: new THREE.Color(spec.top) },
        uMetal: { value: new THREE.Color(spec.top) },
        uFlashColor: { value: RED.clone() },
        // Windows come out about the same size on screen in every layer.
        uCell: { value: new THREE.Vector2(hh * 0.011, hh * 0.016) },
        uWindows: { value: spec.windows },
        uWindowBright: { value: spec.windowBright },
        uTime: { value: 0 },
        uFlash: { value: 0 },
        uFlashX: { value: 0 },
        uHalfH: { value: hh },
      },
      vertexShader: buildingVertex,
      fragmentShader: buildingFragment,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = spec.z
    mesh.frustumCulled = false
    group.add(mesh)
    materials.push(material)

    // Blinking red aircraft warning lights on the tallest roofs.
    const count = b.lights.length / 4
    const lightPositions = new Float32Array(count * 3)
    const lightSeeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      lightPositions[i * 3] = b.lights[i * 4]
      lightPositions[i * 3 + 1] = b.lights[i * 4 + 1]
      lightPositions[i * 3 + 2] = b.lights[i * 4 + 2]
      lightSeeds[i] = rand()
    }
    const lightGeometry = new THREE.BufferGeometry()
    lightGeometry.setAttribute("position", new THREE.BufferAttribute(lightPositions, 3))
    lightGeometry.setAttribute("aSeed", new THREE.BufferAttribute(lightSeeds, 1))
    const lightMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uSize: { value: spec.lightSize } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uPixelRatio, uSize;
        varying float vOn;
        void main() {
          vOn = step(0.55, fract(uTime * 0.7 + aSeed));
          gl_PointSize = uSize * 2.5 * uPixelRatio;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vOn;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float core = smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(vec3(2.4, 0.15, 0.2) * core, core * (0.15 + 0.85 * vOn));
        }
      `,
    })
    const lightPoints = new THREE.Points(lightGeometry, lightMaterial)
    lightPoints.position.z = spec.z
    lightPoints.frustumCulled = false
    group.add(lightPoints)
    lightMaterials.push(lightMaterial)
  })

  return { group, materials, lightMaterials }
}

/* -------------------------------------------------------------------------- */
/* Clouds                                                                     */
/* -------------------------------------------------------------------------- */

/** A soft, lumpy puff drawn on a canvas, used for every cloud sprite. */
function createPuffTexture(rand: () => number) {
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")!
  for (let i = 0; i < 46; i++) {
    const angle = rand() * Math.PI * 2
    const dist = Math.pow(rand(), 0.8) * size * 0.26
    const x = size / 2 + Math.cos(angle) * dist
    const y = size / 2 + Math.sin(angle) * dist * 0.75
    const r = range(rand, size * 0.1, size * 0.24)
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
    gradient.addColorStop(0, "rgba(255,255,255,0.22)")
    gradient.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

type Cloud = {
  group: THREE.Group
  dark: THREE.SpriteMaterial
  light: THREE.SpriteMaterial
  speed: number
  limit: number
  glow: number // the cloud's own flash, from bolts it throws
}

const CLOUD_DARK = new THREE.Color("#141c3d")
const CLOUD_LIGHT = new THREE.Color("#2b3766")
const CLOUD_FLASH = new THREE.Color("#c4203d")

function createClouds(rand: () => number) {
  const group = new THREE.Group()
  const textures = [createPuffTexture(rand), createPuffTexture(rand), createPuffTexture(rand)]
  const clouds: Cloud[] = []
  const count = 13

  for (let i = 0; i < count; i++) {
    const z = range(rand, -18, -9)
    const hh = halfH(z)
    const limit = hh * MAX_ASPECT * 0.75
    const cloud = new THREE.Group()
    // Spread evenly across the width, then jitter.
    const x = -limit + ((i + rand() * 0.8) / count) * limit * 2
    cloud.position.set(x, hh * range(rand, 0.3, 0.82), z)

    const dark = new THREE.SpriteMaterial({ map: textures[i % 3], color: CLOUD_DARK.clone(), transparent: true, depthWrite: false, opacity: 0.95 })
    const light = new THREE.SpriteMaterial({ map: textures[(i + 1) % 3], color: CLOUD_LIGHT.clone(), transparent: true, depthWrite: false, opacity: 0.8 })

    const width = hh * range(rand, 0.45, 0.95)
    const height = width * range(rand, 0.18, 0.28)
    const puffs = 10 + Math.floor(rand() * 8)
    for (let p = 0; p < puffs; p++) {
      const px = range(rand, -0.5, 0.5) * width
      const edge = 1 - Math.abs(px) / (width / 2)
      const py = range(rand, -0.5, 0.5) * height * (0.4 + edge)
      const isTop = py > 0
      const sprite = new THREE.Sprite(isTop ? light : dark)
      const s = width * range(rand, 0.28, 0.5) * (0.6 + edge * 0.6)
      sprite.scale.set(s * 1.4, s, 1)
      // Lighter puffs sit in front so the tops catch the light.
      sprite.position.set(px, py, isTop ? 0.05 : 0)
      cloud.add(sprite)
    }
    group.add(cloud)
    clouds.push({ group: cloud, dark, light, speed: range(rand, 0.04, 0.12), limit, glow: 0 })
  }
  return { group, clouds, textures }
}

/* -------------------------------------------------------------------------- */
/* Lightning                                                                  */
/* -------------------------------------------------------------------------- */

type V2 = [number, number]

/** A jagged path from a to b, made by repeatedly displacing midpoints. */
function jaggedPath(a: V2, b: V2, rand: () => number, levels: number, roughness: number): V2[] {
  let points: V2[] = [a, b]
  let offset = Math.hypot(b[0] - a[0], b[1] - a[1]) * roughness
  for (let level = 0; level < levels; level++) {
    const next: V2[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i]
      const q = points[i + 1]
      const dx = q[0] - p[0]
      const dy = q[1] - p[1]
      const len = Math.hypot(dx, dy) || 1
      const shift = (rand() * 2 - 1) * offset
      next.push(p, [(p[0] + q[0]) / 2 + (-dy / len) * shift, (p[1] + q[1]) / 2 + (dx / len) * shift])
    }
    next.push(points[points.length - 1])
    points = next
    offset *= 0.52
  }
  return points
}

/** A flat ribbon along the path, tapering toward the end. */
function ribbon(points: V2[], width: number, z: number) {
  const positions: number[] = []
  const sides: number[] = []
  const fades: number[] = []
  const indices: number[] = []
  const n = points.length
  for (let i = 0; i < n; i++) {
    const prev = points[Math.max(0, i - 1)]
    const next = points[Math.min(n - 1, i + 1)]
    const dx = next[0] - prev[0]
    const dy = next[1] - prev[1]
    const len = Math.hypot(dx, dy) || 1
    const t = i / (n - 1)
    const w = (width / 2) * (1 - t * 0.65)
    const nx = (-dy / len) * w
    const ny = (dx / len) * w
    positions.push(points[i][0] + nx, points[i][1] + ny, z, points[i][0] - nx, points[i][1] - ny, z)
    sides.push(1, -1)
    fades.push(1 - t * 0.5, 1 - t * 0.5)
    if (i < n - 1) {
      const k = i * 2
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("aSide", new THREE.Float32BufferAttribute(sides, 1))
  geometry.setAttribute("aFade", new THREE.Float32BufferAttribute(fades, 1))
  geometry.setIndex(indices)
  return geometry
}

function boltMaterial(color: THREE.Color, softness: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: color }, uIntensity: { value: 0 }, uSoft: { value: softness } },
    vertexShader: /* glsl */ `
      attribute float aSide;
      attribute float aFade;
      varying float vSide;
      varying float vFade;
      void main() {
        vSide = aSide;
        vFade = aFade;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity, uSoft;
      varying float vSide;
      varying float vFade;
      void main() {
        float a = pow(1.0 - abs(vSide), uSoft) * vFade * uIntensity;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  })
}

// Brightness over a strike's life: a main stroke, a dim gap, return strokes.
const FLICKER = [1, 0.25, 0.95, 0.15, 0.8, 0.5, 0.25, 0]

type Bolt = {
  group: THREE.Group
  geometries: THREE.BufferGeometry[]
  materials: THREE.ShaderMaterial[]
  strengths: number[]
  age: number
  life: number
  x: number
  dist: number
  cloud: Cloud | null
}

function createBolt(rand: () => number, start: V2, end: V2, z: number, cloud: Cloud | null): Bolt {
  const group = new THREE.Group()
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.ShaderMaterial[] = []
  const strengths: number[] = []
  const scale = halfH(z) / 10

  const addStroke = (path: V2[], width: number, strength: number) => {
    const glowGeometry = ribbon(path, width * 7 * scale, z)
    const coreGeometry = ribbon(path, width * scale, z + 0.01)
    const glow = boltMaterial(new THREE.Color(1.6, 0.04, 0.12), 2.2)
    const core = boltMaterial(new THREE.Color(3.2, 1.6, 1.8), 0.8)
    group.add(new THREE.Mesh(glowGeometry, glow), new THREE.Mesh(coreGeometry, core))
    geometries.push(glowGeometry, coreGeometry)
    materials.push(glow, core)
    strengths.push(strength * 0.75, strength)
  }

  const main = jaggedPath(start, end, rand, 7, 0.16)
  addStroke(main, 0.12, 1)

  // Forks off the upper part of the main stroke.
  const forks = 2 + Math.floor(rand() * 3)
  for (let f = 0; f < forks; f++) {
    const i = Math.floor(range(rand, 0.1, 0.65) * main.length)
    const from = main[i]
    const remaining = Math.hypot(end[0] - from[0], end[1] - from[1])
    const angle = Math.atan2(end[1] - from[1], end[0] - from[0]) + (rand() < 0.5 ? -1 : 1) * range(rand, 0.35, 0.9)
    const length = remaining * range(rand, 0.25, 0.5)
    const to: V2 = [from[0] + Math.cos(angle) * length, from[1] + Math.sin(angle) * length]
    addStroke(jaggedPath(from, to, rand, 5, 0.2), 0.045, 0.6)
  }

  return { group, geometries, materials, strengths, age: 0, life: range(rand, 0.45, 0.75), x: start[0], dist: CAMERA_Z - z, cloud }
}

function boltIntensity(bolt: Bolt) {
  const t = Math.min(bolt.age / bolt.life, 1) * (FLICKER.length - 1)
  const i = Math.floor(t)
  const a = FLICKER[i]
  const b = FLICKER[Math.min(i + 1, FLICKER.length - 1)]
  // Snap between levels like a real flicker, with a short blend.
  const f = Math.min((t - i) * 4, 1)
  return a + (b - a) * f
}

function disposeBolt(bolt: Bolt) {
  bolt.geometries.forEach((g) => g.dispose())
  bolt.materials.forEach((m) => m.dispose())
  bolt.group.removeFromParent()
}

/* -------------------------------------------------------------------------- */
/* Scene                                                                      */
/* -------------------------------------------------------------------------- */

export function createStormScene(container: HTMLElement, options: StormOptions): StormScene | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
  } catch {
    // No WebGL: the CSS gradient behind the canvas stays as the background.
    return null
  }

  const rand = mulberry32(1870) // St. John's was founded in 1870.
  const fx = mulberry32(Date.now() % 100000) // Lightning differs on each visit.

  const pixelRatio = Math.min(window.devicePixelRatio, 1.75)
  renderer.setPixelRatio(pixelRatio)
  renderer.domElement.setAttribute("aria-hidden", "true")
  renderer.domElement.style.display = "block"
  renderer.domElement.style.width = "100%"
  renderer.domElement.style.height = "100%"
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
  camera.position.set(0, 0, CAMERA_Z)

  const sky = createSky()
  const stars = createStars(rand)
  const skyline = createSkyline(rand)
  const clouds = createClouds(rand)
  const moon = createMoon()
  // The Johnny Thunderbird signal is switched off for now. To bring it back,
  // uncomment these lines and the three signal.* calls below.
  // const signal = createSignal(rand)
  // scene.add(signal.group)
  scene.add(sky.mesh, stars.points, moon.mesh, clouds.group, skyline.group)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.4, 0.7)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  stars.material.uniforms.uPixelRatio.value = pixelRatio
  skyline.lightMaterials.forEach((m) => (m.uniforms.uPixelRatio.value = pixelRatio))

  const bolts: Bolt[] = []
  let time = 0
  let nextStrike = 1.2
  let lastFlashX = 0
  let lastFlashDist = 20
  const pointer = { x: 0, y: 0 }

  function visibleClouds() {
    return clouds.clouds.filter((c) => {
      const p = c.group.position.clone().project(camera)
      return Math.abs(p.x) < 0.85 && p.y < 0.95
    })
  }

  function strike(cloud: Cloud, target?: THREE.Vector3) {
    const z = cloud.group.position.z + 0.2
    const hh = halfH(z)
    const start: V2 = [cloud.group.position.x + range(fx, -0.15, 0.15) * hh, cloud.group.position.y - hh * 0.05]
    const end: V2 = target
      ? [target.x, target.y]
      : [start[0] + range(fx, -0.35, 0.35) * hh, -hh * range(fx, 0.4, 0.7)]
    const bolt = createBolt(fx, start, end, z, cloud)
    scene.add(bolt.group)
    bolts.push(bolt)
    cloud.glow = 1
  }

  function randomStrike() {
    const candidates = visibleClouds()
    if (candidates.length === 0) return
    const cloud = candidates[Math.floor(fx() * candidates.length)]
    if (fx() < 0.25) {
      // Sheet lightning: the cloud glows but no bolt comes out.
      cloud.glow = 0.8
      return
    }
    strike(cloud)
  }

  function resize() {
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    composer.setSize(width, height)
    bloom.resolution.set(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    moon.placeLeft(camera.aspect)
    // signal.place(camera.aspect)
  }

  function update(dt: number) {
    time += dt

    // Ease the camera toward the pointer for a little parallax.
    camera.position.x += (pointer.x * 0.5 - camera.position.x) * Math.min(dt * 2, 1)
    camera.position.y += (pointer.y * 0.25 - camera.position.y) * Math.min(dt * 2, 1)

    for (const cloud of clouds.clouds) {
      cloud.group.position.x += cloud.speed * dt
      if (cloud.group.position.x > cloud.limit) cloud.group.position.x = -cloud.limit
      cloud.glow = Math.max(0, cloud.glow - dt * 2.2)
    }

    if (!options.reducedMotion && time > nextStrike) {
      randomStrike()
      nextStrike = time + range(fx, 1.4, 4.2)
    }

    for (let i = bolts.length - 1; i >= 0; i--) {
      const bolt = bolts[i]
      bolt.age += dt
      if (bolt.age >= bolt.life) {
        disposeBolt(bolt)
        bolts.splice(i, 1)
      }
    }
  }

  function applyLighting() {
    // Overall flash: the brightest active bolt, plus any sheet lightning.
    let flash = 0
    for (const bolt of bolts) {
      const intensity = boltIntensity(bolt)
      bolt.materials.forEach((m, i) => (m.uniforms.uIntensity.value = intensity * bolt.strengths[i]))
      if (intensity > flash) {
        flash = intensity
        lastFlashX = bolt.x
        lastFlashDist = bolt.dist
      }
    }
    for (const cloud of clouds.clouds) {
      if (cloud.glow > flash && bolts.length === 0) {
        flash = cloud.glow * 0.6
        lastFlashX = cloud.group.position.x
        lastFlashDist = CAMERA_Z - cloud.group.position.z
      }
    }

    // Where the flash lands at a given distance from the camera.
    const project = (dist: number) => camera.position.x + (lastFlashX - camera.position.x) * (dist / lastFlashDist)

    sky.material.uniforms.uFlash.value = flash
    sky.material.uniforms.uFlashX.value = project(CAMERA_Z - SKY_Z) / sky.width + 0.5

    skyline.materials.forEach((m, i) => {
      m.uniforms.uTime.value = time
      m.uniforms.uFlash.value = flash
      m.uniforms.uFlashX.value = project(CAMERA_Z - LAYERS[i].z)
    })
    skyline.lightMaterials.forEach((m) => (m.uniforms.uTime.value = time))
    stars.material.uniforms.uTime.value = time
    moon.material.uniforms.uTime.value = time
    moon.material.uniforms.uFlash.value = flash
    // signal.update(time)

    // Clouds near the bolt light up red from inside.
    const flashScreenX = (lastFlashX - camera.position.x) / lastFlashDist
    for (const cloud of clouds.clouds) {
      const dist = CAMERA_Z - cloud.group.position.z
      const dx = (cloud.group.position.x - camera.position.x) / dist - flashScreenX
      // Only the cloud that threw the bolt glows hard; neighbors get a little.
      const lit = Math.min(1, cloud.glow * 0.9 + flash * Math.exp(-dx * dx * 12) * 0.35)
      cloud.dark.color.copy(CLOUD_DARK).lerp(CLOUD_FLASH, lit * 0.7).multiplyScalar(1 + lit * 0.5)
      cloud.light.color.copy(CLOUD_LIGHT).lerp(CLOUD_FLASH, lit * 0.55).multiplyScalar(1 + lit * 0.7)
    }
  }

  let frame = 0
  let running = true
  let visible = true
  let last = performance.now()
  let readySent = false

  function render() {
    applyLighting()
    composer.render()
    if (!readySent) {
      readySent = true
      options.onReady?.()
    }
  }

  function loop(now: number) {
    frame = requestAnimationFrame(loop)
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    update(dt)
    render()
  }

  function setRunning() {
    const shouldRun = visible && !document.hidden && !options.reducedMotion
    if (shouldRun && !running) {
      running = true
      last = performance.now()
      frame = requestAnimationFrame(loop)
    } else if (!shouldRun && running) {
      running = false
      cancelAnimationFrame(frame)
    }
  }

  resize()
  const resizeObserver = new ResizeObserver(() => {
    resize()
    if (!running) render()
  })
  resizeObserver.observe(container)

  // Stop drawing when the hero is scrolled away or the tab is hidden.
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    setRunning()
  })
  intersection.observe(container)
  const onVisibility = () => setRunning()
  document.addEventListener("visibilitychange", onVisibility)

  if (options.reducedMotion) {
    // One still frame with a single bolt mid-strike.
    running = false
    const candidates = visibleClouds()
    const cloud = candidates[Math.floor(candidates.length / 2)]
    if (cloud) {
      strike(cloud)
      cloud.glow = 0.6
    }
    render()
  } else {
    // Draw right away, even if the tab starts hidden, then animate.
    render()
    running = false
    setRunning()
  }

  function toNdc(clientX: number, clientY: number) {
    const rect = container.getBoundingClientRect()
    return new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
  }

  return {
    strikeAt(clientX, clientY) {
      if (options.reducedMotion) return
      const ndc = toNdc(clientX, clientY)
      // The cloud closest to the pointer, horizontally, that sits above it.
      let best: Cloud | null = null
      let bestDistance = Infinity
      for (const cloud of clouds.clouds) {
        const p = cloud.group.position.clone().project(camera)
        if (p.y < ndc.y || Math.abs(p.x) > 1.1) continue
        const d = Math.abs(p.x - ndc.x)
        if (d < bestDistance) {
          bestDistance = d
          best = cloud
        }
      }
      if (!best) return
      // Where the pointer ray meets the bolt's plane.
      const z = best.group.position.z + 0.2
      const ray = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(camera).sub(camera.position).normalize()
      const t = (z - camera.position.z) / ray.z
      const target = camera.position.clone().add(ray.multiplyScalar(t))
      strike(best, target)
      nextStrike = time + range(fx, 2, 4)
    },
    setPointer(x, y) {
      if (options.reducedMotion) return
      pointer.x = x
      pointer.y = y
    },
    dispose() {
      cancelAnimationFrame(frame)
      running = false
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      bolts.forEach(disposeBolt)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose()
          const material = object.material as THREE.Material | THREE.Material[]
          ;(Array.isArray(material) ? material : [material]).forEach((m) => m.dispose())
        }
      })
      clouds.clouds.forEach((c) => {
        c.dark.dispose()
        c.light.dispose()
      })
      clouds.textures.forEach((t) => t.dispose())
      // signal.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

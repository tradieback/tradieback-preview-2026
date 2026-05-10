// =====================================================================
// TradieBack — Hero 3D Scene
// Pattern A: Full-screen hero canvas with parallax
// Scene: dark navy torus knot with amber emissive wireframe + star field
// Post: UnrealBloom on amber accents
// Fallback: CSS gradient (already in DOM as .hero-fallback)
// =====================================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Canonical TradieBack brand — repaired 2026-04-09
const NAVY = 0x0f2340;
const NAVY_DEEP = 0x16304f;
const AMBER = 0xf58220;       // canonical orange (constant name kept for backwards compat)
const AMBER_LIGHT = 0xffd9b0;

// ── Bail out gracefully if WebGL or canvas is missing ───────────────
const canvas = document.getElementById('hero-canvas');
if (!canvas || !window.WebGLRenderingContext) {
  console.info('[TradieBack 3D] WebGL unavailable — using CSS fallback.');
  if (canvas) canvas.style.display = 'none';
} else {
  initScene();
}

function initScene() {
  // Skip 3D on very low-end devices
  const lowEnd = (navigator.hardwareConcurrency || 4) < 4;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NAVY);
  scene.fog = new THREE.Fog(NAVY, 8, 28);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 11);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lowEnd,
      alpha: false,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('[TradieBack 3D] Renderer failed, using fallback.', err);
    canvas.style.display = 'none';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowEnd ? 1 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // ── Lighting ───────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(5, 6, 8);
  scene.add(keyLight);

  const amberRim = new THREE.PointLight(AMBER, 2.2, 30);
  amberRim.position.set(-6, -2, 6);
  scene.add(amberRim);

  const amberFill = new THREE.PointLight(AMBER_LIGHT, 0.9, 20);
  amberFill.position.set(4, -4, 4);
  scene.add(amberFill);

  // ── Hero geometry: torus knot ──────────────────────────────────
  const knotGeo = new THREE.TorusKnotGeometry(2.0, 0.55, lowEnd ? 120 : 220, lowEnd ? 18 : 32);

  const knotMat = new THREE.MeshPhysicalMaterial({
    color: NAVY_DEEP,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.15,
    reflectivity: 0.6
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  scene.add(knot);

  // Amber wireframe overlay (the hero of the scene)
  const wireGeo = new THREE.TorusKnotGeometry(2.02, 0.555, lowEnd ? 80 : 140, lowEnd ? 12 : 20);
  const wireMat = new THREE.MeshBasicMaterial({
    color: AMBER,
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wire);

  // ── Sparse star field ──────────────────────────────────────────
  const starCount = lowEnd ? 220 : 520;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const colA = new THREE.Color(0xffffff);
  const colB = new THREE.Color(AMBER);
  for (let i = 0; i < starCount; i++) {
    const r = 14 + Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi) - 6;
    const c = Math.random() > 0.85 ? colB : colA;
    starColors[i * 3 + 0] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ── Post-processing: bloom ─────────────────────────────────────
  let composer = null;
  if (!lowEnd) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.85, // strength
      0.6,  // radius
      0.2   // threshold
    );
    composer.addPass(bloom);
  }

  // ── Interaction state ──────────────────────────────────────────
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = 0;

  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  // ── Resize ─────────────────────────────────────────────────────
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // ── Animation loop ─────────────────────────────────────────────
  let visible = true;
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
  });

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;

    const t = clock.getElapsedTime();

    // Smooth mouse easing
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    // Rotate knot + wire (wire slightly faster for shimmer)
    knot.rotation.y = t * 0.18 + mouse.x * 0.4;
    knot.rotation.x = t * 0.10 + mouse.y * 0.25;
    wire.rotation.y = knot.rotation.y * 1.04;
    wire.rotation.x = knot.rotation.x * 1.04;

    // Subtle wire pulse
    wireMat.opacity = 0.45 + Math.sin(t * 1.6) * 0.12;

    // Stars slow drift
    stars.rotation.y = t * 0.015;
    stars.rotation.x = t * 0.008;

    // Scroll-driven camera dolly + parallax
    const scrollProgress = Math.min(scrollY / window.innerHeight, 1);
    camera.position.z = 11 + scrollProgress * 4;
    camera.position.y = -scrollProgress * 1.8 + mouse.y * 0.4;
    camera.position.x = mouse.x * 0.6;
    camera.lookAt(0, 0, 0);

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  tick();

  console.info('[TradieBack 3D] Scene initialised', { lowEnd, bloom: !!composer });
}

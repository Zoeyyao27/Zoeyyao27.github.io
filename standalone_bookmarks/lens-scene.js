const gateway = document.getElementById('gateway');
const hero = document.querySelector('.dream-hero');
const enter = document.getElementById('enter');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const saveData = navigator.connection?.saveData;
const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
const image = gateway.querySelector('.art-mono');

if (image && !motionPreference.matches && !saveData && !lowMemory) {
  Promise.all([
    import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'),
    image.decode()
  ]).then(([THREE]) => startLens(THREE)).catch(() => {});
}

function startLens(THREE) {
  const stage = document.createElement('div');
  stage.className = 'lens-stage';
  stage.setAttribute('aria-hidden', 'true');
  gateway.querySelector('.lens-host').append(stage);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (_) {
    stage.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  stage.append(renderer.domElement);

  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const uniforms = {
    colorImage: { value: texture },
    imageSize: { value: new THREE.Vector2(image.naturalWidth, image.naturalHeight) },
    resolution: { value: new THREE.Vector2(1, 1) },
    pointer: { value: new THREE.Vector2() },
    squareSize: { value: 260 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }`,
    fragmentShader: `precision highp float;
      uniform sampler2D colorImage;
      uniform vec2 imageSize;
      uniform vec2 resolution;
      uniform vec2 pointer;
      uniform float squareSize;
      varying vec2 vUv;

      vec2 coverUv(vec2 uv) {
        float viewportAspect = resolution.x / resolution.y;
        float imageAspect = imageSize.x / imageSize.y;
        vec2 ratio = viewportAspect > imageAspect
          ? vec2(1.0, imageAspect / viewportAspect)
          : vec2(viewportAspect / imageAspect, 1.0);
        return (uv - 0.5) * ratio + 0.5;
      }

      void main() {
        vec2 localPx = vUv * resolution - pointer;
        float halfSize = squareSize * 0.5;
        float edge = max(abs(localPx.x), abs(localPx.y));
        float mask = 1.0 - smoothstep(halfSize - 1.0, halfSize + 1.0, edge);
        if (mask <= 0.0) discard;

        vec2 local = localPx / halfSize;
        float radius = dot(local, local);
        vec2 lensUv = coverUv(vUv - local * radius * 0.008);
        vec2 shift = local * radius * 0.0025;
        float red = texture2D(colorImage, lensUv + shift).r;
        float green = texture2D(colorImage, lensUv).g;
        float blue = texture2D(colorImage, lensUv - shift).b;
        gl_FragColor = vec4(red, green, blue, mask);
      }`,
    transparent: true,
    depthWrite: false
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const camera = new THREE.Camera();
  const current = new THREE.Vector2();
  const target = new THREE.Vector2();
  let frame = 0;
  let active = true;
  let inView = true;

  function draw() {
    frame = 0;
    if (!active || !inView || document.hidden) return;
    current.lerp(target, .16);
    uniforms.pointer.value.copy(current);
    renderer.render(scene, camera);
    if (current.distanceToSquared(target) > .2) frame = requestAnimationFrame(draw);
  }

  function schedule() {
    if (!frame && active && inView) frame = requestAnimationFrame(draw);
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    uniforms.resolution.value.set(rect.width, rect.height);
    uniforms.squareSize.value = Math.min(Math.max(rect.width * .28, 180), 330, rect.height * .48);
    if (!target.lengthSq() || target.x > rect.width || target.y > rect.height) {
      target.set(rect.width * .58, rect.height * .55);
      current.copy(target);
    }
    schedule();
  }

  function move(event) {
    const rect = stage.getBoundingClientRect();
    target.set(
      Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      Math.max(0, Math.min(rect.height, rect.bottom - event.clientY))
    );
    schedule();
  }

  function motionChanged() {
    active = !motionPreference.matches;
    stage.hidden = !active;
    document.body.classList.toggle('has-lens', active);
    if (!active) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    else schedule();
  }

  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    active = false;
    cancelAnimationFrame(frame);
    frame = 0;
    stage.hidden = true;
    document.body.classList.remove('has-lens');
  });
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motionPreference.addEventListener('change', motionChanged);
  const visibleSections = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleSections.add(entry.target);
      else visibleSections.delete(entry.target);
    }
    inView = visibleSections.size > 0;
    if (inView) schedule();
  });
  observer.observe(gateway);
  observer.observe(hero);
  enter.addEventListener('click', () => {
    hero.querySelector('.lens-host').append(stage);
    resize();
  });
  resize();
  document.body.classList.add('has-lens');
}

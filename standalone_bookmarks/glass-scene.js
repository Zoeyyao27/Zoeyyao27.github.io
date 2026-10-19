const theme = document.body.dataset.theme;
const gateway = document.getElementById('gateway');
const hero = document.querySelector('.dream-hero');
const enter = document.getElementById('enter');
const audio = document.getElementById('audio');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = navigator.connection?.saveData;
const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
const palettes = {
  anxiety: ['#35bda8', '#8b79db', '#b9f7df'],
  loneliness: ['#6287d9', '#d878b5', '#d4e3ff'],
  'low-mood': ['#ae609a', '#e5ae52', '#f9cddd'],
  overload: ['#ee8668', '#6ac5b3', '#ffdcad']
};

if (!motionPreference.matches && !saveData && !lowMemory && palettes[theme]) {
  try {
    const probe = document.createElement('canvas');
    const context = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (context) {
      context.getExtension('WEBGL_lose_context')?.loseContext();
      import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js')
        .then((THREE) => { if (!motionPreference.matches) startScene(THREE); })
        .catch(() => {});
    }
  } catch (_) {
  }
}

function startScene(THREE) {
  const colors = palettes[theme];
  const stage = document.createElement('div');
  stage.className = 'glass-stage';
  stage.setAttribute('aria-hidden', 'true');
  gateway.append(stage);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (_) {
    stage.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  camera.position.z = 9;
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const key = new THREE.PointLight(0xffffff, 65);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const fill = new THREE.PointLight(colors[1], 62);
  fill.position.set(3, -2, 4);
  scene.add(fill);

  const composition = new THREE.Group();
  scene.add(composition);
  const background = new THREE.Group();
  composition.add(background);
  const glass = new THREE.Group();
  composition.add(glass);

  const discGeometry = new THREE.SphereGeometry(1, 28, 20);
  [[-1.45, .75, -2, 1.5, colors[0]], [1.2, -.65, -1.8, 1.2, colors[1]], [.15, 1.3, -2.3, .95, colors[2]]].forEach(([x, y, z, size, color]) => {
    const disc = new THREE.Mesh(discGeometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .68, depthWrite: false }));
    disc.position.set(x, y, z);
    disc.scale.set(size, size * .68, .09);
    background.add(disc);
  });

  const material = new THREE.MeshPhysicalMaterial({
    color: colors[0],
    metalness: 0,
    roughness: .075,
    transmission: .82,
    thickness: 1.15,
    ior: 1.37,
    attenuationColor: new THREE.Color(colors[1]),
    attenuationDistance: 1.8,
    clearcoat: 1,
    clearcoatRoughness: .04,
    side: THREE.DoubleSide
  });
  const edge = new THREE.ShaderMaterial({
    uniforms: {
      colorA: { value: new THREE.Color(colors[0]) },
      colorB: { value: new THREE.Color(colors[1]) }
    },
    vertexShader: `varying vec3 vNormal; varying vec3 vView;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }`,
    fragmentShader: `uniform vec3 colorA; uniform vec3 colorB;
      varying vec3 vNormal; varying vec3 vView;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
        vec3 tint = mix(colorA, colorB, clamp(vNormal.y * 0.5 + 0.5, 0.0, 1.0));
        gl_FragColor = vec4(tint, 0.13 + rim * 0.58);
      }`,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    depthTest: false
  });
  const pieces = [];
  const addGlass = (geometry, position, rotation, scale) => {
    const shape = new THREE.Mesh(geometry, material);
    shape.position.set(...position);
    shape.rotation.set(...rotation);
    shape.scale.set(...scale);
    glass.add(shape);
    const glint = new THREE.Mesh(geometry, edge);
    glint.position.copy(shape.position);
    glint.rotation.copy(shape.rotation);
    glint.scale.copy(shape.scale).multiplyScalar(1.015);
    glint.renderOrder = 10;
    glass.add(glint);
    pieces.push({ shape, glint, rotation: [...rotation], position: [...position] });
  };

  if (theme === 'anxiety') {
    addGlass(new THREE.TorusKnotGeometry(1.05, .29, 150, 12, 2, 3), [0, 0, 0], [.32, .08, -.38], [1, 1, .63]);
  } else if (theme === 'loneliness') {
    const petal = new THREE.SphereGeometry(1, 48, 32);
    addGlass(petal, [-.78, 0, 0], [0, 0, -.38], [.56, 1.38, .3]);
    addGlass(petal, [.78, 0, .12], [0, 0, .38], [.56, 1.38, .3]);
  } else if (theme === 'low-mood') {
    addGlass(new THREE.TorusGeometry(1.25, .34, 22, 96, Math.PI * 1.45), [0, -.12, 0], [.15, 0, -.4], [1.12, 1, .8]);
    addGlass(new THREE.SphereGeometry(.42, 40, 26), [.12, -.38, .3], [0, 0, 0], [1, 1, 1]);
  } else {
    const sliver = new THREE.SphereGeometry(1, 40, 24);
    [[-.9, .55, .55], [.76, .66, -.53], [-.58, -.69, -.36], [.88, -.62, .42]].forEach(([x, y, angle], index) => {
      addGlass(sliver, [x, y, index * .13], [0, 0, angle], [.38, 1.04, .25]);
    });
  }

  let frame = 0;
  let playing = false;
  let pointerX = 0;
  let pointerY = 0;
  let elapsed = 0;
  let lastTime = 0;
  let visible = true;
  const resize = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const compact = width < 700;
    composition.position.set(compact ? 0 : 1.45, compact ? 1.22 : .2, 0);
    composition.scale.setScalar(compact ? .83 : 1.14);
  };
  const tick = (time) => {
    if (!visible) return;
    const delta = Math.min((time - (lastTime || time)) / 1000, .05);
    lastTime = time;
    elapsed += delta;
    const progress = Math.min(elapsed / 35, 1);
    glass.rotation.y += delta * (playing ? .085 : .035);
    glass.rotation.x += ((pointerY * .1) - glass.rotation.x) * .025;
    glass.rotation.z += ((pointerX * .09) - glass.rotation.z) * .025;
    glass.scale.setScalar(1 + Math.sin(elapsed * .6) * .018);
    if (theme === 'loneliness') {
      pieces.forEach(({ shape, glint, position }, index) => {
        const direction = index ? 1 : -1;
        shape.position.x = position[0] - direction * progress * .2;
        glint.position.copy(shape.position);
      });
    }
    if (theme === 'overload') {
      pieces.forEach(({ shape, glint, rotation }, index) => {
        shape.rotation.z = rotation[2] * (1 - progress * .43) + Math.sin(elapsed * .45 + index) * .015;
        glint.rotation.copy(shape.rotation);
      });
    }
    background.rotation.z = Math.sin(elapsed * .12) * .035;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  const stop = () => { visible = false; cancelAnimationFrame(frame); };
  const resume = () => { if (!visible && !motionPreference.matches) { visible = true; lastTime = 0; frame = requestAnimationFrame(tick); } };
  const onPointer = (event) => {
    pointerX = (event.clientX / window.innerWidth - .5) * 2;
    pointerY = (.5 - event.clientY / window.innerHeight) * 2;
  };
  const onEnter = () => { hero.append(stage); resize(); };
  const onVisibility = () => document.hidden ? stop() : resume();
  const onMotion = () => {
    if (motionPreference.matches) { stop(); stage.hidden = true; }
    else { stage.hidden = false; resume(); }
  };
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stop();
    stage.hidden = true;
  });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  motionPreference.addEventListener('change', onMotion);
  enter.addEventListener('click', onEnter);
  audio.addEventListener('playing', () => { playing = true; });
  audio.addEventListener('pause', () => { playing = false; });
  resize();
  stage.classList.add('is-ready');
  frame = requestAnimationFrame(tick);
}

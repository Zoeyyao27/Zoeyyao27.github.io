const svgNamespace = 'http://www.w3.org/2000/svg';
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const theme = document.body.dataset.theme;
const shapes = {
  anxiety: [1.01, .94, 1.04, .95, 1.02, .91, 1.05, .96, 1.03, .93],
  loneliness: [.93, 1.04, .95, 1.06, .92, 1.02, .96, 1.07, .94, 1.01],
  'low-mood': [1.05, .97, .92, 1.04, .96, 1.08, .91, 1.02, .95, 1.04],
  overload: [1.04, .91, 1.08, .94, 1.03, .93, 1.06, .92, 1.07, .96]
};
const baseRadii = shapes[theme] || shapes.anxiety;

function svgElement(name, attributes) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function shapePath(radii, scale = 1) {
  const points = radii.map((radius, index) => {
    const angle = index * Math.PI * 2 / radii.length - Math.PI / 2;
    return {
      x: 300 + Math.cos(angle) * 220 * radius * scale,
      y: 300 + Math.sin(angle) * 220 * radius * scale
    };
  });
  const commands = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
  for (let index = 0; index < points.length; index++) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const after = points[(index + 2) % points.length];
    const first = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6
    };
    const second = {
      x: next.x - (after.x - current.x) / 6,
      y: next.y - (after.y - current.y) / 6
    };
    commands.push(`C ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${second.x.toFixed(2)} ${second.y.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`);
  }
  return `${commands.join(' ')} Z`;
}

function createScene(field, index) {
  const fallback = field.querySelector('.organic-fallback');
  const host = field.querySelector('.organic-scene');
  if (!fallback || !host || !fallback.naturalWidth) return;

  const clipId = `organic-clip-${theme}-${index}`;
  const svg = svgElement('svg', { viewBox: '0 0 600 600', role: 'presentation', focusable: 'false' });
  const definitions = svgElement('defs', {});
  const clip = svgElement('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' });
  const clipPath = svgElement('path', { d: shapePath(baseRadii) });
  clip.append(clipPath);
  definitions.append(clip);

  const halo = svgElement('path', { class: 'organic-halo', d: shapePath(baseRadii, 1.13) });
  const image = svgElement('image', {
    href: fallback.getAttribute('src'),
    x: '0', y: '0', width: '600', height: '600',
    preserveAspectRatio: 'xMidYMid slice',
    'clip-path': `url(#${clipId})`
  });
  svg.append(definitions, halo, image);
  host.append(svg);
  field.classList.add('organic-ready');

  let progress = 0;
  let target = 0;
  let frame = 0;

  function draw() {
    frame = 0;
    progress += (target - progress) * .11;
    const radii = baseRadii.map((radius, point) => radius + Math.sin(point * 2.4 + index) * .13 * progress);
    clipPath.setAttribute('d', shapePath(radii));
    halo.setAttribute('d', shapePath(radii, 1.13));
    if (Math.abs(target - progress) > .003) frame = requestAnimationFrame(draw);
  }

  function setActive(active) {
    target = active ? 1 : 0;
    if (!frame) frame = requestAnimationFrame(draw);
  }

  field.addEventListener('pointerenter', () => setActive(true));
  field.addEventListener('pointerleave', () => setActive(false));
  field.addEventListener('pointerdown', () => setActive(true));
  field.addEventListener('pointerup', () => setActive(false));
  field.addEventListener('pointercancel', () => setActive(false));
  field.parentElement.addEventListener('focusin', () => setActive(true));
  field.parentElement.addEventListener('focusout', () => setActive(false));
}

if (!motionPreference.matches && !navigator.connection?.saveData) {
  document.querySelectorAll('.art-field').forEach((field, index) => {
    const image = field.querySelector('.organic-fallback');
    if (image.complete) createScene(field, index);
    else image.addEventListener('load', () => createScene(field, index), { once: true });
  });
}

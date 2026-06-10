const canvas = document.getElementById('c');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 10, 26);
camera.lookAt(0, 0, 0);


scene.add(new THREE.AmbientLight(0x200030, 0.5));
const sun = new THREE.DirectionalLight(0xcc88ff, 2.2);
sun.position.set(12, 8, 10);
scene.add(sun);
const rimLight = new THREE.DirectionalLight(0x6600cc, 0.8);
rimLight.position.set(-10, -4, -8);
scene.add(rimLight);
const fillLight = new THREE.PointLight(0x9933ff, 1.2, 60);
fillLight.position.set(-8, 5, 5);
scene.add(fillLight);

function makePlanetTexture() {
    const size = 1024, c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, size);
    bg.addColorStop(0, '#1a0030');
    bg.addColorStop(0.15, '#2d0050');
    bg.addColorStop(0.3, '#4a1080');
    bg.addColorStop(0.45, '#6b2aaa');
    bg.addColorStop(0.55, '#7b35c0');
    bg.addColorStop(0.7, '#4a1080');
    bg.addColorStop(0.85, '#2d0050');
    bg.addColorStop(1, '#1a0030');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);
    [{ y: 0.08, h: 0.05, col: 'rgba(160,80,255,0.35)' }, { y: 0.18, h: 0.04, col: 'rgba(80,0,180,0.4)' },
    { y: 0.28, h: 0.07, col: 'rgba(200,120,255,0.25)' }, { y: 0.38, h: 0.03, col: 'rgba(120,40,220,0.5)' },
    { y: 0.46, h: 0.08, col: 'rgba(180,60,255,0.3)' }, { y: 0.58, h: 0.05, col: 'rgba(90,10,200,0.45)' },
    { y: 0.67, h: 0.06, col: 'rgba(160,80,255,0.3)' }, { y: 0.76, h: 0.04, col: 'rgba(80,0,180,0.4)' },
    { y: 0.85, h: 0.05, col: 'rgba(200,100,255,0.2)' }].forEach(b => {
        ctx.fillStyle = b.col; ctx.fillRect(0, b.y * size, size, b.h * size);
    });
    for (let i = 0; i < 3200; i++) {
        const x = Math.random() * size, y = Math.random() * size, r = Math.random() * 3 + 0.5, a = Math.random() * 0.12;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 200 : 80},${Math.random() * 60},${150 + Math.random() * 100},${a})`;
        ctx.fill();
    }
    return new THREE.CanvasTexture(c);
}

// Planet
const planet = new THREE.Mesh(
    new THREE.SphereGeometry(4, 64, 64),
    new THREE.MeshPhongMaterial({ map: makePlanetTexture(), shininess: 35, specular: new THREE.Color(0x8833cc) })
);
scene.add(planet);
scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(4.25, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x6600cc, transparent: true, opacity: 0.13, side: THREE.FrontSide, depthWrite: false })
));

const ringMessages = [
    "te amo", "❤", "você é meu universo", "♡",
    "para sempre", "❤", "meu amor", "♡",
    "amor infinito", "❤", "minha vida", "♡",
    "te escolho todo dia", "❤", "você me completa", "♡",
    "sempre ao seu lado", "❤", "só você", "♡",
];

function makeWordSprite(text) {
    const isSymbol = text === '❤' || text === '♡';
    const cw = isSymbol ? 80 : 340, ch = 64;
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    const fs = isSymbol ? 44 : 28;
    ctx.font = `bold ${fs}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = isSymbol ? 'rgba(255,100,200,1)' : 'rgba(220,120,255,1)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = isSymbol ? 'rgba(255,160,230,1)' : 'rgba(255,225,255,1)';
    ctx.fillText(text, cw / 2, ch / 2);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    const aspect = cw / ch;
    const scale = isSymbol ? 0.9 : 1.8;
    sprite.scale.set(scale * aspect * 0.55, scale * 0.55, 1);
    return sprite;
}


const ringConfigs = [
    { radius: 5.8, tiltX: Math.PI * 0.42, tiltZ: 0, speed: 0.0014, msgs: ringMessages },
    { radius: 7.4, tiltX: Math.PI * 0.42, tiltZ: 0, speed: -0.0009, msgs: [...ringMessages].reverse() },
    { radius: 9.0, tiltX: Math.PI * 0.42, tiltZ: 0, speed: 0.0006, msgs: ringMessages },
];

const ringGroups = ringConfigs.map(cfg => {
    const group = new THREE.Group();
    //group.rotation.x = cfg.tiltX;
    group.rotation.z = cfg.tiltZ;

    const n = cfg.msgs.length;
    const sprites = cfg.msgs.map((msg, i) => {
        const sprite = makeWordSprite(msg);
        sprite.userData.baseAngle = (i / n) * Math.PI * 2;
        group.add(sprite);
        return sprite;
    });

    group.userData = { sprites, cfg, angle: 0 };
    scene.add(group);
    return group;
});

function updateRingPositions() {
    ringGroups.forEach(group => {
        const { sprites, cfg } = group.userData;
        group.userData.angle += cfg.speed;
        sprites.forEach(sprite => {
            const a = sprite.userData.baseAngle + group.userData.angle;
            sprite.position.set(Math.cos(a) * cfg.radius, 0, Math.sin(a) * cfg.radius);
            const depth = Math.sin(a); // -1, +1 
            sprite.material.opacity = 0.18 + ((depth + 1) / 2) * 0.82;
            const pulse = 1 + 0.07 * Math.sin(Date.now() * 0.002 + sprite.userData.baseAngle * 3);
            sprite.scale.multiplyScalar(pulse / sprite.userData.lastPulse || 1);
            sprite.userData.lastPulse = pulse;
        });
    });
}

const starGeo = new THREE.BufferGeometry();
const sp = new Float32Array(3000 * 3), sc = new Float32Array(3000 * 3);
for (let i = 0; i < 3000; i++) {
    const r = 200 + Math.random() * 800, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    sp[i * 3] = r * Math.sin(ph) * Math.cos(th); sp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); sp[i * 3 + 2] = r * Math.cos(ph);
    const w = Math.random() > 0.7;
    sc[i * 3] = w ? 0.95 : 0.75; sc[i * 3 + 1] = w ? 0.85 : 0.75; sc[i * 3 + 2] = w ? 1 : 0.9;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, opacity: 0.9 })));

const nebGeo = new THREE.BufferGeometry();
const np = new Float32Array(600 * 3);
for (let i = 0; i < 600; i++) { np[i * 3] = (Math.random() - .5) * 120; np[i * 3 + 1] = (Math.random() - .5) * 80; np[i * 3 + 2] = (Math.random() - .5) * 80 - 40; }
nebGeo.setAttribute('position', new THREE.BufferAttribute(np, 3));
scene.add(new THREE.Points(nebGeo, new THREE.PointsMaterial({ color: 0x9933ff, size: 1.2, transparent: true, opacity: 0.18, depthWrite: false })));

const shootGroup = new THREE.Group(); scene.add(shootGroup);
const shootPool = [];
function spawnShoot() {
    const geo = new THREE.BufferGeometry(), pts = new Float32Array(6);
    pts[0] = (Math.random() - .5) * 80; pts[1] = 20 + Math.random() * 30; pts[2] = -20 + Math.random() * 10;
    pts[3] = pts[0]; pts[4] = pts[1]; pts[5] = pts[2];
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xddaaff, transparent: true, opacity: 0.9 }));
    shootGroup.add(line);
    shootPool.push({ line, vel: new THREE.Vector3((Math.random() - .5) * .4, -.3 - Math.random() * .3, -.1), life: 1 });
}
setInterval(spawnShoot, 2000);

const hearts = [];
for (let i = 0; i < 10; i++) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.font = '44px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,100,200,.9)'; ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(255,160,230,.9)'; ctx.fillText('❤', 32, 32);
    const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: .7, depthWrite: false });
    const s = new THREE.Sprite(mat); const sc2 = .5 + Math.random() * .6; s.scale.set(sc2, sc2, 1);
    s.position.set((Math.random() - .5) * 30, (Math.random() - .5) * 18, (Math.random() - .5) * 16 - 5);
    s.userData = { baseY: s.position.y, speed: .3 + Math.random() * .4, phase: Math.random() * Math.PI * 2, drift: (Math.random() - .5) * .008 };
    scene.add(s); hearts.push(s);
}

const mouse = { x: 0, y: 0, down: false, lastX: 0, lastY: 0 };
const spherical = { theta: 0, phi: Math.PI / 3.5 };
const targetSpherical = { theta: 0, phi: Math.PI / 3.5 };
const CAMERA_DIST = 26;

window.addEventListener('mousemove', e => {
    if (mouse.down) {
        const dx = e.clientX - mouse.lastX;
        const dy = e.clientY - mouse.lastY;
        targetSpherical.theta -= dx * 0.008;
        targetSpherical.phi = Math.max(0.2, Math.min(Math.PI * 0.55, targetSpherical.phi + dy * 0.006));
    }
    mouse.lastX = e.clientX; mouse.lastY = e.clientY;
});
window.addEventListener('mousedown', e => { mouse.down = true; });
window.addEventListener('mouseup', e => { mouse.down = false; });
window.addEventListener('touchstart', e => { mouse.down = true; mouse.lastX = e.touches[0].clientX; mouse.lastY = e.touches[0].clientY; });
window.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - mouse.lastX;
    const dy = e.touches[0].clientY - mouse.lastY;
    targetSpherical.theta -= dx * 0.008;
    targetSpherical.phi = Math.max(0.2, Math.min(Math.PI * 0.55, targetSpherical.phi + dy * 0.006));
    mouse.lastX = e.touches[0].clientX; mouse.lastY = e.touches[0].clientY;
});
window.addEventListener('touchend', e => { mouse.down = false; });
window.addEventListener('wheel', e => {
}, { passive: true });

let t = 0;
let autoRotate = true;

function animate() {
    requestAnimationFrame(animate);
    t += 0.005;

    if (!mouse.down) targetSpherical.theta += 0.0018;

    spherical.theta += (targetSpherical.theta - spherical.theta) * 0.06;
    spherical.phi += (targetSpherical.phi - spherical.phi) * 0.06;

    camera.position.x = CAMERA_DIST * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.position.y = CAMERA_DIST * Math.cos(spherical.phi);
    camera.position.z = CAMERA_DIST * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.lookAt(0, 0, 0);

    planet.rotation.y += 0.0018;
    planet.position.y = Math.sin(t * 0.4) * 0.12;

    updateRingPositions();

    hearts.forEach(h => {
        h.position.y = h.userData.baseY + Math.sin(t * h.userData.speed + h.userData.phase) * 1.2;
        h.position.x += h.userData.drift;
        if (Math.abs(h.position.x) > 18) h.userData.drift *= -1;
        h.material.opacity = 0.25 + .45 * Math.sin(t * h.userData.speed * .8 + h.userData.phase);
    });

    for (let i = shootPool.length - 1; i >= 0; i--) {
        const s = shootPool[i]; s.life -= .018;
        const pos = s.line.geometry.attributes.position;
        pos.array[0] += s.vel.x * .8; pos.array[1] += s.vel.y * .8; pos.array[2] += s.vel.z * .8;
        pos.array[3] += s.vel.x * 1.6; pos.array[4] += s.vel.y * 1.6; pos.array[5] += s.vel.z * 1.6;
        pos.needsUpdate = true; s.line.material.opacity = s.life * .9;
        if (s.life <= 0) { shootGroup.remove(s.line); shootPool.splice(i, 1); }
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
});
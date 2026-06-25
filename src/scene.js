import * as THREE from 'three';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.006);

    // Camera
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 1.6, 8);
    this.camera.rotation.order = 'YXZ';

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Lights
    this.setupLights();

    // Particles
    this.particles = this.createEtherParticles();

    // Resize
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  setupLights() {
    // Ambient light - warm
    const ambient = new THREE.AmbientLight(0x443566, 0.4);
    this.scene.add(ambient);

    // Main directional light (moonlight / ethereal)
    const mainLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    mainLight.position.set(10, 20, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    this.scene.add(mainLight);

    // Fill light - cool blue from below
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, -10, -5);
    this.scene.add(fillLight);

    // Warm accent light (golden)
    const accentLight = new THREE.PointLight(0xffd700, 0.5, 30);
    accentLight.position.set(-3, 4, 2);
    this.scene.add(accentLight);

    // Hemisphere light for natural feel
    const hemiLight = new THREE.HemisphereLight(0x8877aa, 0x443344, 0.6);
    this.scene.add(hemiLight);

    // Central glow
    const centerGlow = new THREE.PointLight(0xbbaaff, 0.8, 25);
    centerGlow.position.set(0, 3, 0);
    this.scene.add(centerGlow);
  }

  createEtherParticles() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const colorPalette = [
      new THREE.Color(0xbbaaff),
      new THREE.Color(0xffd700),
      new THREE.Color(0x88ccff),
      new THREE.Color(0xff99aa),
      new THREE.Color(0xaaeecc)
    ];

    for (let i = 0; i < count; i++) {
      // Spherical distribution within the room
      const radius = 5 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.6 + 2;
      positions[i * 3 + 2] = Math.cos(phi) * radius;

      sizes[i] = 0.02 + Math.random() * 0.06;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    return particles;
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  update(time, delta) {
    // Animate particles
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      // Gentle floating motion
      positions[i * 3 + 1] += Math.sin(time * 0.0003 + i * 0.01) * 0.0003;
      positions[i * 3] += Math.cos(time * 0.0002 + i * 0.015) * 0.0002;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    // Gentle rotation
    this.particles.rotation.y += delta * 0.005;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

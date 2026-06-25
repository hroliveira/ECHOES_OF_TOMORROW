import * as THREE from 'three';

export class EffectsManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Echo ghost
    this.ghostGroup = new THREE.Group();
    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);
    this.createGhostVisual();

    // Ghost trail
    this.trailPositions = [];
    this.maxTrailLength = 20;

    // White noise canvas overlay
    this.noiseCanvas = document.getElementById('noise-overlay');
    this.noiseCtx = this.noiseCanvas?.getContext('2d');
    this.setupNoiseCanvas();

    // Screen effects
    this.vignetteIntensity = 0.3;
    this.noiseIntensity = 0;
    this.targetNoiseIntensity = 0;

    // Post-processing state
    this.echoActive = false;

    // Ghost pulse animation
    this.ghostPulse = 0;
  }

  createGhostVisual() {
    // Main ghost form - an ethereal sphere with glow
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x00ddff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.5,
      side: THREE.DoubleSide
    });

    this.ghostSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      ghostMat
    );
    this.ghostGroup.add(this.ghostSphere);

    // Outer glow ring
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00ddff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.ghostRing = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.6, 24),
      glowMat
    );
    this.ghostRing.rotation.x = Math.PI / 2;
    this.ghostGroup.add(this.ghostRing);

    // Inner glow ring
    this.ghostRing2 = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.25, 24),
      glowMat.clone()
    );
    this.ghostRing2.material.opacity = 0.2;
    this.ghostRing2.rotation.x = Math.PI / 2;
    this.ghostRing2.position.y = 0.3;
    this.ghostGroup.add(this.ghostRing2);

    // Point light for glow effect
    this.ghostLight = new THREE.PointLight(0x00aaff, 0.5, 4);
    this.ghostGroup.add(this.ghostLight);

    // Trail particles
    const trailCount = 20;
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(trailCount * 3);
    const trailSizes = new Float32Array(trailCount);
    const trailOpacities = new Float32Array(trailCount);

    for (let i = 0; i < trailCount; i++) {
      trailPos[i * 3] = 0;
      trailPos[i * 3 + 1] = 0;
      trailPos[i * 3 + 2] = 0;
      trailSizes[i] = (1 - i / trailCount) * 0.1;
      trailOpacities[i] = (1 - i / trailCount) * 0.3;
    }

    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));

    const trailMat = new THREE.PointsMaterial({
      color: 0x00ddff,
      size: 0.08,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.trailPoints = new THREE.Points(trailGeo, trailMat);
    this.ghostGroup.add(this.trailPoints);

    // Second trail orbit
    this.orbitParticles = new THREE.BufferGeometry();
    const orbitCount = 12;
    const orbitPos = new Float32Array(orbitCount * 3);
    for (let i = 0; i < orbitCount; i++) {
      const angle = (i / orbitCount) * Math.PI * 2;
      orbitPos[i * 3] = Math.cos(angle) * 0.4;
      orbitPos[i * 3 + 1] = Math.sin(angle) * 0.1;
      orbitPos[i * 3 + 2] = Math.sin(angle) * 0.2;
    }
    this.orbitParticles.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));

    const orbitMat = new THREE.PointsMaterial({
      color: 0x88ddff,
      size: 0.02,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.orbitMesh = new THREE.Points(this.orbitParticles, orbitMat);
    this.ghostGroup.add(this.orbitMesh);
  }

  setupNoiseCanvas() {
    if (!this.noiseCanvas || !this.noiseCtx) return;

    const resizeNoise = () => {
      this.noiseCanvas.width = window.innerWidth;
      this.noiseCanvas.height = window.innerHeight;
    };
    resizeNoise();
    window.addEventListener('resize', resizeNoise);
  }

  // Update ghost position and visuals from player recording
  updateGhost(pastState, time, delta) {
    if (!pastState) {
      this.ghostGroup.visible = false;
      return;
    }

    this.ghostGroup.visible = true;

    // Position
    this.ghostGroup.position.copy(pastState.position);
    this.ghostGroup.position.y += 0.15;

    // Rotation - face direction of movement
    this.ghostGroup.quaternion.copy(pastState.quaternion);

    // Pulse animation
    this.ghostPulse += delta * 2;
    const pulse = Math.sin(this.ghostPulse) * 0.3 + 0.7;

    // Opacity breathing
    this.ghostSphere.material.opacity = 0.15 + pulse * 0.15;
    this.ghostRing.material.opacity = 0.05 + pulse * 0.1;
    this.ghostRing2.material.opacity = 0.1 + pulse * 0.15;
    this.trailPoints.material.opacity = 0.15 + pulse * 0.2;

    // Ring rotation
    this.ghostRing.rotation.z = time * 0.0005;
    this.ghostRing2.rotation.z = -time * 0.0007;

    // Orbit rotation
    this.orbitMesh.rotation.y = time * 0.001;
    this.orbitMesh.rotation.x = Math.sin(time * 0.0005) * 0.2;

    // Light intensity
    this.ghostLight.intensity = 0.3 + pulse * 0.4;
  }

  // Update trail positions from recording buffer
  updateTrail(pastStates, time) {
    if (!pastStates || pastStates.length < 2) {
      this.trailPoints.visible = false;
      return;
    }

    this.trailPoints.visible = true;

    // Use the last N recorded positions for the trail
    const trailBuffer = pastStates.slice(-this.maxTrailLength);
    const positions = this.trailPoints.geometry.attributes.position.array;

    for (let i = 0; i < this.maxTrailLength; i++) {
      const idx = Math.floor((i / this.maxTrailLength) * trailBuffer.length);
      const state = trailBuffer[idx];
      if (state) {
        positions[i * 3] = state.position.x;
        positions[i * 3 + 1] = state.position.y + 0.1;
        positions[i * 3 + 2] = state.position.z;
      }
    }

    this.trailPoints.geometry.attributes.position.needsUpdate = true;
  }

  // Render white noise overlay
  renderNoise(time) {
    if (!this.noiseCanvas || !this.noiseCtx) return;

    // Smooth noise intensity
    this.noiseIntensity += (this.targetNoiseIntensity - this.noiseIntensity) * 0.05;

    if (this.noiseIntensity < 0.01) {
      this.noiseCanvas.style.opacity = '0';
      return;
    }

    this.noiseCanvas.style.opacity = String(this.noiseIntensity);

    const w = this.noiseCanvas.width;
    const h = this.noiseCanvas.height;
    const imageData = this.noiseCtx.createImageData(w, h);
    const data = imageData.data;

    // Efficient noise generation
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 30 * this.noiseIntensity;
    }

    this.noiseCtx.putImageData(imageData, 0, 0);
  }

  // Set echo alignment for noise feedback
  setEchoAlignment(alignment) {
    // Inverted: high alignment = low noise
    this.targetNoiseIntensity = Math.max(0, 0.8 - alignment);
  }

  // Screen shake
  setScreenShake(intensity) {
    // Could add camera offset here in the future
  }

  // Toggle echo visualization
  setEchoActive(active) {
    this.echoActive = active;
  }

  cleanup() {
    this.scene.remove(this.ghostGroup);
  }
}

import * as THREE from 'three';

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Movement state (keyboard)
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isLocked = false;

    // Touch input state
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.isTouchActive = false;

    // Position & rotation
    this.position = camera.position;
    this.quaternion = new THREE.Quaternion();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    // Speed
    this.speed = 3.0;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    // Collision radius
    this.radius = 0.3;
    this.height = 1.6;

    // Recording buffer for echo ghost — stores { position, quaternion, time }
    this.recordingBuffer = [];
    this.bufferDuration = 6000; // 6 seconds
    this.recordInterval = 50;   // ms between samples
    this.lastRecordTime = 0;

    // Collision objects (set by environment)
    this.colliders = [];

    // Grounded check
    this.isOnGround = true;

    // Pointer lock (desktop only)
    this.setupPointerLock();
    this.setupKeyboard();

    // Starting position
    this.position.set(0, 1.6, 8);
  }

  setupPointerLock() {
    // Click on the canvas to lock pointer
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      }
    });

    // Also handle clicks on the lock overlay (it has pointer-events: all on top)
    const lockOverlay = document.getElementById('click-to-lock');
    if (lockOverlay) {
      lockOverlay.addEventListener('click', () => {
        if (!this.isLocked) {
          this.domElement.requestPointerLock();
        }
      });
    }

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      const overlay = document.getElementById('click-to-lock');
      if (overlay) {
        overlay.classList.toggle('visible', !this.isLocked);
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= movementX * 0.002;
      this.euler.x -= movementY * 0.002;
      this.euler.x = Math.max(-_PI_2, Math.min(_PI_2, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  setupKeyboard() {
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
      }
    });

    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
      }
    });
  }

  /**
   * Called by TouchControls each frame with joystick input.
   * @param {number} x - Horizontal joystick position (-1 to 1)
   * @param {number} y - Vertical joystick position (-1 to 1, positive = backward)
   */
  setTouchMove(x, y) {
    this.touchMoveX = x;
    this.touchMoveY = y;
    this.isTouchActive = Math.abs(x) > 0.01 || Math.abs(y) > 0.01;
  }

  /**
   * Called by TouchControls to rotate the camera (like mouse look).
   * No pointer lock needed — works directly on camera quaternion.
   */
  applyTouchLook(dx, dy) {
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= dx;
    this.euler.x -= dy;
    this.euler.x = Math.max(-_PI_2, Math.min(_PI_2, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  getForward() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();
    return forward;
  }

  getRight() {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();
    return right;
  }

  update(delta) {
    // On desktop, require pointer lock for movement
    // On mobile, check if touch is active
    const hasControl = this.isLocked || this.isTouchActive;

    if (!hasControl) {
      // Still record position even without movement (for the ghost)
      this.recordPosition();
      return;
    }

    // Calculate movement direction
    const forward = this.getForward();
    const right = this.getRight();

    this.direction.set(0, 0, 0);

    if (this.isTouchActive) {
      // Touch input: use joystick values
      // Y: negative = forward, positive = backward
      // X: negative = left, positive = right
      this.direction.add(forward.clone().multiplyScalar(-this.touchMoveY));
      this.direction.add(right.clone().multiplyScalar(this.touchMoveX));
    } else {
      // Keyboard input
      if (this.moveForward) this.direction.add(forward);
      if (this.moveBackward) this.direction.sub(forward);
      if (this.moveLeft) this.direction.sub(right);
      if (this.moveRight) this.direction.add(right);
    }

    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // Apply velocity
    const speed = this.speed * delta;
    const movement = this.direction.clone().multiplyScalar(speed);

    // Collision detection (simple circle collision)
    const newPos = this.position.clone().add(movement);
    let canMove = true;

    for (const collider of this.colliders) {
      if (this.checkCollision(newPos, collider)) {
        canMove = false;
        // Try sliding along each axis
        const tryX = new THREE.Vector3(newPos.x, this.position.y, this.position.z);
        const tryZ = new THREE.Vector3(this.position.x, this.position.y, newPos.z);

        if (!this.checkCollision(tryX, collider)) {
          newPos.x = tryX.x;
          canMove = true;
        } else if (!this.checkCollision(tryZ, collider)) {
          newPos.z = tryZ.z;
          canMove = true;
        }
      }
    }

    if (canMove) {
      this.position.copy(newPos);
    }

    // Keep within bounds (circular room)
    const distFromCenter = Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z);
    const maxRadius = 16;
    if (distFromCenter > maxRadius) {
      const ratio = maxRadius / distFromCenter;
      this.position.x *= ratio;
      this.position.z *= ratio;
    }

    // Record position for echo ghost
    this.recordPosition();
  }

  recordPosition() {
    const now = performance.now();
    if (now - this.lastRecordTime >= this.recordInterval) {
      this.recordingBuffer.push({
        position: this.position.clone(),
        quaternion: this.camera.quaternion.clone(),
        time: now
      });

      // Trim buffer
      const cutoff = now - this.bufferDuration;
      while (this.recordingBuffer.length > 0 && this.recordingBuffer[0].time < cutoff) {
        this.recordingBuffer.shift();
      }

      this.lastRecordTime = now;
    }
  }

  checkCollision(pos, collider) {
    if (collider.type === 'cylinder') {
      const dx = pos.x - collider.position.x;
      const dz = pos.z - collider.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      return dist < this.radius + collider.radius;
    }
    if (collider.type === 'box') {
      const halfW = collider.width / 2 + this.radius;
      const halfD = collider.depth / 2 + this.radius;
      const dx = Math.abs(pos.x - collider.position.x);
      const dz = Math.abs(pos.z - collider.position.z);
      return dx < halfW && dz < halfD;
    }
    return false;
  }

  // Get player state from N ms ago
  getPastState(offsetMs = 5000) {
    if (this.recordingBuffer.length === 0) return null;
    const targetTime = performance.now() - offsetMs;

    // Binary search for closest
    let lo = 0, hi = this.recordingBuffer.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (this.recordingBuffer[mid].time <= targetTime) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    return this.recordingBuffer[lo];
  }

  // Get current movement speed for audio
  getSpeed() {
    if (this.isTouchActive) {
      const touchMag = Math.sqrt(this.touchMoveX * this.touchMoveX + this.touchMoveY * this.touchMoveY);
      return touchMag * this.speed;
    }
    return this.direction.length() * (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight ? this.speed : 0);
  }

  addCollider(collider) {
    this.colliders.push(collider);
  }
}

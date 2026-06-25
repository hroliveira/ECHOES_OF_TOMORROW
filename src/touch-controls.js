/**
 * TouchControls — Virtual joystick + touch-drag look for mobile
 *
 * - Left half of screen: joystick for movement (appears at touch point)
 * - Right half of screen: drag to look around
 * - Single tap on right side: interact with books
 */

export class TouchControls {
  constructor(player, canvas) {
    this.player = player;
    this.canvas = canvas;

    // Movement joystick
    this.moveX = 0;
    this.moveY = 0;
    this.moveTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickActive = false;
    this.moveDeadzone = 0.12;
    this.joystickRadius = 55;

    // Touch look
    this.lookTouchId = null;
    this.lastLookX = 0;
    this.lastLookY = 0;
    this.lookActive = false;
    this.lookSensitivity = 0.004;

    // Tap detection
    this.tapTouchId = null;
    this.tapStartPos = null;
    this.tapStartTime = 0;
    this.tapThreshold = 10; // px
    this.tapTimeLimit = 300; // ms

    // DOM joystick visuals
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickThumb = document.getElementById('joystick-thumb');
    this.joystickArea = document.getElementById('joystick-area');

    // Callback for tap (book interaction)
    this.onTap = null;

    this.setupEvents();
  }

  setupEvents() {
    const el = this.canvas;

    el.addEventListener('touchstart', (e) => {
      // Don't prevent default on all touches — let some through for buttons
      for (const touch of e.changedTouches) {
        const x = touch.clientX;
        const y = touch.clientY;
        const isLeft = x < window.innerWidth / 2;

        if (isLeft && this.moveTouchId === null) {
          // Start movement joystick
          this.moveTouchId = touch.identifier;
          this.joystickCenter = { x, y };
          this.joystickActive = true;
          this.moveX = 0;
          this.moveY = 0;
          this.showJoystick(x, y);
        } else if (!isLeft && this.lookTouchId === null && this.moveTouchId !== touch.identifier) {
          // Start look or tap
          this.lookTouchId = touch.identifier;
          this.lastLookX = x;
          this.lastLookY = y;
          this.lookActive = true;

          // Prepare for potential tap
          this.tapTouchId = touch.identifier;
          this.tapStartPos = { x, y };
          this.tapStartTime = Date.now();
        }
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling while playing

      for (const touch of e.changedTouches) {
        // Update joystick
        if (touch.identifier === this.moveTouchId) {
          const dx = touch.clientX - this.joystickCenter.x;
          const dy = touch.clientY - this.joystickCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = this.joystickRadius;

          if (dist > this.moveDeadzone * maxDist) {
            // Normalize to -1..1 with clamping at the joystick edge
            const clampedDist = Math.min(dist, maxDist);
            this.moveX = (dx / dist) * (clampedDist / maxDist);
            this.moveY = (dy / dist) * (clampedDist / maxDist);
          } else {
            this.moveX = 0;
            this.moveY = 0;
          }

          // If moved beyond tap threshold, cancel tap
          if (this.tapTouchId === touch.identifier) {
            const tapDx = touch.clientX - this.tapStartPos.x;
            const tapDy = touch.clientY - this.tapStartPos.y;
            if (Math.sqrt(tapDx * tapDx + tapDy * tapDy) > this.tapThreshold) {
              this.tapTouchId = null;
            }
          }

          this.updateJoystickThumb(dx, dy, maxDist);
        }

        // Update look
        if (touch.identifier === this.lookTouchId) {
          const dx = touch.clientX - this.lastLookX;
          const dy = touch.clientY - this.lastLookY;
          this.player.applyTouchLook(dx * this.lookSensitivity, dy * this.lookSensitivity);
          this.lastLookX = touch.clientX;
          this.lastLookY = touch.clientY;

          // Cancel tap if moved
          if (this.tapTouchId === touch.identifier) {
            const tapDx = touch.clientX - this.tapStartPos.x;
            const tapDy = touch.clientY - this.tapStartPos.y;
            if (Math.sqrt(tapDx * tapDx + tapDy * tapDy) > this.tapThreshold) {
              this.tapTouchId = null;
            }
          }
        }
      }
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.moveTouchId) {
          this.moveTouchId = null;
          this.moveX = 0;
          this.moveY = 0;
          this.joystickActive = false;
          this.hideJoystick();
        }

        if (touch.identifier === this.lookTouchId) {
          this.lookTouchId = null;
          this.lookActive = false;

          // Check for tap (book interaction)
          if (this.tapTouchId === touch.identifier && this.tapStartPos) {
            const dt = Date.now() - this.tapStartTime;
            if (dt < this.tapTimeLimit) {
              if (this.onTap) this.onTap();
            }
          }
          this.tapTouchId = null;
          this.tapStartPos = null;
        }
      }
    });

    el.addEventListener('touchcancel', () => {
      this.moveTouchId = null;
      this.lookTouchId = null;
      this.moveX = 0;
      this.moveY = 0;
      this.lookActive = false;
      this.joystickActive = false;
      this.tapTouchId = null;
      this.tapStartPos = null;
      this.hideJoystick();
    });
  }

  showJoystick(x, y) {
    if (!this.joystickArea) return;
    this.joystickArea.style.left = `${x}px`;
    this.joystickArea.style.top = `${y}px`;
    this.joystickArea.classList.add('active');
  }

  hideJoystick() {
    if (!this.joystickArea) return;
    this.joystickArea.classList.remove('active');
    if (this.joystickThumb) {
      this.joystickThumb.style.transform = 'translate(-50%, -50%)';
    }
  }

  updateJoystickThumb(dx, dy, maxDist) {
    if (!this.joystickThumb) return;
    const clampedDx = Math.max(-maxDist, Math.min(maxDist, dx));
    const clampedDy = Math.max(-maxDist, Math.min(maxDist, dy));
    this.joystickThumb.style.transform = `translate(calc(-50% + ${clampedDx}px), calc(-50% + ${clampedDy}px))`;
  }

  // Called every frame to update player movement from joystick
  update() {
    if (this.joystickActive) {
      this.player.setTouchMove(this.moveX, this.moveY);
    } else {
      this.player.setTouchMove(0, 0);
    }
  }

  setTapCallback(callback) {
    this.onTap = callback;
  }

  destroy() {
    // Cleanup if needed
  }

  static isMobile() {
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (window.innerWidth < 768);
  }
}

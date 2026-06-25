import * as THREE from 'three';

// Watercolor palette
const COLORS = {
  walls: 0xd4c5b0,
  floor: 0x3a2a1a,
  shelf: 0x6b5a4a,
  shelfDark: 0x4a3a2a,
  ceiling: 0x2a2a3e,
  // Book colors
  physics: 0x7eb5d6,
  poetry: 0xd68b8b,
  history: 0xb8a9d4,
  fiction: 0xe8c87a,
  philosophy: 0x8bc4a0,
  fantasy: 0xd4a0c8,
  science: 0x88ccbb,
  art: 0xcc9988,
};

const BOOK_COLORS = [
  COLORS.physics, COLORS.poetry, COLORS.history,
  COLORS.fiction, COLORS.philosophy, COLORS.fantasy,
  COLORS.science, COLORS.art
];

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.books = [];
    this.floatingBooks = [];
    this.colliders = [];
    this.bookMeshes = [];

    this.build();
  }

  build() {
    this.createFloor();
    this.createWalls();
    this.createBookshelves();
    this.createCenterpiece();
    this.createFloatingBooks();
    this.createInvertedGravityZone();
    this.createLightPillars();
  }

  createFloor() {
    // Main floor - circular
    const floorGeo = new THREE.CircleGeometry(18, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: COLORS.floor,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Floor pattern - concentric rings
    for (let i = 1; i <= 4; i++) {
      const ringGeo = new THREE.RingGeometry(i * 3.5 - 0.1, i * 3.5 + 0.1, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x4a3a2a,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01;
      this.scene.add(ring);
    }

    // Glass floor center section
    const glassGeo = new THREE.CircleGeometry(2.5, 32);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x8899cc,
      transparent: true,
      opacity: 0.2,
      roughness: 0.1,
      metalness: 0.3,
      side: THREE.DoubleSide
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.rotation.x = -Math.PI / 2;
    glass.position.y = 0.02;
    this.scene.add(glass);

    // Glow under glass
    const glowGeo = new THREE.CircleGeometry(2, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x6688cc,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.y = -0.1;
    this.scene.add(glow);
  }

  createWalls() {
    // Cylindrical wall with panels
    const segments = 48;
    const radius = 17;
    const height = 8;

    // Main wall sections (pillars)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const nextAngle = ((i + 1) / 8) * Math.PI * 2;

      // Wall panel between pillars
      const panelWidth = radius * (nextAngle - angle) * 0.75;
      const panelDepth = 0.3;
      const midAngle = (angle + nextAngle) / 2;

      const panelGeo = new THREE.BoxGeometry(panelWidth, height, panelDepth);
      const panelMat = new THREE.MeshStandardMaterial({
        color: COLORS.walls,
        roughness: 0.9,
        metalness: 0.0
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(
        Math.sin(midAngle) * (radius - 0.15),
        height / 2,
        Math.cos(midAngle) * (radius - 0.15)
      );
      panel.lookAt(0, height / 2, 0);
      panel.receiveShadow = true;
      this.scene.add(panel);
    }

    // Archways / ceiling trim
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const archGeo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
      const archMat = new THREE.MeshStandardMaterial({
        color: COLORS.shelfDark,
        roughness: 0.7,
        metalness: 0.2
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(
        Math.sin(angle) * (radius - 0.5),
        height - 0.15,
        Math.cos(angle) * (radius - 0.5)
      );
      this.scene.add(arch);
    }
  }

  createBookshelves() {
    const shelfCount = 8;
    const radius = 15.5;
    const shelfHeight = 5.5;
    const shelfStartY = 0.5;

    for (let i = 0; i < shelfCount; i++) {
      const angle = (i / shelfCount) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      this.createBookshelf(x, z, angle, shelfHeight, shelfStartY);
    }
  }

  createBookshelf(x, z, angle, height, startY) {
    const group = new THREE.Group();
    group.position.set(x, startY, z);
    group.lookAt(0, startY, 0);

    // Shelf frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: COLORS.shelf,
      roughness: 0.8,
      metalness: 0.1
    });

    // Vertical sides
    const sideGeo = new THREE.BoxGeometry(0.15, height, 0.4);
    const leftSide = new THREE.Mesh(sideGeo, frameMat);
    leftSide.position.set(-2.2, height / 2, 0);
    group.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, frameMat);
    rightSide.position.set(2.2, height / 2, 0);
    group.add(rightSide);

    // Shelf planks
    const shelfCount = 5;
    const shelfSpacing = height / shelfCount;
    const shelfMat = new THREE.MeshStandardMaterial({
      color: COLORS.shelfDark,
      roughness: 0.8,
      metalness: 0.1
    });

    for (let s = 0; s < shelfCount; s++) {
      const shelfGeo = new THREE.BoxGeometry(4.4, 0.08, 0.45);
      const plank = new THREE.Mesh(shelfGeo, shelfMat);
      plank.position.set(0, s * shelfSpacing + 0.3, 0);
      group.add(plank);

      // Add books on this shelf
      this.addBooksToShelf(group, s, shelfSpacing);
    }

    // Top decorative arch
    const archGeo = new THREE.BoxGeometry(4.4, 0.12, 0.45);
    const archMat = new THREE.MeshStandardMaterial({
      color: COLORS.shelfDark,
      roughness: 0.6,
      metalness: 0.2
    });
    const top = new THREE.Mesh(archGeo, archMat);
    top.position.set(0, height + 0.1, 0);
    group.add(top);

    this.scene.add(group);

    // Add collider
    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(x, startY, z),
      width: 4.8,
      depth: 0.8
    });
  }

  addBooksToShelf(group, shelfIndex, spacing) {
    const booksPerShelf = 5 + Math.floor(Math.random() * 4);
    const shelfWidth = 4.0;
    const startX = -shelfWidth / 2 + 0.2;
    const spacingX = shelfWidth / booksPerShelf;

    for (let i = 0; i < booksPerShelf; i++) {
      const bookWidth = 0.08 + Math.random() * 0.15;
      const bookHeight = 0.3 + Math.random() * 0.6;
      const bookDepth = 0.25 + Math.random() * 0.15;

      const color = BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];
      const bookMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.1
      });

      const bookGeo = new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth);
      const book = new THREE.Mesh(bookGeo, bookMat);

      // Position with slight random offset
      const xPos = startX + i * spacingX + (Math.random() - 0.5) * 0.1;
      const yPos = shelfIndex * spacing + 0.3 + bookHeight / 2;
      const zOffset = (Math.random() - 0.5) * 0.05;

      book.position.set(xPos, yPos, zOffset);

      // Slight random rotation for organic feel
      book.rotation.y = (Math.random() - 0.5) * 0.1;
      book.rotation.z = (Math.random() - 0.5) * 0.02;

      book.castShadow = true;
      group.add(book);

      // Store book data for interaction
      this.bookMeshes.push({
        mesh: book,
        color: color,
        category: ['physics', 'poetry', 'history', 'fiction', 'philosophy', 'fantasy', 'science', 'art'][
          Math.floor(Math.random() * 8)
        ],
        interacted: false
      });
    }
  }

  createCenterpiece() {
    // Central reading table
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.9,
      metalness: 0.1
    });

    // Table top
    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.1, 1.5),
      tableMat
    );
    tableTop.position.set(0, 0.7, 0);
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    this.scene.add(tableTop);

    // Table legs
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.9
    });
    const legPositions = [[-1.1, -0.65], [1.1, -0.65], [-1.1, 0.65], [1.1, 0.65]];
    for (const [lx, lz] of legPositions) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.6, 0.08),
        legMat
      );
      leg.position.set(lx, 0.3, lz);
      this.scene.add(leg);
    }

    // Open book on table
    const bookMat = new THREE.MeshStandardMaterial({
      color: 0xe8d5b7,
      roughness: 0.5,
      metalness: 0.0
    });
    const bookBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.4),
      bookMat
    );
    bookBody.position.set(0, 0.76, 0);
    this.scene.add(bookBody);

    // Glowing crystal on table
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      emissive: 0x4466aa,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.3
    });
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.15, 0),
      crystalMat
    );
    crystal.position.set(0, 0.85, 0);
    crystal.userData.isCrystal = true;
    this.scene.add(crystal);

    // Crystal glow light
    const glowLight = new THREE.PointLight(0x88aaff, 0.3, 5);
    glowLight.position.set(0, 0.85, 0);
    this.scene.add(glowLight);
  }

  createFloatingBooks() {
    const bookCount = 12;

    for (let i = 0; i < bookCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 8;
      const height = 1.5 + Math.random() * 5;

      const color = BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];
      const bookMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.1,
        emissive: color,
        emissiveIntensity: 0.15
      });

      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.35, 0.25),
        bookMat
      );

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      book.position.set(x, height, z);
      book.rotation.set(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      );
      book.castShadow = true;

      this.scene.add(book);

      this.floatingBooks.push({
        mesh: book,
        baseY: height,
        angle: angle,
        radius: radius,
        speed: 0.2 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: 0.1 + Math.random() * 0.2
      });
    }
  }

  createInvertedGravityZone() {
    // A section of the library where gravity is inverted
    // Visual indicator: archway with blue-shifted lighting
    const zoneAngle = Math.PI * 0.25; // 45 degrees
    const zoneRadius = 14;
    const x = Math.sin(zoneAngle) * zoneRadius;
    const z = Math.cos(zoneAngle) * zoneRadius;

    // Zone marker ring on floor
    const ringGeo = new THREE.RingGeometry(1.8, 2.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6688ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.02, z);
    this.scene.add(ring);

    // Floating books in this zone (falling upward)
    for (let i = 0; i < 8; i++) {
      const bookMat = new THREE.MeshStandardMaterial({
        color: BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)],
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x6688ff,
        emissiveIntensity: 0.1
      });

      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.3, 0.2),
        bookMat
      );

      const localAngle = Math.random() * Math.PI * 2;
      const localRadius = 0.5 + Math.random() * 1.5;
      book.position.set(
        x + Math.sin(localAngle) * localRadius,
        0.2 + Math.random() * 0.5,
        z + Math.cos(localAngle) * localRadius
      );
      book.rotation.set(Math.random(), Math.random(), Math.random());
      book.castShadow = true;
      this.scene.add(book);

      this.floatingBooks.push({
        mesh: book,
        baseY: book.position.y,
        angle: 0,
        radius: 0,
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: 0.3 + Math.random() * 0.3,
        invertZone: true,
        centerX: x,
        centerZ: z
      });
    }

    // "Ceiling floor" platform (visual only)
    const ceilFloorMat = new THREE.MeshStandardMaterial({
      color: 0x445577,
      transparent: true,
      opacity: 0.15,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    const ceilFloor = new THREE.Mesh(
      new THREE.CircleGeometry(2, 16),
      ceilFloorMat
    );
    ceilFloor.rotation.x = Math.PI / 2;
    ceilFloor.position.set(x, 6, z);
    this.scene.add(ceilFloor);

    // Light pillar in the zone
    const pillarLight = new THREE.PointLight(0x6688ff, 0.5, 8);
    pillarLight.position.set(x, 3, z);
    this.scene.add(pillarLight);
  }

  createLightPillars() {
    // Create ethereal light pillars coming from above
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 8;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      // Volumetric-ish light pillar using a transparent cylinder
      const pillarMat = new THREE.MeshBasicMaterial({
        color: 0xaabbee,
        transparent: true,
        opacity: 0.03,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 1.0, 7, 8, 1, true),
        pillarMat
      );
      pillar.position.set(x, 3.5, z);
      pillar.rotation.x = (Math.random() - 0.5) * 0.1;
      pillar.rotation.z = (Math.random() - 0.5) * 0.1;
      this.scene.add(pillar);
    }
  }

  update(time, delta) {
    // Animate floating books
    for (const fb of this.floatingBooks) {
      if (fb.invertZone) {
        // Float upward (inverted gravity)
        fb.mesh.position.y += Math.sin(time * 0.001 + fb.phase) * delta * fb.speed;
        // Slowly drift
        fb.mesh.position.x += Math.sin(time * 0.0005 + fb.phase) * delta * 0.1;
        fb.mesh.position.z += Math.cos(time * 0.0007 + fb.phase * 1.3) * delta * 0.1;
      } else {
        // Gentle floating
        fb.mesh.position.y = fb.baseY + Math.sin(time * 0.001 + fb.phase) * 0.2;
      }
      // Rotation
      fb.mesh.rotation.x += delta * fb.rotSpeed * 0.1;
      fb.mesh.rotation.y += delta * fb.rotSpeed * 0.2;
      fb.mesh.rotation.z += delta * fb.rotSpeed * 0.05;
    }
  }

  getColliders() {
    return this.colliders;
  }

  getBookMeshes() {
    return this.bookMeshes;
  }
}

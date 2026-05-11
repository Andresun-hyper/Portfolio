import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  WORLD_H,
  WORLD_W,
  type AnchorSubscriber,
  type MotionSnapshot,
  type SnapAnchor,
  type ViewportSubscriber,
} from '../hooks/useDragEngine';

interface ParticleField {
  points: THREE.Points;
  velocities: Float32Array;
  phases: Float32Array;
}

interface TrailLine {
  line: THREE.Line;
  material: THREE.LineDashedMaterial;
  speed: number;
  baseOpacity: number;
}

interface Fragment {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  phase: number;
}

interface RoofNode {
  anchor: SnapAnchor;
  group: THREE.Group;
  ring: THREE.Line;
  tower: THREE.LineSegments;
  beacon: THREE.Points;
}

interface Props {
  subscribe: (cb: ViewportSubscriber) => () => void;
  subscribeAnchors: (cb: AnchorSubscriber) => () => void;
  anchors: SnapAnchor[];
}

const TEAL = '#00E5FF';
const GOLD = '#FDB933';
const VIOLET = '#7B61FF';

function colorFor(anchor: SnapAnchor) {
  if (anchor.tone === 'gold') return GOLD;
  if (anchor.tone === 'violet') return VIOLET;
  return TEAL;
}

function createSparkleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(0,229,255,0.9)');
  g.addColorStop(0.5, 'rgba(0,96,255,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function createMotionSeed(anchor: SnapAnchor | null): MotionSnapshot {
  return {
    viewportX: 0,
    viewportY: 0,
    velX: 0,
    velY: 0,
    speed: 0,
    floorZ: anchor?.floor ?? 0,
    targetFloorZ: anchor?.floor ?? 0,
    impact: 0,
    reflectionCount: 0,
    activeAnchor: anchor,
    snapProgress: anchor ? 1 : 0,
    dragging: false,
    dragIntensity: 0,
    directionX: 0,
    directionY: 0,
    recoveryActive: false,
  };
}

function makeParticleField(scene: THREE.Scene, texture: THREE.Texture): ParticleField {
  const count = 1800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const palette = [new THREE.Color(TEAL), new THREE.Color('#33B7FF'), new THREE.Color(VIOLET), new THREE.Color('#F5F9FF')];

  for (let i = 0; i < count; i++) {
    const p3 = i * 3;
    positions[p3] = Math.random() * WORLD_W;
    positions[p3 + 1] = -120 + Math.random() * 440;
    positions[p3 + 2] = Math.random() * WORLD_H;
    velocities[p3] = (Math.random() - 0.5) * 0.55;
    velocities[p3 + 1] = (Math.random() - 0.5) * 0.18;
    velocities[p3 + 2] = (Math.random() - 0.5) * 0.55;
    phases[i] = Math.random() * Math.PI * 2;

    const color = palette[i % palette.length];
    colors[p3] = color.r;
    colors[p3 + 1] = color.g;
    colors[p3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 5.5,
    map: texture,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return { points, velocities, phases };
}

function makeTrail(scene: THREE.Scene, points: THREE.Vector3[], color: string, speed: number): TrailLine {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(160));
  const material = new THREE.LineDashedMaterial({
    color,
    dashSize: 34,
    gapSize: 26,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  scene.add(line);
  return { line, material, speed, baseOpacity: 0.12 + Math.random() * 0.16 };
}

function makeRoofNode(scene: THREE.Scene, anchor: SnapAnchor, texture: THREE.Texture): RoofNode {
  const group = new THREE.Group();
  group.position.set(anchor.x, anchor.floor * 14 - 90, anchor.y);

  const ringPoints: THREE.Vector3[] = [];
  const radius = 130 + anchor.floor * 2.5;
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    ringPoints.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const ring = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ringPoints),
    new THREE.LineBasicMaterial({
      color: colorFor(anchor),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(ring);

  const towerGeo = new THREE.CylinderGeometry(38, 58, 190 + anchor.floor * 4, 6, 3, true);
  towerGeo.translate(0, 88, 0);
  const tower = new THREE.LineSegments(
    new THREE.EdgesGeometry(towerGeo),
    new THREE.LineBasicMaterial({
      color: colorFor(anchor),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(tower);

  const beaconPositions = new Float32Array(96 * 3);
  const beaconColors = new Float32Array(96 * 3);
  const color = new THREE.Color(colorFor(anchor));
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const r = 16 + Math.random() * radius;
    beaconPositions[i * 3] = Math.cos(a) * r;
    beaconPositions[i * 3 + 1] = Math.random() * 230;
    beaconPositions[i * 3 + 2] = Math.sin(a) * r;
    beaconColors[i * 3] = color.r;
    beaconColors[i * 3 + 1] = color.g;
    beaconColors[i * 3 + 2] = color.b;
  }

  const beaconGeo = new THREE.BufferGeometry();
  beaconGeo.setAttribute('position', new THREE.BufferAttribute(beaconPositions, 3));
  beaconGeo.setAttribute('color', new THREE.BufferAttribute(beaconColors, 3));
  const beacon = new THREE.Points(
    beaconGeo,
    new THREE.PointsMaterial({
      size: 7,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  group.add(beacon);

  scene.add(group);
  return { anchor, group, ring, tower, beacon };
}

function makeFragment(scene: THREE.Scene, index: number): Fragment {
  const geometry = index % 3 === 0
    ? new THREE.TetrahedronGeometry(8 + Math.random() * 15, 0)
    : index % 3 === 1
      ? new THREE.OctahedronGeometry(7 + Math.random() * 12, 0)
      : new THREE.BoxGeometry(22 + Math.random() * 28, 4 + Math.random() * 8, 18 + Math.random() * 30);

  const palette = [TEAL, '#48A7FF', VIOLET, GOLD];
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette[index % palette.length]),
    transparent: true,
    opacity: 0.16,
    wireframe: index % 4 === 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(Math.random() * WORLD_W, -60 + Math.random() * 360, Math.random() * WORLD_H);
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  scene.add(mesh);

  return {
    mesh,
    velocity: new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 0.35, (Math.random() - 0.5) * 1.2),
    spin: new THREE.Vector3((Math.random() - 0.5) * 0.018, (Math.random() - 0.5) * 0.024, (Math.random() - 0.5) * 0.018),
    phase: Math.random() * Math.PI * 2,
  };
}

function disposeObject(object: THREE.Object3D) {
  const mesh = object as THREE.Mesh;
  if (mesh.geometry) mesh.geometry.dispose();
  const material = mesh.material;
  if (Array.isArray(material)) {
    material.forEach(item => item.dispose());
  } else if (material) {
    material.dispose();
  }
}

export default function CyberScene({ subscribe, subscribeAnchors, anchors }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseWorldRef = useRef(new THREE.Vector3(WORLD_W / 2, 0, WORLD_H / 2));
  const motionRef = useRef<MotionSnapshot>(createMotionSeed(anchors[0] ?? null));
  const activeAnchorRef = useRef<SnapAnchor | null>(anchors[0] ?? null);
  const snapProgressRef = useRef(1);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let viewW = window.innerWidth;
    let viewH = window.innerHeight;
    let viewportX = WORLD_W / 2 - viewW / 2;
    let viewportY = WORLD_H / 2 - viewH / 2;

    const sparkleTexture = createSparkleTexture();
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x01101c, 0.00042);

    const camera = new THREE.PerspectiveCamera(58, viewW / viewH, 0.1, 9000);
    camera.position.set(WORLD_W / 2, 860, WORLD_H / 2 + 1700);
    camera.lookAt(WORLD_W / 2, 0, WORLD_H / 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(viewW, viewH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.mixBlendMode = 'screen';
    container.appendChild(renderer.domElement);

    const particleField = makeParticleField(scene, sparkleTexture);
    const roofNodes = anchors.map(anchor => makeRoofNode(scene, anchor, sparkleTexture));
    const fragments = Array.from({ length: 95 }, (_, index) => makeFragment(scene, index));
    const trails = [
      makeTrail(scene, [
        new THREE.Vector3(120, -78, WORLD_H * 0.58),
        new THREE.Vector3(WORLD_W * 0.24, -68, WORLD_H * 0.34),
        new THREE.Vector3(WORLD_W * 0.48, -62, WORLD_H * 0.48),
        new THREE.Vector3(WORLD_W * 0.76, -70, WORLD_H * 0.32),
        new THREE.Vector3(WORLD_W - 220, -76, WORLD_H * 0.52),
      ], TEAL, 0.52),
      makeTrail(scene, [
        new THREE.Vector3(WORLD_W * 0.06, -92, WORLD_H * 0.76),
        new THREE.Vector3(WORLD_W * 0.24, -74, WORLD_H * 0.69),
        new THREE.Vector3(WORLD_W * 0.46, -70, WORLD_H * 0.74),
        new THREE.Vector3(WORLD_W * 0.84, -82, WORLD_H * 0.66),
      ], VIOLET, 0.39),
      makeTrail(scene, [
        new THREE.Vector3(WORLD_W * 0.5, -84, 180),
        new THREE.Vector3(WORLD_W * 0.55, -68, WORLD_H * 0.26),
        new THREE.Vector3(WORLD_W * 0.5, -62, WORLD_H * 0.52),
        new THREE.Vector3(WORLD_W * 0.52, -78, WORLD_H - 180),
      ], GOLD, 0.46),
    ];

    const gridHelper = new THREE.GridHelper(1200, 80, 0x00e5ff, 0x06344f);
    gridHelper.position.set(WORLD_W / 2, -120, WORLD_H / 2);
    gridHelper.scale.set(WORLD_W / 600, 1, WORLD_H / 600);
    const gridMaterial = gridHelper.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.035;
    scene.add(gridHelper);

    const unsubViewport = subscribe((x, y, state) => {
      viewportX = x;
      viewportY = y;
      motionRef.current = state;
    });

    const unsubAnchor = subscribeAnchors((anchor, progress, state) => {
      activeAnchorRef.current = anchor;
      snapProgressRef.current = progress;
      motionRef.current = state;
    });

    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const onMouseMove = (event: MouseEvent) => {
      mouseNDC.x = (event.clientX / viewW) * 2 - 1;
      mouseNDC.y = -(event.clientY / viewH) * 2 + 1;
      raycaster.setFromCamera(mouseNDC, camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hit)) {
        mouseWorldRef.current.copy(hit);
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const motion = motionRef.current;
      const activeAnchor = activeAnchorRef.current ?? motion.activeAnchor;
      const snapProgress = snapProgressRef.current;
      const camTargetX = viewportX + viewW / 2;
      const camTargetZ = viewportY + viewH / 2;
      const speedFactor = Math.min(motion.speed / 48, 1);
      const floorLift = motion.floorZ * 17;

      camera.position.x += (camTargetX - camera.position.x + motion.velX * 5) * 0.055;
      camera.position.y += (760 + floorLift + speedFactor * 230 + motion.impact * 260 - camera.position.y) * 0.06;
      camera.position.z += (camTargetZ + 1650 - speedFactor * 280 - camera.position.z + motion.velY * 4) * 0.055;
      camera.lookAt(camTargetX + motion.velX * 6, -40 + floorLift * 0.14, camTargetZ + motion.velY * 6);
      camera.rotation.z += (-motion.velX * 0.00085 - camera.rotation.z) * 0.08;

      const particlePositions = particleField.points.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleField.phases.length; i++) {
        const p3 = i * 3;
        const phase = particleField.phases[i];
        particleField.velocities[p3 + 1] -= 0.0048 + motion.floorZ * 0.00008;

        if (activeAnchor) {
          const dx = activeAnchor.x - particlePositions[p3];
          const dz = activeAnchor.y - particlePositions[p3 + 2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 900) {
            const pull = (1 - dist / 900) * (0.004 + snapProgress * 0.01);
            particleField.velocities[p3] += dx * pull * 0.004;
            particleField.velocities[p3 + 2] += dz * pull * 0.004;
            particleField.velocities[p3 + 1] += snapProgress * 0.016;
          }
        }

        const mouseDx = mouseWorldRef.current.x - particlePositions[p3];
        const mouseDz = mouseWorldRef.current.z - particlePositions[p3 + 2];
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDz * mouseDz);
        if (mouseDist < 420) {
          const push = (1 - mouseDist / 420) * 0.18;
          particleField.velocities[p3] -= mouseDx * push * 0.008;
          particleField.velocities[p3 + 2] -= mouseDz * push * 0.008;
          particleField.velocities[p3 + 1] += push * 0.06;
        }

        particlePositions[p3] += particleField.velocities[p3] + motion.velX * 0.012 + Math.sin(elapsed * 0.8 + phase) * 0.08;
        particlePositions[p3 + 1] += particleField.velocities[p3 + 1];
        particlePositions[p3 + 2] += particleField.velocities[p3 + 2] + motion.velY * 0.012 + Math.cos(elapsed * 0.7 + phase) * 0.08;

        if (particlePositions[p3 + 1] < -135) {
          particlePositions[p3 + 1] = -135;
          particleField.velocities[p3 + 1] = Math.abs(particleField.velocities[p3 + 1]) * (0.55 + Math.random() * 0.25);
          particleField.velocities[p3] += motion.velX * 0.003;
          particleField.velocities[p3 + 2] += motion.velY * 0.003;
        }
        if (particlePositions[p3 + 1] > 520) particleField.velocities[p3 + 1] *= -0.45;
        if (particlePositions[p3] < 0 || particlePositions[p3] > WORLD_W) particleField.velocities[p3] *= -0.72;
        if (particlePositions[p3 + 2] < 0 || particlePositions[p3 + 2] > WORLD_H) particleField.velocities[p3 + 2] *= -0.72;
        particlePositions[p3] = THREE.MathUtils.euclideanModulo(particlePositions[p3], WORLD_W);
        particlePositions[p3 + 2] = THREE.MathUtils.euclideanModulo(particlePositions[p3 + 2], WORLD_H);
        particleField.velocities[p3] *= 0.992;
        particleField.velocities[p3 + 1] *= 0.986;
        particleField.velocities[p3 + 2] *= 0.992;
      }
      particleField.points.geometry.attributes.position.needsUpdate = true;
      const particleMaterial = particleField.points.material as THREE.PointsMaterial;
      particleMaterial.opacity = 0.38 + speedFactor * 0.3 + motion.impact * 0.18 + motion.dragIntensity * 0.16;
      particleMaterial.size = 4.8 + speedFactor * 3.4 + motion.impact * 3 + motion.dragIntensity * 2.4;

      roofNodes.forEach(node => {
        const active = activeAnchor?.label === node.anchor.label ? snapProgress : 0;
        node.group.rotation.y += 0.002 + active * 0.01;
        node.group.position.y += ((node.anchor.floor * 14 - 90) + active * 54 + Math.sin(elapsed * 1.2 + node.anchor.floor) * 7 - node.group.position.y) * 0.08;
        node.group.scale.setScalar(1 + active * 0.18 + motion.impact * 0.04);
        (node.ring.material as THREE.LineBasicMaterial).opacity = 0.13 + active * 0.62 + motion.impact * 0.08 + (motion.recoveryActive ? 0.08 : 0);
        (node.tower.material as THREE.LineBasicMaterial).opacity = 0.12 + active * 0.35;
        (node.beacon.material as THREE.PointsMaterial).opacity = 0.35 + active * 0.45;
      });

      trails.forEach((trail, index) => {
        const dashedMaterial = trail.material as THREE.LineDashedMaterial & { dashOffset: number };
        dashedMaterial.dashOffset -= trail.speed * (1 + speedFactor * 4);
        trail.material.opacity = trail.baseOpacity + Math.sin(elapsed * (0.9 + index * 0.1)) * 0.05 + speedFactor * 0.18 + motion.dragIntensity * 0.18;
        trail.line.position.y = Math.sin(elapsed * 0.8 + index) * 10 + motion.impact * 55 + motion.dragIntensity * 24;
      });

      fragments.forEach(fragment => {
        const mesh = fragment.mesh;
        fragment.velocity.y -= 0.012 + motion.floorZ * 0.00016;

        if (activeAnchor) {
          const dx = activeAnchor.x - mesh.position.x;
          const dz = activeAnchor.y - mesh.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 760) {
            const pull = (1 - dist / 760) * 0.032;
            fragment.velocity.x += dx * pull * 0.004;
            fragment.velocity.z += dz * pull * 0.004;
          }
        }

        mesh.position.x += fragment.velocity.x + motion.velX * 0.012;
        mesh.position.y += fragment.velocity.y + Math.sin(elapsed + fragment.phase) * 0.04;
        mesh.position.z += fragment.velocity.z + motion.velY * 0.012;
        mesh.rotation.x += fragment.spin.x * (1 + speedFactor * 3);
        mesh.rotation.y += fragment.spin.y * (1 + speedFactor * 3);
        mesh.rotation.z += fragment.spin.z;

        if (mesh.position.y < -105) {
          mesh.position.y = -105;
          fragment.velocity.y = Math.abs(fragment.velocity.y) * 0.64;
          fragment.velocity.x += motion.velX * 0.004;
          fragment.velocity.z += motion.velY * 0.004;
        }
        if (mesh.position.y > 560) fragment.velocity.y *= -0.5;
        if (mesh.position.x < 0 || mesh.position.x > WORLD_W) fragment.velocity.x *= -0.7;
        if (mesh.position.z < 0 || mesh.position.z > WORLD_H) fragment.velocity.z *= -0.7;
        mesh.position.x = THREE.MathUtils.euclideanModulo(mesh.position.x, WORLD_W);
        mesh.position.z = THREE.MathUtils.euclideanModulo(mesh.position.z, WORLD_H);
        fragment.velocity.multiplyScalar(0.992);

        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.08 + speedFactor * 0.12 + motion.impact * 0.16 + motion.dragIntensity * 0.12;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    const handleResize = () => {
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      camera.aspect = viewW / viewH;
      camera.updateProjectionMatrix();
      renderer.setSize(viewW, viewH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      unsubViewport();
      unsubAnchor();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
      scene.traverse(disposeObject);
      sparkleTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [anchors, subscribe, subscribeAnchors]);

  return <div ref={containerRef} className="fixed inset-0 z-10 pointer-events-none" style={{ opacity: 0.68 }} />;
}

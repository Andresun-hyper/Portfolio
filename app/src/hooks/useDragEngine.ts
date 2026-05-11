import { useCallback, useEffect, useRef } from 'react';

export const WORLD_W = 5500;
export const WORLD_H = 4000;

export interface SnapAnchor {
  x: number;
  y: number;
  label: string;
  floor: number;
  gravity?: number;
  tone?: 'cyan' | 'gold' | 'violet';
  kind?: 'hero' | 'project' | 'contact';
  accent?: string;
  bgFocus?: { x: number; y: number };
  magnetStrength?: number;
}

export interface MotionSnapshot {
  viewportX: number;
  viewportY: number;
  velX: number;
  velY: number;
  speed: number;
  floorZ: number;
  targetFloorZ: number;
  impact: number;
  reflectionCount: number;
  activeAnchor: SnapAnchor | null;
  snapProgress: number;
  dragging: boolean;
  dragIntensity: number;
  directionX: number;
  directionY: number;
  recoveryActive: boolean;
}

export interface PhysicsEngine {
  viewportX: number;
  viewportY: number;
  velX: number;
  velY: number;
  dragging: boolean;
  lastMX: number;
  lastMY: number;
  worldW: number;
  worldH: number;
  snappedAnchor: SnapAnchor | null;
  snapProgress: number;
  floorZ: number;
  targetFloorZ: number;
  impact: number;
  reflectionCount: number;
  velHistoryX: number[];
  velHistoryY: number[];
  idleTicks: number;
  dragIntensity: number;
  directionX: number;
  directionY: number;
  recoveryActive: boolean;
}

export type ViewportSubscriber = (x: number, y: number, state: MotionSnapshot) => void;
export type AnchorSubscriber = (anchor: SnapAnchor | null, progress: number, state: MotionSnapshot) => void;

export const SNAP_RADIUS = 760;

const AIR_DRAG = 0.966;
const SNAP_DAMP = 0.72;
const BOUNCE_RESTITUTION = 0.68;
const TANGENTIAL_RETAIN = 0.86;
const VELOCITY_SCALE = 0.46;
const MIN_VELOCITY = 0.035;
const FLICK_BOOST = 1.82;
const FLICK_THRESHOLD = 5.1;
const VELOCITY_SMOOTHING = 0.62;
const GRAVITY_WELL = 0.00048;
const FLOOR_GRAVITY = 0.092;
const EMPTY_SPACE_RETURN_TICKS = 92;
const EMPTY_SPACE_RETURN_FORCE = 0.00105;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function getSpeed(vx: number, vy: number) {
  return Math.sqrt(vx * vx + vy * vy);
}

function snapshot(p: PhysicsEngine): MotionSnapshot {
  const speed = getSpeed(p.velX, p.velY);
  return {
    viewportX: p.viewportX,
    viewportY: p.viewportY,
    velX: p.velX,
    velY: p.velY,
    speed,
    floorZ: p.floorZ,
    targetFloorZ: p.targetFloorZ,
    impact: p.impact,
    reflectionCount: p.reflectionCount,
    activeAnchor: p.snappedAnchor,
    snapProgress: p.snapProgress,
    dragging: p.dragging,
    dragIntensity: p.dragIntensity,
    directionX: p.directionX,
    directionY: p.directionY,
    recoveryActive: p.recoveryActive,
  };
}

export function useDragEngine() {
  const engine = useRef<PhysicsEngine>({
    viewportX: 0,
    viewportY: 0,
    velX: 0,
    velY: 0,
    dragging: false,
    lastMX: 0,
    lastMY: 0,
    worldW: WORLD_W,
    worldH: WORLD_H,
    snappedAnchor: null,
    snapProgress: 0,
    floorZ: 0,
    targetFloorZ: 0,
    impact: 0,
    reflectionCount: 0,
    velHistoryX: [],
    velHistoryY: [],
    idleTicks: 0,
    dragIntensity: 0,
    directionX: 0,
    directionY: 0,
    recoveryActive: false,
  });

  const subscribers = useRef<Set<ViewportSubscriber>>(new Set());
  const anchorSubs = useRef<Set<AnchorSubscriber>>(new Set());

  const subscribe = useCallback((cb: ViewportSubscriber) => {
    subscribers.current.add(cb);
    return () => { subscribers.current.delete(cb); };
  }, []);

  const subscribeAnchors = useCallback((cb: AnchorSubscriber) => {
    anchorSubs.current.add(cb);
    return () => { anchorSubs.current.delete(cb); };
  }, []);

  const sphericalProject = useCallback((elementX: number, elementY: number, viewportX: number, viewportY: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = viewportX + vw / 2;
    const cy = viewportY + vh / 2;
    const dx = elementX - cx;
    const dy = elementY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = Math.sqrt(vw * vw + vh * vh) * 0.58;
    const t = smoothstep(dist / maxDist);

    const scale = 1 - t * 0.24;
    const rotateY = (dx / (vw * 0.72)) * 19 * t;
    const rotateX = -(dy / (vh * 0.72)) * 15 * t;
    const translateZ = -t * t * 360;
    const opacity = 1 - t * 0.36;

    return { scale, rotateX, rotateY, translateZ, opacity, t };
  }, []);

  const pushVel = (vx: number, vy: number) => {
    const p = engine.current;
    p.velHistoryX.push(vx);
    p.velHistoryY.push(vy);
    if (p.velHistoryX.length > 8) {
      p.velHistoryX.shift();
      p.velHistoryY.shift();
    }
  };

  const getSmoothVel = () => {
    const p = engine.current;
    if (p.velHistoryX.length === 0) return { vx: p.velX, vy: p.velY };
    const ax = p.velHistoryX.reduce((a, b) => a + b, 0) / p.velHistoryX.length;
    const ay = p.velHistoryY.reduce((a, b) => a + b, 0) / p.velHistoryY.length;
    return {
      vx: p.velX * VELOCITY_SMOOTHING + ax * (1 - VELOCITY_SMOOTHING),
      vy: p.velY * VELOCITY_SMOOTHING + ay * (1 - VELOCITY_SMOOTHING),
    };
  };

  const reflectBounds = (p: PhysicsEngine) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxX = Math.max(0, p.worldW - vw);
    const maxY = Math.max(0, p.worldH - vh);
    let impact = 0;

    if (p.viewportX < 0) {
      impact = Math.max(impact, Math.abs(p.velX));
      p.viewportX = 0;
      p.velX = Math.abs(p.velX) * BOUNCE_RESTITUTION;
      p.velY *= TANGENTIAL_RETAIN;
    } else if (p.viewportX > maxX) {
      impact = Math.max(impact, Math.abs(p.velX));
      p.viewportX = maxX;
      p.velX = -Math.abs(p.velX) * BOUNCE_RESTITUTION;
      p.velY *= TANGENTIAL_RETAIN;
    }

    if (p.viewportY < 0) {
      impact = Math.max(impact, Math.abs(p.velY));
      p.viewportY = 0;
      p.velY = Math.abs(p.velY) * BOUNCE_RESTITUTION;
      p.velX *= TANGENTIAL_RETAIN;
    } else if (p.viewportY > maxY) {
      impact = Math.max(impact, Math.abs(p.velY));
      p.viewportY = maxY;
      p.velY = -Math.abs(p.velY) * BOUNCE_RESTITUTION;
      p.velX *= TANGENTIAL_RETAIN;
    }

    if (impact > 0.72) {
      p.reflectionCount += 1;
      p.impact = Math.max(p.impact, clamp(impact / 26, 0.16, 1));
      p.dragIntensity = Math.max(p.dragIntensity, clamp(impact / 30, 0.18, 0.75));
    }
  };

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const p = engine.current;

      if (!p.dragging) {
        const smoothed = getSmoothVel();
        p.velX = smoothed.vx;
        p.velY = smoothed.vy;
        p.viewportX += p.velX;
        p.viewportY += p.velY;
        p.velX *= AIR_DRAG;
        p.velY *= AIR_DRAG;
      }

      reflectBounds(p);

      p.floorZ += (p.targetFloorZ - p.floorZ) * FLOOR_GRAVITY;
      p.impact *= 0.89;
      p.dragIntensity *= p.dragging ? 0.94 : 0.9;
      p.recoveryActive = false;

      const speed = getSpeed(p.velX, p.velY);
      if (speed > 0.01) {
        p.directionX += (p.velX / Math.max(speed, 1) - p.directionX) * 0.14;
        p.directionY += (p.velY / Math.max(speed, 1) - p.directionY) * 0.14;
      } else {
        p.directionX *= 0.94;
        p.directionY *= 0.94;
      }

      if (Math.abs(p.velX) < MIN_VELOCITY) p.velX = 0;
      if (Math.abs(p.velY) < MIN_VELOCITY) p.velY = 0;

      if (!p.dragging && !p.snappedAnchor && getSpeed(p.velX, p.velY) < 0.82) {
        p.idleTicks += 1;
      } else {
        p.idleTicks = 0;
      }

      const state = snapshot(p);
      subscribers.current.forEach(cb => cb(p.viewportX, p.viewportY, state));
      const anchorState = snapshot(p);
      anchorSubs.current.forEach(cb => cb(p.snappedAnchor, p.snapProgress, anchorState));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const updateSnap = useCallback((anchors: SnapAnchor[]) => {
    const p = engine.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = p.viewportX + vw / 2;
    const cy = p.viewportY + vh / 2;

    let nearest: SnapAnchor | null = null;
    let nearestDist = Infinity;

    for (const anchor of anchors) {
      const d = Math.sqrt((anchor.x - cx) ** 2 + (anchor.y - cy) ** 2);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = anchor;
      }
    }

    if (nearest) {
      const magnet = nearest.magnetStrength ?? nearest.gravity ?? 1;
      const radius = SNAP_RADIUS * magnet;
      const gravityRange = radius * 2.8;
      if (nearestDist < gravityRange) {
        const dx = nearest.x - cx;
        const dy = nearest.y - cy;
        const pull = (1 - nearestDist / gravityRange) ** 2;
        p.velX += dx * GRAVITY_WELL * pull * magnet;
        p.velY += dy * GRAVITY_WELL * pull * magnet;
      }

      if (!p.dragging && p.idleTicks > EMPTY_SPACE_RETURN_TICKS) {
        const dx = nearest.x - cx;
        const dy = nearest.y - cy;
        const returnPull = Math.min(1.8, 1 + (p.idleTicks - EMPTY_SPACE_RETURN_TICKS) / 140);
        p.velX += dx * EMPTY_SPACE_RETURN_FORCE * returnPull;
        p.velY += dy * EMPTY_SPACE_RETURN_FORCE * returnPull;
        p.targetFloorZ = nearest.floor;
        p.recoveryActive = true;
        p.dragIntensity = Math.max(p.dragIntensity, 0.18);
      }

      if (nearestDist < radius) {
        const progress = 1 - nearestDist / radius;
        p.snappedAnchor = nearest;
        p.snapProgress = smoothstep(progress);
        p.targetFloorZ = nearest.floor;

        if (nearestDist < radius * 0.38 && !p.dragging) {
          p.velX *= SNAP_DAMP;
          p.velY *= SNAP_DAMP;
          p.viewportX += (nearest.x - cx) * 0.038;
          p.viewportY += (nearest.y - cy) * 0.038;
        }
      } else {
        p.snappedAnchor = null;
        p.snapProgress = 0;
      }
    }
  }, []);

  useEffect(() => {
    const p = engine.current;

    const isInteractiveTarget = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      return Boolean(el?.closest('[data-no-drag="true"], button, a, input, textarea, select, video, [role="dialog"]'));
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      if (isInteractiveTarget(e.target)) return;
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
      p.dragging = true;
      p.lastMX = cx;
      p.lastMY = cy;
      p.velX = 0;
      p.velY = 0;
      p.velHistoryX = [];
      p.velHistoryY = [];
      p.idleTicks = 0;
      p.recoveryActive = false;
      p.dragIntensity = Math.max(p.dragIntensity, 0.28);
      p.impact = Math.max(p.impact, 0.22);
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!p.dragging) return;
      e.preventDefault();
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = cx - p.lastMX;
      const dy = cy - p.lastMY;
      p.viewportX -= dx;
      p.viewportY -= dy;
      const rvx = -dx * VELOCITY_SCALE;
      const rvy = -dy * VELOCITY_SCALE;
      const moveSpeed = getSpeed(rvx, rvy);
      pushVel(rvx, rvy);
      p.velX = rvx;
      p.velY = rvy;
      p.lastMX = cx;
      p.lastMY = cy;
      p.directionX = moveSpeed > 0.01 ? rvx / moveSpeed : p.directionX;
      p.directionY = moveSpeed > 0.01 ? rvy / moveSpeed : p.directionY;
      p.dragIntensity = clamp(p.dragIntensity + moveSpeed * 0.018, 0, 1);
      p.targetFloorZ += clamp((Math.abs(dx) + Math.abs(dy)) * 0.003, 0, 0.13);
    };

    const onUp = () => {
      if (!p.dragging) return;
      p.dragging = false;
      const speed = getSpeed(p.velX, p.velY);
      if (speed > FLICK_THRESHOLD) {
        p.velX *= FLICK_BOOST;
        p.velY *= FLICK_BOOST;
        p.impact = Math.max(p.impact, clamp(speed / 20, 0.28, 1));
        p.dragIntensity = Math.max(p.dragIntensity, clamp(speed / 22, 0.34, 1));
      }
      const smoothed = getSmoothVel();
      p.velX = smoothed.vx;
      p.velY = smoothed.vy;
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchstart', onDown as EventListener, { passive: true });
    window.addEventListener('touchmove', onMove as EventListener, { passive: false });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchstart', onDown as EventListener);
      window.removeEventListener('touchmove', onMove as EventListener);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return { engine, subscribe, subscribeAnchors, updateSnap, sphericalProject };
}

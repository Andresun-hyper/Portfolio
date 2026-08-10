import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type {
  ModelAnimation,
  ModelAnimationTrack,
  ModelPart,
  ModelPreviewConfig,
  ModelViewPreset,
} from '../content/model-previews.schema';

interface Props {
  config: ModelPreviewConfig;
  language: 'en' | 'zh';
  active: boolean;
  onInteractionChange?: (interacting: boolean) => void;
}

interface LoadState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  error?: string;
}

interface AnimationGroup {
  config: ModelAnimation;
  tracks: AnimationTrackState[];
}

interface AnimationTrackState {
  config: ModelAnimationTrack;
  objects: THREE.Mesh[];
  basePositions: Map<THREE.Mesh, THREE.Vector3>;
  baseScales: Map<THREE.Mesh, THREE.Vector3>;
}

interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  neutralMaterial: THREE.MeshStandardMaterial;
  highlightMaterial: THREE.MeshStandardMaterial;
  parts: THREE.Mesh[];
  highlighted: THREE.Mesh[];
  animationGroups: Map<string, AnimationGroup>;
  animationFrame: number | null;
  animationPlaying: boolean;
  animationProgress: number;
}

const MODEL_DISPLAY_SIZE = 180;

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

function disposeLoadedMaterial(material: THREE.Material, disposed: Set<THREE.Material>) {
  if (disposed.has(material)) return;
  disposed.add(material);
  const textured = material as THREE.MeshStandardMaterial;
  [
    textured.map,
    textured.normalMap,
    textured.roughnessMap,
    textured.metalnessMap,
    textured.aoMap,
    textured.emissiveMap,
  ].forEach(texture => texture?.dispose());
  material.dispose();
}

function findPartDefinition(config: ModelPreviewConfig, mesh: THREE.Mesh, meshIndex: number): ModelPart | undefined {
  const candidateIds: string[] = [];
  const candidateNames: string[] = [];
  let current: THREE.Object3D | null = mesh;
  while (current) {
    const data = current.userData as { partId?: unknown };
    if (typeof data.partId === 'string') candidateIds.push(data.partId);
    if (current.name) candidateNames.push(current.name);
    current = current.parent;
  }

  return config.parts?.find(part => {
    const match = part.match;
    if (!match) return false;
    if (match.partId && !candidateIds.some(id => id === match.partId || id.startsWith(`${match.partId}-`))) {
      return false;
    }
    if (match.nameIncludes && !match.nameIncludes.some(fragment => candidateNames.some(name => name.includes(fragment)))) {
      return false;
    }
    if (typeof match.meshIndex === 'number' && match.meshIndex !== meshIndex) return false;
    if (match.meshRange && (meshIndex < match.meshRange[0] || meshIndex > match.meshRange[1])) return false;
    return Boolean(match.partId || match.nameIncludes || typeof match.meshIndex === 'number' || match.meshRange);
  });
}

function defaultPart(config: ModelPreviewConfig, partId: string): ModelPart {
  const isDroplet = config.model.includes('/droplet/');
  return {
    id: partId,
    labelEn: isDroplet ? 'Model component' : 'Source component',
    labelZh: isDroplet ? '模型部件' : '源模型部件',
    descriptionEn: 'Click another visible part to continue exploring the model structure.',
    descriptionZh: '继续点击其他可见部件，探索模型的结构关系。',
  };
}

function updateAnimation(group: AnimationGroup, progress: number) {
  group.tracks.forEach(track => {
    const offset = new THREE.Vector3(...track.config.offset);
    const scale = track.config.scale ? new THREE.Vector3(...track.config.scale) : null;
    track.objects.forEach(object => {
      const base = track.basePositions.get(object);
      if (base) object.position.copy(base).addScaledVector(offset, progress);

      const baseScale = track.baseScales.get(object);
      if (scale && baseScale) {
        object.scale.copy(baseScale).multiply(
          new THREE.Vector3(
            THREE.MathUtils.lerp(1, scale.x, progress),
            THREE.MathUtils.lerp(1, scale.y, progress),
            THREE.MathUtils.lerp(1, scale.z, progress),
          ),
        );
      }
    });
  });
}

function getFallbackPartId(config: ModelPreviewConfig, meshIndex: number) {
  if (config.model.includes('/aquara/')) return `aquara-mesh-${meshIndex}`;
  if (!config.model.includes('/droplet/')) return `model-mesh-${meshIndex}`;
  if (meshIndex === 37) return 'droplet-bottom-shell';
  if (meshIndex === 38) return 'droplet-tray-handle';
  if (meshIndex >= 35) return 'droplet-water-tank';
  if (meshIndex === 9) return 'droplet-grip';
  if (meshIndex === 10) return 'droplet-spout';
  if (meshIndex >= 11) return 'droplet-flow-channel';
  return 'droplet-body';
}

export default function ModelViewer({ config, language, active, onInteractionChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'idle', progress: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const sceneRef = useRef<SceneState | null>(null);
  const activePartRef = useRef<string | null>(null);
  const lockedPartRef = useRef<string | null>(null);
  const lockedMeshRef = useRef<THREE.Mesh | null>(null);
  const draggingRef = useRef(false);
  const webgl = useMemo(() => supportsWebGL(), []);
  const animation = config.animations?.[0];

  const notifyInteraction = useCallback((interacting: boolean) => {
    onInteractionChange?.(interacting);
  }, [onInteractionChange]);

  const resetView = useCallback(() => {
    const state = sceneRef.current;
    if (!state) return;
    const defaultPosition = state.scene.userData.modelCameraPosition as THREE.Vector3 | undefined;
    const defaultTarget = state.scene.userData.modelTarget as THREE.Vector3 | undefined;
    if (defaultPosition) state.camera.position.copy(defaultPosition);
    if (defaultTarget) state.controls.target.copy(defaultTarget);
    state.controls.update();
    state.renderer.render(state.scene, state.camera);
  }, []);

  const goToView = useCallback((view: ModelViewPreset) => {
    const state = sceneRef.current;
    if (!state) return;
    state.camera.position.set(view.position[0], view.position[1], view.position[2]);
    state.controls.target.set(view.target[0], view.target[1], view.target[2]);
    state.controls.update();
    state.renderer.render(state.scene, state.camera);
  }, []);

  const stopAnimation = useCallback((reset = false) => {
    const state = sceneRef.current;
    if (!state || !animation) return;
    state.animationPlaying = false;
    if (state.animationFrame !== null) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }
    const group = state.animationGroups.get(animation.id);
    if (group) updateAnimation(group, reset ? 0 : state.animationProgress);
    if (reset) {
      state.animationProgress = 0;
      setAnimationProgress(0);
    }
    setAnimationPlaying(false);
    state.renderer.render(state.scene, state.camera);
  }, [animation]);

  const playAnimation = useCallback(() => {
    const state = sceneRef.current;
    if (!state || !animation) return;
    const group = state.animationGroups.get(animation.id);
    if (!group || !group.tracks.some(track => track.objects.length > 0)) return;
    if (state.animationPlaying) {
      stopAnimation();
      return;
    }

    const duration = animation.durationMs ?? 1400;
    const startAt = performance.now() - state.animationProgress * duration;
    state.animationPlaying = true;
    setAnimationPlaying(true);
    const tick = (now: number) => {
      if (!sceneRef.current || sceneRef.current !== state || !state.animationPlaying) return;
      const progress = Math.min(1, (now - startAt) / duration);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      updateAnimation(group, eased);
      state.animationProgress = progress;
      setAnimationProgress(progress);
      state.renderer.render(state.scene, state.camera);
      if (progress >= 1) {
        state.animationPlaying = false;
        state.animationFrame = null;
        setAnimationPlaying(false);
        return;
      }
      state.animationFrame = requestAnimationFrame(tick);
    };
    state.animationFrame = requestAnimationFrame(tick);
  }, [animation, stopAnimation]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !webgl || !active) return undefined;

    let disposed = false;
    let state: SceneState | null = null;

    const build = () => {
      if (disposed) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xe8efed);

      const camera = new THREE.PerspectiveCamera(config.camera?.fov ?? 40, 1, 0.1, 2000);
      const configuredPosition = config.camera?.position ?? [220, 120, 260];
      camera.position.set(configuredPosition[0], configuredPosition[1], configuredPosition[2]);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.88;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.autoRotate = false;
      controls.minDistance = 30;
      controls.maxDistance = 900;

      const neutralMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.12,
        roughness: 0.76,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      const highlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xd8fff4,
        emissive: 0x16b995,
        emissiveIntensity: 0.62,
        roughness: 0.5,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
      scene.add(new THREE.HemisphereLight(0xffffff, 0xc4d0cd, 0.78));
      const key = new THREE.DirectionalLight(0xffffff, 0.92);
      key.position.set(220, 320, 260);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.28);
      fill.position.set(-180, 120, -240);
      scene.add(fill);

      state = {
        scene,
        camera,
        renderer,
        controls,
        neutralMaterial,
        highlightMaterial,
        parts: [],
        highlighted: [],
        animationGroups: new Map(),
        animationFrame: null,
        animationPlaying: false,
        animationProgress: 0,
      };
      sceneRef.current = state;

      const render = () => {
        if (!state || disposed) return;
        state.renderer.render(state.scene, state.camera);
      };
      controls.addEventListener('change', render);

      const frameModel = (root: THREE.Object3D) => {
        root.updateWorldMatrix(true, true);
        let bounds = new THREE.Box3().setFromObject(root);
        if (bounds.isEmpty()) return;

        const size = bounds.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 0) {
          root.scale.multiplyScalar(MODEL_DISPLAY_SIZE / maxDimension);
          root.updateWorldMatrix(true, true);
          bounds = new THREE.Box3().setFromObject(root);
        }

        const center = bounds.getCenter(new THREE.Vector3());
        root.position.x -= center.x;
        root.position.y -= bounds.min.y;
        root.position.z -= center.z;
        root.updateWorldMatrix(true, true);
        bounds = new THREE.Box3().setFromObject(root);

        const modelCenter = bounds.getCenter(new THREE.Vector3());
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        const direction = new THREE.Vector3(
          configuredPosition[0],
          configuredPosition[1],
          configuredPosition[2],
        ).normalize();
        const distance = Math.max(250, sphere.radius * 3.1);
        const cameraPosition = modelCenter.clone().add(direction.multiplyScalar(distance));
        camera.position.copy(cameraPosition);
        camera.near = Math.max(0.01, sphere.radius / 100);
        camera.far = Math.max(2000, sphere.radius * 24);
        camera.updateProjectionMatrix();
        controls.target.copy(modelCenter);
        controls.minDistance = Math.max(8, sphere.radius * 0.25);
        controls.maxDistance = Math.max(700, sphere.radius * 8);
        controls.update();
        scene.userData.modelCameraPosition = camera.position.clone();
        scene.userData.modelTarget = modelCenter.clone();
      };

      const clearHighlight = () => {
        if (!state) return;
        state.highlighted.forEach(mesh => {
          mesh.material = state!.neutralMaterial;
        });
        state.highlighted = [];
      };

      const highlightMesh = (mesh: THREE.Mesh | null) => {
        if (!state) return;
        clearHighlight();
        if (mesh) {
          state.highlighted = [mesh];
          mesh.material = state.highlightMaterial;
        }
        state.renderer.render(state.scene, state.camera);
      };

      const pickMesh = (event: PointerEvent) => {
        if (!state) return null;
        const rect = renderer.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(state.parts, false)[0];
        return hit?.object instanceof THREE.Mesh ? hit.object : null;
      };

      const onPointerMove = (event: PointerEvent) => {
        if (draggingRef.current || !state) return;
        const mesh = pickMesh(event);
        const partId = mesh?.userData.modelPartId as string | undefined;
        renderer.domElement.style.cursor = mesh ? 'pointer' : 'grab';
        if (partId === activePartRef.current) return;
        activePartRef.current = partId ?? null;
        if (lockedPartRef.current) return;
        highlightMesh(mesh);
      };
      const onPointerLeave = () => {
        if (lockedPartRef.current) return;
        activePartRef.current = null;
        highlightMesh(null);
      };
      const onClick = (event: PointerEvent) => {
        if (draggingRef.current || !state) return;
        const mesh = pickMesh(event);
        const partId = mesh?.userData.modelPartId as string | undefined;
        if (!mesh || !partId) return;
        const nextMesh = lockedMeshRef.current === mesh ? null : mesh;
        const nextPartId = nextMesh ? partId : null;
        lockedMeshRef.current = nextMesh;
        lockedPartRef.current = nextPartId;
        activePartRef.current = nextPartId;
        highlightMesh(nextMesh);
        setActivePartId(nextPartId);
      };
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerleave', onPointerLeave);
      renderer.domElement.addEventListener('click', onClick);

      const buildAnimationGroups = () => {
        if (!state) return;
        state.animationGroups.clear();
        config.animations?.forEach(animationConfig => {
          const trackConfigs = animationConfig.tracks ?? [{
            partIds: animationConfig.partIds,
            offset: animationConfig.offset,
          }];
          const tracks = trackConfigs.map(trackConfig => {
            const objects = state!.parts.filter(mesh => trackConfig.partIds.includes(mesh.userData.modelPartId as string));
            return {
              config: trackConfig,
              objects,
              basePositions: new Map(objects.map(object => [object, object.position.clone()])),
              baseScales: new Map(objects.map(object => [object, object.scale.clone()])),
            };
          });
          state!.animationGroups.set(animationConfig.id, {
            config: animationConfig,
            tracks,
          });
        });
      };

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        config.model,
        gltf => {
          if (disposed || !state) return;
          const root = gltf.scene;
          scene.add(root);
          frameModel(root);

          const disposedMaterials = new Set<THREE.Material>();
          root.traverse(child => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh || !state) return;
            const meshIndex = state.parts.length;
            const originals = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            originals.forEach(material => disposeLoadedMaterial(material, disposedMaterials));
            mesh.material = state.neutralMaterial;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            if (config.model.includes('/droplet/') && meshIndex === 6) {
              // Keep the inner drinking cup in the white preview, but rebuild
              // its normals so the source's faceted bands do not read as
              // vertical stripes.
              mesh.geometry.deleteAttribute('normal');
              mesh.geometry.computeVertexNormals();
            }
            if (config.model.includes('/aquara/') && (
              mesh.name === 'aquara-part-1423'
              || mesh.name === 'aquara-part-1520'
              || mesh.name === 'aquara-part-3959'
            )) {
              // These are coincident presentation copies of the upper shell.
              // Keep the merged 3962 shell so the housing renders as one clean
              // surface instead of z-fighting triangular patches.
              mesh.visible = false;
            }
            const part = findPartDefinition(config, mesh, meshIndex);
            mesh.userData.modelPartId = part?.id ?? getFallbackPartId(config, meshIndex);
            state.parts.push(mesh);
          });
          buildAnimationGroups();
          setLoadState({ status: 'ready', progress: 100 });
          render();
        },
        xhr => {
          if (disposed) return;
          const total = xhr.total || 1;
          setLoadState({ status: 'loading', progress: Math.min(100, Math.round((xhr.loaded / total) * 100)) });
        },
        error => {
          if (disposed) return;
          if (config.model.includes('/droplet/')) {
            buildProceduralModel();
          } else {
            setLoadState({
              status: 'error',
              progress: 0,
              error: error instanceof Error ? error.message : 'GLB load failed',
            });
          }
        },
      );

      const buildProceduralModel = () => {
        if (disposed || !state) return;
        const group = new THREE.Group();
        const addPart = (
          geometry: THREE.BufferGeometry,
          position: [number, number, number],
          rotationX = 0,
          rotationZ = 0,
        ) => {
          const mesh = new THREE.Mesh(geometry, state!.neutralMaterial);
          const meshIndex = state!.parts.length;
          mesh.position.set(position[0], position[1], position[2]);
          mesh.rotation.x = rotationX;
          mesh.rotation.z = rotationZ;
          mesh.userData.modelPartId = getFallbackPartId(config, meshIndex);
          group.add(mesh);
          state!.parts.push(mesh);
        };
        addPart(new THREE.CylinderGeometry(33.5, 31, 12, 24), [0, 6, 0]);
        addPart(new THREE.CylinderGeometry(33, 33.5, 60, 24), [0, 42, 0]);
        addPart(new THREE.CylinderGeometry(32.5, 33, 50, 24), [0, 97, 0]);
        addPart(new THREE.CylinderGeometry(30, 32.5, 45, 24), [0, 144, 0]);
        addPart(new THREE.BoxGeometry(6, 65, 16), [-31, 90, 0]);
        addPart(new THREE.BoxGeometry(6, 65, 16), [31, 90, 0]);
        addPart(new THREE.CylinderGeometry(11, 14, 25, 24), [0, 175, 0]);
        addPart(new THREE.CylinderGeometry(30.5, 30.5, 14, 24), [0, 185, 0]);
        addPart(new THREE.TorusGeometry(15, 3.5, 12, 24), [0, 198, 0], Math.PI / 2);
        scene.add(group);
        frameModel(group);
        buildAnimationGroups();
        setLoadState({ status: 'ready', progress: 100 });
        render();
      };

      const onResize = () => {
        if (!state) return;
        const width = mount.clientWidth || 1;
        const height = mount.clientHeight || 1;
        state.camera.aspect = width / height;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(width, height, false);
        render();
      };

      const onStart = () => {
        draggingRef.current = true;
        notifyInteraction(true);
      };
      const onEnd = () => {
        draggingRef.current = false;
        notifyInteraction(false);
      };
      controls.addEventListener('start', onStart);
      controls.addEventListener('end', onEnd);

      const ro = new ResizeObserver(onResize);
      ro.observe(mount);
      onResize();

      return () => {
        ro.disconnect();
        controls.removeEventListener('change', render);
        controls.removeEventListener('start', onStart);
        controls.removeEventListener('end', onEnd);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
        renderer.domElement.removeEventListener('click', onClick);
      };
    };

    const detach = build();
    return () => {
      disposed = true;
      detach?.();
      const current = sceneRef.current;
      if (!current) return;
      current.animationPlaying = false;
      if (current.animationFrame !== null) cancelAnimationFrame(current.animationFrame);
      current.controls.dispose();
      current.renderer.dispose();
      current.neutralMaterial.dispose();
      current.highlightMaterial.dispose();
      current.scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      lockedMeshRef.current = null;
      if (current.renderer.domElement.parentNode === mount) {
        mount.removeChild(current.renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [active, config, notifyInteraction, reloadKey, webgl]);

  const copy = {
    loading: language === 'zh' ? '正在加载 3D 模型…' : 'Loading 3D model…',
    error: language === 'zh' ? '模型加载失败' : 'Model failed to load',
    retry: language === 'zh' ? '重试' : 'Retry',
    reset: language === 'zh' ? '复位视角' : 'Reset view',
    rotate: language === 'zh' ? '拖动旋转 · 滚轮缩放 · 点击部件查看说明' : 'Drag to rotate · Scroll to zoom · Click a part for details',
    noWebgl: language === 'zh' ? '当前浏览器不支持 WebGL，显示静态预览。' : 'WebGL is not supported in this browser; showing static preview.',
    play: language === 'zh' ? '播放演示' : 'Play animation',
    pause: language === 'zh' ? '暂停演示' : 'Pause animation',
    animationReset: language === 'zh' ? '复位动画' : 'Reset animation',
    hoverLabel: language === 'zh' ? '部件说明' : 'PART DETAIL',
    clickHint: language === 'zh' ? '点击其他部件可切换说明' : 'Click another part to switch',
    closePart: language === 'zh' ? '关闭部件说明' : 'Close part detail',
  };

  const activePart = activePartId
    ? config.parts?.find(part => part.id === activePartId) ?? defaultPart(config, activePartId)
    : null;
  const views = animation ? [] : config.views ?? [];

  return (
    <div className="model-viewer" data-no-page-swipe="true" data-no-drag="true">
      <div
        ref={mountRef}
        className="model-viewer-stage"
        style={{ touchAction: 'none' }}
        aria-label={language === 'zh' ? '可交互 3D 模型查看器' : 'Interactive 3D model viewer'}
      >
        {!webgl && (
          <div className="model-viewer-fallback">
            <img src={config.fallbackImage} alt={config.model} draggable={false} />
            <p>{copy.noWebgl}</p>
          </div>
        )}

        {webgl && loadState.status === 'idle' && (
          <div className="model-viewer-loading">
            <span className="model-viewer-spinner" aria-hidden="true" />
            <p>{copy.loading}</p>
          </div>
        )}

        {webgl && loadState.status === 'loading' && (
          <div className="model-viewer-loading">
            <span className="model-viewer-spinner" aria-hidden="true" />
            <div className="model-viewer-progress"><i style={{ width: `${loadState.progress}%` }} /></div>
            <p>{copy.loading} {loadState.progress}%</p>
          </div>
        )}

        {webgl && loadState.status === 'error' && (
          <div className="model-viewer-error">
            <img src={config.fallbackImage} alt={config.model} draggable={false} />
            <p>{copy.error}</p>
            <button type="button" onClick={() => setReloadKey(key => key + 1)}>{copy.retry}</button>
          </div>
        )}
      </div>

      {webgl && loadState.status === 'ready' && activePart && (
        <aside className="model-viewer-info-card" aria-live="polite" onPointerDown={event => event.stopPropagation()}>
          <div className="model-viewer-info-kicker">
            <span>{copy.hoverLabel}</span>
            <button
              type="button"
              aria-label={copy.closePart}
              onClick={() => {
                activePartRef.current = null;
                lockedPartRef.current = null;
                lockedMeshRef.current = null;
                sceneRef.current?.highlighted.forEach(mesh => {
                  mesh.material = sceneRef.current!.neutralMaterial;
                });
                sceneRef.current!.highlighted = [];
                sceneRef.current?.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
                setActivePartId(null);
              }}
            >
              ×
            </button>
          </div>
          <strong>{language === 'zh' ? activePart.labelZh : activePart.labelEn}</strong>
          <p>{language === 'zh' ? activePart.descriptionZh : activePart.descriptionEn}</p>
          <small>{copy.clickHint}</small>
        </aside>
      )}

      {webgl && loadState.status === 'ready' && (
        <div className="model-viewer-toolbar">
          <div className="model-viewer-controls">
            <button type="button" onClick={resetView} title={copy.reset}>{copy.reset}</button>
            {animation && (
              <button type="button" className={animationPlaying ? 'active' : ''} onClick={playAnimation}>
                {animationPlaying ? copy.pause : copy.play}
              </button>
            )}
          </div>

          {animation && (
            <div className="model-viewer-animation-control" role="group" aria-label={language === 'zh' ? '结构动画' : 'Animation controls'}>
              <div className="model-viewer-animation-label">
                <span>{language === 'zh' ? animation.labelZh : animation.labelEn}</span>
                <button type="button" onClick={() => stopAnimation(true)}>{copy.animationReset}</button>
              </div>
              <div className="model-viewer-animation-progress" aria-hidden="true">
                <i style={{ width: `${animationProgress * 100}%` }} />
              </div>
            </div>
          )}

          {views.length > 0 && (
            <div className="model-viewer-views" role="group" aria-label={language === 'zh' ? '预设视角' : 'Preset views'}>
              {views.map(view => (
                <button key={view.id} type="button" onClick={() => goToView(view)}>
                  {language === 'zh' ? view.labelZh : view.labelEn}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {webgl && loadState.status === 'ready' && (
        <div className="model-viewer-hint">{copy.rotate}</div>
      )}
    </div>
  );
}

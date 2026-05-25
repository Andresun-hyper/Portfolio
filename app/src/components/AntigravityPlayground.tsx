import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  Github,
  Mail,
  MousePointer2,
  Phone,
  Play,
  RotateCcw,
  Search,
  X,
  ZoomIn,
} from 'lucide-react';

const MATTER_CDN = 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js';
const RESUME_FILE = './孙启圣_字节跳动_简历 1.pdf';
const GITHUB_URL = 'https://github.com/Andresun-hyper';

const SEARCH_SUGGESTIONS = [
  '孙启圣 ByteDance PDF Resume',
  'Wrist Rehabilitation',
  'AQUARA Robot',
  'DROPLET Bottle',
  'Industrial Design',
  'UX Prototype',
  'AI Workflow',
];

const skillTags = [
  { title: 'Industrial Design', detail: 'form / CMF / systems' },
  { title: 'UX Prototype', detail: 'flow / UI / demo' },
  { title: 'AI Workflow', detail: 'visual iteration' },
  { title: 'Rhino / KeyShot', detail: 'product rendering' },
  { title: 'React Demo', detail: 'interactive proof' },
  { title: 'Portfolio Storytelling', detail: 'hiring evidence' },
];

type Accent = 'teal' | 'gold' | 'black';
type ProjectId = 'wrist' | 'aquara' | 'droplet';
type OpenTarget = 'home' | 'projects' | 'contact' | 'resume' | 'github' | 'search' | ProjectId;
type ProjectTabKey = 'overview' | 'process' | 'output' | 'ai';

interface GalleryItem {
  src: string;
  label: string;
  caption: string;
  evidenceType: string;
  type?: 'image' | 'video';
}

interface ProjectTab {
  id: ProjectTabKey;
  label: string;
  title: string;
  body: string;
  bullets: string[];
}

interface Project {
  id: ProjectId;
  title: string;
  subtitle: string;
  range: string;
  accent: Accent;
  cover: string;
  summary: string;
  role: string;
  problem: string;
  output: string;
  tools: string;
  aiRole: string;
  tags: string[];
  gallery: GalleryItem[];
  tabs: ProjectTab[];
}

interface ActiveMedia {
  projectId: ProjectId;
  index: number;
}

const projects: Project[] = [
  {
    id: 'wrist',
    title: 'WRIST REHABILITATION',
    subtitle: 'Home rehab UX prototype',
    range: 'P.03-07',
    accent: 'teal',
    cover: './rehab-phone-mockup.png',
    summary: 'A runnable rehabilitation app prototype built around safety confirmation, guided movement feedback, result review, and a replayable local demo flow.',
    role: 'UX prototype design / local demo / interaction flow validation',
    problem: 'Home rehabilitation users need clear safety confirmation, movement feedback, and reviewable training results without turning the product into a medical black box.',
    output: 'A complete app prototype and video evidence set that explains calibration, training, scoring, review, and task continuation.',
    tools: 'React Demo / UI Mockup / Video Prototype',
    aiRole: 'AI was used to accelerate interface assets, demo narrative, and visual iteration while the interaction structure remained design-led.',
    tags: ['UX PROTOTYPE', 'HEALTH REHAB', 'LOCAL DEMO', 'FLOW + UI + VIDEO'],
    gallery: [
      {
        src: './rehab-source-render.png',
        label: 'UI SOURCE',
        caption: 'Core app interface evidence organized around the training flow rather than a single static screen.',
        evidenceType: 'Prototype evidence',
      },
      {
        src: './fracture-rehab-flow.jpg',
        label: '4 STEP FLOW',
        caption: 'A four-step flow showing how users move from calibration into training and then back to result feedback.',
        evidenceType: 'Flow evidence',
      },
      {
        src: './fracture-rehab-board.jpg',
        label: 'RESEARCH BOARD',
        caption: 'Problem framing and early research evidence for rehabilitation constraints, risks, and interaction opportunities.',
        evidenceType: 'Research evidence',
      },
      {
        src: './fracture-rehab-demo.mp4',
        label: 'DEMO VIDEO',
        type: 'video',
        caption: 'Local prototype video used to verify rhythm, feedback, and demonstration completeness.',
        evidenceType: 'Motion evidence',
      },
    ],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        title: 'Visible feedback for home rehab',
        body: 'The project translates training from a vague completion task into a process users can judge, record, and review.',
        bullets: ['Target user: home rehabilitation training', 'Core value: reduce training uncertainty', 'Deliverable: playable app prototype and flow pages'],
      },
      {
        id: 'process',
        label: 'Process',
        title: 'From safety calibration to result review',
        body: 'The flow handles safety confidence first, then moves into motion recognition, score feedback, and task continuation.',
        bullets: ['Pre-training check and calibration', 'Feedback during movement', 'Post-training result and task mapping'],
      },
      {
        id: 'output',
        label: 'Output',
        title: 'A demo that explains the experience directly',
        body: 'UI, flow diagrams, and video together provide hiring evidence that can be evaluated quickly.',
        bullets: ['Interface system', 'Four-step user flow', 'Playable video sample'],
      },
      {
        id: 'ai',
        label: 'AI Workflow',
        title: 'AI as iteration support',
        body: 'AI helped produce visual states and demo material, while the product logic was constrained by the rehabilitation scenario.',
        bullets: ['Fast interface mood exploration', 'Demo storytelling support', 'Explainable interaction structure'],
      },
    ],
  },
  {
    id: 'aquara',
    title: 'AQUARA',
    subtitle: 'Aquarium cleaning robot',
    range: 'P.08-12',
    accent: 'gold',
    cover: './aqua-robot-cover.webp',
    summary: 'A product concept for mid-to-large aquariums, combining wall-cleaning, dock charging, self-cleaning, form language, and CMF presentation.',
    role: 'Industrial design / product strategy / structure and CMF expression',
    problem: 'Large aquariums accumulate algae quickly, while manual cleaning is frequent, disruptive, and hard to keep consistent.',
    output: 'A robot product concept covering the body, charging dock, cleaning route, and visual presentation system.',
    tools: 'Rhino / KeyShot / Photoshop / AI-assisted Rendering',
    aiRole: 'AI supported rendering mood and visual exploration; the product route and structure came from scenario constraints.',
    tags: ['INDUSTRIAL DESIGN', 'ROBOTICS', 'CMF', 'AI RENDERING'],
    gallery: [
      {
        src: './aqua-robot-views.webp',
        label: 'SIX VIEWS',
        caption: 'Six-view evidence showing product proportion, surface relationships, and key form decisions.',
        evidenceType: 'Form evidence',
      },
      {
        src: './aqua-robot-system.webp',
        label: 'SYSTEM CARD',
        caption: 'System card explaining the relationship between the robot, dock, and cleaning scenario.',
        evidenceType: 'System evidence',
      },
      {
        src: './aqua-robot-detail.webp',
        label: 'DETAIL RENDER',
        caption: 'Detail render for structure, material contrast, and product identity cues.',
        evidenceType: 'CMF evidence',
      },
    ],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        title: 'A low-intervention cleaning system',
        body: 'AQUARA integrates cleaning, docking, and self-maintenance into one home aquarium care system.',
        bullets: ['Scenario: mid-to-large aquariums', 'Target: algae and wall cleaning', 'Output: robot and dock concept'],
      },
      {
        id: 'process',
        label: 'Process',
        title: 'From pain point to product route',
        body: 'The project first defines work boundaries and route logic, then uses form iteration to make the product credible.',
        bullets: ['Cleaning path reasoning', 'Docking and self-cleaning logic', 'Form proportion and structural components'],
      },
      {
        id: 'output',
        label: 'Output',
        title: 'Complete industrial design evidence',
        body: 'Views, system cards, and detail rendering support the concept beyond a single hero image.',
        bullets: ['Six views', 'System explanation', 'Detail and material render'],
      },
      {
        id: 'ai',
        label: 'AI Workflow',
        title: 'AI supports expression, not structure',
        body: 'AI helped explore presentation quality, while function and assembly logic were set by design judgment.',
        bullets: ['Rendering mood exploration', 'Composition iteration', 'Final evidence anchored in product logic'],
      },
    ],
  },
  {
    id: 'droplet',
    title: 'DROPLET',
    subtitle: 'Outdoor pet hydration product',
    range: 'P.13-17',
    accent: 'black',
    cover: './droplet-source-render.png',
    summary: 'A pet hydration product for outdoor exercise, focused on carry, drinking, backflow control, and electrolyte supplement scenarios.',
    role: 'Industrial design / scenario research / product rendering and AIGC expression',
    problem: 'Outdoor exercise creates hydration, hygiene, and carry problems for pets and owners that ordinary bottles do not solve cleanly.',
    output: 'A product concept covering usage flow, structural expression, rendering, and scenario presentation.',
    tools: 'Sketch / Rhino / KeyShot / Midjourney / Photoshop',
    aiRole: 'AI accelerated scenario mood and material exploration, then sketches and structure diagrams narrowed the final direction.',
    tags: ['PET PRODUCT', 'SCENARIO RESEARCH', 'PRODUCT RENDER', 'CMF'],
    gallery: [
      {
        src: './droplet-source-render.png',
        label: 'SOURCE RENDER',
        caption: 'Main render showing posture, proportion, and outdoor exercise context.',
        evidenceType: 'Hero render',
      },
      {
        src: './pet-bottle-render.webp',
        label: 'PRODUCT RENDER',
        caption: 'Product rendering focused on structure, material, and hand-held relation.',
        evidenceType: 'Render evidence',
      },
      {
        src: './pet-bottle-sketch.webp',
        label: 'SKETCH BOARD',
        caption: 'Sketch board explaining form exploration, structural direction, and scenario assumptions.',
        evidenceType: 'Sketch evidence',
      },
      {
        src: './pet-bottle-flow.webp',
        label: 'FLOW DETAIL',
        caption: 'Usage detail explaining drinking, backflow, and carry as one experience loop.',
        evidenceType: 'Usage evidence',
      },
    ],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        title: 'Hydration after outdoor exercise',
        body: 'DROPLET compresses carry, drinking, supplement, and backflow control into one product action.',
        bullets: ['Users: outdoor pets and owners', 'Goal: reduce hydration and carry burden', 'Output: concept and scenario render'],
      },
      {
        id: 'process',
        label: 'Process',
        title: 'Scenario-led product reasoning',
        body: 'The project starts from dehydration risk after outdoor activity, then derives grip, drinking, backflow, and refill structure.',
        bullets: ['Scenario pain-point mapping', 'Sketch form exploration', 'Closed-loop usage flow'],
      },
      {
        id: 'output',
        label: 'Output',
        title: 'From sketch to render',
        body: 'Sketches, flow diagrams, renders, and scenarios make the product direction easier to evaluate.',
        bullets: ['Sketch board', 'Product render', 'Usage flow detail'],
      },
      {
        id: 'ai',
        label: 'AI Workflow',
        title: 'AI speeds visual exploration',
        body: 'AI helped build the display atmosphere and narrative, then product logic filtered the usable direction.',
        bullets: ['Scenario mood generation', 'Material and light exploration', 'Cross-check with sketch and model output'],
      },
    ],
  },
];

interface MatterWorld {
  gravity: {
    x: number;
    y: number;
    scale?: number;
  };
}

interface MatterEngine {
  world: MatterWorld;
}

interface MatterBody {
  position: {
    x: number;
    y: number;
  };
  angle: number;
}

interface MatterMouse {
  element: HTMLElement;
  pixelRatio: number;
  offset?: {
    x: number;
    y: number;
  };
}

interface MatterMouseConstraint {
  mouse: MatterMouse;
  constraint: {
    stiffness: number;
    angularStiffness: number;
    render: {
      visible: boolean;
    };
  };
}

type MatterEntity = MatterBody | MatterMouseConstraint;

interface MatterApi {
  Engine: {
    create: () => MatterEngine;
    update: (engine: MatterEngine, delta: number) => void;
    clear: (engine: MatterEngine) => void;
  };
  World: {
    add: (world: MatterWorld, entity: MatterEntity | MatterEntity[]) => void;
    clear: (world: MatterWorld, keepStatic: boolean) => void;
  };
  Bodies: {
    rectangle: (
      x: number,
      y: number,
      width: number,
      height: number,
      options?: Record<string, unknown>,
    ) => MatterBody;
  };
  Body: {
    applyForce: (body: MatterBody, position: { x: number; y: number }, force: { x: number; y: number }) => void;
    setVelocity: (body: MatterBody, velocity: { x: number; y: number }) => void;
    setAngularVelocity: (body: MatterBody, velocity: number) => void;
  };
  Mouse: {
    create: (element: HTMLElement) => MatterMouse;
    clearSourceEvents?: (mouse: MatterMouse) => void;
  };
  MouseConstraint: {
    create: (
      engine: MatterEngine,
      options: {
        mouse: MatterMouse;
        constraint: MatterMouseConstraint['constraint'];
      },
    ) => MatterMouseConstraint;
  };
}

interface PhysicsItem {
  element: HTMLElement;
  body: MatterBody;
  left: number;
  top: number;
  width: number;
  height: number;
  driftSeed: number;
}

interface WindowWithMatter extends Window {
  Matter?: MatterApi;
}

function getMatter() {
  return (window as WindowWithMatter).Matter;
}

function loadMatter() {
  const loaded = getMatter();
  if (loaded) return Promise.resolve(loaded);

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${MATTER_CDN}"]`);
  if (existing) {
    return new Promise<MatterApi>((resolve, reject) => {
      existing.addEventListener('load', () => {
        const matter = getMatter();
        if (matter) resolve(matter);
        else reject(new Error('Matter.js script loaded without exposing window.Matter.'));
      }, { once: true });
      existing.addEventListener('error', () => reject(new Error('Matter.js failed to load.')), { once: true });
    });
  }

  return new Promise<MatterApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MATTER_CDN;
    script.async = true;
    script.onload = () => {
      const matter = getMatter();
      if (matter) resolve(matter);
      else reject(new Error('Matter.js script loaded without exposing window.Matter.'));
    };
    script.onerror = () => reject(new Error('Matter.js failed to load.'));
    document.head.appendChild(script);
  });
}

function accentClass(accent: Accent) {
  return `accent-${accent}`;
}

function resetElementStyle(element: HTMLElement) {
  element.style.position = '';
  element.style.left = '';
  element.style.top = '';
  element.style.width = '';
  element.style.height = '';
  element.style.margin = '';
  element.style.zIndex = '';
  element.style.transform = '';
  element.style.willChange = '';
}

function createBounds(Matter: MatterApi, width: number, height: number) {
  const wall = 180;
  return [
    Matter.Bodies.rectangle(width / 2, -wall / 2, width + wall * 2, wall, { isStatic: true }),
    Matter.Bodies.rectangle(width / 2, height + wall / 2, width + wall * 2, wall, { isStatic: true }),
    Matter.Bodies.rectangle(-wall / 2, height / 2, wall, height + wall * 2, { isStatic: true }),
    Matter.Bodies.rectangle(width + wall / 2, height / 2, wall, height + wall * 2, { isStatic: true }),
  ];
}

function getSuggestionTarget(suggestion: string): OpenTarget {
  if (suggestion.toLowerCase().includes('resume') || suggestion.includes('简历')) return 'resume';
  if (suggestion.includes('Wrist')) return 'wrist';
  if (suggestion.includes('AQUARA')) return 'aquara';
  if (suggestion.includes('DROPLET')) return 'droplet';
  if (suggestion.includes('Industrial') || suggestion.includes('UX') || suggestion.includes('AI')) return 'contact';
  return 'projects';
}

function isFixedControlTarget(target: EventTarget | null) {
  const element = target instanceof Element ? target : null;
  return Boolean(element?.closest(
    [
      '.gravity-control',
      '.antigravity-close',
      '.detail-back',
      '.antigravity-nav',
      '.antigravity-topline',
      '.antigravity-skill-tags',
      '.project-tabs',
      '.gallery-row',
      '.project-bottom-row',
      '.media-overlay',
      '.contact-link-grid',
      '.contact-resume-card',
      '.resume-open-link',
    ].join(', '),
  ));
}

function getProjectMedia(project: Project): GalleryItem[] {
  return [
    {
      src: project.cover,
      label: `${project.title} COVER`,
      caption: project.summary,
      evidenceType: 'Cover evidence',
    },
    ...project.gallery,
  ];
}

export default function AntigravityPlayground({ onClose }: { onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const homeRef = useRef<HTMLElement>(null);
  const projectsRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, target: null as HTMLElement | null, moved: false });
  const suppressClickRef = useRef(false);
  const [query, setQuery] = useState(SEARCH_SUGGESTIONS[0]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [gravityEnabled, setGravityEnabled] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [activeProjectId, setActiveProjectId] = useState<ProjectId | null>(null);
  const [pendingScroll, setPendingScroll] = useState<'home' | 'projects' | 'contact' | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<ProjectId, ProjectTabKey>>({
    wrist: 'overview',
    aquara: 'overview',
    droplet: 'overview',
  });
  const [activeMedia, setActiveMedia] = useState<ActiveMedia | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const activeSuggestion = SEARCH_SUGGESTIONS[suggestionIndex];
  const activeProject = useMemo(
    () => projects.find(project => project.id === activeProjectId) ?? projects[0],
    [activeProjectId],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSuggestionIndex(index => (index + 1) % SEARCH_SUGGESTIONS.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let resizeTimer = 0;
    let engine: MatterEngine | null = null;
    let mouseConstraint: MatterMouseConstraint | null = null;
    let MatterRef: MatterApi | null = null;
    const effectRoot = rootRef.current;
    const items: PhysicsItem[] = [];

    const cleanupWorld = () => {
      if (raf) cancelAnimationFrame(raf);
      if (resizeTimer) window.clearTimeout(resizeTimer);
      if (MatterRef && mouseConstraint) {
        MatterRef.Mouse.clearSourceEvents?.(mouseConstraint.mouse);
      }
      if (MatterRef && engine) {
        MatterRef.World.clear(engine.world, false);
        MatterRef.Engine.clear(engine);
      }
      items.splice(0).forEach(item => resetElementStyle(item.element));
      rootRef.current?.classList.remove('is-physics-live');
      engine = null;
      mouseConstraint = null;
    };

    if (gravityEnabled || activeProjectId || activeMedia) {
      Array.from(effectRoot?.querySelectorAll<HTMLElement>('[data-antigravity-body]') ?? [])
        .forEach(resetElementStyle);
      effectRoot?.classList.remove('is-physics-live');

      return () => {
        Array.from(effectRoot?.querySelectorAll<HTMLElement>('[data-antigravity-body]') ?? [])
          .forEach(resetElementStyle);
      };
    }

    const buildWorld = (Matter: MatterApi) => {
      const root = rootRef.current;
      if (!root) return;

      cleanupWorld();
      MatterRef = Matter;
      engine = Matter.Engine.create();
      engine.world.gravity.x = 0;
      engine.world.gravity.y = -0.05;
      engine.world.gravity.scale = 0.001;

      const width = Math.max(root.scrollWidth, window.innerWidth);
      const height = Math.max(root.scrollHeight, window.innerHeight);
      Matter.World.add(engine.world, createBounds(Matter, width, height));

      const rootRect = root.getBoundingClientRect();
      const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-antigravity-body]'));

      elements.forEach((element, index) => {
        resetElementStyle(element);
        const rect = element.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) return;

        const left = rect.left - rootRect.left + root.scrollLeft;
        const top = rect.top - rootRect.top + root.scrollTop;
        const widthPx = rect.width;
        const heightPx = rect.height;
        const radius = Math.min(18, Math.max(6, heightPx * 0.16));

        element.style.position = 'absolute';
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.width = `${widthPx}px`;
        element.style.height = `${heightPx}px`;
        element.style.margin = '0';
        element.style.zIndex = String(20 + index);
        element.style.willChange = 'transform';

        const body = Matter.Bodies.rectangle(
          left + widthPx / 2,
          top + heightPx / 2,
          widthPx + 16,
          heightPx + 16,
          {
            chamfer: { radius },
            restitution: 0.6,
            friction: 0.1,
            frictionAir: 0.02,
            density: 0.001,
          },
        );

        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 2.2,
          y: -0.7 - Math.random() * 1.6,
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.025);

        items.push({
          element,
          body,
          left,
          top,
          width: widthPx,
          height: heightPx,
          driftSeed: Math.random() * Math.PI * 2,
        });
      });

      Matter.World.add(engine.world, items.map(item => item.body));

      const mouse = Matter.Mouse.create(root);
      mouse.pixelRatio = window.devicePixelRatio || 1;
      mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: 0.18,
          angularStiffness: 0.2,
          render: { visible: false },
        },
      });
      Matter.World.add(engine.world, mouseConstraint);
      root.classList.add('is-physics-live');

      let frame = 0;
      const animate = () => {
        if (!engine) return;
        if (mouseConstraint?.mouse.offset) {
          mouseConstraint.mouse.offset.y = root.scrollTop;
        }
        Matter.Engine.update(engine, 1000 / 60);
        frame += 1;

        items.forEach((item, index) => {
          if (frame % 96 === index % 16) {
            const forceX = Math.sin(frame * 0.018 + item.driftSeed) * 0.000035;
            const forceY = -0.000015 - Math.cos(frame * 0.014 + item.driftSeed) * 0.000012;
            Matter.Body.applyForce(item.body, item.body.position, { x: forceX, y: forceY });
          }

          const x = item.body.position.x - item.width / 2 - item.left;
          const y = item.body.position.y - item.height / 2 - item.top;
          item.element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${item.body.angle}rad)`;
        });

        raf = requestAnimationFrame(animate);
      };

      raf = requestAnimationFrame(animate);
    };

    void loadMatter()
      .then(Matter => {
        if (cancelled) return;
        MatterRef = Matter;
        buildWorld(Matter);
      })
      .catch(error => {
        console.error(error);
      });

    const handleResize = () => {
      if (!MatterRef) return;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => buildWorld(MatterRef as MatterApi), 160);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      cleanupWorld();
    };
  }, [activeMedia, activeProjectId, gravityEnabled, resetKey]);

  const scrollTo = (section: 'home' | 'projects' | 'contact') => {
    const root = rootRef.current;
    const target = {
      home: homeRef.current,
      projects: projectsRef.current,
      contact: contactRef.current,
    }[section];
    if (!root || !target) return;
    root.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!pendingScroll || activeProjectId) return undefined;

    const timer = window.setTimeout(() => {
      scrollTo(pendingScroll);
      setPendingScroll(null);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [activeProjectId, gravityEnabled, pendingScroll]);

  const openTarget = (target: OpenTarget) => {
    if (target === 'github') {
      window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    if (target === 'resume') {
      setResumeOpen(true);
      return;
    }

    if (target === 'search') {
      openTarget(getSuggestionTarget(query));
      return;
    }

    if (target === 'home' || target === 'projects' || target === 'contact') {
      setActiveProjectId(null);
      setActiveMedia(null);
      setResumeOpen(false);
      if (target === 'contact') setGravityEnabled(true);
      setPendingScroll(target);
      return;
    }

    setActiveProjectId(target);
    setActiveMedia(null);
    setGravityEnabled(true);
  };

  const applySuggestion = (value: string) => {
    setQuery(value);
    inputRef.current?.focus();
  };

  const activateSuggestion = (value: string) => {
    setQuery(value);
    openTarget(getSuggestionTarget(value));
  };

  const setProjectTab = (projectId: ProjectId, tab: ProjectTabKey) => {
    setActiveTabs(current => ({ ...current, [projectId]: tab }));
  };

  const handlePointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isFixedControlTarget(event.target)) {
      suppressClickRef.current = false;
      return;
    }

    const target = event.target instanceof HTMLElement ? event.target : null;
    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      target,
      moved: false,
    };
  };

  const handlePointerMoveCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isFixedControlTarget(event.target)) return;

    const dx = event.clientX - pointerRef.current.x;
    const dy = event.clientY - pointerRef.current.y;
    if (Math.hypot(dx, dy) > 10) {
      pointerRef.current.moved = true;
      suppressClickRef.current = true;
    }
  };

  const handlePointerUpCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isFixedControlTarget(event.target)) {
      suppressClickRef.current = false;
      return;
    }

    const target = pointerRef.current.target;
    const dx = event.clientX - pointerRef.current.x;
    const dy = event.clientY - pointerRef.current.y;
    const wasTap = Math.hypot(dx, dy) < 8 && !pointerRef.current.moved;

    if (wasTap && target?.closest('.antigravity-search')) {
      inputRef.current?.focus();
      suppressClickRef.current = false;
    }

    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 80);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isFixedControlTarget(event.target)) {
      suppressClickRef.current = false;
      return;
    }

    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleDoubleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>('[data-open-target]')
      : null;
    const target = element?.dataset.openTarget as OpenTarget | undefined;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    openTarget(target);
  };

  return (
    <div
      ref={rootRef}
      className={`antigravity-playground ${gravityEnabled ? 'is-gravity-on' : 'is-zero-g'} ${activeProjectId || resumeOpen ? 'has-project-open' : ''}`}
      data-no-page-swipe="true"
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={handlePointerUpCapture}
      onClickCapture={handleClickCapture}
      onDoubleClickCapture={handleDoubleClickCapture}
    >
      <div className="antigravity-grid" aria-hidden="true" />

      <header className="antigravity-topline">
        <button className="antigravity-brand" type="button" onClick={() => openTarget('home')}>
          <span>PF</span>
          <strong>AIGC Portfolio</strong>
        </button>
        <nav className="antigravity-nav" aria-label="Portfolio navigation">
          <button type="button" onClick={() => openTarget('home')}>Home</button>
          <button type="button" onClick={() => openTarget('projects')}>Works</button>
          <button type="button" onClick={() => openTarget('contact')}>Contact</button>
        </nav>
      </header>

      <div className="gravity-control">
        <button
          className="gravity-toggle"
          type="button"
          aria-pressed={gravityEnabled}
          onClick={() => setGravityEnabled(enabled => !enabled)}
        >
          <span>
            <small>GRAVITY</small>
            <strong>{gravityEnabled ? 'ON' : 'OFF'}</strong>
          </span>
          <i aria-hidden="true" />
        </button>
      </div>

      <button className="antigravity-close" type="button" onClick={onClose} aria-label="Close portfolio playground">
        <X size={18} />
      </button>

      <main className="antigravity-scroll">
        <section className="antigravity-section antigravity-home" id="gravity-home" ref={homeRef}>
          <div className="antigravity-section-inner antigravity-hero">
            <button className="antigravity-logo" type="button" data-antigravity-body data-open-target="contact">
              <span>Andre Sun</span>
              <strong>Portfolio</strong>
            </button>

            <form
              className="antigravity-search"
              data-antigravity-body
              data-open-target="search"
              onSubmit={event => {
                event.preventDefault();
                openTarget(getSuggestionTarget(query));
              }}
              aria-label="Portfolio search"
            >
              <Search size={19} />
              <input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                aria-label="Search portfolio"
              />
              <MousePointer2 size={18} />
            </form>

            <section className="antigravity-suggestions" aria-label="Search recommendations">
              <span>TRY</span>
              {SEARCH_SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  className={suggestion === activeSuggestion ? 'active' : ''}
                  onClick={() => applySuggestion(suggestion)}
                  data-antigravity-body
                  data-open-target={getSuggestionTarget(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </section>

            <section className="antigravity-skill-tags" aria-label="Self and skill shortcuts">
              {skillTags.map(tag => (
                <button
                  key={tag.title}
                  type="button"
                  onClick={() => openTarget('contact')}
                  data-antigravity-body
                  data-open-target="contact"
                >
                  <strong>{tag.title}</strong>
                  <small>{tag.detail}</small>
                </button>
              ))}
            </section>

            <div className="antigravity-actions" aria-label="Search actions">
              <button type="button" onClick={() => activateSuggestion(activeSuggestion)} data-antigravity-body data-open-target="search">
                <Search size={16} />
                Search
              </button>
              <button type="button" onClick={() => openTarget('projects')} data-antigravity-body data-open-target="projects">
                <ArrowDown size={16} />
                Works
              </button>
              <a href={RESUME_FILE} target="_blank" rel="noreferrer" data-antigravity-body data-open-target="resume">
                <FileText size={16} />
                Resume PDF
              </a>
              <button type="button" onClick={() => setResetKey(key => key + 1)} data-antigravity-body data-open-target="home">
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="antigravity-section antigravity-projects-page" id="gravity-projects" ref={projectsRef}>
          <div className="antigravity-section-inner">
            <div className="antigravity-section-heading">
              <span className="heading-stem" />
              <div>
                <p>SELECTED WORKS</p>
                <h2>Works & Resume</h2>
              </div>
            </div>

            <div className="antigravity-card-cloud" aria-label="Project and resume cards">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  className={`antigravity-result-card project-work-card ${accentClass(project.accent)}`}
                  type="button"
                  onClick={() => {
                    if (gravityEnabled) openTarget(project.id);
                  }}
                  data-antigravity-body
                  data-open-target={project.id}
                >
                  <span className="result-index">{String(index + 1).padStart(2, '0')}</span>
                  <img src={project.cover} alt={`${project.title} preview`} draggable={false} />
                  <span className="result-copy">
                    <strong>{project.title}</strong>
                    <small>{project.subtitle}</small>
                  </span>
                </button>
              ))}

              {/* Removed redundant PDF resume button from works stack as requested */}
            </div>
          </div>
        </section>

        <section className="antigravity-section antigravity-contact-page" id="gravity-contact" ref={contactRef}>
          <div className="antigravity-section-inner">
            <div className="antigravity-section-heading">
              <span className="heading-stem" />
              <div>
                <p>CONTACT</p>
                <h2>Sun Qisheng</h2>
              </div>
            </div>

            <section className="antigravity-detail contact-page contact-page-long">
              <article className="contact-profile" data-antigravity-body data-open-target="resume">
                <span>Product & Experience Design</span>
                <h3>孙启圣</h3>
                <p>Industrial design graduate student focused on product systems, UX prototypes, AI-assisted visual workflows, and portfolio-ready interaction demos.</p>
                <div className="contact-chip-row">
                  {skillTags.map(tag => <strong key={tag.title}>{tag.title}</strong>)}
                </div>
              </article>

              <div className="contact-resume-card" data-antigravity-body data-open-target="resume">
                <div className="premium-resume-mockup">
                  <div className="resume-mock-top">
                    <div className="resume-mock-meta">
                      <h3>孙启圣 / Andre Sun</h3>
                      <p className="resume-mock-tagline">产品设计硕士在读 · 寻求产品与体验设计相关机会</p>
                    </div>
                    <span className="resume-mock-avatar-box">孙</span>
                  </div>
                  
                  <div className="resume-mock-grid">
                    <div className="resume-mock-col left">
                      <section>
                        <h4>教育经历 / Education</h4>
                        <div className="resume-mock-item">
                          <strong>上海工程技术大学</strong>
                          <span>产品设计硕士 · 在读</span>
                        </div>
                      </section>
                      <section>
                        <h4>专业技能 / Skills</h4>
                        <div className="resume-skill-list">
                          <span>Rhino</span>
                          <span>KeyShot</span>
                          <span>React Prototype</span>
                          <span>AIGC Workflow</span>
                          <span>CMF</span>
                        </div>
                      </section>
                    </div>
                    <div className="resume-mock-col right">
                      <section>
                        <h4>核心项目 / Selected Projects</h4>
                        <div className="resume-mock-project">
                          <strong>1. 腕部康复评估交互系统 (UX)</strong>
                          <p>居家安全校验、动作实时评分、训练结果可视化的交互体验闭环。</p>
                        </div>
                        <div className="resume-mock-project">
                          <strong>2. AQUARA 鱼缸清洁机器人 (ID)</strong>
                          <p>自动爬壁、自清洁、充电回仓一体化设计。</p>
                        </div>
                      </section>
                    </div>
                  </div>
                  
                  <div className="resume-mock-footer">
                    <span>点击一键查看高清 PDF 简历文档</span>
                  </div>
                </div>
                <a className="resume-open-link" href={RESUME_FILE} target="_blank" rel="noreferrer">
                  <FileText size={17} />
                  Open Resume PDF
                </a>
              </div>

              <div className="contact-link-grid">
                <a href="tel:18715111179" data-antigravity-body data-open-target="contact">
                  <Phone size={18} />
                  <span>18715111179</span>
                </a>
                <a href="mailto:s18715111179@gmail.com" data-antigravity-body data-open-target="contact">
                  <Mail size={18} />
                  <span>s18715111179@gmail.com</span>
                </a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" data-antigravity-body data-open-target="github">
                  <Github size={18} />
                  <span>github.com/Andresun-hyper</span>
                  <ExternalLink size={15} />
                </a>
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer className="antigravity-footer">
        <button type="button" onClick={() => openTarget('home')}>Home</button>
        <button type="button" onClick={() => openTarget('projects')}>Works</button>
        <button type="button" onClick={() => openTarget('contact')}>Contact</button>
      </footer>

      {activeProjectId && (
        <ProjectDetail
          project={activeProject}
          activeTab={activeTabs[activeProject.id] ?? 'overview'}
          onTabChange={tab => setProjectTab(activeProject.id, tab)}
          onClose={() => setActiveProjectId(null)}
          onOpenMedia={index => setActiveMedia({ projectId: activeProject.id, index })}
        />
      )}

      {resumeOpen && (
        <ResumeDetail onClose={() => setResumeOpen(false)} />
      )}

      {activeMedia && (
        <MediaOverlay
          mediaState={activeMedia}
          onClose={() => setActiveMedia(null)}
          onPrev={() => {
            setActiveMedia(current => current ? { ...current, index: Math.max(0, current.index - 1) } : current);
          }}
          onNext={() => {
            setActiveMedia(current => {
              if (!current) return current;
              const media = getProjectMedia(projects.find(project => project.id === current.projectId) ?? projects[0]);
              return { ...current, index: Math.min(media.length - 1, current.index + 1) };
            });
          }}
        />
      )}
    </div>
  );
}

function ProjectDetail({
  project,
  activeTab,
  onTabChange,
  onClose,
  onOpenMedia,
}: {
  project: Project;
  activeTab: ProjectTabKey;
  onTabChange: (tab: ProjectTabKey) => void;
  onClose: () => void;
  onOpenMedia: (index: number) => void;
}) {
  const media = getProjectMedia(project);
  const currentTab = project.tabs.find(tab => tab.id === activeTab) ?? project.tabs[0];

  return (
    <section className={`antigravity-detail-overlay ${accentClass(project.accent)}`}>
      <button className="detail-back" type="button" onClick={onClose}>
        <ArrowLeft size={17} />
        Back
      </button>

      <div className="antigravity-project-detail">
        <div className="project-layout deck-grid">
          <div className="project-meta">
            <div className="project-label-row">
              <div className="project-number">
                <span>{project.range.slice(2, 4)}</span>
                <i />
              </div>
              <div className="project-range">{project.range}</div>
            </div>
            <h2>{project.title}</h2>
            <h3>{project.subtitle}</h3>
            <p className="project-summary">{project.summary}</p>

            <div className="project-proof-grid">
              <div>
                <span>Role</span>
                <strong>{project.role}</strong>
              </div>
              <div>
                <span>Problem</span>
                <strong>{project.problem}</strong>
              </div>
              <div>
                <span>Output</span>
                <strong>{project.output}</strong>
              </div>
              <div>
                <span>Tools</span>
                <strong>{project.tools}</strong>
              </div>
            </div>
          </div>

          <div className="project-visual-card">
            <div className="visual-header">
              <span>{project.title}</span>
              <span>{project.tags.slice(0, 3).join(' / ')}</span>
            </div>
            <div className="project-tabs" role="tablist" aria-label={`${project.title} sections`}>
              {project.tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="visual-grid">
              <button
                className="hero-media"
                type="button"
                onClick={() => onOpenMedia(0)}
              >
                <img src={project.cover} alt={project.title} draggable={false} />
                <span className="media-zoom">
                  <ZoomIn size={17} />
                  OPEN IMAGE
                </span>
              </button>

              <div className="tab-evidence-panel">
                <span>{currentTab.label}</span>
                <h4>{currentTab.title}</h4>
                <p>{currentTab.body}</p>
                <ul>
                  {currentTab.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}
                </ul>
              </div>
            </div>

            <div className="gallery-row">
              {media.slice(1).map((item, idx) => (
                <button
                  key={`${project.id}-${item.src}`}
                  className="gallery-thumb"
                  type="button"
                  onClick={() => onOpenMedia(idx + 1)}
                  aria-label={`Open ${item.label}`}
                >
                  {item.type === 'video' ? (
                    <span className="video-thumb">
                      <Play size={18} />
                    </span>
                  ) : (
                    <img src={item.src} alt={item.label} draggable={false} />
                  )}
                  <span>{item.label}</span>
                  <em>{item.evidenceType}</em>
                </button>
              ))}
            </div>

            <div className="project-bottom-row">
              {project.gallery.some(item => item.type === 'video') && (
                <button
                  className="play-demo"
                  type="button"
                  onClick={() => {
                    const videoIndex = media.findIndex(item => item.type === 'video');
                    onOpenMedia(videoIndex >= 0 ? videoIndex : 0);
                  }}
                >
                  <Play size={17} />
                  PLAY DEMO VIDEO
                </button>
              )}
              <div className="ai-role">
                <span>AI role</span>
                <p>{project.aiRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MediaOverlay({
  mediaState,
  onClose,
  onPrev,
  onNext,
}: {
  mediaState: ActiveMedia;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const project = projects.find(item => item.id === mediaState.projectId) ?? projects[0];
  const media = getProjectMedia(project);
  const item = media[mediaState.index] ?? media[0];
  const hasPrev = mediaState.index > 0;
  const hasNext = mediaState.index < media.length - 1;

  if (!item) return null;

  return (
    <div className="media-overlay" role="dialog" aria-modal="true" data-no-page-swipe="true" onClick={onClose}>
      <div className="media-panel" onClick={event => event.stopPropagation()}>
        <div className="media-panel-header">
          <div>
            <span>{item.label}</span>
            <small>{item.evidenceType}</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close media" data-no-page-swipe="true">
            <X size={20} />
          </button>
        </div>

        <div className="media-stage">
          <button className="media-step prev" type="button" onClick={onPrev} disabled={!hasPrev} aria-label="Previous media">
            <ArrowLeft size={22} />
          </button>
          {item.type === 'video' ? (
            <video src={item.src} controls autoPlay playsInline className="media-video" data-no-page-swipe="true" />
          ) : (
            <img src={item.src} alt={item.label} className="media-image" draggable={false} />
          )}
          <button className="media-step next" type="button" onClick={onNext} disabled={!hasNext} aria-label="Next media">
            <ArrowRight size={22} />
          </button>
        </div>

        <div className="media-caption">
          <span>{String(mediaState.index + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}</span>
          <p>{item.caption}</p>
        </div>
      </div>
    </div>
  );
}

function ResumeDetail({ onClose }: { onClose: () => void }) {
  return (
    <section className="antigravity-detail-overlay accent-teal resume-detail-overlay">
      <button className="detail-back" type="button" onClick={onClose}>
        <ArrowLeft size={17} />
        Back
      </button>

      <div className="antigravity-project-detail is-resume-modal">
        <div className="resume-modal-container">
          {/* Header section */}
          <header className="resume-header">
            <div className="resume-avatar">孙</div>
            <div className="resume-title-block">
              <h2>孙启圣 / Andre Sun</h2>
              <p className="resume-job-intent">产品与体验设计师 · 硕士在读</p>
              <div className="resume-contacts">
                <span>电话: 18715111179</span>
                <span>邮箱: s18715111179@gmail.com</span>
                <span>Github: github.com/Andresun-hyper</span>
              </div>
            </div>
            <a className="resume-download-btn" href={RESUME_FILE} target="_blank" rel="noreferrer">
              <FileText size={16} />
              下载 PDF 原件
            </a>
          </header>

          <hr className="resume-divider" />

          {/* Details body */}
          <div className="resume-body-grid">
            <div className="resume-body-col left-col">
              <section className="resume-section">
                <h3>教育经历 / Education</h3>
                <div className="resume-timeline-item">
                  <div className="timeline-header">
                    <strong>上海工程技术大学</strong>
                    <span className="timeline-date">2024 - 至今</span>
                  </div>
                  <p>产品设计 · 硕士在读</p>
                </div>
                <div className="resume-timeline-item">
                  <div className="timeline-header">
                    <strong>安徽工程大学</strong>
                    <span className="timeline-date">2020 - 2024</span>
                  </div>
                  <p>工业设计 · 学士学位</p>
                </div>
              </section>

              <section className="resume-section">
                <h3>专业技能 / Skillsets</h3>
                <div className="skill-category">
                  <strong>三维建模与渲染</strong>
                  <p>Rhino, KeyShot, Blender</p>
                </div>
                <div className="skill-category">
                  <strong>用户体验与交互原型</strong>
                  <p>React Prototype, Vibe Coding, UI Mockup, User Flows</p>
                </div>
                <div className="skill-category">
                  <strong>视觉与 AIGC 工作流</strong>
                  <p>Photoshop, Illustrator, Midjourney, AI Video Generation</p>
                </div>
              </section>
            </div>

            <div className="resume-body-col right-col">
              <section className="resume-section">
                <h3>核心作品与项目经历 / Key Portfolios</h3>
                
                <div className="resume-project-item">
                  <div className="project-header">
                    <h4>1. 腕部康复评估交互系统 (UX Prototype)</h4>
                    <span className="project-tag">UX / React / Video</span>
                  </div>
                  <p className="project-desc">
                    面向居家康复训练人群，搭建的一套 React 交互原型样机。打通了开始前安全校准、动作过程中的即时识别与评分反馈、训练后的可视化复盘，验证体验节奏。
                  </p>
                  <p className="project-tools">工具链: React / Tailwind CSS / UI Mockup / Video Prototype</p>
                </div>

                <div className="resume-project-item">
                  <div className="project-header">
                    <h4>2. AQUARA 鱼缸清洁机器人 (Industrial Design)</h4>
                    <span className="project-tag">ID / CMF / System</span>
                  </div>
                  <p className="project-desc">
                    针对中大型鱼缸的维护痛点，设计了包含自动爬壁清洁、充电回仓与刷头自清洁一体化的机器人系统。输出六视图与高精场景渲染，论证形体与材质气质。
                  </p>
                  <p className="project-tools">工具链: Rhino / KeyShot / Photoshop / AIGC rendering</p>
                </div>

                <div className="resume-project-item">
                  <div className="project-header">
                    <h4>3. DROPLET 宠物运动水杯 (Pet Product Design)</h4>
                    <span className="project-tag">ID / Scenario Research</span>
                  </div>
                  <p className="project-desc">
                    户外运动宠物补水产品，研究户外场景下的宠物脱水与携带痛点，推导手持、喂水、电解质补充与饮水回流的结构与闭环体验。
                  </p>
                  <p className="project-tools">工具链: Sketch / Rhino / KeyShot / Midjourney</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

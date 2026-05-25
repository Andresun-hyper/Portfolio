import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Github,
  Mail,
  MousePointer2,
  Phone,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

const MATTER_CDN = 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js';
const RESUME_FILE = './sun-qisheng-bytedance-resume.svg';
const GITHUB_URL = 'https://github.com/Andresun-hyper';

const SEARCH_SUGGESTIONS = [
  'Sun Qisheng ByteDance Resume',
  'Wrist Rehabilitation',
  'AQUARA Robot',
  'DROPLET Bottle',
  'Industrial Design',
  'UX Prototype',
  'AI Workflow',
];

const skillTags = ['Industrial Design', 'UX Prototype', 'AI-assisted Visual Workflow', 'Rhino / KeyShot', 'React Demo'];

const projects = [
  {
    id: 'wrist',
    title: 'Wrist Rehabilitation',
    subtitle: 'Home rehab UX prototype',
    image: './rehab-phone-mockup.png',
    accent: 'teal',
    body: 'A runnable rehabilitation app prototype built around safety confirmation, guided movement feedback, result review, and a replayable local demo flow.',
    bullets: ['Training calibration and safety checklist', 'Motion scoring and feedback loop', 'Local video prototype for hiring evidence'],
    tools: 'React Demo / UI Mockup / Video Prototype',
  },
  {
    id: 'aquara',
    title: 'AQUARA Robot',
    subtitle: 'Aquarium cleaning robot',
    image: './aqua-robot-cover.webp',
    accent: 'gold',
    body: 'A product concept for mid-to-large aquariums, combining wall-cleaning, dock charging, self-cleaning, form language, and CMF presentation.',
    bullets: ['Six-view form evidence', 'Dock and route system logic', 'Detail rendering for material and assembly cues'],
    tools: 'Rhino / KeyShot / Photoshop / AI Rendering',
  },
  {
    id: 'droplet',
    title: 'DROPLET Bottle',
    subtitle: 'Outdoor pet hydration product',
    image: './droplet-source-render.png',
    accent: 'black',
    body: 'A pet hydration product for outdoor exercise, focused on carry, drinking, backflow control, and electrolyte supplement scenarios.',
    bullets: ['Scenario research to structure translation', 'Portable product rendering', 'Detail workflow from sketch to final visual'],
    tools: 'Industrial Design / Scenario Research / AIGC Visuals',
  },
] as const;

type ProjectId = typeof projects[number]['id'];
type ViewMode = 'home' | 'project' | 'contact';
type OpenTarget = 'home' | 'contact' | 'resume' | 'github' | 'search' | ProjectId;

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
  if (suggestion.includes('Resume')) return 'resume';
  if (suggestion.includes('Wrist')) return 'wrist';
  if (suggestion.includes('AQUARA')) return 'aquara';
  if (suggestion.includes('DROPLET')) return 'droplet';
  return 'contact';
}

function isFixedControlTarget(target: EventTarget | null) {
  const element = target instanceof Element ? target : null;
  return Boolean(element?.closest(
    '.gravity-control, .antigravity-close, .detail-back, .antigravity-nav, .antigravity-skill-tags, .contact-link-grid, .contact-resume-card',
  ));
}

export default function AntigravityPlayground({ onClose }: { onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, target: null as HTMLElement | null, moved: false });
  const suppressClickRef = useRef(false);
  const [query, setQuery] = useState(SEARCH_SUGGESTIONS[0]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [gravityEnabled, setGravityEnabled] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeProjectId, setActiveProjectId] = useState<ProjectId>('wrist');
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

    if (gravityEnabled) {
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

      const width = window.innerWidth;
      const height = window.innerHeight;
      Matter.World.add(engine.world, createBounds(Matter, width, height));

      const rootRect = root.getBoundingClientRect();
      const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-antigravity-body]'));

      elements.forEach((element, index) => {
        resetElementStyle(element);
        const rect = element.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) return;

        const left = rect.left - rootRect.left;
        const top = rect.top - rootRect.top;
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
          widthPx,
          heightPx,
          {
            chamfer: { radius },
            restitution: 0.6,
            friction: 0.1,
            frictionAir: 0.02,
            density: 0.001,
          },
        );

        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 2.4,
          y: -0.8 - Math.random() * 1.8,
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
  }, [activeProjectId, gravityEnabled, resetKey, viewMode]);

  const openTarget = (target: OpenTarget) => {
    if (target === 'github') {
      window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    if (target === 'resume') {
      setViewMode('contact');
      setGravityEnabled(true);
      return;
    }

    if (target === 'contact') {
      setViewMode('contact');
      setGravityEnabled(true);
      return;
    }

    if (target === 'search') {
      openTarget(getSuggestionTarget(query));
      return;
    }

    if (target === 'home') {
      setViewMode('home');
      return;
    }

    setActiveProjectId(target);
    setViewMode('project');
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
      className={`antigravity-playground ${gravityEnabled ? 'is-gravity-on' : 'is-zero-g'} view-${viewMode}`}
      data-no-page-swipe="true"
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={handlePointerUpCapture}
      onClickCapture={handleClickCapture}
      onDoubleClickCapture={handleDoubleClickCapture}
    >
      <div className="antigravity-grid" aria-hidden="true" />

      <header className="antigravity-topline">
        <button className="antigravity-brand" type="button" data-antigravity-body data-open-target="home">
          <span>PF</span>
          <strong>AIGC Portfolio</strong>
        </button>
        <nav className="antigravity-nav" aria-label="Portfolio navigation">
          <button type="button" onClick={() => openTarget('home')} data-antigravity-body data-open-target="home">Works</button>
          <button type="button" onClick={() => openTarget('resume')} data-antigravity-body data-open-target="resume">Resume</button>
          <button type="button" onClick={() => openTarget('contact')} data-antigravity-body data-open-target="contact">Contact</button>
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

      <main className="antigravity-home" id="gravity-home">
        {viewMode === 'home' && (
          <>
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
                  key={tag}
                  type="button"
                  onClick={() => openTarget('contact')}
                  data-antigravity-body
                  data-open-target="contact"
                >
                  {tag}
                </button>
              ))}
            </section>

            <div className="antigravity-actions" aria-label="Search actions">
              <button type="button" onClick={() => activateSuggestion(activeSuggestion)} data-antigravity-body data-open-target="search">
                <Search size={16} />
                Search Portfolio
              </button>
              <a href={RESUME_FILE} target="_blank" rel="noreferrer" data-antigravity-body data-open-target="resume">
                <FileText size={16} />
                Open Resume
              </a>
              <button type="button" onClick={() => setGravityEnabled(false)} data-antigravity-body data-open-target="home">
                <Sparkles size={16} />
                Zero-G Mode
              </button>
              <button type="button" onClick={() => setResetKey(key => key + 1)} data-antigravity-body data-open-target="home">
                <RotateCcw size={16} />
                Reset Orbit
              </button>
            </div>

            <section className="antigravity-card-cloud" aria-label="Floating project previews">
              <button className="antigravity-result-card resume-card" type="button" onClick={() => openTarget('resume')} data-antigravity-body data-open-target="resume">
                <img src={RESUME_FILE} alt="Sun Qisheng resume preview" draggable={false} />
                <span>ByteDance Resume</span>
              </button>
              {projects.map(project => (
                <button
                  key={project.id}
                  className={`antigravity-result-card accent-${project.accent}`}
                  type="button"
                  onClick={() => openTarget(project.id)}
                  data-antigravity-body
                  data-open-target={project.id}
                >
                  <img src={project.image} alt={`${project.title} preview`} draggable={false} />
                  <span>{project.title}</span>
                </button>
              ))}
            </section>
          </>
        )}

        {viewMode === 'project' && (
          <section className={`antigravity-detail project-detail accent-${activeProject.accent}`}>
            <button className="detail-back" type="button" onClick={() => openTarget('home')} data-antigravity-body data-open-target="home">
              <ArrowLeft size={17} />
              Back
            </button>
            <div className="project-detail-media" data-antigravity-body data-open-target={activeProject.id}>
              <img src={activeProject.image} alt={`${activeProject.title} expanded`} draggable={false} />
            </div>
            <article className="project-detail-copy" data-antigravity-body data-open-target={activeProject.id}>
              <span>{activeProject.subtitle}</span>
              <h2>{activeProject.title}</h2>
              <p>{activeProject.body}</p>
              <ul>
                {activeProject.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}
              </ul>
              <div className="detail-meta">
                <strong>Tools</strong>
                <em>{activeProject.tools}</em>
              </div>
            </article>
          </section>
        )}

        {viewMode === 'contact' && (
          <section className="antigravity-detail contact-page">
            <button className="detail-back" type="button" onClick={() => openTarget('home')} data-antigravity-body data-open-target="home">
              <ArrowLeft size={17} />
              Back
            </button>
            <article className="contact-profile" data-antigravity-body data-open-target="resume">
              <span>Product & Experience Design</span>
              <h2>Sun Qisheng</h2>
              <p>Industrial design graduate student focused on product systems, UX prototypes, AI-assisted visual workflows, and portfolio-ready interaction demos.</p>
              <div className="contact-chip-row">
                {skillTags.map(tag => <strong key={tag}>{tag}</strong>)}
              </div>
            </article>
            <div className="contact-resume-card" data-antigravity-body data-open-target="resume">
              <img src={RESUME_FILE} alt="Sun Qisheng resume" draggable={false} />
              <a href={RESUME_FILE} target="_blank" rel="noreferrer">
                <FileText size={17} />
                Open Resume SVG
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
        )}
      </main>

      <footer className="antigravity-footer">
        <button type="button" onClick={() => openTarget('contact')} data-antigravity-body data-open-target="contact">About</button>
        <button type="button" onClick={() => openTarget('contact')} data-antigravity-body data-open-target="contact">Contact</button>
      </footer>
    </div>
  );
}

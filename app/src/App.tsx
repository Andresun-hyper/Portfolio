import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Mail,
  MessageCircle,
  Phone,
  Play,
  X,
  ZoomIn,
} from 'lucide-react';
import AntigravityPlayground from './components/AntigravityPlayground';
import { contact, projectSlides, slides, trackLabels } from './content/portfolio';
import type { Accent, GalleryItem, PortfolioSlide, ProjectTabKey, TrackFilter } from './content/portfolio.schema';
import './App.css';

const { githubUrl: GITHUB_URL, wechatId: WECHAT_ID } = contact;

type Direction = 'next' | 'prev';

interface ActiveMedia {
  projectId: string;
  index: number;
}

function isInteractiveTarget(target: EventTarget | null) {
  const element = target instanceof Element ? target : null;
  return Boolean(element?.closest('[data-no-page-swipe="true"], a, input, textarea, select, video, [role="dialog"]'));
}

function getProjectMedia(slide: PortfolioSlide): GalleryItem[] {
  if (slide.kind !== 'project' || !slide.cover) return [];
  const cover: GalleryItem = {
    src: slide.cover,
    label: `${slide.title} COVER`,
    caption: slide.summary ?? slide.title,
    evidenceType: 'Cover evidence',
    projectId: slide.id,
  };
  return [cover, ...(slide.gallery ?? []).map(item => ({ ...item, projectId: slide.id }))];
}

function getAllProjectMedia(projectId: string) {
  const project = projectSlides.find(slide => slide.id === projectId);
  return project ? getProjectMedia(project) : [];
}

function useDirectionalPager(slideCount: number, disabled = false) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastDirection, setLastDirection] = useState<Direction>('next');
  const [boundaryFeedback, setBoundaryFeedback] = useState<Direction | null>(null);
  const currentRef = useRef(0);
  const animatingRef = useRef(false);
  const disabledRef = useRef(disabled);
  const unlockRef = useRef<number | null>(null);
  const boundaryRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    currentRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    animatingRef.current = isAnimating;
  }, [isAnimating]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const triggerBoundary = useCallback((direction: Direction) => {
    setBoundaryFeedback(direction);
    if (boundaryRef.current) window.clearTimeout(boundaryRef.current);
    boundaryRef.current = window.setTimeout(() => setBoundaryFeedback(null), 180);
  }, []);

  const goTo = useCallback((target: number) => {
    if (disabledRef.current || animatingRef.current) return;

    if (target < 0) {
      triggerBoundary('prev');
      return;
    }

    if (target >= slideCount) {
      triggerBoundary('next');
      return;
    }

    if (target === currentRef.current) return;

    const direction: Direction = target > currentRef.current ? 'next' : 'prev';
    currentRef.current = target;
    animatingRef.current = true;
    setLastDirection(direction);
    setCurrentIndex(target);
    setIsAnimating(true);

    if (unlockRef.current) window.clearTimeout(unlockRef.current);
    unlockRef.current = window.setTimeout(() => {
      animatingRef.current = false;
      setIsAnimating(false);
    }, 800);
  }, [slideCount, triggerBoundary]);

  const goPrev = useCallback(() => goTo(currentRef.current - 1), [goTo]);
  const goNext = useCallback(() => goTo(currentRef.current + 1), [goTo]);

  useEffect(() => {
    let wheelTotal = 0;
    let lastWheelSign = 0;
    const pointerStart = { x: 0, y: 0, active: false };

    const commitDirectionalInput = (delta: number) => {
      if (delta > 0) goNext();
      if (delta < 0) goPrev();
    };

    const onWheel = (event: WheelEvent) => {
      if (disabledRef.current || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      if (animatingRef.current) return;

      const axisDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const sign = Math.sign(axisDelta);
      if (sign === 0) return;
      if (sign !== lastWheelSign) wheelTotal = 0;
      lastWheelSign = sign;
      wheelTotal += Math.abs(axisDelta);

      if (wheelTotal > 88) {
        wheelTotal = 0;
        commitDirectionalInput(sign);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (disabledRef.current || isInteractiveTarget(event.target)) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerStart.x = event.clientX;
      pointerStart.y = event.clientY;
      pointerStart.active = true;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!pointerStart.active || disabledRef.current || animatingRef.current) {
        pointerStart.active = false;
        return;
      }

      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart.active = false;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const dominant = Math.max(absX, absY);
      const secondary = Math.min(absX, absY);

      if (dominant < 48 || dominant / Math.max(secondary, 1) < 1.15) return;

      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 180);

      commitDirectionalInput(absX > absY ? dx : dy);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      suppressClickRef.current = false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (disabledRef.current || isInteractiveTarget(event.target)) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        goNext();
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        goPrev();
      }
      if (event.key === 'Home') {
        event.preventDefault();
        goTo(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        goTo(slideCount - 1);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onClickCapture, true);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', onClickCapture, true);
      if (unlockRef.current) window.clearTimeout(unlockRef.current);
      if (boundaryRef.current) window.clearTimeout(boundaryRef.current);
    };
  }, [goNext, goPrev, goTo, slideCount]);

  return {
    currentIndex,
    isAnimating,
    lastDirection,
    boundaryFeedback,
    progress: (currentIndex + 1) / slideCount,
    goTo,
    goPrev,
    goNext,
  };
}

function accentClass(accent: Accent) {
  return `accent-${accent}`;
}

function App() {
  const [activeTrack, setActiveTrack] = useState<TrackFilter>('all');
  const [activeTabs, setActiveTabs] = useState<Record<string, ProjectTabKey>>({
    wrist: 'overview',
    aquara: 'overview',
    droplet: 'overview',
    cookware: 'overview',
  });
  const [activeMedia, setActiveMedia] = useState<ActiveMedia | null>(null);
  const [antigravityOpen, setAntigravityOpen] = useState(true);
  const triggerRef = useRef<HTMLElement | null>(null);
  const pager = useDirectionalPager(slides.length, Boolean(activeMedia) || antigravityOpen);
  const activeSlide = slides[pager.currentIndex];

  useEffect(() => {
    document.title = 'Andre作品集网站';
  }, []);

  const openMedia = useCallback((projectId: string, index: number, trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? document.activeElement as HTMLElement | null;
    setActiveMedia({ projectId, index });
  }, []);

  const closeMedia = useCallback(() => {
    setActiveMedia(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const moveMedia = useCallback((direction: Direction) => {
    setActiveMedia(current => {
      if (!current) return current;
      const media = getAllProjectMedia(current.projectId);
      if (media.length === 0) return current;
      const nextIndex = direction === 'next'
        ? Math.min(media.length - 1, current.index + 1)
        : Math.max(0, current.index - 1);
      return { ...current, index: nextIndex };
    });
  }, []);

  const setProjectTab = useCallback((projectId: string, tab: ProjectTabKey) => {
    setActiveTabs(current => ({ ...current, [projectId]: tab }));
  }, []);

  const progressStyle = useMemo(() => ({ '--portfolio-progress': pager.progress } as CSSProperties), [pager.progress]);

  return (
    <main
      className={`portfolio-app ${pager.isAnimating ? 'is-animating' : ''} direction-${pager.lastDirection} ${pager.boundaryFeedback ? `boundary-${pager.boundaryFeedback}` : ''}`}
      style={progressStyle}
    >
      <EngineeringBackdrop />

      <header className="portfolio-topbar" data-no-page-swipe="true">
        <button className="mark-button" type="button" onClick={() => pager.goTo(0)} aria-label="Go to cover">
          <span className="mark-line" />
          <span>ANDRE SUN</span>
          <small>PORTFOLIO</small>
        </button>
        <div className="topbar-actions">
          <button className="gravity-launch" type="button" onClick={() => setAntigravityOpen(true)}>
            ANTIGRAVITY
          </button>
          <div className="topbar-meta">
            <span>{String(pager.currentIndex + 1).padStart(2, '0')}</span>
            <span>/</span>
            <span>{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>
      </header>

      <EdgeNav
        currentIndex={pager.currentIndex}
        count={slides.length}
        onPrev={pager.goPrev}
        onNext={pager.goNext}
      />

      <section className="viewport-stage" aria-label="Andre作品集网站">
        <div
          className="slides-track"
          style={{ transform: `translate3d(${-pager.currentIndex * 100}%, 0, 0)` }}
        >
          {slides.map((slide, index) => {
            const isActive = activeSlide.id === slide.id;
            return (
              <article
                key={slide.id}
                className={`slide ${accentClass(slide.accent)} ${isActive ? 'is-active' : ''}`}
                aria-hidden={!isActive}
                inert={!isActive}
              >
                {slide.kind === 'cover' && (
                  <CoverSlide
                    activeTrack={activeTrack}
                    onTrackChange={setActiveTrack}
                    onJump={pager.goTo}
                  />
                )}
                {slide.kind === 'contents' && <ContentsSlide activeTrack={activeTrack} onJump={pager.goTo} />}
                {slide.kind === 'project' && (
                  <ProjectSlide
                    slide={slide}
                    index={index}
                    activeTab={activeTabs[slide.id] ?? 'overview'}
                    onTabChange={tab => setProjectTab(slide.id, tab)}
                    onOpenMedia={openMedia}
                  />
                )}
                {slide.kind === 'contact' && <ContactSlide />}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="portfolio-footer" data-no-page-swipe="true">
        <button className="nav-arrow" type="button" onClick={pager.goPrev} disabled={pager.currentIndex === 0} aria-label="Previous slide">
          <ChevronLeft size={18} />
        </button>
        <div className="slide-dots" aria-label="Slide navigation">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === pager.currentIndex ? 'active' : ''}
              onClick={() => pager.goTo(index)}
              aria-label={`Go to ${slide.title}`}
              data-label={slide.title}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <i />
            </button>
          ))}
        </div>
        <button className="nav-arrow" type="button" onClick={pager.goNext} disabled={pager.currentIndex === slides.length - 1} aria-label="Next slide">
          <ChevronRight size={18} />
        </button>
      </footer>

      <div className="gesture-rule" aria-live="polite">
        上 / 左: 上一屏 · 下 / 右: 下一屏
      </div>

      {activeMedia && createPortal(
        <MediaOverlay
          mediaState={activeMedia}
          onClose={closeMedia}
          onPrev={() => moveMedia('prev')}
          onNext={() => moveMedia('next')}
        />,
        document.body,
      )}

      {antigravityOpen && createPortal(
        <AntigravityPlayground />,
        document.body,
      )}
    </main>
  );
}

function EngineeringBackdrop() {
  return (
    <div className="engineering-backdrop" aria-hidden="true">
      <div className="grid-frame frame-a" />
      <div className="grid-frame frame-b" />
      <div className="draft-line line-a" />
      <div className="draft-line line-b" />
      <div className="draft-line line-c" />
      <div className="draft-dot dot-a" />
      <div className="draft-dot dot-b" />
      <div className="draft-square square-a" />
      <div className="draft-square square-b" />
    </div>
  );
}

function EdgeNav({
  currentIndex,
  count,
  onPrev,
  onNext,
}: {
  currentIndex: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="edge-nav" data-no-page-swipe="true" aria-label="Directional navigation">
      <button className="edge-zone edge-top" type="button" onClick={onPrev} disabled={currentIndex === 0} aria-label="Previous slide from top edge">
        <ArrowUp size={16} />
        <span>Prev</span>
      </button>
      <button className="edge-zone edge-left" type="button" onClick={onPrev} disabled={currentIndex === 0} aria-label="Previous slide from left edge">
        <ArrowLeft size={16} />
        <span>Prev</span>
      </button>
      <button className="edge-zone edge-right" type="button" onClick={onNext} disabled={currentIndex === count - 1} aria-label="Next slide from right edge">
        <span>Next</span>
        <ArrowRight size={16} />
      </button>
      <button className="edge-zone edge-bottom" type="button" onClick={onNext} disabled={currentIndex === count - 1} aria-label="Next slide from bottom edge">
        <span>Next</span>
        <ArrowDown size={16} />
      </button>
    </div>
  );
}

function CoverSlide({
  activeTrack,
  onTrackChange,
  onJump,
}: {
  activeTrack: TrackFilter;
  onTrackChange: (track: TrackFilter) => void;
  onJump: (index: number) => void;
}) {
  const visibleProjects = activeTrack === 'all'
    ? projectSlides
    : projectSlides.filter(project => project.jobTracks?.includes(activeTrack));

  return (
    <div className="cover-layout deck-grid">
      <div className="cover-copy">
        <div className="mini-bars">
          <span className="bar black" />
          <span className="bar teal" />
          <span className="bar gold" />
        </div>
        <p className="cover-kicker">Product · Experience · AI-assisted Visual Workflow</p>
        <h1>
          <span>孙启圣</span>
          <span>作品集</span>
        </h1>
        <p className="english-title">ANDRE SUN PORTFOLIO</p>
        <p className="cover-person">Product & Experience Design Portfolio</p>
        <div className="cover-rule">
          <span />
          <i />
        </div>
        <p className="cover-intro">
          面向工业设计、UX 原型和 AI 视觉工作流岗位的项目证据集。每个项目都用问题、过程、输出和工具链说明设计判断。
        </p>
        <div className="gravity-guide-tip">
          <span className="guide-pulse-dot" />
          <span>点击右上角 <strong className="glow-text">ANTIGRAVITY</strong> 按钮，开启全网页物理反重力浮动交互探索</span>
        </div>
        <div className="track-filter" aria-label="Portfolio filters">
          {(Object.keys(trackLabels) as TrackFilter[]).map(track => (
            <button
              key={track}
              type="button"
              className={activeTrack === track ? 'active' : ''}
              onClick={() => onTrackChange(track)}
            >
              <span>{trackLabels[track].label}</span>
              <small>{trackLabels[track].caption}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="cover-index" aria-label="Project preview index">
        <div className="cover-index-header">
          <span>SELECTED WORKS</span>
          <strong>{visibleProjects.length}/{projectSlides.length}</strong>
        </div>
        <div className={`cover-preview-stack ${projectSlides.length > 3 ? 'is-dense' : ''}`}>
          {projectSlides.map((project, index) => {
            const highlighted = activeTrack === 'all' || project.jobTracks?.includes(activeTrack);
            return (
              <button
                key={project.id}
                type="button"
                className={`cover-project-strip ${accentClass(project.accent)} ${highlighted ? 'is-highlighted' : 'is-muted'}`}
                onClick={() => onJump(index + 2)}
              >
                <span className="strip-number">{String(index + 1).padStart(2, '0')}</span>
                <img src={project.cover} alt={project.title} draggable={false} />
                <span className="strip-copy">
                  <strong>{project.title}</strong>
                  <small>{project.subtitle}</small>
                  <em>{project.tags?.slice(0, 2).join(' / ')}</em>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="deck-year">
        <strong>2026</strong>
        <span>PORTFOLIO / 16:9 INTERACTIVE DECK</span>
      </div>
    </div>
  );
}

function ContentsSlide({ activeTrack, onJump }: { activeTrack: TrackFilter; onJump: (index: number) => void }) {
  return (
    <div className="contents-layout deck-grid">
      <div className="slide-heading">
        <span className="heading-stem" />
        <div>
          <h2>CONTENTS</h2>
          <p>项目导航 / Hiring Evidence</p>
        </div>
      </div>

      <div className="contents-cards">
        {projectSlides.map((project, idx) => {
          const muted = activeTrack !== 'all' && !project.jobTracks?.includes(activeTrack);
          return (
            <button
              className={`toc-card ${accentClass(project.accent)} ${muted ? 'is-muted' : ''}`}
              type="button"
              key={project.id}
              onClick={() => onJump(idx + 2)}
            >
              <div className="toc-number">
                <i />
                <span>{String(idx + 1).padStart(2, '0')}</span>
              </div>
              <div className="toc-image">
                <img src={project.cover} alt={project.title} draggable={false} />
              </div>
              <div className="toc-copy">
                <span>{project.range}</span>
                <h3>{project.title}</h3>
                <p>{project.subtitle}</p>
              </div>
              <dl className="toc-evidence">
                <div>
                  <dt>Track</dt>
                  <dd>{project.jobTracks?.map(track => trackLabels[track].label).join(' / ')}</dd>
                </div>
                <div>
                  <dt>Output</dt>
                  <dd>{project.output}</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{project.gallery?.map(item => item.evidenceType).slice(0, 3).join(' / ')}</dd>
                </div>
              </dl>
              <div className="toc-stripes">
                <span />
                <span />
                <span />
              </div>
            </button>
          );
        })}
      </div>

      <div className="contents-footnote">
        用目录卡快速判断岗位相关性，再进入项目页查看过程证据。
      </div>
    </div>
  );
}

function ProjectSlide({
  slide,
  index,
  activeTab,
  onTabChange,
  onOpenMedia,
}: {
  slide: PortfolioSlide;
  index: number;
  activeTab: ProjectTabKey;
  onTabChange: (tab: ProjectTabKey) => void;
  onOpenMedia: (projectId: string, index: number, trigger?: HTMLElement | null) => void;
}) {
  const media = getProjectMedia(slide);
  const currentTab = slide.tabs?.find(tab => tab.id === activeTab) ?? slide.tabs?.[0];

  return (
    <div className="project-layout deck-grid">
      <div className="project-meta">
        <div className="project-label-row">
          <div className="project-number">
            <span>{String(index - 1).padStart(2, '0')}</span>
            <i />
          </div>
          <div className="project-range">{slide.range}</div>
        </div>
        <h2>{slide.title}</h2>
        <h3>{slide.subtitle}</h3>
        <p className="project-summary">{slide.summary}</p>

        <div className="project-proof-grid">
          <div>
            <span>Role</span>
            <strong>{slide.role}</strong>
          </div>
          <div>
            <span>Problem</span>
            <strong>{slide.problem}</strong>
          </div>
          <div>
            <span>Output</span>
            <strong>{slide.output}</strong>
          </div>
          <div>
            <span>Tools</span>
            <strong>{slide.tools}</strong>
          </div>
        </div>
      </div>

      <div className="project-visual-card">
        <div className="visual-header">
          <span>{slide.title}</span>
          <span>{slide.jobTracks?.map(track => trackLabels[track].label).join(' / ')}</span>
        </div>
        <div className="project-tabs" role="tablist" aria-label={`${slide.title} sections`}>
          {slide.tabs?.map(tab => (
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
            onClick={event => onOpenMedia(slide.id, 0, event.currentTarget)}
          >
            <img src={slide.cover} alt={slide.title} draggable={false} />
            <span className="media-zoom">
              <ZoomIn size={17} />
              OPEN IMAGE
            </span>
          </button>

          {currentTab && (
            <div className="tab-evidence-panel">
              <span>{currentTab.label}</span>
              <h4>{currentTab.title}</h4>
              <p>{currentTab.body}</p>
              <ul>
                {currentTab.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="gallery-row">
          {media.slice(1).map((item, idx) => (
            <button
              key={`${slide.id}-${item.src}`}
              className="gallery-thumb"
              type="button"
              onClick={event => onOpenMedia(slide.id, idx + 1, event.currentTarget)}
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
          {slide.demoUrl && (
            <a
              className="play-demo playable-demo"
              href={slide.demoUrl}
              target="_blank"
              rel="noreferrer"
              data-no-page-swipe="true"
            >
              <ExternalLink size={17} />
              TRY PLAYABLE DEMO
            </a>
          )}
          {slide.video && (
            <button
              className="play-demo"
              type="button"
              onClick={event => {
                const videoIndex = media.findIndex(item => item.type === 'video');
                onOpenMedia(slide.id, videoIndex >= 0 ? videoIndex : 0, event.currentTarget);
              }}
            >
              <Play size={17} />
              PLAY DEMO VIDEO
            </button>
          )}
          <div className="ai-role">
            <span>AI role</span>
            <p>{slide.aiRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactSlide() {
  return (
    <div className="contact-layout deck-grid">
      <div className="slide-heading">
        <span className="heading-stem" />
        <div>
          <h2>CONTACT</h2>
          <p>联系 / 个人信息</p>
        </div>
      </div>

      <div className="contact-card">
        <div className="contact-name">
          <span>PRODUCT & EXPERIENCE DESIGN</span>
          <h2>孙启圣</h2>
          <p>产品设计硕士在读 · 上海工程技术大学 · DROPLET Red Dot 2026 Winner</p>
        </div>

        <div className="contact-methods">
          <a href="tel:18715111179" data-no-page-swipe="true">
            <Phone size={19} />
            <span>18715111179</span>
          </a>
          <a href="mailto:s18715111179@gmail.com" data-no-page-swipe="true">
            <Mail size={19} />
            <span>s18715111179@gmail.com</span>
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" data-no-page-swipe="true">
            <Github size={19} />
            <span>github.com/Andresun-hyper</span>
          </a>
          <div className="contact-method-item" data-no-page-swipe="true">
            <MessageCircle size={19} />
            <span>微信号 {WECHAT_ID}</span>
          </div>
        </div>

        <div className="contact-grid">
          <div>
            <span>EDUCATION</span>
            <strong>上海工程技术大学 · 产品设计硕士在读 / 亳州学院 · 产品设计本科毕业</strong>
          </div>
          <div>
            <span>AWARD</span>
            <strong>DROPLET · Red Dot Award: Design Concept Winner 2026</strong>
          </div>
          <div>
            <span>FOCUS</span>
            <strong>工业设计、交互原型、产品三维造型、材质光影渲染、AI 视觉工作流</strong>
          </div>
          <div>
            <span>TOOLS</span>
            <strong>Rhino · KeyShot · Blender · Photoshop · Illustrator · Midjourney</strong>
          </div>
        </div>
      </div>

      <div className="contact-footer">
        <span>孙启圣</span>
        <span>Andre Sun Portfolio 2026</span>
      </div>
    </div>
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const media = getAllProjectMedia(mediaState.projectId);
  const item = media[mediaState.index] ?? media[0];
  const hasPrev = mediaState.index > 0;
  const hasNext = mediaState.index < media.length - 1;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [mediaState.projectId, mediaState.index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'ArrowLeft' && hasPrev) {
        event.preventDefault();
        onPrev();
      }
      if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault();
        onNext();
      }
      if (event.key === 'Tab') {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), video[controls], a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasNext, hasPrev, onClose, onNext, onPrev]);

  if (!item) return null;

  return (
    <div className="media-overlay" role="dialog" aria-modal="true" data-no-page-swipe="true" onClick={onClose}>
      <div className="media-panel" ref={panelRef} onClick={event => event.stopPropagation()}>
        <div className="media-panel-header">
          <div>
            <span>{item.label}</span>
            <small>{item.evidenceType}</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close media" data-no-page-swipe="true" ref={closeButtonRef}>
            <X size={20} />
          </button>
        </div>

        <div className="media-stage">
          <button className="media-step prev" type="button" onClick={onPrev} disabled={!hasPrev} aria-label="Previous media">
            <ChevronLeft size={22} />
          </button>
          {item.type === 'video' ? (
            <video src={item.src} controls autoPlay playsInline className="media-video" data-no-page-swipe="true" />
          ) : (
            <img src={item.src} alt={item.label} className="media-image" draggable={false} />
          )}
          <button className="media-step next" type="button" onClick={onNext} disabled={!hasNext} aria-label="Next media">
            <ChevronRight size={22} />
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

export default App;

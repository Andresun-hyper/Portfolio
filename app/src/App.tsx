import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Play,
  X,
  ZoomIn,
} from 'lucide-react';
import AntigravityPlayground from './components/AntigravityPlayground';
import './App.css';

type SlideKind = 'cover' | 'contents' | 'project' | 'contact';
type Direction = 'next' | 'prev';
type Accent = 'teal' | 'gold' | 'black';
type JobTrack = 'industrial' | 'ux' | 'ai';
type TrackFilter = 'all' | JobTrack;
type ProjectTabKey = 'overview' | 'process' | 'output' | 'ai';

interface GalleryItem {
  src: string;
  label: string;
  type?: 'image' | 'video';
  caption: string;
  evidenceType: string;
  projectId?: string;
}

interface ProjectTab {
  id: ProjectTabKey;
  label: string;
  title: string;
  body: string;
  bullets: string[];
}

interface PortfolioSlide {
  id: string;
  kind: SlideKind;
  title: string;
  subtitle: string;
  range?: string;
  accent: Accent;
  cover?: string;
  summary?: string;
  tags?: string[];
  gallery?: GalleryItem[];
  video?: string;
  role?: string;
  problem?: string;
  evidence?: string[];
  output?: string;
  tools?: string;
  aiRole?: string;
  jobTracks?: JobTrack[];
  tabs?: ProjectTab[];
}

interface ActiveMedia {
  projectId: string;
  index: number;
}

const trackLabels: Record<TrackFilter, { label: string; caption: string }> = {
  all: {
    label: 'All Works',
    caption: '完整浏览三个项目',
  },
  industrial: {
    label: 'Industrial',
    caption: '产品结构、CMF、场景和渲染证据',
  },
  ux: {
    label: 'UX Prototype',
    caption: '用户流程、交互原型和可运行演示',
  },
  ai: {
    label: 'AI Workflow',
    caption: 'AI 辅助建模、渲染和视频表达流程',
  },
};

const slides: PortfolioSlide[] = [
  {
    id: 'cover',
    kind: 'cover',
    title: '孙启圣作品集',
    subtitle: 'ANDRE SUN PORTFOLIO',
    accent: 'teal',
    summary: 'Product & Experience Design Portfolio',
    tags: ['Industrial Design', 'UX Prototype', 'AI-assisted Workflow'],
  },
  {
    id: 'contents',
    kind: 'contents',
    title: 'CONTENTS',
    subtitle: '项目导航 / Hiring Evidence',
    accent: 'gold',
  },
  {
    id: 'wrist',
    kind: 'project',
    title: 'WRIST REHABILITATION',
    subtitle: '腕部康复评估设计',
    range: 'P.03-07',
    accent: 'teal',
    cover: './rehab-phone-mockup.png',
    video: './fracture-rehab-demo.mp4',
    summary: '面向居家康复阶段的交互原型，以安全确认、动作反馈和训练结果可视化构成完整体验闭环。',
    role: 'UX 原型设计 / 本地 Demo 搭建 / 交互流程验证',
    problem: '骨折或腕部损伤用户在居家训练中缺少即时反馈，容易出现动作不标准、训练中断和恢复结果不可见的问题。',
    evidence: ['安全确认与训练前校准流程', '动作识别评分与结果反馈界面', '可播放的本地样机视频和多屏 UI 证据'],
    output: '一套可演示的腕部康复训练 App 原型，覆盖开始训练、动作反馈、结果复盘和任务延展。',
    tools: 'React Demo / Vibe Coding / UI Mockup / Video Prototype',
    aiRole: 'AI 用于辅助生成界面素材、演示叙事和快速迭代视觉状态，最终流程由交互逻辑约束。',
    tags: ['UX PROTOTYPE', 'HEALTH REHAB', 'LOCAL DEMO', 'FLOW + UI + VIDEO'],
    jobTracks: ['ux', 'ai'],
    gallery: [
      {
        src: './rehab-source-render.png',
        label: 'UI SOURCE',
        caption: '康复 App 的核心界面视觉，证明原型不是静态概念，而是围绕训练流程组织的界面系统。',
        evidenceType: 'Prototype evidence',
      },
      {
        src: './fracture-rehab-flow.jpg',
        label: '4 STEP FLOW',
        caption: '四步训练路径用于说明用户如何从校准进入训练，再回到结果反馈。',
        evidenceType: 'Flow evidence',
      },
      {
        src: './fracture-rehab-board.jpg',
        label: 'RESEARCH BOARD',
        caption: '问题拆解和前期研究板，说明康复训练的约束、风险和机会点。',
        evidenceType: 'Research evidence',
      },
      {
        src: './fracture-rehab-demo.mp4',
        label: 'DEMO VIDEO',
        type: 'video',
        caption: '本地样机展示视频，用于验证界面节奏、交互反馈和演示完整度。',
        evidenceType: 'Motion evidence',
      },
    ],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        title: '居家康复的可见反馈',
        body: '项目把康复训练从“完成动作”转化为“可判断、可记录、可复盘”的交互流程。',
        bullets: ['目标用户：居家康复训练人群', '核心价值：降低训练不确定性', '交付物：可播放 App 原型和流程页'],
      },
      {
        id: 'process',
        label: 'Process',
        title: '从安全校准到结果复盘',
        body: '流程优先处理康复产品最关键的安全感，再进入动作识别和训练反馈。',
        bullets: ['训练前检查和校准', '动作过程中的反馈节奏', '训练后结果和任务映射'],
      },
      {
        id: 'output',
        label: 'Output',
        title: 'Demo 可以直接说明体验',
        body: '图片、流程图和视频共同组成招聘场景下可快速判断的 UX 证据。',
        bullets: ['界面系统', '四步用户流', '可播放视频样机'],
      },
      {
        id: 'ai',
        label: 'AI Workflow',
        title: 'AI 作为表达和迭代工具',
        body: 'AI 辅助生成演示状态和视觉资产，但交互逻辑、流程结构和内容判断仍由设计目标决定。',
        bullets: ['快速生成界面情境', '辅助视频表达', '保留可解释的流程结构'],
      },
    ],
  },
  {
    id: 'aquara',
    kind: 'project',
    title: 'AQUARA',
    subtitle: '鱼缸清洁机器人',
    range: 'P.08-12',
    accent: 'gold',
    cover: './aqua-robot-cover.webp',
    summary: '围绕中大型鱼缸清洁痛点，提出自动爬壁清洁、回仓充电和自清洁结合的产品方案。',
    role: '工业设计 / 产品策略 / 结构与 CMF 表达',
    problem: '中大型鱼缸绿藻积累快，人工清洁频率高且容易打扰鱼群，用户需要低干预、稳定维护的清洁方案。',
    evidence: ['六视图用于验证形体和比例', '系统图说明回仓、自清洁与工作路径', '细节渲染呈现结构、材质和使用场景'],
    output: '一套面向家庭水族场景的机器人产品概念，包含主机、充电回仓、清洁路径和视觉渲染。',
    tools: 'Rhino / KeyShot / Photoshop / AI-assisted Rendering',
    aiRole: 'AI 用于辅助渲染气质、构图探索和视觉表达，核心产品逻辑来自场景痛点和结构设定。',
    tags: ['INDUSTRIAL DESIGN', 'ROBOTICS', 'CMF', 'AI RENDERING'],
    jobTracks: ['industrial', 'ai'],
    gallery: [
      {
        src: './aqua-robot-views.webp',
        label: 'SIX VIEWS',
        caption: '六视图展示产品比例、轮廓和关键面关系，是工业设计岗位最直接的形体证据。',
        evidenceType: 'Form evidence',
      },
      {
        src: './aqua-robot-system.webp',
        label: 'SYSTEM CARD',
        caption: '系统卡片说明清洁机器人、回仓和使用场景之间的产品逻辑。',
        evidenceType: 'System evidence',
      },
      {
        src: './aqua-robot-detail.webp',
        label: 'DETAIL RENDER',
        caption: '细节渲染呈现结构分件、材质对比和产品识别特征。',
        evidenceType: 'CMF evidence',
      },
    ],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        title: '让鱼缸维护变成低干预流程',
        body: 'AQUARA 把清洁、回仓和自清洁整合成一个家庭水族维护系统。',
        bullets: ['场景：1.2 米以上中大型鱼缸', '对象：绿藻、玻璃壁、水质维护', '产出：机器人和回仓系统概念'],
      },
      {
        id: 'process',
        label: 'Process',
        title: '从痛点到结构路径',
        body: '项目优先建立工作路径和使用边界，再通过形体推敲表达产品可信度。',
        bullets: ['清洁路径推演', '回仓和自清洁逻辑', '外观比例和结构分件'],
      },
      {
        id: 'output',
        label: 'Output',
        title: '工业设计证据完整',
        body: '六视图、系统卡和细节渲染共同支撑产品概念，而不是单张效果图。',
        bullets: ['六视图', '系统说明', '细节和材质渲染'],
      },
      {
        id: 'ai',
        label: 'AI Workflow',
        title: 'AI 辅助表达但不替代结构',
        body: 'AI 用于提升渲染表达和场景气质，产品结构和功能路径在设计判断中先行。',
        bullets: ['渲染氛围探索', '构图和材质迭代', '最终页面回到产品证据'],
      },
    ],
  },
  {
    id: 'droplet',
    kind: 'project',
    title: 'DROPLET',
    subtitle: '宠物运动水杯',
    range: 'P.13-17',
    accent: 'black',
    cover: './droplet-source-render.png',
    summary: '面向户外运动场景的宠物补水产品，强调携带、饮水、回流和电解质补给的连续体验。',
    role: '工业设计 / 场景研究 / 产品渲染与 AIGC 表达',
    problem: '户外运动后的宠物容易出现饮水不足、补给不便和携带负担，普通水杯难以兼顾卫生、回流和营养补给。',
    evidence: ['产品主渲染展示使用姿态和造型语言', '草图与流程图说明从问题到结构的推导', '细节图表现饮水、回流和握持关系'],
    output: '一套宠物运动水杯概念，覆盖使用流程、结构表达、外观渲染和场景化展示。',
    tools: 'Sketch / Rhino / KeyShot / Midjourney / Photoshop',
    aiRole: 'AI 用于快速探索产品场景、材质氛围和展示页视觉，再结合草图与结构图收敛方案。',
    tags: ['PET PRODUCT', 'SCENARIO RESEARCH', 'PRODUCT RENDER', 'CMF'],
    jobTracks: ['industrial', 'ai'],
    gallery: [
      {
        src: './droplet-source-render.png',
        label: 'SOURCE RENDER',
        caption: '主渲染用于呈现产品姿态、比例和户外运动情境。',
        evidenceType: 'Hero render',
      },
      {
        src: './pet-bottle-render.webp',
        label: 'PRODUCT RENDER',
        caption: '产品渲染强化结构、材质和手持关系，是工业设计输出的核心证据。',
        evidenceType: 'Render evidence',
      },
      {
        src: './pet-bottle-sketch.webp',
        label: 'SKETCH BOARD',
        caption: '草图板说明造型推导、结构方向和场景假设。',
        evidenceType: 'Sketch evidence',
      },
      {
        src: './pet-bottle-flow.webp',
        label: 'FLOW DETAIL',
        caption: '流程细节说明饮水、回流和携带之间的体验闭环。',
        evidenceType: 'Usage evidence',
      },
    ],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        title: '户外运动后的宠物补水体验',
        body: 'DROPLET 把便携补水、营养补给和回流清洁压缩到单一产品动作中。',
        bullets: ['对象：户外运动宠物和主人', '目标：减少补水和携带负担', '产出：产品概念和场景渲染'],
      },
      {
        id: 'process',
        label: 'Process',
        title: '场景先行的产品推导',
        body: '从户外运动后的脱水风险切入，推导出握持、饮水、回流和补给结构。',
        bullets: ['场景痛点梳理', '草图形态探索', '使用流程闭环'],
      },
      {
        id: 'output',
        label: 'Output',
        title: '从草图到渲染的完整表达',
        body: '最终页面同时呈现草图、流程、渲染和场景，使产品方案更容易被岗位筛选者判断。',
        bullets: ['草图板', '产品渲染', '使用流程图'],
      },
      {
        id: 'ai',
        label: 'AI Workflow',
        title: 'AI 加速视觉探索',
        body: 'AI 辅助建立产品展示氛围和视觉叙事，再由产品逻辑筛选可用方向。',
        bullets: ['场景氛围生成', '材质和光影探索', '与手绘和建模结果交叉验证'],
      },
    ],
  },
  {
    id: 'contact',
    kind: 'contact',
    title: 'CONTACT',
    subtitle: '联系 / 个人信息',
    accent: 'teal',
    summary: '孙启圣 / 产品设计硕士在读 / AI 视觉与交互原型方向',
    tags: ['Rhino', 'KeyShot', 'Blender', 'Photoshop', 'Illustrator', 'Midjourney', 'AI 视频生成', '后期制作'],
  },
];

const projectSlides = slides.filter((slide): slide is PortfolioSlide & { kind: 'project' } => slide.kind === 'project');

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
  });
  const [activeMedia, setActiveMedia] = useState<ActiveMedia | null>(null);
  const [antigravityOpen, setAntigravityOpen] = useState(false);
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
            Antigravity
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
        <AntigravityPlayground onClose={() => setAntigravityOpen(false)} />,
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
          <span>点击右上角 <strong className="glow-text">Antigravity</strong> 按钮，开启全网页物理反重力浮动交互探索</span>
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
          <strong>{visibleProjects.length}/3</strong>
        </div>
        <div className="cover-preview-stack">
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
          <p>产品设计硕士在读 · 上海工程技术大学</p>
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
        </div>

        <div className="contact-grid">
          <div>
            <span>EDUCATION</span>
            <strong>上海工程技术大学 / 产品设计 / 硕士在读</strong>
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

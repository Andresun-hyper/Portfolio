import { useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../hooks/useLanguage';

interface GalleryItem {
  src: string;
  label: string;
}

interface Project {
  id: number;
  title: string;
  titleEn: string;
  category: string;
  categoryEn: string;
  summary: string;
  summaryEn: string;
  desc: string;
  descEn: string;
  cover: string;
  video?: string;
  poster?: string;
  tags: string[];
  floor: string;
  accent: string;
  gallery: GalleryItem[];
}

const projects: Project[] = [
  {
    id: 1,
    title: 'AQUA 鱼缸机器人',
    titleEn: 'AQUA Aquarium Robot',
    category: '水族智能硬件',
    categoryEn: 'Aquatic Smart Hardware',
    summary: '面向家庭鱼缸巡检、清洁与状态反馈的智能维护机器人。',
    summaryEn: 'A home-aquarium robot for inspection, cleaning, and ambient status feedback.',
    desc: '以透明鱼缸场景为核心，整合视觉巡检、磁吸行走、模块化清洁头与前置信息显示，把鱼缸维护从一次性家务转化为可感知、可追踪的智能服务。',
    descEn: 'A transparent-tank maintenance robot combining visual inspection, magnetic movement, modular cleaning, and a front status display.',
    cover: './aqua-robot-cover.webp',
    tags: ['PRODUCT', 'ROBOTICS', 'AQUA_SYSTEM'],
    floor: 'ROOF_11',
    accent: '#00E5FF',
    gallery: [
      { src: './aqua-robot-system.webp', label: 'AQUA SYSTEM' },
      { src: './aqua-robot-views.webp', label: 'SIX VIEWS' },
      { src: './aqua-robot-detail.webp', label: 'DETAIL RENDER' },
    ],
  },
  {
    id: 2,
    title: '宠物水杯',
    titleEn: 'Pet Hydration Bottle',
    category: '宠物出行产品',
    categoryEn: 'Pet Outdoor Product',
    summary: '一体化便携饮水、回流与握持体验设计。',
    summaryEn: 'A portable pet water bottle with integrated flow, return, and grip experience.',
    desc: '围绕户外遛宠场景设计，强调单手开合、可控出水、剩水回流和透明水路可视化，用更轻松的材料语言建立宠物陪伴体验。',
    descEn: 'A portable hydration product built around one-handed control, visible flow, water return, and a warm translucent material language.',
    cover: './pet-bottle-cover.webp',
    tags: ['PETCARE', 'INDUSTRIAL', 'FLOW_DESIGN'],
    floor: 'ROOF_15',
    accent: '#FDB933',
    gallery: [
      { src: './pet-bottle-flow.webp', label: 'FLOW RENDER' },
      { src: './pet-bottle-render.webp', label: 'PRODUCT RENDER' },
      { src: './pet-bottle-sketch.webp', label: 'SKETCH BOARD' },
    ],
  },
  {
    id: 3,
    title: '虚空办公舱',
    titleEn: 'Void Workspace Pod',
    category: '空间交互概念',
    categoryEn: 'Spatial Interaction Concept',
    summary: '面向沉浸式协作的半透明办公节点。',
    summaryEn: 'A translucent spatial node for immersive collaboration.',
    desc: '在虚拟空间中重构办公体验，以半透明玻璃舱、全息桌面和环境感知光场建立沉浸式协作节点。',
    descEn: 'A spatial workspace pod with holographic desktops, sensor lighting, and immersive collaboration nodes.',
    cover: './project-3.jpg',
    tags: ['SPATIAL', 'PRODUCT', 'IOT'],
    floor: 'ROOF_21',
    accent: '#7B61FF',
    gallery: [
      { src: './project-3.jpg', label: 'CONCEPT PREVIEW' },
    ],
  },
  {
    id: 4,
    title: '腕部骨折康复游戏',
    titleEn: 'Wrist Fracture Rehab Game',
    category: '康复游戏原型',
    categoryEn: 'Rehab Game Prototype',
    summary: '把居家训练、动作识别和结果反馈串成闭环。',
    summaryEn: 'A home rehab loop connecting training, tracking, and result feedback.',
    desc: '面向固定解除后的居家康复场景，把训练前安全确认、摄像头/模拟校准、腕部动作识别、训练结果和生活任务映射串成 8 分钟闭环。',
    descEn: 'A home wrist-rehab prototype that connects safety checks, calibration, guided motion tracking, outcomes, and daily task mapping into an 8-minute loop.',
    cover: './fracture-rehab-poster.png',
    video: './fracture-rehab-demo.mp4',
    poster: './fracture-rehab-poster.png',
    tags: ['REHAB', 'MOTION', 'LOCAL_DATA'],
    floor: 'ROOF_24',
    accent: '#00E5FF',
    gallery: [
      { src: './fracture-rehab-flow.jpg', label: '4 STEP FLOW' },
      { src: './fracture-rehab-board.jpg', label: 'RESEARCH' },
      { src: './fracture-rehab-board-2.jpg', label: 'PROTOTYPE' },
    ],
  },
];

interface Props {
  projectIndex?: number;
}

export default function ProjectSection({ projectIndex = 0 }: Props) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const [videoSound, setVideoSound] = useState(false);
  const [overlay, setOverlay] = useState<
    | { type: 'image'; src: string; label: string }
    | { type: 'video'; src: string; label: string }
    | { type: 'details' }
    | null
  >(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const project = projects[projectIndex] ?? projects[0];
  const projectName = t(project.title, project.titleEn);
  const accentStyle = { '--project-accent': project.accent } as CSSProperties;

  const enableSound = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    setVideoSound(true);
    await video.play().catch(() => undefined);
  };

  const openMainMedia = () => {
    if (project.video) {
      setOverlay({ type: 'video', src: project.video, label: projectName });
      return;
    }
    setOverlay({ type: 'image', src: project.cover, label: projectName });
  };

  return (
    <section
      className="project-card relative select-none"
      style={{ width: 'min(760px, calc(100vw - 34px))', ...accentStyle }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="project-card__number">
        {project.id.toString().padStart(2, '0')}
      </div>

      <div className="project-card__grid">
        <div className="project-card__media">
          <div
            className="project-card__cover group"
            data-hover="true"
            data-no-drag="true"
            role="button"
            tabIndex={0}
            aria-label={`Open project ${project.id} media`}
            onClick={openMainMedia}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                openMainMedia();
              }
            }}
          >
            {project.video ? (
              <video
                ref={videoRef}
                src={project.video}
                poster={project.poster}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                autoPlay
                muted={!videoSound}
                loop
                playsInline
                controls
                data-no-drag="true"
                onClick={event => event.stopPropagation()}
                onLoadedMetadata={event => { event.currentTarget.volume = 1; }}
              />
            ) : (
              <img
                src={project.cover}
                alt={projectName}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                draggable={false}
                style={{
                  filter: hovered ? 'saturate(1.12) contrast(1.08)' : 'saturate(1) contrast(1.03)',
                }}
              />
            )}
            <span className="project-card__cover-glow" />
            <span className="project-card__floor">{project.floor}</span>
            {project.video && <span className="project-card__badge">CORE_MP4</span>}
            {project.video && !videoSound && (
              <button
                className="project-card__sound"
                type="button"
                data-hover="true"
                data-no-drag="true"
                onClick={event => {
                  event.stopPropagation();
                  void enableSound();
                }}
              >
                SOUND_ON
              </button>
            )}
            <button
              className="project-card__open"
              type="button"
              data-hover="true"
              data-no-drag="true"
              onClick={event => {
                event.stopPropagation();
                openMainMedia();
              }}
            >
              OPEN
            </button>
          </div>

          <div className="project-card__thumbs">
            {project.gallery.map(item => (
              <button
                key={item.src}
                className="project-card__thumb"
                data-hover="true"
                data-no-drag="true"
                type="button"
                aria-label={`Open ${item.label}`}
                onClick={() => setOverlay({ type: 'image', src: item.src, label: item.label })}
              >
                <img src={item.src} alt={item.label} draggable={false} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="project-card__copy">
          <div className="project-card__kicker">
            PROJECT_0{project.id} / {t(project.category, project.categoryEn)}
          </div>
          <h3>{projectName}</h3>
          <p className="project-card__summary">{t(project.summary, project.summaryEn)}</p>
          <p className="project-card__desc">{t(project.desc, project.descEn)}</p>

          <div className="project-card__tags">
            {project.tags.map(tag => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <button
            className="project-card__detail"
            data-hover="true"
            data-no-drag="true"
            type="button"
            aria-label={`Open project ${project.id} details`}
            onClick={() => setOverlay({ type: 'details' })}
          >
            {t('查看详情', 'VIEW DETAILS')} {'>'}
          </button>
        </div>
      </div>

      {overlay && createPortal(
        <div
          className="project-overlay"
          role="dialog"
          aria-modal="true"
          data-no-drag="true"
          style={accentStyle}
          onClick={() => setOverlay(null)}
        >
          <div className="project-overlay__panel" onClick={event => event.stopPropagation()}>
            <div className="project-overlay__header">
              <div>
                {overlay.type === 'details' ? `PROJECT_0${project.id} / DETAIL` : overlay.label}
              </div>
              <button
                type="button"
                aria-label="Close overlay"
                data-hover="true"
                data-no-drag="true"
                onClick={() => setOverlay(null)}
              >
                CLOSE
              </button>
            </div>

            {overlay.type === 'image' && (
              <img src={overlay.src} alt={overlay.label} className="project-overlay__image" draggable={false} />
            )}

            {overlay.type === 'video' && (
              <video
                src={overlay.src}
                poster={project.poster}
                className="project-overlay__video"
                controls
                autoPlay
                playsInline
                data-no-drag="true"
                onLoadedMetadata={event => {
                  event.currentTarget.muted = false;
                  event.currentTarget.volume = 1;
                }}
              />
            )}

            {overlay.type === 'details' && (
              <div className="project-overlay__details">
                <div>
                  <div className="project-card__kicker">{t(project.category, project.categoryEn)}</div>
                  <h4>{projectName}</h4>
                  <p>{t(project.desc, project.descEn)}</p>
                  <div className="project-card__tags">
                    {project.tags.map(tag => <span key={tag}>{tag}</span>)}
                  </div>
                </div>
                <div className="project-overlay__gallery">
                  {project.gallery.map(item => (
                    <button
                      key={item.src}
                      type="button"
                      aria-label={`Open detail image ${item.label}`}
                      data-hover="true"
                      data-no-drag="true"
                      onClick={() => setOverlay({ type: 'image', src: item.src, label: item.label })}
                    >
                      <img src={item.src} alt={item.label} draggable={false} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

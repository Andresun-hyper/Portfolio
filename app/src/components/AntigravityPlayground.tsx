import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as MatterLib from 'matter-js';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  ExternalLink,
  FileText,
  Github,
  House,
  ChevronDown,
  Mail,
  MessageCircle,
  Menu,
  Phone,
  Play,
  Search,
  X,
  ZoomIn,
} from 'lucide-react';
import { antigravityContent, contact, portfolioContent } from '../content/portfolio';
import { modelPreviews } from '../content/model-previews';
import type { ModelPreviewConfig } from '../content/model-previews.schema';
import type { Accent, AntigravityProject, GalleryItem, ProjectTab, ProjectTabKey } from '../content/portfolio.schema';

const ModelViewer = lazy(() => import('./ModelViewer'));

const { githubUrl: GITHUB_URL, resumeFile: RESUME_FILE, wechatId: WECHAT_ID } = contact;
const { skillTags, projects } = antigravityContent;
const PROJECT_SUGGESTIONS = projects.map(project => ({
  label: project.title,
  target: project.id,
}));

type SearchAlias = {
  target: OpenTarget;
  terms: string[];
};

const FUZZY_MATCH_THRESHOLD = 55;

const PROJECT_SEARCH_ALIASES: Record<string, string[]> = {
  droplet: [
    'droplet', 'droplet bottle', 'pet bottle', 'water bottle', 'hydration', 'pet hydration',
    'pet product', 'outdoor pet', 'outdoor exercise', 'portable bottle', 'supplement',
    'electrolyte', 'visible hygiene', 'water path', 'grip', 'scenario research', 'product render',
    'product rendering', 'industrial design', 'cmf', 'sketch', 'rhino', 'keyshot', 'midjourney',
    'photoshop', 'red dot', 'red dot award', 'design concept winner', 'winner 2026',
    '获奖', '获奖项目', '获奖作品', '获奖经历', '奖项', '红点', '红点奖', '红点奖项', '红点奖获奖',
    '宠物', '宠物产品', '宠物饮水', '宠物水瓶', '宠物水杯', '户外宠物', '户外运动', '运动饮水',
    '便携水瓶', '补水', '电解质补充', '透明水路', '可视卫生', '握持', '场景研究', '产品渲染',
    '工业设计', '材质', '材质研究',
  ],
  wrist: [
    'wrist', 'wrist rehabilitation', 'rehab', 'rehabilitation', 'fracture', 'fracture rehab',
    'health rehab', 'home rehab', 'rehab app', 'rehab game', 'local demo', 'react demo',
    'ui mockup', 'video prototype', 'motion feedback', 'calibration', 'training', 'scoring',
    'review', 'interaction flow', 'ux prototype', '骨折', '骨折康复', '腕部', '腕部康复',
    '手腕', '手腕康复', '康复', '康复训练', '康复游戏', '康复应用', '康复app', '健康',
    '居家康复', '训练反馈', '动作反馈', '动作识别', '校准', '训练评分', '训练结果', '复盘',
    '交互流程', '用户流程', '交互原型', '可玩demo', '演示视频',
  ],
  aquara: [
    'aquara', 'aquarium', 'aquarium robot', 'fish tank', 'fish tank robot', 'cleaning robot',
    'robotics', 'wall cleaning', 'dock charging', 'self cleaning', 'charging dock', 'cmf',
    'industrial design', 'product strategy', 'structure', 'robot', 'aquarium cleaning',
    '水族箱', '鱼缸', '鱼缸清洁', '鱼缸机器人', '清洁机器人', '水族机器人', '机器鱼缸', '机器人',
    '自动清洁', '壁面清洁', '充电底座', '自动回充', '产品策略', '结构设计', '工业设计', 'cmf',
  ],
  cookware: [
    'outdoor cookware', 'cookware', 'outdoor cooking', 'camp cooking', 'camp kitchen',
    'graduation design', 'thesis', 'engineering drawing', 'product system', 'product render',
    'rhino', 'keyshot', 'photoshop', 'outdoor', 'cook set', 'nesting pot', 'camping',
    '户外炊具', '户外烹饪', '户外做饭', '露营炊具', '露营', '家用户外', '毕业设计', '毕业作品',
    '论文', '论文课题', '工程图', '产品系统', '锅具', '套锅', '收纳', '安全', '烹饪行为',
    '工业设计', '产品建模', '产品渲染',
  ],
};

const PERSONAL_SEARCH_ALIASES: SearchAlias[] = [
  {
    target: 'resume',
    terms: [
      'resume', 'cv', 'pdf resume', 'curriculum vitae', 'about me', 'profile', 'bio', 'personal profile',
      'education', 'academic', 'degree', 'university', 'graduate student', 'master', 'bachelor',
      'shanghai university of engineering science', 'hezhou university', 'product design',
      'work experience', 'work history', 'employment', 'internship', 'internship experience',
      'campus experience', 'project experience', 'experience', 'skills', 'skillset', 'toolset',
      'honors', 'honours', 'award history', 'awards', 'award experience', 'selected honors',
      '获奖', '获奖经历', '获奖记录', '奖项', '荣誉', '荣誉奖项', '获奖情况', '获奖作品',
      '工作经历', '工作经验', '工作履历', '实习经历', '实习经验', '校园经历', '项目经历',
      '教育经历', '教育背景', '学历', '硕士', '本科', '研究生', '在读', '毕业', '个人简历',
      '上海工程技术大学', '贺州学院', '产品设计', '工业设计专业',
      '简历', '个人资料', '个人信息', '个人介绍', '关于我', '经历', '技能', '专业技能', '工具',
      '字节跳动', '字节实习', 'bytedance', '易班', '校园工作', '摄影比赛', '安徽省大学生摄影大赛',
      '年龄', 'age', 'born', 'birth', 'birthday', '出生', '出生日期', '生日',
    ],
  },
  {
    target: 'contact',
    terms: [
      'contact', 'contact me', 'phone', 'telephone', 'mobile', 'email', 'mail', 'github', 'wechat',
      '联系方式', '联系', '联系我', '电话', '手机', '邮箱', '电子邮箱', '微信', '微信公众号', '社交账号',
      '姓名', '名字', '作者', '设计师', '孙启圣', 'andre sun', 'sun qisheng', 'andresun',
    ],
  },
];

type Project = AntigravityProject;
type ProjectId = Project['id'];
type Language = 'en' | 'zh';
type OpenTarget = 'home' | 'projects' | 'contact' | 'resume' | 'github' | 'search' | ProjectId;
type SectionId = 'home' | 'projects' | 'contact';

const PROJECT_CARD_COVERS: Partial<Record<ProjectId, string>> = {
  droplet: './droplet-shop/droplet-shop-01.jpg',
};

type ModelPreview = {
  title: string;
  config: ModelPreviewConfig;
};

const MODEL_ASSET_PREVIEWS: Partial<Record<ProjectId, ModelPreview>> = {
  droplet: {
    title: 'DROPLET MODEL PREVIEW',
    config: modelPreviews.droplet,
  },
  aquara: {
    title: 'AQUARA MODEL PREVIEW',
    config: modelPreviews.aquara!,
  },
};

const SKILL_TAG_ZH: Record<string, string> = {
  'Industrial Design': '工业设计',
  'UX Prototype': 'UX 原型',
  'AI Workflow': 'AI 流程',
  'Rhino / KeyShot': 'Rhino / KeyShot',
  'React Demo': 'React Demo',
  'Portfolio Storytelling': '作品集叙事',
};

const UI_COPY = {
  en: {
    home: 'Home',
    works: 'Works',
    contact: 'Contact',
    languageButton: '中文',
    languageLabel: 'Switch to Chinese',
    gravity: 'GRAVITY',
    on: 'ON',
    off: 'OFF',
    back: 'Back',
    role: 'Role',
    problem: 'Problem',
    output: 'Output',
    tools: 'Tools',
    sections: 'sections',
    openImage: 'OPEN IMAGE',
    playableDemo: 'TRY PLAYABLE DEMO',
    playVideo: 'PLAY DEMO VIDEO',
    aiRole: 'AI role',
    closeMedia: 'Close media',
    previousMedia: 'Previous media',
    nextMedia: 'Next media',
    openResume: 'Open Resume PDF',
    search: 'Search portfolio',
    try: 'TRY',
  },
  zh: {
    home: '首页',
    works: '作品',
    contact: '联系',
    languageButton: 'EN',
    languageLabel: '切换为英文',
    gravity: '重力',
    on: '开启',
    off: '关闭',
    back: '返回',
    role: '职责',
    problem: '问题',
    output: '成果',
    tools: '工具',
    sections: '项目分区',
    openImage: '打开图片',
    playableDemo: '打开可交互 Demo',
    playVideo: '播放演示视频',
    aiRole: 'AI 参与方式',
    closeMedia: '关闭媒体',
    previousMedia: '上一张媒体',
    nextMedia: '下一张媒体',
    openResume: '打开简历 PDF',
    search: '搜索作品集',
    try: '推荐',
  },
} as const;

interface ProjectTranslation {
  title: string;
  subtitle: string;
  summary: string;
  role: string;
  problem: string;
  output: string;
  tools: string;
  aiRole: string;
  tags: Record<string, string>;
  tabs: Record<ProjectTabKey, Pick<ProjectTab, 'label' | 'title' | 'body' | 'bullets'>>;
  gallery: Record<string, Pick<GalleryItem, 'label' | 'caption' | 'evidenceType'>>;
}

const PROJECT_ZH: Record<ProjectId, ProjectTranslation> = {
  droplet: {
    title: 'DROPLET',
    subtitle: '户外宠物饮水产品',
    summary: 'Red Dot Award: Design Concept Winner 2026 获奖项目，面向户外运动场景的宠物补水产品。',
    role: '工业设计 / 场景研究 / 产品渲染与 AIGC 表达',
    problem: '户外运动后的宠物容易遇到饮水不足、补给不便和携带负担问题，普通水杯难以同时满足卫生、便携与营养补给。',
    output: '一套覆盖使用流程、结构表达、外观渲染与场景展示的宠物运动饮水产品概念。',
    tools: 'Sketch / Rhino / KeyShot / Midjourney / Photoshop',
    aiRole: 'AI 用于快速探索产品场景、材质氛围与展示视觉，再结合草图和结构图收敛方案。',
    tags: {
      'RED DOT 2026': '红点 2026',
      'PET PRODUCT': '宠物产品',
      'SCENARIO RESEARCH': '场景研究',
      'PRODUCT RENDER': '产品渲染',
      CMF: 'CMF 材质',
    },
    tabs: {
      overview: { label: '概览', title: '户外运动后的宠物补水体验', body: 'DROPLET 将便携补水、营养补给与可视化清洁压缩进一个产品动作。', bullets: ['荣誉：Red Dot Award 2026', '用户：户外宠物与主人', '目标：降低补水与携带负担', '成果：产品概念与场景渲染'] },
      process: { label: '过程', title: '场景驱动的产品推导', body: '从户外运动后的脱水风险切入，逐步推导握持、饮水、透明水路与补给结构。', bullets: ['场景痛点梳理', '草图形态探索', '一体化使用流程'] },
      output: { label: '成果', title: '从草图到渲染的完整表达', body: '草图、流程图、产品渲染与场景图共同让方案更容易被理解和评估。', bullets: ['草图展板', '产品渲染', '使用流程细节'] },
      ai: { label: 'AI 流程', title: 'AI 加速视觉探索', body: 'AI 协助建立展示氛围与视觉叙事，再由产品逻辑筛选可用方向。', bullets: ['场景氛围生成', '材质与光影探索', '与手绘和建模结果交叉验证'] },
    },
    gallery: {
      'SOURCE RENDER': { label: '源渲染', evidenceType: '主视觉证据', caption: '展示产品姿态、比例与户外运动使用场景的主渲染图。' },
      'A4 LAYOUT 1': { label: 'A4 展板 1', evidenceType: '渲染证据', caption: '展示设计概念与整体造型的 A4 展板。' },
      'A4 LAYOUT 2': { label: 'A4 展板 2', evidenceType: '渲染证据', caption: '表现功能细节与手持体验的 A4 展板。' },
      'A4 LAYOUT 3': { label: 'A4 展板 3', evidenceType: '使用证据', caption: '展示使用场景与色彩搭配的 A4 展板。' },
      'A4 LAYOUT 4': { label: 'A4 展板 4', evidenceType: '使用证据', caption: '说明技术细节与结构推导的 A4 展板。' },
      'A4 LAYOUT 5': { label: 'A4 展板 5', evidenceType: '使用证据', caption: '说明内部气流、透明水路与功能细节的 A4 展板。' },
      'A4 LAYOUT 6': { label: 'A4 展板 6', evidenceType: '使用证据', caption: '强调便携性与户外携带场景的 A4 展板。' },
    },
  },
  wrist: {
    title: '腕部康复',
    subtitle: '居家康复 UX 原型',
    summary: '面向居家康复阶段的交互原型，以安全确认、动作反馈和训练结果可视化构成完整体验闭环。',
    role: 'UX 原型设计 / 本地 Demo 搭建 / 交互流程验证',
    problem: '骨折或腕部损伤用户在居家训练中缺少即时反馈，容易出现动作不标准、训练中断和恢复结果不可见的问题。',
    output: '一套解释校准、训练、评分、复盘与任务延续的可交互应用原型和视频证据。',
    tools: 'React Demo / UI Mockup / Video Prototype',
    aiRole: 'AI 用于加速界面状态、Demo 叙事与视觉迭代，交互结构仍由康复场景与设计逻辑主导。',
    tags: { 'UX PROTOTYPE': 'UX 原型', 'HEALTH REHAB': '健康康复', 'LOCAL DEMO': '本地 Demo', 'FLOW + UI + VIDEO': '流程 + UI + 视频' },
    tabs: {
      overview: { label: '概览', title: '让居家康复反馈可见', body: '项目将模糊的“完成训练”转化为用户可以判断、记录和复盘的过程。', bullets: ['目标用户：居家康复训练者', '核心价值：降低训练不确定性', '交付物：可交互应用原型与流程页面'] },
      process: { label: '过程', title: '从安全校准到结果复盘', body: '流程先处理安全与信心，再进入动作识别、评分反馈和任务延续。', bullets: ['训练前检查与校准', '动作过程中的反馈', '训练后结果与任务映射'] },
      output: { label: '成果', title: '直接解释体验的 Demo', body: 'UI、流程图与视频共同构成可快速评估的招聘展示证据。', bullets: ['界面系统', '四步用户流程', '可播放视频样片'] },
      ai: { label: 'AI 流程', title: 'AI 作为迭代支持', body: 'AI 协助生成界面状态和 Demo 素材，产品逻辑仍受康复场景约束。', bullets: ['快速界面氛围探索', 'Demo 叙事支持', '可解释的交互结构'] },
    },
    gallery: {
      'UI SOURCE': { label: 'UI 源稿', evidenceType: '原型证据', caption: '围绕训练流程组织的核心应用界面证据。' },
      '4 STEP FLOW': { label: '四步流程', evidenceType: '流程证据', caption: '展示用户从校准进入训练，再回到结果反馈的四步流程。' },
      'RESEARCH BOARD': { label: '研究板', evidenceType: '研究证据', caption: '说明康复约束、风险与交互机会的问题框定与早期研究。' },
      'MOTION DEMO': { label: '动作 Demo', evidenceType: '动效证据', caption: '展示动作反馈、评分状态和训练节奏的演示素材。' },
    },
  },
  aquara: {
    title: 'AQUARA',
    subtitle: '鱼缸清洁机器人',
    summary: '面向中大型鱼缸维护的产品系统，将清洁、充电停靠与自维护整合为连续的家庭护理体验。',
    role: '工业设计 / 产品策略 / 结构与 CMF 表达',
    problem: '大型鱼缸容易快速积累藻类，人工清洁频繁、打扰大，也很难保持稳定一致的清洁效果。',
    output: '一套覆盖机器人主体、充电底座、清洁路径与视觉展示系统的产品概念。',
    tools: 'Rhino / KeyShot / Photoshop / AI-assisted Rendering',
    aiRole: 'AI 协助探索渲染氛围和视觉方向，产品路径与结构来自真实使用场景的约束。',
    tags: { 'INDUSTRIAL DESIGN': '工业设计', ROBOTICS: '机器人', CMF: 'CMF 材质', 'AI RENDERING': 'AI 渲染' },
    tabs: {
      overview: { label: '概览', title: '低干预的鱼缸清洁系统', body: 'AQUARA 将清洁、停靠与自维护整合为一个家庭鱼缸护理系统。', bullets: ['场景：中大型鱼缸', '目标：藻类与缸壁清洁', '成果：机器人与底座概念'] },
      process: { label: '过程', title: '从痛点到产品路径', body: '项目先定义工作边界与清洁路径，再用形态迭代让产品逻辑变得可信。', bullets: ['清洁路径推导', '停靠与自清洁逻辑', '形态比例与结构组件'] },
      output: { label: '成果', title: '完整的工业设计证据', body: '多视图、系统卡片和细节渲染让概念不只停留在一张主视觉图。', bullets: ['六视图', '系统说明', '细节与材质渲染'] },
      ai: { label: 'AI 流程', title: 'AI 服务于表达，而非结构', body: 'AI 协助探索展示质量，功能和装配逻辑仍由设计判断确定。', bullets: ['渲染氛围探索', '构图迭代', '以产品逻辑为锚点的最终证据'] },
    },
    gallery: {
      'SIX VIEWS': { label: '六视图', evidenceType: '形态证据', caption: '展示产品比例、表面关系与关键形态决策的六视图证据。' },
      'SYSTEM CARD': { label: '系统卡片', evidenceType: '系统证据', caption: '说明机器人、底座与鱼缸清洁场景关系的系统卡片。' },
      'CMF BOARD': { label: 'CMF 展板', evidenceType: 'CMF 证据', caption: '展示材质、色彩与表面处理方向的 CMF 展板。' },
    },
  },
  cookware: {
    title: '户外炊具',
    subtitle: '家庭户外烹饪系统',
    summary: '将家庭户外烹饪问题转化为紧凑的产品系统，整合安全、收纳、携带与烹饪行为。',
    role: '毕业设计 / 工业设计 / 产品建模与渲染',
    problem: '家庭野餐面临明火安全、炊具分散笨重和配件容易丢失等户外烹饪问题。',
    output: '一套覆盖炉体、嵌套锅、配件托盘、工程图、展示板与论文问题框定的完整产品概念。',
    tools: 'Rhino / KeyShot / Photoshop / Product Board / Thesis Writing',
    aiRole: 'AI 协助提升渲染清晰度与户外场景氛围，产品结构、论文论证与展板组织来自毕业设计过程。',
    tags: { 'GRADUATION DESIGN': '毕业设计', 'OUTDOOR COOKWARE': '户外炊具', 'PRODUCT RENDER': '产品渲染', 'ENGINEERING DRAWING': '工程图' },
    tabs: {
      overview: { label: '概览', title: '更安全的家庭户外炊具概念', body: '项目将家庭户外烹饪问题转化为结合安全、收纳、携带和烹饪行为的紧凑产品系统。', bullets: ['用户：家庭露营与野餐人群', '价值：降低安全与收纳摩擦', '交付物：渲染、展板、工程图与论文框定'] },
      process: { label: '过程', title: '从论文问题到产品系统', body: '论文将明火风险、炊具分散和配件丢失定义为设计问题，再通过一体化收纳、嵌套锅与配件托盘回应。', bullets: ['竞品与用户问题框定', '草图与形态探索', '细节与场景展板证据'] },
      output: { label: '成果', title: '渲染、展板证据与工程图', body: '新的产品渲染负责视觉表达，展板裁切与工程图让项目回到过程与结构。', bullets: ['主视觉与场景渲染', '展板过程裁切', '工程图'] },
      ai: { label: 'AI 流程', title: 'AI 只强化展示表达', body: 'AI 用于渲染增强与户外氛围支持，最终判断仍锚定在建模、论文内容与展板证据上。', bullets: ['渲染质量支持', '户外氛围迭代', '保留结构与论文证据'] },
    },
    gallery: {
      'CONTEXT RENDER': { label: '场景渲染', evidenceType: '场景证据', caption: '展示产品在家庭露营与桌面烹饪场景中的使用关系。' },
      'STUDIO RENDER': { label: '产品渲染', evidenceType: '产品证据', caption: '说明炉体、嵌套锅、侧边配件托盘与黑白 CMF 方向。' },
      'PROCESS BOARD': { label: '过程展板', evidenceType: '过程证据', caption: '展示从问题、草图到产品方案的过程证据。' },
      'ENGINEERING DRAWING': { label: '工程图', evidenceType: '工程证据', caption: '展示尺寸、视图与面向制造的结构表达。' },
    },
  },
};

function localizeProject(project: Project, language: Language): Project {
  if (language === 'en') return project;
  const translation = PROJECT_ZH[project.id];
  return {
    ...project,
    title: translation.title,
    subtitle: translation.subtitle,
    summary: translation.summary,
    role: translation.role,
    problem: translation.problem,
    output: translation.output,
    tools: translation.tools,
    aiRole: translation.aiRole,
    tags: project.tags.map(tag => translation.tags[tag] ?? tag),
    tabs: project.tabs.map(tab => ({ ...tab, ...(translation.tabs[tab.id] ?? {}) })),
    gallery: project.gallery.map(item => ({ ...item, ...(translation.gallery[item.label] ?? {}) })),
  };
}

interface ActiveMedia {
  projectId: ProjectId;
  index: number;
}

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

const MatterRuntime = MatterLib as unknown as MatterApi;

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
  const normalizedSuggestion = suggestion.toLowerCase();
  const matchedProject = PROJECT_SUGGESTIONS.find(item =>
    item.label.toLowerCase() === normalizedSuggestion || item.target === normalizedSuggestion,
  );
  if (matchedProject) return matchedProject.target;
  if (normalizedSuggestion.includes('wrist') || normalizedSuggestion.includes('rehab')) return 'wrist';
  if (normalizedSuggestion.includes('aquara') || normalizedSuggestion.includes('aquarium')) return 'aquara';
  if (normalizedSuggestion.includes('droplet') || normalizedSuggestion.includes('pet')) return 'droplet';
  if (normalizedSuggestion.includes('outdoor') || normalizedSuggestion.includes('cookware')) return 'cookware';
  if (normalizedSuggestion.includes('industrial') || normalizedSuggestion.includes('ux') || normalizedSuggestion.includes('ai')) return 'contact';
  return 'projects';
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function collectSearchStrings(value: unknown, output: string[] = []) {
  if (typeof value === 'string') {
    output.push(value);
  } else if (Array.isArray(value)) {
    value.forEach(item => collectSearchStrings(item, output));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(item => collectSearchStrings(item, output));
  }
  return output;
}

function isSubsequence(query: string, text: string) {
  let queryIndex = 0;
  for (const character of text) {
    if (character === query[queryIndex]) queryIndex += 1;
    if (queryIndex === query.length) return true;
  }
  return false;
}

function levenshteinWithin(query: string, text: string, limit: number) {
  if (Math.abs(query.length - text.length) > limit) return limit + 1;

  let previous = Array.from({ length: text.length + 1 }, (_, index) => index);
  for (let row = 1; row <= query.length; row += 1) {
    const current = [row];
    let rowMinimum = current[0];

    for (let column = 1; column <= text.length; column += 1) {
      const cost = query[row - 1] === text[column - 1] ? 0 : 1;
      const value = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost,
      );
      current[column] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }

    if (rowMinimum > limit) return limit + 1;
    previous = current;
  }

  return previous[text.length];
}

function fuzzyTermScore(query: string, term: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedQuery || !normalizedTerm || normalizedQuery.length < 2) return 0;
  if (normalizedTerm.includes(normalizedQuery)) return 100;
  if (normalizedQuery.length >= 3 && isSubsequence(normalizedQuery, normalizedTerm)) return 78;
  if (normalizedQuery.length < 3) return 0;

  const limit = normalizedQuery.length <= 4 ? 1 : Math.min(2, Math.floor(normalizedQuery.length * 0.25));
  const minLength = Math.max(1, normalizedQuery.length - limit);
  const maxLength = normalizedQuery.length + limit;
  let bestScore = 0;

  for (let length = minLength; length <= maxLength; length += 1) {
    for (let start = 0; start + length <= normalizedTerm.length; start += 1) {
      const distance = levenshteinWithin(
        normalizedQuery,
        normalizedTerm.slice(start, start + length),
        limit,
      );
      if (distance <= limit) bestScore = Math.max(bestScore, 68 - distance * 12);
    }
  }

  return bestScore;
}

function getSearchTerms(project: Project, language: Language) {
  const localized = localizeProject(project, language);
  return [
    ...collectSearchStrings(project),
    ...collectSearchStrings(localized),
    ...(PROJECT_SEARCH_ALIASES[project.id] ?? []),
  ];
}

function getSearchTarget(query: string, language: Language): OpenTarget {
  const needle = normalizeSearchText(query);
  if (!needle) return 'projects';

  const personalMatch = PERSONAL_SEARCH_ALIASES.find(({ terms }) =>
    terms.some(term => fuzzyTermScore(query, term) >= FUZZY_MATCH_THRESHOLD),
  );
  if (personalMatch) return personalMatch.target;

  const matchedProject = projects
    .map(project => ({ project, score: Math.max(...getSearchTerms(project, language).map(term => fuzzyTermScore(query, term))) }))
    .sort((a, b) => b.score - a.score)
    .find(item => item.score >= FUZZY_MATCH_THRESHOLD)?.project;

  const slideMatch = portfolioContent.slides.find(slide => {
    if (slide.kind === 'contact' || !projects.some(project => project.id === slide.id)) return false;
    return collectSearchStrings(slide).some(term => fuzzyTermScore(query, term) >= FUZZY_MATCH_THRESHOLD);
  });

  if (matchedProject) return matchedProject.id;
  if (slideMatch && slideMatch.id in PROJECT_SEARCH_ALIASES) return slideMatch.id as ProjectId;
  return getSuggestionTarget(query);
}

function isFixedControlTarget(target: EventTarget | null) {
  const element = target instanceof Element ? target : null;
  return Boolean(element?.closest(
    [
      '.gravity-control',
      '.antigravity-home-button',
      '.detail-back',
      '.antigravity-nav',
      '.antigravity-topline',
      '.antigravity-search',
      '.antigravity-suggestions',
      '.antigravity-actions',
      '.antigravity-skill-tags',
      '.project-tabs',
      '.gallery-row',
      '.project-bottom-row',
      '.media-overlay',
      '.embedded-demo-overlay',
      '.model-preview-overlay',
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

export function LegacyParticlePortfolioTitle({ onOpen }: { onOpen: () => void }) {
  const titleRootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false, influence: 0 });

  useEffect(() => {
    const root = titleRootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    const sampleCanvas = document.createElement('canvas');
    const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!context || !sampleContext) return undefined;

    type Particle = {
      x: number;
      y: number;
      homeX: number;
      homeY: number;
      vx: number;
      vy: number;
      size: number;
      phase: number;
      alpha: number;
    };
    let particles: Particle[] = [];
    let haloParticles: Particle[] = [];
    let frame = 0;
    let disposed = false;
    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let lastTime = performance.now();

    const rebuildText = () => {
      if (disposed) return;
      const rect = root.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      sampleCanvas.width = width;
      sampleCanvas.height = height;
      sampleContext.clearRect(0, 0, width, height);
      const title = root.querySelector<HTMLElement>('.antigravity-logo strong');
      const titleStyle = title ? getComputedStyle(title) : null;
      const fontSize = titleStyle ? Number.parseFloat(titleStyle.fontSize) : Math.min(184, Math.max(54, width * 0.16));
      const fontWeight = titleStyle?.fontWeight ?? '900';
      const fontFamily = titleStyle?.fontFamily ?? 'Rajdhani, Arial Narrow, system-ui, sans-serif';
      sampleContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      sampleContext.textAlign = 'center';
      sampleContext.textBaseline = 'middle';
      sampleContext.fillStyle = '#101518';
      sampleContext.fillText('Portfolio', width / 2, height / 2 + fontSize * 0.04);

      const pixels = sampleContext.getImageData(0, 0, width, height).data;
      const particleSize = 2;
      const columns = Math.ceil(width / particleSize);
      const cells = new Map<number, { x: number; y: number }>();
      const occupied = new Set<string>();

      // Register every grid cell touched by the glyph. Rendering one square
      // per cell keeps the interior perfectly tiled; the mask below trims the
      // outer cells back to the actual letter silhouette.
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (pixels[(y * width + x) * 4 + 3] <= 12) continue;
          const cellX = Math.floor(x / particleSize) * particleSize;
          const cellY = Math.floor(y / particleSize) * particleSize;
          const key = (cellY / particleSize) * columns + cellX / particleSize;
          if (!cells.has(key)) {
            cells.set(key, { x: cellX, y: cellY });
            occupied.add(`${cellX}:${cellY}`);
          }
        }
      }

      particles = Array.from(cells.values()).map((point, index) => ({
        x: point.x,
        y: point.y,
        homeX: point.x,
        homeY: point.y,
        vx: 0,
        vy: 0,
        size: particleSize,
        phase: index * 0.37,
        alpha: 1,
      }));

      // Add one restrained ring of round particles around the silhouette.
      // These soften the square grid without changing the clean tiled core.
      const haloCells = new Map<string, { x: number; y: number }>();
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const point of cells.values()) {
        for (const [dx, dy] of directions) {
          const haloX = point.x + dx * particleSize;
          const haloY = point.y + dy * particleSize;
          if (occupied.has(`${haloX}:${haloY}`)) continue;
          haloCells.set(`${haloX}:${haloY}`, {
            x: haloX + particleSize / 2,
            y: haloY + particleSize / 2,
          });
        }
      }
      haloParticles = Array.from(haloCells.values()).map((point, index) => ({
        x: point.x,
        y: point.y,
        homeX: point.x,
        homeY: point.y,
        vx: 0,
        vy: 0,
        size: particleSize * 1.35,
        phase: index * 0.23,
        alpha: 0.24,
      }));
      root.dataset.particleCount = String(particles.length + haloParticles.length);
      root.dataset.particleFallback = particles.length === 0 ? 'true' : 'false';
    };

    const render = (time: number) => {
      if (disposed) return;
      const delta = Math.min(1.45, Math.max(0.7, (time - lastTime) / 16.67));
      lastTime = time;
      const pointer = pointerRef.current;
      const repelRadius = width < 620 ? 40 : 52;
      const repelStrength = width < 620 ? 3.5 : 4;
      const haloDisplacement = width < 620 ? 1.1 : 1.5;
      const targetInfluence = pointer.active ? 1 : 0;
      pointer.influence += (targetInfluence - pointer.influence) * Math.min(1, 0.12 * delta);
      const influence = pointer.influence;
      const isResting = influence < 0.002;

      const updateParticle = (particle: Particle, displacementLimit: number) => {
        if (isResting) {
          particle.x = particle.homeX;
          particle.y = particle.homeY;
          particle.vx = 0;
          particle.vy = 0;
          return;
        }

        particle.vx += (particle.homeX - particle.x) * 0.026 * delta;
        particle.vy += (particle.homeY - particle.y) * 0.026 * delta;
        const awayX = particle.x - pointer.x;
        const awayY = particle.y - pointer.y;
        const distanceSq = awayX * awayX + awayY * awayY;
        if (distanceSq > 0.1 && distanceSq < repelRadius * repelRadius) {
          const distance = Math.sqrt(distanceSq);
          const force = repelStrength * influence * (1 - distance / repelRadius);
          particle.vx += (awayX / distance) * force * 0.03 * delta;
          particle.vy += (awayY / distance) * force * 0.03 * delta;
        }

        particle.vx *= 0.84;
        particle.vy *= 0.84;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.x = Math.max(particle.homeX - displacementLimit, Math.min(particle.homeX + displacementLimit, particle.x));
        particle.y = Math.max(particle.homeY - displacementLimit, Math.min(particle.homeY + displacementLimit, particle.y));
      };

      context.globalCompositeOperation = 'source-over';
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#101518';
      for (const particle of particles) {
        // Keep the tiled wordmark fixed. Only the outer halo responds to the
        // pointer, so the readable title can never be erased by a gap.
        particle.x = particle.homeX;
        particle.y = particle.homeY;
        particle.vx = 0;
        particle.vy = 0;
        context.globalAlpha = particle.alpha;
        context.fillRect(particle.x, particle.y, particle.size + 0.42, particle.size + 0.42);
      }

      // Keep the original glyph mask in every state so interaction can never
      // erase the wordmark or expose a hard square edge.
      context.globalCompositeOperation = 'destination-in';
      context.drawImage(sampleCanvas, 0, 0, width, height);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.fillStyle = '#101518';
      for (const particle of haloParticles) {
        updateParticle(particle, haloDisplacement);
        context.globalAlpha = particle.alpha;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      frame = requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(rebuildText);
    observer.observe(root);
    rebuildText();
    void document.fonts?.ready.then(rebuildText);
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={titleRootRef}
      className="antigravity-logo-fluid antigravity-particle-title"
      onPointerMove={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointerRef.current.x = event.clientX - rect.left;
        pointerRef.current.y = event.clientY - rect.top;
        pointerRef.current.active = true;
      }}
      onPointerLeave={() => {
        pointerRef.current.active = false;
      }}
    >
      <canvas ref={canvasRef} className="portfolio-particle-canvas" aria-hidden="true" />
      <button className="antigravity-logo" type="button" data-antigravity-body data-open-target="contact" onClick={onOpen}>
        <strong>Portfolio</strong>
      </button>
    </div>
  );
}

function ClearPortfolioTitle({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="antigravity-logo-fluid">
      <button className="antigravity-logo" type="button" data-antigravity-body data-open-target="contact" onClick={onOpen}>
        <strong>Portfolio</strong>
      </button>
    </div>
  );
}

export function OrbitalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let frame = 0;

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time: number) => {
      const t = time * 0.0001;
      const radius = Math.hypot(width, height) / 2;
      const flow = Math.sin(t * 1.6) * 0.5 + 0.5;

      context.fillStyle = 'rgba(244, 247, 246, 0.16)';
      context.fillRect(0, 0, width, height);
      context.lineCap = 'round';

      for (let i = -20; i < 0; i += 1) {
        for (let j = 14; j > 0; j -= 1) {
          const u = (i + (j % 2) / 2) * 0.777 + t;
          const orbit = Math.exp(u) * radius;
          const angle = j * 0.449 + flow * 9;
          const centerX = width / 2 + orbit * Math.cos(angle);
          const centerY = height / 2 + orbit * Math.sin(angle);
          const opacity = Math.min(0.12, 0.025 + orbit / radius * 0.06);

          context.strokeStyle = j % 5 === 0
            ? `rgba(25, 184, 149, ${opacity})`
            : `rgba(17, 23, 26, ${opacity})`;
          context.lineWidth = Math.min(4.5, Math.max(0.45, orbit / 44));
          context.beginPath();
          context.arc(centerX, centerY, orbit * 0.36, 0, Math.PI * 2);
          context.stroke();
        }
      }

      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="antigravity-orbital-background" aria-hidden="true" />;
}

export default function AntigravityPlayground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const homeRef = useRef<HTMLElement>(null);
  const projectsRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, target: null as HTMLElement | null, moved: false });
  const suppressClickRef = useRef(false);
  const [query, setQuery] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [gravityEnabled, setGravityEnabled] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [navOpen, setNavOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<ProjectId | null>(null);
  const [pendingScroll, setPendingScroll] = useState<SectionId | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<ProjectId, ProjectTabKey>>({
    wrist: 'overview',
    aquara: 'overview',
    droplet: 'overview',
    cookware: 'overview',
  });
  const [activeMedia, setActiveMedia] = useState<ActiveMedia | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const gravityEnabledRef = useRef(gravityEnabled);
  const activeSectionRef = useRef(activeSection);
  const activeProjectIdRef = useRef(activeProjectId);
  const activeMediaRef = useRef(activeMedia);
  const resumeOpenRef = useRef(resumeOpen);
  const activeSuggestion = PROJECT_SUGGESTIONS[suggestionIndex % PROJECT_SUGGESTIONS.length];
  const copy = UI_COPY[language];
  const activeSuggestionLabel = language === 'zh'
    ? localizeProject(projects.find(project => project.id === activeSuggestion.target) ?? projects[0], language).title
    : activeSuggestion.label;
  const activeProject = useMemo(
    () => localizeProject(projects.find(project => project.id === activeProjectId) ?? projects[0], language),
    [activeProjectId, language],
  );

  useEffect(() => {
    gravityEnabledRef.current = gravityEnabled;
    activeSectionRef.current = activeSection;
    activeProjectIdRef.current = activeProjectId;
    activeMediaRef.current = activeMedia;
    resumeOpenRef.current = resumeOpen;
  }, [activeMedia, activeProjectId, activeSection, gravityEnabled, resumeOpen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSuggestionIndex(index => (index + 1) % PROJECT_SUGGESTIONS.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const observerOptions = {
      root,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const visibleEntry = entries.find(entry => entry.isIntersecting);
      if (!visibleEntry) return;

      const id = visibleEntry.target.id;
      if (id === 'gravity-home') setActiveSection('home');
      else if (id === 'gravity-projects') setActiveSection('projects');
      else if (id === 'gravity-contact') setActiveSection('contact');
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    if (homeRef.current) observer.observe(homeRef.current);
    if (projectsRef.current) observer.observe(projectsRef.current);
    if (contactRef.current) observer.observe(contactRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
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

    MatterRef = MatterRuntime;
    buildWorld(MatterRuntime);

    const handleResize = () => {
      if (!MatterRef) return;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => buildWorld(MatterRef as MatterApi), 160);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupWorld();
    };
  }, [activeMedia, activeProjectId, gravityEnabled]);

  const scrollTo = useCallback((section: SectionId) => {
    const root = rootRef.current;
    const target = {
      home: homeRef.current,
      projects: projectsRef.current,
      contact: contactRef.current,
    }[section];
    if (!root || !target) return;
    root.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const sections: SectionId[] = ['home', 'projects', 'contact'];
    let wheelAccumulator = 0;
    let lastWheelSign = 0;
    let isAnimating = false;
    let unlockTimer = 0;

    const getNearestSection = () => {
      const sectionNodes = {
        home: homeRef.current,
        projects: projectsRef.current,
        contact: contactRef.current,
      };
      return sections.reduce((nearest, section) => {
        const currentDistance = Math.abs((sectionNodes[section]?.offsetTop ?? 0) - root.scrollTop);
        const nearestDistance = Math.abs((sectionNodes[nearest]?.offsetTop ?? 0) - root.scrollTop);
        return currentDistance < nearestDistance ? section : nearest;
      }, activeSectionRef.current);
    };

    const onWheel = (event: WheelEvent) => {
      if (
        activeProjectIdRef.current ||
        activeMediaRef.current ||
        resumeOpenRef.current
      ) {
        return;
      }

      event.preventDefault();
      if (isAnimating) return;

      const axisDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const sign = Math.sign(axisDelta);
      if (sign === 0) return;

      if (sign !== lastWheelSign) {
        wheelAccumulator = 0;
      }
      lastWheelSign = sign;
      wheelAccumulator += Math.abs(axisDelta);

      if (wheelAccumulator < 72) return;
      wheelAccumulator = 0;

      const currentIndex = sections.indexOf(getNearestSection());
      const targetIndex = Math.min(sections.length - 1, Math.max(0, currentIndex + sign));
      if (targetIndex === currentIndex) return;

      const nextSection = sections[targetIndex];
      isAnimating = true;
      activeSectionRef.current = nextSection;
      setActiveSection(nextSection);
      scrollTo(nextSection);

      if (unlockTimer) window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        isAnimating = false;
      }, 760);
    };

    root.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => {
      root.removeEventListener('wheel', onWheel, { capture: true });
      if (unlockTimer) window.clearTimeout(unlockTimer);
    };
  }, [scrollTo]);

  useEffect(() => {
    if (!pendingScroll || activeProjectId) return undefined;

    const timer = window.setTimeout(() => {
      scrollTo(pendingScroll);
      setPendingScroll(null);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [activeProjectId, gravityEnabled, pendingScroll, scrollTo]);

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
      openTarget(getSearchTarget(query || activeSuggestion.label, language));
      return;
    }

    if (target === 'home' || target === 'projects' || target === 'contact') {
      setActiveProjectId(null);
      setActiveMedia(null);
      setResumeOpen(false);
      if (target === 'contact') setGravityEnabled(true);
      setActiveSection(target); // 立即同步更新按钮的选中特写
      setPendingScroll(target);
      return;
    }

    setActiveProjectId(target);
    setActiveMedia(null);
    setGravityEnabled(true);
  };

  const activateSuggestion = (value: string) => {
    setQuery(value);
    openTarget(getSearchTarget(value, language));
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
      className={`antigravity-playground ${gravityEnabled ? 'is-gravity-on' : 'is-zero-g'} ${language === 'zh' ? 'is-lang-zh' : ''} ${activeProjectId || resumeOpen ? 'has-project-open' : ''}`}
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
        <nav className={`antigravity-nav ${navOpen ? 'is-open' : ''}`} aria-label="Portfolio navigation">
          <button
            className="nav-collapse-toggle"
            type="button"
            aria-expanded={navOpen}
            aria-controls="portfolio-nav-links"
            aria-label={language === 'zh' ? '展开导航' : 'Open navigation'}
            onClick={() => setNavOpen(open => !open)}
          >
            <Menu size={16} />
            <span>{language === 'zh' ? '导航' : 'MENU'}</span>
            <ChevronDown size={14} />
          </button>
          <div className="nav-link-panel" id="portfolio-nav-links">
            <button type="button" onClick={() => { setNavOpen(false); openTarget('home'); }}>{copy.home}</button>
            <button type="button" onClick={() => { setNavOpen(false); openTarget('projects'); }}>{copy.works}</button>
            <button type="button" onClick={() => { setNavOpen(false); openTarget('contact'); }}>{copy.contact}</button>
            <button
              className="language-toggle"
              type="button"
              aria-pressed={language === 'zh'}
              aria-label={copy.languageLabel}
              onClick={() => { setNavOpen(false); setLanguage(current => current === 'en' ? 'zh' : 'en'); }}
            >
              {copy.languageButton}
            </button>
          </div>
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
            <small>{copy.gravity}</small>
            <strong>{gravityEnabled ? copy.on : copy.off}</strong>
          </span>
          <i aria-hidden="true" />
        </button>
      </div>

      <button
        className={`antigravity-home-button ${activeProjectId ? 'is-project-back-button' : ''}`}
        type="button"
        onClick={() => openTarget(activeProjectId ? 'projects' : 'home')}
        aria-label={activeProjectId ? copy.back : copy.home}
      >
        {activeProjectId ? <ArrowLeft size={17} strokeWidth={1.8} /> : <House size={17} strokeWidth={1.8} />}
      </button>

      <main className="antigravity-scroll">
        <section className="antigravity-section antigravity-home" id="gravity-home" ref={homeRef}>
          <div className="antigravity-section-inner antigravity-hero">
            <ClearPortfolioTitle onOpen={() => openTarget('contact')} />

            <form
              className="antigravity-search"
              data-antigravity-body
              data-open-target="search"
              onSubmit={event => {
                event.preventDefault();
                openTarget(query.trim() ? getSearchTarget(query, language) : activeSuggestion.target);
              }}
              aria-label={copy.search}
            >
              <button className="antigravity-search-submit" type="submit" aria-label={`Open ${activeSuggestionLabel}`}>
                <Search size={19} />
              </button>
              <input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={activeSuggestionLabel}
                aria-label={copy.search}
              />
            </form>

            <section className="antigravity-suggestions" aria-label="Search recommendations">
              <span>{copy.try}</span>
              {PROJECT_SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion.target}
                  type="button"
                  className={suggestion.target === activeSuggestion.target ? 'active' : ''}
                  onClick={() => activateSuggestion(suggestion.label)}
                  data-antigravity-body
                  data-open-target={suggestion.target}
                >
                  {language === 'zh'
                    ? localizeProject(projects.find(project => project.id === suggestion.target) ?? projects[0], language).title
                    : suggestion.label}
                </button>
              ))}
            </section>

          </div>
        </section>

        <section className="antigravity-section antigravity-projects-page" id="gravity-projects" ref={projectsRef}>
          <div className="antigravity-section-inner">
            <div className="antigravity-section-heading">
              <span className="heading-stem" />
              <div>
                <p className="antigravity-english-heading">SELECTED WORKS</p>
                <h2 className="antigravity-cjk-heading antigravity-english-heading">Works &amp; Resume</h2>
              </div>
            </div>

            <div className="antigravity-card-cloud" aria-label={language === 'zh' ? '项目与简历卡片' : 'Project and resume cards'}>
              {projects.map((project, index) => {
                const displayProject = localizeProject(project, language);
                return (
                  <button
                    key={project.id}
                    className={`antigravity-result-card project-work-card project-work-card--${project.id} ${accentClass(project.accent)}`}
                    type="button"
                    onClick={() => {
                      if (gravityEnabled) openTarget(project.id);
                    }}
                    data-antigravity-body
                    data-open-target={project.id}
                  >
                    <span className="result-index">{String(index + 1).padStart(2, '0')}</span>
                    <img src={PROJECT_CARD_COVERS[project.id] ?? project.cover} alt={`${displayProject.title} preview`} draggable={false} />
                    <span className="result-copy">
                      <strong className="antigravity-cjk-heading">{displayProject.title}</strong>
                      <small>{displayProject.subtitle}</small>
                    </span>
                    {project.id === 'droplet' && (
                      <img
                        className="red-dot-card-mark"
                        src="./red-dot-mark-2026.png"
                        alt="Red Dot Design Concept Award 2026"
                        draggable={false}
                      />
                    )}
                  </button>
                );
              })}

              {/* Removed redundant PDF resume button from works stack as requested */}
            </div>
          </div>
        </section>

        <section className="antigravity-section antigravity-contact-page" id="gravity-contact" ref={contactRef}>
          <div className="antigravity-section-inner">
            <div className="antigravity-section-heading">
              <span className="heading-stem" />
              <div>
                <p>{language === 'zh' ? '联系' : 'CONTACT'}</p>
                <h2 className="antigravity-cjk-heading">{language === 'zh' ? '孙启圣' : 'Sun Qisheng'}</h2>
              </div>
            </div>

            <section className="antigravity-detail contact-page contact-page-long">
              <article className="contact-profile" data-antigravity-body data-open-target="resume">
                <span>{language === 'zh' ? '产品与体验设计' : 'Product & Experience Design'}</span>
                <h3 className="antigravity-cjk-heading">孙启圣</h3>
                <p>{language === 'zh'
                  ? '专注于产品系统、UX 原型、AI 辅助视觉流程与可展示交互 Demo 的工业设计研究生。'
                  : 'Industrial design graduate student focused on product systems, UX prototypes, AI-assisted visual workflows, and portfolio-ready interaction demos.'}</p>
                <p className="contact-award-note">{language === 'zh'
                  ? 'DROPLET 获得 Red Dot Award: Design Concept Winner 2026。'
                  : 'DROPLET received the Red Dot Award: Design Concept Winner 2026.'}</p>
                <div className="contact-chip-row">
                  <strong className="is-award-chip">Red Dot 2026</strong>
                  {skillTags.map(tag => <strong key={tag.title}>{language === 'zh' ? SKILL_TAG_ZH[tag.title] ?? tag.title : tag.title}</strong>)}
                </div>
              </article>

              <div className="contact-resume-card" data-antigravity-body data-open-target="resume">
                <div className="premium-resume-mockup">
                  <div className="resume-mock-top">
                    <div className="resume-mock-meta">
                      <h3>孙启圣 / Andre Sun</h3>
                      <p className="resume-mock-tagline">产品与体验设计师 · 硕士在读</p>
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
                        <div className="resume-mock-item" style={{ marginTop: '0.4rem' }}>
                          <strong>亳州学院</strong>
                          <span>产品设计本科 · 毕业</span>
                        </div>
                      </section>
                    </div>
                    <div className="resume-mock-col right">
                      <section>
                        <h4>核心技能 / Skills</h4>
                        <div className="resume-skill-list">
                          <span>UI/UX</span>
                          <span>AIGC</span>
                          <span>3D 渲染</span>
                          <span>交互原型</span>
                        </div>
                      </section>
                      <section style={{ marginTop: '0.5rem' }}>
                        <h4>代表作 / Selected</h4>
                        <div className="resume-mock-project-brief">
                          <span>1. DROPLET · Red Dot 2026 Winner</span>
                          <span>2. 腕部康复交互系统</span>
                        </div>
                      </section>
                    </div>
                  </div>
                  
                  <div className="resume-mock-footer">
                    <span>双击卡片 展开高保真网页简历</span>
                  </div>
                </div>
                <a className="resume-open-link" href={RESUME_FILE} target="_blank" rel="noreferrer">
                  <FileText size={17} />
                  {copy.openResume}
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
                <div data-antigravity-body data-open-target="contact">
                  <MessageCircle size={18} />
                  <span>微信号 {WECHAT_ID}</span>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>

      {activeProjectId && (
        <ProjectDetail
          project={activeProject}
          language={language}
          activeTab={activeTabs[activeProject.id] ?? 'overview'}
          onTabChange={tab => setProjectTab(activeProject.id, tab)}
          onOpenMedia={index => setActiveMedia({ projectId: activeProject.id, index })}
        />
      )}

      {resumeOpen && (
        <ResumeDetail />
      )}

      {activeMedia && (
        <MediaOverlay
          mediaState={activeMedia}
          language={language}
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
  language,
  activeTab,
  onTabChange,
  onOpenMedia,
}: {
  project: Project;
  language: Language;
  activeTab: ProjectTabKey;
  onTabChange: (tab: ProjectTabKey) => void;
  onOpenMedia: (index: number) => void;
}) {
  const copy = UI_COPY[language];
  const media = getProjectMedia(project);
  const currentTab = project.tabs.find(tab => tab.id === activeTab) ?? project.tabs[0];
  const [demoOpen, setDemoOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [modelInteracting, setModelInteracting] = useState(false);
  const modelPreview = MODEL_ASSET_PREVIEWS[project.id];

  useEffect(() => {
    if (!modelsOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setModelsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modelsOpen]);

  return (
    <section className={`antigravity-detail-overlay ${accentClass(project.accent)}`}>
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
            <h2 className="antigravity-cjk-heading">{project.title}</h2>
            <h3 className="antigravity-cjk-heading">{project.subtitle}</h3>
            <p className="project-summary">{project.summary}</p>

            <div className="project-proof-grid">
              <div>
                <span>{copy.role}</span>
                <strong>{project.role}</strong>
              </div>
              <div>
                <span>{copy.problem}</span>
                <strong>{project.problem}</strong>
              </div>
              <div>
                <span>{copy.output}</span>
                <strong>{project.output}</strong>
              </div>
              <div>
                <span>{copy.tools}</span>
                <strong>{project.tools}</strong>
              </div>
            </div>
          </div>

          <div className={`project-visual-card project-visual-card--${project.id}`}>
            <div className="visual-header">
              <span>{project.title}</span>
              <span>{project.tags.slice(0, 3).join(' / ')}</span>
            </div>
            <div className="project-tabs" role="tablist" aria-label={`${project.title} ${copy.sections}`}>
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
                  {copy.openImage}
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
              {project.demoUrl && (
                <button
                  className="play-demo playable-demo"
                  type="button"
                  onClick={() => setDemoOpen(true)}
                  data-no-page-swipe="true"
                >
                  <ExternalLink size={17} />
                  {copy.playableDemo}
                </button>
              )}
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
                  {copy.playVideo}
                </button>
              )}
              {modelPreview && (
                <button
                  className="model-preview-trigger model-preview-entry"
                  type="button"
                  onClick={() => setModelsOpen(true)}
                  data-no-page-swipe="true"
                >
                  <span className="model-preview-entry-icon" aria-hidden="true"><Box size={21} /></span>
                  <span className="model-preview-entry-copy">
                    <small>INTERACTIVE 3D</small>
                    <strong>{language === 'zh' ? '旋转查看 · 结构动画' : 'Rotate · Explore · Animate'}</strong>
                    <em>{language === 'zh' ? '进入模型查看器' : 'Open model viewer'}</em>
                  </span>
                  <ExternalLink className="model-preview-entry-arrow" size={16} aria-hidden="true" />
                </button>
              )}
              <div className="ai-role">
                <span>{copy.aiRole}</span>
                <p>{project.aiRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {demoOpen && project.demoUrl && (
        <div
          className="embedded-demo-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} demo`}
          data-no-page-swipe="true"
          onClick={() => setDemoOpen(false)}
        >
          <div className="embedded-demo-panel" onClick={event => event.stopPropagation()}>
            <div className="embedded-demo-header">
              <span>{project.title} · DEMO</span>
              <button type="button" onClick={() => setDemoOpen(false)} aria-label={copy.closeMedia}>
                <X size={18} />
              </button>
            </div>
            <iframe
              src={project.demoUrl}
              title={`${project.title} interactive demo`}
              allow="camera; microphone; fullscreen"
            />
          </div>
        </div>
      )}

      {modelsOpen && modelPreview && createPortal(
        <div
          className="model-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={modelPreview.title}
          data-no-page-swipe="true"
          onClick={() => {
            if (!modelInteracting) setModelsOpen(false);
          }}
        >
          <div className="model-preview-panel" onClick={event => event.stopPropagation()}>
            <div className="embedded-demo-header">
              <span>{modelPreview.title}</span>
              <div className="model-preview-header-meta">
                <small>{modelPreview.config.size}</small>
                <button type="button" onClick={() => setModelsOpen(false)} aria-label={copy.closeMedia}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="model-preview-body">
              <Suspense fallback={<div className="model-preview-chunk-loading">Loading 3D viewer…</div>}>
                <ModelViewer
                  config={modelPreview.config}
                  language={language}
                  active={modelsOpen}
                  onInteractionChange={setModelInteracting}
                />
              </Suspense>
            </div>
            <div className="model-preview-note">
              {language === 'zh'
                ? modelPreview.config.noteZh ?? modelPreview.config.noteEn
                : modelPreview.config.noteEn ?? modelPreview.config.noteZh}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

function MediaOverlay({
  mediaState,
  language,
  onClose,
  onPrev,
  onNext,
}: {
  mediaState: ActiveMedia;
  language: Language;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const copy = UI_COPY[language];
  const project = localizeProject(projects.find(item => item.id === mediaState.projectId) ?? projects[0], language);
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
          <button type="button" onClick={onClose} aria-label={copy.closeMedia} data-no-page-swipe="true">
            <X size={20} />
          </button>
        </div>

        <div className="media-stage">
          <button className="media-step prev" type="button" onClick={onPrev} disabled={!hasPrev} aria-label={copy.previousMedia}>
            <ArrowLeft size={22} />
          </button>
          {item.type === 'video' ? (
            <video src={item.src} controls autoPlay playsInline className="media-video" data-no-page-swipe="true" />
          ) : (
            <img src={item.src} alt={item.label} className="media-image" draggable={false} />
          )}
          <button className="media-step next" type="button" onClick={onNext} disabled={!hasNext} aria-label={copy.nextMedia}>
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

function ResumeDetail() {
  return (
    <section className="antigravity-detail-overlay accent-teal resume-detail-overlay">
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
                    <span className="timeline-date">2025.09 - 至今</span>
                  </div>
                  <p>产品设计 · 全日制研究生 · 在读</p>
                  <p className="resume-course-detail">主修：设计方法论、用户研究、设计趋势研究、陶瓷产品设计、设计形态与构成研究、产品造型设计、综合韩语等</p>
                </div>
                <div className="resume-timeline-item">
                  <div className="timeline-header">
                    <strong>亳州学院</strong>
                    <span className="timeline-date">2021.09 - 2025.06</span>
                  </div>
                  <p>产品设计 · 全日制本科</p>
                  <p className="resume-course-detail">主修：CMF设计研究、模型制作与工艺、计算机辅助产品设计、家具设计、3D建模与打印、产品开发设计、产品语义设计等</p>
                </div>
              </section>

              <section className="resume-section">
                <h3>专业技能 / Skillsets</h3>
                <div className="skill-category">
                  <strong>UI/UX 设计</strong>
                  <p>具备优秀的 UI 设计能力，熟练使用 Figma 进行界面设计与原型制作，掌握交互设计思维，能准确呈现设计策略的意图。</p>
                </div>
                <div className="skill-category">
                  <strong>AIGC 工具</strong>
                  <p>熟悉 Stable Diffusion、Midjourney 等文生图工具，能搭建 ComfyUI 基础工作流，具备 AI 美学数据建设与标准制定的实操经验。</p>
                </div>
                <div className="skill-category">
                  <strong>3D建模渲染</strong>
                  <p>熟练使用 Rhino、Blender 进行产品建模与渲染，掌握 KeyShot 产品级高精材质与光影渲染技术。</p>
                </div>
                <div className="skill-category">
                  <strong>平面设计</strong>
                  <p>精通 Photoshop、Illustrator，具备完整的视觉设计能力与品牌设计思维。</p>
                </div>
                <div className="skill-category">
                  <strong>用户研究</strong>
                  <p>系统学习用户研究方法论，熟练掌握多维度的用户洞察、场景调研与痛点需求分析能力。</p>
                </div>
                <div className="skill-category">
                  <strong>3D打印</strong>
                  <p>能独立操作熔融沉积（FDM）及光固化（SLA）3D打印机完成硬件与结构的原型制作。</p>
                </div>
              </section>
            </div>

            <div className="resume-body-col right-col">
              <section className="resume-section">
                <h3>大学经历 / Campus Experience</h3>
                
                <div className="resume-experience-item">
                  <div className="experience-header">
                    <h4>产品快题手绘课程助教</h4>
                    <span className="experience-date">2025.02 - 2025.03</span>
                  </div>
                  <ul className="experience-bullets">
                    <li>担任研究生阶段产品快题手绘课程助教，协助导师完成16课时课程大纲设计与教学实施</li>
                    <li>独立承担每周6课时随堂手绘示范、作业批改及一对一答疑，累计辅导40+名本科生</li>
                    <li>学生作业优秀率较上学期提升25%，获导师“认真负责、示范清晰”的高度评价</li>
                  </ul>
                </div>

                <div className="resume-experience-item">
                  <div className="experience-header">
                    <h4>安徽省大学生摄影比赛 · 校赛负责人</h4>
                    <span className="experience-date">2023.09 - 2023.10</span>
                  </div>
                  <ul className="experience-bullets">
                    <li>作为校赛总负责人统筹安徽省大学生摄影比赛校内选拔，独立设计报名-评审全流程机制</li>
                    <li>对接3位评审老师，协调80+份参赛作品收集、分数统计与排名核算，确保赛事零差错</li>
                    <li>承担官网宣传摄影，产出20+张活动现场照片被学校官方平台采用，阅读量累计2,000+</li>
                  </ul>
                </div>

                <div className="resume-experience-item">
                  <div className="experience-header">
                    <h4>校级易班工作站 · 技术部干事</h4>
                    <span className="experience-date">2021.09 - 2023.06</span>
                  </div>
                  <ul className="experience-bullets">
                    <li>负责易班APP网页端视觉运营，独立承担全年6+个传统节日专题页Banner设计及上线</li>
                    <li>作品累计曝光覆盖全校12,000+师生；承担后台舆情监测，日均处理反馈信息30+条</li>
                    <li>保障平台内容合规率达99%+，积极参与迎新工作、参观军事基地等多项宣传活动</li>
                  </ul>
                </div>
              </section>

              <section className="resume-section">
                <h3>荣誉奖励 / Selected Honors</h3>
                <div className="resume-honors-grid">
                  <div className="honor-tag-item">
                    <span className="honor-badge is-gold">RED DOT</span>
                    <strong>DROPLET · Red Dot Award: Design Concept Winner 2026</strong>
                  </div>
                  <div className="honor-tag-item">
                    <span className="honor-badge is-gold">国家级</span>
                    <strong>大学生创新创业大赛 · 筹划项目被评为国家级</strong>
                  </div>
                  <div className="honor-tag-item">
                    <span className="honor-badge">省级</span>
                    <strong>中国大学生计算机设计大赛 · 省级二等奖 (校级二等奖2项、三等奖2项)</strong>
                  </div>
                  <div className="honor-tag-item">
                    <span className="honor-badge">省级</span>
                    <strong>安徽省工业设计大赛 “铜官府杯”专项赛银奖 (省级三等奖1项、校级一等奖1项)</strong>
                  </div>
                  <div className="honor-tag-item">
                    <span className="honor-badge">省级</span>
                    <strong>安徽省大学生摄影作品大赛 · 省级二等奖 (校级三等奖1项)</strong>
                  </div>
                  <div className="honor-tag-item">
                    <span className="honor-badge">省/校级</span>
                    <strong>安徽省原创动漫大赛 · 校级二等奖1项、三等奖1项</strong>
                  </div>
                  <div className="honor-tag-item">
                    <span className="honor-badge">优秀奖</span>
                    <strong>安徽省高校校园原创文化精品展演 · 优秀奖</strong>
                  </div>
                </div>
              </section>

              <section className="resume-section">
                <h3>核心作品与项目经历 / Key Portfolios</h3>

                <div className="resume-project-item">
                  <div className="project-header">
                    <h4>1. DROPLET 宠物运动水杯 (Pet Product Design)</h4>
                    <span className="project-tag">Red Dot 2026 / ID</span>
                  </div>
                  <p className="project-desc">
                    户外运动宠物补水产品，研究户外场景下的宠物脱水与携带痛点，推导手持、喂水、电解质补充与透明水路可视化体验。
                  </p>
                  <p className="project-award-line">Award: Red Dot Award: Design Concept Winner 2026</p>
                  <p className="project-tools">工具链: Sketch / Rhino / KeyShot / Midjourney</p>
                </div>

                <div className="resume-project-item">
                  <div className="project-header">
                    <h4>2. 腕部康复评估交互系统 (UX Prototype)</h4>
                    <span className="project-tag">UX / React / Video</span>
                  </div>
                  <p className="project-desc">
                    面向居家康复训练人群，搭建的一套 React 交互原型样机。打通了开始前安全校准、动作过程中的即时识别与评分反馈、训练后的可视化复盘，验证体验节奏。
                  </p>
                  <p className="project-tools">工具链: React / Tailwind CSS / UI Mockup / Video Prototype</p>
                </div>

                <div className="resume-project-item">
                  <div className="project-header">
                    <h4>3. AQUARA 鱼缸清洁机器人 (Industrial Design)</h4>
                    <span className="project-tag">ID / CMF / System</span>
                  </div>
                  <p className="project-desc">
                    针对中大型鱼缸的维护痛点，设计了包含自动爬壁清洁、充电回仓与刷头自清洁一体化的机器人系统。输出六视图与高精场景渲染，论证形体与材质气质。
                  </p>
                  <p className="project-tools">工具链: Rhino / KeyShot / Photoshop / AIGC rendering</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

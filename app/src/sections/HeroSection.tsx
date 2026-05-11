import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function HeroSection() {
  const { t } = useLanguage();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [bootPhase, setBootPhase] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    let idx = 0;
    const interval = window.setInterval(() => {
      if (idx < 5) {
        setBootPhase(idx);
        idx += 1;
      } else {
        setBootComplete(true);
        window.clearInterval(interval);
      }
    }, 280);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!titleRef.current) return;
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      titleRef.current.style.transform = `translate(${x * 6}px, ${y * 5}px)`;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const bootLines = [
    '0x7F3A9B2C :: ROUTE_MAP -> ONLINE',
    '0xC4D8E1F5 :: GRAVITY_WELL -> LOCKED',
    '0xA1B2C3D4 :: PARTICLE_STREAM -> READY',
    '0xFF004499 :: ANDRE.PORTFOLIO -> LOADED',
  ];

  return (
    <div className="hero-panel relative select-none" style={{ width: 'min(750px, calc(100vw - 48px))' }}>
      {!bootComplete && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#020711]/88 backdrop-blur-sm">
          <div className="animate-blink font-mono text-lg tracking-widest text-teal">[ SYSTEM.BOOT ]</div>
          <div className="mt-4 w-80 max-w-[80vw] space-y-1 text-left font-mono text-xs text-teal/58">
            {bootLines.slice(0, bootPhase).map((line, index) => (
              <div key={line} style={{ opacity: 0, animation: `fadeIn 0.3s ease ${index * 0.08}s forwards` }}>{line}</div>
            ))}
          </div>
        </div>
      )}

      <div className={`relative z-10 px-4 transition-opacity duration-700 ${bootComplete ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mb-4 inline-flex border border-teal/20 bg-teal/[0.04] px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-teal/72">
          Andre作品集网站 / KIMI AGENT GRID
        </div>

        <h1
          ref={titleRef}
          className="font-display text-6xl font-bold uppercase leading-none text-sunflare will-change-transform md:text-8xl"
          style={{ textShadow: '0 0 38px rgba(253, 185, 51, 0.4), 0 0 80px rgba(253, 185, 51, 0.14)' }}
        >
          ANDRE
          <br />
          <span className="text-teal" style={{ textShadow: '0 0 30px rgba(0, 229, 255, 0.4), 0 0 60px rgba(0, 229, 255, 0.14)' }}>PORT</span>
          <br />
          FOLIO
        </h1>

        <div className="mt-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-teal/45 via-sunflare/22 to-transparent" />
          <span className="font-mono text-xs tracking-widest text-teal/58">ROOFTOP_GRID_v2.0.26</span>
        </div>

        <div className="mt-6 max-w-xl">
          <p className="font-body text-[0.96rem] leading-relaxed text-amber/82">
            {t(
              '在 Kimi Agent 赛博网格、产品原型与动态粒子空间之间，展示 Andre 的交互、工业设计与游戏化体验作品。',
              'Andre portfolio in a Kimi Agent cyber grid, combining interaction design, product prototypes, and particle motion.',
            )}
          </p>
          <div className="mt-4 grid max-w-md grid-cols-3 gap-2 font-mono text-xs text-amber/58">
            <div className="hero-stat">
              <span>ROLE</span>
              <strong>{t('产品设计', 'Product')}</strong>
            </div>
            <div className="hero-stat">
              <span>SPACE</span>
              <strong>3D GRID</strong>
            </div>
            <div className="hero-stat">
              <span>STATUS</span>
              <strong className="animate-blink text-teal">ACTIVE</strong>
            </div>
          </div>
        </div>

        <div className="mt-8 animate-float font-mono text-xs tracking-wider text-amber/35">
          [ {t('拖拽任意方向探索，靠近节点会自动磁吸回路线', 'DRAG TO EXPLORE; NEARBY NODES WILL MAGNETIZE THE ROUTE')} ]
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

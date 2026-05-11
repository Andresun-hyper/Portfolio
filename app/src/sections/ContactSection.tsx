import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function ContactSection() {
  const { t } = useLanguage();
  const [pulseActive, setPulseActive] = useState(false);

  const handleConnect = () => {
    setPulseActive(true);
    window.setTimeout(() => setPulseActive(false), 320);
  };

  const techStack = [
    'FIGMA', 'BLENDER', 'THREE.JS', 'REACT',
    'UNITY', 'TOUCHDESIGNER', 'ARDUINO', 'AE',
  ];

  return (
    <div className="contact-panel relative select-none" style={{ width: 'min(600px, calc(100vw - 48px))' }}>
      <div className={`relative ${pulseActive ? 'animate-pulse' : ''}`}>
        <div className="relative px-8 py-10">
          <div className="relative z-10 text-center">
            <div className="mb-4 font-mono text-xs tracking-[0.26em] text-teal/55">
              // CONTACT NODE
            </div>
            <h2
              className="mb-3 font-display text-3xl font-bold text-teal md:text-4xl"
              style={{ textShadow: '0 0 30px rgba(0, 229, 255, 0.4)' }}
            >
              {t('建立连接', 'INITIATE CONNECTION')}
            </h2>
            <p className="mx-auto mb-6 max-w-sm font-body text-sm leading-7 text-amber/64">
              {t('如果你想继续看完整项目、讨论产品交互或合作方向，可以从这个节点发起连接。', 'Use this node to start a conversation about project details, interaction systems, or collaboration.')}
            </p>
            <button
              onClick={handleConnect}
              className="bg-teal px-7 py-3 font-mono text-base font-bold tracking-wider text-void transition-colors duration-300 hover:bg-sunflare"
              data-hover="true"
              data-no-drag="true"
              type="button"
            >
              INITIATE_CONNECTION()
            </button>
            <div className="mt-5 font-mono text-xs text-amber/42">
              {'>'} andre@portfolio.grid
              <span className="animate-blink text-teal">_</span>
            </div>
          </div>
        </div>

        {pulseActive && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="absolute inset-0 bg-teal/8" />
            <div className="absolute left-0 right-0 top-1/3 h-2 -translate-x-2 bg-teal/15" />
            <div className="absolute left-0 right-0 top-2/3 h-1 translate-x-2 bg-purple/10" />
          </div>
        )}
      </div>

      <div className="mt-5 px-8">
        <div className="mb-3 font-mono text-xs tracking-widest text-teal/32">// TOOL_STACK</div>
        <div className="flex flex-wrap gap-2">
          {techStack.map(tech => (
            <span key={tech} className="border border-teal/10 bg-teal/[0.035] px-2 py-0.5 font-mono text-xs text-amber/32 transition-colors hover:text-teal/70">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5 px-8">
        {['GITHUB', 'BEHANCE', 'LINKEDIN'].map(social => (
          <button
            key={social}
            className="font-mono text-xs tracking-wider text-amber/36 transition-colors hover:text-teal"
            data-hover="true"
            data-no-drag="true"
            type="button"
            aria-label={`Pulse ${social} channel`}
            onClick={handleConnect}
          >
            {social}
          </button>
        ))}
      </div>

      <div className="mt-5 px-8 font-mono text-xs text-amber/20">
        &copy; 2026 ANDRE.PORTFOLIO GRID
      </div>
    </div>
  );
}

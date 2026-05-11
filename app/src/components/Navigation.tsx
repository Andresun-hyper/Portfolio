import { useLanguage } from '../hooks/useLanguage';

export default function Navigation() {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <nav className="pointer-events-auto fixed left-0 right-0 top-0 z-50">
      <div className="flex w-full items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <div
          className="brand-lockup font-mono text-sm font-bold text-teal"
          style={{ textShadow: '0 0 18px rgba(0,229,255,0.45)' }}
          aria-label="Andre作品集网站"
        >
          <span className="text-sunflare">{'<'}</span>
          Andre作品集网站
          <span className="text-sunflare">{'/>'}</span>
        </div>

        <div className="hidden font-mono text-[10px] tracking-[0.24em] text-amber/48 md:block">
          [ {t('拖拽 / 点击楼层节点', 'DRAG / TAP ROOFTOP NODES')} ]
        </div>

        <button
          onClick={toggleLang}
          className="border border-teal/30 bg-black/24 px-3 py-1.5 font-mono text-xs tracking-[0.16em] text-teal backdrop-blur transition hover:border-sunflare hover:text-sunflare"
          data-hover="true"
          data-no-drag="true"
          type="button"
        >
          [ {lang === 'zh' ? 'EN' : '中文'} ]
        </button>
      </div>
    </nav>
  );
}

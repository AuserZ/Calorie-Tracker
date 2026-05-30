// atoms.jsx — shared visual primitives
const { Fragment } = React;

// ─── Confetti burst ──────────────────────────────
function ConfettiBurst({ go }) {
  if (!go) return null;
  const pieces = Array.from({ length: 28 });
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:5}}>
      {pieces.map((_, i) => {
        const colors = ['#FF6A1A','#2E5BFF','#C8E84A','#FFA245','#3F0F47'];
        const c = colors[i % colors.length];
        const cx = (Math.random() * 100) + '%';
        const dx = (Math.random() * 200 - 100) + 'px';
        const delay = Math.random() * .4;
        const dur = 1.4 + Math.random() * 1.2;
        const size = 6 + Math.random() * 8;
        const isCircle = i % 3 === 0;
        return (
          <span key={i} style={{
            position:'absolute', left:cx, top:'-10px',
            width:size, height:size,
            background:c, borderRadius:isCircle ? '50%' : '2px',
            transform:'translate3d(0,0,0)',
            animation:`confettiFall ${dur}s ${delay}s cubic-bezier(.3,.7,.4,1) forwards`,
            ['--cx']: '0px', ['--dx']:dx,
          }}/>
        );
      })}
    </div>
  );
}

// ─── Macro pill ──────────────────────────────────
function MacroPill({ label, value, max, color, delay = 0 }) {
  const v = useCountUp(value, { duration: 1100, delay });
  const pct = Math.min(1, value / max);
  return (
    <div style={{
      display:'flex',flexDirection:'column',gap:6,
      padding:'10px 12px',background:'var(--surface)',
      borderRadius:14, border:'1px solid var(--line)',
      flex:1, minWidth:0,
    }}>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}>
        <span style={{fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:600}}>{label}</span>
        <span className="tnum" style={{fontSize:11,color:'var(--ink-soft)'}}>{Math.round(max)}g</span>
      </div>
      <div style={{display:'flex',alignItems:'baseline',gap:2}}>
        <span className="serif tnum" style={{fontSize:30,lineHeight:1,color:'var(--ink)'}}>{Math.round(v)}</span>
        <span style={{fontSize:12,color:'var(--ink-soft)',marginLeft:2}}>g</span>
      </div>
      <div style={{height:6,background:'rgba(21,20,15,.06)',borderRadius:99,overflow:'hidden',position:'relative'}}>
        <div style={{
          position:'absolute',inset:0,width:`${pct*100}%`,
          background:color,borderRadius:99,
          transition:'width 1.1s cubic-bezier(.2,.8,.2,1)',
          transitionDelay:`${delay}ms`,
        }}/>
        <div style={{
          position:'absolute',top:0,bottom:0,left:0,width:`${pct*100}%`,
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)',
          backgroundSize:'200% 100%',
          animation:`shimmer 2.4s ${1+delay/1000}s infinite linear`,
          mixBlendMode:'overlay',
          transition:'width 1.1s cubic-bezier(.2,.8,.2,1)',
          transitionDelay:`${delay}ms`,
        }}/>
      </div>
    </div>
  );
}

// ─── Big juicy daily ring ─────────────────────────
function DailyRing({ eaten, target, style = 'arc', size = 240 }) {
  const eatenAnim = useCountUp(eaten, { duration: 1200, delay: 120 });
  const pct = Math.max(0, Math.min(1.4, eaten / target));
  const animPct = Math.max(0, Math.min(1.4, eatenAnim / target));
  const over = pct > 1;
  const remaining = Math.max(0, target - eaten);

  if (style === 'liquid') {
    return <LiquidRing eaten={eaten} target={target} size={size} />;
  }
  if (style === 'arcs') {
    return <ArcsRing eaten={eaten} target={target} size={size} />;
  }

  // Default: gradient arc with subtle glow
  const r = size * 0.42;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const dash = C * Math.min(1, animPct);
  const overflowDash = over ? C * Math.min(1, animPct - 1) : 0;

  return (
    <div style={{position:'relative',width:size,height:size}}>
      {/* glow halo */}
      <div style={{
        position:'absolute',inset:'-10%',borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,106,26,.18), transparent 60%)',
        filter:'blur(14px)', animation:'float 6s ease-in-out infinite',
      }}/>
      <svg viewBox={`0 0 ${size} ${size}`} style={{position:'relative',display:'block',overflow:'visible'}}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--tang)"/>
            <stop offset="55%" stopColor="var(--tang-2)"/>
            <stop offset="100%" stopColor="var(--lime)"/>
          </linearGradient>
          <linearGradient id="ringOver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E64646"/>
            <stop offset="100%" stopColor="#FF6A1A"/>
          </linearGradient>
          <filter id="ringGlow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} stroke="rgba(21,20,15,.07)" strokeWidth={size*0.08} fill="none"/>
        {/* dotted target tick */}
        <circle cx={cx} cy={cy} r={r} stroke="rgba(21,20,15,.18)" strokeWidth="1" fill="none"
                strokeDasharray="2 6" strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`} />
        {/* main arc — duplicated for soft glow */}
        <circle cx={cx} cy={cy} r={r} stroke="url(#ringGrad)" strokeWidth={size*0.085} fill="none"
                strokeLinecap="round" strokeDasharray={`${dash} ${C}`}
                transform={`rotate(-90 ${cx} ${cy})`} opacity=".35" filter="url(#ringGlow)"/>
        <circle cx={cx} cy={cy} r={r} stroke="url(#ringGrad)" strokeWidth={size*0.085} fill="none"
                strokeLinecap="round" strokeDasharray={`${dash} ${C}`}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{transition:'stroke-dasharray .4s linear'}}/>
        {over && (
          <circle cx={cx} cy={cy} r={r-size*0.085-3} stroke="url(#ringOver)" strokeWidth={size*0.04} fill="none"
                  strokeLinecap="round" strokeDasharray={`${overflowDash} ${C}`}
                  transform={`rotate(-90 ${cx} ${cy})`}/>
        )}
        {/* moving dot at the end of progress */}
        {animPct > 0.02 && (
          <circle
            cx={cx + r * Math.cos(-Math.PI/2 + 2*Math.PI*Math.min(1,animPct))}
            cy={cy + r * Math.sin(-Math.PI/2 + 2*Math.PI*Math.min(1,animPct))}
            r={size*0.045} fill="#fff" stroke="var(--tang)" strokeWidth="2"
            style={{filter:'drop-shadow(0 2px 6px rgba(255,106,26,.4))'}}/>
        )}
      </svg>
      <div style={{
        position:'absolute',inset:0,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',pointerEvents:'none',
      }}>
        <span style={{fontSize:11,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:600}}>
          {over ? 'Over' : 'Remaining'}
        </span>
        <span className="serif tnum" style={{
          fontSize: size*0.32, lineHeight:.95, color:'var(--ink)',
          marginTop:2,
        }}>
          {Math.round(over ? eatenAnim - target : target - eatenAnim)}
        </span>
        <span style={{fontSize:13,color:'var(--ink-soft)',marginTop:4}}>
          <span className="tnum" style={{fontWeight:600,color:'var(--ink)'}}>{Math.round(eatenAnim)}</span>
          <span> / {target} kcal</span>
        </span>
      </div>
    </div>
  );
}

// ─── Liquid-fill ring ─────────────────────────────
function LiquidRing({ eaten, target, size = 240 }) {
  const eatenAnim = useCountUp(eaten, { duration: 1400, delay: 100 });
  const pct = Math.max(0, Math.min(1.2, eatenAnim / target));
  const fillY = (1 - pct) * size;
  return (
    <div style={{position:'relative',width:size,height:size}}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{display:'block'}}>
        <defs>
          <linearGradient id="liqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tang-2)"/>
            <stop offset="100%" stopColor="var(--tang)"/>
          </linearGradient>
          <clipPath id="liqClip">
            <circle cx={size/2} cy={size/2} r={size*0.45 - 4}/>
          </clipPath>
        </defs>
        <circle cx={size/2} cy={size/2} r={size*0.45} fill="var(--surface)" stroke="rgba(21,20,15,.08)" strokeWidth="2"/>
        <g clipPath="url(#liqClip)">
          <rect x="0" y={fillY} width={size} height={size} fill="url(#liqGrad)" style={{transition:'y 1.4s cubic-bezier(.3,.8,.2,1)'}}/>
          {/* wave on top */}
          <g style={{transform:`translateY(${fillY}px)`,transition:'transform 1.4s cubic-bezier(.3,.8,.2,1)'}}>
            <g style={{animation:'liquidWave 4s linear infinite'}}>
              <path d={`M0,8 Q${size/4},0 ${size/2},8 T${size},8 T${1.5*size},8 T${2*size},8 V20 H0 Z`} fill="url(#liqGrad)" transform="translate(0,-8)"/>
            </g>
          </g>
        </g>
        <circle cx={size/2} cy={size/2} r={size*0.45} fill="none" stroke="rgba(21,20,15,.08)" strokeWidth="2"/>
      </svg>
      <div style={{
        position:'absolute',inset:0,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',pointerEvents:'none',
        mixBlendMode:'difference', color:'#fff',
      }}>
        <span style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',fontWeight:600,opacity:.8}}>Eaten</span>
        <span className="serif tnum" style={{fontSize:size*0.28,lineHeight:.95}}>{Math.round(eatenAnim)}</span>
        <span style={{fontSize:11,opacity:.7}}>/ {target} kcal</span>
      </div>
    </div>
  );
}

// ─── Stacked arcs (protein/carbs/fat each) ────────
function ArcsRing({ eaten, target, size = 240 }) {
  const e = useCountUp(eaten, { duration: 1100, delay: 120 });
  const tracks = [
    { key:'p', color:'var(--blue)', val: 0.55, label:'P' },
    { key:'c', color:'var(--tang)', val: 0.30, label:'C' },
    { key:'f', color:'var(--lime)', val: 0.78, label:'F' },
  ];
  const cx = size/2, cy = size/2;
  return (
    <div style={{position:'relative',width:size,height:size}}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{display:'block',overflow:'visible'}}>
        {tracks.map((t, i) => {
          const r = size*0.42 - i*(size*0.085);
          const C = 2*Math.PI*r;
          const dash = C * Math.min(1, t.val);
          return (
            <Fragment key={t.key}>
              <circle cx={cx} cy={cy} r={r} stroke="rgba(21,20,15,.07)" strokeWidth={size*0.05} fill="none"/>
              <circle cx={cx} cy={cy} r={r} stroke={t.color} strokeWidth={size*0.05} fill="none"
                      strokeLinecap="round" strokeDasharray={`${dash} ${C}`}
                      transform={`rotate(-90 ${cx} ${cy})`}
                      style={{transition:`stroke-dasharray 1.1s ${i*120}ms cubic-bezier(.2,.8,.2,1)`}}/>
            </Fragment>
          );
        })}
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:600}}>Eaten</span>
        <span className="serif tnum" style={{fontSize:size*0.28,lineHeight:.95}}>{Math.round(e)}</span>
        <span style={{fontSize:11,color:'var(--ink-soft)'}}>kcal</span>
      </div>
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────
function PrimaryButton({ children, onClick, style, kind = 'cta', icon, block, ...rest }) {
  const colors = {
    cta: { bg: 'var(--ink)', fg: 'var(--cream)', hi: 'var(--tang)' },
    blue: { bg: 'var(--blue)', fg: '#fff', hi: '#fff' },
    soft: { bg: 'var(--surface)', fg: 'var(--ink)', hi: 'var(--tang)' },
  }[kind] || {};
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:10,
        height:54, padding:'0 22px',borderRadius:99, border:'none',
        background:colors.bg, color:colors.fg,
        fontFamily:'inherit',fontWeight:600, fontSize:15, letterSpacing:'-0.01em',
        cursor:'pointer', userSelect:'none',
        width: block ? '100%' : undefined,
        transform: pressed ? 'scale(.97)' : 'scale(1)',
        transition:'transform .15s cubic-bezier(.3,.8,.2,1), box-shadow .25s',
        boxShadow: pressed
          ? '0 2px 8px rgba(21,20,15,.18)'
          : '0 8px 24px rgba(21,20,15,.18), 0 1px 0 rgba(255,255,255,.18) inset',
        overflow:'hidden',
        ...style,
      }}
      {...rest}>
      {/* shine sweep */}
      <span style={{
        position:'absolute',inset:0,
        background:'linear-gradient(110deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%)',
        animation:'shine 3.6s ease-in-out infinite',
      }}/>
      <span style={{position:'relative',display:'inline-flex',alignItems:'center',gap:10}}>
        {icon}
        {children}
      </span>
    </button>
  );
}

// ─── Tag chip ────────────────────────────────────
function Chip({ children, color = 'var(--ink-2)', bg = 'rgba(21,20,15,.06)', style }) {
  return <span style={{
    display:'inline-flex',alignItems:'center',gap:6,
    padding:'4px 10px', borderRadius:99,
    background:bg, color, fontSize:11,
    fontWeight:600, letterSpacing:'.04em',
    ...style,
  }}>{children}</span>;
}

// ─── Page chrome (top bar) ───────────────────────
function PageHeader({ title, subtitle, right, eyebrow }) {
  return (
    <header style={{
      padding:'18px 22px 10px',display:'flex',alignItems:'flex-end',
      justifyContent:'space-between',gap:10,
    }}>
      <div style={{minWidth:0}}>
        {eyebrow && <div style={{
          fontSize:11,letterSpacing:'.16em',textTransform:'uppercase',
          color:'var(--ink-soft)',fontWeight:600,marginBottom:6,
        }}>{eyebrow}</div>}
        <h1 className="serif" style={{
          margin:0, fontSize:42, lineHeight:.95, color:'var(--ink)',
          letterSpacing:'-0.02em',
        }}>{title}</h1>
        {subtitle && <p style={{
          margin:'8px 0 0', fontSize:13, color:'var(--ink-soft)',
          textWrap:'pretty',
        }}>{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

// ─── Wordmark ────────────────────────────────────
function Wordmark({ size = 22 }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,fontFamily:"'Instrument Serif',serif"}}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{display:'block'}}>
        <defs>
          <linearGradient id="wmGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--tang)"/>
            <stop offset="100%" stopColor="var(--tang-2)"/>
          </linearGradient>
        </defs>
        <path d="M12 3c4.5 0 8 3.5 8 8.2 0 5.6-4 9.8-8 9.8s-8-4.2-8-9.8C4 6.5 7.5 3 12 3z" fill="url(#wmGrad)"/>
        <path d="M14 4c1 0 1.8.5 2.4 1.4-.6 1.2-2 2-3.4 2-.5-1.4 0-2.7 1-3.4z" fill="var(--lime)"/>
        <ellipse cx="9" cy="10" rx="1.2" ry="2" fill="rgba(255,255,255,.5)"/>
      </svg>
      <span style={{fontSize:size,lineHeight:1,fontStyle:'italic',color:'var(--ink)'}}>eat·en</span>
    </div>
  );
}

// ─── Bottom nav for mobile ───────────────────────
function BottomNav({ current, onNav }) {
  const items = [
    { id:'today', label:'Today', icon: TodayIcon },
    { id:'weight', label:'Weight', icon: WeightIcon },
    { id:'history', label:'History', icon: HistoryIcon },
  ];
  return (
    <nav style={{
      position:'absolute',bottom:0,left:0,right:0,
      padding:'10px 18px calc(10px + env(safe-area-inset-bottom))',
      background:'rgba(255,253,248,.85)',backdropFilter:'blur(20px) saturate(160%)',
      WebkitBackdropFilter:'blur(20px) saturate(160%)',
      borderTop:'1px solid var(--line)',
      display:'flex',justifyContent:'space-around',alignItems:'center',
      zIndex:3,
    }}>
      {items.map((it) => {
        const active = current === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => onNav(it.id)} style={{
            display:'flex',flexDirection:'column',alignItems:'center',gap:3,
            padding:'8px 16px',background:'transparent',border:'none',cursor:'pointer',
            color: active ? 'var(--ink)' : 'var(--ink-soft)',
            position:'relative',
          }}>
            {active && <span style={{
              position:'absolute',top:-2,left:'50%',transform:'translateX(-50%)',
              width:24,height:3,background:'var(--tang)',borderRadius:99,
              animation:'fadeIn .3s',
            }}/>}
            <Icon active={active} />
            <span style={{fontSize:10,fontWeight:600,letterSpacing:'.04em'}}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TodayIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3c4 0 7 3 7 7.5C19 16 15 21 12 21s-7-5-7-10.5C5 6 8 3 12 3z"
            fill={active ? 'var(--tang)' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
      {active && <path d="M14 4.5c.8 0 1.4.4 1.8 1.1-.5.9-1.6 1.5-2.6 1.5-.4-1 .1-2 .8-2.6z" fill="var(--lime)"/>}
    </svg>
  );
}
function WeightIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14l-1.5 11h-11L5 8z" stroke="currentColor" strokeWidth="1.5"
            fill={active ? 'rgba(46,91,255,.18)' : 'none'}/>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity={active ? 1 : .5}/>
    </svg>
  );
}
function HistoryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="7.5" stroke="currentColor" strokeWidth="1.5"
              fill={active ? 'rgba(255,106,26,.15)' : 'none'}/>
      <path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 3v3M9 4l2 2M15 4l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

Object.assign(window, {
  ConfettiBurst, MacroPill, DailyRing, LiquidRing, ArcsRing,
  PrimaryButton, Chip, PageHeader, Wordmark, BottomNav,
  TodayIcon, WeightIcon, HistoryIcon,
});

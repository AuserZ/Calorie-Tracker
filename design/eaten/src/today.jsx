// today.jsx — main home screen
const TodayScreen = ({ onOpenCapture, onOpenMeal, meals, target, animationKey }) => {
  const totals = meals.reduce((a,m) => ({
    cal: a.cal+m.calories, p: a.p+m.protein, c: a.c+m.carbs, f: a.f+m.fat,
  }), {cal:0,p:0,c:0,f:0});

  const ringStyle = window.__ringStyle || 'arc';
  const showConfetti = totals.cal >= target * 0.95 && totals.cal <= target * 1.05;

  return (
    <div style={{position:'relative',minHeight:'100%',paddingBottom:120}}>
      {/* Floating gradient blobs in background */}
      <div aria-hidden style={{
        position:'absolute',top:'-60px',right:'-60px',width:240,height:240,
        background:'radial-gradient(circle, rgba(255,162,69,.45), transparent 65%)',
        filter:'blur(20px)', animation:'blob1 14s ease-in-out infinite',pointerEvents:'none',
      }}/>
      <div aria-hidden style={{
        position:'absolute',top:'180px',left:'-80px',width:220,height:220,
        background:'radial-gradient(circle, rgba(46,91,255,.3), transparent 65%)',
        filter:'blur(20px)', animation:'blob2 18s ease-in-out infinite',pointerEvents:'none',
      }}/>

      {/* Top bar with greeting */}
      <div style={{
        padding:'14px 22px 0',display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <Wordmark />
        <button style={{
          width:40,height:40,borderRadius:99,border:'1px solid var(--line)',
          background:'var(--surface)',display:'inline-flex',alignItems:'center',justifyContent:'center',
          cursor:'pointer',color:'var(--ink)',
        }} aria-label="Profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 19c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <PageHeader
        eyebrow="Wednesday · Apr 30"
        title={<><span style={{fontStyle:'italic',color:'var(--tang)'}}>Hi</span> Aren,</>}
        subtitle="Here's your bite of the day."
      />

      {/* Hero ring card */}
      <section style={{
        margin:'10px 18px 0', padding:'24px 18px 22px',
        background:'var(--surface)', borderRadius:28,
        border:'1px solid var(--line)',
        boxShadow:'0 1px 0 rgba(255,255,255,.7) inset, 0 12px 30px -16px rgba(21,20,15,.18)',
        position:'relative', overflow:'hidden',
        animation:'fadeUp .7s cubic-bezier(.2,.8,.2,1) both',
      }}>
        {/* Subtle dotted texture */}
        <div aria-hidden style={{
          position:'absolute',inset:0,opacity:.4,pointerEvents:'none',
          backgroundImage:'radial-gradient(rgba(21,20,15,.06) 1px, transparent 1px)',
          backgroundSize:'14px 14px',
        }}/>
        {showConfetti && <ConfettiBurst go key={animationKey} />}

        <div style={{position:'relative',display:'flex',justifyContent:'center'}}>
          <DailyRing eaten={totals.cal} target={target} style={ringStyle} size={228} key={ringStyle+animationKey} />
        </div>

        {/* Verdict pill */}
        <div style={{display:'flex',justifyContent:'center',marginTop:14}}>
          <Chip
            color={showConfetti ? '#1FB36B' : 'var(--ink-2)'}
            bg={showConfetti ? 'rgba(31,179,107,.12)' : 'rgba(21,20,15,.06)'}>
            <span style={{
              width:6,height:6,borderRadius:99,
              background: showConfetti ? '#1FB36B' : 'var(--tang)',
              boxShadow:'0 0 0 0 currentColor',animation:'pulseRing 2s infinite',
              position:'relative',
            }}/>
            {totals.cal > target ? `${totals.cal - target} kcal over` :
              showConfetti ? 'On track — nice rhythm' :
              `${target - totals.cal} kcal to go`}
          </Chip>
        </div>
      </section>

      {/* Macro pills */}
      <section style={{
        margin:'16px 18px 0', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8,
        animation:'fadeUp .7s .12s cubic-bezier(.2,.8,.2,1) both',
      }}>
        <MacroPill label="Protein" value={totals.p} max={120} color="linear-gradient(90deg,var(--blue),var(--blue-2))" delay={120}/>
        <MacroPill label="Carbs" value={totals.c} max={240} color="linear-gradient(90deg,var(--tang),var(--tang-2))" delay={240}/>
        <MacroPill label="Fat" value={totals.f} max={80} color="linear-gradient(90deg,#7BB12A,var(--lime))" delay={360}/>
      </section>

      {/* Meals heading + list */}
      <section style={{margin:'24px 18px 0',animation:'fadeUp .7s .25s cubic-bezier(.2,.8,.2,1) both'}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:10}}>
          <h2 className="serif" style={{margin:0,fontSize:26,letterSpacing:'-0.01em'}}>
            Today's plate <span style={{color:'var(--ink-soft)',fontStyle:'italic',fontSize:18}}>· {meals.length}</span>
          </h2>
          <button style={{
            background:'transparent',border:'none',color:'var(--ink-soft)',
            fontSize:12,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer',
          }}>Sort</button>
        </div>

        <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:10}}>
          {meals.map((m, i) => (
            <li key={m.id} style={{animation:`fadeUp .6s ${0.3 + i*0.08}s cubic-bezier(.2,.8,.2,1) both`}}>
              <MealCard meal={m} onClick={() => onOpenMeal(m)} />
            </li>
          ))}
          {meals.length === 0 && (
            <div style={{
              padding:'34px 20px',textAlign:'center',
              background:'var(--surface)',borderRadius:20,
              border:'1px dashed var(--line)',
            }}>
              <div style={{fontSize:36,marginBottom:6}}>🥣</div>
              <div className="serif" style={{fontSize:22,fontStyle:'italic'}}>nothing logged yet</div>
              <div style={{fontSize:13,color:'var(--ink-soft)',marginTop:4}}>Snap your first meal of the day.</div>
            </div>
          )}
        </ul>
      </section>

      {/* Floating action button */}
      <button onClick={onOpenCapture} aria-label="Log a meal" style={{
        position:'absolute', bottom:90, right:22, width:64, height:64, borderRadius:99,
        border:'none', cursor:'pointer', color:'var(--cream)',
        background:'linear-gradient(135deg,var(--ink) 30%,#2a2a2a)',
        boxShadow:'0 12px 28px rgba(255,106,26,.45), 0 1px 0 rgba(255,255,255,.15) inset',
        display:'flex',alignItems:'center',justifyContent:'center',
        zIndex:4, animation:'float 3.4s ease-in-out infinite',
      }}>
        <span style={{
          position:'absolute',inset:-2,borderRadius:99,
          background:'conic-gradient(from 0deg,var(--tang),var(--lime),var(--blue),var(--tang))',
          animation:'spinSlow 6s linear infinite',
          zIndex:-1,opacity:.85,filter:'blur(2px)',
        }}/>
        <span style={{
          position:'absolute',inset:2,borderRadius:99,background:'var(--ink)',zIndex:-1,
        }}/>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{position:'relative'}}>
          <rect x="3" y="6.5" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M8 6.5l1.5-2h5L16 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M12 11v4M10 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

// ─── Meal card ─────────────────────────────────
const confColors = {
  high: { bg:'rgba(31,179,107,.12)', fg:'#0F8F4D' },
  medium: { bg:'rgba(242,163,58,.18)', fg:'#A36514' },
  low: { bg:'rgba(230,70,70,.12)', fg:'#A82828' },
};

function MealCard({ meal, onClick, compact }) {
  const [hover, setHover] = useState(false);
  const c = confColors[meal.confidence] || confColors.medium;
  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position:'relative', display:'flex', alignItems:'center', gap:14,
        padding:10, background:'var(--surface)', borderRadius:20,
        border:'1px solid var(--line)', cursor:'pointer',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 14px 30px -12px rgba(21,20,15,.22)'
          : '0 4px 14px -10px rgba(21,20,15,.15)',
        transition:'transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s',
        overflow:'hidden',
      }}>
      <div style={{
        position:'relative', width:64, height:64, borderRadius:16, overflow:'hidden',
        background:'var(--cream-2)', flexShrink:0,
      }}>
        <img src={meal.img} alt="" style={{
          width:'100%',height:'100%',objectFit:'cover',
          transform: hover ? 'scale(1.08)' : 'scale(1)',
          transition:'transform .5s cubic-bezier(.2,.8,.2,1)',
        }}/>
        <span style={{
          position:'absolute',top:4,left:4,
          fontSize:9, padding:'2px 6px', borderRadius:99,
          background:'rgba(255,253,248,.92)',color:'var(--ink)',fontWeight:700,
          letterSpacing:'.06em',textTransform:'uppercase',
        }}>{meal.tag}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <h3 style={{
            margin:0, fontSize:15, fontWeight:600, color:'var(--ink)',
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
          }}>{meal.name}</h3>
          <span style={{
            fontSize:9, padding:'2px 6px', borderRadius:99,
            background: c.bg, color: c.fg, fontWeight:700,
            letterSpacing:'.06em',textTransform:'uppercase',flexShrink:0,
          }}>{meal.confidence}</span>
        </div>
        <div style={{display:'flex',alignItems:'baseline',gap:14,marginTop:6,fontSize:11,color:'var(--ink-soft)'}}>
          <span><span className="serif tnum" style={{fontSize:20,color:'var(--ink)',marginRight:2}}>{meal.calories}</span>kcal</span>
          <span className="tnum">P {meal.protein}</span>
          <span className="tnum">C {meal.carbs}</span>
          <span className="tnum">F {meal.fat}</span>
        </div>
        <div style={{fontSize:11,color:'var(--ink-soft)',marginTop:2}}>{meal.time}</div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{
        color:'var(--ink-soft)',flexShrink:0,
        transform: hover ? 'translateX(4px)' : 'translateX(0)',
        transition:'transform .25s',
      }}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </article>
  );
}

Object.assign(window, { TodayScreen, MealCard });

// history.jsx — calendar + day breakdown
const HistoryScreen = ({ onOpenMeal }) => {
  const [openDay, setOpenDay] = useState('Today');
  const days = HISTORY_DAYS;
  const max = Math.max(...days.map(d => d.total));

  return (
    <div style={{position:'relative',minHeight:'100%',paddingBottom:120}}>
      <div style={{padding:'14px 22px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Wordmark />
      </div>
      <PageHeader eyebrow="Last 7 days" title={<>Your <em style={{color:'var(--tang)'}}>rhythm</em></>} subtitle="Patterns over plates." />

      {/* Bar chart summary */}
      <section style={{
        margin:'10px 18px 0',padding:'18px 16px',
        background:'var(--surface)',borderRadius:24,border:'1px solid var(--line)',
        animation:'fadeUp .5s both',
      }}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
          <div>
            <div style={{fontSize:11,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700}}>Avg / day</div>
            <div className="serif tnum" style={{fontSize:36,lineHeight:1,marginTop:4}}>
              <CountUp to={Math.round(days.reduce((a,d)=>a+d.total,0)/days.length)} digits={0} />
              <span style={{fontSize:14,color:'var(--ink-soft)',marginLeft:4}}>kcal</span>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700}}>Target</div>
            <div className="tnum serif" style={{fontSize:22,marginTop:4}}>{TARGET}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${days.length},1fr)`,gap:6,height:120,alignItems:'flex-end'}}>
          {[...days].reverse().map((d,i) => {
            const h = Math.max(8, (d.total / max) * 100);
            const over = d.total > d.target;
            return (
              <button key={d.dateKey} onClick={() => setOpenDay(d.dateKey)} style={{
                display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                background:'transparent',border:'none',cursor:'pointer',
                padding:0,height:'100%',justifyContent:'flex-end',
              }}>
                <span className="tnum" style={{fontSize:9,color:'var(--ink-soft)',fontWeight:600}}>
                  {(d.total/100).toFixed(0)}<sub style={{fontSize:7}}>×100</sub>
                </span>
                <div style={{
                  width:'100%',
                  height: `${h}%`,
                  borderRadius:8,
                  background: openDay===d.dateKey
                    ? 'linear-gradient(180deg,var(--tang),var(--tang-2))'
                    : (over ? 'linear-gradient(180deg,#FFA245,#FFD08A)' : 'linear-gradient(180deg,var(--blue),var(--blue-2))'),
                  opacity: openDay===d.dateKey ? 1 : .8,
                  animation: `barGrow .8s ${i*0.05}s cubic-bezier(.2,.8,.2,1) both`,
                  transformOrigin:'bottom',
                  boxShadow: openDay===d.dateKey ? '0 8px 16px -6px rgba(255,106,26,.5)' : 'none',
                }}/>
                <span style={{fontSize:10,color:openDay===d.dateKey ? 'var(--ink)' : 'var(--ink-soft)',fontWeight:600}}>{d.dateKey.slice(0,3)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Day breakdown */}
      <section style={{margin:'14px 18px 0'}}>
        <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:8}}>
          {days.map((d,i) => {
            const open = openDay === d.dateKey;
            const v = d.total > d.target * 1.05 ? 'over' : d.total < d.target * 0.85 ? 'under' : 'on';
            const vColor = v === 'on' ? '#0F8F4D' : v === 'over' ? '#A36514' : 'var(--ink-soft)';
            const vBg = v === 'on' ? 'rgba(31,179,107,.12)' : v === 'over' ? 'rgba(242,163,58,.18)' : 'rgba(21,20,15,.06)';
            return (
              <li key={d.dateKey} style={{animation:`fadeUp .5s ${0.1+i*0.04}s both`}}>
                <div style={{
                  background:'var(--surface)',borderRadius:18,border:'1px solid var(--line)',overflow:'hidden',
                  transition:'box-shadow .25s',
                  boxShadow: open ? '0 12px 28px -16px rgba(21,20,15,.25)' : 'none',
                }}>
                  <button onClick={() => setOpenDay(open ? null : d.dateKey)} style={{
                    width:'100%',padding:'14px 16px',display:'flex',alignItems:'center',gap:10,
                    background:'transparent',border:'none',cursor:'pointer',textAlign:'left',
                  }}>
                    <div style={{flex:1}}>
                      <div className="serif" style={{fontSize:20,letterSpacing:'-0.01em'}}>{d.dateKey}</div>
                      <div style={{fontSize:11,color:'var(--ink-soft)'}}>{d.date} · {d.meals} meals</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div className="serif tnum" style={{fontSize:24,lineHeight:1}}>{d.total}<span style={{fontSize:11,color:'var(--ink-soft)',marginLeft:3}}>kcal</span></div>
                      <Chip color={vColor} bg={vBg} style={{marginTop:6,fontSize:9}}>
                        {v === 'on' ? 'On track' : v === 'over' ? `+${d.total-d.target}` : `−${d.target-d.total}`}
                      </Chip>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{
                      color:'var(--ink-soft)',
                      transform: open ? 'rotate(90deg)' : 'rotate(0)',
                      transition:'transform .25s',
                    }}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                  </button>
                  {open && (
                    <div style={{padding:'0 16px 14px',borderTop:'1px solid var(--line)',animation:'fadeUp .3s'}}>
                      <ul style={{listStyle:'none',padding:0,margin:'10px 0 0',display:'flex',flexDirection:'column',gap:6}}>
                        {SEED_MEALS.slice(0, d.trend.filter(x => x>0).length).map((m,j) => (
                          <li key={j} onClick={() => onOpenMeal && onOpenMeal(m)}
                              style={{
                            display:'flex',alignItems:'center',gap:10,padding:'8px 10px',
                            background:'var(--cream)',borderRadius:12,cursor:'pointer',
                          }}>
                            <div style={{width:32,height:32,borderRadius:8,overflow:'hidden',flexShrink:0}}>
                              <img src={m.img} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            </div>
                            <span style={{flex:1,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</span>
                            <span className="tnum" style={{fontSize:13,fontWeight:600}}>{m.calories}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <style>{`@keyframes barGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
};

Object.assign(window, { HistoryScreen });

// weight.jsx — animated weight chart screen
const WeightScreen = () => {
  const entries = WEIGHT_ENTRIES;
  const latest = entries[entries.length-1];
  const prev = entries[entries.length-2];
  const diff = latest.kg - prev.kg;
  const start = entries[0];
  const totalDiff = latest.kg - start.kg;

  return (
    <div style={{position:'relative',minHeight:'100%',paddingBottom:120}}>
      <div aria-hidden style={{
        position:'absolute',top:'-40px',right:'-60px',width:200,height:200,
        background:'radial-gradient(circle, rgba(46,91,255,.28), transparent 65%)',
        filter:'blur(20px)',animation:'blob1 14s ease-in-out infinite',pointerEvents:'none',
      }}/>

      <div style={{padding:'14px 22px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Wordmark />
      </div>
      <PageHeader eyebrow="2 weeks" title={<>Weight <em style={{color:'var(--blue)'}}>flow</em></>} subtitle="A gentle line, not a verdict." />

      {/* Hero current weight */}
      <section style={{
        margin:'12px 18px 0',padding:'22px 22px 18px',
        background:'linear-gradient(140deg, var(--ink) 0%, #1e2434 60%, #2a3858 100%)',
        color:'var(--cream)',borderRadius:28,position:'relative',overflow:'hidden',
        animation:'fadeUp .6s both',
      }}>
        <div aria-hidden style={{
          position:'absolute',inset:0,opacity:.5,
          background:'radial-gradient(circle at 80% 20%, rgba(46,91,255,.5), transparent 60%)',
        }}/>
        <div style={{position:'relative'}}>
          <div style={{fontSize:11,letterSpacing:'.16em',textTransform:'uppercase',opacity:.6,fontWeight:600}}>Now</div>
          <div style={{display:'flex',alignItems:'baseline',gap:10,marginTop:4}}>
            <span className="serif tnum" style={{fontSize:84,lineHeight:.9,letterSpacing:'-0.03em'}}>
              <CountUp to={latest.kg} digits={1} />
            </span>
            <span style={{fontSize:18,opacity:.6}}>kg</span>
            <span style={{
              marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:4,
              padding:'6px 10px',borderRadius:99,
              background: diff <= 0 ? 'rgba(200,232,74,.18)' : 'rgba(230,70,70,.18)',
              color: diff <= 0 ? 'var(--lime)' : '#FF8B8B',fontWeight:600,fontSize:12,
            }}>
              {diff <= 0 ? '↓' : '↑'} {Math.abs(diff).toFixed(1)} kg
            </span>
          </div>
          <div style={{fontSize:13,opacity:.65,marginTop:6}}>
            <span className="tnum">{totalDiff > 0 ? '+' : ''}{totalDiff.toFixed(1)} kg</span> in 14 days · trending toward goal
          </div>
        </div>
      </section>

      {/* Animated chart */}
      <section style={{
        margin:'14px 18px 0',padding:'18px 14px 14px',
        background:'var(--surface)',borderRadius:24,border:'1px solid var(--line)',
        animation:'fadeUp .6s .12s both',
      }}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',padding:'0 8px 12px'}}>
          <h3 className="serif" style={{margin:0,fontSize:22,fontStyle:'italic'}}>14-day trend</h3>
          <div style={{display:'flex',gap:4,padding:3,background:'rgba(21,20,15,.06)',borderRadius:99}}>
            {['Wk','Mo','Yr'].map((t,i) => (
              <button key={t} style={{
                padding:'4px 10px',borderRadius:99,border:'none',cursor:'pointer',
                fontSize:11,fontWeight:600,
                background: i===0 ? 'var(--surface)':'transparent',
                color: i===0 ? 'var(--ink)' : 'var(--ink-soft)',
                boxShadow: i===0 ? '0 2px 6px rgba(21,20,15,.12)' : 'none',
              }}>{t}</button>
            ))}
          </div>
        </div>
        <WeightLineChart data={entries} />
      </section>

      {/* Quick log */}
      <section style={{
        margin:'14px 18px 0',padding:'14px 16px',
        background:'var(--surface)',borderRadius:20,border:'1px solid var(--line)',
        animation:'fadeUp .6s .2s both',
      }}>
        <div style={{fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700,marginBottom:10}}>Quick log</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input placeholder="72.4" style={{
            flex:1,padding:'14px 16px',border:'1px solid var(--line)',borderRadius:14,
            fontFamily:"'Instrument Serif', serif",fontSize:24,outline:'none',background:'var(--cream)',
          }}/>
          <span style={{fontSize:14,color:'var(--ink-soft)',marginRight:6}}>kg</span>
          <PrimaryButton kind="cta" style={{height:48}}>Add</PrimaryButton>
        </div>
      </section>

      {/* Recent entries */}
      <section style={{margin:'18px 18px 0',animation:'fadeUp .6s .28s both'}}>
        <h3 className="serif" style={{margin:'0 0 8px',fontSize:22,fontStyle:'italic'}}>Recent</h3>
        <ul style={{listStyle:'none',padding:0,margin:0,
          background:'var(--surface)',borderRadius:18,border:'1px solid var(--line)',overflow:'hidden'}}>
          {[...entries].reverse().slice(0,5).map((e,i) => (
            <li key={i} style={{
              padding:'12px 16px',display:'flex',alignItems:'center',gap:10,
              borderTop: i ? '1px solid var(--line)' : 'none',
            }}>
              <span style={{fontSize:13,color:'var(--ink-soft)',width:60}}>{e.date}</span>
              <span className="tnum serif" style={{fontSize:20,flex:1}}>{e.kg.toFixed(1)}<span style={{fontSize:11,color:'var(--ink-soft)',marginLeft:3}}>kg</span></span>
              {i < entries.length-1 && (
                <span className="tnum" style={{
                  fontSize:11,fontWeight:600,
                  color: (e.kg - [...entries].reverse()[i+1].kg) <= 0 ? '#0F8F4D' : 'var(--bad)',
                }}>
                  {(e.kg - [...entries].reverse()[i+1].kg) <= 0 ? '↓' : '↑'}
                  {Math.abs(e.kg - [...entries].reverse()[i+1].kg).toFixed(1)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

function CountUp({ to, digits = 0 }) {
  const v = useCountUp(to, { duration: 1200 });
  return v.toFixed(digits);
}

function WeightLineChart({ data }) {
  const W = 320, H = 160, P = 18;
  const xs = data.map((_,i) => P + (W - P*2) * (i / (data.length-1)));
  const ys = (() => {
    const min = Math.min(...data.map(d => d.kg)) - 0.4;
    const max = Math.max(...data.map(d => d.kg)) + 0.4;
    return data.map(d => H - P - (H - P*2) * ((d.kg - min) / (max - min)));
  })();
  const path = xs.map((x,i) => `${i===0?'M':'L'}${x},${ys[i]}`).join(' ');
  const areaPath = `${path} L${xs[xs.length-1]},${H-P} L${xs[0]},${H-P} Z`;
  const len = data.length * 30;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block',overflow:'visible'}}>
      <defs>
        <linearGradient id="wAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--blue)" stopOpacity=".35"/>
          <stop offset="100%" stopColor="var(--blue)" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="wLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--blue)"/>
          <stop offset="100%" stopColor="var(--tang)"/>
        </linearGradient>
      </defs>
      {/* baseline */}
      {[0.25,0.5,0.75].map(p => (
        <line key={p} x1={P} x2={W-P} y1={P + (H-P*2)*p} y2={P + (H-P*2)*p}
              stroke="rgba(21,20,15,.06)" strokeDasharray="3 4"/>
      ))}
      {/* area */}
      <path d={areaPath} fill="url(#wAreaGrad)" opacity="0"
            style={{animation:'fadeIn 1.4s .6s forwards'}}/>
      {/* line */}
      <path d={path} fill="none" stroke="url(#wLineGrad)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={len} strokeDashoffset={len}
            style={{animation:`drawLine 1.6s .2s cubic-bezier(.4,.1,.2,1) forwards`}}/>
      {/* dots */}
      {xs.map((x,i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3.2" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1.6"
                opacity="0" style={{animation:`fadeIn .3s ${0.6 + i*0.06}s forwards`}}/>
      ))}
      {/* End marker pulse */}
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="6"
              fill="none" stroke="var(--tang)" strokeWidth="1.5" opacity="0"
              style={{animation:`pulseRing 1.6s 1.6s infinite,fadeIn .3s 1.6s forwards`,transformOrigin:`${xs[xs.length-1]}px ${ys[ys.length-1]}px`}}/>
      {/* Last value annotation */}
      <g opacity="0" style={{animation:'fadeUp .4s 1.6s forwards'}}>
        <rect x={xs[xs.length-1]-32} y={ys[ys.length-1]-30} width="56" height="20" rx="6" fill="var(--ink)"/>
        <text x={xs[xs.length-1]} y={ys[ys.length-1]-16} fontSize="11" fill="var(--cream)" fontWeight="600"
              textAnchor="middle" style={{fontVariantNumeric:'tabular-nums'}}>{data[data.length-1].kg.toFixed(1)} kg</text>
      </g>
      <style>{`@keyframes drawLine{to{stroke-dashoffset:0}}`}</style>
    </svg>
  );
}

Object.assign(window, { WeightScreen });

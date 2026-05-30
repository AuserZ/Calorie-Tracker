// meal-detail.jsx
const MealDetailScreen = ({ meal, onBack, onDelete }) => {
  if (!meal) return null;
  const [confirming, setConfirming] = useState(false);
  const cal = useCountUp(meal.calories, { duration: 900 });

  return (
    <div style={{position:'relative',minHeight:'100%',paddingBottom:80,animation:'fadeIn .3s'}}>
      {/* Hero image with parallax-feel */}
      <div style={{position:'relative',aspectRatio:'1/1',overflow:'hidden'}}>
        <img src={meal.img} alt="" style={{
          width:'100%',height:'100%',objectFit:'cover',
          animation:'kenburns 8s ease-in-out infinite alternate',
        }}/>
        <div style={{
          position:'absolute',inset:0,
          background:'linear-gradient(180deg, rgba(255,246,230,.18) 0%, transparent 30%, transparent 60%, var(--cream) 100%)',
        }}/>
        {/* Back button */}
        <button onClick={onBack} aria-label="Back" style={{
          position:'absolute',top:14,left:14,
          width:42,height:42,borderRadius:99,
          background:'rgba(255,253,248,.9)',backdropFilter:'blur(12px)',
          WebkitBackdropFilter:'blur(12px)',
          border:'1px solid var(--line)',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ink)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{position:'absolute',top:14,right:14,display:'flex',gap:6}}>
          <Chip color="#0F8F4D" bg="rgba(255,253,248,.92)" style={{backdropFilter:'blur(10px)'}}>
            ✦ {meal.confidence} match
          </Chip>
        </div>
        <span style={{
          position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',
          fontSize:10,padding:'4px 10px',borderRadius:99,
          background:'rgba(255,253,248,.92)',backdropFilter:'blur(10px)',
          color:'var(--ink)',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',
        }}>{meal.tag}</span>
      </div>

      <div style={{padding:'4px 22px 0',marginTop:-30,position:'relative'}}>
        <h1 className="serif" style={{margin:0,fontSize:38,lineHeight:1.05,letterSpacing:'-0.02em'}}>{meal.name}</h1>
        <p style={{fontSize:13,color:'var(--ink-soft)',marginTop:6}}>
          Today · {meal.time} · 14% of daily target
        </p>

        {/* Big calorie + macros panel */}
        <section style={{
          marginTop:18,padding:'18px 18px 14px',background:'var(--surface)',
          borderRadius:24,border:'1px solid var(--line)',
          animation:'fadeUp .5s .1s both',
        }}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <span className="serif tnum" style={{fontSize:64,lineHeight:.95,letterSpacing:'-0.03em'}}>{Math.round(cal)}</span>
            <span style={{fontSize:14,color:'var(--ink-soft)'}}>kcal</span>
            <span style={{marginLeft:'auto',fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700}}>this meal</span>
          </div>
          {/* macro split bar */}
          <div style={{height:10,borderRadius:99,marginTop:14,overflow:'hidden',display:'flex',background:'rgba(21,20,15,.06)'}}>
            <div style={{
              flex: meal.protein, background:'linear-gradient(90deg,var(--blue),var(--blue-2))',
              animation:'fadeUp .8s .2s both',
            }}/>
            <div style={{
              flex: meal.carbs, background:'linear-gradient(90deg,var(--tang),var(--tang-2))',
              animation:'fadeUp .8s .3s both',
            }}/>
            <div style={{
              flex: meal.fat, background:'linear-gradient(90deg,#7BB12A,var(--lime))',
              animation:'fadeUp .8s .4s both',
            }}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:14}}>
            {[
              {label:'Protein', g: meal.protein, color:'var(--blue)'},
              {label:'Carbs',   g: meal.carbs,   color:'var(--tang)'},
              {label:'Fat',     g: meal.fat,     color:'#7BB12A'},
            ].map((m,i) => (
              <div key={i} style={{display:'flex',flexDirection:'column',gap:2}}>
                <span style={{display:'flex',alignItems:'center',gap:5,fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700}}>
                  <span style={{width:7,height:7,borderRadius:99,background:m.color}}/>
                  {m.label}
                </span>
                <span className="serif tnum" style={{fontSize:24,lineHeight:1}}>{m.g}<span style={{fontSize:11,color:'var(--ink-soft)',marginLeft:2}}>g</span></span>
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        {meal.notes && (
          <section style={{
            marginTop:14,padding:'14px 18px',background:'var(--surface)',
            borderRadius:20,border:'1px solid var(--line)',
            animation:'fadeUp .5s .2s both',
          }}>
            <div style={{fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700,marginBottom:6}}>Your note</div>
            <p style={{margin:0,fontSize:13,lineHeight:1.55,color:'var(--ink-2)',fontStyle:'italic'}}>"{meal.notes}"</p>
          </section>
        )}

        {/* Similar meals */}
        <section style={{marginTop:18,animation:'fadeUp .5s .3s both'}}>
          <div style={{fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700,marginBottom:8}}>You've eaten this before</div>
          <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:6,marginRight:-22}}>
            {SEED_MEALS.map((p,i) => (
              <div key={i} style={{
                flexShrink:0,width:120,padding:8,background:'var(--surface)',
                borderRadius:16,border:'1px solid var(--line)',
              }}>
                <div style={{aspectRatio:'1/1',borderRadius:10,overflow:'hidden',background:'var(--cream-2)',marginBottom:6}}>
                  <img src={p.img} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
                <div style={{fontSize:10,color:'var(--ink-soft)'}}>3 days ago</div>
                <div className="tnum" style={{fontSize:13,fontWeight:600}}>{p.calories} kcal</div>
              </div>
            ))}
          </div>
        </section>

        {/* Delete */}
        {!confirming ? (
          <button onClick={() => setConfirming(true)} style={{
            marginTop:18, padding:'14px',width:'100%',background:'transparent',
            border:'1px solid var(--line)',borderRadius:16,
            color:'var(--bad)',fontFamily:'inherit',fontWeight:600,cursor:'pointer',
            display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            Delete this meal
          </button>
        ) : (
          <div style={{
            marginTop:18,padding:18,background:'rgba(230,70,70,.06)',
            borderRadius:18,border:'1px solid rgba(230,70,70,.2)',
            animation:'scaleIn .25s',
          }}>
            <div style={{fontWeight:600,marginBottom:6}}>Delete this meal?</div>
            <div style={{fontSize:12,color:'var(--ink-soft)',marginBottom:10}}>This can't be undone.</div>
            <div style={{display:'flex',gap:8}}>
              <PrimaryButton kind="soft" onClick={() => setConfirming(false)}>Cancel</PrimaryButton>
              <PrimaryButton kind="cta" block onClick={() => onDelete(meal.id)}
                style={{background:'var(--bad)',color:'#fff'}}>Yes, delete</PrimaryButton>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes kenburns{from{transform:scale(1.04) translateY(0)}to{transform:scale(1.12) translateY(-2%)}}`}</style>
    </div>
  );
};

Object.assign(window, { MealDetailScreen });

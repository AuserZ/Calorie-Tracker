// desktop.jsx — desktop layout (md+ in original, dashboard-ish but still single column)
const DesktopApp = ({ tweaks }) => {
  const [tab, setTab] = useState('today');
  const [meals, setMeals] = useState(SEED_MEALS);
  const [openMeal, setOpenMeal] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const totals = meals.reduce((a,m) => ({
    cal: a.cal+m.calories, p: a.p+m.protein, c: a.c+m.carbs, f: a.f+m.fat,
  }), {cal:0,p:0,c:0,f:0});
  const target = TARGET;

  return (
    <div style={{
      width:'100%',height:'100%',display:'flex',
      background:'var(--cream)',color:'var(--ink)',overflow:'hidden',position:'relative',
    }}>
      {/* Side rail */}
      <aside style={{
        width:240,padding:'24px 18px',borderRight:'1px solid var(--line)',
        display:'flex',flexDirection:'column',gap:6,
        background:'var(--surface)',
      }}>
        <div style={{padding:'4px 6px 18px'}}><Wordmark size={26} /></div>
        {[
          {id:'today',label:'Today',Icon:TodayIcon},
          {id:'weight',label:'Weight',Icon:WeightIcon},
          {id:'history',label:'History',Icon:HistoryIcon},
        ].map(({id,label,Icon}) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              display:'flex',alignItems:'center',gap:10,
              padding:'10px 12px',borderRadius:12,border:'none',cursor:'pointer',
              background: active ? 'var(--cream)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-soft)',
              fontFamily:'inherit',fontSize:14,fontWeight:600,textAlign:'left',
              position:'relative',
            }}>
              {active && <span style={{
                position:'absolute',left:0,top:8,bottom:8,width:3,
                background:'var(--tang)',borderRadius:99,
              }}/>}
              <Icon active={active} />
              {label}
            </button>
          );
        })}
        <div style={{flex:1}}/>
        <div style={{
          padding:'12px 14px',background:'var(--cream)',borderRadius:14,
          border:'1px solid var(--line)',
        }}>
          <div style={{fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700}}>Today</div>
          <div className="serif tnum" style={{fontSize:28,lineHeight:1,marginTop:4}}>
            <CountUp to={totals.cal} digits={0} /> <span style={{fontSize:12,color:'var(--ink-soft)'}}>/ {target}</span>
          </div>
          <div style={{height:6,background:'rgba(21,20,15,.08)',borderRadius:99,marginTop:8,overflow:'hidden'}}>
            <div style={{
              width: `${Math.min(100, totals.cal/target*100)}%`,height:'100%',
              background:'linear-gradient(90deg,var(--tang),var(--tang-2))',
              transition:'width 1s cubic-bezier(.2,.8,.2,1)',
            }}/>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{flex:1,overflow:'auto',position:'relative'}}>
        {tab === 'today' && (
          <div style={{maxWidth:980,margin:'0 auto',padding:'24px 28px 60px'}}>
            <header style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:18}}>
              <div>
                <div style={{fontSize:11,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700}}>Wednesday · April 30</div>
                <h1 className="serif" style={{margin:'4px 0 0',fontSize:54,letterSpacing:'-0.02em',lineHeight:1}}>
                  <em style={{color:'var(--tang)'}}>Hi</em> Aren, here's today.
                </h1>
              </div>
              <PrimaryButton kind="cta" onClick={() => setCaptureOpen(true)} icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              }>Log a meal</PrimaryButton>
            </header>

            <div style={{display:'grid',gridTemplateColumns:'1.1fr 1fr',gap:18}}>
              {/* Hero ring card */}
              <section style={{
                padding:'24px',background:'var(--surface)',borderRadius:28,
                border:'1px solid var(--line)',
                display:'flex',gap:24,alignItems:'center',
                position:'relative',overflow:'hidden',
                animation:'fadeUp .6s both',
              }}>
                <div aria-hidden style={{
                  position:'absolute',top:'-30px',right:'-30px',width:200,height:200,
                  background:'radial-gradient(circle, rgba(255,162,69,.4), transparent 65%)',
                  filter:'blur(20px)',animation:'blob1 14s ease-in-out infinite',
                }}/>
                <DailyRing eaten={totals.cal} target={target} style={tweaks.ringStyle} size={220}/>
                <div style={{position:'relative'}}>
                  <div style={{fontSize:11,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700}}>Daily target</div>
                  <div className="serif tnum" style={{fontSize:42,lineHeight:1,marginTop:4}}>{target} <span style={{fontSize:14,color:'var(--ink-soft)'}}>kcal</span></div>
                  <p style={{fontSize:13,color:'var(--ink-soft)',maxWidth:200,marginTop:10,lineHeight:1.5,textWrap:'pretty'}}>
                    Based on your goal of <em style={{color:'var(--ink)'}}>maintain</em>, current weight 72.8 kg, and moderate activity.
                  </p>
                  <Chip color="#0F8F4D" bg="rgba(31,179,107,.12)" style={{marginTop:12}}>
                    <span style={{width:6,height:6,borderRadius:99,background:'#0F8F4D'}}/>
                    {target - totals.cal} kcal to go
                  </Chip>
                </div>
              </section>

              {/* Macros stack */}
              <section style={{display:'flex',flexDirection:'column',gap:10,animation:'fadeUp .6s .1s both'}}>
                <MacroPill label="Protein" value={totals.p} max={120} color="linear-gradient(90deg,var(--blue),var(--blue-2))" delay={150}/>
                <MacroPill label="Carbs" value={totals.c} max={240} color="linear-gradient(90deg,var(--tang),var(--tang-2))" delay={250}/>
                <MacroPill label="Fat" value={totals.f} max={80} color="linear-gradient(90deg,#7BB12A,var(--lime))" delay={350}/>
              </section>
            </div>

            {/* Meals grid */}
            <section style={{marginTop:24,animation:'fadeUp .6s .2s both'}}>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:12}}>
                <h2 className="serif" style={{margin:0,fontSize:30,letterSpacing:'-0.01em'}}>
                  Today's plate <span style={{color:'var(--ink-soft)',fontStyle:'italic',fontSize:20}}>· {meals.length}</span>
                </h2>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {meals.map((m,i) => (
                  <div key={m.id} style={{animation:`fadeUp .5s ${0.25+i*0.06}s both`}}>
                    <MealCard meal={m} onClick={() => setOpenMeal(m)} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'weight' && (
          <div style={{maxWidth:760,margin:'0 auto'}}>
            <WeightScreen />
          </div>
        )}
        {tab === 'history' && (
          <div style={{maxWidth:760,margin:'0 auto'}}>
            <HistoryScreen onOpenMeal={(m) => setOpenMeal(m)} />
          </div>
        )}

        {openMeal && (
          <div style={{
            position:'absolute',inset:0,zIndex:40,background:'rgba(15,14,10,.4)',
            backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',
            padding:24,animation:'fadeIn .25s',
          }} onClick={() => setOpenMeal(null)}>
            <div onClick={(e) => e.stopPropagation()} style={{
              width:'100%',maxWidth:520,maxHeight:'90%',overflowY:'auto',
              background:'var(--cream)',borderRadius:28,
              animation:'scaleIn .3s cubic-bezier(.2,.8,.2,1)',
            }}>
              <MealDetailScreen meal={openMeal} onBack={() => setOpenMeal(null)} onDelete={() => {setMeals(meals.filter(x => x.id !== openMeal.id)); setOpenMeal(null);}}/>
            </div>
          </div>
        )}

        <CaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)}
          onLogged={(m) => setMeals([m, ...meals])}/>
      </main>
    </div>
  );
};

Object.assign(window, { DesktopApp });

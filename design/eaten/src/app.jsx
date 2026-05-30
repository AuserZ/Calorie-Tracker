// app.jsx — root, mounts both mobile + desktop in design canvas, wires Tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "ringStyle": "arc",
  "showConfetti": true,
  "tang": "#FF6A1A",
  "blue": "#2E5BFF",
  "cream": "#FFF6E6",
  "ink": "#15140F"
}/*EDITMODE-END*/;

const MobileApp = ({ tweaks }) => {
  const [tab, setTab] = useState('today');
  const [meals, setMeals] = useState(SEED_MEALS);
  const [openMeal, setOpenMeal] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // expose ring style to Today
  window.__ringStyle = tweaks.ringStyle;

  return (
    <div style={{
      width:'100%',height:'100%',background:'var(--cream)',color:'var(--ink)',
      position:'relative',overflow:'hidden',display:'flex',flexDirection:'column',
    }}>
      <div className="frame-scroll" style={{flex:1,position:'relative'}}>
        {tab === 'today' && (
          <TodayScreen
            meals={meals}
            target={TARGET}
            animationKey={animKey}
            onOpenCapture={() => setCaptureOpen(true)}
            onOpenMeal={(m) => setOpenMeal(m)}
          />
        )}
        {tab === 'weight' && <WeightScreen />}
        {tab === 'history' && <HistoryScreen onOpenMeal={(m) => setOpenMeal(m)} />}
      </div>

      <BottomNav current={tab} onNav={(t) => { setTab(t); setAnimKey(k => k+1); }} />

      {openMeal && (
        <div style={{
          position:'absolute',inset:0,zIndex:60,background:'var(--cream)',
          overflowY:'auto',animation:'slideInRight .35s cubic-bezier(.2,.8,.2,1)',
        }}>
          <MealDetailScreen
            meal={openMeal}
            onBack={() => setOpenMeal(null)}
            onDelete={(id) => { setMeals(meals.filter(m => m.id !== id)); setOpenMeal(null); }}
          />
        </div>
      )}

      <CaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)}
        onLogged={(m) => setMeals([m, ...meals])}/>

      <style>{`@keyframes slideInRight{from{transform:translateX(100%);opacity:.4}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
};

function Root() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply colour tweaks to root vars
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--tang', t.tang);
    r.style.setProperty('--blue', t.blue);
    r.style.setProperty('--cream', t.cream);
    r.style.setProperty('--ink', t.ink);
  }, [t.tang, t.blue, t.cream, t.ink]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="mobile" title="Mobile — primary surface">
          <DCArtboard id="m-today" label="Today + nav + FAB" width={402} height={874}>
            <IOSDevice width={402} height={874}>
              <MobileApp tweaks={t} />
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="m-capture" label="Capture flow (analyzing)" width={402} height={874}>
            <IOSDevice width={402} height={874}>
              <CaptureFlowDemo tweaks={t} />
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="m-detail" label="Meal detail" width={402} height={874}>
            <IOSDevice width={402} height={874}>
              <MealDetailDemo />
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="m-weight" label="Weight" width={402} height={874}>
            <IOSDevice width={402} height={874}>
              <WeightDemo />
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="m-history" label="History" width={402} height={874}>
            <IOSDevice width={402} height={874}>
              <HistoryDemo />
            </IOSDevice>
          </DCArtboard>
        </DCSection>
        <DCSection id="desktop" title="Desktop — sticky companion">
          <DCArtboard id="d-today" label="Today (md+)" width={1280} height={820}>
            <ChromeWindow url="eat-en.app" tabs={[{title:'eat·en'}]} width={1280} height={820}>
              <DesktopApp tweaks={t}/>
            </ChromeWindow>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel>
        <TweakSection label="Daily ring" />
        <TweakRadio label="Style" value={t.ringStyle}
          options={['arc','liquid','arcs']}
          onChange={(v) => setTweak('ringStyle', v)}/>
        <TweakToggle label="Confetti at goal" value={t.showConfetti} onChange={(v) => setTweak('showConfetti', v)}/>
        <TweakSection label="Brand colours" />
        <TweakColor label="Accent (orange)" value={t.tang} onChange={(v) => setTweak('tang', v)}/>
        <TweakColor label="Primary (blue)" value={t.blue} onChange={(v) => setTweak('blue', v)}/>
        <TweakColor label="Cream BG" value={t.cream} onChange={(v) => setTweak('cream', v)}/>
        <TweakColor label="Ink" value={t.ink} onChange={(v) => setTweak('ink', v)}/>
      </TweaksPanel>
    </>
  );
}

// ─── Per-frame demos so each artboard tells a different story ────
function CaptureFlowDemo({ tweaks }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [open]);
  return (
    <div style={{width:'100%',height:'100%',background:'var(--cream)',position:'relative',overflow:'hidden'}}>
      <MobileApp tweaks={tweaks}/>
      <CaptureModal open={open} onClose={() => setOpen(false)} onLogged={() => {}}/>
    </div>
  );
}

function MealDetailDemo() {
  return (
    <div style={{width:'100%',height:'100%',background:'var(--cream)',overflowY:'auto'}}>
      <MealDetailScreen meal={SEED_MEALS[0]} onBack={() => {}} onDelete={() => {}}/>
    </div>
  );
}

function WeightDemo() {
  return (
    <div style={{width:'100%',height:'100%',background:'var(--cream)',overflowY:'auto',position:'relative'}}>
      <WeightScreen />
      <BottomNav current="weight" onNav={() => {}}/>
    </div>
  );
}

function HistoryDemo() {
  return (
    <div style={{width:'100%',height:'100%',background:'var(--cream)',overflowY:'auto',position:'relative'}}>
      <HistoryScreen onOpenMeal={() => {}}/>
      <BottomNav current="history" onNav={() => {}}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);

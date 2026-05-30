// capture.jsx — log-a-meal flow modal
const CaptureModal = ({ open, onClose, onLogged }) => {
  const [step, setStep] = useState('camera'); // camera -> analyzing -> result
  const [notes, setNotes] = useState('');
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!open) { setStep('camera'); setNotes(''); }
  }, [open]);

  const fakeImages = ['meals/meal1.jpg','meals/meal2.jpg','meals/meal3.jpg'];
  const fakeResult = {
    name: 'Bowl of pad see ew',
    calories: 612, protein: 22, carbs: 78, fat: 24,
    confidence: 'high',
  };

  const snap = () => {
    setStep('analyzing');
    setTimeout(() => setStep('result'), 2200);
  };

  const log = () => {
    onLogged({ ...fakeResult, img: fakeImages[imgIdx], time: 'just now', tag: 'Meal', id: 'm'+Date.now() });
    onClose();
  };

  if (!open) return null;
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:50, display:'flex',
      alignItems:'flex-end', justifyContent:'center',
      background:'rgba(15,14,10,.45)', backdropFilter:'blur(8px)',
      WebkitBackdropFilter:'blur(8px)',
      animation:'fadeIn .25s', overflow:'hidden',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width:'100%', background:'var(--cream)',
        borderRadius:'28px 28px 0 0',
        padding:'14px 20px 30px',
        animation:'sheetUp .42s cubic-bezier(.2,.8,.2,1)',
        position:'relative', maxHeight:'90%',
        display:'flex',flexDirection:'column',
        overflowY:'auto',
      }}>
        {/* drag handle */}
        <div style={{
          width:44,height:5,borderRadius:99,
          background:'rgba(21,20,15,.18)',margin:'4px auto 14px',
        }}/>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <h2 className="serif" style={{margin:0,fontSize:30,letterSpacing:'-0.01em'}}>
            {step === 'camera' && 'Snap a meal'}
            {step === 'analyzing' && <em style={{color:'var(--tang)'}}>Tasting…</em>}
            {step === 'result' && "Here's what I see"}
          </h2>
          <button aria-label="Close" onClick={onClose} style={{
            width:36,height:36,borderRadius:99,background:'rgba(21,20,15,.06)',
            border:'none',color:'var(--ink)',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* photo area */}
        <div style={{
          position:'relative', aspectRatio:'4/3', borderRadius:22, overflow:'hidden',
          background:'var(--cream-2)', marginBottom:14,
        }}>
          <img src={fakeImages[imgIdx]} alt="" style={{
            width:'100%',height:'100%',objectFit:'cover',
            transform: step==='analyzing' ? 'scale(1.04)' : 'scale(1)',
            transition:'transform 1.2s ease-out',
            filter: step==='camera' ? 'none' : 'none',
          }}/>

          {step === 'analyzing' && (
            <>
              {/* scan line */}
              <div style={{
                position:'absolute',left:0,right:0,height:80,
                background:'linear-gradient(180deg,transparent,rgba(255,162,69,.5),transparent)',
                animation:'scanline 1.6s ease-in-out infinite alternate',
              }}/>
              {/* corners */}
              {[
                {top:12,left:12,br:'2px 0 0 0'},
                {top:12,right:12,br:'0 2px 0 0'},
                {bottom:12,left:12,br:'0 0 0 2px'},
                {bottom:12,right:12,br:'0 0 2px 0'},
              ].map((p,i) => (
                <span key={i} style={{
                  position:'absolute',width:24,height:24,
                  borderColor:'var(--lime)',borderStyle:'solid',
                  borderWidth:'2px',
                  ...{0:{borderRight:'none',borderBottom:'none'},
                      1:{borderLeft:'none',borderBottom:'none'},
                      2:{borderRight:'none',borderTop:'none'},
                      3:{borderLeft:'none',borderTop:'none'}}[i],
                  ...p,
                  animation:'fadeIn .3s',
                }}/>
              ))}
              {/* sparkle text */}
              <div style={{
                position:'absolute',bottom:18,left:0,right:0,
                display:'flex',justifyContent:'center',gap:8,alignItems:'center',
                color:'#fff',
              }}>
                <span style={{
                  width:8,height:8,borderRadius:99,background:'var(--lime)',
                  animation:'pulseRing 1.4s infinite',
                }}/>
                <span className="mono" style={{fontSize:11,letterSpacing:'.18em',textTransform:'uppercase',
                  textShadow:'0 1px 6px rgba(0,0,0,.6)'}}>
                  Detecting · Counting · Estimating
                </span>
              </div>
            </>
          )}

          {step === 'camera' && (
            <div style={{
              position:'absolute',bottom:14,left:14,right:14,
              display:'flex',gap:6,
            }}>
              {fakeImages.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)} style={{
                  flex:1, height:6, borderRadius:99, border:'none',
                  background: i===imgIdx ? 'var(--cream)' : 'rgba(255,255,255,.45)',
                  cursor:'pointer',
                }}/>
              ))}
            </div>
          )}
        </div>

        {step !== 'analyzing' && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details — '2 sendok rice, 1 telur ceplok'…"
            style={{
              width:'100%', minHeight:64, padding:'12px 14px',
              borderRadius:16, border:'1px solid var(--line)',
              background:'var(--surface)', fontFamily:'inherit',
              fontSize:13, color:'var(--ink)', resize:'none', outline:'none',
              marginBottom:14,
            }}/>
        )}

        {step === 'result' && (
          <div style={{
            background:'var(--surface)',borderRadius:20,padding:'14px 16px',
            border:'1px solid var(--line)', marginBottom:14,
            animation:'scaleIn .4s cubic-bezier(.2,.8,.2,1)',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{fontSize:18}}>✨</span>
              <span className="serif" style={{fontSize:22,fontStyle:'italic'}}>{fakeResult.name}</span>
              <span style={{marginLeft:'auto'}}>
                <Chip color="#0F8F4D" bg="rgba(31,179,107,.12)">High match</Chip>
              </span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr',gap:8}}>
              {[
                {label:'kcal', val: fakeResult.calories, big: true},
                {label:'P', val: fakeResult.protein+'g'},
                {label:'C', val: fakeResult.carbs+'g'},
                {label:'F', val: fakeResult.fat+'g'},
              ].map((s,i) => (
                <div key={i} style={{
                  background:'var(--cream)',borderRadius:14,padding:'10px 8px',
                  textAlign:'center',
                }}>
                  <div className="serif tnum" style={{fontSize:s.big ? 28 : 18,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:9,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--ink-soft)',fontWeight:700,marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8}}>
          {step === 'camera' && (
            <PrimaryButton block kind="cta" onClick={snap} icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 4l3-2h8l3 2M3 6h18v14H3V6zm9 4a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="1.6"/></svg>
            }>Analyze this</PrimaryButton>
          )}
          {step === 'analyzing' && (
            <PrimaryButton block kind="soft" disabled>
              <span style={{display:'inline-flex',gap:5}}>
                {[0,1,2].map(i => <span key={i} style={{
                  width:6,height:6,borderRadius:99,background:'var(--tang)',
                  animation:`pulseRing 1.2s ${i*0.15}s infinite`,
                }}/>)}
              </span>
              <span style={{marginLeft:8}}>Finding flavor…</span>
            </PrimaryButton>
          )}
          {step === 'result' && (
            <>
              <PrimaryButton kind="soft" onClick={() => setStep('camera')}>Retake</PrimaryButton>
              <PrimaryButton block kind="cta" onClick={log} icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }>Log it</PrimaryButton>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
};

Object.assign(window, { CaptureModal });

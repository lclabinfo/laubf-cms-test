import { useState, useRef, useEffect } from "react";

const INITIAL_MESSAGES = [
  { id: 1, title: "As The Spirit Gave Them Utterance", passage: "Acts 2:1-47", speaker: "P. William", series: "Sunday Message", date: "Feb 8, 2026", status: "Published", vStatus: "live", sStatus: "none", duration: "1:24:33", videoUrl: "https://www.youtube.com/watch?v=U-vvxbOHQEM", videoDesc: "", audioUrl: "", transcript: "<p>Today we study Acts chapter 2, the day of Pentecost.</p>", studySections: [], description: "On the day of Pentecost, the Holy Spirit came upon the disciples and they spoke in other tongues." },
  { id: 2, title: "The Rich Man and Lazarus", passage: "Luke 16:13-31", speaker: "P. William", series: "Sunday Message", date: "Feb 1, 2026", status: "Published", vStatus: "live", sStatus: "live", duration: "58:21", videoUrl: "https://www.youtube.com/watch?v=example2", videoDesc: "", audioUrl: "", transcript: "", studySections: [{ name: "Questions", content: "1. Who was Lazarus?\n2. What happened after they both died?\n3. What is the meaning of the great chasm?" }, { name: "Answers", content: "1. Lazarus was a poor man who lay at the rich man's gate..." }], description: "" },
  { id: 3, title: "The Shrewd Manager", passage: "Luke 16:1-13", speaker: "P. William", series: "Sunday Message", date: "Jan 25, 2026", status: "Published", vStatus: "live", sStatus: "draft", duration: "1:02:15", videoUrl: "https://www.youtube.com/watch?v=example3", videoDesc: "", audioUrl: "", transcript: "", studySections: [{ name: "Questions", content: "1. What does shrewdness mean in this context?" }], description: "" },
  { id: 4, title: "The Cost of Being a Disciple", passage: "Luke 14:12-35", speaker: "P. William", series: "Sunday Message", date: "Jan 18, 2026", status: "Published", vStatus: "live", sStatus: "live", duration: "49:10", videoUrl: "https://www.youtube.com/watch?v=example4", videoDesc: "", audioUrl: "", transcript: "", studySections: [{ name: "Questions", content: "" }, { name: "Answers", content: "" }], description: "" },
  { id: 5, title: "God and Money", passage: "Luke 12:13-34", speaker: "P. William", series: "Sunday Message", date: "Jan 11, 2026", status: "Draft", vStatus: "none", sStatus: "none", duration: "", videoUrl: "", videoDesc: "", audioUrl: "", transcript: "", studySections: [], description: "" },
];

const sC = {
  live: { bg: "#dcfce7", color: "#15803d", label: "Live" },
  draft: { bg: "#fef9c3", color: "#a16207", label: "Draft" },
  none: { bg: "#f4f4f5", color: "#a1a1aa", label: "Empty" },
};

/* ── Tiny icons ── */
const I = {
  back: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  plus: (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  video: (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  book: (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  gear: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  chevDown: (open, c="#9c978d") => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>,
  chevRight: (open) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9c978d" strokeWidth="2.5" style={{transform:open?"rotate(90deg)":"rotate(0)",transition:"transform 0.15s"}}><polyline points="9 18 15 12 9 6"/></svg>,
};

/* ── Publish Dialog ── */
function PublishDialog({ msg, onClose, vP, setVP, sP, setSP, onPublish }) {
  const hasV = msg.videoUrl?.trim();
  const hasS = msg.studySections?.length > 0;
  const Toggle = ({on, enabled, toggle}) => (
    <div onClick={() => enabled && toggle()} style={{ width: 42, height: 24, borderRadius: 12, background: on ? "#22c55e" : !enabled ? "#e5e5e5" : "#d4d4d8", position:"relative", cursor: enabled?"pointer":"not-allowed", transition:"background 0.2s", opacity: enabled?1:0.5 }}>
      <div style={{ position:"absolute", top:2, left: on?20:2, width:20, height:20, borderRadius:"50%", background:"white", boxShadow:"0 1px 3px rgba(0,0,0,0.2)", transition:"left 0.2s" }}/>
    </div>
  );
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.35)", backdropFilter:"blur(3px)" }}/>
      <div style={{ position:"relative", width:480, background:"white", borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,0.18)", overflow:"hidden", animation:"scaleIn 0.2s ease" }}>
        <div style={{ padding:"22px 24px 0" }}>
          <h3 style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>Publish Message</h3>
          <p style={{ fontSize:13, color:"#71717a", marginBottom:18 }}>Choose which content to make live.</p>
        </div>
        <div style={{ padding:"0 24px" }}>
          <div style={{ border:`1px solid ${vP?"#bbf7d0":"#e5e5e5"}`, borderRadius:10, padding:16, marginBottom:10, background:vP?"#f0fdf4":"#fafafa", transition:"all 0.2s" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"#eff6ff", color:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.video()}</div>
                <div><div style={{ fontWeight:600, fontSize:13.5 }}>Video</div><div style={{ fontSize:12, color:"#71717a" }}>{hasV?`YouTube · ${msg.duration||"—"}`:"No video content"}</div></div>
              </div>
              <Toggle on={vP} enabled={!!hasV} toggle={()=>setVP(!vP)}/>
            </div>
          </div>
          <div style={{ border:`1px solid ${sP?"#bbf7d0":"#e5e5e5"}`, borderRadius:10, padding:16, marginBottom:16, background:sP?"#f0fdf4":"#fafafa", transition:"all 0.2s" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"#f5f3ff", color:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.book()}</div>
                <div><div style={{ fontWeight:600, fontSize:13.5 }}>Bible Study</div><div style={{ fontSize:12, color:"#71717a" }}>{hasS?`${msg.studySections.length} section(s)`:"No study material"}</div></div>
              </div>
              <Toggle on={sP} enabled={hasS} toggle={()=>setSP(!sP)}/>
            </div>
          </div>
          <div style={{ padding:"12px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e2e8f0", marginBottom:20, fontSize:12.5, lineHeight:1.6, color:"#475569" }}>
            <strong style={{color:"#0f172a"}}>Summary:</strong><br/>
            {vP?"✓ Video will be published":"— Video not included"}<br/>
            {sP?"✓ Bible Study will be published":"— Bible Study not included"}
            {!vP&&!sP&&<><br/><span style={{color:"#b45309"}}>⚠ Select at least one</span></>}
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, padding:"0 24px 20px" }}>
          <button onClick={onClose} style={{ padding:"8px 18px", border:"1px solid #e5e5e5", borderRadius:8, background:"white", fontSize:13, fontWeight:500, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>{onPublish();onClose();}} disabled={!vP&&!sP} style={{ padding:"8px 20px", border:"none", borderRadius:8, background:(vP||sP)?"#16a34a":"#d4d4d8", color:"white", fontSize:13, fontWeight:600, cursor:(vP||sP)?"pointer":"not-allowed" }}>Publish Selected</button>
        </div>
      </div>
    </div>
  );
}

/* ── LIST VIEW ── */
function ListView({ messages, onOpen, onNew }) {
  const [expId, setExpId] = useState(null);
  return (
    <div style={{ animation:"fadeIn 0.2s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"24px 28px 0" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:-0.3 }}>Messages</h1>
          <p style={{ fontSize:13, color:"#9c978d", marginTop:2 }}>Manage sermons, Bible studies, and other messages.</p>
        </div>
        <button onClick={onNew} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#1a1916", color:"white", border:"none", padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" }}>{I.plus(13)} New Message</button>
      </div>
      <div style={{ display:"flex", gap:8, padding:"14px 28px" }}>
        <input placeholder="Search messages..." style={{ flex:1, maxWidth:300, padding:"7px 12px", border:"1px solid #e6e3dd", borderRadius:8, fontSize:13, outline:"none", background:"white" }}/>
        <button style={{ padding:"7px 12px", border:"1px solid #e6e3dd", borderRadius:8, background:"white", fontSize:12, color:"#5c5850", cursor:"pointer" }}>Filters</button>
      </div>
      <div style={{ margin:"0 28px 28px", border:"1px solid #e6e3dd", borderRadius:12, background:"white", overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"32px 1fr 100px 100px 76px 64px 64px", padding:"9px 14px", background:"#f7f6f3", borderBottom:"1px solid #e6e3dd" }}>
          {["","Title","Speaker","Date ↓","Status","Video","Study"].map(h=><div key={h} style={{ fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", color:"#9c978d", fontWeight:600 }}>{h}</div>)}
        </div>
        {messages.map(m => {
          const isOpen = expId === m.id;
          return (
            <div key={m.id} style={{ borderBottom:"1px solid #f0ede8" }}>
              <div style={{ display:"grid", gridTemplateColumns:"32px 1fr 100px 100px 76px 64px 64px", padding:"10px 14px", cursor:"pointer", alignItems:"center", transition:"background 0.1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#fcfcfa"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <div onClick={e=>{e.stopPropagation();setExpId(isOpen?null:m.id);}} style={{cursor:"pointer"}}>{I.chevRight(isOpen)}</div>
                <div onClick={()=>onOpen(m,"details")}>
                  <div style={{ fontWeight:500, fontSize:13.5 }}>{m.title||<span style={{color:"#9c978d",fontStyle:"italic"}}>Untitled</span>}</div>
                  {m.passage&&<div style={{ fontSize:11, color:"#9c978d" }}>{m.passage}</div>}
                </div>
                <div style={{ fontSize:12.5, color:"#5c5850" }}>{m.speaker}</div>
                <div style={{ fontSize:12.5, color:"#5c5850" }}>{m.date}</div>
                <div><span style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:500, background:m.status==="Published"?"#f0fdf4":"#f4f4f5", color:m.status==="Published"?"#16a34a":"#5c5850" }}>{m.status}</span></div>
                <div><span style={{ padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:600, background:sC[m.vStatus].bg, color:sC[m.vStatus].color }}>{sC[m.vStatus].label}</span></div>
                <div><span style={{ padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:600, background:sC[m.sStatus].bg, color:sC[m.sStatus].color }}>{sC[m.sStatus].label}</span></div>
              </div>
              {isOpen && (
                <div style={{ padding:"0 14px 14px 46px", animation:"fadeIn 0.12s ease" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {/* Video card */}
                    <div onClick={()=>onOpen(m,"video")} style={{ border:"1px solid #e6e3dd", borderRadius:8, padding:"12px 14px", background:"#f7f6f3", cursor:"pointer", transition:"all 0.15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#c4c2bd";e.currentTarget.style.background="white";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e6e3dd";e.currentTarget.style.background="#f7f6f3";e.currentTarget.style.boxShadow="none";}}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, fontWeight:600 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:m.vStatus!=="none"?"#2563eb":"#d4d4d8" }}/> Video
                        </div>
                        <span style={{ fontSize:10, fontWeight:600, padding:"1px 6px", borderRadius:3, background:sC[m.vStatus].bg, color:sC[m.vStatus].color }}>{sC[m.vStatus].label}</span>
                      </div>
                      <div style={{ fontSize:12, color:"#5c5850", lineHeight:1.5 }}>{m.videoUrl?`YouTube · ${m.duration||"—"}`:"No video content"}</div>
                      <div style={{ fontSize:11.5, color:"#2563eb", marginTop:6, fontWeight:500 }}>Edit video →</div>
                    </div>
                    {/* Study card */}
                    <div onClick={()=>onOpen(m,"study")} style={{ border:"1px solid #e6e3dd", borderRadius:8, padding:"12px 14px", background:"#f7f6f3", cursor:"pointer", transition:"all 0.15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#c4c2bd";e.currentTarget.style.background="white";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e6e3dd";e.currentTarget.style.background="#f7f6f3";e.currentTarget.style.boxShadow="none";}}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, fontWeight:600 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:m.sStatus!=="none"?"#7c3aed":"#d4d4d8" }}/> Bible Study
                        </div>
                        <span style={{ fontSize:10, fontWeight:600, padding:"1px 6px", borderRadius:3, background:sC[m.sStatus].bg, color:sC[m.sStatus].color }}>{sC[m.sStatus].label}</span>
                      </div>
                      <div style={{ fontSize:12, color:"#5c5850", lineHeight:1.5 }}>{m.studySections?.length>0?`${m.studySections.length} section(s)`:"No study material"}</div>
                      <div style={{ fontSize:11.5, color:"#7c3aed", marginTop:6, fontWeight:500 }}>Edit study →</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── TABBED EDITOR ── */
function TabbedEditor({ message: initial, isNew, initialTab, onBack, onSave }) {
  const [msg, setMsg] = useState({...initial});
  const [tab, setTab] = useState(initialTab || "details");
  const [showPublish, setShowPublish] = useState(false);
  const [vP, setVP] = useState(initial.vStatus === "live");
  const [sP, setSP] = useState(initial.sStatus === "live");
  const [activeSection, setActiveSection] = useState(0);
  const titleRef = useRef(null);

  useEffect(() => { if (isNew && titleRef.current) titleRef.current.focus(); }, [isNew]);

  const u = (k, v) => setMsg(p => ({...p, [k]: v}));
  const hasV = msg.videoUrl?.trim();
  const hasS = msg.studySections?.length > 0;

  const addSection = (name) => {
    const s = [...(msg.studySections||[]), {name, content:""}];
    setMsg(p => ({...p, studySections: s, sStatus: p.sStatus==="none"?"draft":p.sStatus}));
    setActiveSection(s.length-1);
  };
  const removeSection = (idx) => {
    const s = msg.studySections.filter((_,i)=>i!==idx);
    setMsg(p => ({...p, studySections: s, sStatus: s.length===0?"none":p.sStatus}));
    setActiveSection(Math.max(0, activeSection-1));
  };
  const updateSection = (idx, content) => {
    const s = msg.studySections.map((sec,i) => i===idx?{...sec,content}:sec);
    setMsg(p => ({...p, studySections: s}));
  };

  const handleSave = () => {
    onSave({...msg, status:"Draft", vStatus:msg.videoUrl?"draft":"none", sStatus:msg.studySections?.length>0?"draft":"none"});
    onBack();
  };
  const handlePublish = () => {
    onSave({...msg, status:"Published", vStatus:vP&&msg.videoUrl?"live":msg.videoUrl?"draft":"none", sStatus:sP&&msg.studySections?.length>0?"live":msg.studySections?.length>0?"draft":"none"});
    onBack();
  };

  const inp = { width:"100%", padding:"9px 12px", border:"1px solid #e6e3dd", borderRadius:8, fontSize:13.5, outline:"none", fontFamily:"inherit", background:"white" };
  const lbl = { display:"block", fontSize:12, fontWeight:600, color:"#5c5850", marginBottom:5 };

  const tabs = [
    { id: "details", label: "Details", icon: I.gear, badge: null },
    { id: "video", label: "Video", icon: I.video(), badge: hasV ? { bg:"#dcfce7", color:"#15803d", text:"Has content" } : null },
    { id: "study", label: "Bible Study", icon: I.book(), badge: hasS ? { bg:"#dcfce7", color:"#15803d", text:`${msg.studySections.length} section${msg.studySections.length!==1?"s":""}` } : null },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", animation:"fadeIn 0.15s ease" }}>
      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 28px", borderBottom:"1px solid #e6e3dd", background:"white", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onBack} style={{ width:30, height:30, borderRadius:6, border:"1px solid #e6e3dd", background:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>{I.back}</button>
          <span style={{ fontSize:15, fontWeight:700 }}>{isNew?"New Message":(msg.title||"Untitled")}</span>
          {!isNew&&<span style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:500, background:msg.status==="Published"?"#f0fdf4":"#f4f4f5", color:msg.status==="Published"?"#16a34a":"#5c5850" }}>{msg.status}</span>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onBack} style={{ padding:"7px 14px", border:"1px solid #e6e3dd", borderRadius:8, background:"white", fontSize:12.5, cursor:"pointer", fontWeight:500 }}>Cancel</button>
          <button onClick={handleSave} style={{ padding:"7px 14px", border:"1px solid #e6e3dd", borderRadius:8, background:"white", fontSize:12.5, cursor:"pointer", fontWeight:500 }}>Save Draft</button>
          <button onClick={()=>setShowPublish(true)} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 16px", border:"none", borderRadius:8, background:"#16a34a", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>{I.check} Publish...</button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display:"flex", gap:0, padding:"0 28px", background:"white", borderBottom:"1px solid #e6e3dd", flexShrink:0 }}>
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:"inline-flex", alignItems:"center", gap:7, padding:"11px 20px",
              border:"none", borderBottom: active ? "2px solid #1a1916" : "2px solid transparent",
              background:"transparent", fontSize:13, fontWeight: active?600:500,
              color: active?"#1a1916":"#9c978d", cursor:"pointer", fontFamily:"inherit",
              transition:"all 0.15s", marginBottom:-1
            }}>
              <span style={{ opacity: active?1:0.5, display:"flex" }}>{t.icon}</span>
              {t.label}
              {t.badge && <span style={{ fontSize:10, fontWeight:600, padding:"1px 6px", borderRadius:10, background:t.badge.bg, color:t.badge.color, marginLeft:2 }}>{t.badge.text}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex:1, overflow:"auto" }}>
        <div style={{ maxWidth:800, margin:"0 auto", padding:"24px 28px 80px" }}>

          {/* ════ DETAILS TAB ════ */}
          {tab === "details" && (
            <div style={{ animation:"fadeIn 0.15s ease" }}>
              {isNew && (
                <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"14px 18px", marginBottom:20, fontSize:13, color:"#1e40af", lineHeight:1.6 }}>
                  <strong>Creating a new message.</strong> Fill in the details below, then switch to the Video or Bible Study tab to add content.
                </div>
              )}
              <div style={{ border:"1px solid #e6e3dd", borderRadius:12, background:"white", padding:20 }}>
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Title <span style={{color:"#dc2626"}}>*</span></label>
                  <input ref={titleRef} value={msg.title} onChange={e=>u("title",e.target.value)} placeholder="e.g. The Parable of the Good Samaritan" style={{...inp, fontSize:16, fontWeight:500, padding:"11px 14px"}}/>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                  <div><label style={lbl}>Speaker <span style={{color:"#dc2626"}}>*</span></label><input value={msg.speaker} onChange={e=>u("speaker",e.target.value)} placeholder="Select or type name" style={inp}/></div>
                  <div><label style={lbl}>Message Date <span style={{color:"#dc2626"}}>*</span></label><input value={msg.date} onChange={e=>u("date",e.target.value)} placeholder="Feb 15, 2026" style={inp}/></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                  <div><label style={lbl}>Series</label><input value={msg.series} onChange={e=>u("series",e.target.value)} placeholder="e.g. Sunday Message" style={inp}/></div>
                  <div><label style={lbl}>Scripture Passage</label><input value={msg.passage} onChange={e=>u("passage",e.target.value)} placeholder="e.g. Luke 15:1-10" style={inp}/></div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Description</label>
                  <textarea value={msg.description||""} onChange={e=>u("description",e.target.value)} placeholder="Brief summary for listings and SEO..." style={{...inp, minHeight:80, resize:"vertical"}}/>
                </div>
                <div>
                  <label style={lbl}>Attachments</label>
                  <div style={{ border:"1px dashed #e6e3dd", borderRadius:8, padding:"20px 16px", textAlign:"center", color:"#9c978d", fontSize:13 }}>
                    <div style={{ marginBottom:6 }}>Drop files here or click to upload</div>
                    <button style={{ padding:"6px 14px", border:"1px solid #e6e3dd", borderRadius:6, background:"white", fontSize:12, cursor:"pointer", color:"#5c5850" }}>Browse files</button>
                  </div>
                </div>
              </div>

              {/* Content summary cards */}
              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#9c978d", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Content Overview</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div onClick={()=>setTab("video")} style={{ border:"1px solid #e6e3dd", borderRadius:10, padding:"14px 16px", background:"white", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#bfdbfe";e.currentTarget.style.boxShadow="0 0 0 2px rgba(37,99,235,0.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e6e3dd";e.currentTarget.style.boxShadow="none";}}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:7, background:"#eff6ff", color:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.video(13)}</div>
                        <span style={{ fontWeight:600, fontSize:13 }}>Video</span>
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, padding:"2px 6px", borderRadius:4, background:hasV?"#dcfce7":"#f4f4f5", color:hasV?"#15803d":"#a1a1aa" }}>{hasV?"Has content":"Empty"}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#2563eb", fontWeight:500 }}>Go to Video tab →</div>
                  </div>
                  <div onClick={()=>setTab("study")} style={{ border:"1px solid #e6e3dd", borderRadius:10, padding:"14px 16px", background:"white", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#ddd6fe";e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,0.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e6e3dd";e.currentTarget.style.boxShadow="none";}}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:7, background:"#f5f3ff", color:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.book(13)}</div>
                        <span style={{ fontWeight:600, fontSize:13 }}>Bible Study</span>
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, padding:"2px 6px", borderRadius:4, background:hasS?"#dcfce7":"#f4f4f5", color:hasS?"#15803d":"#a1a1aa" }}>{hasS?`${msg.studySections.length} sections`:"Empty"}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#7c3aed", fontWeight:500 }}>Go to Bible Study tab →</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ VIDEO TAB ════ */}
          {tab === "video" && (
            <div style={{ animation:"fadeIn 0.15s ease" }}>
              <div style={{ border:"1px solid #e6e3dd", borderRadius:12, background:"white", padding:20 }}>
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Video URL</label>
                  <div style={{ display:"flex", gap:6 }}>
                    <input value={msg.videoUrl} onChange={e=>u("videoUrl",e.target.value)} placeholder="Paste YouTube or Vimeo link" style={{...inp, flex:1}}/>
                    {msg.videoUrl?.includes("youtube") && (
                      <>
                        <span style={{ display:"flex", alignItems:"center", gap:4, padding:"0 10px", borderRadius:8, fontSize:11, fontWeight:600, background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", whiteSpace:"nowrap" }}>YouTube</span>
                        <span style={{ display:"flex", alignItems:"center", padding:"0 10px", borderRadius:8, fontSize:11, fontWeight:600, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0" }}>✓ Verified</span>
                      </>
                    )}
                  </div>
                </div>
                {hasV && (
                  <>
                    <div style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <label style={{...lbl, marginBottom:0}}>Video Preview</label>
                        <div style={{ display:"flex", gap:6 }}>
                          <button style={{ padding:"5px 10px", fontSize:11.5, border:"1px solid #e6e3dd", borderRadius:6, background:"white", cursor:"pointer", color:"#5c5850", fontWeight:500 }}>Import Metadata</button>
                          <button style={{ padding:"5px 10px", fontSize:11.5, border:"1px solid #e6e3dd", borderRadius:6, background:"white", cursor:"pointer", color:"#5c5850", fontWeight:500 }}>Open ↗</button>
                        </div>
                      </div>
                      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", borderRadius:10, aspectRatio:"16/9", maxHeight:320, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                        <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.85)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="#1a1916"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <label style={lbl}>Video Description</label>
                      <textarea value={msg.videoDesc||""} onChange={e=>u("videoDesc",e.target.value)} placeholder="Video description..." style={{...inp, minHeight:80, resize:"vertical"}}/>
                    </div>
                  </>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                  <div><label style={lbl}>Duration</label><input value={msg.duration} onChange={e=>u("duration",e.target.value)} placeholder="e.g. 45:32" style={inp}/></div>
                  <div><label style={lbl}>Audio URL</label><input value={msg.audioUrl||""} onChange={e=>u("audioUrl",e.target.value)} placeholder="Optional MP3 / podcast link" style={inp}/></div>
                </div>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <label style={{...lbl, marginBottom:0}}>Transcript</label>
                    <div style={{ display:"flex", gap:4 }}>
                      <button style={{ padding:"5px 10px", fontSize:11, border:"1px solid #e6e3dd", borderRadius:6, background:"white", cursor:"pointer", color:"#5c5850" }}>↑ Import / Generate</button>
                      <button style={{ padding:"5px 10px", fontSize:11, border:"1px solid #e6e3dd", borderRadius:6, background:"white", cursor:"pointer", color:"#5c5850" }}>↓ Download</button>
                    </div>
                  </div>
                  <div style={{ display:"flex", marginBottom:8 }}>
                    <button style={{ padding:"5px 14px", fontSize:12, fontWeight:500, border:"1px solid #1a1916", borderRadius:"6px 0 0 6px", cursor:"pointer", background:"#1a1916", color:"white" }}>Raw Transcript</button>
                    <button style={{ padding:"5px 14px", fontSize:12, fontWeight:500, border:"1px solid #e6e3dd", borderLeft:"none", borderRadius:"0 6px 6px 0", cursor:"pointer", background:"white", color:"#5c5850" }}>Synced Transcript</button>
                  </div>
                  <textarea value={msg.transcript} onChange={e=>u("transcript",e.target.value)} placeholder="Paste or import transcript text..." style={{...inp, fontFamily:"'SF Mono','Fira Code',monospace", fontSize:12, minHeight:180, background:"#f7f6f3"}}/>
                </div>
              </div>
            </div>
          )}

          {/* ════ BIBLE STUDY TAB ════ */}
          {tab === "study" && (
            <div style={{ animation:"fadeIn 0.15s ease" }}>
              {hasS ? (
                <div style={{ border:"1px solid #e6e3dd", borderRadius:12, background:"white", padding:20 }}>
                  {/* Section tabs */}
                  <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
                    {msg.studySections.map((sec, i) => (
                      <button key={i} onClick={()=>setActiveSection(i)} style={{
                        padding:"7px 16px", borderRadius:20, border:"none",
                        background: activeSection===i?"#7c3aed":"white",
                        color: activeSection===i?"white":"#5c5850",
                        fontSize:13, fontWeight:500, cursor:"pointer",
                        boxShadow: activeSection===i?"none":"inset 0 0 0 1px #e6e3dd",
                        transition:"all 0.15s"
                      }}>{sec.name}</button>
                    ))}
                    <button onClick={()=>{const n=prompt("Section name:","Discussion Notes");if(n)addSection(n);}} style={{ width:32, height:32, borderRadius:"50%", border:"1px dashed #ddd6fe", background:"#f5f3ff", color:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, fontWeight:300 }}>+</button>
                  </div>
                  {/* Active section */}
                  {msg.studySections[activeSection] && (
                    <>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <label style={{...lbl, marginBottom:0, fontSize:13}}>{msg.studySections[activeSection].name}</label>
                        <div style={{ display:"flex", gap:4 }}>
                          <button style={{ padding:"5px 10px", fontSize:11, border:"1px solid #e6e3dd", borderRadius:6, background:"white", cursor:"pointer", color:"#5c5850" }}>↑ Import .DOCX</button>
                          <button onClick={()=>removeSection(activeSection)} style={{ padding:"5px 10px", fontSize:11, border:"1px solid #fecaca", borderRadius:6, background:"#fef2f2", cursor:"pointer", color:"#dc2626", display:"flex", alignItems:"center", gap:3 }}>{I.trash} Remove</button>
                        </div>
                      </div>
                      <div style={{ border:"1px solid #e6e3dd", borderRadius:10, overflow:"hidden" }}>
                        <div style={{ padding:"8px 10px", borderBottom:"1px solid #f0ede8", display:"flex", gap:1, background:"#fafaf8" }}>
                          {["B","I","U","H1","H2","•","1.","🔗","❝","📷"].map(b => (
                            <button key={b} style={{ width:30, height:28, border:"none", borderRadius:4, background:"transparent", cursor:"pointer", fontSize:12, fontWeight:b==="B"?700:400, fontStyle:b==="I"?"italic":"normal", color:"#5c5850", display:"flex", alignItems:"center", justifyContent:"center" }}>{b}</button>
                          ))}
                        </div>
                        <textarea value={msg.studySections[activeSection].content} onChange={e=>updateSection(activeSection,e.target.value)} placeholder="Start writing study content..." style={{ width:"100%", minHeight:300, padding:16, border:"none", outline:"none", fontSize:14, lineHeight:1.7, resize:"vertical", fontFamily:"inherit" }}/>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ border:"1px solid #e6e3dd", borderRadius:12, background:"white", padding:"48px 24px", textAlign:"center" }}>
                  <div style={{ width:56, height:56, margin:"0 auto 14px", borderRadius:"50%", background:"#f5f3ff", color:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.book(26)}</div>
                  <h3 style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>No Bible Study Material</h3>
                  <p style={{ fontSize:13, color:"#9c978d", marginBottom:20, maxWidth:340, margin:"0 auto 20px" }}>Add study sections like Questions, Answers, or Discussion Notes for this message.</p>
                  <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                    <button onClick={()=>{addSection("Questions");setTimeout(()=>addSection("Answers"),0);}} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 20px", border:"1px solid #ddd6fe", borderRadius:8, background:"#f5f3ff", fontSize:13, fontWeight:500, cursor:"pointer", color:"#7c3aed", transition:"all 0.15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.background="#ede9fe";e.currentTarget.style.borderColor="#c4b5fd";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="#f5f3ff";e.currentTarget.style.borderColor="#ddd6fe";}}>
                      {I.plus(13)} Add Questions & Answers
                    </button>
                    <button onClick={()=>{const n=prompt("Section name:");if(n)addSection(n);}} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 20px", border:"1px solid #e6e3dd", borderRadius:8, background:"white", fontSize:13, fontWeight:500, cursor:"pointer", color:"#5c5850", transition:"all 0.15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#c4b5fd";e.currentTarget.style.color="#7c3aed";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e6e3dd";e.currentTarget.style.color="#5c5850";}}>
                      {I.plus(13)} Custom Section
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPublish && <PublishDialog msg={msg} onClose={()=>setShowPublish(false)} vP={vP} setVP={setVP} sP={sP} setSP={setSP} onPublish={handlePublish}/>}
    </div>
  );
}

/* ── APP ── */
export default function App() {
  const [view, setView] = useState("list");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [editMsg, setEditMsg] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [initTab, setInitTab] = useState("details");

  const openEditor = (msg, tab="details") => { setEditMsg(msg); setIsNew(false); setInitTab(tab); setView("editor"); };
  const createNew = () => {
    setEditMsg({ id:Date.now(), title:"", passage:"", speaker:"", series:"", date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), status:"Draft", vStatus:"none", sStatus:"none", duration:"", videoUrl:"", videoDesc:"", audioUrl:"", transcript:"", studySections:[], description:"" });
    setIsNew(true); setInitTab("details"); setView("editor");
  };
  const saveMsg = (msg) => {
    setMessages(prev => { const exists = prev.find(m=>m.id===msg.id); return exists ? prev.map(m=>m.id===msg.id?msg:m) : [msg,...prev]; });
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans',system-ui,sans-serif", background:"#f7f6f3", WebkitFontSmoothing:"antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:translateY(0);}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}
        input:focus,textarea:focus{border-color:#2563eb !important;box-shadow:0 0 0 2px rgba(37,99,235,0.08);}
      `}</style>
      <nav style={{ width:210, background:"white", borderRight:"1px solid #e6e3dd", padding:"20px 10px", flexShrink:0 }}>
        <div style={{ fontWeight:700, fontSize:14, padding:"4px 12px" }}>LA UBF</div>
        <div style={{ fontSize:11, color:"#9c978d", padding:"0 12px", marginBottom:24 }}>Church Settings</div>
        <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"#9c978d", padding:"10px 12px 4px", fontWeight:600 }}>Contents</div>
        {["Messages","Events","Media"].map((n,i) => (
          <div key={n} onClick={()=>{if(i===0)setView("list");}} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:6, fontSize:13, color:i===0?"white":"#5c5850", background:i===0?"#1a1916":"transparent", cursor:"pointer", marginBottom:2 }}>{n}</div>
        ))}
      </nav>
      <div style={{ flex:1, minWidth:0, overflow:"auto" }}>
        {view==="list" && <ListView messages={messages} onOpen={openEditor} onNew={createNew}/>}
        {view==="editor" && editMsg && <TabbedEditor message={editMsg} isNew={isNew} initialTab={initTab} onBack={()=>setView("list")} onSave={saveMsg}/>}
      </div>
    </div>
  );
}

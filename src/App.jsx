import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyDNgGC-3qksHbOWsKcEh50_5ZE6wH3n8aQ",
  authDomain: "dnd-tools-1dd87.firebaseapp.com",
  projectId: "dnd-tools-1dd87",
  storageBucket: "dnd-tools-1dd87.firebasestorage.app",
  messagingSenderId: "866582352851",
  appId: "1:866582352851:web:269ec8b40fc5764425d526"
});
const db = getFirestore(firebaseApp);

function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function formatDate(ts) { return new Date(ts).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }); }

// ── Rich Text Editor ─────────────────────────────────────────
const FONT_COLORS = [
  { label: "Standard",  value: null,      swatch: "#4a3058" },
  { label: "Lila",      value: "#7850a0", swatch: "#7850a0" },
  { label: "Hellila",   value: "#c094c8", swatch: "#c094c8" },
  { label: "Gold",      value: "#b8860b", swatch: "#b8860b" },
  { label: "Elfenbein", value: "#8b7355", swatch: "#8b7355" },
  { label: "Rot",       value: "#c06080", swatch: "#c06080" },
  { label: "Blau",      value: "#5878b0", swatch: "#5878b0" },
  { label: "Grün",      value: "#5a8a68", swatch: "#5a8a68" },
  { label: "Grau",      value: "#8a7a90", swatch: "#8a7a90" },
];

function RichEditor({ value, onChange, placeholder, rows = 5 }) {
  const ref = useRef(null);
  const isInternalChange = useRef(false);
  const [bubble, setBubble] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && !isInternalChange.current) {
      ref.current.innerHTML = value || "";
    }
    isInternalChange.current = false;
  }, [value]);

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setBubble(null);
        setShowColorPicker(false);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!ref.current || !ref.current.contains(range.commonAncestorContainer)) {
        setBubble(null);
        setShowColorPicker(false);
        return;
      }
      const rect = range.getBoundingClientRect();
      const wrapRect = wrapRef.current.getBoundingClientRect();
      setBubble({
        x: rect.left - wrapRect.left + rect.width / 2,
        y: rect.top - wrapRect.top,
      });
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const handleInput = () => {
    isInternalChange.current = true;
    onChange(ref.current.innerHTML);
  };

  const exec = (cmd, val = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current.innerHTML);
  };

  const applyColor = (color) => {
    ref.current?.focus();
    document.execCommand("foreColor", false, color || "#4a3058");
    onChange(ref.current.innerHTML);
    setShowColorPicker(false);
  };

  const tools = [
    { label: "B", title: "Fett",         cmd: "bold",               style: { fontWeight: 700 } },
    { label: "I", title: "Kursiv",        cmd: "italic",             style: { fontStyle: "italic" } },
    { label: "U", title: "Unterstrichen", cmd: "underline",          style: { textDecoration: "underline" } },
    { label: "•", title: "Aufzählung",    cmd: "insertUnorderedList",style: {} },
    { label: "⇥", title: "Einrücken",     cmd: "indent",             style: { fontSize: "0.9rem" } },
    { label: "⇤", title: "Ausrücken",     cmd: "outdent",            style: { fontSize: "0.9rem" } },
    { label: "—", title: "Trennlinie",    cmd: null,
      action: () => exec("insertHTML", "<hr style='border:none;border-top:1px solid #e0d0f0;margin:0.5rem 0;'>"),
      style: {} },
  ];

  return (
    <div ref={wrapRef} className="rich-editor-wrap" style={{ position: "relative" }}>
      {bubble && (
        <div
          style={{
            position: "absolute",
            left: bubble.x,
            top: bubble.y,
            transform: "translate(-50%, calc(-100% - 8px))",
            zIndex: 200,
            background: "#fdf8fc",
            border: "1px solid #d8c4e8",
            borderRadius: "10px",
            padding: "0.3rem 0.4rem",
            display: "flex",
            gap: "0.2rem",
            alignItems: "center",
            boxShadow: "0 4px 20px rgba(160,120,200,0.25)",
            flexWrap: "nowrap",
            whiteSpace: "nowrap",
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {tools.map(t => (
            <button key={t.label} title={t.title} className="rich-tool-btn"
              onMouseDown={e => { e.preventDefault(); t.action ? t.action() : exec(t.cmd); }}
              style={t.style}>{t.label}</button>
          ))}
          <div style={{ position: "relative", display: "inline-block" }}>
            <button title="Schriftfarbe" className="rich-tool-btn"
              onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => !v); }}
              style={{ gap: "0.25rem", minWidth: "2.4rem" }}>
              <span style={{ fontSize: "0.75rem" }}>A</span>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg, #c094c8, #b8860b, #c06080)", flexShrink: 0, display: "inline-block" }} />
            </button>
            {showColorPicker && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 4px)", left: "50%",
                transform: "translateX(-50%)", zIndex: 300,
                background: "#fdf8fc", border: "1px solid #e0d0f0", borderRadius: "8px",
                padding: "0.5rem", boxShadow: "0 6px 24px rgba(160,120,200,0.2)",
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.3rem", minWidth: "150px",
              }}>
                {FONT_COLORS.map(c => (
                  <button key={c.label} title={c.label}
                    onMouseDown={e => { e.preventDefault(); applyColor(c.value); }}
                    style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #e0d0f0", borderRadius: "4px", cursor: "pointer", padding: "0.25rem 0.3rem", display: "flex", alignItems: "center", gap: "0.3rem", transition: "all 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#c094c8"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e0d0f0"}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.swatch, flexShrink: 0, border: c.value === null ? "1px solid #c0a8d0" : "none" }} />
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.38rem", letterSpacing: "0.08em", color: c.swatch, whiteSpace: "nowrap", textTransform: "uppercase" }}>{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{
            position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: "5px solid #d8c4e8",
          }} />
        </div>
      )}
      <div ref={ref} className="rich-content" contentEditable suppressContentEditableWarning
        onInput={handleInput} data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.6}rem` }} />
    </div>
  );
}


const REACTIONS = ["✨","💀","😂","❤️","🎲","😱"];
const DEFAULT_PIN = "1234";
const QUEST_STATUSES = [
  { id: "offen",      label: "Offen",       color: "#c094c8" },
  { id: "aktiv",      label: "Aktiv",       color: "#94a8d8" },
  { id: "gelöst",     label: "Gelöst",      color: "#94c8a8" },
  { id: "gescheitert",label: "Gescheitert", color: "#d8a0a0" },
];
const NPC_STATUSES = [
  { id: "lebendig", label: "Lebendig", color: "#94c8a8" },
  { id: "tot",      label: "Tot",      color: "#d8a0a0" },
  { id: "vermisst", label: "Vermisst", color: "#e8c878" },
  { id: "unbekannt",label: "Unbekannt",color: "#c0b8c8" },
];

const NPC_LOCATIONS = [
  { id: "all",       label: "Alle",                  icon: "✦" },
  { id: "karnival",  label: "Witchlight Karnival",   icon: "🎪" },
  { id: "hither",    label: "Hither",                icon: "🌿" },
  { id: "tither",    label: "Tither",                icon: "🍄" },
  { id: "yon",       label: "Yon",                   icon: "🌙" },
  { id: "palast",    label: "Palast der Herzensbegierde", icon: "🏰" },
  { id: "unbekannt", label: "Unbekannt",              icon: "❓" },
];

const NPC_SORT_OPTIONS = [
  { id: "alpha",  label: "A → Z",     icon: "🔤" },
  { id: "alpha-r",label: "Z → A",     icon: "🔤" },
  { id: "status", label: "Status",    icon: "💚" },
  { id: "newest", label: "Neueste",   icon: "🕐" },
  { id: "oldest", label: "Älteste",   icon: "🕐" },
];

const STATUS_ORDER = ["lebendig", "vermisst", "unbekannt", "tot"];

function sortNpcs(npcs, sortBy) {
  const sorted = [...npcs];
  switch (sortBy) {
    case "alpha":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "de"));
    case "alpha-r":
      return sorted.sort((a, b) => b.name.localeCompare(a.name, "de"));
    case "status":
      return sorted.sort((a, b) => {
        const ai = STATUS_ORDER.indexOf(a.status || "unbekannt");
        const bi = STATUS_ORDER.indexOf(b.status || "unbekannt");
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name, "de");
      });
    case "newest":
      return sorted.sort((a, b) => {
        const ta = typeof a.id === "string" ? parseInt(a.id.split("").slice(0, 8).join(""), 36) : 0;
        const tb = typeof b.id === "string" ? parseInt(b.id.split("").slice(0, 8).join(""), 36) : 0;
        return tb - ta;
      });
    case "oldest":
      return sorted.sort((a, b) => {
        const ta = typeof a.id === "string" ? parseInt(a.id.split("").slice(0, 8).join(""), 36) : 0;
        const tb = typeof b.id === "string" ? parseInt(b.id.split("").slice(0, 8).join(""), 36) : 0;
        return ta - tb;
      });
    default:
      return sorted;
  }
}

function qColor(id) { return QUEST_STATUSES.find(s => s.id === id)?.color || "#c0b8c8"; }
function npcColor(id) { return NPC_STATUSES.find(s => s.id === id)?.color || "#c0b8c8"; }

export default function WitchlightChronik() {
  const [tab, setTab] = useState("chronik");
  const [gmMode, setGmMode] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [playerName, setPlayerName] = useState(() => { try { return localStorage.getItem("wtm-player-name") || ""; } catch { return ""; } });
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [recaps, setRecaps] = useState([]);
  const [playerNotes, setPlayerNotes] = useState([]);
  const [quests, setQuests] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [reactions, setReactions] = useState({});
  const [fundstucke, setFundstucke] = useState([]);
  const [gmNotes, setGmNotes] = useState([]);
  const [theories, setTheories] = useState([]);
  const [pcDossiers, setPcDossiers] = useState([]);
  const [worldEntries, setWorldEntries] = useState([]);
  const [quickNotes, setQuickNotes] = useState([]);

  const [expanded, setExpanded] = useState({});
  const [expandedNpc, setExpandedNpc] = useState(null);
  const [npcLocation, setNpcLocation] = useState("all");
  const [npcSearch, setNpcSearch] = useState("");
  const [npcSort, setNpcSort] = useState("alpha");
  const [expandedFund, setExpandedFund] = useState(null);

  // ── Ref for NPC detail scroll ──
  const npcDetailRef = useRef(null);

  // Auto-scroll to NPC detail when one is expanded
  useEffect(() => {
    if (expandedNpc && npcDetailRef.current) {
      // Small delay to let the DOM render
      setTimeout(() => {
        npcDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [expandedNpc]);

  // ── GM forms ──
  const [recapForm, setRecapForm] = useState({ date: "", title: "", text: "" });
  const [editingRecap, setEditingRecap] = useState(null);
  const [snippetForm, setSnippetForm] = useState({ title: "", text: "" });
  const [showSnippetForm, setShowSnippetForm] = useState(false);
  const [npcForm, setNpcForm] = useState({ name: "", faction: "", description: "", imageUrl: "", status: "lebendig", location: "unbekannt", notes: "" });
  const [questForm, setQuestForm] = useState({ title: "", description: "", status: "offen" });
  const [editingNpc, setEditingNpc] = useState(null);
  const [editingQuest, setEditingQuest] = useState(null);
  const [showRecapForm, setShowRecapForm] = useState(false);
  const [showNpcForm, setShowNpcForm] = useState(false);
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [gmNoteForm, setGmNoteForm] = useState({ title: "", text: "", category: "plan" });
  const [showGmNoteForm, setShowGmNoteForm] = useState(false);
  const [editingGmNote, setEditingGmNote] = useState(null);
  const [expandedGmNote, setExpandedGmNote] = useState(null);
  const [gmPlanTab, setGmPlanTab] = useState("dossiers");

  // ── PC Dossier forms ──
  const [dossierForm, setDossierForm] = useState({ name: "", imageUrl: "", backstory: "", threads: "", relationships: "", arc: "" });
  const [showDossierForm, setShowDossierForm] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [expandedDossier, setExpandedDossier] = useState(null);
  const [expandedDossierSection, setExpandedDossierSection] = useState({});

  // ── World Entry forms ──
  const [worldForm, setWorldForm] = useState({ title: "", text: "", type: "ort", imageUrl: "" });
  const [showWorldForm, setShowWorldForm] = useState(false);
  const [editingWorld, setEditingWorld] = useState(null);
  const [expandedWorld, setExpandedWorld] = useState(null);
  const [worldFilter, setWorldFilter] = useState("all");

  // ── Quick Note forms ──
  const [qnForm, setQnForm] = useState({ text: "", tag: "" });
  const [editingQn, setEditingQn] = useState(null);

  // ── Player forms ──
  const [noteForm, setNoteForm] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ speaker: "", text: "" });
  const [editingQuote, setEditingQuote] = useState(null);
  const [editingQuoteText, setEditingQuoteText] = useState("");
  const [playerQuestForm, setPlayerQuestForm] = useState({ title: "", description: "" });
  const [npcImpression, setNpcImpression] = useState({ npcId: null, text: "" });
  const [editingImpression, setEditingImpression] = useState(null);
  const [editingImpressionText, setEditingImpressionText] = useState("");
  const [playerSnippetForm, setPlayerSnippetForm] = useState({ title: "", text: "" });
  const [showPlayerSnippetForm, setShowPlayerSnippetForm] = useState(false);

  // ── Theorien ──
  const [theoryForm, setTheoryForm] = useState({ title: "", text: "", category: "plot" });
  const [showTheoryForm, setShowTheoryForm] = useState(false);
  const [editingTheory, setEditingTheory] = useState(null);

  const THEORY_CATEGORIES = [
    { id: "plot",    label: "Plot-Theorie",   icon: "🔮", color: "#b078d0" },
    { id: "npc",     label: "NPC-Theorie",    icon: "👤", color: "#94a8d8" },
    { id: "ort",     label: "Ort / Geheimnis",icon: "🗝",  color: "#e8c878" },
    { id: "wild",    label: "Wildes Gerücht", icon: "🌪", color: "#d8a0a0" },
  ];
  const THEORY_REACTS = [
    { emoji: "👍", label: "Glaub ich auch" },
    { emoji: "👎", label: "Glaub ich nicht" },
    { emoji: "🤯", label: "Whoa" },
  ];

  // ── Fundstücke ──
  const [fundForm, setFundForm] = useState({ type: "brief", title: "", text: "", imageUrl: "" });
  const [showFundForm, setShowFundForm] = useState(false);

  const FUND_TYPES = [
    { id: "brief",    label: "Brief",     icon: "✉" },
    { id: "tagebuch", label: "Tagebuch",  icon: "📔" },
    { id: "notiz",    label: "Notiz",     icon: "📝" },
    { id: "artefakt", label: "Artefakt",  icon: "🏺" },
    { id: "karte",    label: "Karte",     icon: "🗺" },
    { id: "sonstiges",label: "Sonstiges", icon: "🔮" },
  ];

  const GM_CATEGORIES = [
    { id: "plan",    label: "Planung",   color: "#94a8d8", icon: "📋" },
    { id: "secret",  label: "Geheimnis", color: "#c094c8", icon: "🔐" },
    { id: "npc",     label: "NPC-Info",  color: "#94c8a8", icon: "👤" },
    { id: "world",   label: "Welt",      color: "#e8c878", icon: "🌍" },
    { id: "session", label: "Session",   color: "#d8a0a0", icon: "🎲" },
  ];

  // ── Load all shared data ──
  useEffect(() => {
    (async () => {
      const pairs = [
        ["wtm-s-recaps",      setRecaps,      []],
        ["wtm-s-playernotes", setPlayerNotes, []],
        ["wtm-s-quests",      setQuests,      []],
        ["wtm-s-quotes",      setQuotes,      []],
        ["wtm-s-snippets",    setSnippets,    []],
        ["wtm-s-npcs",        setNpcs,        []],
        ["wtm-s-reactions",   setReactions,   {}],
        ["wtm-s-fundstucke",  setFundstucke,  []],
        ["wtm-s-gmnotes",     setGmNotes,     []],
        ["wtm-s-theories",    setTheories,    []],
        ["wtm-s-pcdossiers",  setPcDossiers,  []],
        ["wtm-s-worldentries",setWorldEntries,[]],
        ["wtm-s-quicknotes",  setQuickNotes,  []],
      ];
      for (const [key, setter, def] of pairs) {
        try {
          const snap = await getDoc(doc(db, "kv", key));
          if (snap.exists()) setter(JSON.parse(snap.data().value));
          else setter(def);
        } catch { setter(def); }
      }
      setLoaded(true);
    })();
  }, []);

  const ss  = async (key, val) => { try { await setDoc(doc(db, "kv", key), { value: JSON.stringify(val) }); } catch(e) { console.error("Save failed", e); } };
  const ur  = (u) => { setRecaps(u);      ss("wtm-s-recaps",      u); };
  const upn = (u) => { setPlayerNotes(u); ss("wtm-s-playernotes", u); };
  const uq  = (u) => { setQuests(u);      ss("wtm-s-quests",      u); };
  const uqt = (u) => { setQuotes(u);      ss("wtm-s-quotes",      u); };
  const usn = (u) => { setSnippets(u);    ss("wtm-s-snippets",    u); };
  const un  = (u) => { setNpcs(u);        ss("wtm-s-npcs",        u); };
  const ureact = (u) => { setReactions(u); ss("wtm-s-reactions",  u); };
  const uf  = (u) => { setFundstucke(u);  ss("wtm-s-fundstucke",  u); };
  const ugn = (u) => { setGmNotes(u);     ss("wtm-s-gmnotes",     u); };
  const uth = (u) => { setTheories(u);    ss("wtm-s-theories",    u); };
  const upd = (u) => { setPcDossiers(u);  ss("wtm-s-pcdossiers",  u); };
  const uwe = (u) => { setWorldEntries(u);ss("wtm-s-worldentries",u); };
  const uqn = (u) => { setQuickNotes(u);  ss("wtm-s-quicknotes",  u); };

  const pin = () => { try { return localStorage.getItem("wtm-gm-pin") || DEFAULT_PIN; } catch { return DEFAULT_PIN; } };
  const tryPin = () => {
    if (pinInput === pin()) { setGmMode(true); setShowPin(false); setPinInput(""); setPinError(false); }
    else { setPinError(true); }
  };
  const saveName = () => {
    if (!nameInput.trim()) return;
    setPlayerName(nameInput.trim());
    try { localStorage.setItem("wtm-player-name", nameInput.trim()); } catch {}
    setShowNamePrompt(false); setNameInput("");
  };

  const react = (recapId, emoji) => {
    const u = { ...reactions, [recapId]: { ...(reactions[recapId] || {}) } };
    u[recapId][emoji] = (u[recapId][emoji] || 0) + 1;
    ureact(u);
  };

  const addRecap = () => {
    if (!recapForm.title.trim() || !recapForm.text.trim()) return;
    if (editingRecap) {
      ur(recaps.map(r => r.id === editingRecap ? { ...r, date: recapForm.date || r.date, title: recapForm.title.trim(), text: recapForm.text } : r));
      setEditingRecap(null);
    } else {
      ur([{ id: makeId(), date: recapForm.date || new Date().toISOString().slice(0,10), title: recapForm.title.trim(), text: recapForm.text, ts: Date.now() }, ...recaps]);
    }
    setRecapForm({ date: "", title: "", text: "" }); setShowRecapForm(false);
  };

  const startEditRecap = (r) => {
    setRecapForm({ date: r.date || "", title: r.title, text: r.text });
    setEditingRecap(r.id); setShowRecapForm(true);
    setExpanded(e => ({ ...e, [r.id]: false }));
  };

  const addSnippet = () => {
    if (!snippetForm.text.trim()) return;
    usn([{ id: makeId(), title: snippetForm.title.trim(), text: snippetForm.text, ts: Date.now(), author: "GM" }, ...snippets]);
    setSnippetForm({ title: "", text: "" }); setShowSnippetForm(false);
  };

  const addPlayerSnippet = () => {
    if (!playerSnippetForm.text.trim() || !playerName) return;
    usn([{ id: makeId(), title: playerSnippetForm.title.trim(), text: playerSnippetForm.text, ts: Date.now(), author: playerName }, ...snippets]);
    setPlayerSnippetForm({ title: "", text: "" }); setShowPlayerSnippetForm(false);
  };

  const saveNpc = () => {
    if (!npcForm.name.trim()) return;
    if (editingNpc) { un(npcs.map(n => n.id === editingNpc ? { ...n, ...npcForm } : n)); }
    else { un([{ id: makeId(), ...npcForm, impressions: [] }, ...npcs]); }
    setNpcForm({ name: "", faction: "", description: "", imageUrl: "", status: "lebendig", location: "unbekannt", notes: "" });
    setEditingNpc(null); setShowNpcForm(false);
  };

  const addImpression = (npcId) => {
    if (!npcImpression.text.trim() || !playerName) return;
    un(npcs.map(n => n.id === npcId ? { ...n, impressions: [...(n.impressions || []), { id: makeId(), text: npcImpression.text.trim(), author: playerName, ts: Date.now() }] } : n));
    setNpcImpression({ npcId: null, text: "" });
  };

  const saveImpression = (npcId, impId) => {
    if (!editingImpressionText.trim()) return;
    un(npcs.map(n => n.id === npcId
      ? { ...n, impressions: (n.impressions || []).map(imp => imp.id === impId ? { ...imp, text: editingImpressionText.trim() } : imp) }
      : n
    ));
    setEditingImpression(null);
    setEditingImpressionText("");
  };

  const saveQuote = (quoteId) => {
    if (!editingQuoteText.trim()) return;
    uqt(quotes.map(q => q.id === quoteId ? { ...q, text: editingQuoteText.trim() } : q));
    setEditingQuote(null);
    setEditingQuoteText("");
  };

  const saveQuest = () => {
    if (!questForm.title.trim()) return;
    if (editingQuest) { uq(quests.map(q => q.id === editingQuest ? { ...q, ...questForm } : q)); }
    else { uq([{ id: makeId(), ...questForm, ts: Date.now(), addedBy: "GM" }, ...quests]); }
    setQuestForm({ title: "", description: "", status: "offen" });
    setEditingQuest(null); setShowQuestForm(false);
  };

  const suggestQuest = () => {
    if (!playerQuestForm.title.trim() || !playerName) return;
    uq([...quests, { id: makeId(), title: playerQuestForm.title.trim(), description: playerQuestForm.description.trim(), status: "offen", ts: Date.now(), addedBy: playerName, suggested: true }]);
    setPlayerQuestForm({ title: "", description: "" });
  };

  const addNote = () => {
    if (!noteForm.trim() || !playerName) return;
    if (editingNote) {
      upn(playerNotes.map(n => n.id === editingNote ? { ...n, text: noteForm } : n));
      setEditingNote(null);
    } else {
      upn([{ id: makeId(), text: noteForm, author: playerName, ts: Date.now() }, ...playerNotes]);
    }
    setNoteForm("");
  };

  const startEditNote = (n) => { setNoteForm(n.text); setEditingNote(n.id); };

  const addQuote = () => {
    if (!quoteForm.text.trim()) return;
    uqt([{ id: makeId(), speaker: quoteForm.speaker.trim() || (playerName || "Unbekannt"), text: quoteForm.text.trim(), ts: Date.now() }, ...quotes]);
    setQuoteForm({ speaker: "", text: "" });
  };

  const addFund = () => {
    if (!fundForm.title.trim()) return;
    uf([{ id: makeId(), ...fundForm, ts: Date.now() }, ...fundstucke]);
    setFundForm({ type: "brief", title: "", text: "", imageUrl: "" });
    setShowFundForm(false);
  };

  const saveGmNote = () => {
    if (!gmNoteForm.title.trim()) return;
    if (editingGmNote) {
      ugn(gmNotes.map(n => n.id === editingGmNote ? { ...n, ...gmNoteForm } : n));
      setEditingGmNote(null);
    } else {
      ugn([{ id: makeId(), ...gmNoteForm, ts: Date.now() }, ...gmNotes]);
    }
    setGmNoteForm({ title: "", text: "", category: "plan" }); setShowGmNoteForm(false);
  };

  const needName = () => { setShowNamePrompt(true); setNameInput(playerName); };

  // ── PC Dossier functions ──
  const saveDossier = () => {
    if (!dossierForm.name.trim()) return;
    if (editingDossier) {
      upd(pcDossiers.map(d => d.id === editingDossier ? { ...d, ...dossierForm } : d));
      setEditingDossier(null);
    } else {
      upd([...pcDossiers, { id: makeId(), ...dossierForm, ts: Date.now() }]);
    }
    setDossierForm({ name: "", imageUrl: "", backstory: "", threads: "", relationships: "", arc: "" });
    setShowDossierForm(false);
  };

  const startEditDossier = (d) => {
    setDossierForm({ name: d.name, imageUrl: d.imageUrl || "", backstory: d.backstory || "", threads: d.threads || "", relationships: d.relationships || "", arc: d.arc || "" });
    setEditingDossier(d.id); setShowDossierForm(true); setExpandedDossier(null);
  };

  // ── World Entry functions ──
  const saveWorldEntry = () => {
    if (!worldForm.title.trim()) return;
    if (editingWorld) {
      uwe(worldEntries.map(w => w.id === editingWorld ? { ...w, ...worldForm } : w));
      setEditingWorld(null);
    } else {
      uwe([{ id: makeId(), ...worldForm, ts: Date.now() }, ...worldEntries]);
    }
    setWorldForm({ title: "", text: "", type: "ort", imageUrl: "" });
    setShowWorldForm(false);
  };

  // ── Quick Note functions ──
  const addQuickNote = () => {
    if (!qnForm.text.trim()) return;
    if (editingQn) {
      uqn(quickNotes.map(n => n.id === editingQn ? { ...n, text: qnForm.text.trim(), tag: qnForm.tag.trim() } : n));
      setEditingQn(null);
    } else {
      uqn([{ id: makeId(), text: qnForm.text.trim(), tag: qnForm.tag.trim(), done: false, ts: Date.now() }, ...quickNotes]);
    }
    setQnForm({ text: "", tag: "" });
  };

  const toggleQuickNote = (id) => {
    uqn(quickNotes.map(n => n.id === id ? { ...n, done: !n.done } : n));
  };

  // ── Theory functions ──
  const addTheory = () => {
    if (!theoryForm.title.trim() || !playerName) return;
    if (editingTheory) {
      uth(theories.map(t => t.id === editingTheory ? { ...t, title: theoryForm.title.trim(), text: theoryForm.text, category: theoryForm.category } : t));
      setEditingTheory(null);
    } else {
      uth([{ id: makeId(), title: theoryForm.title.trim(), text: theoryForm.text, category: theoryForm.category, author: playerName, ts: Date.now(), reacts: {} }, ...theories]);
    }
    setTheoryForm({ title: "", text: "", category: "plot" }); setShowTheoryForm(false);
  };

  const reactTheory = (theoryId, emoji) => {
    uth(theories.map(t => {
      if (t.id !== theoryId) return t;
      const reacts = { ...(t.reacts || {}) };
      const key = `${emoji}`;
      reacts[key] = (reacts[key] || 0) + 1;
      return { ...t, reacts };
    }));
  };

  const tabs = [
    { id: "chronik",    icon: "📖", label: "Chronik" },
    { id: "spieler",    icon: "✦",  label: "Spieler" },
    { id: "quests",     icon: "📜",  label: "Quests" },
    { id: "zitate",     icon: "❝",  label: "Zitate" },
    { id: "geschichten",icon: "🌙",  label: "Geschichten" },
    { id: "npcs",       icon: "👥",  label: "NPCs" },
    { id: "fundstucke", icon: "🔍",  label: "Fundstücke" },
    ...(gmMode ? [{ id: "gmplan", icon: "🔐", label: "GM-Plan" }] : []),
  ];

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#fdf8fc", display: "flex", alignItems: "center", justifyContent: "center", color: "#c094c8", fontFamily: "serif", fontSize: "1.1rem", letterSpacing: "0.1em" }}>
      ✨ lädt...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #faf4fb 0%, #f4eaf8 50%, #ecf0fa 100%)", color: "#3a2838", fontFamily: "'IM Fell English', Georgia, serif", fontSize: "110%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #e0d0e8; }

        .hdr { background: linear-gradient(135deg, #f0e8f8 0%, #e8eef8 100%); border-bottom: 1px solid #e0d0e8; padding: 1rem 1.2rem 0; position: sticky; top: 0; z-index: 30; }
        .hdr-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.7rem; }
        .campaign-name { font-family: 'Playfair Display', serif; font-size: clamp(1rem, 4vw, 1.5rem); font-weight: 700; font-style: italic; color: #7850a0; margin: 0; letter-spacing: 0.02em; }
        .campaign-sub { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.78rem; color: #7a5890; margin: 0.1rem 0 0; }
        .hdr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
        .gm-badge { font-family: 'Cinzel', serif; font-size: 0.45rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 2px; }
        .gm-badge.active { background: #e8d8f8; color: #7850a0; border: 1px solid #c8a8e8; }
        .gm-badge.inactive { background: #f0f0f0; color: #b0a0b8; border: 1px solid #e0d8e8; cursor: pointer; transition: all 0.15s; }
        .gm-badge.inactive:hover { background: #e8d8f8; color: #7850a0; }
        .player-chip { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.1em; text-transform: uppercase; color: #6a4890; cursor: pointer; }
        .player-chip:hover { color: #4a2870; }

        .tab-row { display: flex; gap: 0; overflow-x: auto; scrollbar-width: none; border-top: 1px solid rgba(255,255,255,0.6); }
        .tab-row::-webkit-scrollbar { display: none; }
        .tab-btn { font-family: 'Cinzel', serif; font-size: 0.48rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.55rem 0.8rem; background: none; border: none; cursor: pointer; color: #8a6aaa; white-space: nowrap; transition: all 0.15s; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 0.3rem; }
        .tab-btn.active { color: #7850a0; border-bottom-color: #a078d0; }
        .tab-btn:hover:not(.active) { color: #6a4898; }
        .tab-btn.gm-tab { color: #c094c8; }
        .tab-btn.gm-tab.active { color: #7850a0; border-bottom-color: #c094c8; }
        .tab-icon { font-size: 0.8rem; }

        .page { padding: 1.2rem; max-width: 680px; margin: 0 auto; }

        .card { background: rgba(255,255,255,0.92); border: 1px solid #d8c4e8; border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 0.7rem; box-shadow: 0 2px 12px rgba(160,120,200,0.08); animation: fadeIn 0.2s ease; backdrop-filter: blur(4px); }
        .card:hover { box-shadow: 0 4px 18px rgba(160,120,200,0.12); }
        .card-header { display: flex; align-items: flex-start; gap: 0.7rem; cursor: pointer; }
        .card-info { flex: 1; }
        .card-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: #3a1858; margin: 0 0 0.15rem; line-height: 1.3; }
        .card-meta { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.12em; text-transform: uppercase; color: #7a5890; }
        .card-chevron { color: #d8c8e8; font-size: 0.7rem; flex-shrink: 0; margin-top: 0.3rem; transition: transform 0.2s; }
        .card-chevron.open { transform: rotate(180deg); }
        .card-body { margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid #f0e4f8; }
        .narrative { font-family: 'IM Fell English', serif; font-size: 0.95rem; line-height: 1.85; color: #2a1838; font-style: italic; white-space: pre-wrap; }

        .reactions-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.8rem; align-items: center; }
        .react-btn { background: rgba(240,232,252,0.8); border: 1px solid #e4d4f0; border-radius: 20px; padding: 0.2rem 0.5rem; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.2rem; transition: all 0.15s; }
        .react-btn:hover { background: #e8d8f8; border-color: #c8a8e8; transform: scale(1.05); }
        .react-count { font-family: 'Cinzel', serif; font-size: 0.5rem; color: #5a3890; }
        .react-add-row { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #e8d8f0; }
        .add-react-btn { font-size: 1rem; background: none; border: 1px dashed #e0d0e8; border-radius: 20px; padding: 0.15rem 0.4rem; cursor: pointer; transition: all 0.15s; opacity: 0.6; }
        .add-react-btn:hover { opacity: 1; background: rgba(240,232,252,0.8); transform: scale(1.1); }

        .npc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.8rem; }
        .npc-card { background: rgba(255,255,255,0.8); border: 1px solid #e8d8f0; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 10px rgba(160,120,200,0.08); }
        .npc-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(160,120,200,0.15); }
        .npc-card.selected { border-color: #b078d0; box-shadow: 0 4px 16px rgba(160,120,200,0.25); }
        .npc-img { width: 100%; height: 180px; background: linear-gradient(135deg, #f0e8f8, #e8eef8); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #d0c0e0; overflow: hidden; }
        .npc-img img { width: 100%; height: 100%; object-fit: contain; object-position: center top; }
        .npc-card-body { padding: 0.6rem 0.7rem; }
        .npc-card-name { font-family: 'Cinzel', serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; color: #3a1858; margin: 0 0 0.15rem; }
        .npc-card-faction { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.72rem; color: #6a4888; margin: 0; }
        .npc-status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 0.3rem; }

        .npc-detail { background: rgba(255,255,255,0.9); border: 1px solid #e0d0f0; border-radius: 16px; padding: 1.2rem; margin-bottom: 0.8rem; box-shadow: 0 4px 20px rgba(160,120,200,0.1); scroll-margin-top: 120px; }
        .npc-detail-img { width: 100%; max-height: 280px; object-fit: contain; border-radius: 10px; margin-bottom: 0.8rem; background: linear-gradient(135deg, #f0e8f8, #e8eef8); display: block; }
        .npc-detail-img-placeholder { width: 100%; height: 80px; background: linear-gradient(135deg, #f0e8f8, #e8eef8); border-radius: 10px; margin-bottom: 0.8rem; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #d0c0e0; }
        .npc-detail-name { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: #3a1858; margin: 0 0 0.2rem; }
        .npc-detail-faction { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.85rem; color: #6a4888; margin: 0 0 0.5rem; }
        .npc-desc { font-size: 0.9rem; color: #3a2048; line-height: 1.7; margin-bottom: 0.8rem; }
        .impression-list { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
        .impression { background: rgba(240,232,252,0.5); border: 1px solid #e8d8f0; border-radius: 8px; padding: 0.5rem 0.7rem; font-style: italic; font-size: 0.85rem; color: #3a1848; }
        .impression-author { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.1em; text-transform: uppercase; color: #7a5890; margin-top: 0.2rem; }

        .quest-card { background: rgba(255,255,255,0.75); border: 1px solid #e8d8f0; border-radius: 10px; padding: 0.8rem 1rem; margin-bottom: 0.5rem; display: flex; align-items: flex-start; gap: 0.7rem; box-shadow: 0 2px 8px rgba(160,120,200,0.06); }
        .quest-status { font-family: 'Cinzel', serif; font-size: 0.4rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 3px; border: 1px solid var(--qc); color: var(--qc); flex-shrink: 0; margin-top: 0.15rem; white-space: nowrap; }
        .quest-title { font-family: 'Cinzel', serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; color: #3a1858; margin: 0 0 0.2rem; }
        .quest-desc { font-size: 0.85rem; color: #4a3060; line-height: 1.5; margin: 0; }
        .quest-by { font-family: 'Cinzel', serif; font-size: 0.4rem; letter-spacing: 0.1em; text-transform: uppercase; color: #7a5890; margin-top: 0.3rem; }
        .suggested-badge { font-family: 'Cinzel', serif; font-size: 0.38rem; letter-spacing: 0.1em; text-transform: uppercase; color: #b8a0c8; background: #f4ecfc; border: 1px dashed #d8c8e8; padding: 0.1rem 0.35rem; border-radius: 2px; margin-left: 0.4rem; }

        .quotes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.8rem; }
        .quote-card { background: rgba(255,255,255,0.75); border: 1px solid #e8d8f0; border-radius: 10px; padding: 1rem; box-shadow: 0 2px 10px rgba(160,120,200,0.08); }
        .quote-mark { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #e0d0f0; line-height: 0.5; display: block; margin-bottom: 0.4rem; }
        .quote-text { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.95rem; color: #3a1858; line-height: 1.65; margin: 0 0 0.5rem; }
        .quote-speaker { font-family: 'Cinzel', serif; font-size: 0.45rem; letter-spacing: 0.12em; text-transform: uppercase; color: #7a5890; }
        .quote-actions { display: flex; gap: 0.3rem; float: right; }
        .quote-del { background: none; border: none; color: #e0d0e8; cursor: pointer; font-size: 0.75rem; transition: color 0.15s; padding: 0; line-height: 1; }
        .quote-del:hover { color: #d08090; }
        .quote-edit-btn { background: none; border: none; color: #c8b8d8; cursor: pointer; font-size: 0.7rem; transition: color 0.15s; padding: 0; line-height: 1; font-family: 'Cinzel', serif; letter-spacing: 0.05em; }
        .quote-edit-btn:hover { color: #9070b0; }

        .snippet-card { background: rgba(255,255,255,0.75); border: 1px solid #e8d8f0; border-radius: 12px; padding: 1.2rem 1.4rem; margin-bottom: 0.8rem; box-shadow: 0 2px 12px rgba(160,120,200,0.08); }
        .snippet-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 700; font-style: italic; color: #3a1858; margin: 0 0 0.3rem; }
        .snippet-author { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.1em; text-transform: uppercase; color: #7a5890; margin: 0 0 0.5rem; }
        .snippet-text { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.92rem; line-height: 1.9; color: #2a1838; }
        .snippet-meta { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.12em; text-transform: uppercase; color: #7a5890; margin-top: 0.7rem; }

        .pnote-card { background: rgba(255,255,255,0.7); border: 1px solid #e0d4ec; border-left: 3px solid #c094c8; border-radius: 0 10px 10px 0; padding: 0.8rem 1rem; margin-bottom: 0.5rem; }
        .pnote-author { font-family: 'Cinzel', serif; font-size: 0.48rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #c094c8; margin: 0 0 0.3rem; }
        .pnote-text { font-size: 0.92rem; color: #3a2048; line-height: 1.6; margin: 0; }
        .pnote-date { font-family: 'Cinzel', serif; font-size: 0.4rem; letter-spacing: 0.1em; color: #7a5890; margin-top: 0.25rem; }

        /* ── Theorien ── */
        .theory-section { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e8d8f0; }
        .theory-card { background: rgba(255,255,255,0.75); border: 1px solid #e8d8f0; border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 0.7rem; box-shadow: 0 2px 10px rgba(160,120,200,0.08); transition: box-shadow 0.15s; }
        .theory-card:hover { box-shadow: 0 4px 16px rgba(160,120,200,0.12); }
        .theory-cat-badge { font-family: 'Cinzel', serif; font-size: 0.38rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 3px; border: 1px solid; display: inline-flex; align-items: center; gap: 0.2rem; }
        .theory-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 700; font-style: italic; color: #3a1858; margin: 0.4rem 0 0.2rem; line-height: 1.3; }
        .theory-text { font-family: 'IM Fell English', serif; font-size: 0.9rem; color: #3a2048; line-height: 1.7; margin: 0 0 0.5rem; font-style: italic; }
        .theory-author { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.1em; text-transform: uppercase; color: #7a5890; }
        .theory-react-row { display: flex; gap: 0.4rem; margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px dashed #f0e4f8; align-items: center; flex-wrap: wrap; }
        .theory-react-btn { background: rgba(240,232,252,0.6); border: 1px solid #e4d4f0; border-radius: 20px; padding: 0.25rem 0.55rem; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem; transition: all 0.15s; }
        .theory-react-btn:hover { background: #e8d8f8; border-color: #c8a8e8; transform: scale(1.05); }
        .theory-react-count { font-family: 'Cinzel', serif; font-size: 0.48rem; color: #5a3890; min-width: 0.6rem; text-align: center; }
        .theory-cat-picker { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.6rem; }
        .theory-cat-opt { font-family: 'Cinzel', serif; font-size: 0.45rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.3rem 0.6rem; border: 1px solid #e0d0f0; border-radius: 20px; cursor: pointer; color: #b090c0; background: rgba(255,255,255,0.8); transition: all 0.12s; display: flex; align-items: center; gap: 0.2rem; }
        .theory-cat-opt.selected { border-color: #c094c8; color: #7850a0; background: #f0e8fc; }

        .form-panel { background: rgba(248,240,252,0.9); border: 1px solid #e0d0f0; border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 1rem; }
        .form-title { font-family: 'Cinzel', serif; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #5a3890; margin: 0 0 0.8rem; }
        .f-group { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.6rem; }
        .f-label { font-family: 'Cinzel', serif; font-size: 0.48rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #6a4890; }
        .f-input { background: rgba(255,255,255,0.9); border: 1px solid #e0d0f0; color: #3a2838; font-family: 'IM Fell English', serif; font-size: 0.95rem; padding: 0.5rem 0.7rem; outline: none; border-radius: 8px; width: 100%; transition: border-color 0.15s; }
        .f-input:focus { border-color: #c094c8; }
        .f-input::placeholder { color: #d8c8e0; }
        .f-select { background: rgba(255,255,255,0.9); border: 1px solid #e0d0f0; color: #5a4068; font-family: 'Cinzel', serif; font-size: 0.6rem; padding: 0.5rem 0.7rem; outline: none; border-radius: 8px; width: 100%; cursor: pointer; }
        .f-row { display: grid; grid-template-columns: 1fr 2fr; gap: 0.6rem; }
        .f-actions { display: flex; gap: 0.5rem; margin-top: 0.6rem; }

        .btn-primary { font-family: 'Cinzel', serif; font-size: 0.55rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #fff; background: linear-gradient(135deg, #b078d0, #9878c8); border: none; padding: 0.5rem 1.2rem; cursor: pointer; border-radius: 20px; transition: all 0.15s; box-shadow: 0 2px 10px rgba(160,120,200,0.25); }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.35; transform: none; }
        .btn-secondary { font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 0.12em; text-transform: uppercase; color: #b090c0; background: rgba(240,232,252,0.8); border: 1px solid #e0d0f0; padding: 0.5rem 1rem; cursor: pointer; border-radius: 20px; transition: all 0.15s; }
        .btn-secondary:hover { background: #ece0f8; }
        .btn-add { font-family: 'Cinzel', serif; font-size: 0.52rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #9070b0; background: rgba(240,232,252,0.7); border: 1px dashed #c8a8e8; padding: 0.5rem 1rem; cursor: pointer; border-radius: 20px; transition: all 0.15s; }
        .btn-add:hover { background: rgba(232,216,248,0.9); border-style: solid; }
        .btn-danger { background: none; border: none; color: #d0a8b8; cursor: pointer; font-size: 0.8rem; transition: color 0.15s; padding: 0.1rem; }
        .btn-danger:hover { color: #c06080; }
        .section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.4rem; }
        .section-title { font-family: 'Cinzel', serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #5a3890; margin: 0; }
        .card-act-edit { font-family: 'Cinzel', serif; font-size: 0.55rem; background: rgba(240,232,252,0.6); border: none; color: #9878b8; cursor: pointer; padding: 0.2rem 0.5rem; border-radius: 4px; transition: all 0.15s; flex-shrink: 0; }
        .card-act-edit:hover { background: #e8d8f8; color: #7850a0; }

        /* ── Rich Editor ── */
        .rich-editor-wrap { border: 1px solid #e0d0f0; border-radius: 8px; overflow: visible; background: rgba(255,255,255,0.9); transition: border-color 0.15s; }
        .rich-editor-wrap:focus-within { border-color: #c094c8; }
        .rich-toolbar { display: none; }
        .rich-tool-btn { font-family: 'Cinzel', serif; font-size: 0.7rem; min-width: 1.8rem; height: 1.8rem; background: rgba(255,255,255,0.8); border: 1px solid #e0d0f0; color: #7850a0; cursor: pointer; border-radius: 4px; transition: all 0.12s; display: flex; align-items: center; justify-content: center; padding: 0 0.3rem; }
        .rich-tool-btn:hover { background: #e8d8f8; border-color: #c094c8; }
        .rich-tool-btn:active { transform: scale(0.92); background: #d8c8f0; }
        .rich-content { padding: 0.6rem 0.8rem; font-family: 'IM Fell English', serif; font-size: 0.95rem; color: #3a2838; line-height: 1.85; outline: none; }
        .rich-content:empty:before { content: attr(data-placeholder); color: #d8c8e0; font-style: italic; pointer-events: none; }
        .rich-content ul { margin: 0.3rem 0 0.3rem 1.2rem; padding: 0; }
        .rich-content ul ul { margin: 0.15rem 0 0.15rem 1.4rem; }
        .rich-content ul ul ul { margin: 0.1rem 0 0.1rem 1.4rem; }
        .rich-content li { margin-bottom: 0.2rem; }
        .rich-content b, .rich-content strong { color: #5a3878; }
        .rich-content em, .rich-content i { color: #7858a0; }
        .rich-content hr { border: none; border-top: 1px solid #e0d0f0; margin: 0.5rem 0; }
        .narrative ul { margin: 0.3rem 0 0.3rem 1.2rem; padding: 0; }
        .narrative ul ul { margin: 0.15rem 0 0.15rem 1.4rem; }
        .narrative li { margin-bottom: 0.2rem; }
        .narrative b, .narrative strong { color: #5a3878; }
        .narrative em, .narrative i { font-style: italic; color: #7858a0; }

        /* ── NPC location tabs + search + sort ── */
        .npc-loc-tabs { display: flex; gap: 0; overflow-x: auto; scrollbar-width: none; margin-bottom: 0.8rem; background: rgba(248,240,252,0.6); border: 1px solid #e8d8f0; border-radius: 10px; padding: 0.2rem; flex-wrap: nowrap; }
        .npc-loc-tabs::-webkit-scrollbar { display: none; }
        .npc-loc-tab { font-family: 'Cinzel', serif; font-size: 0.42rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.4rem 0.7rem; background: none; border: none; cursor: pointer; color: #8a6aaa; white-space: nowrap; border-radius: 7px; transition: all 0.15s; display: flex; align-items: center; gap: 0.25rem; }
        .npc-loc-tab.active { background: rgba(255,255,255,0.95); color: #5a3890; box-shadow: 0 1px 6px rgba(160,120,200,0.15); }
        .npc-loc-tab:hover:not(.active) { color: #5a3890; background: rgba(255,255,255,0.5); }
        .npc-controls-row { display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.8rem; flex-wrap: wrap; }
        .npc-search-wrap { position: relative; flex: 1; min-width: 160px; }
        .npc-search-input { width: 100%; background: rgba(255,255,255,0.9); border: 1px solid #e0d0f0; border-radius: 20px; padding: 0.5rem 0.8rem 0.5rem 2rem; font-family: 'IM Fell English', serif; font-size: 0.9rem; color: #3a1858; outline: none; transition: border-color 0.15s; }
        .npc-search-input:focus { border-color: #c094c8; }
        .npc-search-input::placeholder { color: #c0a8d0; font-style: italic; }
        .npc-search-icon { position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); color: #c0a8d0; font-size: 0.85rem; pointer-events: none; }
        .npc-sort-wrap { display: flex; gap: 0; background: rgba(248,240,252,0.6); border: 1px solid #e8d8f0; border-radius: 10px; padding: 0.15rem; flex-shrink: 0; }
        .npc-sort-btn { font-family: 'Cinzel', serif; font-size: 0.4rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.35rem 0.55rem; background: none; border: none; cursor: pointer; color: #8a6aaa; white-space: nowrap; border-radius: 7px; transition: all 0.15s; display: flex; align-items: center; gap: 0.2rem; }
        .npc-sort-btn.active { background: rgba(255,255,255,0.95); color: #5a3890; box-shadow: 0 1px 6px rgba(160,120,200,0.15); }
        .npc-sort-btn:hover:not(.active) { color: #5a3890; background: rgba(255,255,255,0.5); }

        /* ── Inline edit for impressions ── */
        .impression-edit-row { display: flex; gap: 0.4rem; margin-top: 0.4rem; }
        .impression-edit-input { flex: 1; background: rgba(255,255,255,0.9); border: 1px solid #c094c8; border-radius: 6px; padding: 0.3rem 0.5rem; font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.85rem; color: #3a1848; outline: none; }
        .btn-tiny { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.25rem 0.5rem; border-radius: 12px; border: 1px solid; cursor: pointer; transition: all 0.12s; white-space: nowrap; }
        .btn-tiny-primary { color: #fff; background: #b078d0; border-color: #b078d0; }
        .btn-tiny-primary:hover { background: #9858c0; }
        .btn-tiny-secondary { color: #b090c0; background: rgba(240,232,252,0.8); border-color: #e0d0f0; }
        .btn-tiny-secondary:hover { background: #ece0f8; }

        /* ── Inline edit for quotes ── */
        .quote-edit-input { width: 100%; background: rgba(255,255,255,0.9); border: 1px solid #c094c8; border-radius: 6px; padding: 0.4rem 0.5rem; font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.92rem; color: #3a1858; outline: none; margin-bottom: 0.4rem; resize: vertical; min-height: 3rem; }

        .gm-note-card { background: rgba(255,248,255,0.9); border: 1px solid #e0d0f0; border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 0.7rem; box-shadow: 0 2px 12px rgba(160,120,200,0.08); }
        .gm-note-card:hover { box-shadow: 0 4px 18px rgba(160,120,200,0.12); }
        .gm-cat-badge { font-family: 'Cinzel', serif; font-size: 0.38rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 3px; border: 1px solid; display: inline-flex; align-items: center; gap: 0.2rem; }
        .cat-picker { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.6rem; }
        .cat-opt { font-family: 'Cinzel', serif; font-size: 0.45rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.3rem 0.6rem; border: 1px solid #e0d0f0; border-radius: 20px; cursor: pointer; color: #b090c0; background: rgba(255,255,255,0.8); transition: all 0.12s; display: flex; align-items: center; gap: 0.2rem; }
        .cat-opt.selected { border-color: #c094c8; color: #7850a0; background: #f0e8fc; }

        /* ── Overlays ── */
        .overlay { position: fixed; inset: 0; background: rgba(60,30,80,0.4); z-index: 50; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
        .pin-box { background: #fdf8fc; border: 1px solid #e0d0f0; border-radius: 20px; padding: 2rem; width: 280px; text-align: center; box-shadow: 0 8px 40px rgba(160,120,200,0.2); }
        .pin-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; font-style: italic; color: #7850a0; margin: 0 0 0.4rem; }
        .pin-sub { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.82rem; color: #c0a8d0; margin: 0 0 1rem; }
        .pin-input { background: rgba(240,232,252,0.6); border: 1px solid #d8c8e8; border-radius: 10px; color: #3a2838; font-family: 'Cinzel', serif; font-size: 1.5rem; font-weight: 700; letter-spacing: 0.3em; text-align: center; padding: 0.7rem; outline: none; width: 100%; margin-bottom: 0.8rem; transition: border-color 0.15s; }
        .pin-input:focus { border-color: #b078d0; }
        .pin-input.error { border-color: #d08090; background: rgba(252,240,244,0.8); }
        .pin-error { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.8rem; color: #c06080; margin: 0 0 0.6rem; }
        .pin-actions { display: flex; gap: 0.5rem; justify-content: center; }
        .name-box { background: rgba(248,240,252,0.95); border: 1px solid #e0d0f0; border-radius: 16px; padding: 1.5rem; width: 300px; text-align: center; box-shadow: 0 8px 30px rgba(160,120,200,0.15); }
        .name-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; font-style: italic; color: #7850a0; margin: 0 0 0.3rem; }
        .name-sub { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.82rem; color: #c0a8d0; margin: 0 0 1rem; }

        /* ── Fundstücke ── */
        .fund-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.8rem; }
        .fund-card { background: rgba(255,255,255,0.8); border: 1px solid #e8d8f0; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 10px rgba(160,120,200,0.08); }
        .fund-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(160,120,200,0.15); }
        .fund-card-top { padding: 0.9rem 0.9rem 0.4rem; display: flex; align-items: flex-start; gap: 0.5rem; }
        .fund-icon { font-size: 1.4rem; flex-shrink: 0; line-height: 1; }
        .fund-card-name { font-family: 'Cinzel', serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.06em; color: #3a1858; line-height: 1.3; }
        .fund-type-label { font-family: 'Cinzel', serif; font-size: 0.4rem; letter-spacing: 0.1em; text-transform: uppercase; color: #7a5890; padding: 0 0.9rem 0.5rem; display: block; }
        .fund-preview { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.78rem; color: #5a4878; padding: 0 0.9rem 0.8rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .fund-detail { background: rgba(255,255,255,0.95); border: 1px solid #e0d0f0; border-radius: 16px; padding: 1.2rem 1.4rem; margin-bottom: 0.8rem; box-shadow: 0 4px 20px rgba(160,120,200,0.1); animation: fadeIn 0.2s ease; }
        .fund-detail-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.8rem; gap: 0.5rem; }
        .fund-detail-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; font-style: italic; color: #3a1858; margin: 0; }
        .fund-detail-meta { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.12em; text-transform: uppercase; color: #7a5890; margin-top: 0.2rem; }
        .fund-detail-img { width: 100%; max-height: 220px; object-fit: contain; border-radius: 8px; margin-bottom: 0.8rem; background: #f8f0fc; display: block; }
        .fund-detail-text { font-family: 'IM Fell English', serif; font-style: italic; font-size: 0.95rem; line-height: 1.9; color: #2a1838; white-space: pre-wrap; }
        .fund-type-picker { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.6rem; }
        .fund-type-opt { font-family: 'Cinzel', serif; font-size: 0.48rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.3rem 0.6rem; border: 1px solid #e0d0f0; border-radius: 20px; cursor: pointer; color: #b090c0; background: rgba(255,255,255,0.8); transition: all 0.12s; display: flex; align-items: center; gap: 0.3rem; }
        .fund-type-opt.selected { border-color: #c094c8; color: #7850a0; background: #f0e8fc; }

        .empty { text-align: center; padding: 3rem 1.5rem; font-family: 'IM Fell English', serif; font-style: italic; color: #8a68a8; font-size: 1rem; line-height: 1.8; }

        /* ── GM Plan Sub-tabs ── */
        .gm-sub-tabs { display: flex; gap: 0; overflow-x: auto; scrollbar-width: none; margin-bottom: 1.2rem; background: rgba(248,240,252,0.6); border: 1px solid #e8d8f0; border-radius: 10px; padding: 0.2rem; }
        .gm-sub-tabs::-webkit-scrollbar { display: none; }
        .gm-sub-tab { font-family: 'Cinzel', serif; font-size: 0.45rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.5rem 0.8rem; background: none; border: none; cursor: pointer; color: #8a6aaa; white-space: nowrap; border-radius: 7px; transition: all 0.15s; display: flex; align-items: center; gap: 0.3rem; flex: 1; justify-content: center; }
        .gm-sub-tab.active { background: rgba(255,255,255,0.95); color: #5a3890; box-shadow: 0 1px 6px rgba(160,120,200,0.15); }
        .gm-sub-tab:hover:not(.active) { color: #5a3890; background: rgba(255,255,255,0.5); }
        .gm-sub-count { font-size: 0.38rem; opacity: 0.6; }

        /* ── PC Dossiers ── */
        .dossier-card { background: rgba(255,248,255,0.92); border: 1px solid #e0d0f0; border-radius: 14px; padding: 0; margin-bottom: 0.8rem; box-shadow: 0 2px 12px rgba(160,120,200,0.08); overflow: hidden; transition: box-shadow 0.15s; }
        .dossier-card:hover { box-shadow: 0 4px 18px rgba(160,120,200,0.12); }
        .dossier-header { display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem 1rem; cursor: pointer; }
        .dossier-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #f0e8f8, #e8eef8); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #d0c0e0; flex-shrink: 0; overflow: hidden; border: 2px solid #e8d8f0; }
        .dossier-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .dossier-pc-name { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; color: #3a1858; margin: 0; }
        .dossier-body { border-top: 1px solid #f0e4f8; }
        .dossier-section-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 1rem; background: none; border: none; border-bottom: 1px solid #f8f0fc; cursor: pointer; transition: background 0.12s; }
        .dossier-section-btn:hover { background: rgba(240,232,252,0.5); }
        .dossier-section-btn:last-child { border-bottom: none; }
        .dossier-section-label { font-family: 'Cinzel', serif; font-size: 0.5rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; display: flex; align-items: center; gap: 0.3rem; }
        .dossier-section-chevron { color: #d8c8e8; font-size: 0.6rem; transition: transform 0.2s; }
        .dossier-section-chevron.open { transform: rotate(180deg); }
        .dossier-section-content { padding: 0.6rem 1rem 0.8rem; border-bottom: 1px solid #f8f0fc; }

        /* ── World Entries ── */
        .world-card { background: rgba(255,255,255,0.8); border: 1px solid #e8d8f0; border-radius: 12px; padding: 0.9rem 1rem; margin-bottom: 0.6rem; box-shadow: 0 2px 10px rgba(160,120,200,0.06); cursor: pointer; transition: all 0.15s; }
        .world-card:hover { box-shadow: 0 4px 16px rgba(160,120,200,0.12); transform: translateY(-1px); }
        .world-type-badge { font-family: 'Cinzel', serif; font-size: 0.38rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.12rem 0.4rem; border-radius: 3px; border: 1px solid; display: inline-flex; align-items: center; gap: 0.2rem; }
        .world-detail { background: rgba(255,255,255,0.95); border: 1px solid #e0d0f0; border-radius: 14px; padding: 1.2rem; margin-bottom: 0.8rem; box-shadow: 0 4px 20px rgba(160,120,200,0.1); animation: fadeIn 0.2s ease; }
        .world-filter-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
        .world-filter-btn { font-family: 'Cinzel', serif; font-size: 0.42rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.3rem 0.6rem; border: 1px solid #e0d0f0; border-radius: 20px; cursor: pointer; color: #b090c0; background: rgba(255,255,255,0.8); transition: all 0.12s; display: flex; align-items: center; gap: 0.2rem; }
        .world-filter-btn.active { border-color: #c094c8; color: #7850a0; background: #f0e8fc; }

        /* ── Quick Notes ── */
        .qn-card { display: flex; align-items: flex-start; gap: 0.6rem; background: rgba(255,255,255,0.7); border: 1px solid #e0d4ec; border-radius: 10px; padding: 0.7rem 0.9rem; margin-bottom: 0.4rem; transition: all 0.15s; }
        .qn-card.done { opacity: 0.5; }
        .qn-card.done .qn-text { text-decoration: line-through; }
        .qn-checkbox { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #d8c8e8; background: rgba(255,255,255,0.9); cursor: pointer; flex-shrink: 0; margin-top: 0.1rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; font-size: 0.65rem; color: transparent; }
        .qn-checkbox:hover { border-color: #b078d0; }
        .qn-checkbox.checked { background: linear-gradient(135deg, #b078d0, #9878c8); border-color: #b078d0; color: #fff; }
        .qn-text { font-size: 0.9rem; color: #3a2048; line-height: 1.5; flex: 1; }
        .qn-tag { font-family: 'Cinzel', serif; font-size: 0.38rem; letter-spacing: 0.1em; text-transform: uppercase; color: #b090c0; background: rgba(240,232,252,0.6); border: 1px solid #e8d8f0; padding: 0.1rem 0.35rem; border-radius: 10px; white-space: nowrap; }
        .qn-date { font-family: 'Cinzel', serif; font-size: 0.38rem; letter-spacing: 0.1em; color: #c0a8d0; }
        .qn-input-row { display: flex; gap: 0.5rem; align-items: flex-start; }
        .qn-input-row .f-input { flex: 1; }
        .divider { border: none; border-top: 1px solid #f0e4f8; margin: 0.8rem 0; }
        .tag { font-family: 'Cinzel', serif; font-size: 0.4rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.15rem 0.4rem; border-radius: 3px; border: 1px solid; display: inline-block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* PIN overlay */}
      {showPin && (
        <div className="overlay" onClick={() => { setShowPin(false); setPinInput(""); setPinError(false); }}>
          <div className="pin-box" onClick={e => e.stopPropagation()}>
            <p className="pin-title">✨ GM Modus</p>
            <p className="pin-sub">Bitte gib deine PIN ein</p>
            <input className={`pin-input ${pinError ? "error" : ""}`} type="password" maxLength={8}
              value={pinInput} onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={e => e.key === "Enter" && tryPin()} autoFocus placeholder="••••" />
            {pinError && <p className="pin-error">Falsche PIN. Versuch's nochmal ✦</p>}
            <div className="pin-actions">
              <button className="btn-primary" onClick={tryPin}>Einloggen</button>
              <button className="btn-secondary" onClick={() => { setShowPin(false); setPinInput(""); setPinError(false); }}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Name prompt */}
      {showNamePrompt && (
        <div className="overlay" onClick={() => setShowNamePrompt(false)}>
          <div className="name-box" onClick={e => e.stopPropagation()}>
            <p className="name-title">Wer bist du?</p>
            <p className="name-sub">Gib deinen Charakternamen ein</p>
            <input className="f-input" style={{ marginBottom: "0.8rem", textAlign: "center" }}
              value={nameInput} onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()} placeholder="z.B. Eya" autoFocus />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <button className="btn-primary" onClick={saveName}>Speichern</button>
              <button className="btn-secondary" onClick={() => setShowNamePrompt(false)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="hdr">
        <div className="hdr-top">
          <div>
            <p className="campaign-name">Witchlight M</p>
            <p className="campaign-sub">Kampagnen-Chronik ✦ Gemeinsame Erinnerungen</p>
          </div>
          <div className="hdr-right">
            {gmMode
              ? <span className="gm-badge active" onClick={() => setGmMode(false)}>✦ GM Modus aktiv</span>
              : <span className="gm-badge inactive" onClick={() => setShowPin(true)}>SL einloggen</span>
            }
            <span className="player-chip" onClick={needName}>{playerName ? `✦ ${playerName}` : "Namen eingeben"}</span>
          </div>
        </div>
        <div className="tab-row">
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""} ${t.id === "gmplan" ? "gm-tab" : ""}`} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════ CHRONIK ══════════════════ */}
      {tab === "chronik" && (
        <div className="page">
          <div className="section-hdr">
            <p className="section-title">📖 Chronik</p>
            {gmMode && <button className="btn-add" onClick={() => setShowRecapForm(v => !v)}>+ Neue Zusammenfassung</button>}
          </div>
          {gmMode && showRecapForm && (
            <div className="form-panel">
              <p className="form-title">{editingRecap ? "Recap bearbeiten" : "Sitzungszusammenfassung"}</p>
              <div className="f-row">
                <div className="f-group"><label className="f-label">Datum</label>
                  <input className="f-input" type="date" value={recapForm.date} onChange={e => setRecapForm(f => ({...f, date: e.target.value}))} /></div>
                <div className="f-group"><label className="f-label">Titel</label>
                  <input className="f-input" value={recapForm.title} onChange={e => setRecapForm(f => ({...f, title: e.target.value}))} placeholder="Der vergessene Wald" autoFocus /></div>
              </div>
              <div className="f-group"><label className="f-label">Was ist passiert?</label>
                <RichEditor value={recapForm.text} onChange={v => setRecapForm(f => ({...f, text: v}))} placeholder="Schreib hier deinen Recap..." rows={6} /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={addRecap} disabled={!recapForm.title.trim() || !recapForm.text.trim()}>{editingRecap ? "Änderungen speichern" : "Speichern"}</button>
                <button className="btn-secondary" onClick={() => { setShowRecapForm(false); setEditingRecap(null); setRecapForm({ date: "", title: "", text: "" }); }}>Abbrechen</button>
              </div>
            </div>
          )}
          {recaps.length === 0
            ? <div className="empty">Noch keine Sitzungen aufgezeichnet.<br /><span style={{fontSize:"0.85rem"}}>Der erste Eintrag wartet auf sein Abenteuer. ✨</span></div>
            : recaps.map(r => {
              const isOpen = expanded[r.id];
              const rReacts = reactions[r.id] || {};
              const hasReacts = Object.values(rReacts).some(v => v > 0);
              return (
                <div key={r.id} className="card">
                  <div className="card-header" onClick={() => setExpanded(e => ({...e, [r.id]: !e[r.id]}))}>
                    <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.6rem",fontWeight:700,color:"#ddc8f0",lineHeight:1.4,paddingTop:"0.1rem",flexShrink:0}}>
                      {r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("de-DE", {day:"numeric",month:"short",year:"numeric"}) : formatDate(r.ts)}
                    </span>
                    <div className="card-info">
                      <p className="card-title">{r.title}</p>
                      <p className="card-meta">{formatDate(r.ts)}</p>
                    </div>
                    {gmMode && <button className="btn-danger" onClick={e => { e.stopPropagation(); if(window.confirm("Löschen?")) ur(recaps.filter(x => x.id !== r.id)); }}>✕</button>}
                    {gmMode && <button className="card-act-edit" onClick={e => { e.stopPropagation(); startEditRecap(r); }}>✎</button>}
                    <span className={`card-chevron ${isOpen ? "open" : ""}`}>▼</span>
                  </div>
                  {isOpen && (
                    <div className="card-body">
                      <div className="narrative" dangerouslySetInnerHTML={{ __html: r.text }} />
                      <div className="divider" />
                      {hasReacts && (
                        <div className="reactions-row">
                          {REACTIONS.map(emoji => rReacts[emoji] > 0 && (
                            <div key={emoji} className="react-btn"><span>{emoji}</span><span className="react-count">{rReacts[emoji]}</span></div>
                          ))}
                        </div>
                      )}
                      <div className="react-add-row">
                        <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.42rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#8a68a8",alignSelf:"center"}}>Reagieren:</span>
                        {REACTIONS.map(emoji => <button key={emoji} className="add-react-btn" onClick={() => react(r.id, emoji)}>{emoji}</button>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ══════════════════ SPIELER ══════════════════ */}
      {tab === "spieler" && (
        <div className="page">
          <div className="section-hdr"><p className="section-title">✦ Spielernotizen</p></div>
          {!playerName
            ? <div className="empty">Gib zuerst deinen Charakternamen ein.<br /><button className="btn-add" style={{marginTop:"0.8rem"}} onClick={needName}>Namen eingeben</button></div>
            : (
              <div className="form-panel">
                <p className="form-title">{editingNote ? "Notiz bearbeiten" : `Deine Notiz — ${playerName}`}</p>
                <div className="f-group">
                  <RichEditor value={noteForm} onChange={setNoteForm} placeholder="Was war dein Highlight der Session?" rows={3} />
                </div>
                <div className="f-actions">
                  <button className="btn-primary" onClick={addNote} disabled={!noteForm.trim()}>{editingNote ? "Speichern" : "Notiz posten"}</button>
                  {editingNote && <button className="btn-secondary" onClick={() => { setEditingNote(null); setNoteForm(""); }}>Abbrechen</button>}
                </div>
              </div>
            )}
          {playerNotes.length === 0
            ? <div className="empty" style={{paddingTop:"1rem"}}>Noch keine Spielernotizen.<br /><span style={{fontSize:"0.85rem"}}>Was habt ihr erlebt? ✦</span></div>
            : playerNotes.map(n => (
              <div key={n.id} className="pnote-card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.25rem"}}>
                  <p className="pnote-author">{n.author}</p>
                  {(n.author === playerName || gmMode) && (
                    <div style={{display:"flex",gap:"0.3rem"}}>
                      {n.author === playerName && <button className="card-act-edit" onClick={() => startEditNote(n)}>✎</button>}
                      <button className="btn-danger" onClick={() => upn(playerNotes.filter(x => x.id !== n.id))}>✕</button>
                    </div>
                  )}
                </div>
                <div className="pnote-text narrative" dangerouslySetInnerHTML={{ __html: n.text }} />
                <p className="pnote-date">{formatDate(n.ts)}</p>
              </div>
            ))}

          {/* ── Gerüchte & Theorien ── */}
          <div className="theory-section">
            <div className="section-hdr">
              <p className="section-title">💡 Gerüchte & Theorien</p>
              {playerName && <button className="btn-add" onClick={() => { setShowTheoryForm(v => !v); setEditingTheory(null); setTheoryForm({ title: "", text: "", category: "plot" }); }}>+ Neue Theorie</button>}
            </div>

            {showTheoryForm && playerName && (
              <div className="form-panel">
                <p className="form-title">{editingTheory ? "Theorie bearbeiten" : `Neue Theorie — ${playerName}`}</p>
                <div className="f-group">
                  <label className="f-label">Kategorie</label>
                  <div className="theory-cat-picker">
                    {THEORY_CATEGORIES.map(c => (
                      <span key={c.id} className={`theory-cat-opt ${theoryForm.category === c.id ? "selected" : ""}`}
                        onClick={() => setTheoryForm(f => ({...f, category: c.id}))}>
                        {c.icon} {c.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="f-group"><label className="f-label">These / Gerücht</label>
                  <input className="f-input" value={theoryForm.title} onChange={e => setTheoryForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Kettlesteam weiß mehr als er zugibt..." autoFocus /></div>
                <div className="f-group"><label className="f-label">Begründung (optional)</label>
                  <RichEditor value={theoryForm.text} onChange={v => setTheoryForm(f=>({...f,text:v}))} placeholder="Warum glaubst du das? Was sind die Hinweise?" rows={3} /></div>
                <div className="f-actions">
                  <button className="btn-primary" onClick={addTheory} disabled={!theoryForm.title.trim() || !playerName}>{editingTheory ? "Speichern" : "Theorie posten"}</button>
                  <button className="btn-secondary" onClick={() => { setShowTheoryForm(false); setEditingTheory(null); setTheoryForm({ title: "", text: "", category: "plot" }); }}>Abbrechen</button>
                </div>
              </div>
            )}

            {theories.length === 0
              ? <div className="empty" style={{paddingTop:"1rem",paddingBottom:"1rem"}}>Noch keine Theorien.<br /><span style={{fontSize:"0.85rem"}}>Was glaubt ihr, was hier wirklich vor sich geht? 💡</span></div>
              : theories.map(t => {
                const cat = THEORY_CATEGORIES.find(c => c.id === t.category);
                const canEdit = t.author === playerName;
                const reacts = t.reacts || {};
                return (
                  <div key={t.id} className="theory-card">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <span className="theory-cat-badge" style={{color:cat?.color||"#b078d0",borderColor:cat?.color||"#b078d0"}}>
                        {cat?.icon} {cat?.label}
                      </span>
                      <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
                        {canEdit && (
                          <button className="card-act-edit" onClick={() => {
                            setTheoryForm({ title: t.title, text: t.text || "", category: t.category });
                            setEditingTheory(t.id); setShowTheoryForm(true);
                          }}>✎</button>
                        )}
                        {(canEdit || gmMode) && (
                          <button className="btn-danger" onClick={() => uth(theories.filter(x => x.id !== t.id))}>✕</button>
                        )}
                      </div>
                    </div>
                    <p className="theory-title">{t.title}</p>
                    {t.text && <div className="theory-text" dangerouslySetInnerHTML={{ __html: t.text }} />}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.3rem"}}>
                      <p className="theory-author">— {t.author} · {formatDate(t.ts)}</p>
                    </div>
                    <div className="theory-react-row">
                      {THEORY_REACTS.map(r => {
                        const count = reacts[r.emoji] || 0;
                        return (
                          <button key={r.emoji} className="theory-react-btn" title={r.label}
                            onClick={() => reactTheory(t.id, r.emoji)}>
                            <span>{r.emoji}</span>
                            {count > 0 && <span className="theory-react-count">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ══════════════════ QUESTS ══════════════════ */}
      {tab === "quests" && (
        <div className="page">
          <div className="section-hdr">
            <p className="section-title">📜 Questbuch</p>
            {gmMode && <button className="btn-add" onClick={() => { setShowQuestForm(v => !v); setEditingQuest(null); setQuestForm({title:"",description:"",status:"offen"}); }}>+ Quest hinzufügen</button>}
          </div>
          {gmMode && showQuestForm && (
            <div className="form-panel">
              <p className="form-title">{editingQuest ? "Quest bearbeiten" : "Neue Quest"}</p>
              <div className="f-group"><label className="f-label">Titel</label>
                <input className="f-input" value={questForm.title} onChange={e => setQuestForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Das Mysterium der leeren Seiten" autoFocus /></div>
              <div className="f-group"><label className="f-label">Beschreibung</label>
                <textarea className="f-input" rows={2} value={questForm.description} onChange={e => setQuestForm(f=>({...f,description:e.target.value}))} placeholder="Was wissen die Spieler?" /></div>
              <div className="f-group"><label className="f-label">Status</label>
                <select className="f-select" value={questForm.status} onChange={e => setQuestForm(f=>({...f,status:e.target.value}))}>
                  {QUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="f-actions">
                <button className="btn-primary" onClick={saveQuest} disabled={!questForm.title.trim()}>Speichern</button>
                <button className="btn-secondary" onClick={() => { setShowQuestForm(false); setEditingQuest(null); }}>Abbrechen</button>
              </div>
            </div>
          )}
          {playerName && (
            <div className="form-panel" style={{marginBottom:"1rem"}}>
              <p className="form-title">Quest vorschlagen — {playerName}</p>
              <div className="f-group"><label className="f-label">Idee</label>
                <input className="f-input" value={playerQuestForm.title} onChange={e => setPlayerQuestForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Wir sollten dem Zirkus folgen..." /></div>
              <div className="f-group"><label className="f-label">Warum? (optional)</label>
                <input className="f-input" value={playerQuestForm.description} onChange={e => setPlayerQuestForm(f=>({...f,description:e.target.value}))} placeholder="Kurze Begründung" /></div>
              <button className="btn-primary" onClick={suggestQuest} disabled={!playerQuestForm.title.trim() || !playerName}>Vorschlag einreichen</button>
            </div>
          )}
          {quests.length === 0
            ? <div className="empty">Das Questbuch ist noch leer.<br /><span style={{fontSize:"0.85rem"}}>Abenteuer warten... 📜</span></div>
            : QUEST_STATUSES.map(status => {
              const group = quests.filter(q => q.status === status.id);
              if (!group.length) return null;
              return (
                <div key={status.id} style={{marginBottom:"1.2rem"}}>
                  <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.5rem",letterSpacing:"0.15em",textTransform:"uppercase",color:status.color,marginBottom:"0.5rem"}}>{status.label}</p>
                  {group.map(q => (
                    <div key={q.id} className="quest-card">
                      <span className="quest-status tag" style={{"--qc":qColor(q.status),color:qColor(q.status),borderColor:qColor(q.status)}}>{status.label}</span>
                      <div style={{flex:1}}>
                        <p className="quest-title">{q.title}{q.suggested && <span className="suggested-badge">Vorschlag</span>}</p>
                        {q.description && <p className="quest-desc">{q.description}</p>}
                        <p className="quest-by">von {q.addedBy}</p>
                      </div>
                      {gmMode && (
                        <div style={{display:"flex",gap:"0.3rem",flexShrink:0}}>
                          <button className="btn-secondary" style={{padding:"0.2rem 0.5rem",fontSize:"0.45rem"}} onClick={() => { setQuestForm({title:q.title,description:q.description||"",status:q.status}); setEditingQuest(q.id); setShowQuestForm(true); }}>✎</button>
                          <button className="btn-danger" onClick={() => uq(quests.filter(x => x.id !== q.id))}>✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
      )}

      {/* ══════════════════ ZITATE ══════════════════ */}
      {tab === "zitate" && (
        <div className="page">
          <div className="section-hdr"><p className="section-title">❝ Zitate</p></div>
          <div className="form-panel">
            <p className="form-title">Zitat hinzufügen</p>
            <div className="f-row">
              <div className="f-group"><label className="f-label">Wer?</label>
                <input className="f-input" value={quoteForm.speaker} onChange={e => setQuoteForm(f=>({...f,speaker:e.target.value}))} placeholder={playerName || "Charakter"} /></div>
              <div className="f-group"><label className="f-label">Was wurde gesagt?</label>
                <input className="f-input" value={quoteForm.text} onChange={e => setQuoteForm(f=>({...f,text:e.target.value}))} placeholder="Das unvergessliche Zitat..."
                  onKeyDown={e => e.key === "Enter" && addQuote()} /></div>
            </div>
            <button className="btn-primary" onClick={addQuote} disabled={!quoteForm.text.trim()}>Hinzufügen</button>
          </div>
          {quotes.length === 0
            ? <div className="empty">Noch keine Zitate gesammelt.<br /><span style={{fontSize:"0.85rem"}}>Die erste denkwürdige Aussage wartet. ❝</span></div>
            : <div className="quotes-grid">
              {quotes.map(q => {
                const canEdit = gmMode || q.speaker === playerName;
                const isEditing = editingQuote === q.id;
                return (
                  <div key={q.id} className="quote-card">
                    {canEdit && (
                      <div className="quote-actions">
                        {!isEditing && (
                          <button className="quote-edit-btn" title="Bearbeiten"
                            onClick={() => { setEditingQuote(q.id); setEditingQuoteText(q.text); }}>✎</button>
                        )}
                        <button className="quote-del" title="Löschen"
                          onClick={() => { if(isEditing) { setEditingQuote(null); setEditingQuoteText(""); } uqt(quotes.filter(x => x.id !== q.id)); }}>✕</button>
                      </div>
                    )}
                    <span className="quote-mark">❝</span>
                    {isEditing ? (
                      <>
                        <textarea className="quote-edit-input" value={editingQuoteText}
                          onChange={e => setEditingQuoteText(e.target.value)}
                          onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveQuote(q.id); } if(e.key === "Escape") { setEditingQuote(null); setEditingQuoteText(""); } }}
                          autoFocus />
                        <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.4rem"}}>
                          <button className="btn-tiny btn-tiny-primary" onClick={() => saveQuote(q.id)} disabled={!editingQuoteText.trim()}>✓ Speichern</button>
                          <button className="btn-tiny btn-tiny-secondary" onClick={() => { setEditingQuote(null); setEditingQuoteText(""); }}>Abbrechen</button>
                        </div>
                      </>
                    ) : (
                      <p className="quote-text">{q.text}</p>
                    )}
                    <p className="quote-speaker">— {q.speaker}</p>
                  </div>
                );
              })}
            </div>
          }
        </div>
      )}

      {/* ══════════════════ GESCHICHTEN ══════════════════ */}
      {tab === "geschichten" && (
        <div className="page">
          <div className="section-hdr">
            <p className="section-title">🌙 Geschichten</p>
            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
              {playerName && <button className="btn-add" onClick={() => { setShowPlayerSnippetForm(v => !v); setShowSnippetForm(false); }}>+ Deine Geschichte</button>}
              {gmMode && <button className="btn-add" onClick={() => { setShowSnippetForm(v => !v); setShowPlayerSnippetForm(false); }}>+ GM Snippet</button>}
            </div>
          </div>

          {showPlayerSnippetForm && playerName && (
            <div className="form-panel">
              <p className="form-title">Deine Geschichte — {playerName}</p>
              <div className="f-group"><label className="f-label">Titel (optional)</label>
                <input className="f-input" value={playerSnippetForm.title} onChange={e => setPlayerSnippetForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Eyas Tagebuch" autoFocus /></div>
              <div className="f-group"><label className="f-label">Text</label>
                <RichEditor value={playerSnippetForm.text} onChange={v => setPlayerSnippetForm(f=>({...f,text:v}))} placeholder="Dein Prosa-Snippet, Tagebucheintrag, Gedanke..." rows={6} /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={addPlayerSnippet} disabled={!playerSnippetForm.text.trim()}>Veröffentlichen</button>
                <button className="btn-secondary" onClick={() => setShowPlayerSnippetForm(false)}>Abbrechen</button>
              </div>
            </div>
          )}

          {gmMode && showSnippetForm && (
            <div className="form-panel">
              <p className="form-title">Neues GM Story-Snippet</p>
              <div className="f-group"><label className="f-label">Titel (optional)</label>
                <input className="f-input" value={snippetForm.title} onChange={e => setSnippetForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Im Mondlicht" autoFocus /></div>
              <div className="f-group"><label className="f-label">Text</label>
                <RichEditor value={snippetForm.text} onChange={v => setSnippetForm(f=>({...f,text:v}))} placeholder="Dein Prosa-Snippet, Szene, Gedanke..." rows={7} /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={addSnippet} disabled={!snippetForm.text.trim()}>Posten</button>
                <button className="btn-secondary" onClick={() => setShowSnippetForm(false)}>Abbrechen</button>
              </div>
            </div>
          )}

          {snippets.length === 0
            ? <div className="empty">Noch keine Geschichten geschrieben.<br /><span style={{fontSize:"0.85rem"}}>Die Feder wartet... 🌙</span></div>
            : snippets.map(s => (
              <div key={s.id} className="snippet-card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.3rem"}}>
                  <div>
                    {s.title && <p className="snippet-title">{s.title}</p>}
                    <p className="snippet-author">{s.author || "GM"}</p>
                  </div>
                  {(gmMode || s.author === playerName) && <button className="btn-danger" onClick={() => usn(snippets.filter(x => x.id !== s.id))}>✕</button>}
                </div>
                <div className="snippet-text narrative" dangerouslySetInnerHTML={{ __html: s.text }} />
                <p className="snippet-meta">{formatDate(s.ts)}</p>
              </div>
            ))}
        </div>
      )}

      {/* ══════════════════ NPCs ══════════════════ */}
      {tab === "npcs" && (
        <div className="page">
          <div className="section-hdr">
            <p className="section-title">👥 Gesichter</p>
            {gmMode && <button className="btn-add" onClick={() => { setShowNpcForm(v => !v); setEditingNpc(null); setNpcForm({name:"",faction:"",description:"",imageUrl:"",status:"lebendig",location:"unbekannt",notes:""}); }}>+ NPC hinzufügen</button>}
          </div>
          {gmMode && showNpcForm && (
            <div className="form-panel">
              <p className="form-title">{editingNpc ? "NPC bearbeiten" : "Neuer NPC"}</p>
              <div className="f-row">
                <div className="f-group"><label className="f-label">Name</label>
                  <input className="f-input" value={npcForm.name} onChange={e => setNpcForm(f=>({...f,name:e.target.value}))} placeholder="z.B. Kettlesteam" autoFocus /></div>
                <div className="f-group"><label className="f-label">Fraktion / Rolle</label>
                  <input className="f-input" value={npcForm.faction} onChange={e => setNpcForm(f=>({...f,faction:e.target.value}))} placeholder="z.B. Zirkus Witchlight" /></div>
              </div>
              <div className="f-group"><label className="f-label">Beschreibung</label>
                <textarea className="f-input" rows={2} value={npcForm.description} onChange={e => setNpcForm(f=>({...f,description:e.target.value}))} placeholder="Was die Spieler über sie/ihn wissen..." /></div>
              <div className="f-group"><label className="f-label">Bild-URL (optional — i.imgur.com/...)</label>
                <input className="f-input" value={npcForm.imageUrl} onChange={e => setNpcForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://i.imgur.com/abc123.jpg" /></div>
              <div className="f-row">
                <div className="f-group"><label className="f-label">Status</label>
                  <select className="f-select" value={npcForm.status} onChange={e => setNpcForm(f=>({...f,status:e.target.value}))}>
                    {NPC_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="f-group"><label className="f-label">Ort</label>
                  <select className="f-select" value={npcForm.location||"unbekannt"} onChange={e => setNpcForm(f=>({...f,location:e.target.value}))}>
                    {NPC_LOCATIONS.filter(l => l.id !== "all").map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="f-group"><label className="f-label">GM-Notizen (privat)</label>
                <input className="f-input" value={npcForm.notes} onChange={e => setNpcForm(f=>({...f,notes:e.target.value}))} placeholder="Was die Spieler nicht wissen..." /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={saveNpc} disabled={!npcForm.name.trim()}>Speichern</button>
                <button className="btn-secondary" onClick={() => { setShowNpcForm(false); setEditingNpc(null); }}>Abbrechen</button>
              </div>
            </div>
          )}

          {/* Location tabs */}
          {npcs.length > 0 && (
            <div className="npc-loc-tabs">
              {NPC_LOCATIONS.map(l => {
                const count = l.id === "all" ? npcs.length : npcs.filter(n => (n.location || "unbekannt") === l.id).length;
                if (l.id !== "all" && count === 0) return null;
                return (
                  <button key={l.id} className={`npc-loc-tab ${npcLocation === l.id ? "active" : ""}`}
                    onClick={() => setNpcLocation(l.id)}>
                    <span>{l.icon}</span>{l.label}
                    <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.38rem",opacity:0.7,marginLeft:"0.15rem"}}>({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search + Sort row */}
          {npcs.length > 0 && (
            <div className="npc-controls-row">
              <div className="npc-search-wrap">
                <span className="npc-search-icon">🔍</span>
                <input className="npc-search-input" value={npcSearch}
                  onChange={e => setNpcSearch(e.target.value)}
                  placeholder="Nach Name oder Fraktion suchen..." />
              </div>
              <div className="npc-sort-wrap">
                {NPC_SORT_OPTIONS.map(s => (
                  <button key={s.id} className={`npc-sort-btn ${npcSort === s.id ? "active" : ""}`}
                    onClick={() => setNpcSort(s.id)} title={s.label}>
                    <span>{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NPC Detail — rendered above the grid, with scroll ref */}
          {expandedNpc && (() => {
            const n = npcs.find(x => x.id === expandedNpc);
            if (!n) return null;
            return (
              <div className="npc-detail" ref={npcDetailRef}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
                  <div>
                    <p className="npc-detail-name">{n.name}</p>
                    {n.faction && <p className="npc-detail-faction">{n.faction}</p>}
                  </div>
                  <div style={{display:"flex",gap:"0.4rem",alignItems:"center"}}>
                    <span className="tag" style={{color:npcColor(n.status),borderColor:npcColor(n.status)}}>{NPC_STATUSES.find(s=>s.id===n.status)?.label}</span>
                    {gmMode && <button className="btn-secondary" style={{padding:"0.2rem 0.5rem",fontSize:"0.45rem"}} onClick={() => { setNpcForm({name:n.name,faction:n.faction||"",description:n.description||"",imageUrl:n.imageUrl||"",status:n.status,location:n.location||"unbekannt",notes:n.notes||""}); setEditingNpc(n.id); setShowNpcForm(true); setExpandedNpc(null); }}>✎ Bearbeiten</button>}
                    <button className="btn-danger" onClick={() => setExpandedNpc(null)}>✕</button>
                  </div>
                </div>
                {n.imageUrl
                  ? <img src={n.imageUrl} alt={n.name} className="npc-detail-img" onError={e => { e.target.style.display="none"; }} />
                  : <div className="npc-detail-img-placeholder">👤</div>
                }
                {gmMode
                  ? n.description && <p className="npc-desc">{n.description}</p>
                  : <div className="f-group" style={{marginBottom:"0.6rem"}}>
                      <label className="f-label" style={{marginBottom:"0.25rem"}}>Beschreibung</label>
                      <textarea key={n.id} className="f-input" rows={3}
                        defaultValue={n.description || ""}
                        onBlur={e => {
                          const updated = e.target.value.trim();
                          if (updated !== (n.description || "").trim()) {
                            un(npcs.map(x => x.id === n.id ? { ...x, description: updated } : x));
                          }
                        }}
                        placeholder="Was wissen die Spieler über diese Person..." />
                    </div>
                }
                {n.location && n.location !== "unbekannt" && (
                  <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.45rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#9a78b8",marginBottom:"0.4rem"}}>
                    {NPC_LOCATIONS.find(l=>l.id===n.location)?.icon} {NPC_LOCATIONS.find(l=>l.id===n.location)?.label}
                  </p>
                )}
                {gmMode && n.notes && <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#d0a8e8",marginBottom:"0.3rem",marginTop:"0.5rem"}}>GM-Notiz: <span style={{fontFamily:"'IM Fell English',serif",fontStyle:"italic",fontSize:"0.8rem",letterSpacing:0,textTransform:"none",color:"#b08898"}}>{n.notes}</span></p>}
                <div className="divider" />
                <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.5rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#c0a8d0",marginBottom:"0.5rem"}}>Spieler-Eindrücke</p>
                {(n.impressions||[]).length > 0 && (
                  <div className="impression-list" style={{marginBottom:"0.6rem"}}>
                    {n.impressions.map(imp => {
                      const isEditingImp = editingImpression?.npcId === n.id && editingImpression?.impId === imp.id;
                      const canEditImp = gmMode || imp.author === playerName;
                      return (
                        <div key={imp.id} className="impression">
                          {isEditingImp ? (
                            <>
                              <div className="impression-edit-row">
                                <input className="impression-edit-input" value={editingImpressionText}
                                  onChange={e => setEditingImpressionText(e.target.value)}
                                  onKeyDown={e => { if(e.key === "Enter") saveImpression(n.id, imp.id); if(e.key === "Escape") { setEditingImpression(null); setEditingImpressionText(""); } }}
                                  autoFocus />
                                <button className="btn-tiny btn-tiny-primary" onClick={() => saveImpression(n.id, imp.id)} disabled={!editingImpressionText.trim()}>✓</button>
                                <button className="btn-tiny btn-tiny-secondary" onClick={() => { setEditingImpression(null); setEditingImpressionText(""); }}>✕</button>
                              </div>
                            </>
                          ) : (
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.4rem"}}>
                              <span>"{imp.text}"</span>
                              {canEditImp && (
                                <div style={{display:"flex",gap:"0.2rem",flexShrink:0,marginTop:"0.05rem"}}>
                                  <button className="btn-tiny btn-tiny-secondary" style={{padding:"0.1rem 0.35rem"}}
                                    onClick={() => { setEditingImpression({npcId:n.id,impId:imp.id}); setEditingImpressionText(imp.text); }}>✎</button>
                                  <button className="btn-tiny btn-tiny-secondary" style={{padding:"0.1rem 0.35rem",color:"#c06080",borderColor:"#e0c0c8"}}
                                    onClick={() => un(npcs.map(x => x.id === n.id ? {...x, impressions:(x.impressions||[]).filter(i => i.id !== imp.id)} : x))}>✕</button>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="impression-author">— {imp.author}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {playerName && (
                  <div style={{display:"flex",gap:"0.5rem"}}>
                    <input className="f-input" style={{flex:1}} value={npcImpression.npcId === n.id ? npcImpression.text : ""}
                      onChange={e => setNpcImpression({npcId:n.id,text:e.target.value})}
                      onKeyDown={e => e.key === "Enter" && addImpression(n.id)}
                      placeholder={`Dein Eindruck von ${n.name}...`} />
                    <button className="btn-primary" style={{whiteSpace:"nowrap"}} onClick={() => addImpression(n.id)}
                      disabled={npcImpression.npcId !== n.id || !npcImpression.text.trim()}>✦ Senden</button>
                  </div>
                )}
                <div style={{marginTop:"1rem",paddingTop:"0.8rem",borderTop:"1px solid #f0e4f8",textAlign:"center"}}>
                  <button className="btn-secondary" onClick={() => setExpandedNpc(null)}>✕ Schließen</button>
                </div>
              </div>
            );
          })()}

          {npcs.length === 0
            ? <div className="empty">Noch keine NPCs eingetragen.<br /><span style={{fontSize:"0.85rem"}}>Die Welt füllt sich langsam... 👥</span></div>
            : (() => {
              const filtered = npcs.filter(n => {
                const locMatch = npcLocation === "all" || (n.location || "unbekannt") === npcLocation;
                const q = npcSearch.toLowerCase().trim();
                const searchMatch = !q || n.name.toLowerCase().includes(q) || (n.faction||"").toLowerCase().includes(q);
                return locMatch && searchMatch;
              });
              const sorted = sortNpcs(filtered, npcSort);
              if (sorted.length === 0) return (
                <div className="empty" style={{paddingTop:"1.5rem"}}>
                  Keine NPCs gefunden.<br /><span style={{fontSize:"0.85rem"}}>Versuch eine andere Suche oder einen anderen Ort. ✦</span>
                </div>
              );
              return (
                <div className="npc-grid">
                  {sorted.map(n => (
                    <div key={n.id} className={`npc-card ${expandedNpc === n.id ? "selected" : ""}`} onClick={() => setExpandedNpc(expandedNpc === n.id ? null : n.id)}>
                      <div className="npc-img">
                        {n.imageUrl ? <img src={n.imageUrl} alt={n.name} onError={e => { e.target.style.display="none"; e.target.parentNode.innerHTML="👤"; }} /> : "👤"}
                      </div>
                      <div className="npc-card-body">
                        <div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.1rem"}}>
                          <span className="npc-status-dot" style={{background:npcColor(n.status)}} />
                          <p className="npc-card-name">{n.name}</p>
                        </div>
                        {n.faction && <p className="npc-card-faction">{n.faction}</p>}
                        {n.location && n.location !== "unbekannt" && (
                          <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.38rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"#9a78b8",marginTop:"0.2rem"}}>
                            {NPC_LOCATIONS.find(l=>l.id===n.location)?.icon} {NPC_LOCATIONS.find(l=>l.id===n.location)?.label}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          }
        </div>
      )}

      {/* ══════════════════ FUNDSTÜCKE ══════════════════ */}
      {tab === "fundstucke" && (
        <div className="page">
          <div className="section-hdr">
            <p className="section-title">🔍 Fundstücke</p>
            {gmMode && <button className="btn-add" onClick={() => setShowFundForm(v => !v)}>+ Hinzufügen</button>}
          </div>
          {gmMode && showFundForm && (
            <div className="form-panel">
              <p className="form-title">Neues Fundstück</p>
              <div className="f-group">
                <label className="f-label">Typ</label>
                <div className="fund-type-picker">
                  {FUND_TYPES.map(t => (
                    <span key={t.id} className={`fund-type-opt ${fundForm.type === t.id ? "selected" : ""}`}
                      onClick={() => setFundForm(f => ({...f, type: t.id}))}>{t.icon} {t.label}</span>
                  ))}
                </div>
              </div>
              <div className="f-group"><label className="f-label">Titel</label>
                <input className="f-input" value={fundForm.title} onChange={e => setFundForm(f => ({...f, title: e.target.value}))} placeholder="z.B. Brief von Isolde..." autoFocus /></div>
              <div className="f-group"><label className="f-label">Inhalt</label>
                <RichEditor value={fundForm.text} onChange={v => setFundForm(f => ({...f, text: v}))} placeholder="Der Text des Briefes, die Beschreibung des Artefakts..." rows={5} /></div>
              <div className="f-group"><label className="f-label">Bild-URL (optional)</label>
                <input className="f-input" value={fundForm.imageUrl} onChange={e => setFundForm(f => ({...f, imageUrl: e.target.value}))} placeholder="https://i.imgur.com/..." /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={addFund} disabled={!fundForm.title.trim()}>Speichern</button>
                <button className="btn-secondary" onClick={() => setShowFundForm(false)}>Abbrechen</button>
              </div>
            </div>
          )}
          {expandedFund && (() => {
            const item = fundstucke.find(x => x.id === expandedFund);
            if (!item) return null;
            const ftype = FUND_TYPES.find(t => t.id === item.type);
            return (
              <div className="fund-detail">
                <div className="fund-detail-hdr">
                  <div>
                    <p className="fund-detail-title">{item.title}</p>
                    <p className="fund-detail-meta">{ftype?.icon} {ftype?.label} · {formatDate(item.ts)}</p>
                  </div>
                  <div style={{display:"flex",gap:"0.4rem",flexShrink:0,alignItems:"center"}}>
                    {gmMode && (
                      <button className="btn-danger" onClick={() => { uf(fundstucke.filter(x => x.id !== item.id)); setExpandedFund(null); }}>✕ Löschen</button>
                    )}
                    <button className="btn-danger" onClick={() => setExpandedFund(null)}>✕</button>
                  </div>
                </div>
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="fund-detail-img" onError={e => e.target.style.display="none"} />}
                {item.text && <div className="fund-detail-text narrative" dangerouslySetInnerHTML={{ __html: item.text }} />}
              </div>
            );
          })()}
          {fundstucke.length === 0
            ? <div className="empty">Noch keine Fundstücke.<br /><span style={{fontSize:"0.85rem"}}>Briefe, Tagebücher, Artefakte — alles was sie finden. 🔍</span></div>
            : <div className="fund-grid">
              {fundstucke.map(item => {
                const ftype = FUND_TYPES.find(t => t.id === item.type);
                const plainText = item.text?.replace(/<[^>]+>/g, "") || "";
                return (
                  <div key={item.id} className="fund-card" onClick={() => setExpandedFund(expandedFund === item.id ? null : item.id)}>
                    <div className="fund-card-top">
                      <span className="fund-icon">{ftype?.icon}</span>
                      <span className="fund-card-name">{item.title}</span>
                    </div>
                    <span className="fund-type-label">{ftype?.label}</span>
                    {plainText && <p className="fund-preview">{plainText}</p>}
                  </div>
                );
              })}
            </div>
          }
        </div>
      )}

      {/* ══════════════════ GM PLAN ══════════════════ */}
      {tab === "gmplan" && gmMode && (
        <div className="page">
          <div className="section-hdr">
            <p className="section-title">🔐 GM-Zentrale</p>
          </div>

          {/* Sub-navigation */}
          <div className="gm-sub-tabs">
            {[
              { id: "dossiers", icon: "👤", label: "PC Dossiers", count: pcDossiers.length },
              { id: "world",    icon: "🌍", label: "Weltenarchiv", count: worldEntries.length },
              { id: "quick",    icon: "📝", label: "Quick Notes", count: quickNotes.filter(n=>!n.done).length },
              { id: "legacy",   icon: "📋", label: "Notizen", count: gmNotes.length },
            ].map(t => (
              <button key={t.id} className={`gm-sub-tab ${gmPlanTab === t.id ? "active" : ""}`}
                onClick={() => setGmPlanTab(t.id)}>
                <span>{t.icon}</span>{t.label}
                {t.count > 0 && <span className="gm-sub-count">({t.count})</span>}
              </button>
            ))}
          </div>

          {/* ── PC DOSSIERS ── */}
          {gmPlanTab === "dossiers" && (
            <>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"0.8rem"}}>
                <button className="btn-add" onClick={() => { setShowDossierForm(v => !v); setEditingDossier(null); setDossierForm({ name:"", imageUrl:"", backstory:"", threads:"", relationships:"", arc:"" }); }}>+ Neuer PC</button>
              </div>

              {showDossierForm && (
                <div className="form-panel">
                  <p className="form-title">{editingDossier ? "PC bearbeiten" : "Neues PC Dossier"}</p>
                  <div className="f-row">
                    <div className="f-group"><label className="f-label">Charaktername</label>
                      <input className="f-input" value={dossierForm.name} onChange={e => setDossierForm(f=>({...f,name:e.target.value}))} placeholder="z.B. Eya" autoFocus /></div>
                    <div className="f-group"><label className="f-label">Bild-URL (optional)</label>
                      <input className="f-input" value={dossierForm.imageUrl} onChange={e => setDossierForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://i.imgur.com/..." /></div>
                  </div>
                  <div className="f-group"><label className="f-label">Backstory</label>
                    <RichEditor value={dossierForm.backstory} onChange={v => setDossierForm(f=>({...f,backstory:v}))} placeholder="Hintergrundgeschichte des Charakters..." rows={4} /></div>
                  <div className="f-group"><label className="f-label">Geheime Plot-Fäden & Hooks</label>
                    <RichEditor value={dossierForm.threads} onChange={v => setDossierForm(f=>({...f,threads:v}))} placeholder="Welche Fäden ziehst du für diesen PC? Welche Geheimnisse warten?" rows={4} /></div>
                  <div className="f-group"><label className="f-label">Beziehungen (NPCs & andere PCs)</label>
                    <RichEditor value={dossierForm.relationships} onChange={v => setDossierForm(f=>({...f,relationships:v}))} placeholder="Wichtige Verbindungen, Rivalen, Verbündete..." rows={3} /></div>
                  <div className="f-group"><label className="f-label">Arc-Notizen (Wohin geht die Reise?)</label>
                    <RichEditor value={dossierForm.arc} onChange={v => setDossierForm(f=>({...f,arc:v}))} placeholder="Wo soll dieser Charakter hin? Welche Entwicklung planst du?" rows={3} /></div>
                  <div className="f-actions">
                    <button className="btn-primary" onClick={saveDossier} disabled={!dossierForm.name.trim()}>{editingDossier ? "Speichern" : "Dossier anlegen"}</button>
                    <button className="btn-secondary" onClick={() => { setShowDossierForm(false); setEditingDossier(null); }}>Abbrechen</button>
                  </div>
                </div>
              )}

              {pcDossiers.length === 0
                ? <div className="empty">Noch keine PC Dossiers.<br /><span style={{fontSize:"0.85rem"}}>Leg deine Spielercharaktere an. 👤</span></div>
                : pcDossiers.map(d => {
                  const isOpen = expandedDossier === d.id;
                  const secState = expandedDossierSection[d.id] || {};
                  const sections = [
                    { key: "backstory",      label: "Backstory",         icon: "📜", color: "#c094c8", content: d.backstory },
                    { key: "threads",        label: "Plot-Fäden & Hooks",icon: "🕸", color: "#e8c878", content: d.threads },
                    { key: "relationships",  label: "Beziehungen",       icon: "🤝", color: "#94a8d8", content: d.relationships },
                    { key: "arc",            label: "Arc-Notizen",       icon: "🌟", color: "#94c8a8", content: d.arc },
                  ];
                  return (
                    <div key={d.id} className="dossier-card">
                      <div className="dossier-header" onClick={() => setExpandedDossier(isOpen ? null : d.id)}>
                        <div className="dossier-avatar">
                          {d.imageUrl ? <img src={d.imageUrl} alt={d.name} onError={e => { e.target.style.display="none"; }} /> : "👤"}
                        </div>
                        <div style={{flex:1}}>
                          <p className="dossier-pc-name">{d.name}</p>
                          <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.4rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#c0a8d0",margin:"0.1rem 0 0"}}>
                            {sections.filter(s => s.content).length} / {sections.length} Sektionen ausgefüllt
                          </p>
                        </div>
                        <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
                          <button className="card-act-edit" onClick={e => { e.stopPropagation(); startEditDossier(d); }}>✎</button>
                          <button className="btn-danger" onClick={e => { e.stopPropagation(); if(window.confirm(`${d.name} löschen?`)) upd(pcDossiers.filter(x=>x.id!==d.id)); }}>✕</button>
                          <span className={`card-chevron ${isOpen ? "open" : ""}`}>▼</span>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="dossier-body">
                          {sections.map(sec => {
                            const secOpen = secState[sec.key];
                            return (
                              <div key={sec.key}>
                                <button className="dossier-section-btn"
                                  onClick={() => setExpandedDossierSection(s => ({...s, [d.id]: {...(s[d.id]||{}), [sec.key]: !secOpen}}))} >
                                  <span className="dossier-section-label" style={{color: sec.color}}>
                                    <span>{sec.icon}</span>{sec.label}
                                    {!sec.content && <span style={{fontSize:"0.38rem",opacity:0.5,fontWeight:400,letterSpacing:"0.05em"}}>(leer)</span>}
                                  </span>
                                  <span className={`dossier-section-chevron ${secOpen ? "open" : ""}`}>▼</span>
                                </button>
                                {secOpen && (
                                  <div className="dossier-section-content">
                                    {sec.content
                                      ? <div className="narrative" dangerouslySetInnerHTML={{ __html: sec.content }} />
                                      : <p style={{fontFamily:"'IM Fell English',serif",fontStyle:"italic",color:"#c0a8d0",fontSize:"0.85rem"}}>Noch nichts eingetragen. Bearbeite das Dossier um Inhalt hinzuzufügen.</p>
                                    }
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </>
          )}

          {/* ── WELTENARCHIV ── */}
          {gmPlanTab === "world" && (
            <>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"0.8rem"}}>
                <button className="btn-add" onClick={() => { setShowWorldForm(v => !v); setEditingWorld(null); setWorldForm({ title:"", text:"", type:"ort", imageUrl:"" }); }}>+ Neuer Eintrag</button>
              </div>

              {showWorldForm && (
                <div className="form-panel">
                  <p className="form-title">{editingWorld ? "Eintrag bearbeiten" : "Neuer Weltenarchiv-Eintrag"}</p>
                  <div className="f-group"><label className="f-label">Typ</label>
                    <div className="world-filter-row">
                      {[
                        { id: "ort",    label: "Ort / Karte",       icon: "🗺", color: "#94c8a8" },
                        { id: "wissen", label: "Wissen / Lore",     icon: "📚", color: "#c094c8" },
                        { id: "regel",  label: "Hausregel",         icon: "⚖",  color: "#e8c878" },
                        { id: "fraktion",label: "Fraktion / Gruppe",icon: "🏴", color: "#94a8d8" },
                      ].map(t => (
                        <span key={t.id} className={`world-filter-btn ${worldForm.type === t.id ? "active" : ""}`}
                          onClick={() => setWorldForm(f=>({...f,type:t.id}))}>{t.icon} {t.label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="f-group"><label className="f-label">Titel</label>
                    <input className="f-input" value={worldForm.title} onChange={e => setWorldForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Die Mondblumenlichtung" autoFocus /></div>
                  <div className="f-group"><label className="f-label">Inhalt</label>
                    <RichEditor value={worldForm.text} onChange={v => setWorldForm(f=>({...f,text:v}))} placeholder="Beschreibung, Regeln, Lore..." rows={6} /></div>
                  <div className="f-group"><label className="f-label">Bild-URL (optional)</label>
                    <input className="f-input" value={worldForm.imageUrl} onChange={e => setWorldForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://i.imgur.com/..." /></div>
                  <div className="f-actions">
                    <button className="btn-primary" onClick={saveWorldEntry} disabled={!worldForm.title.trim()}>Speichern</button>
                    <button className="btn-secondary" onClick={() => { setShowWorldForm(false); setEditingWorld(null); }}>Abbrechen</button>
                  </div>
                </div>
              )}

              {(() => {
                const WORLD_TYPES = [
                  { id: "all",      label: "Alle",             icon: "✦",  color: "#8a6aaa" },
                  { id: "ort",      label: "Orte",             icon: "🗺", color: "#94c8a8" },
                  { id: "wissen",   label: "Wissen",           icon: "📚", color: "#c094c8" },
                  { id: "regel",    label: "Hausregeln",       icon: "⚖",  color: "#e8c878" },
                  { id: "fraktion", label: "Fraktionen",       icon: "🏴", color: "#94a8d8" },
                ];
                const filtered = worldFilter === "all" ? worldEntries : worldEntries.filter(w => w.type === worldFilter);
                return (
                  <>
                    {worldEntries.length > 0 && (
                      <div className="world-filter-row">
                        {WORLD_TYPES.map(t => {
                          const count = t.id === "all" ? worldEntries.length : worldEntries.filter(w => w.type === t.id).length;
                          if (t.id !== "all" && count === 0) return null;
                          return (
                            <span key={t.id} className={`world-filter-btn ${worldFilter === t.id ? "active" : ""}`}
                              onClick={() => setWorldFilter(t.id)}>{t.icon} {t.label} ({count})</span>
                          );
                        })}
                      </div>
                    )}

                    {/* Expanded world detail */}
                    {expandedWorld && (() => {
                      const w = worldEntries.find(x => x.id === expandedWorld);
                      if (!w) return null;
                      const wtype = WORLD_TYPES.find(t => t.id === w.type);
                      return (
                        <div className="world-detail">
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.6rem"}}>
                            <div>
                              <span className="world-type-badge" style={{color:wtype?.color||"#c094c8",borderColor:wtype?.color||"#c094c8",marginBottom:"0.3rem"}}>
                                {wtype?.icon} {wtype?.label}
                              </span>
                              <p style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",fontWeight:700,fontStyle:"italic",color:"#3a1858",margin:"0.3rem 0 0.15rem"}}>{w.title}</p>
                              <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.4rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#c0a8d0"}}>{formatDate(w.ts)}</p>
                            </div>
                            <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
                              <button className="card-act-edit" onClick={() => { setWorldForm({title:w.title,text:w.text||"",type:w.type,imageUrl:w.imageUrl||""}); setEditingWorld(w.id); setShowWorldForm(true); setExpandedWorld(null); }}>✎</button>
                              <button className="btn-danger" onClick={() => { uwe(worldEntries.filter(x=>x.id!==w.id)); setExpandedWorld(null); }}>✕</button>
                              <button className="btn-danger" onClick={() => setExpandedWorld(null)}>✕</button>
                            </div>
                          </div>
                          {w.imageUrl && <img src={w.imageUrl} alt={w.title} style={{width:"100%",maxHeight:"220px",objectFit:"contain",borderRadius:"8px",marginBottom:"0.8rem",background:"#f8f0fc",display:"block"}} onError={e => e.target.style.display="none"} />}
                          {w.text && <div className="narrative" dangerouslySetInnerHTML={{ __html: w.text }} />}
                        </div>
                      );
                    })()}

                    {filtered.length === 0
                      ? <div className="empty">Noch keine Einträge im Weltenarchiv.<br /><span style={{fontSize:"0.85rem"}}>Orte, Lore, Hausregeln — dein Weltenbau. 🌍</span></div>
                      : filtered.map(w => {
                        const wtype = WORLD_TYPES.find(t => t.id === w.type);
                        return (
                          <div key={w.id} className="world-card" onClick={() => setExpandedWorld(expandedWorld === w.id ? null : w.id)}>
                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"0.5rem"}}>
                              <div>
                                <span className="world-type-badge" style={{color:wtype?.color||"#c094c8",borderColor:wtype?.color||"#c094c8"}}>
                                  {wtype?.icon} {wtype?.label}
                                </span>
                                <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.06em",color:"#3a1858",margin:"0.3rem 0 0.1rem"}}>{w.title}</p>
                                <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.38rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#c0a8d0"}}>{formatDate(w.ts)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </>
                );
              })()}
            </>
          )}

          {/* ── QUICK NOTES ── */}
          {gmPlanTab === "quick" && (
            <>
              <div className="form-panel" style={{marginBottom:"1rem"}}>
                <p className="form-title">{editingQn ? "Notiz bearbeiten" : "📝 Schnelle Notiz"}</p>
                <div className="qn-input-row">
                  <input className="f-input" value={qnForm.text}
                    onChange={e => setQnForm(f=>({...f,text:e.target.value}))}
                    onKeyDown={e => e.key === "Enter" && addQuickNote()}
                    placeholder="Was darfst du nicht vergessen?" autoFocus />
                  <input className="f-input" style={{maxWidth:"120px"}} value={qnForm.tag}
                    onChange={e => setQnForm(f=>({...f,tag:e.target.value}))}
                    onKeyDown={e => e.key === "Enter" && addQuickNote()}
                    placeholder="Tag (opt.)" />
                  <button className="btn-primary" onClick={addQuickNote} disabled={!qnForm.text.trim()} style={{whiteSpace:"nowrap"}}>{editingQn ? "✓" : "+"}</button>
                  {editingQn && <button className="btn-secondary" onClick={() => { setEditingQn(null); setQnForm({text:"",tag:""}); }} style={{whiteSpace:"nowrap"}}>✕</button>}
                </div>
              </div>

              {quickNotes.length === 0
                ? <div className="empty">Keine Quick Notes.<br /><span style={{fontSize:"0.85rem"}}>Schnell was notieren, erledigt abhaken. 📝</span></div>
                : <>
                  {/* Active notes */}
                  {quickNotes.filter(n=>!n.done).length > 0 && (
                    <div style={{marginBottom:"1rem"}}>
                      {quickNotes.filter(n=>!n.done).map(n => (
                        <div key={n.id} className="qn-card">
                          <div className={`qn-checkbox`} onClick={() => toggleQuickNote(n.id)}>
                            &nbsp;
                          </div>
                          <div style={{flex:1}}>
                            <p className="qn-text">{n.text}</p>
                            <div style={{display:"flex",gap:"0.4rem",alignItems:"center",marginTop:"0.2rem",flexWrap:"wrap"}}>
                              {n.tag && <span className="qn-tag">{n.tag}</span>}
                              <span className="qn-date">{formatDate(n.ts)}</span>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:"0.2rem",flexShrink:0}}>
                            <button className="card-act-edit" onClick={() => { setQnForm({text:n.text,tag:n.tag||""}); setEditingQn(n.id); }}>✎</button>
                            <button className="btn-danger" onClick={() => uqn(quickNotes.filter(x=>x.id!==n.id))}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Done notes */}
                  {quickNotes.filter(n=>n.done).length > 0 && (
                    <div>
                      <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.45rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#c0a8d0",marginBottom:"0.4rem"}}>✓ Erledigt ({quickNotes.filter(n=>n.done).length})</p>
                      {quickNotes.filter(n=>n.done).map(n => (
                        <div key={n.id} className="qn-card done">
                          <div className="qn-checkbox checked" onClick={() => toggleQuickNote(n.id)}>✓</div>
                          <div style={{flex:1}}>
                            <p className="qn-text">{n.text}</p>
                            <div style={{display:"flex",gap:"0.4rem",alignItems:"center",marginTop:"0.2rem",flexWrap:"wrap"}}>
                              {n.tag && <span className="qn-tag">{n.tag}</span>}
                              <span className="qn-date">{formatDate(n.ts)}</span>
                            </div>
                          </div>
                          <button className="btn-danger" onClick={() => uqn(quickNotes.filter(x=>x.id!==n.id))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              }
            </>
          )}

          {/* ── LEGACY NOTES ── */}
          {gmPlanTab === "legacy" && (
            <>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"0.8rem"}}>
                <button className="btn-add" onClick={() => { setShowGmNoteForm(v => !v); setEditingGmNote(null); setGmNoteForm({ title: "", text: "", category: "plan" }); }}>+ Neue Notiz</button>
              </div>

              {showGmNoteForm && (
                <div className="form-panel">
                  <p className="form-title">{editingGmNote ? "Notiz bearbeiten" : "Neue GM-Notiz"}</p>
                  <div className="f-group">
                    <label className="f-label">Kategorie</label>
                    <div className="cat-picker">
                      {GM_CATEGORIES.map(c => (
                        <span key={c.id} className={`cat-opt ${gmNoteForm.category === c.id ? "selected" : ""}`}
                          onClick={() => setGmNoteForm(f => ({...f, category: c.id}))}>
                          {c.icon} {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="f-group"><label className="f-label">Titel</label>
                    <input className="f-input" value={gmNoteForm.title} onChange={e => setGmNoteForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Session 5 Vorbereitung" autoFocus /></div>
                  <div className="f-group"><label className="f-label">Inhalt</label>
                    <RichEditor value={gmNoteForm.text} onChange={v => setGmNoteForm(f=>({...f,text:v}))} placeholder="Deine Planungsnotizen, Geheimnisse, NPC-Details..." rows={6} /></div>
                  <div className="f-actions">
                    <button className="btn-primary" onClick={saveGmNote} disabled={!gmNoteForm.title.trim()}>Speichern</button>
                    <button className="btn-secondary" onClick={() => { setShowGmNoteForm(false); setEditingGmNote(null); }}>Abbrechen</button>
                  </div>
                </div>
              )}

              <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"1rem"}}>
                {GM_CATEGORIES.map(c => {
                  const count = gmNotes.filter(n => n.category === c.id).length;
                  if (!count) return null;
                  return (
                    <span key={c.id} style={{fontFamily:"'Cinzel',serif",fontSize:"0.42rem",letterSpacing:"0.1em",textTransform:"uppercase",padding:"0.2rem 0.5rem",borderRadius:"3px",border:`1px solid ${c.color}`,color:c.color,display:"flex",alignItems:"center",gap:"0.2rem"}}>
                      {c.icon} {c.label} ({count})
                    </span>
                  );
                })}
              </div>

              {gmNotes.length === 0
                ? <div className="empty">Noch keine GM-Notizen.<br /><span style={{fontSize:"0.85rem"}}>Nur du kannst das hier sehen. 🔐</span></div>
                : GM_CATEGORIES.map(cat => {
                  const group = gmNotes.filter(n => n.category === cat.id);
                  if (!group.length) return null;
                  return (
                    <div key={cat.id} style={{marginBottom:"1.2rem"}}>
                      <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.5rem",letterSpacing:"0.15em",textTransform:"uppercase",color:cat.color,marginBottom:"0.5rem",display:"flex",alignItems:"center",gap:"0.3rem"}}>{cat.icon} {cat.label}</p>
                      {group.map(n => {
                        const isOpen = expandedGmNote === n.id;
                        return (
                          <div key={n.id} className="gm-note-card">
                            <div style={{display:"flex",alignItems:"flex-start",gap:"0.6rem",cursor:"pointer"}} onClick={() => setExpandedGmNote(isOpen ? null : n.id)}>
                              <div style={{flex:1}}>
                                <p style={{fontFamily:"'Playfair Display',serif",fontSize:"0.95rem",fontWeight:700,color:"#5a3878",margin:"0 0 0.15rem"}}>{n.title}</p>
                                <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.42rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#c0a8d0"}}>{formatDate(n.ts)}</p>
                              </div>
                              <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
                                <button className="card-act-edit" onClick={e => { e.stopPropagation(); setGmNoteForm({title:n.title,text:n.text,category:n.category}); setEditingGmNote(n.id); setShowGmNoteForm(true); setExpandedGmNote(null); }}>✎</button>
                                <button className="btn-danger" onClick={e => { e.stopPropagation(); ugn(gmNotes.filter(x => x.id !== n.id)); }}>✕</button>
                                <span style={{color:"#d8c8e8",fontSize:"0.7rem",transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"none"}}>▼</span>
                              </div>
                            </div>
                            {isOpen && n.text && (
                              <div style={{marginTop:"0.8rem",paddingTop:"0.8rem",borderTop:"1px solid #f0e4f8"}}>
                                <div className="narrative" dangerouslySetInnerHTML={{ __html: n.text }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

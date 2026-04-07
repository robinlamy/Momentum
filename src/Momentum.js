import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// MOMENTUM — Personal Development Dashboard
// ============================================================

const STORAGE_KEYS = {
  TASKS: "momentum-tasks",
  GOALS: "momentum-goals",
  STREAKS: "momentum-streaks",
  XP: "momentum-xp",
  SPORT: "momentum-sport",
  SETTINGS: "momentum-settings",
  WEEK_PLAN: "momentum-week-plan",
  VACATION: "momentum-vacation",
  SPORT_LOG: "momentum-sport-log",
  NOTES: "momentum-notes",
};

// --- Helpers ---
const dateKey = (d = new Date()) => d.toISOString().slice(0, 10);
const dayOfWeek = (d = new Date()) => d.getDay(); // 0=Sun
const formatDate = (d) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const DOMAINS = {
  english: { label: "English", color: "#3B82F6", xpMultiplier: 1.5 },
  sport: { label: "Sport", color: "#10B981", xpMultiplier: 1.2 },
  finance: { label: "Finance", color: "#F59E0B", xpMultiplier: 1.0 },
  reading: { label: "Reading", color: "#8B5CF6", xpMultiplier: 0.8 },
};

const LEVELS = [
  { name: "Beginner", minXP: 0 },
  { name: "Apprentice", minXP: 200 },
  { name: "Committed", minXP: 500 },
  { name: "Dedicated", minXP: 1000 },
  { name: "Consistent", minXP: 2000 },
  { name: "Performer", minXP: 3500 },
  { name: "Specialist", minXP: 5000 },
  { name: "Expert", minXP: 8000 },
  { name: "Master", minXP: 12000 },
  { name: "Legend", minXP: 20000 },
];

const getLevel = (xp) => {
  let lvl = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXP) lvl = l;
  }
  const idx = LEVELS.indexOf(lvl);
  const next = LEVELS[idx + 1];
  return { ...lvl, index: idx, next, progress: next ? (xp - lvl.minXP) / (next.minXP - lvl.minXP) : 1 };
};

const DEFAULT_WEEK_TEMPLATE = {
  1: { morning: ["TOEIC Listening Practice (30 min)", "English Vocabulary — Finance Terms"], afternoon: ["Strength Training — Push Day"], evening: ["Reading (30 min)"] },
  2: { morning: ["TOEIC Reading Practice (30 min)", "English Grammar Exercises"], afternoon: ["Running Session", "Excel / Spreadsheet Skills (45 min)"], evening: ["Reading (30 min)"] },
  3: { morning: ["English Podcast — Finance Topic (30 min)", "TOEIC Mock Section"], afternoon: ["Strength Training — Pull Day"], evening: ["Interest Rate Economics Review"] },
  4: { morning: ["English Writing Exercise (30 min)", "Vocabulary Review"], afternoon: ["Running Session", "Swap Pricing & Bootstrapping Review"], evening: ["Reading (30 min)"] },
  5: { morning: ["TOEIC Full Practice Test Section", "English Conversation Practice"], afternoon: ["Strength Training — Legs Day"], evening: ["Market Finance Fundamentals"] },
  6: { morning: ["Free Sport — Padel / Football / Tennis"], afternoon: ["Excel Advanced Features (1h)"], evening: ["Reading (30 min)"] },
  0: { morning: ["Light English Review (20 min)"], afternoon: ["Rest or Optional Activity"], evening: ["Weekly Review & Planning"] },
};

// --- Storage Hook (localStorage for standalone PWA) ---
function useStorage(key, defaultValue) {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });
  const [loaded] = useState(true);

  const save = useCallback((newData) => {
    const val = typeof newData === "function" ? newData(data) : newData;
    setData(val);
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  }, [key, data]);

  return [data, save, loaded];
}

// ============================================================
// COMPONENTS
// ============================================================

// --- Navigation ---
function Nav({ tab, setTab, theme }) {
  const tabs = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "training", label: "Training" },
    { id: "progress", label: "Progress" },
    { id: "goals", label: "Goals" },
    { id: "notes", label: "Notes" },
  ];
  return (
    <nav style={{
      display: "flex", gap: "2px", padding: "6px",
      background: theme === "dark" ? "#111113" : "#F0F0F2",
      borderRadius: "14px", margin: "0 auto", width: "fit-content",
      maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch"
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          padding: "10px 18px", border: "none", borderRadius: "10px", cursor: "pointer",
          fontSize: "13px", fontWeight: tab === t.id ? "700" : "500", letterSpacing: "0.02em",
          fontFamily: "'DM Sans', sans-serif",
          background: tab === t.id
            ? (theme === "dark" ? "#1E1E22" : "#FFFFFF")
            : "transparent",
          color: tab === t.id
            ? (theme === "dark" ? "#FFFFFF" : "#111113")
            : (theme === "dark" ? "#6B6B76" : "#999"),
          boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          transition: "all 0.2s"
        }}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// --- Streak Badge ---
function StreakBadge({ domain, count, theme }) {
  const d = DOMAINS[domain];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "8px 14px", borderRadius: "10px",
      background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
      border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
    }}>
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%",
        background: d.color, boxShadow: `0 0 8px ${d.color}40`
      }} />
      <span style={{ fontSize: "12px", color: theme === "dark" ? "#A0A0AB" : "#666", fontFamily: "'DM Sans', sans-serif" }}>
        {d.label}
      </span>
      <span style={{ fontSize: "16px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'Space Mono', monospace" }}>
        {count}
      </span>
    </div>
  );
}

// --- XP Bar ---
function XPBar({ xp, theme }) {
  const level = getLevel(xp);
  return (
    <div style={{
      padding: "16px 20px", borderRadius: "14px",
      background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
      border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
        <span style={{ fontSize: "14px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif" }}>
          Lv.{level.index + 1} — {level.name}
        </span>
        <span style={{ fontSize: "12px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'Space Mono', monospace" }}>
          {xp} XP
        </span>
      </div>
      <div style={{
        height: "6px", borderRadius: "3px",
        background: theme === "dark" ? "#2A2A2E" : "#E5E5E8"
      }}>
        <div style={{
          height: "100%", borderRadius: "3px",
          width: `${level.progress * 100}%`,
          background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
          transition: "width 0.5s ease"
        }} />
      </div>
      {level.next && (
        <div style={{ fontSize: "11px", color: theme === "dark" ? "#4A4A54" : "#BBB", marginTop: "6px", fontFamily: "'Space Mono', monospace" }}>
          {level.next.minXP - xp} XP to {level.next.name}
        </div>
      )}
    </div>
  );
}

// --- Domain detection helper ---
function detectDomain(taskKey) {
  const k = taskKey.toLowerCase();
  if (k.includes("english") || k.includes("toeic") || k.includes("vocabulary") || k.includes("grammar") || k.includes("podcast") || k.includes("conversation") || k.includes("writing") || k.includes("listening")) return "english";
  if (k.includes("training") || k.includes("running") || k.includes("sport") || k.includes("padel") || k.includes("football") || k.includes("tennis") || k.includes("strength") || k.includes("muscu") || k.includes("legs") || k.includes("push") || k.includes("pull")) return "sport";
  if (k.includes("finance") || k.includes("excel") || k.includes("swap") || k.includes("rate") || k.includes("market") || k.includes("spreadsheet") || k.includes("bootstrap") || k.includes("pricing") || k.includes("vba") || k.includes("python")) return "finance";
  return "reading";
}

// --- Streak calculator ---
function computeStreaks(tasks, vacation) {
  const streaks = {};
  Object.keys(DOMAINS).forEach(d => { streaks[d] = 0; });

  // Go backwards from yesterday counting consecutive days with at least one completed task per domain
  for (let i = 0; i <= 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const dayTasks = tasks[key];

    // Skip vacation days (they don't break streaks)
    if (vacation[key] === "full") continue;

    if (!dayTasks) {
      // If today (i===0), don't break — day isn't over yet
      if (i === 0) continue;
      // No tasks this day = all streaks break
      break;
    }

    const doneTasks = Object.entries(dayTasks).filter(([, v]) => v);
    const domainsToday = new Set(doneTasks.map(([k]) => detectDomain(k)));

    // For each domain, if it was done today, increment. If not and i>0, that domain's streak stops.
    let anyDomainActive = false;
    Object.keys(DOMAINS).forEach(domain => {
      if (domainsToday.has(domain)) {
        streaks[domain]++;
        anyDomainActive = true;
      }
    });

    // If no domain was active on a past day, stop counting
    if (i > 0 && !anyDomainActive) break;
  }
  return streaks;
}

// --- Today Tab ---
function TodayTab({ tasks, setTasks, xp, setXP, streaks, setStreaks, weekPlan, vacation, theme }) {
  const today = dateKey();
  const isVacation = vacation[today] === "full";
  const isLight = vacation[today] === "light";
  const dow = dayOfWeek();
  
  // Deep merge for today's template
  const getTemplate = () => {
    const base = DEFAULT_WEEK_TEMPLATE[dow] || { morning: [], afternoon: [], evening: [] };
    const override = weekPlan[dow];
    if (!override) return base;
    return {
      morning: override.morning !== undefined ? override.morning : base.morning,
      afternoon: override.afternoon !== undefined ? override.afternoon : base.afternoon,
      evening: override.evening !== undefined ? override.evening : base.evening,
    };
  };
  const template = getTemplate();

  // Build today's tasks from template, preserving existing completion state
  const templateKey = JSON.stringify(template);
  const buildTodayTasks = useCallback(() => {
    const existing = tasks[today] || {};
    const built = {};
    ["morning", "afternoon", "evening"].forEach(block => {
      (template[block] || []).forEach(task => {
        const key = `${block}::${task}`;
        built[key] = existing[key] || false;
      });
    });
    return built;
  }, [today, templateKey, tasks]);

  const todayTasks = isVacation ? {} : buildTodayTasks();

  // Sync today's tasks whenever template changes
  useEffect(() => {
    if (!isVacation) {
      const built = buildTodayTasks();
      const builtKeys = Object.keys(built).sort().join("|");
      const existingKeys = Object.keys(tasks[today] || {}).sort().join("|");
      if (builtKeys !== existingKeys) {
        setTasks(prev => ({ ...prev, [today]: built }));
      }
    }
  }, [today, templateKey, isVacation]);

  // Recompute streaks when tasks change
  useEffect(() => {
    const newStreaks = computeStreaks(tasks, vacation);
    setStreaks(newStreaks);
  }, [tasks]);

  const toggleTask = (key) => {
    const wasDone = todayTasks[key];
    const newTodayTasks = { ...todayTasks, [key]: !wasDone };
    setTasks(prev => ({ ...prev, [today]: newTodayTasks }));

    const domain = detectDomain(key);
    const xpGain = Math.round(25 * (DOMAINS[domain]?.xpMultiplier || 1));

    if (!wasDone) {
      setXP(prev => (prev || 0) + xpGain);
    } else {
      setXP(prev => Math.max(0, (prev || 0) - xpGain));
    }
  };

  const blocks = ["morning", "afternoon", "evening"];
  const blockLabels = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
  const blockTasks = {};
  blocks.forEach(b => {
    blockTasks[b] = Object.keys(todayTasks).filter(k => k.startsWith(b + "::")).map(k => ({
      key: k,
      label: k.split("::")[1],
      done: todayTasks[k]
    }));
  });

  const totalTasks = Object.keys(todayTasks).length;
  const doneTasks = Object.values(todayTasks).filter(Boolean).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (isVacation) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "32px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", marginBottom: "12px" }}>
          Vacation Mode
        </div>
        <p style={{ color: theme === "dark" ? "#6B6B76" : "#999", fontSize: "15px", fontFamily: "'DM Sans', sans-serif" }}>
          Your streaks are frozen. Enjoy your time off.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      {/* Date & Progress */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "24px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif" }}>
          {formatDate(new Date())}
        </div>
        {isLight && (
          <div style={{
            marginTop: "8px", padding: "8px 14px", borderRadius: "8px",
            background: theme === "dark" ? "#2A2A1E" : "#FFF8E7",
            color: theme === "dark" ? "#F59E0B" : "#92600A",
            fontSize: "13px", fontFamily: "'DM Sans', sans-serif"
          }}>
            Light mode — Reduced schedule, streaks preserved
          </div>
        )}
        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            flex: 1, height: "8px", borderRadius: "4px",
            background: theme === "dark" ? "#2A2A2E" : "#E5E5E8"
          }}>
            <div style={{
              height: "100%", borderRadius: "4px",
              width: `${pct}%`,
              background: pct === 100 ? "#10B981" : "linear-gradient(90deg, #3B82F6, #8B5CF6)",
              transition: "width 0.4s ease"
            }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'Space Mono', monospace", minWidth: "48px" }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Streaks row */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {Object.keys(DOMAINS).map(d => (
          <StreakBadge key={d} domain={d} count={streaks[d] || 0} theme={theme} />
        ))}
      </div>

      {/* XP */}
      <div style={{ marginBottom: "28px" }}>
        <XPBar xp={xp || 0} theme={theme} />
      </div>

      {/* Task Blocks */}
      {blocks.map(block => (
        blockTasks[block].length > 0 && (
          <div key={block} style={{ marginBottom: "24px" }}>
            <div style={{
              fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase",
              color: theme === "dark" ? "#4A4A54" : "#BBB", marginBottom: "10px",
              fontFamily: "'Space Mono', monospace"
            }}>
              {blockLabels[block]}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {blockTasks[block].map(task => (
                <button key={task.key} onClick={() => toggleTask(task.key)} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 18px", borderRadius: "12px", border: "none", cursor: "pointer",
                  background: task.done
                    ? (theme === "dark" ? "#1A2E1A" : "#ECFDF5")
                    : (theme === "dark" ? "#1E1E22" : "#FFFFFF"),
                  borderLeft: `3px solid ${task.done ? "#10B981" : (theme === "dark" ? "#2A2A2E" : "#E5E5E8")}`,
                  transition: "all 0.2s", textAlign: "left", width: "100%"
                }}>
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "6px", flexShrink: 0,
                    border: task.done ? "none" : `2px solid ${theme === "dark" ? "#3A3A40" : "#CCC"}`,
                    background: task.done ? "#10B981" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s"
                  }}>
                    {task.done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                    color: task.done
                      ? (theme === "dark" ? "#6B6B76" : "#999")
                      : (theme === "dark" ? "#E0E0E5" : "#333"),
                    textDecoration: task.done ? "line-through" : "none",
                    transition: "all 0.2s"
                  }}>
                    {task.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      ))}

      {totalTasks === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: theme === "dark" ? "#4A4A54" : "#CCC", fontFamily: "'DM Sans', sans-serif" }}>
          No tasks scheduled for today. Check your Week Planner.
        </div>
      )}
    </div>
  );
}

// --- Week Planner Tab ---
function WeekTab({ weekPlan, setWeekPlan, vacation, setVacation, theme }) {
  const [editingDay, setEditingDay] = useState(null);
  const [editBlock, setEditBlock] = useState(null);
  const [newTask, setNewTask] = useState("");
  const [vacMode, setVacMode] = useState(null);
  const [vacStart, setVacStart] = useState("");
  const [vacEnd, setVacEnd] = useState("");

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const blockNames = ["morning", "afternoon", "evening"];
  
  // Deep merge: for each day, merge each block
  const getPlan = (day) => {
    const base = DEFAULT_WEEK_TEMPLATE[day] || { morning: [], afternoon: [], evening: [] };
    const override = weekPlan[day];
    if (!override) return base;
    return {
      morning: override.morning !== undefined ? override.morning : base.morning,
      afternoon: override.afternoon !== undefined ? override.afternoon : base.afternoon,
      evening: override.evening !== undefined ? override.evening : base.evening,
    };
  };

  const addTask = (day, block) => {
    if (!newTask.trim()) return;
    const current = getPlan(day);
    const updated = {
      ...weekPlan,
      [day]: {
        ...current,
        [block]: [...(current[block] || []), newTask.trim()]
      }
    };
    setWeekPlan(updated);
    setNewTask("");
  };

  const removeTask = (day, block, idx) => {
    const current = getPlan(day);
    const blockTasks = [...(current[block] || [])];
    blockTasks.splice(idx, 1);
    setWeekPlan({
      ...weekPlan,
      [day]: { ...current, [block]: blockTasks }
    });
  };

  const applyVacation = () => {
    if (!vacStart || !vacEnd || !vacMode) return;
    const start = new Date(vacStart);
    const end = new Date(vacEnd);
    const newVac = { ...vacation };
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      newVac[dateKey(d)] = vacMode;
    }
    setVacation(newVac);
    setVacStart("");
    setVacEnd("");
    setVacMode(null);
  };

  return (
    <div style={{ maxWidth: "740px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Week Template
        </h2>
      </div>

      {/* Vacation Planner */}
      <div style={{
        padding: "18px", borderRadius: "14px", marginBottom: "28px",
        background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
        border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
      }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", marginBottom: "12px", fontFamily: "'DM Sans', sans-serif" }}>
          Vacation / Day Off
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input type="date" value={vacStart} onChange={e => setVacStart(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
              background: theme === "dark" ? "#111113" : "#FFF", color: theme === "dark" ? "#FFF" : "#111",
              fontSize: "13px", fontFamily: "'DM Sans', sans-serif"
            }} />
          <span style={{ color: theme === "dark" ? "#6B6B76" : "#999", fontSize: "13px" }}>to</span>
          <input type="date" value={vacEnd} onChange={e => setVacEnd(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
              background: theme === "dark" ? "#111113" : "#FFF", color: theme === "dark" ? "#FFF" : "#111",
              fontSize: "13px", fontFamily: "'DM Sans', sans-serif"
            }} />
          <select value={vacMode || ""} onChange={e => setVacMode(e.target.value || null)}
            style={{
              padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
              background: theme === "dark" ? "#111113" : "#FFF", color: theme === "dark" ? "#FFF" : "#111",
              fontSize: "13px", fontFamily: "'DM Sans', sans-serif"
            }}>
            <option value="">Mode...</option>
            <option value="full">Full Pause</option>
            <option value="light">Light Mode</option>
          </select>
          <button onClick={applyVacation} style={{
            padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: "#3B82F6", color: "#FFF", fontSize: "13px", fontWeight: "600",
            fontFamily: "'DM Sans', sans-serif"
          }}>
            Apply
          </button>
        </div>
      </div>

      {/* Days */}
      {[1, 2, 3, 4, 5, 6, 0].map(day => (
        <div key={day} style={{
          marginBottom: "16px", borderRadius: "14px",
          background: theme === "dark" ? "#1E1E22" : "#FFFFFF",
          border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`,
          overflow: "hidden"
        }}>
          <div style={{
            padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: editingDay === day ? `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}` : "none",
            cursor: "pointer"
          }} onClick={() => setEditingDay(editingDay === day ? null : day)}>
            <span style={{ fontSize: "15px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif" }}>
              {dayNames[day]}
            </span>
            <span style={{ fontSize: "12px", color: theme === "dark" ? "#4A4A54" : "#BBB", fontFamily: "'Space Mono', monospace" }}>
              {Object.values(getPlan(day)).flat().length} tasks
            </span>
          </div>
          {editingDay === day && (
            <div style={{ padding: "14px 18px" }}>
              {blockNames.map(block => (
                <div key={block} style={{ marginBottom: "14px" }}>
                  <div style={{
                    fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase",
                    color: theme === "dark" ? "#4A4A54" : "#BBB", marginBottom: "8px",
                    fontFamily: "'Space Mono', monospace"
                  }}>
                    {block}
                  </div>
                  {(getPlan(day)[block] || []).map((task, idx) => (
                    <div key={idx} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 12px", marginBottom: "4px", borderRadius: "8px",
                      background: theme === "dark" ? "#111113" : "#F7F7F8"
                    }}>
                      <span style={{ fontSize: "13px", color: theme === "dark" ? "#E0E0E5" : "#333", fontFamily: "'DM Sans', sans-serif" }}>
                        {task}
                      </span>
                      <button onClick={() => removeTask(day, block, idx)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: theme === "dark" ? "#4A4A54" : "#CCC", fontSize: "18px", padding: "0 4px"
                      }}>
                        x
                      </button>
                    </div>
                  ))}
                  {editBlock === `${day}-${block}` ? (
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      <input value={newTask} onChange={e => setNewTask(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addTask(day, block)}
                        placeholder="New task..."
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: "8px",
                          border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
                          background: theme === "dark" ? "#111113" : "#FFF",
                          color: theme === "dark" ? "#FFF" : "#111",
                          fontSize: "13px", fontFamily: "'DM Sans', sans-serif"
                        }} />
                      <button onClick={() => addTask(day, block)} style={{
                        padding: "8px 14px", borderRadius: "8px", border: "none",
                        background: "#3B82F6", color: "#FFF", fontSize: "13px", cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", fontWeight: "600"
                      }}>Add</button>
                      <button onClick={() => { setEditBlock(null); setNewTask(""); }} style={{
                        padding: "8px 14px", borderRadius: "8px", border: "none",
                        background: theme === "dark" ? "#2A2A2E" : "#E5E5E8",
                        color: theme === "dark" ? "#A0A0AB" : "#666",
                        fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                      }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditBlock(`${day}-${block}`)} style={{
                      background: "none", border: `1px dashed ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
                      borderRadius: "8px", padding: "8px", width: "100%", cursor: "pointer",
                      color: theme === "dark" ? "#4A4A54" : "#BBB", fontSize: "12px",
                      fontFamily: "'DM Sans', sans-serif", marginTop: "4px"
                    }}>
                      + Add task
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Training Tab ---
function TrainingTab({ sportLog, setSportLog, theme }) {
  const [activeView, setActiveView] = useState("log"); // log | history | progress
  const [sessionType, setSessionType] = useState("strength"); // strength | running | other
  const [sessionName, setSessionName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("");
  const [exReps, setExReps] = useState("");
  const [exWeight, setExWeight] = useState("");
  const [runDistance, setRunDistance] = useState("");
  const [runTime, setRunTime] = useState("");
  const [otherDesc, setOtherDesc] = useState("");

  const addExercise = () => {
    if (!exName) return;
    setExercises([...exercises, {
      name: exName, sets: Number(exSets) || 0, reps: Number(exReps) || 0, weight: Number(exWeight) || 0
    }]);
    setExName(""); setExSets(""); setExReps(""); setExWeight("");
  };

  const saveSession = () => {
    const session = {
      date: dateKey(),
      type: sessionType,
      name: sessionName || (sessionType === "strength" ? "Strength Session" : sessionType === "running" ? "Running" : "Other"),
      exercises: sessionType === "strength" ? exercises : [],
      running: sessionType === "running" ? { distance: Number(runDistance) || 0, time: Number(runTime) || 0 } : null,
      other: sessionType === "other" ? otherDesc : null,
    };
    setSportLog(prev => [...(prev || []), session]);
    setExercises([]); setSessionName(""); setRunDistance(""); setRunTime(""); setOtherDesc("");
  };

  const logs = sportLog || [];
  const strengthLogs = logs.filter(l => l.type === "strength");
  const runLogs = logs.filter(l => l.type === "running");

  // Get unique exercises for progress charts
  const allExNames = [...new Set(strengthLogs.flatMap(l => l.exercises.map(e => e.name)))];
  const [selectedEx, setSelectedEx] = useState("");

  const inputStyle = {
    padding: "10px 14px", borderRadius: "8px",
    border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
    background: theme === "dark" ? "#111113" : "#FFF",
    color: theme === "dark" ? "#FFF" : "#111",
    fontSize: "13px", fontFamily: "'DM Sans', sans-serif", width: "100%"
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", marginBottom: "20px" }}>
        Training
      </h2>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", background: theme === "dark" ? "#111113" : "#F0F0F2", borderRadius: "10px", padding: "4px" }}>
        {[{ id: "log", label: "Log Session" }, { id: "history", label: "History" }, { id: "progress", label: "Progress" }].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{
            flex: 1, padding: "8px", border: "none", borderRadius: "8px", cursor: "pointer",
            background: activeView === v.id ? (theme === "dark" ? "#1E1E22" : "#FFF") : "transparent",
            color: activeView === v.id ? (theme === "dark" ? "#FFF" : "#111") : (theme === "dark" ? "#6B6B76" : "#999"),
            fontSize: "13px", fontWeight: activeView === v.id ? "700" : "500",
            fontFamily: "'DM Sans', sans-serif"
          }}>{v.label}</button>
        ))}
      </div>

      {activeView === "log" && (
        <div>
          {/* Session type */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
            {[{ id: "strength", label: "Strength" }, { id: "running", label: "Running" }, { id: "other", label: "Other" }].map(t => (
              <button key={t.id} onClick={() => setSessionType(t.id)} style={{
                padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
                background: sessionType === t.id ? DOMAINS.sport.color : (theme === "dark" ? "#1E1E22" : "#F7F7F8"),
                color: sessionType === t.id ? "#FFF" : (theme === "dark" ? "#A0A0AB" : "#666"),
                fontSize: "13px", fontWeight: "600", fontFamily: "'DM Sans', sans-serif"
              }}>{t.label}</button>
            ))}
          </div>

          <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Session name (optional)"
            style={{ ...inputStyle, marginBottom: "16px" }} />

          {sessionType === "strength" && (
            <div>
              <div style={{
                padding: "16px", borderRadius: "12px", marginBottom: "12px",
                background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
                border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 70px", gap: "8px", marginBottom: "10px" }}>
                  <input value={exName} onChange={e => setExName(e.target.value)} placeholder="Exercise" style={inputStyle} />
                  <input value={exSets} onChange={e => setExSets(e.target.value)} placeholder="Sets" type="number" style={inputStyle} />
                  <input value={exReps} onChange={e => setExReps(e.target.value)} placeholder="Reps" type="number" style={inputStyle} />
                  <input value={exWeight} onChange={e => setExWeight(e.target.value)} placeholder="kg" type="number" style={inputStyle} />
                </div>
                <button onClick={addExercise} style={{
                  padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
                  background: "#3B82F6", color: "#FFF", fontSize: "13px", fontWeight: "600",
                  fontFamily: "'DM Sans', sans-serif"
                }}>Add Exercise</button>
              </div>

              {exercises.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  {exercises.map((ex, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", padding: "10px 14px",
                      borderRadius: "8px", marginBottom: "4px",
                      background: theme === "dark" ? "#1A2E1A" : "#ECFDF5"
                    }}>
                      <span style={{ fontSize: "13px", color: theme === "dark" ? "#E0E0E5" : "#333", fontFamily: "'DM Sans', sans-serif" }}>
                        {ex.name}
                      </span>
                      <span style={{ fontSize: "13px", color: theme === "dark" ? "#A0A0AB" : "#666", fontFamily: "'Space Mono', monospace" }}>
                        {ex.sets}x{ex.reps} @ {ex.weight}kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {sessionType === "running" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'Space Mono', monospace", display: "block", marginBottom: "6px" }}>DISTANCE (km)</label>
                <input value={runDistance} onChange={e => setRunDistance(e.target.value)} type="number" step="0.1" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'Space Mono', monospace", display: "block", marginBottom: "6px" }}>TIME (min)</label>
                <input value={runTime} onChange={e => setRunTime(e.target.value)} type="number" style={inputStyle} />
              </div>
            </div>
          )}

          {sessionType === "other" && (
            <textarea value={otherDesc} onChange={e => setOtherDesc(e.target.value)} placeholder="Describe your session (padel, football, tennis...)"
              rows={3} style={{ ...inputStyle, marginBottom: "16px", resize: "vertical" }} />
          )}

          <button onClick={saveSession} style={{
            padding: "12px 24px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: "#10B981", color: "#FFF", fontSize: "14px", fontWeight: "700",
            fontFamily: "'DM Sans', sans-serif", width: "100%"
          }}>Save Session</button>
        </div>
      )}

      {activeView === "history" && (
        <div>
          {logs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: theme === "dark" ? "#4A4A54" : "#CCC", fontFamily: "'DM Sans', sans-serif" }}>
              No sessions logged yet. Start training!
            </div>
          )}
          {[...logs].reverse().map((session, i) => (
            <div key={i} style={{
              padding: "16px", borderRadius: "12px", marginBottom: "10px",
              background: theme === "dark" ? "#1E1E22" : "#FFF",
              border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif" }}>
                  {session.name}
                </span>
                <span style={{ fontSize: "12px", color: theme === "dark" ? "#4A4A54" : "#BBB", fontFamily: "'Space Mono', monospace" }}>
                  {session.date}
                </span>
              </div>
              {session.type === "strength" && session.exercises.map((ex, j) => (
                <div key={j} style={{ fontSize: "13px", color: theme === "dark" ? "#A0A0AB" : "#666", fontFamily: "'DM Sans', sans-serif", marginLeft: "8px" }}>
                  {ex.name} — {ex.sets}x{ex.reps} @ {ex.weight}kg
                </div>
              ))}
              {session.type === "running" && session.running && (
                <div style={{ fontSize: "13px", color: theme === "dark" ? "#A0A0AB" : "#666", fontFamily: "'DM Sans', sans-serif", marginLeft: "8px" }}>
                  {session.running.distance}km in {session.running.time}min — {session.running.time && session.running.distance ? (session.running.time / session.running.distance).toFixed(1) : "—"} min/km
                </div>
              )}
              {session.type === "other" && session.other && (
                <div style={{ fontSize: "13px", color: theme === "dark" ? "#A0A0AB" : "#666", fontFamily: "'DM Sans', sans-serif", marginLeft: "8px" }}>
                  {session.other}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeView === "progress" && (
        <div>
          {allExNames.length === 0 && runLogs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: theme === "dark" ? "#4A4A54" : "#CCC", fontFamily: "'DM Sans', sans-serif" }}>
              Log some sessions to see your progress.
            </div>
          )}

          {/* Strength Progress */}
          {allExNames.length > 0 && (
            <div style={{
              padding: "18px", borderRadius: "14px", marginBottom: "20px",
              background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
              border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
            }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", marginBottom: "12px", fontFamily: "'DM Sans', sans-serif" }}>
                Strength Progress
              </div>
              <select value={selectedEx} onChange={e => setSelectedEx(e.target.value)} style={{
                ...inputStyle, marginBottom: "14px"
              }}>
                <option value="">Select exercise...</option>
                {allExNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {selectedEx && (() => {
                const dataPoints = strengthLogs
                  .filter(l => l.exercises.some(e => e.name === selectedEx))
                  .map(l => {
                    const ex = l.exercises.find(e => e.name === selectedEx);
                    return { date: l.date, weight: ex.weight, volume: ex.sets * ex.reps * ex.weight };
                  });
                if (dataPoints.length === 0) return null;
                const maxW = Math.max(...dataPoints.map(d => d.weight));
                const minW = Math.min(...dataPoints.map(d => d.weight));
                const range = maxW - minW || 1;
                return (
                  <div>
                    <svg width="100%" height="160" viewBox={`0 0 ${Math.max(dataPoints.length * 60, 300)} 160`} style={{ overflow: "visible" }}>
                      {dataPoints.map((dp, i) => {
                        const x = i * 60 + 30;
                        const y = 140 - ((dp.weight - minW) / range) * 110;
                        return (
                          <g key={i}>
                            {i > 0 && (
                              <line
                                x1={(i - 1) * 60 + 30} y1={140 - ((dataPoints[i - 1].weight - minW) / range) * 110}
                                x2={x} y2={y}
                                stroke={DOMAINS.sport.color} strokeWidth="2"
                              />
                            )}
                            <circle cx={x} cy={y} r="5" fill={DOMAINS.sport.color} />
                            <text x={x} y={y - 12} textAnchor="middle" fontSize="11" fill={theme === "dark" ? "#A0A0AB" : "#666"} fontFamily="'Space Mono', monospace">
                              {dp.weight}kg
                            </text>
                            <text x={x} y="156" textAnchor="middle" fontSize="9" fill={theme === "dark" ? "#4A4A54" : "#BBB"} fontFamily="'Space Mono', monospace">
                              {dp.date.slice(5)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Running Progress */}
          {runLogs.length > 0 && (
            <div style={{
              padding: "18px", borderRadius: "14px",
              background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
              border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
            }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", marginBottom: "12px", fontFamily: "'DM Sans', sans-serif" }}>
                Running Progress
              </div>
              <svg width="100%" height="160" viewBox={`0 0 ${Math.max(runLogs.length * 60, 300)} 160`} style={{ overflow: "visible" }}>
                {runLogs.map((l, i) => {
                  const pace = l.running.time / (l.running.distance || 1);
                  const allPaces = runLogs.map(r => r.running.time / (r.running.distance || 1));
                  const maxP = Math.max(...allPaces);
                  const minP = Math.min(...allPaces);
                  const range = maxP - minP || 1;
                  const x = i * 60 + 30;
                  const y = 20 + ((pace - minP) / range) * 110; // Lower pace = higher on chart
                  return (
                    <g key={i}>
                      {i > 0 && (() => {
                        const prevPace = runLogs[i-1].running.time / (runLogs[i-1].running.distance || 1);
                        const prevY = 20 + ((prevPace - minP) / range) * 110;
                        return <line x1={(i-1)*60+30} y1={prevY} x2={x} y2={y} stroke="#3B82F6" strokeWidth="2" />;
                      })()}
                      <circle cx={x} cy={y} r="5" fill="#3B82F6" />
                      <text x={x} y={y - 12} textAnchor="middle" fontSize="11" fill={theme === "dark" ? "#A0A0AB" : "#666"} fontFamily="'Space Mono', monospace">
                        {pace.toFixed(1)}
                      </text>
                      <text x={x} y="156" textAnchor="middle" fontSize="9" fill={theme === "dark" ? "#4A4A54" : "#BBB"} fontFamily="'Space Mono', monospace">
                        {l.date.slice(5)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div style={{ fontSize: "11px", color: theme === "dark" ? "#4A4A54" : "#BBB", textAlign: "center", marginTop: "4px", fontFamily: "'Space Mono', monospace" }}>
                Pace (min/km) — lower is better
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Progress Tab ---
function ProgressTab({ xp, tasks, streaks, theme }) {
  const level = getLevel(xp || 0);

  // Build contribution calendar (last 90 days)
  const calendarData = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const dayTasks = tasks[key] || {};
    const total = Object.keys(dayTasks).length;
    const done = Object.values(dayTasks).filter(Boolean).length;
    const pct = total > 0 ? done / total : 0;
    calendarData.push({ date: key, pct, day: d.getDay(), total, done });
  }

  // Group by week for grid display
  const weeks = [];
  let currentWeek = [];
  calendarData.forEach((d, i) => {
    currentWeek.push(d);
    if (d.day === 6 || i === calendarData.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getColor = (pct) => {
    if (pct === 0) return theme === "dark" ? "#1E1E22" : "#EBEDF0";
    if (pct < 0.33) return theme === "dark" ? "#0E3A1F" : "#9BE9A8";
    if (pct < 0.66) return theme === "dark" ? "#1A6B3C" : "#40C463";
    if (pct < 1) return theme === "dark" ? "#27A04B" : "#30A14E";
    return theme === "dark" ? "#39D353" : "#216E39";
  };

  // Domain stats
  const domainDays = {};
  Object.keys(DOMAINS).forEach(d => { domainDays[d] = 0; });
  Object.values(tasks).forEach(dayTasks => {
    const done = Object.entries(dayTasks).filter(([, v]) => v);
    done.forEach(([key]) => {
      if (key.includes("English") || key.includes("TOEIC") || key.includes("Vocabulary") || key.includes("Grammar") || key.includes("Podcast") || key.includes("Conversation") || key.includes("Writing")) domainDays.english++;
      else if (key.includes("Training") || key.includes("Running") || key.includes("Sport") || key.includes("Padel")) domainDays.sport++;
      else if (key.includes("Finance") || key.includes("Excel") || key.includes("Swap") || key.includes("Rate") || key.includes("Market") || key.includes("Spreadsheet")) domainDays.finance++;
      else domainDays.reading++;
    });
  });

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", marginBottom: "24px" }}>
        Progress
      </h2>

      {/* Level Card */}
      <div style={{
        padding: "28px", borderRadius: "16px", marginBottom: "24px",
        background: theme === "dark"
          ? "linear-gradient(135deg, #1E1E22 0%, #111113 100%)"
          : "linear-gradient(135deg, #F7F7F8 0%, #FFFFFF 100%)",
        border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif" }}>
              Level {level.index + 1}
            </div>
            <div style={{ fontSize: "16px", color: theme === "dark" ? "#A0A0AB" : "#666", fontFamily: "'DM Sans', sans-serif" }}>
              {level.name}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#3B82F6", fontFamily: "'Space Mono', monospace" }}>
              {xp || 0}
            </div>
            <div style={{ fontSize: "12px", color: theme === "dark" ? "#4A4A54" : "#BBB", fontFamily: "'Space Mono', monospace" }}>
              TOTAL XP
            </div>
          </div>
        </div>
        <XPBar xp={xp || 0} theme={theme} />
      </div>

      {/* Streaks */}
      <div style={{
        padding: "20px", borderRadius: "14px", marginBottom: "24px",
        background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
        border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
      }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", marginBottom: "14px", fontFamily: "'DM Sans', sans-serif" }}>
          Active Streaks
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {Object.entries(DOMAINS).map(([key, d]) => (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "14px", borderRadius: "10px",
              background: theme === "dark" ? "#111113" : "#FFF"
            }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${d.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "18px", fontWeight: "700", color: d.color, fontFamily: "'Space Mono', monospace" }}>
                  {streaks[key] || 0}
                </span>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: theme === "dark" ? "#E0E0E5" : "#333", fontFamily: "'DM Sans', sans-serif" }}>
                  {d.label}
                </div>
                <div style={{ fontSize: "11px", color: theme === "dark" ? "#4A4A54" : "#BBB", fontFamily: "'Space Mono', monospace" }}>
                  {domainDays[key]} tasks done
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution Calendar */}
      <div style={{
        padding: "20px", borderRadius: "14px",
        background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
        border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
      }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", marginBottom: "14px", fontFamily: "'DM Sans', sans-serif" }}>
          Activity — Last 90 Days
        </div>
        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {calendarData.map((d, i) => (
            <div key={i} title={`${d.date}: ${d.done}/${d.total}`} style={{
              width: "14px", height: "14px", borderRadius: "3px",
              background: getColor(d.pct)
            }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "10px", justifyContent: "flex-end" }}>
          <span style={{ fontSize: "10px", color: theme === "dark" ? "#4A4A54" : "#BBB", fontFamily: "'Space Mono', monospace" }}>Less</span>
          {[0, 0.2, 0.5, 0.8, 1].map((p, i) => (
            <div key={i} style={{ width: "12px", height: "12px", borderRadius: "2px", background: getColor(p) }} />
          ))}
          <span style={{ fontSize: "10px", color: theme === "dark" ? "#4A4A54" : "#BBB", fontFamily: "'Space Mono', monospace" }}>More</span>
        </div>
      </div>
    </div>
  );
}

// --- Goals Tab ---
function GoalsTab({ goals, setGoals, theme }) {
  const [showAdd, setShowAdd] = useState(false);
  const [gName, setGName] = useState("");
  const [gDomain, setGDomain] = useState("english");
  const [gTarget, setGTarget] = useState("");
  const [gDeadline, setGDeadline] = useState("");
  const [gUnit, setGUnit] = useState("");

  const addGoal = () => {
    if (!gName) return;
    const goal = {
      id: Date.now().toString(),
      name: gName, domain: gDomain,
      target: Number(gTarget) || 100,
      current: 0, unit: gUnit || "pts",
      deadline: gDeadline,
      milestones: [],
      created: dateKey()
    };
    setGoals(prev => [...(prev || []), goal]);
    setGName(""); setGTarget(""); setGDeadline(""); setGUnit("");
    setShowAdd(false);
  };

  const updateProgress = (id, value) => {
    setGoals(prev => (prev || []).map(g => g.id === id ? { ...g, current: Number(value) } : g));
  };

  const removeGoal = (id) => {
    setGoals(prev => (prev || []).filter(g => g.id !== id));
  };

  const goalsList = goals || [];

  const inputStyle = {
    padding: "10px 14px", borderRadius: "8px",
    border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
    background: theme === "dark" ? "#111113" : "#FFF",
    color: theme === "dark" ? "#FFF" : "#111",
    fontSize: "13px", fontFamily: "'DM Sans', sans-serif", width: "100%"
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Long-term Goals
        </h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
          background: "#3B82F6", color: "#FFF", fontSize: "13px", fontWeight: "600",
          fontFamily: "'DM Sans', sans-serif"
        }}>
          + New Goal
        </button>
      </div>

      {showAdd && (
        <div style={{
          padding: "20px", borderRadius: "14px", marginBottom: "24px",
          background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
          border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input value={gName} onChange={e => setGName(e.target.value)} placeholder="Goal name (e.g., TOEIC 850)" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <select value={gDomain} onChange={e => setGDomain(e.target.value)} style={inputStyle}>
                {Object.entries(DOMAINS).map(([k, d]) => (
                  <option key={k} value={k}>{d.label}</option>
                ))}
              </select>
              <input value={gTarget} onChange={e => setGTarget(e.target.value)} placeholder="Target" type="number" style={inputStyle} />
              <input value={gUnit} onChange={e => setGUnit(e.target.value)} placeholder="Unit (pts, kg...)" style={inputStyle} />
            </div>
            <input type="date" value={gDeadline} onChange={e => setGDeadline(e.target.value)} style={inputStyle} />
            <button onClick={addGoal} style={{
              padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: "#10B981", color: "#FFF", fontSize: "13px", fontWeight: "600",
              fontFamily: "'DM Sans', sans-serif"
            }}>Create Goal</button>
          </div>
        </div>
      )}

      {goalsList.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px", color: theme === "dark" ? "#4A4A54" : "#CCC", fontFamily: "'DM Sans', sans-serif" }}>
          No goals yet. Set your first target.
        </div>
      )}

      {goalsList.map(goal => {
        const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
        const d = DOMAINS[goal.domain];
        const daysLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)) : null;
        return (
          <div key={goal.id} style={{
            padding: "20px", borderRadius: "14px", marginBottom: "12px",
            background: theme === "dark" ? "#1E1E22" : "#FFF",
            border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`,
            borderLeft: `4px solid ${d?.color || "#999"}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif" }}>
                  {goal.name}
                </div>
                <div style={{ fontSize: "12px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'DM Sans', sans-serif", marginTop: "2px" }}>
                  {d?.label}{daysLeft !== null ? ` — ${daysLeft} days remaining` : ""}
                </div>
              </div>
              <button onClick={() => removeGoal(goal.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: theme === "dark" ? "#4A4A54" : "#CCC", fontSize: "16px"
              }}>x</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
              <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: theme === "dark" ? "#2A2A2E" : "#E5E5E8" }}>
                <div style={{
                  height: "100%", borderRadius: "4px",
                  width: `${pct}%`,
                  background: pct >= 100 ? "#10B981" : d?.color || "#3B82F6",
                  transition: "width 0.4s"
                }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'Space Mono', monospace", minWidth: "44px" }}>
                {pct}%
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'Space Mono', monospace" }}>
                Current:
              </span>
              <input type="number" value={goal.current} onChange={e => updateProgress(goal.id, e.target.value)}
                style={{
                  width: "80px", padding: "6px 10px", borderRadius: "6px",
                  border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
                  background: theme === "dark" ? "#111113" : "#F7F7F8",
                  color: theme === "dark" ? "#FFF" : "#111",
                  fontSize: "13px", fontFamily: "'Space Mono', monospace"
                }} />
              <span style={{ fontSize: "12px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'Space Mono', monospace" }}>
                / {goal.target} {goal.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Notes Tab ---
function NotesTab({ notes, setNotes, theme }) {
  const [activeNote, setActiveNote] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const notesList = notes || [];

  const inputStyle = {
    padding: "10px 14px", borderRadius: "8px",
    border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
    background: theme === "dark" ? "#111113" : "#FFF",
    color: theme === "dark" ? "#FFF" : "#111",
    fontSize: "13px", fontFamily: "'DM Sans', sans-serif", width: "100%"
  };

  const createNote = () => {
    if (!newTitle.trim()) return;
    const note = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: "",
      created: dateKey(),
      updated: dateKey(),
    };
    setNotes(prev => [note, ...(prev || [])]);
    setNewTitle("");
    setShowNew(false);
    setActiveNote(note.id);
  };

  const updateNote = (id, field, value) => {
    setNotes(prev => (prev || []).map(n =>
      n.id === id ? { ...n, [field]: value, updated: dateKey() } : n
    ));
  };

  const deleteNote = (id) => {
    setNotes(prev => (prev || []).filter(n => n.id !== id));
    if (activeNote === id) setActiveNote(null);
  };

  const current = notesList.find(n => n.id === activeNote);

  // List view
  if (!activeNote) {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            Notes
          </h2>
          <button onClick={() => setShowNew(!showNew)} style={{
            padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: "#3B82F6", color: "#FFF", fontSize: "13px", fontWeight: "600",
            fontFamily: "'DM Sans', sans-serif"
          }}>
            + New Note
          </button>
        </div>

        {showNew && (
          <div style={{
            display: "flex", gap: "10px", marginBottom: "20px",
            padding: "16px", borderRadius: "12px",
            background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
            border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
          }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createNote()}
              placeholder="Note title..."
              autoFocus
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={createNote} style={{
              padding: "10px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: "#10B981", color: "#FFF", fontSize: "13px", fontWeight: "600",
              fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap"
            }}>Create</button>
          </div>
        )}

        {notesList.length === 0 && !showNew && (
          <div style={{ textAlign: "center", padding: "50px", color: theme === "dark" ? "#4A4A54" : "#CCC", fontFamily: "'DM Sans', sans-serif" }}>
            No notes yet. Create your first one.
          </div>
        )}

        {notesList.map(note => (
          <div key={note.id} onClick={() => setActiveNote(note.id)} style={{
            padding: "16px 18px", borderRadius: "12px", marginBottom: "8px", cursor: "pointer",
            background: theme === "dark" ? "#1E1E22" : "#FFFFFF",
            border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`,
            transition: "all 0.15s"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "15px", fontWeight: "600", color: theme === "dark" ? "#FFF" : "#111",
                  fontFamily: "'DM Sans', sans-serif", marginBottom: "4px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {note.title}
                </div>
                <div style={{
                  fontSize: "12px", color: theme === "dark" ? "#4A4A54" : "#BBB",
                  fontFamily: "'Space Mono', monospace"
                }}>
                  {note.updated} — {note.content ? note.content.slice(0, 60).replace(/\n/g, " ") + (note.content.length > 60 ? "..." : "") : "Empty note"}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} style={{
                background: "none", border: "none", cursor: "pointer",
                color: theme === "dark" ? "#3A3A40" : "#DDD", fontSize: "18px", padding: "4px 8px",
                flexShrink: 0
              }}>x</button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Editor view
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <button onClick={() => setActiveNote(null)} style={{
        background: "none", border: "none", cursor: "pointer",
        color: theme === "dark" ? "#6B6B76" : "#999", fontSize: "13px",
        fontFamily: "'DM Sans', sans-serif", padding: "0", marginBottom: "16px",
        display: "flex", alignItems: "center", gap: "6px"
      }}>
        <span style={{ fontSize: "16px" }}>&larr;</span> All Notes
      </button>

      <input value={current?.title || ""} onChange={e => updateNote(activeNote, "title", e.target.value)}
        style={{
          ...inputStyle, fontSize: "20px", fontWeight: "700", border: "none",
          background: "transparent", padding: "0 0 12px 0",
          borderBottom: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`,
          borderRadius: 0, marginBottom: "16px"
        }} />

      <textarea
        value={current?.content || ""}
        onChange={e => updateNote(activeNote, "content", e.target.value)}
        placeholder="Start writing..."
        style={{
          width: "100%", minHeight: "400px", padding: "16px",
          borderRadius: "12px", resize: "vertical",
          border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`,
          background: theme === "dark" ? "#1E1E22" : "#FFFFFF",
          color: theme === "dark" ? "#E0E0E5" : "#333",
          fontSize: "14px", lineHeight: "1.7",
          fontFamily: "'DM Sans', sans-serif",
          outline: "none"
        }}
      />

      <div style={{
        marginTop: "12px", fontSize: "11px",
        color: theme === "dark" ? "#4A4A54" : "#BBB",
        fontFamily: "'Space Mono', monospace"
      }}>
        Last updated: {current?.updated}
      </div>
    </div>
  );
}

// --- Settings Tab ---
function SettingsTab({ theme, setTheme, settings, setSettings, weekPlan }) {
  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", marginBottom: "24px" }}>
        Settings
      </h2>

      {/* Theme Toggle */}
      <div style={{
        padding: "18px", borderRadius: "14px", marginBottom: "14px",
        background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
        border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif" }}>
            Dark Mode
          </div>
          <div style={{ fontSize: "12px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'DM Sans', sans-serif" }}>
            Toggle between light and dark theme
          </div>
        </div>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{
          width: "52px", height: "28px", borderRadius: "14px", border: "none", cursor: "pointer",
          background: theme === "dark" ? "#3B82F6" : "#E5E5E8",
          position: "relative", transition: "background 0.2s"
        }}>
          <div style={{
            width: "22px", height: "22px", borderRadius: "11px",
            background: "#FFF",
            position: "absolute", top: "3px",
            left: theme === "dark" ? "27px" : "3px",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
          }} />
        </button>
      </div>

      {/* Start Date */}
      <div style={{
        padding: "18px", borderRadius: "14px", marginBottom: "14px",
        background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
        border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
      }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", marginBottom: "8px" }}>
          Journey Start Date
        </div>
        <div style={{ fontSize: "12px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'DM Sans', sans-serif", marginBottom: "10px" }}>
          When your program officially begins
        </div>
        <input type="date" value={settings?.startDate || "2026-04-20"}
          onChange={e => setSettings(prev => ({ ...(prev || {}), startDate: e.target.value }))}
          style={{
            padding: "10px 14px", borderRadius: "8px",
            border: `1px solid ${theme === "dark" ? "#3A3A40" : "#DDD"}`,
            background: theme === "dark" ? "#111113" : "#FFF",
            color: theme === "dark" ? "#FFF" : "#111",
            fontSize: "13px", fontFamily: "'DM Sans', sans-serif"
          }} />
      </div>

      {/* Export */}
      <div style={{
        padding: "18px", borderRadius: "14px",
        background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
        border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
      }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", marginBottom: "8px" }}>
          Calendar Export
        </div>
        <div style={{ fontSize: "12px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'DM Sans', sans-serif", marginBottom: "12px" }}>
          Export your weekly schedule as .ics file for Google Calendar notifications
        </div>
        <button onClick={() => {
          // Generate ICS
          const plan = {};
          for (let day = 0; day < 7; day++) {
            const base = DEFAULT_WEEK_TEMPLATE[day] || { morning: [], afternoon: [], evening: [] };
            const override = weekPlan[day];
            plan[day] = override ? {
              morning: override.morning !== undefined ? override.morning : base.morning,
              afternoon: override.afternoon !== undefined ? override.afternoon : base.afternoon,
              evening: override.evening !== undefined ? override.evening : base.evening,
            } : base;
          }
          let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Momentum//EN\n";
          const blockTimes = { morning: "0900", afternoon: "1400", evening: "2000" };
          const now = new Date();
          for (let i = 0; i < 7; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + ((i + 1 - d.getDay() + 7) % 7) + (i + 1 <= d.getDay() ? 7 : 0));
            const dayPlan = plan[d.getDay()] || {};
            Object.entries(dayPlan).forEach(([block, tasks]) => {
              if (tasks.length > 0) {
                const ds = d.toISOString().slice(0, 10).replace(/-/g, "");
                ics += `BEGIN:VEVENT\nDTSTART:${ds}T${blockTimes[block]}00\nDTSTAMP:${ds}T${blockTimes[block]}00\nDURATION:PT2H\nSUMMARY:${block.charAt(0).toUpperCase() + block.slice(1)}: ${tasks.join(", ")}\nBEGIN:VALARM\nTRIGGER:-PT15M\nACTION:DISPLAY\nEND:VALARM\nEND:VEVENT\n`;
              }
            });
          }
          ics += "END:VCALENDAR";
          const blob = new Blob([ics], { type: "text/calendar" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "momentum-schedule.ics";
          a.click();
          URL.revokeObjectURL(url);
        }} style={{
          padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
          background: "#3B82F6", color: "#FFF", fontSize: "13px", fontWeight: "600",
          fontFamily: "'DM Sans', sans-serif"
        }}>
          Download .ics File
        </button>
      </div>

      {/* Data Backup */}
      <div style={{
        padding: "18px", borderRadius: "14px", marginTop: "14px",
        background: theme === "dark" ? "#1E1E22" : "#F7F7F8",
        border: `1px solid ${theme === "dark" ? "#2A2A2E" : "#E5E5E8"}`
      }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: theme === "dark" ? "#FFF" : "#111", fontFamily: "'DM Sans', sans-serif", marginBottom: "8px" }}>
          Data Backup
        </div>
        <div style={{ fontSize: "12px", color: theme === "dark" ? "#6B6B76" : "#999", fontFamily: "'DM Sans', sans-serif", marginBottom: "14px" }}>
          Export all your data as a backup file, or restore from a previous backup. Do this regularly to avoid losing your progress.
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => {
            const backup = {};
            Object.values(STORAGE_KEYS).forEach(key => {
              try {
                const val = localStorage.getItem(key);
                if (val) backup[key] = JSON.parse(val);
              } catch (e) {}
            });
            backup._exportDate = new Date().toISOString();
            backup._version = "1.0";
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `momentum-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }} style={{
            padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: "#10B981", color: "#FFF", fontSize: "13px", fontWeight: "600",
            fontFamily: "'DM Sans', sans-serif"
          }}>
            Export Backup
          </button>
          <label style={{
            padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
            background: theme === "dark" ? "#2A2A2E" : "#E5E5E8",
            color: theme === "dark" ? "#FFF" : "#111",
            fontSize: "13px", fontWeight: "600",
            fontFamily: "'DM Sans', sans-serif",
            display: "inline-flex", alignItems: "center"
          }}>
            Import Backup
            <input type="file" accept=".json" style={{ display: "none" }} onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const data = JSON.parse(ev.target.result);
                  if (!data._version) {
                    alert("Invalid backup file.");
                    return;
                  }
                  const confirmed = window.confirm("This will replace ALL your current data with the backup. Are you sure?");
                  if (!confirmed) return;
                  Object.values(STORAGE_KEYS).forEach(key => {
                    if (data[key] !== undefined) {
                      localStorage.setItem(key, JSON.stringify(data[key]));
                    }
                  });
                  window.location.reload();
                } catch (err) {
                  alert("Error reading backup file. Make sure it's a valid Momentum backup.");
                }
              };
              reader.readAsText(file);
              e.target.value = "";
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function Momentum() {
  const [tab, setTab] = useState("today");
  const [theme, setTheme] = useState("dark");
  const [tasks, setTasks, tasksLoaded] = useStorage(STORAGE_KEYS.TASKS, {});
  const [xp, setXP, xpLoaded] = useStorage(STORAGE_KEYS.XP, 0);
  const [streaks, setStreaks, streaksLoaded] = useStorage(STORAGE_KEYS.STREAKS, {});
  const [goals, setGoals, goalsLoaded] = useStorage(STORAGE_KEYS.GOALS, []);
  const [weekPlan, setWeekPlan, wpLoaded] = useStorage(STORAGE_KEYS.WEEK_PLAN, {});
  const [vacation, setVacation, vacLoaded] = useStorage(STORAGE_KEYS.VACATION, {});
  const [sportLog, setSportLog, slLoaded] = useStorage(STORAGE_KEYS.SPORT_LOG, []);
  const [notes, setNotes, notesLoaded] = useStorage(STORAGE_KEYS.NOTES, []);
  const [settings, setSettings, settLoaded] = useStorage(STORAGE_KEYS.SETTINGS, { startDate: "2026-04-20" });

  const loaded = tasksLoaded && xpLoaded && streaksLoaded && goalsLoaded && wpLoaded && vacLoaded && slLoaded && notesLoaded && settLoaded;

  if (!loaded) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0A0A0B", color: "#FFF", fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-0.02em" }}>MOMENTUM</div>
          <div style={{ fontSize: "13px", color: "#6B6B76", marginTop: "8px" }}>Loading your data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: theme === "dark" ? "#0A0A0B" : "#FAFAFA",
      color: theme === "dark" ? "#FFF" : "#111",
      fontFamily: "'DM Sans', sans-serif",
      transition: "background 0.3s, color 0.3s"
    }}>
      {/* Fonts loaded via index.html */}

      {/* Header */}
      <header style={{
        padding: "20px 24px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: "800px", margin: "0 auto"
      }}>
        <div style={{
          fontSize: "20px", fontWeight: "700", letterSpacing: "0.08em",
          fontFamily: "'Space Mono', monospace",
          color: theme === "dark" ? "#FFF" : "#111"
        }}>
          MOMENTUM
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            fontSize: "12px", color: theme === "dark" ? "#4A4A54" : "#BBB",
            fontFamily: "'Space Mono', monospace"
          }}>
            {formatDate(new Date())}
          </div>
          <button onClick={() => setTab(tab === "settings" ? "today" : "settings")} style={{
            background: "none", border: "none", cursor: "pointer", padding: "4px",
            color: tab === "settings" ? "#3B82F6" : (theme === "dark" ? "#6B6B76" : "#999"),
            transition: "color 0.2s", display: "flex", alignItems: "center"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Navigation */}
      <div style={{ padding: "0 16px 24px", maxWidth: "800px", margin: "0 auto" }}>
        <Nav tab={tab} setTab={setTab} theme={theme} />
      </div>

      {/* Content */}
      <main style={{ padding: "0 20px 40px", maxWidth: "800px", margin: "0 auto" }}>
        {tab === "today" && <TodayTab tasks={tasks} setTasks={setTasks} xp={xp} setXP={setXP} streaks={streaks} setStreaks={setStreaks} weekPlan={weekPlan} vacation={vacation} theme={theme} />}
        {tab === "week" && <WeekTab weekPlan={weekPlan} setWeekPlan={setWeekPlan} vacation={vacation} setVacation={setVacation} theme={theme} />}
        {tab === "training" && <TrainingTab sportLog={sportLog} setSportLog={setSportLog} theme={theme} />}
        {tab === "progress" && <ProgressTab xp={xp} tasks={tasks} streaks={streaks} theme={theme} />}
        {tab === "goals" && <GoalsTab goals={goals} setGoals={setGoals} theme={theme} />}
        {tab === "notes" && <NotesTab notes={notes} setNotes={setNotes} theme={theme} />}
        {tab === "settings" && <SettingsTab theme={theme} setTheme={setTheme} settings={settings} setSettings={setSettings} weekPlan={weekPlan} />}
      </main>
    </div>
  );
}

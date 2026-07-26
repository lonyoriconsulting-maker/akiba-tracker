import React, { useState, useEffect, useMemo } from "react";

// ---- design tokens ----
// bg: #10201F | surface: #17302D | surface-alt: #1E3B37
// gold: #C99A44 | teal: #4FA8A0 | cream: #EDE7D9 | muted: #93A6A1
// rust (expense): #B8613D | green (goal met): #74B187

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700&display=swap');`;

const fmt = (n) =>
  "TSh " + Math.round(n || 0).toLocaleString("en-US");

const todayISO = () => new Date().toISOString().slice(0, 10);

const CATEGORY_META = {
  essentials: { label: "Mahitaji (Essentials)", color: "#4FA8A0" },
  invest: { label: "Uwekezaji (Invest)", color: "#C99A44" },
  emergency: { label: "Dharura (Emergency)", color: "#8C6FB0" },
  freedom: { label: "Uhuru (Freedom fund)", color: "#74B187" },
  other: { label: "Nyingine (Other)", color: "#93A6A1" },
};

function Jar({ label, sublabel, pct, color, amount, goal }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 130 }}>
      <div
        style={{
          position: "relative",
          width: 76,
          height: 128,
          background: "#0D1B19",
          border: "2px solid #2A4643",
          borderRadius: "10px 10px 16px 16px",
          overflow: "hidden",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${clamped}%`,
            background: `linear-gradient(180deg, ${color}CC, ${color})`,
            transition: "height 0.6s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 11,
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            color: clamped > 80 ? "#0D1B19" : "#EDE7D9",
          }}
        >
          {Math.round(clamped)}%
        </div>
      </div>
      <div style={{ marginTop: 8, textAlign: "center" }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12.5, color: "#EDE7D9" }}>
          {label}
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10.5, color: "#93A6A1", marginTop: 1 }}>
          {sublabel}
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10.5, color: "#93A6A1", marginTop: 1 }}>
          {fmt(amount)} / {fmt(goal)}
        </div>
      </div>
    </div>
  );
}

export default function AkibaTracker() {
  const [loading, setLoading] = useState(true);
  const [dailyIncome, setDailyIncome] = useState(12000);
  const [workDays, setWorkDays] = useState(30);
  const [entries, setEntries] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  const [formType, setFormType] = useState("income");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("essentials");
  const [formNote, setFormNote] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get("akiba:settings");
        if (s && s.value) {
          const parsed = JSON.parse(s.value);
          if (parsed.dailyIncome) setDailyIncome(parsed.dailyIncome);
          if (parsed.workDays) setWorkDays(parsed.workDays);
        }
      } catch (e) {}
      try {
        const e = await window.storage.get("akiba:entries");
        if (e && e.value) setEntries(JSON.parse(e.value));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const saveSettings = async (next) => {
    try {
      await window.storage.set("akiba:settings", JSON.stringify(next));
    } catch (e) {}
  };

  const saveEntries = async (next) => {
    try {
      await window.storage.set("akiba:entries", JSON.stringify(next));
    } catch (e) {}
  };

  const monthlyIncome = dailyIncome * workDays;
  const essentialsTarget = monthlyIncome * 0.55;
  const investTarget = monthlyIncome * 0.1;
  const emergencyGoal = monthlyIncome * 4;
  const freedomGoal = monthlyIncome * 200;

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const isThisMonth = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${dt.getMonth()}` === thisMonthKey;
  };

  const totals = useMemo(() => {
    const t = { essentials: 0, invest: 0, emergency: 0, freedom: 0, other: 0, income: 0, expense: 0 };
    entries.forEach((e) => {
      if (e.kind === "income") {
        t.income += e.amount;
      } else {
        t.expense += e.amount;
        if (isThisMonth(e.date) || e.category === "emergency" || e.category === "freedom") {
          t[e.category] = (t[e.category] || 0) + e.amount;
        }
      }
    });
    return t;
  }, [entries]);

  const essentialsSpentThisMonth = useMemo(
    () =>
      entries
        .filter((e) => e.kind === "expense" && e.category === "essentials" && isThisMonth(e.date))
        .reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const investedThisMonth = useMemo(
    () =>
      entries
        .filter((e) => e.kind === "expense" && e.category === "invest" && isThisMonth(e.date))
        .reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const emergencySaved = totals.emergency;
  const freedomSaved = totals.freedom;

  const addEntry = async () => {
    const amt = parseFloat(formAmount);
    if (!amt || amt <= 0) return;
    const entry = {
      id: Date.now().toString(),
      kind: formType,
      amount: amt,
      category: formType === "income" ? "income" : formCategory,
      note: formNote,
      date: todayISO(),
    };
    const next = [entry, ...entries];
    setEntries(next);
    await saveEntries(next);
    setFormAmount("");
    setFormNote("");
  };

  const deleteEntry = async (id) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    await saveEntries(next);
  };

  const balance = totals.income - totals.expense;

  if (loading) {
    return (
      <div style={{ background: "#10201F", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#93A6A1", fontFamily: "Inter, sans-serif" }}>
        <style>{FONT_IMPORT}</style>
        Inapakia...
      </div>
    );
  }

  return (
    <div style={{ background: "#10201F", minHeight: "100vh", fontFamily: "Inter, sans-serif", color: "#EDE7D9" }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 60px" }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 30, letterSpacing: "0.5px", color: "#EDE7D9" }}>
            Akiba
          </div>
          <div style={{ fontSize: 12.5, color: "#93A6A1", marginTop: 2 }}>
            Fedha yako, mpango wako — kila siku hesabu inasogea.
          </div>
        </div>

        {/* Balance strip */}
        <div
          style={{
            background: "#17302D",
            border: "1px solid #2A4643",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#93A6A1" }}>Salio (Balance)</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: balance >= 0 ? "#74B187" : "#B8613D" }}>
              {fmt(balance)}
            </div>
          </div>
          <button
            onClick={() => setShowSettings((s) => !s)}
            style={{
              background: "transparent",
              border: "1px solid #2A4643",
              color: "#93A6A1",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 11.5,
              cursor: "pointer",
            }}
          >
            Mipangilio
          </button>
        </div>

        {showSettings && (
          <div style={{ background: "#1E3B37", borderRadius: 12, padding: 14, marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, color: "#93A6A1", marginBottom: 8 }}>
              Kipato cha kila siku (Daily income) na siku za kazi kwa mwezi (work days/month) hutumika kukokotoa malengo yako.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <label style={{ flex: 1, fontSize: 11 }}>
                Kila siku (TSh)
                <input
                  type="number"
                  value={dailyIncome}
                  onChange={(e) => setDailyIncome(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveSettings({ dailyIncome, workDays })}
                  style={inputStyle}
                />
              </label>
              <label style={{ flex: 1, fontSize: 11 }}>
                Siku za kazi/mwezi
                <input
                  type="number"
                  value={workDays}
                  onChange={(e) => setWorkDays(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveSettings({ dailyIncome, workDays })}
                  style={inputStyle}
                />
              </label>
            </div>
            <div style={{ fontSize: 11, color: "#93A6A1" }}>
              Kipato cha mwezi kinachokadiriwa: <b style={{ color: "#EDE7D9" }}>{fmt(monthlyIncome)}</b>
            </div>
          </div>
        )}

        {/* Jars */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <Jar
            label="Mahitaji"
            sublabel="mwezi huu"
            pct={essentialsTarget ? (essentialsSpentThisMonth / essentialsTarget) * 100 : 0}
            color={CATEGORY_META.essentials.color}
            amount={essentialsSpentThisMonth}
            goal={essentialsTarget}
          />
          <Jar
            label="Uwekezaji"
            sublabel="mwezi huu"
            pct={investTarget ? (investedThisMonth / investTarget) * 100 : 0}
            color={CATEGORY_META.invest.color}
            amount={investedThisMonth}
            goal={investTarget}
          />
          <Jar
            label="Dharura"
            sublabel="lengo la jumla"
            pct={emergencyGoal ? (emergencySaved / emergencyGoal) * 100 : 0}
            color={CATEGORY_META.emergency.color}
            amount={emergencySaved}
            goal={emergencyGoal}
          />
          <Jar
            label="Uhuru"
            sublabel="badilisha kipato"
            pct={freedomGoal ? (freedomSaved / freedomGoal) * 100 : 0}
            color={CATEGORY_META.freedom.color}
            amount={freedomSaved}
            goal={freedomGoal}
          />
        </div>

        {/* Entry form */}
        <div style={{ background: "#17302D", border: "1px solid #2A4643", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["income", "expense"].map((k) => (
              <button
                key={k}
                onClick={() => setFormType(k)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "1px solid " + (formType === k ? "#C99A44" : "#2A4643"),
                  background: formType === k ? "#C99A4422" : "transparent",
                  color: formType === k ? "#C99A44" : "#93A6A1",
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: "pointer",
                }}
              >
                {k === "income" ? "Mapato (Income)" : "Matumizi (Expense)"}
              </button>
            ))}
          </div>

          <input
            type="number"
            placeholder="Kiasi (Amount, TSh)"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            style={{ ...inputStyle, width: "100%", marginTop: 0, marginBottom: 8 }}
          />

          {formType === "expense" && (
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
            >
              {Object.entries(CATEGORY_META)
                .filter(([k]) => k !== "income")
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Maelezo (note, optional)"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: 10 }}
          />

          <button
            onClick={addEntry}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: "#C99A44",
              color: "#10201F",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Ongeza (Add)
          </button>
        </div>

        {/* Transaction log */}
        <div>
          <div style={{ fontSize: 12.5, color: "#93A6A1", marginBottom: 8, fontWeight: 600 }}>
            Historia ya hivi karibuni (Recent)
          </div>
          {entries.length === 0 && (
            <div style={{ fontSize: 12, color: "#5C716D", padding: "12px 0" }}>
              Bado hujaongeza kitu. Anza kwa kuongeza mapato ya leo.
            </div>
          )}
          {entries.slice(0, 25).map((e) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 0",
                borderBottom: "1px solid #1E3B37",
              }}
            >
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                  {e.kind === "income" ? "Mapato" : CATEGORY_META[e.category]?.label || e.category}
                  {e.note ? " · " + e.note : ""}
                </div>
                <div style={{ fontSize: 10.5, color: "#5C716D" }}>{e.date}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: e.kind === "income" ? "#74B187" : "#B8613D",
                  }}
                >
                  {e.kind === "income" ? "+" : "-"}
                  {fmt(e.amount)}
                </div>
                <button
                  onClick={() => deleteEntry(e.id)}
                  style={{ background: "none", border: "none", color: "#5C716D", cursor: "pointer", fontSize: 14 }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block",
  marginTop: 4,
  background: "#0D1B19",
  border: "1px solid #2A4643",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#EDE7D9",
  fontSize: 12.5,
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
};

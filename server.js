// ESCC Adult Social Care debt recovery demo. All people, figures and systems are fictitious.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { TODAY, EXTRACT, ACCOUNTS, LAS, CC_NOTES, DDFORMS, CALLS } = require("./data");
const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(__dirname, "state.json");
const VERSION = 1;
const CUR = { notes: true };
const SYSTEM = process.env.SYSTEM || "all";
const DEF = { las: "https://escc-las.onrender.com", cc: "https://escc-controcc.onrender.com", ora: "https://escc-oracle.onrender.com", docs: "https://escc-sharepoint.onrender.com" };
const BASE = {};
["las", "cc", "ora", "docs"].forEach(k => { BASE[k] = SYSTEM === "all" ? "" : (process.env[k.toUpperCase() + "_URL"] || DEF[k]); });
const L = (sys, p) => BASE[sys] + p;
const PREFIX = { las: "/las", cc: "/controcc", ora: "/oracle", docs: "/docs" };

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const gbp = n => "£" + Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = iso => { if (!iso) return "-"; const d = new Date(String(iso).slice(0, 10) + "T00:00:00Z"); return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }); };
const dayDiff = (a, b) => Math.round((new Date(String(b).slice(0, 10)) - new Date(String(a).slice(0, 10))) / 86400000);
const addDays = (iso, n) => new Date(new Date(iso + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);
const nowStamp = () => TODAY + " " + new Date().toISOString().slice(11, 16);
const ageOf = dob => Math.floor((new Date(TODAY) - new Date(dob)) / 31557600000);
const acct = k => ACCOUNTS.find(a => a.key === k);
const accByCC = id => ACCOUNTS.find(a => a.cc === id);

// ---------- dynamic state ----------
let S;
function seedState() {
  const notes = {};
  ACCOUNTS.forEach(a => {
    const arr = [];
    if (a.last.type !== "None" && a.last.type !== "Revenue referral") arr.push({ date: a.last.date, by: "Accounts Receivable", text: a.last.type + " letter issued." });
    if (a.block) arr.push({ date: a.block.date, by: a.block.by, text: "Invoice block applied (" + a.block.type + "). " + a.block.text });
    (CC_NOTES[a.key] || []).forEach(n => arr.push(n));
    arr.sort((x, y) => y.date.localeCompare(x.date));
    notes[a.cc] = arr;
  });
  return { version: VERSION, notes, panels: [], mandates: [], audit: [], seq: 1 };
}
function load() { try { S = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); if (S.version !== VERSION) throw 0; } catch { S = seedState(); save(); } }
function save() { try { fs.writeFileSync(STATE_FILE, JSON.stringify(S)); } catch { } }
function audit(sys, text) { S.audit.unshift({ t: nowStamp(), sys, text }); save(); }

// ---------- derived data ----------
const receiptsFor = a => {
  const r = [];
  if (a.lastPay) r.push({ date: a.lastPay.date, amt: a.lastPay.amt, how: a.plan ? "Bank transfer (plan)" : "Card / BACS" });
  if (a.key === "brightwell") r.unshift({ date: "2026-11-07", amt: 600, how: "BACS (posted to Oracle after the 6 Nov arrears extract)" });
  if (a.plan && a.plan.status === "Active") { r.push({ date: "2026-10-01", amt: 50, how: "Bank transfer (plan)" }); r.push({ date: "2026-09-01", amt: 50, how: "Bank transfer (plan)" }); }
  return r.sort((x, y) => y.date.localeCompare(x.date));
};
const invoicesFor = a => {
  if (a.out <= 0) return [];
  const per = Math.max(a.weekly * 4, 100);
  const k = Math.max(1, Math.round(a.out / per));
  const inv = []; let rem = Math.round(a.out * 100);
  for (let i = 0; i < k; i++) {
    const amt = i === k - 1 ? rem : Math.round((a.out * 100) / k);
    rem -= amt;
    inv.push({ no: "INV-" + a.ar.slice(3) + "-" + String(i + 1).padStart(2, "0"), due: addDays(a.oldest, 28 * i), amt: amt / 100 });
  }
  return inv;
};
const daysOverdue = a => dayDiff(a.oldest, TODAY);

// ---------- UI ----------
const note = (k, t, b) => CUR.notes ? `<div class="dn ${k}"><b class="t">${{ wait: "&#9203; Waiting for", limit: "&#9888; Limitation", fast: "&#9889; Faster with Cowork" }[k]} ${esc(t)}</b><span>${b}</span></div>` : "";
const T = (h, rows, cls) => `<table class="${cls || ""}"><thead><tr>${h.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const KV = rows => `<table class="kv"><tbody>${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</tbody></table>`;
const pill = (t, c) => `<span class="pill ${c || ""}">${esc(t)}</span>`;

const CSS = `*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",Arial,sans-serif;font-size:14px;color:#222;background:#f3f4f6}
a{color:#0b5cad}.demo{background:#111;color:#ddd;font-size:12px;padding:5px 14px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}.demo a{color:#9fd0ff}
.demo b{color:#ffd24d}.wrap{padding:18px 22px;max-width:1280px}h1{font-size:21px;margin:4px 0 10px}h2{font-size:16px;margin:18px 0 8px}
table{border-collapse:collapse;width:100%;background:#fff;margin:6px 0 12px}th,td{border:1px solid #d9dde3;padding:6px 9px;text-align:left;vertical-align:top;font-size:13px}
th{background:#eef1f5;font-weight:600}table.kv th{width:240px}.card{background:#fff;border:1px solid #d9dde3;border-radius:4px;padding:12px 16px;margin:10px 0}
input,select,textarea{font:inherit;padding:5px 7px;border:1px solid #9aa4b2;border-radius:3px;width:100%}textarea{min-height:90px}label{display:block;margin:8px 0 3px;font-weight:600;font-size:13px}
button,.btn{background:#0b5cad;color:#fff;border:0;border-radius:3px;padding:8px 16px;font:inherit;cursor:pointer;text-decoration:none;display:inline-block;margin-top:10px}
.btn.green{background:#1e7e34}.btn.red{background:#b3261e}.btn.grey{background:#6b7280}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;border:1px solid #bbb;background:#f5f5f5}.pill.red{background:#fde8e8;border-color:#e8a5a5;color:#8b1a1a}
.pill.amber{background:#fff4d6;border-color:#e6c46a;color:#7a5200}.pill.green{background:#e2f4e6;border-color:#8fcf9d;color:#17602b}.pill.blue{background:#e1eefb;border-color:#9cc3ee;color:#0b4a8a}
.dn{margin:8px 0;padding:7px 11px;border-left:5px solid;border-radius:3px;font-size:12.5px}.dn .t{display:block;margin-bottom:2px}
.dn.wait{background:#fff6e5;border-color:#d98200;color:#6b4200}.dn.limit{background:#f3effb;border-color:#6e4bb8;color:#3f2a73}.dn.fast{background:#eaf6ec;border-color:#1e8a3c;color:#145226}
.small{font-size:12px;color:#555}.alert{background:#fde8e8;border:1px solid #e8a5a5;color:#7a1414;padding:8px 12px;border-radius:3px;margin:8px 0}
.ok{background:#e2f4e6;border:1px solid #8fcf9d;color:#17602b;padding:8px 12px;border-radius:3px;margin:8px 0}.err{background:#fde8e8;border:1px solid #e8a5a5;color:#7a1414;padding:8px 12px;border-radius:3px;margin:8px 0}`;

const SYS = {
  home: { name: "ESCC ASC debt recovery demo", css: "", nav: [] },
  las: { name: "Liquidlogic Adults (LAS)", css: ".top{background:#0a5c7a}.top .lg{color:#fff}.sub{background:#e6f1f5}", nav: [["/las", "People"]] },
  cc: { name: "Liquidlogic Social Care Finance (ContrOCC)", css: ".top{background:#1b2f55}.top .lg{color:#fff}.sub{background:#e4e9f2}", nav: [["/controcc", "Home"], ["/controcc/overdue", "Recovery work queue"], ["/controcc/panels", "Debt Panel papers"], ["/audit", "Audit log"]] },
  ora: { name: "Oracle Fusion Cloud Receivables", css: ".top{background:#312d2a;border-bottom:4px solid #c74634}.top .lg{color:#fff}.sub{background:#ece8e4}", nav: [["/oracle", "Home"], ["/oracle/customers", "Customer balances"], ["/oracle/mandates", "Direct Debit mandates"], ["/oracle/approvals", "Approvals"], ["/audit", "Audit log"]] },
  docs: { name: "SharePoint - ASC Debt Recovery", css: ".top{background:#036c70}.top .lg{color:#fff}.sub{background:#e3f1f1}", nav: [["/docs", "Documents"]] },
  audit: { name: "Demo audit log", css: ".top{background:#444}.top .lg{color:#fff}.sub{background:#eee}", nav: [] },
};
function shell(sys, title, body) {
  const s = SYS[sys];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} - ${esc(s.name)}</title><style>${CSS}${s.css}
.top{padding:10px 20px;display:flex;align-items:center;gap:22px}.top .lg{font-weight:700;font-size:16px}.sub{padding:7px 20px;display:flex;gap:18px;font-size:13px}.sub a{text-decoration:none;font-weight:600}</style></head><body>
<div class="demo"><b>DEMONSTRATION. Fictitious people and data. Not connected to East Sussex County Council systems.</b><span>Demo date: ${fmtD(TODAY)}</span>
<a href="${L("las","/")}">Demo home</a><a href="${L("las","/las")}">LAS</a><a href="${L("cc","/controcc")}">ContrOCC</a><a href="${L("ora","/oracle")}">Oracle</a><a href="${L("docs","/docs")}">Documents</a>
<a href="/notes/toggle">${CUR.notes ? "Hide" : "Show"} demo notes</a></div>
<div class="top"><span class="lg">${esc(s.name)}</span></div>${s.nav.length ? `<div class="sub">${s.nav.map(n => `<a href="${n[0]}">${n[1]}</a>`).join("")}</div>` : ""}
<div class="wrap">${body}</div></body></html>`;
}

// ---------- routes ----------
const routes = {};
const R = (m, p, f) => { routes[m + " " + p] = f; };
const parseBody = req => new Promise(res => { let d = ""; req.on("data", c => d += c); req.on("end", () => { const o = {}; new URLSearchParams(d).forEach((v, k) => o[k] = v); res(o); }); });
const html = (res, h, code = 200) => { res.writeHead(code, { "Content-Type": "text/html; charset=utf-8" }); res.end(h); };
const go = (res, to) => { res.writeHead(303, { Location: to }); res.end(); return null; };

R("GET", "/", () => ["home", "Home", `<h1>East Sussex County Council: Adult Social Care debt recovery (demo)</h1>
<p>A practice environment for showing Copilot Cowork working across the systems used in ASC debt recovery. Everything here is invented.</p>
<div class="grid2"><div class="card"><h2>Systems</h2><ul>
<li><a href="${L("las","/las")}">Liquidlogic Adults (LAS)</a>: case record, capacity, alerts, representatives, funding, notes (read only)</li>
<li><a href="${L("cc","/controcc")}">Liquidlogic Social Care Finance (ContrOCC)</a>: charges, invoices, recovery queue, activity log</li>
<li><a href="${L("ora","/oracle")}">Oracle Receivables</a>: customer ledger, receipts, Direct Debit mandates and approvals</li>
<li><a href="${L("docs","/docs")}">SharePoint documents</a>: Direct Debit forms received, call transcripts</li>
<li>Audit log: on the ContrOCC and Oracle sites (every write made during the demo)</li></ul></div>
<div class="card"><h2>Reset</h2><p>Puts the demo back to the start (clears notes, Debt Panel papers and Direct Debit mandates).</p><form method="post" action="/reset"><button class="btn red">Reset demo data</button></form>
<p class="small">Free hosting can sleep. If the first load is slow, wait a minute and refresh.</p></div></div>`]);
R("POST", "/reset", async (req, res) => {
  S = seedState(); audit("Demo", "Demo data reset.");
  if (SYSTEM !== "all") await Promise.all(["las", "cc", "ora", "docs"].filter(k => k !== SYSTEM).map(k => fetch(BASE[k] + "/reset-local", { method: "POST" }).catch(() => { })));
  return go(res, "/");
});
R("POST", "/reset-local", async (req, res) => { S = seedState(); audit("Demo", "Demo data reset."); res.writeHead(200); res.end("ok"); return null; });
R("GET", "/notes/toggle", (req, res) => { CUR.notes = !CUR.notes; return go(res, req.headers.referer ? new URL(req.headers.referer).pathname : "/"); });

// ----- LAS -----
R("GET", "/las", () => {
  const ids = [...new Set(ACCOUNTS.filter(a => a.lasId).map(a => a.lasId))].sort();
  const rows = ids.map(id => { const a = ACCOUNTS.find(x => x.lasId === id); const l = LAS[id]; return [`<a href="/las/person/${id}">${id}</a>`, esc(a.name), fmtD(a.dob), esc(l.team), esc(l.worker), l.status === "Deceased" ? pill("Deceased", "red") : pill("Active", "green")]; });
  return ["las", "People", `<h1>People</h1>${note("limit", "a System C connector", "No published API or connector for LAS is available to Copilot. Cowork reads the screens exactly as an officer would, using the signed-in browser.")}${T(["Person ID", "Name", "Date of birth", "Team", "Allocated worker", "Status"], rows)}`];
});
R("GET", "/las/person/:id", (req, res, p) => {
  const l = LAS[p.id]; const a = ACCOUNTS.find(x => x.lasId === p.id); if (!l) return ["las", "Not found", "<h1>Person not found</h1>"];
  const accs = ACCOUNTS.filter(x => x.lasId === p.id);
  const alerts = l.alerts.length ? l.alerts.map(x => `<div class="alert"><b>${esc(x.type)}</b> (${fmtD(x.date)}): ${esc(x.text)}</div>`).join("") : "<p>No alerts.</p>";
  const rep = l.rep ? KV([["Type", esc(l.rep.type)], ["Name", esc(l.rep.name)], ["Relationship", esc(l.rep.rel)], ["Address", esc(l.rep.addr)]]) : "<p>No representative recorded.</p>";
  return ["las", a.name, `<h1>${esc(a.name)} <span class="small">${p.id}</span></h1>${l.status === "Deceased" ? `<div class="alert"><b>DECEASED</b> on ${fmtD(l.dod)}</div>` : ""}
<div class="grid2"><div class="card"><h2>Summary</h2>${KV([["Date of birth", fmtD(a.dob) + " (age " + ageOf(a.dob) + ")"], ["Address", esc(a.addr)], ["Status", l.status === "Deceased" ? "Deceased " + fmtD(l.dod) : "Active"], ["Team", esc(l.team)], ["Allocated worker", esc(l.worker)], ["Finance system ID", accs.map(x => x.cc).join(", ")]])}</div>
<div class="card"><h2>Mental capacity (MCA)</h2>${KV([["Finances / property", esc(l.mca)], ["Assessed", fmtD(l.mcaDate)]])}<h2>Health conditions</h2><p>${l.health.map(esc).join("; ")}</p></div></div>
<div class="card"><h2>Alerts</h2>${alerts}</div>
<div class="grid2"><div class="card"><h2>Contacts and representatives (financial)</h2>${rep}</div>
<div class="card"><h2>Funding agreement</h2>${KV([["Type", esc(l.funding.type)], ["Weekly contribution", gbp(l.funding.contribution)], ["Start", fmtD(l.funding.start)], ["Review", l.funding.review === "ended" ? "Ended" : fmtD(l.funding.review)]])}</div></div>
<div class="card"><h2>Case notes</h2>${T(["Date", "By", "Note"], l.notes.map(n => [fmtD(n.date), esc(n.by), esc(n.text)]))}</div>
${note("wait", "someone to open this screen", "Today an officer opens LAS separately for every case to check capacity, alerts and notes. ContrOCC does not show any of this.")}`];
});

// ----- ContrOCC -----
const stageOf = a => a.last.type;
R("GET", "/controcc", () => ["cc", "Home", `<h1>Liquidlogic Social Care Finance</h1><div class="card"><p>Arrears extract run: <b>${fmtD(EXTRACT)}</b>. Today: <b>${fmtD(TODAY)}</b>.</p>
<p><a class="btn" href="/controcc/overdue">Open the recovery work queue</a></p></div>${note("limit", "a System C connector", "ContrOCC has no published API for Copilot. Cowork reads the same screens an officer sees.")}`]);
R("GET", "/controcc/overdue", () => {
  const rows = ACCOUNTS.map(a => [`<a href="/controcc/client/${a.cc}">${a.cc}</a>`, esc(a.name), esc(a.debtType), gbp(a.out), fmtD(a.oldest), a.last.type === "None" ? "-" : esc(a.last.type), fmtD(a.last.date), a.plan ? pill("Plan: " + a.plan.status, a.plan.status === "Broken" ? "red" : "green") : "-", a.block ? pill("Block: " + a.block.type, "amber") : "-", esc(a.payMethod)]);
  const tot = ACCOUNTS.reduce((s, a) => s + a.out, 0);
  return ["cc", "Recovery work queue", `<h1>Recovery work queue</h1><p class="small">Arrears extract of ${fmtD(EXTRACT)}. ${ACCOUNTS.length} accounts. Total ${gbp(tot)}.</p>
${note("wait", "three systems per case", "ContrOCC shows the debt, the last letter and any invoice block. It does not show capacity, safeguarding, a death or hospital notes. Those are in LAS, and receipts since the extract are in Oracle.")}
${note("fast", "one pass across the lot", "Cowork reads this queue, then LAS and Oracle for each case, and joins the three views.")}
${T(["Client ID", "Name", "Debt type", "Outstanding", "Oldest unpaid due", "Last notice", "Notice date", "Repayment plan", "Invoice block", "Payment method"], rows)}`];
});
R("GET", "/controcc/client/:id", (req, res, p) => {
  const a = accByCC(p.id); if (!a) return ["cc", "Not found", "<h1>Client not found</h1>"];
  const inv = invoicesFor(a); const notes = S.notes[a.cc] || [];
  const dup = ACCOUNTS.filter(x => x.lasId && x.lasId === a.lasId && x.cc !== a.cc);
  return ["cc", a.name, `<h1>${esc(a.name)} <span class="small">${a.cc}</span></h1>
<div class="grid2"><div class="card"><h2>Client</h2>${KV([["Name", esc(a.name)], ["Date of birth", a.dob ? fmtD(a.dob) : "-"], ["Address", esc(a.addr)], ["LAS person ID", a.lasId ? `<a href="${L("las","/las/person/"+a.lasId)}">${a.lasId}</a>` : "-"], ["Oracle customer", `<a href="${L("ora","/oracle/customer/"+a.ar)}">${a.ar}</a>`], ["Service", esc(a.service)], ["Weekly charge", a.weekly ? gbp(a.weekly) : "-"], ["Payment method", esc(a.payMethod)]])}</div>
<div class="card"><h2>Recovery position</h2>${KV([["Debt type", esc(a.debtType)], ["Outstanding (extract " + fmtD(EXTRACT) + ")", "<b>" + gbp(a.out) + "</b>"], ["Oldest unpaid invoice due", fmtD(a.oldest) + " (" + daysOverdue(a) + " days)"], ["Last notice", a.last.type === "None" ? "None issued" : esc(a.last.type) + " on " + fmtD(a.last.date)], ["Last payment", a.lastPay ? gbp(a.lastPay.amt) + " on " + fmtD(a.lastPay.date) : "None recorded"],
  ["Repayment plan", a.plan ? `${gbp(a.plan.amt)} a month from ${fmtD(a.plan.start)}. <b>${a.plan.status}</b>. Last instalment ${fmtD(a.plan.lastInst)}. ${esc(a.plan.note)}` : "None"], ["Invoice block", a.block ? `<b>${esc(a.block.type)}</b> since ${fmtD(a.block.date)} (${esc(a.block.by)}): ${esc(a.block.text)}` : "None"]])}</div></div>
${dup.length ? `<div class="alert"><b>Possible duplicate:</b> another ContrOCC account (${dup.map(d => `<a href="/controcc/client/${d.cc}">${d.cc}</a>`).join(", ")}) has the same name, date of birth and address.</div>` : ""}
<div class="card"><h2>Open invoices</h2>${a.debtType === "Secured (DPA)" ? "<p>Deferred payment agreement. Balance secured by legal charge. Not invoiced in the normal cycle.</p>" : T(["Invoice", "Due", "Amount"], inv.map(i => [i.no, fmtD(i.due), gbp(i.amt)]))}</div>
<div class="card"><h2>Activity log</h2>${notes.length ? T(["Date", "By", "Entry"], notes.map(n => [fmtD(n.date), esc(n.by), esc(n.text)])) : "<p>No entries.</p>"}
<h2>Add an entry</h2><form method="post" action="/controcc/client/${a.cc}/note"><label>Type</label><select name="type"><option>Reminder drafted (awaiting officer)</option><option>Held back - needs a person</option><option>Referred to Revenue team</option><option>Promise to pay</option><option>Call note</option><option>Direct Debit form received</option><option>Other</option></select>
<label>Entry</label><textarea name="text" required></textarea><label>Entered by</label><input name="by" value="Recovery officer (prepared by Cowork)"><button>Save entry</button></form>
<p><a class="btn grey" href="/controcc/panel/new?cc=${a.cc}">Prepare a Debt Panel paper for this client</a></p></div>
${note("wait", "someone to key it", "Today the same note is typed into ContrOCC, the officer's spreadsheet and sometimes Oracle.")}`];
});
R("POST", "/controcc/client/:id/note", async (req, res, p) => {
  const a = accByCC(p.id); const b = await parseBody(req); if (!a) return go(res, "/controcc/overdue");
  const text = (b.text || "").trim(); if (!text) return go(res, "/controcc/client/" + a.cc);
  S.notes[a.cc].unshift({ date: TODAY, by: (b.by || "Recovery officer") + " [" + b.type + "]", text });
  audit("ContrOCC", `${a.cc} ${a.name}: entry added [${b.type}] ${text.slice(0, 140)}`); return go(res, "/controcc/client/" + a.cc);
});
R("GET", "/controcc/panel/new", (req) => {
  const cc = new URL(req.url, "http://x").searchParams.get("cc") || "";
  return ["cc", "New Debt Panel paper", `<h1>Prepare a Debt Panel paper</h1><p>The Adult Social Care Debt Panel considers legal action, write-off or continued resolution activity. The paper is a draft until an officer submits it.</p>
<form method="post" action="/controcc/panel/new" class="card"><label>Client ID</label><input name="cc" value="${esc(cc)}" required><label>Summary of the debt and history</label><textarea name="summary" required></textarea>
<label>Recommendation (for the Panel to decide)</label><select name="rec"><option>Continue resolution activity</option><option>Legal Services referral (County Court claim)</option><option>Consider write-off</option><option>Other</option></select>
<label>Reasons and evidence</label><textarea name="reasons"></textarea><button>Save as draft</button></form>`];
});
R("POST", "/controcc/panel/new", async (req, res) => {
  const b = await parseBody(req); const a = accByCC((b.cc || "").trim()); if (!a) return go(res, "/controcc/panels");
  S.panels.unshift({ id: "DP-" + String(S.seq++).padStart(3, "0"), cc: a.cc, name: a.name, date: TODAY, rec: b.rec, summary: b.summary, reasons: b.reasons, status: "Draft - awaiting officer" });
  audit("ContrOCC", `${a.cc} ${a.name}: Debt Panel paper saved as draft. Recommendation: ${b.rec}.`); return go(res, "/controcc/panels");
});
R("GET", "/controcc/panels", () => ["cc", "Debt Panel papers", `<h1>Debt Panel papers</h1>${S.panels.length ? T(["Paper", "Client", "Date", "Recommendation", "Status", "Summary"], S.panels.map(x => [x.id, `<a href="/controcc/client/${x.cc}">${x.cc}</a> ${esc(x.name)}`, fmtD(x.date), esc(x.rec), pill(x.status, "amber"), esc((x.summary || "").slice(0, 300))])) : "<p>No papers yet.</p>"}`]);

// ----- Oracle -----
R("GET", "/oracle", () => ["ora", "Home", `<h1>Receivables</h1><div class="card"><p>Customer balances, receipts and Direct Debit mandates.</p><p><a class="btn" href="/oracle/customers">Customer balances</a> <a class="btn grey" href="/oracle/mandates">Direct Debit mandates</a></p></div>
${note("limit", "a direct feed", "Oracle receipts can post a day or more after ContrOCC's extract, so a payment can already be in Oracle when ContrOCC still shows the debt.")}`]);
R("GET", "/oracle/customers", () => ["ora", "Customer balances", `<h1>Customer balances</h1>${T(["Customer", "Name", "Balance per ledger", "Last receipt"], ACCOUNTS.map(a => { const r = receiptsFor(a)[0]; const bal = (a.key === "brightwell") ? 0 : a.out; return [`<a href="/oracle/customer/${a.ar}">${a.ar}</a>`, esc(a.name), gbp(bal), r ? gbp(r.amt) + " on " + fmtD(r.date) : "-"]; }))}`]);
R("GET", "/oracle/customer/:id", (req, res, p) => {
  const a = ACCOUNTS.find(x => x.ar === p.id); if (!a) return ["ora", "Not found", "<h1>Customer not found</h1>"];
  const rec = receiptsFor(a); const bal = a.key === "brightwell" ? 0 : a.out;
  const m = S.mandates.filter(x => x.ar === a.ar);
  return ["ora", a.name, `<h1>${esc(a.name)} <span class="small">${a.ar}</span></h1><div class="grid2"><div class="card"><h2>Account</h2>${KV([["Customer", a.ar], ["ContrOCC client", `<a href="${L("cc","/controcc/client/"+a.cc)}">${a.cc}</a>`], ["Balance per ledger", "<b>" + gbp(bal) + "</b>"], ["Dunning (last letter)", a.last.type === "None" ? "None" : esc(a.last.type) + " " + fmtD(a.last.date)], ["Payment method", esc(a.payMethod)]])}</div>
<div class="card"><h2>Receipts</h2>${rec.length ? T(["Date", "Amount", "Method"], rec.map(r => [fmtD(r.date), gbp(r.amt), esc(r.how)])) : "<p>No receipts.</p>"}</div></div>
<div class="card"><h2>Open invoices</h2>${bal === 0 ? "<p>No open invoices. Fully paid.</p>" : T(["Invoice", "Due", "Amount"], invoicesFor(a).map(i => [i.no, fmtD(i.due), gbp(i.amt)]))}</div>
<div class="card"><h2>Direct Debit mandates</h2>${m.length ? T(["Mandate", "Status", "Account name", "Sort code", "Account", "Form"], m.map(x => [x.id, pill(x.status, x.status === "Active" ? "green" : "amber"), esc(x.accName), esc(x.sort), "****" + esc(x.acct.slice(-4)), esc(x.formRef)])) : "<p>None.</p>"}</div>`];
});
R("GET", "/oracle/mandates", () => ["ora", "Direct Debit mandates", `<h1>Direct Debit mandates</h1>
${note("wait", "someone to key it", "Today bank details are typed into Oracle by hand from each form, and a mistake only shows when the first collection fails.")}
${note("fast", "reading the form and checking it", "Cowork reads each form, checks the sort code, account number, account holder, signature and date, and only prepares the clean ones.")}
${note("limit", "bank details are never auto-approved", "Cowork can prepare a mandate. It cannot approve one. A person approves under Approvals.")}
<p><a class="btn" href="/oracle/mandates/new">Create a mandate</a></p>${S.mandates.length ? T(["Mandate", "Customer", "Status", "Account name", "Sort code", "Account", "Form", "Created"], S.mandates.map(x => [x.id, x.ar, pill(x.status, x.status === "Active" ? "green" : x.status === "Rejected" ? "red" : "amber"), esc(x.accName), esc(x.sort), "****" + esc(x.acct.slice(-4)), esc(x.formRef), x.created])) : "<p>No mandates yet.</p>"}`]);
R("GET", "/oracle/mandates/new", (req) => {
  const q = new URL(req.url, "http://x").searchParams; const err = q.get("err");
  return ["ora", "Create mandate", `<h1>Create a Direct Debit mandate</h1>${err ? `<div class="err">${esc(err)}</div>` : ""}<form method="post" action="/oracle/mandates/new" class="card">
<label>Oracle customer ID (for example AR-31301)</label><input name="ar" required><label>Account holder name (exactly as on the form)</label><input name="accName" required>
<label>Sort code (NN-NN-NN)</label><input name="sort" required><label>Account number (8 digits)</label><input name="acct" required><label>Direct Debit form reference</label><input name="formRef" required>
<label>First collection date</label><input name="start" type="date" value="2026-12-01"><label>Notes</label><textarea name="notes"></textarea><button>Submit for approval</button></form>`];
});
R("POST", "/oracle/mandates/new", async (req, res) => {
  const b = await parseBody(req); const a = ACCOUNTS.find(x => x.ar === (b.ar || "").trim());
  const bad = m => go(res, "/oracle/mandates/new?err=" + encodeURIComponent(m));
  if (!a) return bad("Customer not found."); if (!/^\d{2}-?\d{2}-?\d{2}$/.test((b.sort || "").trim())) return bad("Sort code must be six digits (NN-NN-NN).");
  if (!/^\d{8}$/.test((b.acct || "").trim())) return bad("Account number must be eight digits.");
  if (!(b.accName || "").trim()) return bad("Account holder name is required.");
  if (!DDFORMS.find(f => f.id === (b.formRef || "").trim())) return bad("Form reference not found in the document library.");
  if (S.mandates.find(m => m.ar === a.ar && m.status !== "Rejected")) return bad("A mandate already exists for this customer.");
  const id = "MND-" + String(S.seq++).padStart(3, "0");
  S.mandates.unshift({ id, ar: a.ar, cc: a.cc, accName: b.accName.trim(), sort: b.sort.trim(), acct: b.acct.trim(), formRef: b.formRef.trim(), start: b.start, notes: b.notes || "", status: "Pending approval", created: nowStamp() });
  audit("Oracle", `${id} Direct Debit mandate prepared for ${a.ar} ${a.name} from ${b.formRef}. Pending approval.`); return go(res, "/oracle/mandates");
});
R("GET", "/oracle/approvals", () => {
  const pend = S.mandates.filter(m => m.status === "Pending approval");
  return ["ora", "Approvals", `<h1>Approvals</h1><p>A person approves bank details. Cowork prepares, it does not approve.</p>${pend.length ? T(["Mandate", "Customer", "Account name", "Sort code", "Account", "Form", "Action"], pend.map(m => [m.id, m.ar, esc(m.accName), esc(m.sort), esc(m.acct), esc(m.formRef), `<form method="post" action="/oracle/approvals/${m.id}" style="display:inline"><input type="hidden" name="d" value="approve"><button class="btn green">Approve</button></form> <form method="post" action="/oracle/approvals/${m.id}" style="display:inline"><input type="hidden" name="d" value="reject"><button class="btn red">Reject</button></form>`])) : "<p>Nothing waiting.</p>"}`];
});
R("POST", "/oracle/approvals/:id", async (req, res, p) => {
  const b = await parseBody(req); const m = S.mandates.find(x => x.id === p.id); if (m) { m.status = b.d === "approve" ? "Active" : "Rejected"; audit("Oracle", `${m.id} ${m.status} by a person (approvals).`); }
  return go(res, "/oracle/approvals");
});

// ----- SharePoint documents -----
R("GET", "/docs", () => ["docs", "Documents", `<h1>ASC Debt Recovery</h1><div class="grid2"><div class="card"><h2><a href="/docs/dd">Direct Debit forms received</a></h2><p>${DDFORMS.length} digital forms received 5 and 6 November.</p></div>
<div class="card"><h2><a href="/docs/calls">Call transcripts</a></h2><p>${CALLS.length} recent call transcript from the Revenue team.</p></div></div>`]);
R("GET", "/docs/dd", () => ["docs", "Direct Debit forms", `<h1>Direct Debit forms received</h1>${note("fast", "reading digital forms", "Forms that arrive as digital documents can be read, checked and prepared straight away. Paper forms still need scanning first.")}${T(["Form", "Received", "Account holder (as written)"], DDFORMS.map(f => [`<a href="/docs/dd/${f.id}">${f.id}</a>`, fmtD(f.received), esc(f.accName)]))}`]);
R("GET", "/docs/dd/:id", (req, res, p) => {
  const f = DDFORMS.find(x => x.id === p.id); if (!f) return ["docs", "Not found", "<h1>Form not found</h1>"];
  const sig = f.signed ? `<span style="font-family:'Segoe Script','Brush Script MT',cursive;font-size:24px;color:#1a2a6c">${esc(f.signed)}</span>` : `<span class="small">(signature box left blank)</span>`;
  return ["docs", f.id, `<h1>${f.id}</h1><div class="card" style="max-width:720px;background:#fff;border:2px solid #333">
<h2 style="text-align:center">Direct Debit Instruction</h2><p style="text-align:center"><b>East Sussex County Council - Adult Social Care Charging</b><br>Originator ID: 98 76 54 (fictitious)</p>
${KV([["Reference (client ID)", esc(f.ref)], ["Name(s) of account holder(s)", esc(f.accName)], ["Bank or building society", esc(f.bank)], ["Branch", esc(f.branch)], ["Branch sort code", esc(f.sort)], ["Account number", esc(f.acct)]])}
<p class="small">Instruction to your bank or building society: Please pay East Sussex County Council Direct Debits from the account detailed in this instruction subject to the safeguards assured by the Direct Debit Guarantee.</p>
<table class="kv"><tbody><tr><th>Signature(s)</th><td>${sig}</td></tr><tr><th>Date</th><td>${f.date ? fmtD(f.date) : "<span class='small'>(blank)</span>"}</td></tr>${f.capacity ? `<tr><th>Capacity</th><td>${esc(f.capacity)}</td></tr>` : ""}</tbody></table>
<p class="small">Received by ASC Business Support on ${fmtD(f.received)}. Sent in as a digital document.</p></div>`];
});
R("GET", "/docs/calls", () => ["docs", "Call transcripts", `<h1>Call transcripts</h1>${T(["Transcript", "When", "Length", "Participants"], CALLS.map(c => [`<a href="/docs/calls/${c.id}">${c.id}</a>`, esc(c.when), esc(c.len), esc(c.who)]))}`]);
R("GET", "/docs/calls/:id", (req, res, p) => {
  const c = CALLS.find(x => x.id === p.id); if (!c) return ["docs", "Not found", "<h1>Not found</h1>"];
  return ["docs", c.id, `<h1>${c.id}</h1><p class="small">${esc(c.when)} | ${esc(c.len)} | ${esc(c.who)}</p>${note("fast", "turning the call into a note", "Speech-to-text gives the transcript. Cowork turns it into a short case note and a promise to pay for the officer to confirm.")}
<div class="card">${c.text.map(l => `<p><b>${esc(l[0])}:</b> ${esc(l[1])}</p>`).join("")}</div>`];
});

// ----- Audit -----
R("GET", "/audit", () => ["audit", "Audit log", `<h1>Audit log</h1><p>Everything written to the demo systems.</p>${S.audit.length ? T(["Time", "System", "Entry"], S.audit.map(a => [a.t, esc(a.sys), esc(a.text)])) : "<p>Nothing has been written yet.</p>"}`]);
R("GET", "/api/audit.json", (req, res) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(S.audit)); return null; });
R("GET", "/api/mandates.json", (req, res) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(S.mandates)); return null; });
R("GET", "/health", (req, res) => { res.writeHead(200); res.end("ok"); return null; });

const GENERIC = ["/", "/audit", "/reset", "/reset-local", "/notes/toggle", "/health", "/api/audit.json", "/api/mandates.json"];
const allowed = p => SYSTEM === "all" || GENERIC.includes(p) || p.startsWith(PREFIX[SYSTEM]);
const compiled = Object.keys(routes).filter(k => allowed(k.split(" ")[1])).map(k => { const [method, p] = k.split(" "); return { method, re: new RegExp("^" + p.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), fn: routes[k] }; });
load();
http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://x"); const pth = u.pathname.replace(/\/+$/, "") || "/";
    for (const r of compiled) {
      if (r.method !== req.method) continue; const m = pth.match(r.re); if (!m) continue;
      const out = await r.fn(req, res, m.groups || {}); if (out === null || res.writableEnded) return;
      return html(res, shell(out[0], out[1], out[2]));
    }
    html(res, shell("home", "Not found", "<h1>Page not found</h1>"), 404);
  } catch (e) { console.error(e); res.writeHead(500); res.end("Server error"); }
}).listen(PORT, () => console.log("ESCC demo on " + PORT));


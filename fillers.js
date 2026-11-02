// Generates 483 filler accounts (fictitious) and adds them to ACCOUNTS, LAS and CC_NOTES.
// 33 are placed in the top 50 by arrears (each with a rulebook-determined outcome); 450 sit below 385 pounds.
function addFillers(TODAY, ACCOUNTS, LAS, CC_NOTES) {
  let seed = 20261109;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const money = (lo, hi) => Math.round((lo + rnd() * (hi - lo)) * 100) / 100;
  const day = n => new Date(new Date(TODAY + "T00:00:00Z").getTime() - n * 86400000).toISOString().slice(0, 10);

  const male = ["Alan", "Barry", "Brian", "Colin", "David", "Dennis", "Derek", "Edward", "Frank", "Geoffrey", "George", "Graham", "Harry", "Ian", "Jack", "Keith", "Leonard", "Malcolm", "Michael", "Norman", "Peter", "Philip", "Roger", "Ronald", "Trevor", "Victor", "Walter", "William", "Douglas", "Maurice"];
  const female = ["Agnes", "Anne", "Barbara", "Brenda", "Carol", "Christine", "Dorothy", "Elaine", "Eileen", "Freda", "Gillian", "Hazel", "Irene", "Jean", "Joyce", "Kathleen", "Lillian", "Margaret", "Marjorie", "Maureen", "Nora", "Olive", "Patricia", "Pauline", "Rosemary", "Sylvia", "Valerie", "Wendy", "Yvonne", "Doreen"];
  const sur = ["Abbott", "Ashdown", "Baines", "Barlow", "Beech", "Bellamy", "Bolton", "Bracken", "Cartwright", "Chandler", "Clements", "Cobb", "Crawley", "Dalton", "Dawes", "Ellis", "Farrow", "Fletcher", "Garner", "Gibbs", "Harper", "Hatton", "Hobbs", "Holloway", "Isaacs", "Jarvis", "Keane", "Kemp", "Lacey", "Lowe", "Marlow", "Mercer", "Nash", "Norris", "Oakes", "Parfitt", "Peck", "Quinn", "Reeves", "Rudd", "Saunders", "Sharpe", "Tilley", "Tucker", "Underwood", "Verity", "Wade", "Wickham", "Yates", "Young", "Ansell", "Burnett", "Coates", "Daley", "Eagle", "Foster", "Grice", "Hale", "Ingram", "Judd"];
  const streets = ["Station Road", "Church Lane", "High Street", "Mill Road", "Victoria Road", "Orchard Close", "Elm Grove", "The Avenue", "Park View", "Western Road", "Brooks Lane", "Willow Way", "Cherry Tree Close", "Marine Parade", "Down Road", "Wellington Square", "Harold Road", "Ocklynge Road", "Lewes Road", "Battle Road"];
  const towns = [["Eastbourne", "BN21"], ["Eastbourne", "BN22"], ["Hastings", "TN34"], ["Hastings", "TN35"], ["Bexhill", "TN39"], ["Lewes", "BN7"], ["Seaford", "BN25"], ["Newhaven", "BN9"], ["Uckfield", "TN22"], ["Crowborough", "TN6"], ["Hailsham", "BN27"], ["Rye", "TN31"], ["Polegate", "BN26"], ["Peacehaven", "BN10"]];
  const services = ["Home care (1 call a day)", "Home care (2 calls a day)", "Home care (3 calls a day)", "Day opportunities", "Supported living", "Residential care", "Respite care"];
  const workers = [["Sarah Okonkwo", "Older People South"], ["Mark Ellison", "Older People East"], ["Tom Alderton", "Physical Disabilities"], ["Priya Nair", "Older People West"], ["Gareth Lloyd", "Learning Disabilities"]];
  const used = new Set(ACCOUNTS.map(a => a.name));
  let idx = 0;

  function person() {
    for (;;) {
      const isF = rnd() < 0.56; const first = pick(isF ? female : male); const last = pick(sur);
      const title = isF ? (rnd() < 0.8 ? "Mrs" : "Miss") : "Mr"; const name = `${title} ${first} ${last}`;
      if (used.has(name) || ACCOUNTS.some(a => a.name.endsWith(last) && a.lasId && a.name.startsWith(title) && false)) continue;
      used.add(name); return { name, salutation: `${title} ${last}`, isF, last };
    }
  }

  // kind: letter1|letter2|letter3|tooSoon|planActive|paidSince|block|deceased|revenue|filler
  function make(kind, out, extra = {}) {
    idx++; const p = person(); const [town, pc] = pick(towns);
    const dob = `${between(1932, 1966)}-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`;
    const lasId = "P-" + (30000 + idx * 7); const cc = "CC-" + (71000 + idx * 3); const ar = "AR-" + (32000 + idx * 2);
    const w = pick(workers); const service = pick(services);
    const weekly = money(40, 190);
    const a = { key: "f" + idx, cc, ar, lasId, name: p.name, salutation: p.salutation, dob, addr: `${between(1, 98)} ${pick(streets)}, ${town}, ${pc} ${between(1, 9)}${String.fromCharCode(65 + between(0, 25))}${String.fromCharCode(65 + between(0, 25))}`,
      service, weekly, debtType: "Unsecured", out, oldest: day(between(35, 150)), last: { type: "None", date: "" }, lastPay: { date: day(between(41, 150)), amt: weekly }, plan: null, block: null, payMethod: "Invoice", filler: true, kind };
    const l = { status: "Active", mca: "Has capacity", mcaDate: day(between(200, 500)), rep: null, alerts: [], health: [pick(["Arthritis", "Hypertension", "Type 2 diabetes", "Osteoporosis", "COPD", "Heart failure", "Frailty", "Mobility"])],
      funding: { type: service === "Residential care" ? "Residential, charged (contribution assessed)" : "Non-residential, charged", contribution: weekly, start: day(between(300, 900)), review: "2027-03-01" }, worker: w[0], team: w[1],
      notes: [{ date: day(between(40, 160)), by: w[0], text: pick(["Annual review completed. No change to the care plan.", "Review call. Content with current support.", "Care plan reviewed, no concerns raised.", "Routine contact. Support is working well."]) }] };
    const notes = [];
    switch (kind) {
      case "letter1": a.last = { type: "None", date: "" }; a.oldest = day(between(35, 70)); break;
      case "letter2": a.last = { type: "Reminder 1", date: day(between(16, 40)) }; a.oldest = day(between(60, 110)); break;
      case "letter3": a.last = { type: "Reminder 2", date: day(between(16, 40)) }; a.oldest = day(between(90, 140)); break;
      case "tooSoon": a.last = { type: pick(["Reminder 1", "Reminder 2"]), date: day(between(3, 11)) }; a.oldest = day(between(45, 120)); break;
      case "planActive": a.last = { type: "Reminder 2", date: day(between(70, 130)) }; a.lastPay = { date: "2026-11-01", amt: extra.inst || 50 }; a.oldest = day(between(120, 220));
        a.plan = { amt: extra.inst || 50, start: day(between(150, 220)), status: "Active", missed: 0, lastInst: "2026-11-01", note: "Monthly instalment, paid by bank transfer." };
        notes.push({ date: a.plan.start, by: "Revenue team", text: `Repayment plan agreed, ${a.plan.amt} pounds a month.` }); break;
      case "paidSince": a.last = { type: "Reminder 1", date: day(between(16, 35)) }; a.paidSince = true; a.oldest = day(between(50, 90)); break;
      case "block": a.last = { type: "Reminder 1", date: day(between(16, 30)) }; a.oldest = day(between(50, 100));
        a.block = { type: extra.btype || "Review", date: day(between(5, 25)), by: "ASC Finance", text: extra.btext || "Financial assessment review requested. Hold recovery until the outcome." };
        l.notes.unshift({ date: a.block.date, by: "ASC Finance", text: "Charge assessment under review. See invoice block in ContrOCC." }); break;
      case "deceased": a.last = { type: "Reminder 1", date: day(between(16, 30)) }; l.status = "Deceased"; l.dod = day(between(8, 25));
        l.rep = { type: "Executor (named in will)", name: `${pick(["Mr", "Mrs", "Ms"])} ${pick(["Rachel", "Paul", "Helen", "Mark", "Julie"])} ${p.last}`, rel: pick(["Daughter", "Son", "Nephew"]), addr: "Address held in LAS" };
        l.alerts = [{ type: "Deceased", date: l.dod, text: `Died on ${l.dod}. Care package ended.` }]; l.notes.unshift({ date: l.dod, by: w[0], text: "Care package ended following death. Family informed." }); break;
      case "revenue": a.last = { type: "Final reminder", date: day(between(16, 40)) }; a.oldest = day(between(120, 190)); a.lastPay = { date: day(between(150, 260)), amt: weekly }; break;
      default: {
        const r = rnd(); a.oldest = day(between(35, 170));
        if (r < 0.34) { a.last = { type: "None", date: "" }; a.oldest = day(between(35, 60)); }
        else if (r < 0.60) a.last = { type: "Reminder 1", date: day(between(10, 70)) };
        else if (r < 0.80) a.last = { type: "Reminder 2", date: day(between(10, 70)) };
        else if (r < 0.88) a.last = { type: "Final reminder", date: day(between(10, 60)) };
        else if (r < 0.94) { a.plan = { amt: 40, start: day(between(100, 200)), status: "Active", missed: 0, lastInst: "2026-11-01", note: "Monthly instalment, paid by bank transfer." }; a.last = { type: "Reminder 2", date: day(between(70, 130)) }; a.lastPay = { date: "2026-11-01", amt: 40 }; }
        else { a.last = { type: "Reminder 1", date: day(between(15, 50)) }; }
      }
    }
    if (extra.attorney) { l.mca = "Lacks capacity (property and finances)"; l.rep = { type: "Lasting Power of Attorney (Property and Financial Affairs), registered", name: `${extra.attorney} ${p.last}`, rel: pick(["Daughter", "Son"]), addr: `${between(1, 60)} ${pick(streets)}, ${town}` }; l.alerts = [{ type: "Dementia", date: day(200), text: "Lacks capacity to manage property and finances. Attorney acts." }]; a.attorney = true; }
    ACCOUNTS.push(a); LAS[lasId] = l; if (notes.length) CC_NOTES[a.key] = notes;
  }

  // 33 accounts that will sit inside the top 50 (arrears 400 to 3,400)
  const plan = [["letter1", 4], ["letter2", 3], ["letter3", 3], ["revenue", 2], ["tooSoon", 10], ["planActive", 8], ["paidSince", 3], ["block", 3], ["deceased", 2]];
  // 4+3+3+2+10+8+3+3+2 = 38 is too many for 33 slots with letters, so tune counts
  const counts = { letter1: 2, letter2: 2, letter3: 2, revenue: 2, tooSoon: 10, planActive: 8, paidSince: 3, block: 2, deceased: 2 };
  let attorneyUsed = false;
  Object.entries(counts).forEach(([k, n]) => { for (let i = 0; i < n; i++) make(k, money(405, 3400), k === "letter2" && !attorneyUsed ? (attorneyUsed = true, { attorney: "Ms" }) : k === "block" && i === 0 ? { btype: "Dispute", btext: "Family disputes the charge assessment. Hold recovery until reviewed." } : k === "planActive" ? { inst: pick([40, 50, 60, 75]) } : {}); });
  // top-50 spots left: 33 - sum(counts)
  const used33 = Object.values(counts).reduce((x, y) => x + y, 0);
  for (let i = used33; i < 33; i++) make("filler", money(405, 3400));
  // 450 accounts below the top 50 (arrears 25 to 380)
  for (let i = 0; i < 450; i++) make("filler", money(25, 380));
  return ACCOUNTS.length;
}
module.exports = { addFillers };

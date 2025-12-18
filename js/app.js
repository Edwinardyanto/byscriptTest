// ------------------------------------------------------------
// Mock app data (demo)
// ------------------------------------------------------------
const app = {
  user: { name: "Edwin Ardyanto", tier: "Special Lifetime" },
  exchanges: [
    { id:"ex1", name:"Gate Futures 1", market:"FUTURES", provider:"GATE", connected:"8 months ago", source:"exchange portal" },
    { id:"ex2", name:"Bybit Spot 1", market:"SPOT", provider:"BYBIT", connected:"1 year ago", source:"exchange portal" },
    { id:"ex3", name:"Binance Futures 1", market:"FUTURES", provider:"BINANCE", connected:"9 months ago", source:"exchange portal" }
  ],
  tradingPlans: [
    { id:"tp1", name:"GRID CUANTERUS", market:"FUTURES", leverageType:"ISOLATED", leverage:"5", pairs:["USDT_BTC","USDT_AVAX","USDT_SOL"] },
    { id:"tp2", name:"XMA FUTURES", market:"FUTURES", leverageType:"ISOLATED", leverage:"3", pairs:["USDT_BTC","USDT_ETH"] },
    { id:"tp3", name:"aiueyu", market:"FUTURES", leverageType:"ISOLATED", leverage:"1", pairs:["USDT_AVAX"] },
    { id:"tp4", name:"testing", market:"FUTURES", leverageType:"ISOLATED", leverage:"1", pairs:["USDT_AVAX","USDT_BTC"] }
  ],
  autotraders: [
    { id:"e1f2G3BpKAsRyF9rziIES", pair:"USDT_AVAX", plan:"aiueyu", status:"ACTIVE", exchange:"GATE", budget:20, initial:20, autocomp:"No", last:"10 Dec 2025 16:22" },
    { id:"nylym65pw6PNnn9tJqYu", pair:"USDT_AVAX", plan:"aiueyu", status:"STOPPED", exchange:"GATE", budget:5, initial:5, autocomp:"No", last:"-" },
    { id:"uRctvZJMF5nLKbfzgZBY", pair:"USDT_AVAX", plan:"testing", status:"STOPPED", exchange:"BINANCE", budget:100, initial:100, autocomp:"No", last:"-" },
    { id:"vm82rMoUKLSPLz4rElxi", pair:"USDT_BTC", plan:"GRID CUANTERUS", status:"STOPPED", exchange:"GATE", budget:0.5, initial:0.5, autocomp:"No", last:"23 Oct 2025 16:15" },
    { id:"pLIXOVUNfHVbsRzrz4jm", pair:"USDT_BTC", plan:"TESTING 3", status:"STOPPED", exchange:"BYBIT", budget:100, initial:100, autocomp:"No", last:"6 Oct 2025 13:45" }
],
  activity: [
    { pair:"USDT_BTC", action:"SELL", status:"FAILED", price:109366.0, profit:"-", autotrader:"vm82rMoUK...", exchange:"GATE", time:"23 Oct 2025 16:15" },
    { pair:"USDT_BTC", action:"BUY", status:"CANCELLED", price:108817.7, profit:"-", autotrader:"vm82rMoUK...", exchange:"GATE", time:"23 Oct 2025 16:15" },
    { pair:"USDT_BTC", action:"BUY", status:"FINISHED", price:109081.9, profit:"+0.033", autotrader:"vm82rMoUK...", exchange:"GATE", time:"23 Oct 2025 15:56" },
    { pair:"USDT_AVAX", action:"BUY", status:"FINISHED", price:42.11, profit:"+0.21", autotrader:"e1f2G3BpKA...", exchange:"GATE", time:"10 Dec 2025 16:22" },
    { pair:"USDT_AVAX", action:"SELL", status:"FAILED", price:41.70, profit:"-", autotrader:"e1f2G3BpKA...", exchange:"GATE", time:"10 Dec 2025 16:18" }
  ],
  // Mock third party index: exchange "Name" must equal unique code
  thirdPartyExchanges: [
    // { name:"ABC123", provider:"GATE", market:"FUTURES" }
  ]
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display = "none", 1700);
}

// Modal stack (supports nested modals: wizard -> add trading plan -> browse pairs)
const modalStack = [];

function _refreshModalStack(){
  modalStack.forEach((mid, i) => {
    const m = $("#"+mid);
    if (!m) return;
    m.style.zIndex = String(220 + (i * 10));
  });
  if (modalStack.length === 0) document.body.classList.remove("no-scroll");
}

function openModal(id){
  const el = $("#"+id);
  if (!el) return;

  // bring to top
  const idx = modalStack.indexOf(id);
  if (idx !== -1) modalStack.splice(idx, 1);
  modalStack.push(id);

  el.classList.add("show");
  document.body.classList.add("no-scroll");
  _refreshModalStack();
}

function closeModal(id){
  const el = $("#"+id);
  if (el) el.classList.remove("show");

  const idx = modalStack.lastIndexOf(id);
  if (idx !== -1) modalStack.splice(idx, 1);

  // cleanup
  if (id === "mPlan") planDraft = null;
  if (id === "mMore") moreDraft = null;

  _refreshModalStack();
}

// ESC closes the topmost modal
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!modalStack.length) return;
  closeModal(modalStack[modalStack.length - 1]);
});

function badgeForStatus(s){
      if (s === "ACTIVE") return `<span class="badge b-ok"><span class="dot-ok"></span>${s}</span>`;
      if (s === "STOPPED") return `<span class="badge b-stop"><span class="dot-stop"></span>${s}</span>`;
      if (s === "FINISHED") return `<span class="badge b-ok"><span class="dot-ok"></span>${s}</span>`;
      if (s === "FAILED") return `<span class="badge b-stop"><span class="dot-stop"></span>${s}</span>`;
      if (s === "CANCELLED") return `<span class="badge b-warn"><span class="dot-warn"></span>${s}</span>`;
      return `<span class="badge"><span class="dot" style="width:8px;height:8px;border-radius:99px;background:var(--accent)"></span>${s}</span>`;
    }

function fmtMoney(x){
  const n = Number(x);
  if (Number.isNaN(n)) return x;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// ------------------------------------------------------------
// Panels & filters
// ------------------------------------------------------------
let currentPanel = "autotraders";

function switchPanel(name){
  currentPanel = name;
  $$(".tab").forEach(b=>{
    const on = b.dataset.tab === name;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true":"false");
  });
  $$(".panel").forEach(p=>p.classList.remove("active"));
  $("#panel-" + name).classList.add("active");
  applyFilters();
}

function resetFilters(){
  $("#q").value = "";
  $("#status").value = "all";
  $("#exchange").value = "all";
  applyFilters();
  toast("Filters reset");
}

function applyFilters(){
  const q = ($("#q").value || "").toLowerCase().trim();
  const status = $("#status").value;
  const exchange = $("#exchange").value;

  const ok = (r) => {
    const hay = JSON.stringify(r).toLowerCase();
    const okQ = !q || hay.includes(q);
    const okS = (status === "all") || (r.status === status);
    const okE = (exchange === "all") || (String(r.exchange).toUpperCase() === exchange);
    return okQ && okS && okE;
  };

  if (currentPanel === "autotraders"){
    renderAutotraders(app.autotraders.filter(ok));
  } else if (currentPanel === "activity"){
    renderActivity(app.activity.filter(ok));
  } else {
    renderExchanges();
  }
  renderStats();
}

function renderStats(){
  const active = app.autotraders.filter(x => x.status === "ACTIVE").length;
  const stopped = app.autotraders.filter(x => x.status === "STOPPED").length;
  const exCount = app.exchanges.length;
  const signals = 2184;
  const grid = $("#statsGrid");
  grid.innerHTML = `
    <div class="stat">
      <div class="k">Autotraders Active</div>
      <div class="v">${active}</div>
      <div class="h">Realtime status</div>
    </div>
    <div class="stat">
      <div class="k">Autotraders Stopped</div>
      <div class="v">${stopped}</div>
      <div class="h">Needs attention</div>
    </div>
    <div class="stat">
      <div class="k">Connected Exchanges</div>
      <div class="v">${exCount}</div>
      <div class="h">Spot + Futures</div>
    </div>
    <div class="stat">
      <div class="k">Signals (30D)</div>
      <div class="v">${signals.toLocaleString()}</div>
      <div class="h">Filter di tab Activity</div>
    </div>
  `;
}

function renderAutotraders(list){
  const tbody = $("#autotbody");
  tbody.innerHTML = "";
  list.forEach(r=>{
    const tr = document.createElement("tr");
    tr.onclick = () => openAutotraderDetail(r.id);
    tr.innerHTML = `
      <td class="mono" data-label="ID" title="${r.id}">${r.id}</td>
      <td data-label="Pair">${r.pair}</td>
      <td data-label="Trading Plan">${r.plan}</td>
      <td data-label="Status">${badgeForStatus(r.status)}</td>
      <td data-label="Exchange">${r.exchange}</td>
      <td class="rightAlign" data-label="Budget">$${fmtMoney(r.budget)}</td>
      <td class="rightAlign" data-label="Initial">$${fmtMoney(r.initial)}</td>
      <td data-label="AutoComp">${r.autocomp}</td>
      <td class="mono" data-label="Last Signal">${r.last}</td>
      <td class="rightAlign" data-label="Actions">
        <div class="row-actions" onclick="event.stopPropagation()">
          <button class="btnchip" type="button" onclick="toast('View logs: ${r.id}')">Logs</button>
          <button class="btnchip" type="button" onclick="toast('Edit budget: ${r.id}')">Edit</button>
          ${r.status === "ACTIVE"
            ? `<button class="btnchip danger" type="button" onclick="toast('Stop: ${r.id}')">Stop</button>`
            : `<button class="btnchip ok" type="button" onclick="toast('Start: ${r.id}')">Start</button>`
          }
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  $("#autoCount").textContent = list.length;
}

function renderActivity(list){
  const tbody = $("#acttbody");
  tbody.innerHTML = "";
  list.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Pair">${r.pair}</td>
      <td class="mono" data-label="Action">${r.action}</td>
      <td data-label="Status">${badgeForStatus(r.status)}</td>
      <td class="rightAlign" data-label="Price">$${fmtMoney(r.price)}</td>
      <td class="rightAlign" data-label="Profit">${r.profit}</td>
      <td class="mono" data-label="Autotrader">${r.autotrader}</td>
      <td data-label="Exchange">${r.exchange}</td>
      <td class="mono" data-label="Time">${r.time}</td>
    `;
    tbody.appendChild(tr);
  });
  $("#actCount").textContent = list.length;
}

function renderExchanges(){
  const tbody = $("#exbody");
  tbody.innerHTML = "";
  app.exchanges.forEach(x=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Name"><b>${x.name}</b><div class="muted" style="color:var(--muted2);font-size:12px;margin-top:4px;">Verified via ${x.source}</div></td>
      <td data-label="Market"><span class="tag ${x.market === "FUTURES" ? "cy":"dim"}">${x.market}</span></td>
      <td data-label="Provider">${x.provider}</td>
      <td data-label="Connected" class="mono">${x.connected}</td>
      <td data-label="Actions" class="rightAlign">
        <div class="row-actions">
          <button class="btnchip" type="button" onclick="toast('Manage: ${x.name}')">Manage</button>
          <button class="btnchip danger" type="button" onclick="toast('Disconnect: ${x.name}')">Disconnect</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update exchange filter options
  const sel = $("#exchange");
  const prev = sel.value;
  const opts = ["all", ...Array.from(new Set(app.autotraders.map(a=>String(a.exchange).toUpperCase())))];
  sel.innerHTML = opts.map(o => `<option value="${o}">${o === "all" ? "All" : o}</option>`).join("");
  if (opts.includes(prev)) sel.value = prev;
}

// ------------------------------------------------------------
// Autotrader detail
// ------------------------------------------------------------
function openAutotraderDetail(id){
  const a = app.autotraders.find(x=>x.id===id);
  if (!a) return;
  const ex = app.exchanges.find(e => e.provider === a.exchange) || { name: a.exchange + " account" };
  $("#autoDetailBody").innerHTML = `
    <div class="formgrid">
      <div class="fg">
        <div class="lbl">Autotrader ID</div>
        <div class="mono">${a.id}</div>
      </div>
      <div class="fg">
        <div class="lbl">Status</div>
        <div>${badgeForStatus(a.status)}</div>
      </div>
      <div class="fg">
        <div class="lbl">Trading Plan</div>
        <div><b>${a.plan}</b></div>
      </div>
      <div class="fg">
        <div class="lbl">Exchange</div>
        <div><b>${ex.name}</b></div>
      </div>
      <div class="fg">
        <div class="lbl">Pair</div>
        <div><b>${a.pair}</b></div>
      </div>
      <div class="fg">
        <div class="lbl">Budget</div>
        <div><b>$${fmtMoney(a.budget)}</b></div>
      </div>
    </div>
    <div class="hintbar" style="margin-top:12px;">
      <b>Quick UX idea:</b> tombol copy webhook payload dan preview error message yang lebih jelas (biar user tahu gagal karena apa, misalnya permission atau pair mismatch).
    </div>
  `;
  openModal("mAutoDetail");
}

// ------------------------------------------------------------
// Exchange connect modal (portal flow)
// ------------------------------------------------------------
const exchangeFlow = {
  step: 1,
  provider: "GATE",
  market: "FUTURES",
  uniqueCode: "",
  portalOpened: false,
  verifyState: "idle", // idle | checking | success | fail
  polls: 0
};

function genCode(len=18){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let s = "";
  for (let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

function openExchangeConnect(prefProvider){
  exchangeFlow.step = 1;
  exchangeFlow.provider = prefProvider || "GATE";
  exchangeFlow.market = exchangeFlow.market || "FUTURES";
  exchangeFlow.uniqueCode = genCode(18);
  exchangeFlow.portalOpened = false;
  exchangeFlow.verifyState = "idle";
  exchangeFlow.polls = 0;
  renderExchangeFlow();
  openModal("mExchange");
}

function renderExchangeFlow(){
  const body = $("#exBody");
  const foot = $("#exFoot");

  const stepPills = `
    <div class="stepper" style="margin-bottom:12px;">
      <div class="step ${exchangeFlow.step===1?"active":""}"><strong>1</strong> Copy unique code</div>
      <div class="step ${exchangeFlow.step===2?"active":""}"><strong>2</strong> Open exchange portal</div>
      <div class="step ${exchangeFlow.step===3?"active":""}"><strong>3</strong> Verify</div>
    </div>
  `;

  if (exchangeFlow.step === 1){
    body.innerHTML = stepPills + `
      <p class="section-title">Connect ${exchangeFlow.provider} (${exchangeFlow.market})</p>
      <p class="help">
        byScript memakai portal eksternal untuk proses koneksi exchange. Kamu perlu pakai kode ini sebagai <b>Name</b> saat connect di portal, supaya byScript bisa verifikasi akunmu tanpa menyebut provider di belakang layar.
      </p>

      <div class="fg" style="display:flex;gap:10px;align-items:center;">
        <div style="flex:1;">
          <div class="lbl">Unique Code (gunakan sebagai Name)</div>
          <input id="uniqueCode" value="${exchangeFlow.uniqueCode}" readonly />
        </div>
        <button class="btn small primary" type="button" onclick="copyUniqueCode()">Copy</button>
      </div>

      <div class="hintbar">
        <b>Kenapa perlu kode?</b> Karena setelah kamu connect di portal, byScript akan cari exchange dengan <b>Name</b> yang sama dengan kode ini. Kalau ada, baru ditampilkan di halaman Profile.
      </div>
    `;

    foot.innerHTML = `
      <button class="btn" type="button" onclick="closeModal('mExchange')">Cancel</button>
      <button class="btn primary" type="button" onclick="exchangeNext()">Continue</button>
    `;
  }

  if (exchangeFlow.step === 2){
    body.innerHTML = stepPills + `
      <p class="section-title">Open exchange portal</p>
      <p class="help">
        Kamu akan dibuka tab baru ke <span class="kbd">exchange.byscript.io</span>. Di sana pilih exchange, lalu paste <b>Unique Code</b> ke field <b>Name</b>.
      </p>

      <div class="formgrid">
        <div class="fg">
          <div class="lbl">Selected exchange</div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span class="tag cy">${exchangeFlow.provider}</span>
            <span class="tag">${exchangeFlow.market}</span>
            <span class="tag dim">External portal</span>
          </div>
          <div class="help" style="margin-top:10px;">
            Kalau user bingung, tampilkan link "How to connect" dan daftar IP whitelist yang bisa di-copy.
          </div>
        </div>
        <div class="fg">
          <div class="lbl">Unique Code</div>
          <div class="mono" style="font-size:14px;font-weight:900;">${exchangeFlow.uniqueCode}</div>
          <div class="help" style="margin-top:10px;">Pastikan Name di portal sama persis.</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
            <button class="btn small" type="button" onclick="copyUniqueCode()">Copy</button>
            <button class="btn small primary" type="button" onclick="openPortal()">Open portal</button>
          </div>
        </div>
      </div>

      <div class="hintbar">
        <b>Branding tip:</b> Jangan sebut nama vendor. Posisikan portal sebagai "byScript Exchange Portal" supaya konsisten dan user merasa tetap di ekosistem byScript.
      </div>
    `;

    foot.innerHTML = `
      <button class="btn ghost" type="button" onclick="exchangeBack()">Back</button>
      <button class="btn primary" type="button" onclick="exchangeNext()">I have opened the portal</button>
    `;
  }

  if (exchangeFlow.step === 3){
    const statusText = exchangeFlow.verifyState === "checking" ? "Checking exchange in backend..." :
                       exchangeFlow.verifyState === "success" ? "Exchange found and verified." :
                       exchangeFlow.verifyState === "fail" ? "Not found yet. Make sure Name matches the code." :
                       "Click verify after you finish connecting in the portal.";

    const statusTag = exchangeFlow.verifyState === "success"
      ? `<span class="tag ac">Verified</span>`
      : exchangeFlow.verifyState === "checking"
        ? `<span class="tag cy">Checking</span>`
        : exchangeFlow.verifyState === "fail"
          ? `<span class="tag" style="border-color:rgba(255,95,95,.22);background:rgba(255,95,95,.08);">Not found</span>`
          : `<span class="tag dim">Idle</span>`;

    body.innerHTML = stepPills + `
      <p class="section-title">Verify connection</p>
      <p class="help">
        Setelah kamu connect di portal, balik ke byScript dan klik verify. byScript akan mencari exchange dengan <b>Name</b> = <b>${exchangeFlow.uniqueCode}</b>.
      </p>

      <div class="fg">
        <div class="lbl">Verification status ${statusTag}</div>
        <div class="help" style="margin:0;">${statusText}</div>
      </div>

      <div class="formgrid" style="margin-top:10px;">
        <div class="fg">
          <div class="lbl">Unique Code</div>
          <div class="mono" style="font-size:14px;font-weight:900;">${exchangeFlow.uniqueCode}</div>
          <div class="help" style="margin-top:10px;">Kalau salah, ulang flow dari awal.</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn small" type="button" onclick="copyUniqueCode()">Copy</button>
            <button class="btn small" type="button" onclick="openPortal()">Open portal</button>
          </div>
        </div>
        <div class="fg">
          <div class="lbl">Safety note</div>
          <div class="help" style="margin:0;">
            byScript tidak butuh akses withdrawal. UI sebaiknya menampilkan checklist permission yang aman (read + trade).
          </div>
        </div>
      </div>

      <div class="hintbar">
        <b>UX detail:</b> Jika gagal, tampilkan alasan: belum ada, permission kurang, IP belum whitelist, atau exchange sedang rate-limit. Ini mengurangi chat support.
        <div style="margin-top:10px;">
          <span class="kbd">Demo shortcut</span> <button class="btn small" type="button" onclick="simulatePortalSuccess()">Simulate portal connected</button>
        </div>
      </div>
    `;

    foot.innerHTML = `
      <button class="btn ghost" type="button" onclick="exchangeBack()">Back</button>
      <button class="btn" type="button" onclick="closeModal('mExchange')">Close</button>
      <button class="btn primary" type="button" ${exchangeFlow.verifyState==="success"?"onclick='finishExchangeFlow()'":"onclick='verifyExchange()'"}>${exchangeFlow.verifyState==="success"?"Done":"I already connected my exchange"}</button>
    `;
  }
}

function copyUniqueCode(){
  const val = exchangeFlow.uniqueCode;
  navigator.clipboard?.writeText(val).then(
    ()=>toast("Copied unique code"),
    ()=>toast("Copy failed. Select and copy manually")
  );
  const input = $("#uniqueCode");
  if (input){
    input.focus();
    input.select();
    try{ document.execCommand("copy"); } catch(e){}
  }
}

function openPortal(){
  exchangeFlow.portalOpened = true;
  toast("Opened exchange portal (demo)");
  // In real app, window.open('https://exchange.byscript.io', '_blank', 'noopener,noreferrer')
  // Demo: open a blank tab with instructions
  const w = window.open("", "_blank");
  if (w){
    w.document.write(`
      <title>byScript Exchange Portal (demo)</title>
      <style>body{font-family:system-ui;margin:40px;line-height:1.6} code{padding:2px 6px;border:1px solid #ddd;border-radius:8px}
/* Trading Plan (Option B) */
.pair-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px;border:1px solid var(--bd);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01));}
.pair-search{position:relative;display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--bd);border-radius:12px;background:rgba(0,0,0,.25);min-width:260px;flex:1;}
.pair-search .icon{opacity:.7;font-size:14px;}
.pair-search input{background:transparent;border:0;outline:none;color:var(--tx);width:100%;}
.suggest{position:absolute;top:42px;left:0;right:0;background:rgba(10,12,16,.98);border:1px solid var(--bd);border-radius:12px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.6);z-index:20;}
.suggest-item{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;}
.suggest-item:hover{background:rgba(104,254,29,.08);}
.chip{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid rgba(255,255,255,.10);border-radius:999px;background:rgba(0,0,0,.22);}
.chip .x{border:0;background:transparent;color:rgba(255,255,255,.65);cursor:pointer;font-size:16px;line-height:1;}
.pair-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex:2;min-height:32px;}
.btn-outline{background:rgba(0,0,0,.22);border:1px solid rgba(104,254,29,.35);color:var(--tx);box-shadow:none;}
.btn-outline:hover{background:rgba(104,254,29,.08);}
.btn-sm{padding:8px 12px;font-size:13px;border-radius:12px;}
.btn-outline .plus{display:inline-block;width:20px;height:20px;border-radius:8px;background:rgba(104,254,29,.12);color:var(--accent);text-align:center;line-height:20px;margin-right:8px;}
.pairs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-height:360px;overflow:auto;padding:4px;}
@media (max-width:820px){.pairs-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
.pair-row{display:flex;align-items:center;gap:10px;padding:10px 10px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(0,0,0,.18);cursor:pointer;}
.pair-row:hover{border-color:rgba(104,254,29,.25);background:rgba(104,254,29,.06);}
.pair-row input{accent-color:var(--accent);}

</style>
      <h2>Exchange Portal (demo)</h2>
      <p>Ini simulasi tab portal eksternal.</p>
      <p>Gunakan <b>Unique Code</b> sebagai <b>Name</b>: <code>${exchangeFlow.uniqueCode}</code></p>
      <p>Setelah selesai, kembali ke tab byScript dan klik verify.</p>
    `);
    w.document.close();
  }
}

function exchangeNext(){
  exchangeFlow.step = Math.min(3, exchangeFlow.step + 1);
  renderExchangeFlow();
}
function exchangeBack(){
  exchangeFlow.step = Math.max(1, exchangeFlow.step - 1);
  renderExchangeFlow();
}

function simulatePortalSuccess(){
  // Simulate third-party created an exchange with Name = unique code
  const exists = app.thirdPartyExchanges.some(x => x.name === exchangeFlow.uniqueCode);
  if (!exists){
    app.thirdPartyExchanges.push({ name: exchangeFlow.uniqueCode, provider: exchangeFlow.provider, market: exchangeFlow.market, createdAt: Date.now() });
  }
  toast("Simulated: exchange connected in portal");
}

function verifyExchange(){
  if (exchangeFlow.verifyState === "checking") return;
  exchangeFlow.verifyState = "checking";
  exchangeFlow.polls = 0;
  renderExchangeFlow();

  const interval = setInterval(()=>{
    exchangeFlow.polls += 1;
    const found = app.thirdPartyExchanges.find(x => x.name === exchangeFlow.uniqueCode);

    if (found){
      clearInterval(interval);
      exchangeFlow.verifyState = "success";
      renderExchangeFlow();
      toast("Verified successfully");
      return;
    }

    // Auto fail after 3 polls if nothing
    if (exchangeFlow.polls >= 3){
      clearInterval(interval);
      exchangeFlow.verifyState = "fail";
      renderExchangeFlow();
      toast("Not found yet");
    }
  }, 700);
}

function finishExchangeFlow(){
  // Add to connected exchanges list
  const code = exchangeFlow.uniqueCode;
  const name = `${exchangeFlow.provider} ${exchangeFlow.market} (${code.slice(0,6)}...)`;
  app.exchanges.unshift({
    id: "ex" + (Math.random().toString(16).slice(2)),
    name,
    market: exchangeFlow.market,
    provider: exchangeFlow.provider,
    connected: "just now",
    source: "exchange portal"
  });
  closeModal("mExchange");
  renderExchanges();
  applyFilters();
  toast("Exchange added to Profile");
  // If wizard is open, refresh step view
  if ($("#mWizard").classList.contains("show")){
    wizardRender();
  }
}

// ------------------------------------------------------------
// Autotrader wizard (step-by-step)
// ------------------------------------------------------------
const wizard = {
  step: 1,
  market: "FUTURES",
  exchangeProvider: null,
  planId: null,
  pairs: [
    { pair: "USDT_BTC", amount: "100", leverage: "5", leverageType: "ISOLATED" }
  ]
};

const wizardSteps = [
  { key:"market", label:"Market" },
  { key:"exchange", label:"Exchange" },
  { key:"plan", label:"Trading Plan" },
  { key:"pairs", label:"Configure Pairs" },
  { key:"review", label:"Review" }
];

function openAutotraderWizard(){
  wizard.step = 1;
  wizard.market = "FUTURES";
  wizard.exchangeProvider = null;
  wizard.planId = null;
  wizard.pairs = [{ pair: "USDT_BTC", amount: "100", leverage: "5", leverageType: "ISOLATED" }];
  wizardRender();
  openModal("mWizard");
}

function wizardBack(){
  wizard.step = Math.max(1, wizard.step - 1);
  wizardRender();
}
function wizardNext(){
  // validation per step
  if (wizard.step === 2 && !wizard.exchangeProvider){
    toast("Select exchange first");
    return;
  }
  if (wizard.step === 3 && !wizard.planId){
    toast("Select trading plan first");
    return;
  }
  if (wizard.step === 4){
    // validate pairs
    for (const p of wizard.pairs){
      if (!p.pair || !p.amount || !p.leverage || !p.leverageType){
        toast("Complete all pair inputs");
        return;
      }
    }
  }

  if (wizard.step === 5){
    // create
    createAutotradersFromWizard();
    return;
  }
  wizard.step = Math.min(5, wizard.step + 1);
  wizardRender();
}

function wizardRender(){
  // stepper
  $("#wizStepper").innerHTML = wizardSteps.map((s, idx)=>{
    const on = (idx+1) === wizard.step;
    return `<div class="step ${on?"active":""}"><strong>${idx+1}</strong> ${s.label}</div>`;
  }).join("");

  // body
  const body = $("#wizBody");
  const next = $("#wizNextBtn");
  next.textContent = wizard.step === 5 ? "Create Autotrader" : "Next";

  if (wizard.step === 1){
    body.innerHTML = `
      <p class="section-title">Market Type</p>
      <p class="help">Pilih market. Ini akan menyaring exchange dan trading plan yang cocok.</p>
      <div class="seg">
        <button class="btn ${wizard.market==="SPOT"?"primary":"ghost"}" type="button" onclick="setMarket('SPOT')">Spot</button>
        <button class="btn ${wizard.market==="FUTURES"?"primary":"ghost"}" type="button" onclick="setMarket('FUTURES')">Futures</button>
      </div>
      <div class="hintbar" style="margin-top:12px;">
        <b>UX detail:</b> kalau user pindah market, reset pilihan exchange dan trading plan untuk mencegah mismatch.
      </div>
    `;
  }

  if (wizard.step === 2){
    const filtered = app.exchanges.filter(e => e.market === wizard.market);
    body.innerHTML = `
      <p class="section-title">Select Exchange</p>
      <p class="help">Hanya exchange yang mendukung market ini ditampilkan. Perlu exchange baru? klik Connect.</p>

      <div class="cards">
        ${filtered.map(e=>{
          const on = wizard.exchangeProvider === e.provider;
          return `
            <div class="choice ${on?"active":""}" onclick="selectExchangeProvider('${e.provider}')">
              <div class="name">
                <span class="tag cy">${e.provider}</span>
                <span class="tag">${e.market}</span>
              </div>
              <div class="meta">${e.name}<br><span class="mono">Connected ${e.connected}</span></div>
            </div>
          `;
        }).join("")}
        <div class="choice" onclick="openExchangeConnect()">
          <div class="name"><span class="tag ac">Connect</span> <span>New Exchange</span></div>
          <div class="meta">Buka exchange portal, pakai Unique Code, lalu verify.</div>
        </div>
      </div>

      <div class="hintbar">
        <b>UX tip:</b> setelah verify sukses, exchange langsung muncul di list ini tanpa refresh page.
      </div>
    `;
  }

  if (wizard.step === 3){
    const plans = app.tradingPlans.filter(p => p.market === wizard.market);
    body.innerHTML = `
      <p class="section-title">Select Trading Plan</p>
      <p class="help">Pilih plan yang sesuai. Kamu juga bisa buat plan baru tanpa keluar wizard.</p>

      <div class="cards">
        ${plans.map(p=>{
          const on = wizard.planId === p.id;
          return `
            <div class="choice ${on?"active":""}" onclick="selectPlan('${p.id}')">
              <div class="name">${p.name}</div>
              <div class="meta">
                <span class="tag">${p.market}</span>
                <span class="tag">${p.leverageType}</span>
                <span class="tag dim">Lev ${p.leverage}</span>
                <div style="margin-top:8px;color:var(--muted2)">Pairs: ${p.pairs.slice(0,4).join(", ")}${p.pairs.length>4?"...":""}</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
        <button class="btn primary" type="button" onclick="openAddTradingPlan()">Add New Trading Plan</button>
        <button class="btn" type="button" onclick="toast('Tip: gunakan template plan untuk onboarding cepat')">Help</button>
      </div>
    `;
  }

  if (wizard.step === 4){
    body.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div>
          <p class="section-title" style="margin-bottom:4px;">Configure Trading Pairs</p>
          <p class="help">Set beberapa pair sekaligus. Setiap pair akan membuat autotrader terpisah dengan trade amount-nya sendiri.</p>
        </div>
        <button class="btn small primary" type="button" onclick="openAddMorePairs()">Add more</button>
      </div>

      <div class="pairlist" id="pairList"></div>

      <div class="hintbar">
        <b>UX detail:</b> tampilkan estimasi margin dan guardrail error sebelum create (misalnya leverage invalid, pair tidak tersedia, atau minimum order size).
      </div>
    `;
    renderPairRows();
  }

  if (wizard.step === 5){
    const ex = wizard.exchangeProvider || "-";
    const plan = app.tradingPlans.find(p => p.id === wizard.planId);
    body.innerHTML = `
      <p class="section-title">Review</p>
      <p class="help">Cek ulang pilihan kamu sebelum dibuat.</p>

      <div class="formgrid">
        <div class="fg">
          <div class="lbl">Market</div>
          <div><b>${wizard.market}</b></div>
        </div>
        <div class="fg">
          <div class="lbl">Exchange</div>
          <div><b>${ex}</b></div>
        </div>
        <div class="fg" style="grid-column: 1 / -1;">
          <div class="lbl">Trading Plan</div>
          <div><b>${plan ? plan.name : "-"}</b></div>
          ${plan ? `<div class="help" style="margin-top:8px;">Default plan leverage: <b>${plan.leverageType}</b>, <b>${plan.leverage}x</b></div>` : ""}
        </div>
        <div class="fg" style="grid-column: 1 / -1;">
          <div class="lbl">Pairs to create</div>
          <div class="mono" style="white-space:normal;">${wizard.pairs.map(p => `${p.pair} | $${p.amount} | ${p.leverageType} ${p.leverage}x`).join("<br>")}</div>
        </div>
      </div>

      <div class="hintbar">
        <b>Post-create UX:</b> setelah create, tampilkan modal sukses dengan shortcut: Open logs, Go to Activity, dan Edit budget.
      </div>
    `;
  }
}

function setMarket(m){
  wizard.market = m;
  wizard.exchangeProvider = null;
  wizard.planId = null;
  toast("Market set to " + m);
  wizardRender();
}

function selectExchangeProvider(provider){
  wizard.exchangeProvider = provider;
  toast("Selected exchange: " + provider);
  wizardRender();
}

function selectPlan(id){
  wizard.planId = id;
  const p = app.tradingPlans.find(x=>x.id===id);
  if (p){
    // optional: preload leverage defaults on pairs if empty
    for (const row of wizard.pairs){
      if (!row.leverage) row.leverage = String(p.leverage || "1");
      if (!row.leverageType) row.leverageType = p.leverageType || "ISOLATED";
    }
  }
  toast("Selected plan");
  wizardRender();
}

function renderPairRows(){
  const root = $("#pairList");
  if (!root) return;
  root.innerHTML = wizard.pairs.map((p, idx)=>{
    return `
      <div class="pairrow">
        <div>
          <div class="lbl" style="color:var(--muted2);font-size:12px;margin-bottom:6px;">Pair ${idx+1}</div>
          <select onchange="updatePair(${idx}, 'pair', this.value)">
            ${pairOptions(p.pair)}
          </select>
        </div>
        <div>
          <div class="lbl" style="color:var(--muted2);font-size:12px;margin-bottom:6px;">Trade Amount (USD)</div>
          <input value="${p.amount}" placeholder="100" oninput="updatePair(${idx}, 'amount', this.value)" />
        </div>
        <div>
          <div class="lbl" style="color:var(--muted2);font-size:12px;margin-bottom:6px;">Leverage</div>
          <input value="${p.leverage}" placeholder="5" oninput="updatePair(${idx}, 'leverage', this.value)" />
        </div>
        <div>
          <div class="lbl" style="color:var(--muted2);font-size:12px;margin-bottom:6px;">Leverage Type</div>
          <select onchange="updatePair(${idx}, 'leverageType', this.value)">
            <option ${p.leverageType==="ISOLATED"?"selected":""}>ISOLATED</option>
            <option ${p.leverageType==="CROSS"?"selected":""}>CROSS</option>
          </select>
        </div>
        <div style="display:flex;justify-content:flex-end;">
          <button class="iconbtn danger" type="button" title="Remove" onclick="removePair(${idx})">✕</button>
        </div>
      </div>
    `;
  }).join("");
}

function pairOptions(selected){
  const pairs = ["USDT_BTC","USDT_ETH","USDT_SOL","USDT_AVAX","USDT_BNB","USDT_DOGE","USDT_LINK","USDT_SUI","USDT_XRP","USDT_PEPE","USDT_FET","USDT_NEAR"];
  return pairs.map(x => `<option value="${x}" ${x===selected?"selected":""}>${x}</option>`).join("");
}

function updatePair(idx, key, val){
  wizard.pairs[idx][key] = val;
}

function removePair(idx){
  if (wizard.pairs.length <= 1){
    toast("At least 1 pair required");
    return;
  }
  wizard.pairs.splice(idx, 1);
  renderPairRows();
  toast("Removed pair");
}

// ------------------------------------------------------------
// Add more pairs modal (like screenshot)
// ------------------------------------------------------------
let moreDraft = null;
function openAddMorePairs(){
  moreDraft = { count: 1, clone: true };
  $("#moreBody").innerHTML = `
    <p class="section-title">Add more pair rows</p>
    <p class="help">Tambahkan beberapa row sekaligus. Kamu bisa clone setting dari Pair 1 biar cepat.</p>

    <div class="formgrid">
      <div class="fg">
        <div class="lbl">How many</div>
        <select onchange="moreDraft.count = Number(this.value)">
          <option value="1" selected>1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>
      <div class="fg">
        <div class="lbl">Clone settings from Pair 1</div>
        <select onchange="moreDraft.clone = (this.value==='yes')">
          <option value="yes" selected>Yes</option>
          <option value="no">No</option>
        </select>
      </div>
    </div>

    <div class="hintbar">
      <b>UX detail:</b> default clone ON karena kebanyakan user set amount dan leverage sama, tinggal ganti pair.
    </div>
  `;
  openModal("mMore");
}

function applyAddMorePairs(){
  const n = Math.max(1, Math.min(5, Number(moreDraft?.count || 1)));
  const base = wizard.pairs[0] || { pair:"USDT_BTC", amount:"100", leverage:"5", leverageType:"ISOLATED" };
  for (let i=0;i<n;i++){
    wizard.pairs.push(moreDraft.clone
      ? { pair: base.pair, amount: base.amount, leverage: base.leverage, leverageType: base.leverageType }
      : { pair: "USDT_ETH", amount: "", leverage: "", leverageType: "ISOLATED" }
    );
  }
  closeModal("mMore");
  renderPairRows();
  toast("Added " + n + " pair rows");
}

// ------------------------------------------------------------

// ------------------------------------------------------------
// Add Trading Plan modal (Option B, inside wizard)
// ------------------------------------------------------------
// Keep this var so closeModal("mPlan") cleanup never throws
let planDraft = null;

(function(){
  const overlay = document.getElementById('mPlan');
  if (!overlay) return;

  // Cache modal elements (inside #mPlan)
  const closeX = overlay.querySelector('#closeX');
  const cancelBtn = overlay.querySelector('#cancelBtn');
  const backBtn = overlay.querySelector('#backBtn');
  const createBtn = overlay.querySelector('#createBtn');

  const tpName = overlay.querySelector('#tpName');
  const marketType = overlay.querySelector('#marketType');
  const levType = overlay.querySelector('#levType');
  const levVal = overlay.querySelector('#levVal');

  const pairSearch = overlay.querySelector('#pairSearch');
  const chipArea = overlay.querySelector('#chipArea');

  const sheet = overlay.querySelector('#sheet');
  const browsePairsBtn = overlay.querySelector('#browsePairsBtn');
  const sheetCloseX = overlay.querySelector('#sheetCloseX');
  const sheetBackBtn = overlay.querySelector('#sheetBackBtn');
  const sheetApply = overlay.querySelector('#sheetApply');
  const sheetList = overlay.querySelector('#sheetList');
  const sheetCount = overlay.querySelector('#sheetCount');
  const clearAllBtn = overlay.querySelector('#clearAllBtn');

  const PAIRS = [
    "USDT_BTC","USDT_ETH","USDT_SOL","USDT_BNB","USDT_AVAX","USDT_XRP","USDT_DOGE","USDT_LINK","USDT_ADA","USDT_SUI",
    "USDT_TON","USDT_NEAR","USDT_TRX","USDT_ATOM","USDT_LTC","USDT_OP","USDT_ARB","USDT_INJ","USDT_AAVE","USDT_PEPE",
    "USDT_FIL","USDT_UNI","USDT_MATIC","USDT_ICP","USDT_XLM","USDT_XMR","USDT_SAND","USDT_SHIB","USDT_SEI","USDT_RUNE"
  ];

  const state = {
    inited:false,
    sheetOpen:false,
    selected: new Set(["USDT_ETH","USDT_SOL","USDT_BNB"]),
    sheetSelected: new Set()
  };

  function toastMsg(message){
    if (typeof window.toast === "function") window.toast(message);
    else console.log(message);
  }

  function openModal(){
    planDraft = {}; // sentinel
    overlay.dataset.open = "true";
    overlay.setAttribute("aria-hidden","false");
    if (typeof window.openModal === "function") window.openModal("mPlan");
    else overlay.classList.add("show");

    // reset defaults each open
    tpName.value = "";
    marketType.value = "FUTURES";
    levType.value = "ISOLATED";
    levVal.value = "5";
    state.selected = new Set(["USDT_ETH","USDT_SOL","USDT_BNB"]);
    state.sheetSelected = new Set(state.selected);
    renderChips();
    validate();
    setTimeout(()=>tpName.focus(), 60);
  }

  function closeModalLocal(){
    overlay.dataset.open = "false";
    overlay.setAttribute("aria-hidden","true");
    if (typeof window.closeModal === "function") window.closeModal("mPlan");
    else overlay.classList.remove("show");
    closeSheet();
  }

  function openSheet(){
    state.sheetOpen = true;
    sheet.dataset.open = "true";
    sheet.setAttribute("aria-hidden","false");
    state.sheetSelected = new Set(state.selected);
    renderSheet();
    setTimeout(()=> pairSearch && pairSearch.focus(), 60);
  }

  function closeSheet(){
    state.sheetOpen = false;
    sheet.dataset.open = "false";
    sheet.setAttribute("aria-hidden","true");
  }

  function renderChips(){
    chipArea.innerHTML = "";
    const arr = Array.from(state.selected).sort();
    if (!arr.length){
      chipArea.innerHTML = `<span class="muted">Belum ada pair dipilih</span>`;
      return;
    }
    arr.forEach(p=>{
      const el = document.createElement("span");
      el.className = "chip";
      el.innerHTML = `<span class="dot" aria-hidden="true"></span>${escapeHtml(p)}`;
      const x = document.createElement("button");
      x.className = "chip-x";
      x.type = "button";
      x.title = "Remove";
      x.innerHTML = "×";
      x.addEventListener("click", ()=>{
        state.selected.delete(p);
        renderChips();
        validate();
      });
      el.appendChild(x);
      chipArea.appendChild(el);
    });
  }

  function renderSheet(){
    const q = (pairSearch.value || "").toUpperCase().trim();
    const list = PAIRS.filter(p => !q || p.includes(q));
    sheetCount.textContent = `${state.sheetSelected.size} selected`;
    sheetList.innerHTML = "";
    list.forEach(p=>{
      const row = document.createElement("label");
      row.className = "pairRow";
      const checked = state.sheetSelected.has(p);
      row.innerHTML = `
        <input type="checkbox" ${checked ? "checked": ""} />
        <span class="pairLabel">${escapeHtml(p)}</span>
      `;
      row.querySelector("input").addEventListener("change", (e)=>{
        if (e.target.checked) state.sheetSelected.add(p);
        else state.sheetSelected.delete(p);
        sheetCount.textContent = `${state.sheetSelected.size} selected`;
      });
      sheetList.appendChild(row);
    });
  }

  function validate(){
    const okName = tpName.value.trim().length >= 2;
    const okPairs = state.selected.size >= 1;
    createBtn.disabled = !(okName && okPairs);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[c]));
  }

  function ensureInited(){
    if (state.inited) return;
    state.inited = true;

    // Close interactions
    closeX && closeX.addEventListener("click", closeModalLocal);
    cancelBtn && cancelBtn.addEventListener("click", closeModalLocal);
    backBtn && backBtn.addEventListener("click", closeModalLocal);

    // Click outside to close
    overlay.addEventListener("mousedown", (e)=>{
      if (e.target === overlay) closeModalLocal();
    });

    // Esc to close or back from sheet
    document.addEventListener("keydown", (e)=>{
      if (!overlay.classList.contains("show") && overlay.dataset.open !== "true") return;
      if (e.key === "Escape"){
        if (state.sheetOpen) closeSheet();
        else closeModalLocal();
      }
    });

    // Form validation
    tpName.addEventListener("input", validate);

    // Browse pairs
    browsePairsBtn && browsePairsBtn.addEventListener("click", openSheet);
    sheetCloseX && sheetCloseX.addEventListener("click", closeSheet);
    sheetBackBtn && sheetBackBtn.addEventListener("click", closeSheet);
    pairSearch.addEventListener("input", renderSheet);
    clearAllBtn && clearAllBtn.addEventListener("click", ()=>{
      state.sheetSelected.clear();
      renderSheet();
      toastMsg("Selection cleared");
    });
    sheetApply && sheetApply.addEventListener("click", ()=>{
      state.selected = new Set(state.sheetSelected);
      renderChips();
      validate();
      closeSheet();
      toastMsg("Pairs updated");
    });

    // Create plan
    createBtn && createBtn.addEventListener("click", ()=>{
      const name = tpName.value.trim();
      const market = marketType.value;
      const leverageType = levType.value;
      const leverage = levVal.value.trim();
      const pairs = Array.from(state.selected).sort();

      if (typeof app === "undefined" || !app.tradingPlans){
        toastMsg("App state not found (demo)");
        closeModalLocal();
        return;
      }

      const id = "tp" + (app.tradingPlans.length + 1);
      app.tradingPlans.push({ id, name, market, leverageType, leverage, pairs });

      // Auto-select in wizard + refresh
      if (typeof wizard !== "undefined"){
        wizard.planId = id;
      }
      toastMsg("Trading plan created");
      closeModalLocal();
      if (typeof wizardRender === "function") wizardRender();
    });
  }

  // Expose entry point used by wizard button
  window.openAddTradingPlan = function(){
    ensureInited();
    openModal();
  };
})();
// Wizard create
// ------------------------------------------------------------
function createAutotradersFromWizard(){
  // Creates one autotrader per pair
  const plan = app.tradingPlans.find(p=>p.id===wizard.planId);
  const ex = wizard.exchangeProvider || "GATE";
  const created = [];

  wizard.pairs.forEach((p, i)=>{
    const id = genCode(20);
    const row = {
      id,
      pair: p.pair,
      plan: plan ? plan.name : "Custom",
      status: "STOPPED",
      exchange: ex,
      budget: Number(p.amount) || 0,
      initial: Number(p.amount) || 0,
      autocomp: "No",
      last: "-"
    };
    app.autotraders.unshift(row);
    created.push(row);
  });

  closeModal("mWizard");
  applyFilters();
  toast("Created " + created.length + " autotraders");
  switchPanel("autotraders");
}

// ------------------------------------------------------------
// Init render
// ------------------------------------------------------------
function init(){
  renderExchanges();
  renderAutotraders(app.autotraders);
  renderActivity(app.activity);
  renderStats();
  applyFilters();
}
init();


// Close topmost modal on ESC
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const top = modalStack[modalStack.length - 1];
  if (!top) return;
  closeModal(top);
});

// Expose inline handlers (defensive)
window.openModal = openModal;
window.closeModal = closeModal;
window.openAddTradingPlan = openAddTradingPlan;
window.openPlanPairsModal = openPlanPairsModal;
window.saveTradingPlan = saveTradingPlan;

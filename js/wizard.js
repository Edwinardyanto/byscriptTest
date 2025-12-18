// Autotrader wizard and trading plan modal
(function(){
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
    if (wizard.step === 2 && !wizard.exchangeProvider){
      toast("Select exchange first");
      return;
    }
    if (wizard.step === 3 && !wizard.planId){
      toast("Select trading plan first");
      return;
    }
    if (wizard.step === 4){
      for (const p of wizard.pairs){
        if (!p.pair || !p.amount || !p.leverage || !p.leverageType){
          toast("Complete all pair inputs");
          return;
        }
      }
    }

    if (wizard.step === 5){
      createAutotradersFromWizard();
      return;
    }
    wizard.step = Math.min(5, wizard.step + 1);
    wizardRender();
  }

  function wizardRender(){
    $("#wizStepper").innerHTML = wizardSteps.map((s, idx)=>{
      const on = (idx+1) === wizard.step;
      return `<div class="step ${on?"active":""}"><strong>${idx+1}</strong> ${s.label}</div>`;
    }).join("");

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

  function createAutotradersFromWizard(){
    const plan = app.tradingPlans.find(p=>p.id===wizard.planId);
    const ex = wizard.exchangeProvider || "GATE";
    const created = [];

    wizard.pairs.forEach((p)=>{
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

  // Trading plan modal (Option B)
  (function(){
    const overlay = document.getElementById('mPlan');
    if (!overlay) return;

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

    function openPlanModal(){
      planDraft = {};
      overlay.dataset.open = "true";
      overlay.setAttribute("aria-hidden","false");
      if (typeof window.openModal === "function") window.openModal("mPlan");
      else overlay.classList.add("show");

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

    function closePlanModal(){
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

      closeX && closeX.addEventListener("click", closePlanModal);
      cancelBtn && cancelBtn.addEventListener("click", closePlanModal);
      backBtn && backBtn.addEventListener("click", closePlanModal);

      overlay.addEventListener("mousedown", (e)=>{
        if (e.target === overlay) closePlanModal();
      });

      document.addEventListener("keydown", (e)=>{
        if (!overlay.classList.contains("show") && overlay.dataset.open !== "true") return;
        if (e.key === "Escape"){
          if (state.sheetOpen) closeSheet();
          else closePlanModal();
        }
      });

      tpName.addEventListener("input", validate);

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

      createBtn && createBtn.addEventListener("click", ()=>{
        const name = tpName.value.trim();
        const market = marketType.value;
        const leverageType = levType.value;
        const leverage = levVal.value.trim();
        const pairs = Array.from(state.selected).sort();

        if (typeof app === "undefined" || !app.tradingPlans){
          toastMsg("App state not found (demo)");
          closePlanModal();
          return;
        }

        const id = "tp" + (app.tradingPlans.length + 1);
        app.tradingPlans.push({ id, name, market, leverageType, leverage, pairs });

        if (typeof wizard !== "undefined"){
          wizard.planId = id;
        }
        toastMsg("Trading plan created");
        closePlanModal();
        if (typeof wizardRender === "function") wizardRender();
      });
    }

    window.openAddTradingPlan = function(){
      ensureInited();
      openPlanModal();
    };
  })();

  window.openAutotraderWizard = openAutotraderWizard;
  window.wizardBack = wizardBack;
  window.wizardNext = wizardNext;
  window.wizardRender = wizardRender;
  window.setMarket = setMarket;
  window.selectExchangeProvider = selectExchangeProvider;
  window.selectPlan = selectPlan;
  window.renderPairRows = renderPairRows;
  window.updatePair = updatePair;
  window.removePair = removePair;
  window.openAddMorePairs = openAddMorePairs;
  window.applyAddMorePairs = applyAddMorePairs;
  window.createAutotradersFromWizard = createAutotradersFromWizard;
  window.openPlanPairsModal = window.openPlanPairsModal || function(){};
  window.saveTradingPlan = window.saveTradingPlan || function(){};
})();

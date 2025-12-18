// Exchange connect flow
(function(){
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

      if (exchangeFlow.polls >= 3){
        clearInterval(interval);
        exchangeFlow.verifyState = "fail";
        renderExchangeFlow();
        toast("Not found yet");
      }
    }, 700);
  }

  function finishExchangeFlow(){
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
    if ($("#mWizard").classList.contains("show")){
      wizardRender();
    }
  }

  window.openExchangeConnect = openExchangeConnect;
  window.renderExchangeFlow = renderExchangeFlow;
  window.copyUniqueCode = copyUniqueCode;
  window.openPortal = openPortal;
  window.exchangeNext = exchangeNext;
  window.exchangeBack = exchangeBack;
  window.simulatePortalSuccess = simulatePortalSuccess;
  window.verifyExchange = verifyExchange;
  window.finishExchangeFlow = finishExchangeFlow;
})();

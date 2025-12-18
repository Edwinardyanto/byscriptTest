// Panels, filters, and list rendering
(function(){
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

    const sel = $("#exchange");
    const prev = sel.value;
    const opts = ["all", ...Array.from(new Set(app.autotraders.map(a=>String(a.exchange).toUpperCase())))];
    sel.innerHTML = opts.map(o => `<option value="${o}">${o === "all" ? "All" : o}</option>`).join("");
    if (opts.includes(prev)) sel.value = prev;
  }

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

  window.switchPanel = switchPanel;
  window.resetFilters = resetFilters;
  window.applyFilters = applyFilters;
  window.renderStats = renderStats;
  window.renderAutotraders = renderAutotraders;
  window.renderActivity = renderActivity;
  window.renderExchanges = renderExchanges;
  window.openAutotraderDetail = openAutotraderDetail;
})();

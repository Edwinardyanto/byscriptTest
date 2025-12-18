// Helper utilities
(function(){
  function $(q){ return document.querySelector(q); }
  function $$(q){ return Array.from(document.querySelectorAll(q)); }

  function toast(msg){
    const el = $("#toast");
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(el._t);
    el._t = setTimeout(() => el.style.display = "none", 1700);
  }

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

  function genCode(len=18){
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let s = "";
    for (let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
    return s;
  }

  window.$ = $;
  window.$$ = $$;
  window.toast = toast;
  window.badgeForStatus = badgeForStatus;
  window.fmtMoney = fmtMoney;
  window.genCode = genCode;
})();

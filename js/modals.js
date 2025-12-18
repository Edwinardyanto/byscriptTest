// Modal stack management
(function(){
  const modalStack = [];

  function refreshModalStack(){
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

    const idx = modalStack.indexOf(id);
    if (idx !== -1) modalStack.splice(idx, 1);
    modalStack.push(id);

    el.classList.add("show");
    document.body.classList.add("no-scroll");
    refreshModalStack();
  }

  function closeModal(id){
    const el = $("#"+id);
    if (el) el.classList.remove("show");

    const idx = modalStack.lastIndexOf(id);
    if (idx !== -1) modalStack.splice(idx, 1);

    if (typeof planDraft !== "undefined" && id === "mPlan") planDraft = null;
    if (typeof moreDraft !== "undefined" && id === "mMore") moreDraft = null;

    refreshModalStack();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modalStack.length) return;
    closeModal(modalStack[modalStack.length - 1]);
  });

  window.openModal = openModal;
  window.closeModal = closeModal;
})();

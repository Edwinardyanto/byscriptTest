// Bootstrap application
(function(){
  function init(){
    renderExchanges();
    renderAutotraders(app.autotraders);
    renderActivity(app.activity);
    renderStats();
    applyFilters();
  }

  window.init = init;

  document.addEventListener('DOMContentLoaded', init);
})();

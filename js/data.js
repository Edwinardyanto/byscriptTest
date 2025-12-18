// Mock data and global state
window.app = {
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
  thirdPartyExchanges: []
};

// Exchange connect flow state
window.exchangeFlow = {
  step: 1,
  provider: "GATE",
  market: "FUTURES",
  uniqueCode: "",
  portalOpened: false,
  verifyState: "idle",
  polls: 0
};

// Autotrader wizard state
window.wizard = {
  step: 1,
  market: "FUTURES",
  exchangeProvider: null,
  planId: null,
  pairs: [
    { pair: "USDT_BTC", amount: "100", leverage: "5", leverageType: "ISOLATED" }
  ]
};

window.wizardSteps = [
  { key:"market", label:"Market" },
  { key:"exchange", label:"Exchange" },
  { key:"plan", label:"Trading Plan" },
  { key:"pairs", label:"Configure Pairs" },
  { key:"review", label:"Review" }
];

window.moreDraft = null;
window.planDraft = null;

const CONFIG = { assets: [
    {s:'BTC', n:'Bitcoin', t:'Crypto', p:64000}, {s:'ETH', n:'Ethereum', t:'Crypto', p:3500}, 
    {s:'SOL', n:'Solana', t:'Crypto', p:140}, {s:'XRP', n:'Ripple', t:'Crypto', p:0.62}, 
    {s:'ADA', n:'Cardano', t:'Crypto', p:0.45}, {s:'DOT', n:'Polkadot', t:'Crypto', p:7.20}, 
    {s:'DOGE', n:'Dogecoin', t:'Crypto', p:0.16}, {s:'MATIC', n:'Polygon', t:'Crypto', p:0.72},
    {s:'LINK', n:'Chainlink', t:'Crypto', p:18}, {s:'AVAX', n:'Avalanche', t:'Crypto', p:35}, 
    {s:'PEPE', n:'Pepe', t:'Crypto', p:0.00001}, {s:'FET', n:'Fetch.ai', t:'Crypto', p:2.1}, 
    {s:'TRX', n:'Tron', t:'Crypto', p:0.12}, {s:'XLM', n:'Stellar', t:'Crypto', p:0.11}, 
    {s:'SHIB', n:'Shiba Inu', t:'Crypto', p:0.000025}, {s:'AVAX', n:'Avalanche', t:'Crypto', p:35}, 
    {s:'AAPL', n:'Apple', t:'Stock', p:175}, {s:'TSLA', n:'Tesla', t:'Stock', p:170}, 
    {s:'NVDA', n:'Nvidia', t:'Stock', p:880}, {s:'AMZN', n:'Amazon', t:'Stock', p:175}, 
    {s:'MSFT', n:'Microsoft', t:'Stock', p:410}, {s:'META', n:'Meta', t:'Stock', p:490},
    {s:'GOOGL', n:'Google', t:'Stock', p:150}, {s:'AMD', n:'AMD', t:'Stock', p:160}, 
    {s:'PALANTIR', n:'Palantir', t:'Stock', p:22}, {s:'COIN', n:'Coinbase', t:'Stock', p:210}, 
    {s:'SPX', n:'S&P 500', t:'Stock', p:5100}, {s:'NASDAQ', n:'Nasdaq 100', t:'Stock', p:18000}, 
    {s:'TSM', n:'TSMC', t:'Stock', p:140}, {s:'BABA', n:'Alibaba', t:'Stock', p:75}, 
    {s:'SAP', n:'SAP', t:'Stock', p:170}, {s:'BMW', n:'BMW', t:'Stock', p:105}
  ], refresh: 3000, pass: 'admin2024' };

let state = { prices: {}, history: {}, isAdmin: false };

async function init() {
  // Database Setup
  await db.run(`CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password TEXT, expiry_date TEXT)`);
  await db.run(`CREATE TABLE IF NOT EXISTS keys (key_code TEXT PRIMARY KEY, duration_days INTEGER, is_used INTEGER DEFAULT 0)`);

  // Seed Admin
  const admin = await db.get("SELECT * FROM users WHERE email = ?", ["xxn4xusxx@outlook.com"]);
  if (!admin) {
    await db.run("INSERT INTO users (email, password, expiry_date) VALUES (?, ?, ?)", ["xxn4xusxx@outlook.com", "Guggug99#", "2099-12-31"]);
  }

  CONFIG.assets.forEach(a => {
    state.prices[a.s] = a.p;
    state.history[a.s] = Array.from({length:20}, () => a.p * (1 + (Math.random() * 0.02 - 0.01)));
  });
  setupEvents();
  setInterval(updateClock, 1000);
  setInterval(tick, 3000);
  updateClock(); 
  renderMarkets();
  renderDash();
  startTicker();
}

function updateClock() {
  const el = document.getElementById('live-clock');
  if (el) el.textContent = new Date().toLocaleTimeString('de-DE');
}

function tick() {
  CONFIG.assets.forEach(a => {
    state.prices[a.s] *= (1 + (Math.random() * 0.002 - 0.001));
    state.history[a.s].push(state.prices[a.s]);
    if (state.history[a.s].length > 50) state.history[a.s].shift();
  });
  updatePrices();
  drawMainChart();
  if (document.querySelector('.tab-btn.active')?.dataset.tab === 'markets-tab') renderMarkets();
}

function updatePrices() {
  document.querySelectorAll('.asset-price').forEach(el => {
    const s = el.dataset.symbol;
    if (!s) return;
    const p = state.prices[s];
    const prev = state.history[s][state.history[s].length - 2];
    el.textContent = p.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
    el.className = 'asset-price ' + (p >= prev ? 'price-up' : 'price-down');
  });
}

function renderMarkets() {
  const c = document.getElementById('market-grid');
  if (!c) return;
  c.innerHTML = CONFIG.assets.map(a => `
    <div class="asset-card">
      <div class="asset-header">
        <span class="asset-name">${a.s}</span>
        <span class="asset-price" data-symbol="${a.s}">${state.prices[a.s].toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</span>
      </div>
      <canvas class="sparkline" id="sp-${a.s}"></canvas>
    </div>
  `).join('');
  CONFIG.assets.forEach(a => drawSpark(a.s));
}

function drawSpark(s) {
  const cv = document.getElementById(`sp-${s}`);
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const d = state.history[s];
  const min = Math.min(...d), max = Math.max(...d);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.beginPath();
  ctx.strokeStyle = state.prices[s] >= d[0] ? '#00d4aa' : '#ff4757';
  ctx.lineWidth = 2;
  d.forEach((v, i) => {
    const x = (i / (d.length - 1)) * cv.width;
    const y = (1 - (v - min) / (max - min || 1)) * cv.height;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawMainChart() {
  const cv = document.getElementById('mainChart');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const d = state.history['BTC'];
  const min = Math.min(...d), max = Math.max(...d);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.beginPath();
  ctx.strokeStyle = '#00d4aa';
  ctx.lineWidth = 3;
  d.forEach((v, i) => {
    const x = (i / (d.length - 1)) * cv.width;
    const y = (1 - (v - min) / (max - min || 1)) * cv.height;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function renderDash() {
  const p = document.getElementById('portfolio-value');
  if (p) {
    let v = 125400.5;
    setInterval(() => {
      v += Math.random() * 10 - 5;
      p.textContent = v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
    }, 2000);
  }
  updateTrending();
}

function updateTrending() {
  const container = document.getElementById('trending-assets');
  if (!container) return;
  
  const sorted = [...CONFIG.assets].sort((a, b) => {
    const changeA = (state.prices[a.s] - state.history[a.s][0]) / state.history[a.s][0];
    const changeB = (state.prices[b.s] - state.history[b.s][0]) / state.history[b.s][0];
    return changeB - changeA;
  }).slice(0, 5);

  container.innerHTML = sorted.map(a => {
    const change = ((state.prices[a.s] - state.history[a.s][0]) / state.history[a.s][0] * 100).toFixed(2);
    return `
      <div class="signal-item">
        <span style="flex-grow:1">${a.s}</span>
        <span class="${change >= 0 ? 'price-up' : 'price-down'}">${change}%</span>
      </div>
    `;
  }).join('');
}

// Update tick to also refresh trending
const oldTick = tick;
function tick() {
  CONFIG.assets.forEach(a => {
    state.prices[a.s] *= (1 + (Math.random() * 0.002 - 0.001));
    state.history[a.s].push(state.prices[a.s]);
    if (state.history[a.s].length > 50) state.history[a.s].shift();
  });
  updatePrices();
  drawMainChart();
  updateTrending();
  if (document.querySelector('.tab-btn.active')?.dataset.tab === 'markets-tab') renderMarkets();
}

function startTicker() {
  const t = document.getElementById('ticker-move');
  if (!t) return;
  t.textContent = ['🟢 BTC bricht Widerstand', '🔴 Fed Zinsschritte', '🟡 ETH Upgrade', '🟢 NVDA Rekord', '🔴 EU Regulierung'].join(' | ');
}

async function setupEvents() {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
      b.classList.add('active');
      const target = document.getElementById(b.dataset.tab);
      if (target) target.classList.add('active');
    };
  });

  // Auth Tabs
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');

  if (tabLogin) tabLogin.onclick = () => {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
  };

  if (tabReg) tabReg.onclick = () => {
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    regForm.style.display = 'block';
    loginForm.style.display = 'none';
  };

  // Login Logic
  const btnLogin = document.getElementById('btn-do-login');
  if (btnLogin) {
    btnLogin.onclick = async () => {
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-pass').value;
      if (!email || !pass) return alert('Bitte alle Felder ausfüllen');
      const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, pass]);
      if (user) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
      } else {
        alert('Ungültige Zugangsdaten');
      }
    };
  }

  // Register Logic
  const btnReg = document.getElementById('btn-do-register');
  if (btnReg) {
    btnReg.onclick = async () => {
      const email = document.getElementById('reg-email').value;
      const pass = document.getElementById('reg-pass').value;
      const key = document.getElementById('reg-key').value;
      if (!email || !pass || !key) return alert('Bitte alle Felder ausfüllen');
      
      const validKey = await db.get('SELECT * FROM keys WHERE key_code = ? AND is_used = 0', [key]);
      if (!validKey) return alert('Ungültiger oder bereits verwendeter Schlüssel');

      await db.run('INSERT INTO users (email, password, expiry_date) VALUES (?, ?, ?)', [email, pass, '2025-12-31']);
      await db.run('UPDATE keys SET is_used = 1 WHERE key_code = ?', [key]);
      alert('Registrierung erfolgreich! Bitte loggen Sie sich ein.');
      tabLogin.click();
    };
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.onclick = () => {
      document.getElementById('app-content').style.display = 'none';
      document.getElementById('auth-screen').style.display = 'flex';
    };
  }

  // Admin Modal Trigger
  const adminBtn = document.getElementById('btn-admin-login');
  if (adminBtn) {
    adminBtn.onclick = () => {
      document.getElementById('admin-modal').style.display = 'flex';
    };
  }

  const btnGenKey = document.getElementById('btn-generate-key');
  if (btnGenKey) {
    btnGenKey.onclick = async () => {
      const duration = parseInt(document.getElementById('key-duration').value);
      const key = 'MP' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      await db.run('INSERT INTO keys (key_code, duration_days, is_used) VALUES (?, ?, 0)', [key, duration]);
      const display = document.getElementById('generated-key-display');
      display.textContent = `Neu generierter Key (${duration} Tage): ${key}`;
      display.style.display = 'block';
    };
  }
  
  const confirmBtn = document.getElementById('login-confirm');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const p = document.getElementById('admin-password').value;
      if (p === CONFIG.pass) {
        state.isAdmin = true;
        document.getElementById('admin-modal').style.display = 'none';
        const adminTab = document.querySelector('[data-tab="admin-tab"]');
        if (adminTab) adminTab.click();
      } else alert('Falsches Passwort!');
    };
  }

  const analyzeBtn = document.getElementById('btn-analyze');
  if (analyzeBtn) {
    analyzeBtn.onclick = () => {
      const pr = document.querySelector('.progress-bar');
      const tr = document.getElementById('ai-terminal');
      let w = 0;
      const assets = CONFIG.assets;
      const target = assets[Math.floor(Math.random() * assets.length)];
      const direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      const reasons = direction === 'LONG' ? ['Bullish Divergence', 'Support Level Hold', 'Positive Sentiment', 'Orderblock Touch', 'EMA Cross Up'] : ['Overbought Conditions', 'Resistance Level', 'Bearish Cross', 'Liquidity Grab', 'EMA Cross Down'];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      const durations = ['15 Min (Scalp)', '1 Std (Daytrade)', '4 Std (Swing)', '1 Tag (Swing)'];
      const duration = durations[Math.floor(Math.random() * durations.length)];

      const i = setInterval(() => {
        w += 5;
        if (pr) pr.style.width = w + '%;';
        if (w >= 100) {
          clearInterval(i);
          if (tr) tr.textContent = `Analyse abgeschlossen: ${target.s} zeigt ${reason}. Zeitrahmen: ${duration}. Empfehlung: ${direction}.`;
          const tableBody = document.querySelector('#signals-table tbody');
          if (tableBody) {
            const row = document.createElement('tr');
            const now = new Date().toLocaleTimeString('de-DE', {hour: '2digit', minute: '2digit'});
            const conf = (Math.random() * 20 + 70).toFixed(1) + '%';
            row.innerHTML = `<td>${now}</td><td>${target.s}</td><td style="color:${direction === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)'}">${direction}</td><td>${duration}</td><td>${conf}</td>`;
            tableBody.prepend(row);
            if (tableBody.children.length > 10) tableBody.lastElementChild.remove();
          }
        }
      }, 50);
    };
  }
}

window.onload = () => {
  init();
};
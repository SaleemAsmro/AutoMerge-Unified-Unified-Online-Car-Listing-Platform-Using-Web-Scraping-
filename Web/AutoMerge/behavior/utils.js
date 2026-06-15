/* ========================================
   AUTO MERGE — DATA & UTILITIES
   ======================================== */

//  Load all car data ──────────────────────────────────────────────────────

async function loadAllCars() {
  try {
    const base = window.location.pathname.includes('/pages/') ? '../' : '';
    const [r1, r2, r3] = await Promise.all([
    fetch(`${base}data/CarsIq.json`),
    fetch(`${base}data/IQcars.json`),
    fetch(`${base}data/KurdShopping.json`)
    ]);
    const [carsiq, iqcars, kurdshopping] = await Promise.all([r1.json(), r2.json(), r3.json()]);

    // Normalize & merge
    const normalize = (car, idx, prefix) => ({
      id: `${prefix}_${idx}`,
      source: car.source,
      car_link: car.car_link || '#',
      car_image: car.car_image || '',
      car_name: car.car_name || 'Unknown',
      year: car.year || '—',
      mileage_value: car.mileage_value || 'N/A',
      mileage_unit: (car.mileage_unit || '').toUpperCase() === 'N/A' ? '' : (car.mileage_unit || ''),
      trim: car.trim || '',
      location: car.location || '—',
      price: car.price || '0',
      currency: car.currency || 'USD',
      description: car.description || ''
    });

    const all = [
      ...carsiq.map((c, i) => normalize(c, i, 'ciq')),
      ...iqcars.map((c, i) => normalize(c, i, 'iqc')),
      ...kurdshopping.map((c, i) => normalize(c, i, 'ks')),
    ];

    // Merge with user listings from localStorage
    const userListings = getUserListings().map((car, i) => ({
      id: car.id || `user_${i}`,
      source: car.source || 'User Listed',
      car_link: car.car_link || '#',
      car_image: car.car_image || '',
      car_name: car.car_name || 'Unknown',
      year: car.year || '—',
      mileage_value: car.mileage_value || 'N/A',
      mileage_unit: car.mileage_unit || '',
      trim: car.trim || '',
      location: car.location || '—',
      price: car.price || '0',
      currency: car.currency || 'USD',
      description: car.description || ''
    }));
    return [...all, ...userListings];
  } catch (e) {
    console.error('Failed to load car data:', e);
    return [];
  }
}

// ── User listings (localStorage) ──────────────────────────────────────────

function getUserListings() {
  try {
    return JSON.parse(localStorage.getItem('am_listings') || '[]');
  } catch { return []; }
}

function saveUserListing(car) {
  const listings = getUserListings();
  listings.unshift(car); // newest first
  localStorage.setItem('am_listings', JSON.stringify(listings));
}

// ── Auth helpers ───────────────────────────────────────────────────────────

function getUsers() {
  try { return JSON.parse(localStorage.getItem('am_users') || '[]'); }
  catch { return []; }
}

function registerUser(username, email, password) {
  const users = getUsers();
  if (users.find(u => u.email === email)) return { ok: false, msg: 'Email already registered.' };
  if (users.find(u => u.username === username)) return { ok: false, msg: 'Username already taken.' };
  const user = { id: Date.now(), username, email, password: btoa(password), createdAt: new Date().toISOString() };
  users.push(user);
  localStorage.setItem('am_users', JSON.stringify(users));
  return { ok: true, user };
}

function loginUser(emailOrUsername, password) {
  const users = getUsers();
  const user = users.find(u =>
    (u.email === emailOrUsername || u.username === emailOrUsername) &&
    u.password === btoa(password)
  );
  if (!user) return { ok: false, msg: 'Invalid credentials.' };
  localStorage.setItem('am_session', JSON.stringify({ id: user.id, username: user.username, email: user.email }));
  return { ok: true, user };
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('am_session') || 'null'); }
  catch { return null; }
}

function logout() {
  localStorage.removeItem('am_session');
}

function requireAuth() {
  if (!getSession()) { window.location.href = 'signin.html'; return false; }
  return true;
}

// ── Formatting helpers ─────────────────────────────────────────────────────

function formatPrice(price, currency) {
  const p = parseFloat(price);
  if (isNaN(p)) return 'N/A';
  if (currency === 'IQD') {
    return (p / 1000000).toFixed(1) + 'M IQD';
  }
  return '$' + p.toLocaleString('en-US');
}

function formatMileage(val, unit) {
  if (!val || val === 'N/A' || val === '0') return 'N/A';
  const u = (unit || '').toLowerCase();
  if (!u || u === 'n/a') return val;
  return val + ' ' + unit.toUpperCase();
}

function getSourceClass(source) {
  if (!source) return '';
  const s = source.toLowerCase();
  if (s.includes('cars.iq') || s.includes('carsiq')) return 'carsiq';
  if (s.includes('iqcars') || s.includes('iq cars')) return 'iqcars';
  if (s.includes('kurdshopping') || s.includes('kurd')) return 'kurdshopping';
  return 'user';
}

function getSourceLabel(source) {
  if (!source) return 'User';
  const s = source.toLowerCase();
  if (s.includes('cars.iq') || s.includes('carsiq')) return 'Cars.IQ';
  if (s.includes('iqcars') || s.includes('iq cars')) return 'IQCars';
  if (s.includes('kurdshopping') || s.includes('kurd')) return 'KurdShopping';
  return 'Listed';
}

// ── Card HTML builder ──────────────────────────────────────────────────────

function buildCarCard(car, showCompare = true) {
  const imgSrc = car.car_image || 'https://via.placeholder.com/400x250?text=No+Image';
  const srcClass = getSourceClass(car.source);
  const srcLabel = getSourceLabel(car.source);
  const price = formatPrice(car.price, car.currency);
  const mileage = formatMileage(car.mileage_value, car.mileage_unit);
  const trim = car.trim ? ` ${car.trim}` : '';

  return `
    <div class="car-card" data-id="${car.id}" onclick="handleCardClick(event, '${car.id}')">
      <div class="card-img-wrap">
        <img src="${imgSrc}" alt="${car.car_name}" loading="lazy"
          onerror="this.src='https://placehold.co/400x250/e0dfd9/8a8980?text=No+Image'">
        <span class="card-source-badge ${srcClass}">${srcLabel}</span>
        ${showCompare ? `
          <button class="card-compare-btn" title="Add to compare" onclick="event.stopPropagation(); toggleCompare('${car.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
          </button>` : ''}
      </div>
      <div class="card-body">
        <div class="card-title">${car.car_name}${trim}</div>
        <div class="card-trim">${car.year}${mileage !== 'N/A' ? ' · ' + mileage : ''}</div>
        <div class="card-footer">
          <span class="card-price">${price}</span>
          <span class="card-location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            ${car.location}
          </span>
        </div>
      </div>
    </div>`;
}

// ── Compare state ──────────────────────────────────────────────────────────

let compareList = [];
let allCarsCache = [];

function toggleCompare(carId) {
  const car = allCarsCache.find(c => c.id === carId);
  if (!car) return;

  const idx = compareList.findIndex(c => c.id === carId);
  if (idx > -1) {
    compareList.splice(idx, 1);
    showToast('Removed from comparison', 'info');
  } else {
    if (compareList.length >= 3) {
      showToast('You can only compare 2 cars at a time', 'error');
      return;
    }
    compareList.push(car);
    showToast('Added to comparison', 'success');
  }

  updateCompareUI();
}

function updateCompareUI() {
  // Update card selected states
  document.querySelectorAll('.car-card').forEach(card => {
    const id = card.dataset.id;
    const isSelected = compareList.some(c => c.id === id);
    card.classList.toggle('selected', isSelected);
  });

  // Update compare bar
  const bar = document.getElementById('compareBar');
  if (!bar) return;

  bar.classList.toggle('visible', compareList.length > 0);

  ['slot1', 'slot2', 'slot3'].forEach((slotId, i) => {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    const car = compareList[i];
    if (car) {
      slot.classList.add('filled');
      slot.innerHTML = `
        <img class="compare-slot-img" src="${car.car_image || ''}" alt=""
          onerror="this.src='https://placehold.co/40x40/e0dfd9/8a8980?text=?'">
        <span class="compare-slot-name">${car.car_name} ${car.year}</span>
        <span class="compare-slot-remove" onclick="toggleCompare('${car.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </span>`;
    } else {
      slot.classList.remove('filled');
      slot.innerHTML = `<span>Select a car</span>`;
    }
  });

  const goBtn = document.getElementById('compareBtnGo');
  if (goBtn) goBtn.disabled = compareList.length < 2;
}

function openCompareModal() {
  if (compareList.length < 2) return;
  const modal = document.getElementById('compareModal');
  if (!modal) return;

  const [a, b, c] = compareList;
  const rows = [
  ['Year', a.year, b.year, c?.year],
  ['Trim', a.trim||'—', b.trim||'—', c?.trim||'—'],
  ['Mileage', formatMileage(a.mileage_value, a.mileage_unit), formatMileage(b.mileage_value, b.mileage_unit), formatMileage(c?.mileage_value, c?.mileage_unit)],
  ['Location', a.location, b.location, c?.location],
  ['Source', getSourceLabel(a.source), getSourceLabel(b.source), getSourceLabel(c?.source)],
  ['Price', `<span class="compare-price">${formatPrice(a.price, a.currency)}</span>`,
            `<span class="compare-price">${formatPrice(b.price, b.currency)}</span>`,
            `<span class="compare-price">${formatPrice(c?.price, c?.currency)}</span>`],
];

  document.getElementById('compareModalContent').innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th></th>
          <th>
            <img class="compare-car-img" src="${a.car_image}" alt=""
              onerror="this.src='https://placehold.co/300x140/e0dfd9/8a8980?text=No+Image'">
            ${a.car_name} ${a.trim || ''}
          </th>
          <th>
            <img class="compare-car-img" src="${b.car_image}" alt=""
              onerror="this.src='https://placehold.co/300x140/e0dfd9/8a8980?text=No+Image'">
            ${b.car_name} ${b.trim || ''}
          </th>
            ${c ? `<th>
              <img class="compare-car-img" src="${c.car_image}" onerror="this.src='https://placehold.co/300x140/e0dfd9/8a8980?text=No+Image'">
              ${c.car_name} ${c.trim || ''}
          </th>` : ''}
        </tr>
      </thead>
      <tbody>
        ${rows.map(([label, va, vb, vc]) => `
          <tr><td>${label}</td><td>${va}</td><td>${vb}</td>${c ? `<td>${vc}</td>` : ''}</tr>
        `).join('')}
      </tbody>
    </table>`;

  modal.classList.add('open');
}

function closeCompareModal() {
  const modal = document.getElementById('compareModal');
  if (modal) modal.classList.remove('open');
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' :
        type === 'error' ? '<path d="M18 6L6 18M6 6l12 12"/>' :
        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    ${msg}`;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 2800);
}

// ── Navbar show/hide on scroll ─────────────────────────────────────────────

function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  let lastY = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        nav.classList.toggle('hidden', y > lastY && y > 80);
        nav.classList.toggle('scrolled', y > 10);
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ── Filter helpers ─────────────────────────────────────────────────────────

function getUniqueValues(cars, field) {
  return [...new Set(cars.map(c => c[field]).filter(Boolean))].sort();
}

function populateSelect(id, values, placeholder = 'All') {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join('');
}

function filterCars(cars, filters) {
  return cars.filter(car => {
    if (filters.brand && !car.car_name.toLowerCase().startsWith(filters.brand.toLowerCase())) return false;
    if (filters.trim && car.trim !== filters.trim) return false;
    if (filters.location && car.location !== filters.location) return false;
    if (filters.year && car.year !== filters.year) return false;
    if (filters.currency && car.currency !== filters.currency) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${car.car_name} ${car.trim} ${car.location} ${car.year}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function sortCars(cars, criteria) {
  const sorted = [...cars];
  switch (criteria) {
    case 'price-asc': return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    case 'price-desc': return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    case 'year-desc': return sorted.sort((a, b) => parseInt(b.year) - parseInt(a.year));
    case 'year-asc': return sorted.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    default: return sorted;
  }
}

// ── Shared card click (navigate to car link) ───────────────────────────────

function handleCardClick(event, carId) {
  if (event.target.closest('.card-compare-btn')) return;
  const car = allCarsCache.find(c => c.id === carId);
  if (car && car.car_link && car.car_link !== '#') {
    window.open(car.car_link, '_blank', 'noopener');
  }
}

// ── Compare bar HTML ───────────────────────────────────────────────────────

function renderCompareBar() {
  return `
    <div class="compare-bar" id="compareBar">
      <span class="compare-bar-label">Compare</span>
      <div class="compare-slot" id="slot1"><span>Select a car</span></div>
      <div class="compare-slot" id="slot2"><span>Select a car</span></div>
      <div class="compare-slot" id="slot3"><span>Select a car</span></div>
      <div class="compare-bar-actions">
        <button class="btn-compare-clear" onclick="clearCompare()">Clear</button>
        <button class="btn-compare-go" id="compareBtnGo" onclick="openCompareModal()" disabled>Compare Now</button>
      </div>
    </div>
    <div class="modal-overlay" id="compareModal" onclick="if(event.target===this)closeCompareModal()">
      <div class="compare-modal">
        <button class="modal-close" onclick="closeCompareModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <h2>Side-by-Side Comparison</h2>
        <div id="compareModalContent"></div>
      </div>
    </div>`;
}

function clearCompare() {
  compareList = [];
  updateCompareUI();
}

// ── Render footer ──────────────────────────────────────────────────────────

function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-grid">
        <div>
          <div class="footer-brand-logo">Auto<span>Merge</span></div>
          <p class="footer-brand-desc">Iraq's central car marketplace. We aggregate listings from multiple sources so you can find the best deal in one place.</p>
        </div>
        <div>
          <p class="footer-col-title">Explore</p>
          <ul class="footer-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="browse.html">Browse All</a></li>
            <li><a href="sell.html">Sell a Car</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">Account</p>
          <ul class="footer-links">
            <li><a href="register.html">Register</a></li>
            <li><a href="signin.html">Sign In</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">Data Sources</p>
          <ul class="footer-links">
            <li><a href="https://cars.iq" target="_blank" rel="noopener">Cars.IQ</a></li>
            <li><a href="https://iqcars.net" target="_blank" rel="noopener">IQCars.net</a></li>
            <li><a href="https://kurdshopping.com" target="_blank" rel="noopener">KurdShopping</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="footer-copy">© 2025 AutoMerge. Saleem.</span>
      </div>
    </footer>`;
}

// ── Toast container HTML ───────────────────────────────────────────────────

function renderToastContainer() {
  return `<div class="toast-container" id="toastContainer"></div>`;
}

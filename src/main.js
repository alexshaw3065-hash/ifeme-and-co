import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://acsjuozoaylvwdrandsd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjc2p1b3pvYXlsdndkcmFuZHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5OTkwMjksImV4cCI6MjEwNTU3NTAyOX0.A6lRL_RAi4kzds3v1SjO-06uAICUWxFVnxTL8H6FDA4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const config = { whatsapp: '2348036224254', storeName: 'IFEME & CO' };
const categories = [
  ['Cement & concrete', 'Concrete, blocks, aggregates, and the essentials beneath every build.', 'cement'],
  ['Steel & iron', 'Reinforcement and structural materials for the work that needs strength.', 'steel'],
  ['Roofing', 'Protect and finish your project with roofing materials and accessories.', 'roof'],
  ['Plumbing', 'Pipes, fittings, valves, and practical water solutions.', 'plumbing'],
  ['Paint & finishing', 'The materials that bring the final layer together.', 'paint'],
  ['Hardware & tools', 'Fixings, tools, and useful bits for the jobs in between.', 'tools']
];
// Fallback shown if the live catalog can't be reached; overwritten by loadProducts() on success.
let products = [
  { name: 'Cement', category: 'Cement & Concrete', detail: 'A core material for structural and finishing work.', spec: 'Available bag sizes on request', tone: 'cement' },
  { name: 'Reinforcement bar', category: 'Steel & Iron', detail: 'For concrete reinforcement and construction work.', spec: 'Available diameters on request', tone: 'steel' },
  { name: 'Roofing sheets', category: 'Roofing', detail: 'Request available profiles, lengths, and finishes.', spec: 'Profile and length options available', tone: 'roof' },
  { name: 'PVC piping', category: 'Plumbing', detail: 'Request current sizes and fitting availability.', spec: 'Sizes and fittings available', tone: 'plumbing' }
];

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('name, category, brand, detail, spec, tone, image_url')
    .order('sort_order', { ascending: true });
  if (error || !data || !data.length) return;
  products = data.map((row) => ({
    name: row.brand ? `${row.name} — ${row.brand}` : row.name,
    category: row.category,
    detail: row.detail,
    spec: row.spec,
    tone: row.tone || 'cement',
    image: row.image_url || '',
  }));
  renderProducts();
}

let list = [];
let activeFilter = 'all';
let savedMenuFocus;
let toastTimer;
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const productGrid = qs('#product-grid');
const quoteDialog = qs('#quote-drawer');
const productDialog = qs('#product-dialog');

function showToast(message, type = 'success') {
  const toast = qs('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function whatsapp(message) {
  if (!config.whatsapp) {
    showToast('WhatsApp is not configured yet.', 'error');
    return false;
  }
  window.open(`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  return true;
}

function quoteMessage() {
  const items = list.map((item) => `• ${item.name} — ${item.qty}`).join('\n');
  return `Hello, I would like a quote for:\n\n${items}\n\nPlease send me current pricing and availability.`;
}

function add(name) {
  const matchingItem = list.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (matchingItem) matchingItem.qty += 1;
  else list.push({ name, qty: 1 });
  renderList();
  showToast(`${name} added to your quote`);
}

function updateQuantity(index, direction) {
  const item = list[index];
  if (!item) return;
  if (direction === 'increase') item.qty += 1;
  if (direction === 'decrease') item.qty > 1 ? item.qty -= 1 : list.splice(index, 1);
  renderList();
}

function remove(index) {
  if (!list[index]) return;
  const [item] = list.splice(index, 1);
  renderList();
  showToast(`${item.name} removed`);
}

function quoteRows(emptyText) {
  if (!list.length) return `<p class="empty-list">${emptyText}</p>`;
  return list.map((item, index) => `
    <div class="quote-item">
      <div><strong>${item.name}</strong><span>Price available on request</span></div>
      <div class="quantity" aria-label="Quantity for ${item.name}">
        <button data-decrease="${index}" aria-label="Decrease ${item.name}">−</button>
        <output aria-label="${item.qty} ${item.name}">${item.qty}</output>
        <button data-increase="${index}" aria-label="Increase ${item.name}">+</button>
      </div>
      <button class="remove" data-remove="${index}" aria-label="Remove ${item.name}">×</button>
    </div>`).join('');
}

function renderList() {
  qs('#quote-items').innerHTML = quoteRows('Your list is empty. Add products above or use the form below.');
  qs('#drawer-items').innerHTML = quoteRows('Your material list is empty. Browse materials to begin.');
  const total = list.reduce((sum, item) => sum + item.qty, 0);
  qsa('.list-count').forEach((node) => { node.textContent = total; });
  qs('#quote-item-count').textContent = `${list.length} ${list.length === 1 ? 'item' : 'items'}`;
  qs('#clear-list').disabled = list.length === 0;
  qs('#drawer-request-quote').disabled = list.length === 0;
  qs('#request-quote').disabled = list.length === 0;
}

function renderCategories() {
  qs('#category-grid').innerHTML = categories.map(([name, detail, tone], index) => `
    <a href="#quote" class="category ${tone}">
      <div class="category-art"><span>0${index + 1}</span><i></i></div>
      <div><h3>${name} <b>↗</b></h3><p>${detail}</p></div>
    </a>`).join('');
}

function filteredProducts() {
  const query = qs('#product-search').value.trim().toLowerCase();
  return products.filter((product) => {
    const matchesFilter = activeFilter === 'all' || product.tone === activeFilter;
    const searchable = `${product.name} ${product.category} ${product.detail}`.toLowerCase();
    return matchesFilter && (!query || searchable.includes(query));
  });
}

function renderProducts() {
  const matches = filteredProducts();
  const search = qs('#product-search').value.trim();
  qs('#clear-search').hidden = !search;
  qs('#search-status').textContent = search || activeFilter !== 'all'
    ? `${matches.length} ${matches.length === 1 ? 'material' : 'materials'} found`
    : '';
  productGrid.innerHTML = matches.length ? matches.map((product) => {
    const index = products.indexOf(product);
    return `<article class="product reveal">
      <button class="product-image ${product.tone}" data-quick-view="${index}" aria-label="View ${product.name} details"><span>0${index + 1}</span>${product.image ? `<img src="${product.image}" alt="" loading="lazy" />` : '<i></i>'}<em>Quick view ↗</em></button>
      <div class="product-meta"><p>${product.category}</p><h3>${product.name}</h3><span>Price available on request</span></div>
      <div class="product-actions"><button class="add-product" data-add-product="${index}" type="button">Add to quote <b>+</b></button><button class="enquire" data-enquire="${index}" type="button" aria-label="Enquire about ${product.name}">↗</button></div>
    </article>`;
  }).join('') : `<div class="search-empty"><p class="eyebrow">NO MATCHES FOUND</p><h3>We couldn’t find that material.</h3><p>Try a product name, category, or browse all materials.</p><button id="reset-search" class="button button-outline" type="button">Show all materials</button></div>`;
  observeReveals(productGrid);
}

function openModal(dialog, trigger) {
  if (!dialog.open) {
    dialog.showModal();
    document.body.classList.add('modal-open');
    dialog.dataset.trigger = trigger ? 'saved' : '';
    dialog._trigger = trigger;
  }
}

function closeModal(dialog) {
  if (dialog.open) dialog.close();
}

function showProduct(product) {
  qs('#dialog-content').innerHTML = `
    <div class="dialog-art ${product.tone}">${product.image ? `<img src="${product.image}" alt="" />` : '<i></i>'}</div>
    <div class="dialog-copy">
      <p class="eyebrow">${product.category}</p><h2>${product.name}</h2><p>${product.detail}</p>
      <dl><div><dt>Specification</dt><dd>${product.spec}</dd></div><div><dt>Price</dt><dd>Available on request</dd></div></dl>
      <div class="dialog-actions"><button class="button button-accent dialog-add" type="button">Add to quote <span>+</span></button><button class="button button-outline dialog-enquire" type="button">WhatsApp enquiry <span>↗</span></button></div>
    </div>`;
  openModal(productDialog, document.activeElement);
  qs('.dialog-add').onclick = () => { add(product.name); closeModal(productDialog); };
  qs('.dialog-enquire').onclick = () => whatsapp(`Hello, I'm interested in ${product.name}.\nPlease send me the current price and availability.`);
}

function openQuote(trigger) {
  renderList();
  openModal(quoteDialog, trigger);
  qs('.drawer-close').focus();
}

function syncModalState(dialog) {
  document.body.classList.remove('modal-open');
  if (dialog._trigger && typeof dialog._trigger.focus === 'function') dialog._trigger.focus();
}

const menuButton = qs('.menu-toggle');
const mobileMenu = qs('#mobile-menu');
const menuBackdrop = document.createElement('div');
menuBackdrop.className = 'menu-backdrop';
document.body.append(menuBackdrop);

function openMenu() {
  savedMenuFocus = document.activeElement;
  mobileMenu.hidden = false;
  requestAnimationFrame(() => {
    mobileMenu.classList.add('is-open');
    menuBackdrop.classList.add('is-open');
  });
  menuButton.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
  mobileMenu.querySelector('a, button').focus();
}

function closeMenu({ returnFocus = true } = {}) {
  if (mobileMenu.hidden) return;
  mobileMenu.classList.remove('is-open');
  menuBackdrop.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  window.setTimeout(() => { mobileMenu.hidden = true; }, 220);
  if (returnFocus && savedMenuFocus) savedMenuFocus.focus();
}

menuButton.addEventListener('click', () => mobileMenu.hidden ? openMenu() : closeMenu());
menuBackdrop.addEventListener('click', () => closeMenu());
mobileMenu.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu({ returnFocus: false });
  if (event.target.closest('.list-trigger')) { closeMenu({ returnFocus: false }); openQuote(menuButton); }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu();
});

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-product]');
  const quickView = event.target.closest('[data-quick-view]');
  const enquire = event.target.closest('[data-enquire]');
  const increase = event.target.closest('[data-increase]');
  const decrease = event.target.closest('[data-decrease]');
  const removeButton = event.target.closest('[data-remove]');
  const listTrigger = event.target.closest('.list-trigger');
  if (addButton) add(products[addButton.dataset.addProduct].name);
  if (quickView) showProduct(products[quickView.dataset.quickView]);
  if (enquire) {
    const product = products[enquire.dataset.enquire];
    whatsapp(`Hello, I'm interested in ${product.name}.\nPlease send me the current price and availability.`);
  }
  if (increase) updateQuantity(Number(increase.dataset.increase), 'increase');
  if (decrease) updateQuantity(Number(decrease.dataset.decrease), 'decrease');
  if (removeButton) remove(Number(removeButton.dataset.remove));
  if (listTrigger) openQuote(listTrigger);
  if (event.target.closest('#reset-search')) {
    qs('#product-search').value = '';
    activeFilter = 'all';
    qsa('.filter').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === 'all'));
    renderProducts();
  }
});

qs('.add-custom').addEventListener('click', () => {
  const input = qs('#custom-material');
  const name = input.value.trim();
  if (!name) { input.focus(); showToast('Enter a material to add.', 'error'); return; }
  add(name);
  input.value = '';
});
qs('#custom-material').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') qs('.add-custom').click();
});

function requestQuote() {
  if (!list.length) { showToast('Add at least one material first.', 'error'); return; }
  whatsapp(quoteMessage());
}
qs('#request-quote').addEventListener('click', requestQuote);
qs('#drawer-request-quote').addEventListener('click', requestQuote);
qs('#clear-list').addEventListener('click', () => {
  list = [];
  renderList();
  showToast('Material list cleared.');
});

qs('#product-search').addEventListener('input', renderProducts);
qs('#clear-search').addEventListener('click', () => { qs('#product-search').value = ''; renderProducts(); qs('#product-search').focus(); });
qsa('.filter').forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  qsa('.filter').forEach((filter) => filter.classList.toggle('is-active', filter === button));
  renderProducts();
}));

[productDialog, quoteDialog].forEach((dialog) => {
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeModal(dialog); });
  dialog.addEventListener('close', () => syncModalState(dialog));
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeModal(dialog); });
});
qs('.dialog-close').addEventListener('click', () => closeModal(productDialog));
qs('.drawer-close').addEventListener('click', () => closeModal(quoteDialog));

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  requestAnimationFrame(() => {
    document.body.classList.toggle('scrolled', window.scrollY > 16);
    ticking = false;
  });
  ticking = true;
}, { passive: true });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let revealObserver;
function observeReveals(scope = document) {
  if (reducedMotion) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }
  qsa('.reveal:not(.is-revealed)', scope).forEach((node) => revealObserver.observe(node));
}

qsa('.section, .quote-section, .showcase, .contact, .benefits').forEach((section) => section.classList.add('reveal'));
qs('#year').textContent = new Date().getFullYear();
renderCategories();
renderProducts();
renderList();
observeReveals();
loadProducts();

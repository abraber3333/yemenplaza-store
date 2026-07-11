const FIREBASE_DB_URL = "https://yemenplaza-8d9d8-default-rtdb.europe-west1.firebasedatabase.app/products.json";
const EXCHANGE_RATE = 140;
const WHATSAPP_NUMBER = "967775005190";
const SITE_URL = window.location.origin;

let allProducts = [];
let cart = JSON.parse(localStorage.getItem("yemenplaza_cart") || "[]");
let currentCategory = null;
let dataFetched = false;
let arrivalsProducts = [];
let arrivalsCurrentIndex = 0;
let currentModalProduct = null;

// ===== دوال مساعدة =====
function formatPrice(yerPrice) {
  if (!yerPrice || yerPrice <= 0) return 'للاستفسار';
  const sarPrice = Math.round(yerPrice / EXCHANGE_RATE);
  return Number(yerPrice).toLocaleString() + ' ر.ي <span class="sar-price">(' + sarPrice + ' ر.س)</span>';
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// ===== إدارة السلة =====
function saveCart() { localStorage.setItem("yemenplaza_cart", JSON.stringify(cart)); }
function updateCartCount() {
  const c = document.getElementById('cartCount');
  if (c) c.innerText = cart.reduce((s, i) => s + i.qty, 0);
}
function addToCart(id, name, price) {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price.toString().replace(/[^0-9.]/g, '')) || 0;
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0) cart[idx].qty++;
  else cart.push({ id, name, price: numericPrice, qty: 1 });
  saveCart(); renderCart(); updateCartCount();
  alert('✅ تمت إضافة ' + name + ' إلى السلة');
}
function increaseQty(i) { cart[i].qty++; saveCart(); renderCart(); }
function decreaseQty(i) {
  if (cart[i].qty > 1) cart[i].qty--;
  else cart.splice(i, 1);
  saveCart(); renderCart();
}
function removeItem(i) { cart.splice(i, 1); saveCart(); renderCart(); }
function clearCart() { if (confirm("تفريغ السلة بالكامل؟")) { cart = []; saveCart(); renderCart(); } }
function renderCart() {
  const cont = document.getElementById('cartItems'), totalDiv = document.getElementById('cartTotal');
  if (!cont) return;
  updateCartCount();
  if (cart.length === 0) {
    cont.innerHTML = '<div style="text-align:center;padding:20px;">🛒 السلة فارغة</div>';
    if (totalDiv) totalDiv.innerHTML = '';
    return;
  }
  let html = '', totalYER = 0;
  cart.forEach((item, i) => {
    const line = item.price * item.qty;
    totalYER += line;
    html += `<div class="cart-item">
      <div class="cart-item-title"><b>${item.name}</b><br/><span style="color:#1A2F4A;">السعر: ${formatPrice(item.price)}</span><br/><span style="color:#2ecc71;">الإجمالي: ${formatPrice(line)}</span></div>
      <div class="cart-qty"><button class="qty-btn" onclick="increaseQty(${i})">+</button><span style="min-width:25px;">${item.qty}</span><button class="qty-btn" onclick="decreaseQty(${i})">-</button></div>
      <div class="remove-btn" onclick="removeItem(${i})">🗑️</div></div>`;
  });
  cont.innerHTML = html;
  if (totalDiv) totalDiv.innerHTML = `<strong>💰 الإجمالي الكلي:</strong> ${formatPrice(totalYER)}`;
}
function sendCart() {
  if (cart.length === 0) { alert("السلة فارغة!"); return; }
  let msg = "🛍️ *طلب شراء من متجر يمن بلازا* 🛍️\n---------------------------------------\n";
  let totalYER = 0, totalQty = 0;
  cart.forEach((item, i) => {
    const line = item.price * item.qty;
    totalYER += line; totalQty += item.qty;
    msg += `${i+1}. *${item.name}*\n   الكمية: ${item.qty}\n   السعر: ${item.price.toLocaleString()} ر.ي (${Math.round(item.price/EXCHANGE_RATE)} ر.س)\n   المجموع: ${line.toLocaleString()} ر.ي (${Math.round(line/EXCHANGE_RATE)} ر.س)\n---------------------------------------\n`;
  });
  const totalSAR = Math.round(totalYER / EXCHANGE_RATE);
  msg += `💰 *الإجمالي الكلي للطلب:*\n🇾🇪 بالريال اليمني: ${totalYER.toLocaleString()} ر.ي\n🇸🇦 بالريال السعودي: ${totalSAR} ر.س\n⚙️ _(سعر الصرف: 1 ر.س = ${EXCHANGE_RATE} ر.ي)_\n\n📦 *عدد القطع:* ${totalQty}\n\n📍 يرجى تأكيد الطلب وتزويدي بتفاصيل الشحن والتوصيل. شكراً!`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`);
}
function toggleCart() { document.getElementById('cartSidebar').classList.toggle('open'); }

// ===== المودال =====
function openModal(product) {
  currentModalProduct = product;
  document.getElementById('modalTitle').innerText = product.title;
  document.getElementById('modalPrice').innerHTML = '💰 ' + formatPrice(product.price);
  document.getElementById('modalDesc').innerText = product.description || 'لا يوجد وصف.';
  const mainImg = document.getElementById('modalMainImage');
  const thumbsContainer = document.getElementById('modalThumbs');
  const images = (product.images && product.images.length > 0) ? product.images : [product.image];
  mainImg.src = images[0];
  thumbsContainer.innerHTML = '';
  images.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img;
    thumb.className = 'modal-thumb' + (i === 0 ? ' active' : '');
    thumb.addEventListener('click', () => {
      mainImg.src = img;
      document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
    thumbsContainer.appendChild(thumb);
  });
  const waBtn = document.getElementById('modalWaBtn');
  const sarText = product.price > 0 ? '(' + Math.round(product.price / EXCHANGE_RATE) + ' ر.س)' : '';
  waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`السلام عليكم، أريد شراء: ${product.title}\nالسعر: ${product.price > 0 ? product.price.toLocaleString() + ' ر.ي ' + sarText : 'للاستفسار'}`)}`;
  document.getElementById('productModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModal').style.display = 'none';
  document.body.style.overflow = '';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('productModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

// ===== جلب المنتجات =====
async function fetchProducts() {
  const grid = document.getElementById('productsGrid');
  try {
    const res = await fetch(FIREBASE_DB_URL);
    const data = await res.json();
    if (!data) { grid.innerHTML = '<p>لا توجد منتجات حالياً.</p>'; return; }
    const products = [];
    for (let key in data) {
      const item = data[key];
      if (!item.id || !item.name) continue;
      const price = parseInt((item.price || '0').toString().replace(/[^0-9]/g, '')) || 0;
      const images = [];
      for (let prop in item) {
        if (prop.toLowerCase().startsWith('image') && item[prop] && typeof item[prop] === 'string' && item[prop].trim() !== '') {
          images.push(item[prop].trim());
        }
      }
      const mainImg = images.length > 0 ? images[0] : 'https://via.placeholder.com/400x300?text=يمن+بلازا';
      products.push({
        id: item.id,
        title: item.name,
        price: price,
        image: mainImg,
        images: images,
        description: item.description || '',
        labels: item.category ? item.category.split('#').map(c => c.trim()).filter(c => c !== '') : []
      });
    }
    allProducts = products;
    displayProducts(products);
    buildCategories();
  } catch (e) {
    grid.innerHTML = '<p>حدث خطأ في تحميل المنتجات.</p>';
    console.error(e);
  }
}

function displayProducts(products) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="img-container"><img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=يمن+بلازا'"></div>
      <h3>${p.title}</h3>
      <div class="snippet">${p.description ? stripHtml(p.description).substring(0, 60) + '...' : ''}</div>
      <div class="product-price">💰 ${formatPrice(p.price)}</div>
      <div class="product-buttons">
        <button class="btn-cart" onclick="event.stopPropagation(); addToCart('${p.id}', '${p.title.replace(/'/g, "\\'")}', ${p.price})">🛒 للسلة</button>
        <a class="btn-wa" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('السلام عليكم، أريد طلب: ' + p.title)}" target="_blank" onclick="event.stopPropagation()">💬 واتساب</a>
      </div>`;
    card.addEventListener('click', () => openModal(p));
    grid.appendChild(card);
  });
}

function buildCategories() {
  const cats = new Set();
  allProducts.forEach(p => p.labels.forEach(l => cats.add(l)));
  const navDiv = document.getElementById('navCategories');
  const dropdownList = document.getElementById('dropdownCategoriesList');
  const categories = Array.from(cats).sort();
  if (navDiv) {
    navDiv.innerHTML = '<a href="#" onclick="loadAllProducts(); return false;">🏠 كل المنتجات</a>';
    categories.forEach(cat => navDiv.innerHTML += `<a href="#" onclick="filterByCategory('${cat.replace(/'/g, "\\'")}'); return false;">📁 ${cat}</a>`);
  }
  if (dropdownList) {
    dropdownList.innerHTML = '<a href="#" onclick="loadAllProducts(); return false;">🏠 كل المنتجات</a>';
    categories.forEach(cat => dropdownList.innerHTML += `<a href="#" onclick="filterByCategory('${cat.replace(/'/g, "\\'")}'); return false;">📁 ${cat}</a>`);
  }
}

function loadAllProducts() {
  currentCategory = null;
  document.getElementById('searchInput').value = '';
  displayProducts(allProducts);
  document.getElementById('productsTitle').innerText = '✨ أحدث المنتجات';
}
function filterByCategory(cat) {
  currentCategory = cat;
  document.getElementById('searchInput').value = '';
  const filtered = allProducts.filter(p => p.labels.includes(cat));
  displayProducts(filtered);
  document.getElementById('productsTitle').innerText = '📂 منتجات القسم: ' + cat;
}
function filterProducts() {
  const val = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allProducts.filter(p => p.title.toLowerCase().includes(val) || (p.description && p.description.toLowerCase().includes(val)));
  displayProducts(filtered);
}

// ===== مودال المعلومات =====
function openInfoModal(type) {
  const body = document.getElementById('infoModalBody');
  const modal = document.getElementById('infoModal');
  let content = '';
  if (type === 'policy' || type === 'payment') {
    content = '<h2>📜 سياسة متجر يمن بلازا</h2><p>... (نفس محتوى السياسة السابق)</p>';
  } else if (type === 'contact') {
    content = '<h2>📞 اتصل بنا</h2><p>📲 واتساب: <a href="https://wa.me/967775005190">775005190</a><br>📍 صنعاء - الأصبحي</p>';
  }
  if (body) body.innerHTML = content;
  if (modal) modal.classList.add('open');
}
function closeInfoModal() { document.getElementById('infoModal').classList.remove('open'); }

// ===== سلايدر وصل الآن =====
function buildArrivalsSliderFromFirebase() {
  // يستخدم آخر 5 منتجات من Firebase
  arrivalsProducts = allProducts.slice(-5).reverse();
  if (arrivalsProducts.length === 0) {
    document.getElementById('arrivalsSliderOuter').style.display = 'none';
    return;
  }
  const track = document.getElementById('arrivalsTrack');
  const dotsContainer = document.getElementById('arrivalsDots');
  track.innerHTML = ''; dotsContainer.innerHTML = '';
  arrivalsProducts.forEach((p, i) => {
    const slide = document.createElement('div');
    slide.className = 'arrivals-slide';
    slide.innerHTML = `<div class="arrivals-image-wrapper"><span class="arrivals-badge">جديد 🔥</span><img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/400x300?text=يمن+بلازا'"></div><div class="arrivals-info"><h4>${p.title}</h4><span class="price">💰 ${formatPrice(p.price)}</span><a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('أريد ' + p.title)}" target="_blank" class="wa-btn" onclick="event.stopPropagation();">💬 اطلب الآن</a></div>`;
    slide.addEventListener('click', () => openModal(p));
    track.appendChild(slide);
    const dot = document.createElement('span');
    dot.className = 'arrivals-dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => arrivalsGoToSlide(i);
    dotsContainer.appendChild(dot);
  });
  if (window.innerWidth <= 768) track.classList.add('arrivals-grid-mobile');
  arrivalsCurrentIndex = 0;
}

function arrivalsGoToSlide(index) {
  const track = document.getElementById('arrivalsTrack');
  if (!track || track.classList.contains('arrivals-grid-mobile')) return;
  if (index >= arrivalsProducts.length) index = 0;
  if (index < 0) index = arrivalsProducts.length - 1;
  arrivalsCurrentIndex = index;
  track.style.transform = `translateX(-${index * 100}%)`;
  document.querySelectorAll('.arrivals-dot').forEach((d, i) => d.classList.toggle('active', i === index));
}
function arrivalsSlideMove(dir) { arrivalsGoToSlide(arrivalsCurrentIndex + dir); }
window.arrivalsSlideMove = arrivalsSlideMove;

// ===== العلامة المائية =====
function addWatermark() {
  document.querySelectorAll('.post-card img, .arrivals-slide img, .modal-image, .modal-thumb').forEach(img => {
    if (img.closest('.watermark-container')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'watermark-container';
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    const wm = document.createElement('div');
    wm.className = 'watermark';
    wm.innerHTML = '<span class="brand">يمن بلازا</span><span class="phone">📞 772020339</span>';
    wrapper.appendChild(wm);
  });
}

// ===== شريط الأخبار =====
function initTicker() {
  const msgs = document.querySelectorAll('.ticker-message');
  let current = 0;
  setInterval(() => {
    msgs[current].classList.remove('active');
    current = (current + 1) % msgs.length;
    msgs[current].classList.add('active');
  }, 5000);
}

// ===== بدء التطبيق =====
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  fetchProducts().then(() => {
    buildArrivalsSliderFromFirebase();
    addWatermark();
  });
  initTicker();
});

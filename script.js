const FIREBASE_DB_URL = "https://yemenplaza-8d9d8-default-rtdb.europe-west1.firebasedatabase.app/products.json";
const EXCHANGE_RATE = 140;
const WHATSAPP_NUMBER = "967775005190";

let allProducts = [];

function formatPrice(yerPrice) {
  if (!yerPrice || yerPrice <= 0) return 'للاستفسار';
  const sarPrice = Math.round(yerPrice / EXCHANGE_RATE);
  return Number(yerPrice).toLocaleString() + ' ر.ي <span class="sar-price">(' + sarPrice + ' ر.س)</span>';
}

async function fetchProducts() {
  const grid = document.getElementById('productsGrid');
  try {
    const res = await fetch(FIREBASE_DB_URL);
    const data = await res.json();
    if (!data) {
      grid.innerHTML = '<p>لا توجد منتجات حالياً.</p>';
      return;
    }

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
        description: item.description || ''
      });
    }
    allProducts = products;
    displayProducts(products);
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
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=يمن+بلازا'">
      <h3>${p.title}</h3>
      <div class="price">💰 ${formatPrice(p.price)}</div>
    `;
    card.addEventListener('click', () => openModal(p));
    grid.appendChild(card);
  });
}

// ===== دوال النافذة المنبثقة =====
function openModal(product) {
  document.getElementById('modalTitle').innerText = product.title;
  document.getElementById('modalPrice').innerHTML = '💰 ' + formatPrice(product.price);
  document.getElementById('modalDesc').innerText = product.description || 'لا يوجد وصف.';

  // معرض الصور
  const mainImg = document.getElementById('modalMainImage');
  const thumbsContainer = document.getElementById('modalThumbs');
  const images = product.images.length > 0 ? product.images : [product.image];

  mainImg.src = images[0];
  thumbsContainer.innerHTML = '';

  images.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img;
    if (i === 0) thumb.classList.add('active');
    thumb.addEventListener('click', () => {
      mainImg.src = img;
      document.querySelectorAll('.modal-thumbs img').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
    thumbsContainer.appendChild(thumb);
  });

  // زر واتساب
  const waBtn = document.getElementById('modalWaBtn');
  const sarText = product.price > 0 ? '(' + Math.round(product.price / EXCHANGE_RATE) + ' ر.س)' : '';
  const waMsg = `السلام عليكم، أريد شراء: ${product.title}\nالسعر: ${product.price > 0 ? product.price.toLocaleString() + ' ر.ي ' + sarText : 'للاستفسار'}`;
  waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;

  document.getElementById('productModal').style.display = 'flex';
}

// إغلاق النافذة
document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('productModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('productModal')) {
    document.getElementById('productModal').style.display = 'none';
  }
});

fetchProducts();

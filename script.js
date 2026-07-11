const FIREBASE_DB_URL = "https://yemenplaza-8d9d8-default-rtdb.europe-west1.firebasedatabase.app/products.json";
const EXCHANGE_RATE = 140;
const WHATSAPP_NUMBER = "967775005190";
const SITE_URL = window.location.origin;

let allProducts = [];

// دوال تحديث SEO
function setMetaTag(property, content) {
  let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    if (property.startsWith('og:')) meta.setAttribute('property', property);
    else meta.setAttribute('name', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateSEO(product) {
  document.title = product.title + ' | يمن بلازا';
  const desc = (product.description || '').substring(0, 160) || product.title;
  setMetaTag('description', desc);
  setMetaTag('og:title', product.title);
  setMetaTag('og:description', desc);
  setMetaTag('og:image', product.image);
  setMetaTag('og:url', `${SITE_URL}/?product=${encodeURIComponent(product.id)}`);
  setMetaTag('og:type', 'product');
  setMetaTag('twitter:title', product.title);
  setMetaTag('twitter:description', desc);
  setMetaTag('twitter:image', product.image);
}

// دوال تنسيق السعر
function formatPrice(yerPrice) {
  if (!yerPrice || yerPrice <= 0) return 'للاستفسار';
  const sarPrice = Math.round(yerPrice / EXCHANGE_RATE);
  return Number(yerPrice).toLocaleString() + ' ر.ي <span class="sar-price">(' + sarPrice + ' ر.س)</span>';
}

// جلب المنتجات
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
    checkProductInURL();
  } catch (e) {
    grid.innerHTML = '<p>حدث خطأ في تحميل المنتجات.</p>';
    console.error(e);
  }
}

function displayProducts(products) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('a');
    card.className = 'product-card';
    card.href = `?product=${encodeURIComponent(p.id)}`;
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=يمن+بلازا'">
      <h3>${p.title}</h3>
      <div class="price">💰 ${formatPrice(p.price)}</div>
    `;
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(p);
      window.history.pushState({}, '', card.href);
      updateSEO(p);
    });
    grid.appendChild(card);
  });
}

// فتح النافذة المنبثقة
function openModal(product) {
  document.getElementById('modalTitle').innerText = product.title;
  document.getElementById('modalPrice').innerHTML = '💰 ' + formatPrice(product.price);
  document.getElementById('modalDesc').innerText = product.description || 'لا يوجد وصف.';

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

// التحقق من وجود product في الرابط عند التحميل
function checkProductInURL() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  if (productId && allProducts.length > 0) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      openModal(product);
      updateSEO(product);
    }
  }
}

// البدء
fetchProducts();

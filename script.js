const FIREBASE_DB_URL = "https://yemenplaza-8d9d8-default-rtdb.europe-west1.firebasedatabase.app/products.json";
const EXCHANGE_RATE = 140; // 1 ريال سعودي = 140 ريال يمني

let allProducts = [];

// دالة تنسيق السعر
function formatPrice(yerPrice) {
  if (!yerPrice || yerPrice <= 0) return 'للاستفسار';
  const sarPrice = Math.round(yerPrice / EXCHANGE_RATE);
  return Number(yerPrice).toLocaleString() + ' ر.ي <span class="sar-price">(' + sarPrice + ' ر.س)</span>';
}

// جلب المنتجات من Firebase
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

// عرض المنتجات
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
      <button class="btn-wa" onclick="event.stopPropagation(); window.open('https://wa.me/967775005190?text=' + encodeURIComponent('السلام عليكم، أريد طلب: ${p.title}'))">💬 واتساب</button>
    `;
    card.addEventListener('click', () => {
      // يمكنك إضافة فتح مودال هنا لاحقاً
      alert('الضغط على المنتج: ' + p.title);
    });
    grid.appendChild(card);
  });
}

// بدء تحميل المنتجات
fetchProducts();
// ==============================
// Config
// ==============================
const apiKey = '1c675b0d42a0cac97c949578e4bbd5cc'; // << API Key ของคุณ
const BASE = 'https://api.openweathermap.org/data/2.5';

// ==============================
// DOM
// ==============================
const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherInfoContainer = document.querySelector('#weather-info-container');
const clearLastBtn = document.querySelector('#clear-last'); // ถ้ามีปุ่มล้าง

// ==============================
// City mapping -> key for background
// ==============================
const CITY_BG_ALIAS = {
  'bangkok': 'bangkok', 'กรุงเทพ': 'bangkok', 'กรุงเทพมหานคร': 'bangkok',
  'chiang mai': 'chiangmai', 'chiangmai': 'chiangmai', 'เชียงใหม่': 'chiangmai',
  'chiang rai': 'chiangrai', 'chiangrai': 'chiangrai', 'เชียงราย': 'chiangrai',
  'phuket': 'phuket', 'ภูเก็ต': 'phuket',
};

// ==============================
// Helpers
// ==============================
// คืนค่า key เมือง (หรือ null)
function cityToKey(rawCity) {
  if (!rawCity) return null;
  const s = String(rawCity).toLowerCase().trim().replace(/\s+/g, ' ');
  return CITY_BG_ALIAS[s] ?? null;
}

// เปลี่ยนพื้นหลังตามสภาพอากาศ + เมือง
function updateBackground({ desc, city }) {
  const h = new Date().getHours();
  const d = (desc || '').toLowerCase();

  let weatherKey = 'default';
  if (d.includes('ฝน') || d.includes('rain')) weatherKey = 'rainy';
  else if (d.includes('เมฆ') || d.includes('cloud')) weatherKey = 'cloudy';
  else if (d.includes('แจ่มใส') || d.includes('clear') || d.includes('แดด')) weatherKey = 'sunny';

  // กลางคืน override
  if (h >= 19 || h < 5) weatherKey = 'night';

  document.body.setAttribute('data-bg', weatherKey);

  const cityKey = cityToKey(city);
  if (cityKey) document.body.setAttribute('data-city', cityKey);
  else document.body.removeAttribute('data-city');
}

// จัดการ localStorage
function saveLastCity(name){ localStorage.setItem('lastCity', name); }
function getLastCity(){ return localStorage.getItem('lastCity'); }
function clearLastCity(){ localStorage.removeItem('lastCity'); }

// ==============================
// Events
// ==============================
// ค้นหาเมือง
searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const cityName = cityInput.value.trim();
  if (!cityName) return alert('กรุณาป้อนชื่อเมือง');
  saveLastCity(cityName);
  await getWeather(cityName);
});

// โหลดเมืองล่าสุดอัตโนมัติ
window.addEventListener('DOMContentLoaded', () => {
  const lastCity = getLastCity();
  if (lastCity) {
    cityInput.value = lastCity;
    getWeather(lastCity);
  }
});

// ปุ่มล้าง (ถ้ามี)
if (clearLastBtn) {
  clearLastBtn.addEventListener('click', () => {
    clearLastCity();
    alert('ล้างเมืองล่าสุดแล้ว');
  });
}

// ==============================
// Current Weather
// ==============================
async function getWeather(city) {
  weatherInfoContainer.innerHTML = `<p>กำลังโหลดข้อมูล...</p>`;
  const url = `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=th`;

  try {
    const response = await fetch(url);
    if (response.status === 401) throw new Error('API Key ไม่ถูกต้อง');
    if (response.status === 404) { clearLastCity(); throw new Error('ไม่พบเมืองนี้'); }
    if (!response.ok) throw new Error('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');

    const data = await response.json();
    displayWeather(data);
    await getForecast(city);
  } catch (err) {
    weatherInfoContainer.innerHTML = `<p class="error">${err.message || 'เกิดข้อผิดพลาด'}</p>`;
  }
}

function displayWeather(data) {
  const { name, main, weather, wind } = data;
  const { temp, humidity } = main;
  const { description, icon } = weather[0];

  const weatherHtml = `
    <h2>${name}</h2>
    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
    <p class="temp">${Number(temp).toFixed(1)}°C</p>
    <p>${description}</p>
    <p>ความชื้น: ${humidity}%</p>
    ${wind?.speed != null ? `<p>ลม: ${wind.speed} m/s</p>` : ''}
  `;
  weatherInfoContainer.innerHTML = weatherHtml;

  // อัปเดตพื้นหลัง (สภาพอากาศ + เมือง)
  updateBackground({ desc: description, city: name });
}

// ==============================
// Forecast (5 days)
// ==============================
function formatThaiDate(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    dow:  d.toLocaleDateString('th-TH', { weekday: 'long' }),
  };
}

async function getForecast(city) {
  const url = `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=th`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('โหลดพยากรณ์ล่วงหน้าไม่สำเร็จ');

    const data = await response.json();
    const daily = data.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);

    let forecastHtml = `<h3>พยากรณ์ 5 วัน</h3><div class="forecast">`;
    daily.forEach(day => {
      const { temp } = day.main;
      const { description, icon } = day.weather[0];
      const { date, dow } = formatThaiDate(day.dt_txt);

      forecastHtml += `
        <article class="card-day">
          <div class="date">${date}</div>
          <div class="dow">${dow}</div>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
          <div class="temp temp--sm">${temp.toFixed(1)}°C</div>
          <div class="desc">${description}</div>
        </article>
      `;
    });
    forecastHtml += `</div>`;
    weatherInfoContainer.innerHTML += forecastHtml;
  } catch (err) {
    console.error(err);
  }
}

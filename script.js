const apiKey = '1c675b0d42a0cac97c949578e4bbd5cc'; // << วาง API Key ที่คัดลอกมาที่นี่

const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherInfoContainer = document.querySelector('#weather-info-container');

searchForm.addEventListener('submit', (event) => {
    event.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีโหลดเมื่อกด submit

    const cityName = cityInput.value.trim(); // .trim() เพื่อตัดช่องว่างหน้า-หลัง

    if (cityName) {
        getWeather(cityName);
    } else {
        alert('กรุณาป้อนชื่อเมือง');
    }
});

async function getWeather(city) {
    // แสดงสถานะ Loading
    weatherInfoContainer.innerHTML = `<p>กำลังโหลดข้อมูล...</p>`;

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=th`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('ไม่พบข้อมูลเมืองนี้');
        }

        const data = await response.json();
        displayWeather(data);

    } catch (error) {
        weatherInfoContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displayWeather(data) {
    // ใช้ Destructuring เพื่อดึงค่าที่ต้องการออกจาก Object
    const { name, main, weather } = data;
    const { temp, humidity } = main;
    const { description, icon } = weather[0];

    // ใช้ Template Literals ในการสร้าง HTML
    const weatherHtml = `
        <h2>${name}</h2>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        <p class="temp">${temp.toFixed(1)}°C</p>
        <p>${description}</p>
        <p>ความชื้น: ${humidity}%</p>
    `;

    weatherInfoContainer.innerHTML = weatherHtml;
}
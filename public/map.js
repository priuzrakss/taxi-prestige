// Инициализация карты
var map = L.map('map').setView([55.7558, 37.6173], 10); // Москва
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Переменные для хранения маркеров и линии маршрута
var markers = [];
var routeLine = null;

// Пользовательский контрол для кнопки "Моё местоположение"
var locateControl = L.Control.extend({
    options: { position: 'topright' }, // Позиция кнопки

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

        container.style.backgroundColor = 'white';
        container.style.width = '30px';
        container.style.height = '30px';
        container.style.cursor = 'pointer';

        container.innerHTML = '<i style="line-height:30px; font-size:16px; text-align:center; display:block;">📍</i>';

        container.onclick = function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    addMarker([lat, lng]);
                    map.setView([lat, lng], 13); // Центр карты на местоположение
                }, function () {
                    console.log('Не удалось получить местоположение');
                });
            } else {
                console.log('Geolocation не поддерживается');
            }
        };

        return container;
    }
});
map.addControl(new locateControl());

// Функция обратного геокодирования
function reverseGeocode(latlng, inputId) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`;

    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                document.getElementById(inputId).value = data.display_name; // Заполняем поле адреса
            } else {
                console.log('Не удалось получить адрес');
            }
        })
        .catch(error => console.error('Ошибка обратного геокодирования:', error));
}

// Функция обработки ввода текста и выполнения поиска с предложениями
function handleAddressInputWithSuggestions(inputId, resultsId, markerIndex) {
    document.getElementById(inputId).addEventListener('input', function (e) {
        const query = e.target.value.trim();
        const resultsContainer = document.getElementById(resultsId);

        if (query.length > 2) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    resultsContainer.innerHTML = ''; // Очищаем предыдущие результаты

                    data.forEach(location => {
                        const li = document.createElement('li');
                        li.textContent = location.display_name;
                        li.addEventListener('click', () => {
                            // Обновляем поле ввода выбранным адресом
                            document.getElementById(inputId).value = location.display_name;

                            // Добавляем или обновляем маркер
                            const lat = parseFloat(location.lat);
                            const lon = parseFloat(location.lon);
                            if (markers[markerIndex]) {
                                markers[markerIndex].setLatLng([lat, lon]); // Обновляем существующий маркер
                            } else {
                                addMarker([lat, lon]); // Добавляем новый маркер
                            }

                            map.setView([lat, lon], 13); // Центрируем карту на выбранный адрес
                            updateRoute(); // Пересчитываем маршрут
                            resultsContainer.innerHTML = ''; // Очищаем список результатов
                        });
                        resultsContainer.appendChild(li);
                    });
                })
                .catch(error => console.error('Ошибка поиска адреса:', error));
        } else {
            resultsContainer.innerHTML = ''; // Очищаем список, если введено меньше 3 символов
        }
    });
}

// Функция добавления маркера
function addMarker(latlng) {
    // Если уже есть два маркера, удаляем первый (старый)
    if (markers.length >= 2) {
        map.removeLayer(markers[0]); // Удаляем маркер с карты
        markers.shift(); // Удаляем маркер из массива
    }

    var marker = L.marker(latlng, { draggable: true }).addTo(map); // Создание нового маркера
    markers.push(marker);

    // Определяем, какое поле обновить (начало или конец маршрута)
    if (markers.length === 1) {
        reverseGeocode(latlng, 'from-address'); // Обновляем поле "Начало маршрута"
    } else if (markers.length === 2) {
        reverseGeocode(latlng, 'to-address'); // Обновляем поле "Конец маршрута"
    }

    updateRoute(); // Обновляем маршрут

    // Обработчик события "dragend" для пересчёта маршрута и обновления поля ввода
    marker.on('dragend', function () {
        const newLatLng = marker.getLatLng();
        if (markers[0] === marker) {
            reverseGeocode(newLatLng, 'from-address'); // Обновляем поле "Начало маршрута"
        } else if (markers[1] === marker) {
            reverseGeocode(newLatLng, 'to-address'); // Обновляем поле "Конец маршрута"
        }
        updateRoute();
    });

    // Удаление маркера по двойному клику
    marker.on('dblclick', function () {
        map.removeLayer(marker); // Удаляем маркер с карты
        markers = markers.filter(m => m !== marker); // Удаляем маркер из массива
        updateRoute(); // Пересчёт маршрута
    });
}

// Функция отображения маршрута через OSRM
function drawRouteWithOSRM(points) {
    if (points.length < 2) return; // Маршрут строится только если есть две точки

    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${points.map(p => `${p.lng},${p.lat}`).join(';')}?overview=full&geometries=geojson`;

    fetch(routeUrl)
        .then(response => response.json())
        .then(data => {
            if (routeLine) {
                map.removeLayer(routeLine); // Удаляем предыдущий маршрут
            }

            const route = data.routes[0].geometry; // Получаем геометрию маршрута
            routeLine = L.geoJSON(route, { color: 'blue', weight: 5 }).addTo(map); // Отображаем маршрут на карте

            calculateDistanceAndPrice(data.routes[0].distance); // Передаем расстояние для расчета
        })
        .catch(error => console.error('Ошибка загрузки маршрута:', error));
}

// Функция пересчёта маршрута
function updateRoute() {
    const points = markers.map(marker => marker.getLatLng());
    drawRouteWithOSRM(points); // Построение маршрута по точкам
}

// Функция расчёта стоимости
function calculateDistanceAndPrice(distanceInMeters) {
    const distanceInKm = distanceInMeters / 1000; // Перевод в километры
    console.log(`Расстояние: ${distanceInKm.toFixed(2)} км`);

    // Получаем текущий тариф
    const currentTariff = tariffs[currentTariffIndex];
    const pricePerKm = currentTariff.price;

    // Расчет стоимости
    const price = distanceInKm * pricePerKm;
    document.getElementById('price').textContent = `${price.toFixed(2)} ₽`;
}

// Привязываем обработчики ввода текста к полям адресов
handleAddressInputWithSuggestions('from-address', 'from-address-results', 0); // Поле "Начало маршрута"
handleAddressInputWithSuggestions('to-address', 'to-address-results', 1);   // Поле "Конец маршрута"

// Пример добавления маркера по клику на карту
map.on('click', function (e) {
    addMarker(e.latlng); // Добавление маркера на место клика
});


document.getElementById('comment_btn').addEventListener('click', function() {
    const popup = document.getElementById('popup');
    popup.style.display = 'block';
});

document.getElementById('close_popup').addEventListener('click', function() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
});



const tariffs = [
    { name: 'эконом', price: 30 },
    { name: 'комфорт', price: 35 },
    { name: 'комфорт +', price: 45 },
    { name: 'бизнес', price: 55 },
    { name: 'минивен', price: 50 }
];

// Индекс текущего тарифа
let currentTariffIndex = 0;

// Элементы текста
const tariffText = document.getElementById('tariff');
const priceText = document.getElementById('price-to-km');

// Функция обновления текста и пересчета цены
function updateTariffDisplay() {
    const currentTariff = tariffs[currentTariffIndex];
    tariffText.textContent = `${currentTariff.name}`;
    priceText.textContent = `${currentTariff.price}₽/км`;

    // Если уже есть рассчитанное расстояние, пересчитать стоимость
    if (markers.length === 2 && routeLine) {
        const points = markers.map(marker => marker.getLatLng());
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${points.map(p => `${p.lng},${p.lat}`).join(';')}?overview=false`;

        fetch(routeUrl)
            .then(response => response.json())
            .then(data => {
                if (data.routes && data.routes[0]) {
                    calculateDistanceAndPrice(data.routes[0].distance);
                }
            })
            .catch(error => console.error('Ошибка пересчета маршрута:', error));
    }
}

// Обработчик кнопки "Вперед"
document.getElementById('next_btn').addEventListener('click', function () {
    currentTariffIndex = (currentTariffIndex + 1) % tariffs.length; // Переход на следующий тариф
    updateTariffDisplay(); // Обновляем тариф и пересчитываем цену
});

// Обработчик кнопки "Назад"
document.getElementById('back_btn').addEventListener('click', function () {
    currentTariffIndex = (currentTariffIndex - 1 + tariffs.length) % tariffs.length; // Переход на предыдущий тариф
    updateTariffDisplay(); // Обновляем тариф и пересчитываем цену
});

// Инициализация текста при загрузке
updateTariffDisplay();

let isOrderButtonDisabled = false;

document.querySelector('.shadow_box_btn_2').addEventListener('click', () => {
    if (isOrderButtonDisabled) {
        showMessage('Пожалуйста, подождите перед отправкой следующего заказа.', 'error');
        return;
    }

    // Собираем данные из полей
    const fromAddress = document.getElementById('from-address').value;
    const toAddress = document.getElementById('to-address').value;
    const date = document.querySelector('.input_date').value;
    const time = document.querySelector('.input_time').value;
    const name = document.querySelector('.input_name').value;
    const phone = document.querySelector('.input_tel').value;
    const comment = document.getElementById('comment_input').value;
    const tariff = document.getElementById('tariff').textContent;
    const price = document.getElementById('price').textContent;

    // Проверяем, что обязательные поля заполнены
    if (!fromAddress || !toAddress || !date || !time || !name || !phone) {
        showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
        return;
    }

    // Проверка номера телефона
    const phoneRegex = /^\+7\d{10}$/; // Формат: +7 и 10 цифр
    if (!phoneRegex.test(phone)) {
        showMessage('Введите корректный номер телефона в формате +7XXXXXXXXXX.', 'error');
        return;
    }

    // Формируем объект данных
    const orderData = {
        fromAddress,
        toAddress,
        date,
        time,
        name,
        phone,
        comment,
        tariff,
        price
    };

    // Блокируем кнопку отправки
    isOrderButtonDisabled = true;
    document.querySelector('.shadow_box_btn_2').disabled = true;

    // Отправляем данные на сервер
    fetch('http://localhost:3000/api/order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (response.ok) {
            showMessage('Заказ успешно отправлен!', 'success');
        } else {
            return response.json().then(err => {
                throw new Error(err.message || 'Ошибка при отправке заказа.');
            });
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showMessage(`Ошибка при отправке заказа: ${error.message}`, 'error');
    })
    .finally(() => {
        // Устанавливаем таймер на 30 секунд
        setTimeout(() => {
            isOrderButtonDisabled = false;
            document.querySelector('.shadow_box_btn_2').disabled = false;
        }, 30000); // 30 секунд
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedTariff = urlParams.get('tariff'); // Извлекаем параметр "tariff"

    if (selectedTariff) {
        // Устанавливаем выбранный тариф
        const tariffDisplay = document.getElementById('tariff');
        if (tariffDisplay) {
            tariffDisplay.textContent = selectedTariff; // Отображаем выбранный тариф
        }

        // Если нужно обновить цену за км
        const tariffs = {
            "эконом": 30,
            "комфорт": 35,
            'комфорт+': 45,
            "бизнесс": 55,
            "минивен": 50
        };

        const pricePerKm = tariffs[selectedTariff];
        if (pricePerKm) {
            const priceDisplay = document.getElementById('price-to-km');
            if (priceDisplay) {
                priceDisplay.textContent = `Цена за км: ${pricePerKm}₽`;
            }
        }
    }
});

function showMessage(message, type = 'error') {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;

    // Устанавливаем класс для типа сообщения
    messageBox.className = `message-box ${type}`;
    messageBox.classList.remove('hidden');

    // Показываем сообщение
    setTimeout(() => {
        messageBox.style.opacity = '1';
        messageBox.style.transform = 'translateY(0)';
    }, 10);

    // Скрываем сообщение через 3 секунды
    setTimeout(() => {
        messageBox.style.opacity = '0';
        messageBox.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 300);
    }, 3000);
}

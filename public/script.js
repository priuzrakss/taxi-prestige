document.getElementById('more-info-btn').addEventListener('click', function() {
    document.getElementById('container').style.display = 'flex';
});

document.getElementById('close-btn').addEventListener('click', function() {
    document.getElementById('container').style.display = 'none';
});

document.getElementById('order-btn').addEventListener('click', function() {
    document.getElementById('tarrifs').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('order-btn1').addEventListener('click', function() {
    document.getElementById('tarrifs').scrollIntoView({ behavior: 'smooth' });
});


document.querySelectorAll('.link-block').forEach(link => {
    link.addEventListener('click', function() {
        const targetId = this.textContent.trim() === 'Где мы работает' ? 'where-we-work'
                       : this.textContent.trim() === 'Почему выбирают нас' ? 'why-choose-us'
                       : this.textContent.trim() === 'заказать такси' ? 'tarrifs'
                       : null;

        if (targetId) {
            document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
        }
    });
});


function selectTariff(tariff) {
    // Сохраняем выбранный тариф в localStorage
    localStorage.setItem('selectedTariff', tariff);
    // Переход на страницу /order
    window.location.href = '/order';
}

// На странице /order можно извлечь выбранный тариф
document.addEventListener('DOMContentLoaded', () => {
    const selectedTariff = localStorage.getItem('selectedTariff');
    if (selectedTariff) {
        // Например, установить значение в соответствующий элемент
        document.getElementById('tariff').innerText = `Выбранный тариф: ${selectedTariff}`;
    }

    document.querySelectorAll('.tariff-item').forEach(item => {
        item.addEventListener('click', () => {
            const tariffId = item.id; // Получаем ID выбранного тарифа
            window.location.href = `/order?tariff=${tariffId}`; // Переход на страницу с передачей тарифа через параметры URL
        });
    });

    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedTariffFromUrl = urlParams.get('tariff'); // Извлекаем параметр "tariff"

    if (selectedTariffFromUrl) {
        // Находим элемент для отображения тарифа
        const tariffDisplay = document.getElementById('tariff');
        if (tariffDisplay) {
            tariffDisplay.textContent = `Выбранный тариф: ${selectedTariffFromUrl}`;
        }

        // Если нужно обновить цену за км
        const tariffs = {
            econom: 30,
            comfort: 35,
            'comfort-plus': 45,
            buissnes: 55,
            minivan: 50
        };

        const pricePerKm = tariffs[selectedTariffFromUrl];
        if (pricePerKm) {
            const priceDisplay = document.getElementById('price-to-km');
            if (priceDisplay) {
                priceDisplay.textContent = `Цена за км: ${pricePerKm}₽`;
            }
        }
    }
});

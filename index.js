require('dotenv').config(); // Подключение dotenv
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;

// === Настройка Telegram-бота ===
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const chatId = process.env.TELEGRAM_CHAT_ID;
const userChatIds = new Set(); // Хранилище уникальных chatId

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userChatIds.add(chatId); // Сохраняем chatId
  bot.sendMessage(chatId, 'Добро пожаловать! Вы будете получать уведомления о заказах.');
});

// === Настройка статического сервера ===
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Для обработки JSON-запросов
app.use(cors({
    origin: 'https://prestige-taxiclub.ru' // Разрешить запросы только с этого домена
}));

// Ограничение: не более 1 запроса в 30 секунд с одного IP
const orderLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 секунд
    max: 1, // Максимум 1 запрос
    message: { message: 'Слишком много запросов. Пожалуйста, попробуйте позже.' }
});

// Применяем ограничение к маршруту /api/order
app.post('/api/order', orderLimiter, (req, res) => {
    console.log('Полученные данные:', req.body);
    const orderData = req.body; // Получаем данные из тела запроса

    // Используем orderData
    const message = `
🚖 *Новый заказ*:
- *Тариф*: ${orderData.tariff}
- *Откуда*: ${orderData.fromAddress}
- *Куда*: ${orderData.toAddress}
- *Дата*: ${orderData.date}
- *Время*: ${orderData.time}
- *Имя клиента*: ${orderData.name}
- *Телефон*: ${orderData.phone}
- *Комментарий*: ${orderData.comment || 'Нет'}
- *Цена*: ${orderData.price}
    `;

    // Отправляем сообщение в Telegram
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
        .then(() => res.json({ message: 'Заказ успешно отправлен' }))
        .catch(error => {
            console.error('Ошибка отправки сообщения:', error);
            res.status(500).json({ message: 'Ошибка отправки заказа' });
        });
});

// Обработчики для страниц
app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

app.get('/citys', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'citys.html'));
});

app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

// === Запуск сервера ===
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

fetch('https://prestige-taxiclub.ru/api/order', {
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
        showMessage('Ошибка при отправке заказа.', 'error');
    }
})
.catch(error => {
    console.error('Ошибка:', error);
    showMessage('Ошибка при отправке заказа.', 'error');
});

// Разрешить запросы с любого источника
app.use(cors());

// Или разрешить запросы только с определенного домена
app.use(cors({
    origin: 'https://prestige-taxiclub.ru' // Замените на ваш домен
}));

// Ваши маршруты
app.get('/', (req, res) => {
    res.send('CORS настроен!');
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});

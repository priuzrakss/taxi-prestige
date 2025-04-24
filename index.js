require('dotenv').config(); // Подключение dotenv
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;

// === Настройка Telegram-бота ===
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const userChatIds = new Set(); // Хранилище уникальных chatId

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userChatIds.add(chatId); // Сохраняем chatId
  bot.sendMessage(chatId, 'Добро пожаловать! Вы будете получать уведомления о заказах.');
});

// === Настройка статического сервера ===
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Для обработки JSON-запросов

// Ограничение: не более 1 запроса в 30 секунд с одного IP
const orderLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 секунд
    max: 1, // Максимум 1 запрос
    message: { message: 'Слишком много запросов. Пожалуйста, попробуйте позже.' }
});

// Применяем ограничение к маршруту /api/order
app.post('/api/order', orderLimiter, (req, res) => {
    console.log('Получен новый заказ с сайта. Отправка в Telegram...'); // Логирование начала обработки

    const orderData = req.body || {}; // Получаем данные из тела запроса или устанавливаем пустой объект

    console.log('Полученные данные:', orderData); // Логирование данных заказа

    const message = `
🚖 *Новый заказ*:
- *Тариф*: ${orderData.tariff || 'Не указано'}
- *Откуда*: ${orderData.fromAddress || 'Не указано'}
- *Куда*: ${orderData.toAddress || 'Не указано'}
- *Дата*: ${orderData.date || 'Не указано'}
- *Время*: ${orderData.time || 'Не указано'}
- *Имя клиента*: ${orderData.name || 'Не указано'}
- *Телефон*: ${orderData.phone || 'Не указано'}
- *Комментарий*: ${orderData.comment || 'Нет'}
- *Цена*: ${orderData.price || 'Не указано'}
    `;

    // Отправляем сообщение всем пользователям из userChatIds
    const sendPromises = Array.from(userChatIds).map(chatId =>
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    );

    // Ждем завершения всех отправок
    Promise.all(sendPromises)
        .then(() => {
            console.log('Сообщения отправлены всем пользователям'); // Логирование успешной отправки
            res.json({ message: 'Заказ успешно отправлен' });
        })
        .catch(error => {
            console.error('Ошибка отправки сообщений в Telegram:', error); // Логирование ошибки
            res.status(500).json({ message: 'Ошибка отправки заказа' });
        });
});

// Обработчики для страниц
app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Запуск сервера ===
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://0.0.0.0:${PORT}`);
});

require('dotenv').config(); // Подключение dotenv
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = 3000;

// === Настройка Телеграм-бота ===
const token = process.env.TELEGRAM_BOT_TOKEN; // Получаем токен из переменных окружения
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я теперь работаю с токеном из dotenv!');
});

// === Настройка статического сервера ===
app.use(express.static(path.join(__dirname, 'public')));

// === Пример маршрута для отправки сообщения ===
app.get('/send-message', (req, res) => {
    const chatId = 'ВАШ_CHAT_ID';
    const message = 'Сообщение, отправленное с сайта!';

    bot.sendMessage(chatId, message)
        .then(() => res.send('Сообщение успешно отправлено!'))
        .catch((err) => res.status(500).send(err));
});

// === Запуск сервера ===
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

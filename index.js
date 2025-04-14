require('dotenv').config(); // Подключение dotenv
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = 3000;

// === Настройка Телеграм-бота ===
const token = process.env.TELEGRAM_BOT_TOKEN; // Получаем токен из переменных окружения
const bot = new TelegramBot(token, { polling: true });


// === Настройка статического сервера ===
app.use(express.static(path.join(__dirname, 'public')));


// === Запуск сервера ===
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

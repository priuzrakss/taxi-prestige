require('dotenv').config(); // Подключение dotenv
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

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

// Обработчик POST-запроса для получения данных заказа
app.post('/api/order', (req, res) => {
  const { fromAddress, toAddress, date, time, name, phone, comment, tariff, price } = req.body;

  // Формируем сообщение для Telegram
  const message = `
🚖 *Новый заказ*:
- *Тариф*: ${tariff}
- *Откуда*: ${fromAddress}
- *Куда*: ${toAddress}
- *Дата*: ${date}
- *Время*: ${time}
- *Имя клиента*: ${name}
- *Телефон*: ${phone}
- *Комментарий*: ${comment || 'Нет'}
- *Цена*: ${price}
  `;

  // Отправляем сообщение всем пользователям
  const sendPromises = Array.from(userChatIds).map(chatId =>
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  );

  Promise.all(sendPromises)
    .then(() => {
      console.log('Сообщения отправлены всем пользователям');
      res.json({ message: 'Заказ успешно отправлен' });
    })
    .catch(error => {
      console.error('Ошибка отправки сообщений в Telegram:', error);
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

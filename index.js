require('dotenv').config(); // Подключение dotenv
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = 3000;

// === Настройка статического сервера ===
app.use(express.static(path.join(__dirname, 'public')));

// Обработчик POST-запроса для получения данных о маршруте
app.use(express.json()); // Для обработки JSON-запросов

app.post('/route-data', (req, res) => {
  const { start, end, distance, duration } = req.body;

  console.log('Получены данные о маршруте:');
  console.log(`Начальная точка: ${start.lat}, ${start.lng}`);
  console.log(`Конечная точка: ${end.lat}, ${end.lng}`);
  console.log(`Расстояние: ${distance} км`);
  console.log(`Время: ${duration} минут`);

  // Ответ клиенту
  res.json({ message: 'Данные о маршруте успешно получены' });
});

app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

// === Запуск сервера ===
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

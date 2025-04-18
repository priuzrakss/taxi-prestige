// Инициализация карты
const map = L.map('map').setView([55.751244, 37.618423], 13); // Координаты Москвы

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Маркеры для начальной и конечной точек
let startMarker, endMarker;

// Добавление маршрута
const routingControl = L.Routing.control({
  waypoints: [],
  routeWhileDragging: true,
  showAlternatives: true,
  geocoder: L.Control.Geocoder.nominatim(),
  createMarker: function(i, waypoint, n) {
    const marker = L.marker(waypoint.latLng, {
      draggable: true
    });
    marker.on('dragend', updateRoute);
    return marker;
  }
}).addTo(map);

// Обновление маршрута при перемещении маркеров
function updateRoute() {
  const waypoints = routingControl.getWaypoints();
  routingControl.setWaypoints(waypoints.map(wp => wp.latLng));
}

// Добавление начальной и конечной точек
map.on('click', function(e) {
  if (!startMarker) {
    startMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
    routingControl.spliceWaypoints(0, 1, e.latlng);
    startMarker.on('dragend', function() {
      routingControl.spliceWaypoints(0, 1, startMarker.getLatLng());
    });
  } else if (!endMarker) {
    endMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
    routingControl.spliceWaypoints(routingControl.getWaypoints().length - 1, 1, e.latlng);
    endMarker.on('dragend', function() {
      routingControl.spliceWaypoints(routingControl.getWaypoints().length - 1, 1, endMarker.getLatLng());
    });
  }
});

// Добавление поиска
const searchControl = L.Control.geocoder({
  defaultMarkGeocode: false
}).on('markgeocode', function(e) {
  const latlng = e.geocode.center;
  map.setView(latlng, 13);
  if (!startMarker) {
    startMarker = L.marker(latlng, { draggable: true }).addTo(map);
    routingControl.spliceWaypoints(0, 1, latlng);
    startMarker.on('dragend', function() {
      routingControl.spliceWaypoints(0, 1, startMarker.getLatLng());
    });
  } else if (!endMarker) {
    endMarker = L.marker(latlng, { draggable: true }).addTo(map);
    routingControl.spliceWaypoints(routingControl.getWaypoints().length - 1, 1, latlng);
    endMarker.on('dragend', function() {
      routingControl.spliceWaypoints(routingControl.getWaypoints().length - 1, 1, endMarker.getLatLng());
    });
  }
}).addTo(map);

// Обработчик события завершения построения маршрута
routingControl.on('routesfound', function(e) {
  const route = e.routes[0]; // Берем первый маршрут
  const waypoints = route.waypoints;
  const distance = route.summary.totalDistance / 1000; // Расстояние в километрах
  const duration = route.summary.totalTime / 60; // Время в минутах

  // Данные маршрута
  const routeData = {
    start: waypoints[0].latLng, // Начальная точка
    end: waypoints[waypoints.length - 1].latLng, // Конечная точка
    distance: distance.toFixed(2), // Расстояние
    duration: duration.toFixed(2) // Время
  };

  console.log('Маршрут:', routeData);

  // Отправка данных на сервер
  fetch('/route-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(routeData)
  })
    .then(response => response.json())
    .then(data => {
      console.log('Ответ от сервера:', data);
    })
    .catch(error => {
      console.error('Ошибка при отправке данных:', error);
    });
});
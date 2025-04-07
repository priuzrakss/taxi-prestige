const map = L.map('map').setView([55.751244, 37.618423], 10); // Москва

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let points = [];
let markers = [];

map.on('click', function (e) {
    if (points.length < 2) {
        const marker = L.marker(e.latlng, { draggable: true }).addTo(map);
        markers.push(marker);
        points.push(e.latlng);

        marker.on('dragend', function (event) {
            const newLatLng = event.target.getLatLng();
            const index = markers.indexOf(marker);
            points[index] = newLatLng;
            recalculateDistance();
        });

        if (points.length === 2) {
            calculateDistance(points[0], points[1]);
        }
    }
});

function recalculateDistance() {
    if (points.length === 2) {
        calculateDistance(points[0], points[1]);
    }
}

function calculateDistance(point1, point2) {
    const R = 6371; // Радиус Земли
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(point1.lat * (Math.PI / 180)) * Math.cos(point2.lat * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    alert(`Расстояние между точками: ${distance.toFixed(2)} км`);
}


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Добавляем контроль поиска на карту
L.Control.geocoder({
    defaultMarkGeocode: false
}).on('markgeocode', function(e) {
    const bbox = e.geocode.bbox;
    const poly = L.polygon([
        [bbox.getSouthEast().lat, bbox.getSouthEast().lng],
        [bbox.getNorthEast().lat, bbox.getNorthEast().lng],
        [bbox.getNorthWest().lat, bbox.getNorthWest().lng],
        [bbox.getSouthWest().lat, bbox.getSouthWest().lng]
    ]).addTo(map);

    map.fitBounds(poly.getBounds()); // Перемещение карты к результату поиска
}).addTo(map);

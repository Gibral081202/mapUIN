// 1. Daftar lokasi [lat, lng]
const locations = {
  "Gerbang Masuk": [-6.305935, 106.756365],
  "Rektorat": [-6.306534235036883, 106.75608692305701],
  "Perpustakaan Utama UIN": [-6.306235669305355, 106.75374456211429],
  "Fakultas Tarbiyah": [-6.307010219503448, 106.75525398564083],
  "Fakultas Dakwah dan Ilmu Komunikasi": [-6.306923834129737, 106.75381684535834],
  "Fakultas Syariah dan Hukum": [-6.306676206827617, 106.75446897054795],
  "Fakultas Ushulludin": [-6.306989050082036, 106.75369743608387],
  "Fakultas Dirasatislamiah": [-6.306035233402307, 106.75646844055376],
  "Fakultas Sains dan Teknologi": [-6.306139855701968, 106.75278601622435],
  "Fakultas Ekonomi dan Bisnis": [-6.310842653460389, 106.75663665374398],
  "Fakultas Adab dan Humaniora": [-6.313395909618644, 106.75537678257993],
  "Masjid SC": [-6.306383990792286, 106.75467067458592],
  "Fakultas Psikologi": [-6.30977187185468, 106.75887800795468],
  "Fakultas PPG UIN Syarifhidayatullah Jakarta": [-6.386343084246751, 106.74500976049077],
  "Fakultas Kedokteran": [-6.311960466760869, 106.76000371445464]
};

// 2. Inisialisasi peta
const map = L.map('map').setView([-6.305935, 106.756365], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 3. Icon kustom (bisa ganti URL jika mau icon lain)
const locationIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png',
  iconSize:     [25, 41],
  iconAnchor:   [12, 41],
  popupAnchor:  [1, -34],
  shadowSize:   [41, 41]
});

// 4. Ambil elemen kontrol
const startSelect = document.getElementById('start');
const endSelect   = document.getElementById('end');
const modeSelect  = document.getElementById('mode');
const routeBtn    = document.getElementById('routeBtn');
const infoDiv     = document.getElementById('info');

// 5. Isi dropdown dengan nama lokasi
Object.keys(locations).forEach(name => {
  const o1 = document.createElement('option');
  o1.value = name; o1.text = name;
  startSelect.add(o1);

  const o2 = document.createElement('option');
  o2.value = name; o2.text = name;
  endSelect.add(o2);
});

// 6. Variabel global untuk layer rute & marker
let routeLayer, startMarker, endMarker;

// 7. Event saat tombol ditekan
routeBtn.addEventListener('click', () => {
  const startLoc = startSelect.value;
  const endLoc   = endSelect.value;
  const mode     = modeSelect.value;

  if (startLoc === endLoc) {
    alert("Titik asal dan tujuan tidak boleh sama.");
    return;
  }

  // swap [lat,lng] → [lng,lat] untuk API
  const [lat1, lng1] = locations[startLoc];
  const [lat2, lng2] = locations[endLoc];
  const coords = [
    [lng1, lat1],
    [lng2, lat2]
  ];

  const apiKey = '5b3ce3597851110001cf6248a3c72f79617b45b7a5e42d202e7e70e5';
  const url    = `https://api.openrouteservice.org/v2/directions/${mode}/geojson`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Accept':       'application/json, application/geo+json',
      'Authorization': apiKey,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ coordinates: coords })
  })
  .then(res => {
    if (!res.ok) return res.json().then(e => { throw new Error(e.error || res.statusText); });
    return res.json();
  })
  .then(data => {
    // 7a. Hapus rute & marker lama
    if (routeLayer)   map.removeLayer(routeLayer);
    if (startMarker)  map.removeLayer(startMarker);
    if (endMarker)    map.removeLayer(endMarker);

    // 7b. Gambar rute baru
    routeLayer = L.geoJSON(data, {
      style: { color: 'blue', weight: 5 }
    }).addTo(map);

    // 7c. Tambah marker titik asal + popup
    startMarker = L.marker([lat1, lng1], { icon: locationIcon })
      .addTo(map)
      .bindPopup(`<strong>${startLoc}</strong><br>Koordinat: ${lat1.toFixed(6)}, ${lng1.toFixed(6)}`);

    // 7d. Tambah marker titik tujuan + popup
    endMarker = L.marker([lat2, lng2], { icon: locationIcon })
      .addTo(map)
      .bindPopup(`<strong>${endLoc}</strong><br>Koordinat: ${lat2.toFixed(6)}, ${lng2.toFixed(6)}`);

    // 7e. Sesuaikan viewport agar muat semua
    const group = L.featureGroup([routeLayer, startMarker, endMarker]);
    map.fitBounds(group.getBounds().pad(0.2));

    // 7f. Update info teks
    const sum      = data.features[0].properties.summary;
    const dist     = (sum.distance / 1000).toFixed(2);
    const duration = Math.ceil(sum.duration / 60);
    infoDiv.innerHTML = `
      <strong>Rute dari ${startLoc} ke ${endLoc}:</strong><br>
      Jarak: ${dist} km<br>
      Estimasi Waktu: ${duration} menit
    `;
  })
  .catch(err => {
    console.error('Fetch error:', err);
    alert(`Gagal mengambil rute: ${err.message}`);
  });
});

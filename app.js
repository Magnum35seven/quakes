// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW reg failed:', err));
}

// 1. Initialize Map with a Lighter, High-Contrast Basemap Theme
const map = L.map('map', { zoomControl: false }).setView([20, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  maxZoom: 18
}).addTo(map);

// 2. Initialize Layer Groups (Fallback to standard L.layerGroup if Cluster plugin is missing)
const quakeLayer = typeof L.markerClusterGroup === 'function' ? L.markerClusterGroup() : L.layerGroup();
const volcanoLayer = L.layerGroup();
const fireLayer = typeof L.markerClusterGroup === 'function' ? L.markerClusterGroup() : L.layerGroup();

map.addLayer(quakeLayer);
map.addLayer(volcanoLayer);
map.addLayer(fireLayer);

// -------------------------------------------------------------
// 3. Dynamic Inline SVG Icon Generators
// -------------------------------------------------------------

function createEarthquakeIcon(magnitude) {
  const size = Math.max(magnitude * 5, 22);
  const color = magnitude >= 6.0 ? '#d32f2f' : '#f57c00';
  
  return L.divIcon({
    className: 'custom-svg-marker',
    html: `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
        <circle cx="50" cy="50" r="45" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="4">
          <animate attributeName="r" values="25;48;25" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="50" cy="50" r="20" fill="${color}" stroke="#ffffff" stroke-width="3"/>
      </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

function createVolcanoIcon() {
  return L.divIcon({
    className: 'custom-svg-marker',
    html: `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 22H22L12 2Z" fill="#d84315" stroke="#ffffff" stroke-width="1.5"/>
        <path d="M12 7L6 19H18L12 7Z" fill="#fbc02d"/>
        <circle cx="12" cy="4" r="2" fill="#616161"/>
      </svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });
}

function createWildfireIcon() {
  return L.divIcon({
    className: 'custom-svg-marker',
    html: `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 11 15 7.5 13 2C12 5.5 9 8.5 9 12C9 10 7.5 9 6.5 9C4.5 11.5 4.5 13.5 4.5 15.5C4.5 19.6421 7.85786 23 12 23Z" fill="#e65100" stroke="#ffffff" stroke-width="1.5"/>
        <path d="M12 20C13.933 20 15.5 18.433 15.5 16.5C15.5 14.5 13.5 13 12.5 10.5C12 12 10.5 13 10.5 14.5C10.5 13.5 9.5 13 9 13C8 14.25 8 15.25 8 16.5C8 18.433 9.567 20 12 20Z" fill="#ffeb3b"/>
      </svg>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26]
  });
}

function createUserLocationIcon() {
  return L.divIcon({
    className: 'custom-svg-marker',
    html: `
      <svg width="30" height="30" viewBox="0 0 100 100" style="overflow: visible;">
        <circle cx="50" cy="50" r="40" fill="#0288d1" fill-opacity="0.3" stroke="#0288d1" stroke-width="4">
          <animate attributeName="r" values="20;45;20" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="50" cy="50" r="18" fill="#0288d1" stroke="#ffffff" stroke-width="4"/>
      </svg>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

// -------------------------------------------------------------
// 4. API Fetchers (Strictly Past 48 Hours)
// -------------------------------------------------------------

// A. Fetch USGS Earthquakes (Past 48 Hours, M4.5+)
async function loadEarthquakes() {
  const now = new Date();
  const past48Hours = new Date(now.getTime() - (48 * 60 * 60 * 1000)).toISOString();
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${past48Hours}&minmagnitude=4.5`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (quakeLayer.clearLayers) quakeLayer.clearLayers();

    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const mag = feature.properties.mag;
        const marker = L.marker(latlng, { icon: createEarthquakeIcon(mag) });
        marker.bindPopup(`
          <strong>🔴 Earthquake (Past 48h)</strong><br/>
          <strong>Location:</strong> ${feature.properties.place}<br/>
          <strong>Magnitude:</strong> ${mag}<br/>
          <strong>Time:</strong> ${new Date(feature.properties.time).toLocaleString()}
        `);
        return marker;
      }
    }).addTo(quakeLayer);
  } catch (e) {
    console.error('Failed to load earthquakes:', e);
  }
}

// B. Fetch NASA EONET Active Wildfires (Past 48 Hours / 2 Days)
async function loadWildfires() {
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&days=2';
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (fireLayer.clearLayers) fireLayer.clearLayers();

    data.events.forEach(event => {
      const geometry = event.geometry[event.geometry.length - 1];
      if (geometry && geometry.type === 'Point') {
        const latlng = [geometry.coordinates[1], geometry.coordinates[0]];
        const marker = L.marker(latlng, { icon: createWildfireIcon() });
        marker.bindPopup(`
          <strong>🔥 Active Wildfire (Past 48h)</strong><br/>
          <strong>Name:</strong> ${event.title}<br/>
          <strong>Source:</strong> NASA EONET
        `);
        fireLayer.addLayer(marker);
      }
    });
  } catch (e) {
    console.error('Failed to load wildfires:', e);
  }
}

// C. Fetch Volcano Activity (Past 48 Hours / 2 Days)
async function loadVolcanoes() {
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=volcanoes&status=open&days=2';
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (volcanoLayer.clearLayers) volcanoLayer.clearLayers();

    data.events.forEach(event => {
      const geometry = event.geometry[0];
      if (geometry && geometry.type === 'Point') {
        const latlng = [geometry.coordinates[1], geometry.coordinates[0]];
        const marker = L.marker(latlng, { icon: createVolcanoIcon() });
        marker.bindPopup(`
          <strong>🌋 Volcanic Activity (Past 48h)</strong><br/>
          <strong>Name:</strong> ${event.title}<br/>
          <strong>Source:</strong> NASA EONET
        `);
        volcanoLayer.addLayer(marker);
      }
    });
  } catch (e) {
    console.error('Failed to load volcanoes:', e);
  }
}

// Initial Execution
loadEarthquakes();
loadWildfires();
loadVolcanoes();

// -------------------------------------------------------------
// 5. Checkbox Layer Controls
// -------------------------------------------------------------

const quakeToggle = document.getElementById('toggle-quakes');
const fireToggle = document.getElementById('toggle-fires');
const volcanoToggle = document.getElementById('toggle-volcanoes');

if (quakeToggle) {
  quakeToggle.addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(quakeLayer) : map.removeLayer(quakeLayer);
  });
}
if (fireToggle) {
  fireToggle.addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(fireLayer) : map.removeLayer(fireLayer);
  });
}
if (volcanoToggle) {
  volcanoToggle.addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(volcanoLayer) : map.removeLayer(volcanoLayer);
  });
}

// -------------------------------------------------------------
// 6. Navigation Controls (Global vs. Near Me)
// -------------------------------------------------------------

const btnGlobal = document.getElementById('btn-global');
const btnLocal = document.getElementById('btn-local');
let userMarker = null;

if (btnGlobal) {
  btnGlobal.addEventListener('click', () => {
    map.flyTo([20, 0], 2);
    btnGlobal.classList.add('active');
    if (btnLocal) btnLocal.classList.remove('active');
  });
}

if (btnLocal) {
  btnLocal.addEventListener('click', () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.flyTo([latitude, longitude], 7, { animate: true, duration: 1.5 });
          
          if (userMarker) map.removeLayer(userMarker);

          userMarker = L.marker([latitude, longitude], { icon: createUserLocationIcon() })
            .addTo(map)
            .bindPopup('📍 Your Current Location')
            .openPopup();

          btnLocal.classList.add('active');
          if (btnGlobal) btnGlobal.classList.remove('active');
        },
        (err) => alert('Unable to retrieve location: ' + err.message)
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  });
}

# 🌐 TerraPulse — Real-Time Global Hazard Tracker PWA

**TerraPulse** is a lightweight, high-performance Progressive Web App (PWA) designed for real-time tracking of major natural hazards across the globe. Built with pure vanilla JavaScript, HTML5, Leaflet.js, and CSS, it aggregates real-time scientific feeds to map active **Earthquakes**, **Volcanoes**, and **Wildfires** without requiring any backend server or database infrastructure.

---

## ✨ Features

- 🌍 **Global & Regional Views:** Switch seamlessly between a macro worldwide perspective and a high-zoom regional view centered on your current location (`navigator.geolocation`).
- 🔴 **Live Earthquake Tracking:** Auto-fetches magnitude $M \ge 4.5$ seismic events directly from the **USGS (U.S. Geological Survey)** API. Pulsing marker animations scale with magnitude.
- 🌋 **Active Volcano Monitoring:** Pulls active volcanic unrest and eruption events from the **NASA EONET (Earth Observatory Natural Event Tracker)** / Smithsonian data feeds.
- 🔥 **Wildfire Thermal Hotspots:** Displays active wildfire perimeters and thermal anomalies sourced from NASA's EONET satellite network.
- 🎨 **Animated Inline SVG Markers:** Zero external icon dependencies. Icons are dynamically generated inline using pure SVG and standard CSS animations for optimal performance and crisp rendering.
- 📱 **Full PWA Capabilities:** Features a custom Web App Manifest and Service Worker (`sw.js`) utilizing a *stale-while-revalidate* caching strategy for offline resiliency and home-screen installability on iOS, Android, macOS, and Windows.
- 🎛️ **Interactive Layer Toggling & Clustering:** Dynamic layer controls allow users to filter hazard types on the fly, while `Leaflet.markercluster` prevents map clutter in dense event zones.

---

## 📁 Project Structure

```text
terrapulse-pwa/
├── index.html        # App UI shell, PWA meta tags, and Leaflet dependencies
├── app.js            # Core engine (Map initialization, SVG generators, live API fetchers)
├── styles.css        # Responsive dark theme, glassmorphism overlays & marker resets
├── sw.js             # Service Worker for asset caching and offline resilience
├── manifest.json     # Web App Manifest for mobile/desktop PWA installation
└── README.md         # Full setup, architecture, and API documentation
```

---

## 🚀 Quick Start & Deployment

### 1. Local Development
Because PWAs require a secure context for **Service Workers** and the **Geolocation API**, you must serve the files over `localhost` or an HTTPS server.

#### Option A: Using Python (Built-in)
Navigate to your project directory in terminal/command prompt and run:
```bash
python3 -m http.server 8000
```
Open your browser and navigate to: `http://localhost:8000`

#### Option B: Using Node.js (`serve` or `live-server`)
```bash
npx serve .
```

---

### 2. Live Deployment (Free Hosting)
You can host TerraPulse for free on any static web host. Make sure HTTPS is enabled:

- **GitHub Pages:** Push your repository to GitHub, go to **Settings > Pages**, select `main` branch, and save.
- **Vercel:** Run `npx vercel` in the project folder or import your GitHub repository into the Vercel Dashboard.
- **Netlify:** Drag and drop the `terrapulse-pwa` folder directly into the Netlify Drop interface.

---

## 📡 Live Scientific Data APIs Used

| Hazard Type | Data Source | Format | Update Frequency |
| :--- | :--- | :--- | :--- |
| **Earthquakes ($M \ge 4.5$)** | [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) | GeoJSON | Real-Time (~1 min) |
| **Active Volcanoes** | [NASA EONET API (v3)](https://eonet.gsfc.nasa.gov/) | GeoJSON / JSON | Hourly |
| **Wildfires & Thermal Hotspots** | [NASA EONET API (v3)](https://eonet.gsfc.nasa.gov/) | GeoJSON / JSON | Hourly |
| **Map Base Layer** | [CARTO Dark Matter Tiles](https://carto.com/attributions) | Raster Tiles | Static / Cached |

---

## 🛠️ Customization & Tweaks

### Changing Earthquake Magnitude Threshold
In `app.js`, edit the `minmagnitude` parameter in the USGS API endpoint:
```javascript
// Change minmagnitude=4.5 to 2.5 for smaller quakes or 6.0 for major quakes only
const url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5';
```

### Adjusting Map Base Theme
To switch from CARTO Dark Matter to standard OpenStreetMap or Satellite tiles, update the tile layer setup in `app.js`:
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);
```

---

## 📄 License
This project is open-source and available under the **MIT License**.

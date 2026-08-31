import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getIcon = (type) => {
  const color = type === 'Electricity' ? '#f59e0b' : type === 'Water' ? '#0ea5e9' : '#ef4444';
  const symbol = type === 'Electricity' ? '⚡' : type === 'Water' ? '💧' : '🔥';
  return L.divIcon({
    html: `<div style="background-color: ${color}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);">${symbol}</div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const DHAKA_CENTER = [23.8103, 90.4125];
const DEFAULT_ZOOM = 12;
const FULL_MAP_ZOOM = 13;

const bangladeshMaskGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
      [[88.01, 20.59], [88.01, 26.63], [92.67, 26.63], [92.67, 20.59], [88.01, 20.59]],
    ],
  },
};

const HATCH_PATTERN_ID = 'bd-hatch-tech';
const injectHatchPattern = () => {
  if (document.getElementById(HATCH_PATTERN_ID)) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  svg.innerHTML = `<defs><pattern id="${HATCH_PATTERN_ID}" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#334155" stroke-width="3"/></pattern></defs>`;
  document.body.appendChild(svg);
};

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  ASSIGNED: '#0ea5e9',
  RESOLVED: '#22c55e',
  REPORTED: '#f59e0b',
};

const maskStyle = {
  fillColor: `url(#${HATCH_PATTERN_ID})`,
  fillOpacity: 1,
  color: '#0f172a',
  weight: 2,
  opacity: 0.9,
};


// ── Preview Map Component ──
export function PreviewMap({ outages, onClick }) {
  const renderedPreviewMarkers = [];

  for (let i = 0; i < outages.length; i++) {
    const outageItem = outages[i];

    renderedPreviewMarkers.push(
      <Marker key={outageItem._id} position={[outageItem.latitude, outageItem.longitude]} icon={getIcon(outageItem.utilityType)}>
        <Popup>
          <div style={{ fontFamily: 'sans-serif' }}>
            <strong style={{ color: '#0ea5e9' }}>{outageItem.utilityType}</strong><br />{outageItem.locationName}
          </div>
        </Popup>
      </Marker>
    );
  }

  return (
    <div
      onClick={onClick}
      className="flex-none h-80 w-full rounded-2xl overflow-hidden cursor-pointer border border-slate-800 hover:border-cyan-500/30 transition-all"
    >
      <MapContainer
        center={DHAKA_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        
        {renderedPreviewMarkers}

      </MapContainer>
    </div>
  );
}


// ── Full Interactive Map Component ──
export function TechFullMap({ outages, setSelectedIncident }) {
  React.useEffect(() => { injectHatchPattern(); }, []);

  const renderedFullMarkers = [];

  for (let i = 0; i < outages.length; i++) {
    const outageItem = outages[i];

    renderedFullMarkers.push(
      <Marker
        key={outageItem._id}
        position={[outageItem.latitude, outageItem.longitude]}
        icon={getIcon(outageItem.utilityType)}
        eventHandlers={{ click: () => setSelectedIncident(outageItem) }}
      >
        <Popup>
          <div style={{ fontFamily: 'sans-serif', minWidth: '150px' }}>
            <strong style={{ fontSize: '14px', color: '#0ea5e9' }}>{outageItem.utilityType}</strong><br />
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{outageItem.locationName}</span><br />
            <span style={{ fontSize: '11px', color: '#555' }}>{outageItem.description}</span><br />
            <span style={{ fontSize: '10px', color: STATUS_COLORS[outageItem.status] || '#aaa' }}>● {outageItem.status}</span><br />
            <span style={{ fontSize: '10px', fontStyle: 'italic', color: '#777' }}>Reported by: {outageItem.reporterName}</span>
          </div>
        </Popup>
      </Marker>
    );
  }

  return (
    <MapContainer
      center={DHAKA_CENTER}
      zoom={FULL_MAP_ZOOM}
      style={{ height: '100%', width: '100%' }}
      className="rounded-2xl"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <GeoJSON data={bangladeshMaskGeoJSON} style={maskStyle} onEachFeature={(f, l) => { l.options.interactive = false; }} />
      
      {renderedFullMarkers}

    </MapContainer>
  );
}
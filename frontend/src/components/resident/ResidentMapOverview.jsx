import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ahnaf start
const STATUS_COLORS = {
  PENDING:  '#f59e0b',
  ASSIGNED: '#0ea5e9',
  ON_WAY:   '#fb923c',
  ON_SITE:  '#a855f7',
  RESOLVED: '#22c55e',
  REPORTED: '#f59e0b',
};

const STATUS_LABELS = {
  PENDING:  'Reported — Pending Review',
  ASSIGNED: 'Technician Assigned',
  ON_WAY:   'Crew On The Way 🚗',
  ON_SITE:  'Crew On Site 📍',
  RESOLVED: 'Resolved ✓',
};
// ahnaf end

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

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Turan: Animated pulsing vehicle marker icon for technician live tracking (Location Feature)
const getTechnicianIcon = () => L.divIcon({
  html: `
    <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;
        width:42px;
        height:42px;
        border-radius:50%;
        background:rgba(251,146,60,0.25);
        border:2px solid #fb923c;
        animation:techPulse 1.5s infinite;
      "></div>
      <div style="
        position:relative;
        width:28px;
        height:28px;
        border-radius:50%;
        background:#fb923c;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:15px;
        border:2px solid white;
        box-shadow:0 0 8px rgba(251,146,60,0.8);
        z-index:2;
      ">🚗</div>
    </div>
    <style>
      @keyframes techPulse {
        0%   { transform: scale(1); opacity: 1; }
        70%  { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1); opacity: 0; }
      }
    </style>`,
  className: 'tech-location-icon',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -22],
});
// Turan End

const DHAKA_CENTER = [23.8103, 90.4125];
const DEFAULT_ZOOM = 12;
const FULL_MAP_ZOOM = 13;

const BANGLADESH_BOUNDS = {
  minLat: 20.59,
  maxLat: 26.63,
  minLng: 88.01,
  maxLng: 92.67,
};

export const isInsideBangladesh = (lat, lng) => {
  if (lat >= BANGLADESH_BOUNDS.minLat) {
    if (lat <= BANGLADESH_BOUNDS.maxLat) {
      if (lng >= BANGLADESH_BOUNDS.minLng) {
        if (lng <= BANGLADESH_BOUNDS.maxLng) {
          return true;
        }
      }
    }
  }
  return false;
};

const bangladeshMaskGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
      ],
      [
        [88.01, 20.59],
        [88.01, 26.63],
        [92.67, 26.63],
        [92.67, 20.59],
        [88.01, 20.59],
      ],
    ],
  },
};

const HATCH_PATTERN_ID = 'bd-hatch';
const injectHatchPattern = () => {
  if (document.getElementById(HATCH_PATTERN_ID)) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  svg.innerHTML = `
    <defs>
      <pattern id="${HATCH_PATTERN_ID}" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="#334155" stroke-width="3"/>
      </pattern>
    </defs>`;
  document.body.appendChild(svg);
};

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}


export function PreviewMap({ outages, onClick }) {
  const renderedMarkers = [];

  for (let i = 0; i < outages.length; i++) {
    const item = outages[i];
    renderedMarkers.push(
      <Marker key={item._id} position={[item.latitude, item.longitude]} icon={getIcon(item.utilityType)}>
        <Popup>
          <div style={{ fontFamily: 'sans-serif' }}>
            <strong style={{ color: '#0ea5e9' }}>{item.utilityType}</strong>
            <br />
            {item.locationName}
            <br />
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>
              Confirmed by {item.upvotes || 0} residents
            </span>
          </div>
        </Popup>
      </Marker>
    );
  }

  // Turan: Render live technician vehicle markers for ON_WAY outages (Location Feature)
  const techMarkers = [];
  for (let i = 0; i < outages.length; i++) {
    const item = outages[i];
    if (
      item.status === 'ON_WAY' &&
      item.technicianLocation &&
      item.technicianLocation.latitude &&
      item.technicianLocation.longitude
    ) {
      techMarkers.push(
        <Marker
          key={`tech-${item._id}`}
          position={[item.technicianLocation.latitude, item.technicianLocation.longitude]}
          icon={getTechnicianIcon()}
        >
          <Popup>
            <div style={{ fontFamily: 'sans-serif' }}>
              <strong style={{ color: '#fb923c' }}>🚗 Crew En Route</strong><br />
              <span style={{ fontSize: '11px' }}>Heading to: {item.locationName}</span><br />
              <span style={{ fontSize: '10px', color: '#777' }}>Assigned: {item.assignedToName}</span>
            </div>
          </Popup>
        </Marker>
      );
    }
  }
  // Turan End

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
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {renderedMarkers}
        {/* Turan: Render technician vehicle markers (Location Feature) */}
        {techMarkers}
        {/* Turan End */}
      </MapContainer>
    </div>
  );
}


export function FullMap({ outages, onMapClick, clickedPosition, setSelectedIncident }) {
  React.useEffect(() => {
    injectHatchPattern();
  }, []);

  const maskStyle = {
    fillColor: `url(#${HATCH_PATTERN_ID})`,
    fillOpacity: 1,
    color: '#0f172a',
    weight: 2,
    opacity: 0.9,
  };

  const onEachMaskFeature = (feature, layer) => {
    layer.options.interactive = false;
  };

  // Turan: Render live technician vehicle markers for ON_WAY outages in FullMap (Location Feature)
  const techMarkersFullMap = [];
  for (let i = 0; i < outages.length; i++) {
    const item = outages[i];
    if (
      item.status === 'ON_WAY' &&
      item.technicianLocation &&
      item.technicianLocation.latitude &&
      item.technicianLocation.longitude
    ) {
      techMarkersFullMap.push(
        <Marker
          key={`tech-full-${item._id}`}
          position={[item.technicianLocation.latitude, item.technicianLocation.longitude]}
          icon={getTechnicianIcon()}
        >
          <Popup>
            <div style={{ fontFamily: 'sans-serif', minWidth: '150px' }}>
              <strong style={{ color: '#fb923c', fontSize: '14px' }}>🚗 Crew On The Way</strong><br />
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>→ {item.locationName}</span><br />
              <span style={{ fontSize: '11px', color: '#555' }}>Technician: {item.assignedToName}</span><br />
              <span style={{ fontSize: '10px', color: '#fb923c', fontWeight: 'bold' }}>● Live Location</span>
            </div>
          </Popup>
        </Marker>
      );
    }
  }
  // Turan End

  return (
    <MapContainer
      center={DHAKA_CENTER}
      zoom={FULL_MAP_ZOOM}
      style={{ height: '100%', width: '100%' }}
      className="rounded-2xl"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <GeoJSON
        data={bangladeshMaskGeoJSON}
        style={maskStyle}
        onEachFeature={onEachMaskFeature}
      />

      <ClickHandler onMapClick={onMapClick} />

      {/* Outage incident markers */}
      {outages.map((item) => (
        <Marker
          key={item._id}
          position={[item.latitude, item.longitude]}
          icon={getIcon(item.utilityType)}
          eventHandlers={{ click: () => setSelectedIncident(item) }}
        >
          <Popup>
            <div style={{ fontFamily: 'sans-serif', minWidth: '150px' }}>
              <strong style={{ fontSize: '14px', color: '#0ea5e9' }}>{item.utilityType}</strong><br />
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.locationName}</span><br />
              <span style={{ fontSize: '11px', color: '#555' }}>{item.description}</span><br />
              <span style={{ fontSize: '10px', fontStyle: 'italic', color: '#777' }}>Reported by: {item.reporterName}</span><br />
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>
                Confirmed by {item.upvotes || 0} residents
              </span>
              {/* ahnaf start */}
              <br />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: STATUS_COLORS[item.status] || '#aaa' }}>
                ● {STATUS_LABELS[item.status] || item.status}
              </span>
              {/* ahnaf end */}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Turan: Technician live vehicle markers in full map view (Location Feature) */}
      {techMarkersFullMap}
      {/* Turan End */}

      {clickedPosition && (
        <Marker position={clickedPosition} icon={redIcon}>
          <Popup>New report location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
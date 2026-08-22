import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiNavigation, FiPhone, FiGlobe, FiMapPin, FiShield, FiHeart } from "react-icons/fi";

// Fix Leaflet marker icon asset paths for Vite/React bundler
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Donor Location Marker (Blue Pulse)
const donorUserIcon = L.divIcon({
  className: "custom-user-location-marker",
  html: `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
      background: #3b82f6;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.8), 0 2px 4px rgba(0,0,0,0.3);
    ">
      <div style="
        position: absolute;
        top: -6px;
        left: -6px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.35);
        animation: pulse 2s infinite;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom Database Orphanage Marker (Emerald)
const dbOrphanageIcon = L.divIcon({
  className: "custom-db-orphanage-marker",
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        <svg stroke="currentColor" fill="none" stroke-width="2.5" viewBox="0 0 24 24" height="16" width="16">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom OSM Orphanage Marker (Indigo)
const osmOrphanageIcon = L.divIcon({
  className: "custom-osm-orphanage-marker",
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 4px 8px rgba(99, 102, 241, 0.4);
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        <svg stroke="currentColor" fill="none" stroke-width="2.5" viewBox="0 0 24 24" height="16" width="16">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Selected Highlight Marker (Amber Ring)
const selectedOrphanageIcon = L.divIcon({
  className: "custom-selected-orphanage-marker",
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #ffffff;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.5), 0 6px 12px rgba(0, 0, 0, 0.3);
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        <svg stroke="currentColor" fill="none" stroke-width="2.5" viewBox="0 0 24 24" height="18" width="18">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// Component to dynamically fit map view bounds to user location + nearby markers
function AutoCenterMap({ userCoords, orphanages, selectedOrphanage }) {
  const map = useMap();

  useEffect(() => {
    if (selectedOrphanage && selectedOrphanage.latitude && selectedOrphanage.longitude) {
      map.flyTo([selectedOrphanage.latitude, selectedOrphanage.longitude], 15, {
        duration: 1.2,
      });
      return;
    }

    const points = [];
    if (userCoords && userCoords.lat && userCoords.lng) {
      points.push([userCoords.lat, userCoords.lng]);
    }

    orphanages.forEach((o) => {
      if (o.latitude && o.longitude) {
        points.push([o.latitude, o.longitude]);
      }
    });

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [map, userCoords, orphanages, selectedOrphanage]);

  return null;
}

export default function NearbyOrphanageMap({
  userCoords,
  orphanages = [],
  selectedOrphanage = null,
  onSelectOrphanage,
}) {
  const defaultCenter = userCoords
    ? [userCoords.lat, userCoords.lng]
    : [28.6139, 77.2090]; // Default New Delhi center

  // Free OpenStreetMap direction routing link
  const getDirectionsUrl = (orphanage) => {
    if (!userCoords) {
      return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${orphanage.latitude}%2C${orphanage.longitude}`;
    }
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userCoords.lat}%2C${userCoords.lng}%3B${orphanage.latitude}%2C${orphanage.longitude}`;
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: "100%", width: "100%", minHeight: "420px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <AutoCenterMap
          userCoords={userCoords}
          orphanages={orphanages}
          selectedOrphanage={selectedOrphanage}
        />

        {/* User Location Marker */}
        {userCoords && userCoords.lat && userCoords.lng && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={donorUserIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-2 text-slate-900 text-center font-sans">
                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full mb-1">
                  <FiMapPin className="w-3 h-3" /> My Current Location
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Using your current location
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Orphanage Markers */}
        {orphanages.map((orphanage) => {
          if (!orphanage.latitude || !orphanage.longitude) return null;

          const isSelected = selectedOrphanage?.id === orphanage.id;
          const isRegistered = orphanage.source === "registered" || orphanage.source === "DATABASE";
          const icon = isSelected
            ? selectedOrphanageIcon
            : isRegistered
            ? dbOrphanageIcon
            : osmOrphanageIcon;

          return (
            <Marker
              key={orphanage.id}
              position={[orphanage.latitude, orphanage.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectOrphanage && onSelectOrphanage(orphanage),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-3 text-slate-900 font-sans max-w-[240px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${
                        isRegistered
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {isRegistered ? "Registered" : "External place"}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">
                      {orphanage.distance ? `${orphanage.distance} km away` : ""}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                    {orphanage.name}
                  </h4>

                  {orphanage.address && (
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed flex items-start gap-1">
                      <FiMapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span>{orphanage.address}</span>
                    </p>
                  )}

                  {orphanage.phone && (
                    <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                      <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${orphanage.phone}`} className="hover:underline text-blue-600">
                        {orphanage.phone}
                      </a>
                    </p>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={getDirectionsUrl(orphanage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors shadow-sm"
                    >
                      <FiNavigation className="w-3.5 h-3.5" /> Directions
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink, Phone, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface PharmacyCoordinates {
  latitude: number;
  longitude: number;
}

interface PharmacyResult {
  pharmacyId: string;
  name: string;
  code?: string;
  address: string;
  phone: string;
  operatingHours?: string;
  distanceKm: number;
  coordinates: PharmacyCoordinates;
  isSimulated?: boolean;
  allAvailable?: boolean;
  availableCount?: number;
  totalCount?: number;
  availableMedicines?: any[];
  unavailableMedicines?: any[];
}

interface PharmacyMapProps {
  userLocation: { latitude: number; longitude: number };
  pharmacies: PharmacyResult[];
  selectedPharmacyId?: string | null;
  onSelectPharmacy?: (pharmacy: PharmacyResult) => void;
  radiusKm?: number;
}

export default function PharmacyMap({
  userLocation,
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  radiusKm = 5
}: PharmacyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activePharmacy, setActivePharmacy] = useState<PharmacyResult | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (selectedPharmacyId) {
      const found = pharmacies.find(p => p.pharmacyId === selectedPharmacyId);
      if (found) setActivePharmacy(found);
    }
  }, [selectedPharmacyId, pharmacies]);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const L = (await import('leaflet')).default;
        // Import leaflet stylesheet dynamically or assume global
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!isMounted || !mapContainerRef.current) return;

        // Clean up previous instance if exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Initialize Map
        const map = L.map(mapContainerRef.current, {
          center: [userLocation.latitude, userLocation.longitude],
          zoom: radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : radiusKm <= 5 ? 13 : 12,
          zoomControl: true
        });
        mapInstanceRef.current = map;

        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        // User Location Custom Pin
        const userIcon = L.divIcon({
          className: 'custom-user-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
              <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(30, 64, 175, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: #1e40af; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: inherit; font-size: 12px; font-weight: bold; text-align: center; color: #0f172a;">
              <span style="color: #1e40af;">📍 Your Current Location</span>
            </div>
          `);

        // Radius circle indicator
        L.circle([userLocation.latitude, userLocation.longitude], {
          radius: radiusKm * 1000,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.06,
          weight: 1.5,
          dashArray: '4, 6'
        }).addTo(map);

        // Pharmacy Markers
        const markersGroup = L.featureGroup();

        pharmacies.forEach(pharmacy => {
          if (!pharmacy.coordinates?.latitude || !pharmacy.coordinates?.longitude) return;

          const isInStock = pharmacy.allAvailable !== false;
          const bgCol = isInStock ? '#059669' : '#d97706';

          const pharmIcon = L.divIcon({
            className: 'custom-pharmacy-pin',
            html: `
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                background: ${bgCol};
                color: white;
                font-weight: 900;
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 9999px;
                border: 2px solid white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.25);
                white-space: nowrap;
                cursor: pointer;
              ">
                🏥 ${pharmacy.distanceKm} km
              </div>
            `,
            iconSize: [70, 26],
            iconAnchor: [35, 13]
          });

          const marker = L.marker(
            [pharmacy.coordinates.latitude, pharmacy.coordinates.longitude],
            { icon: pharmIcon }
          ).addTo(map);

          marker.on('click', () => {
            setActivePharmacy(pharmacy);
            if (onSelectPharmacy) onSelectPharmacy(pharmacy);
          });

          markersGroup.addLayer(marker);
        });

        // Fit map bounds if there are pharmacies
        if (pharmacies.length > 0) {
          markersGroup.addLayer(userMarker);
          map.fitBounds(markersGroup.getBounds().pad(0.2));
        }

        setMapLoaded(true);
      } catch (err) {
        console.warn('Leaflet map failed to initialize:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation, pharmacies, radiusKm, onSelectPharmacy]);

  return (
    <div className="space-y-3">
      {/* Map Header / Legend */}
      <div className="flex flex-wrap justify-between items-center text-xs font-bold text-slate-600 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-700 border-2 border-white shadow-sm inline-block" />
            <span>You</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-sm inline-block" />
            <span>In Stock</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-600 border-2 border-white shadow-sm inline-block" />
            <span>Partial Stock</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Showing {pharmacies.length} pharmacies within {radiusKm} km radius
        </span>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-sm bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs font-bold text-slate-500">
            Loading interactive map...
          </div>
        )}
      </div>

      {/* Selected Pharmacy Quick Card */}
      {activePharmacy && (
        <div className="p-4 bg-white rounded-2xl border-2 border-blue-400 shadow-sm flex flex-wrap justify-between items-center gap-3">
          <div className="space-y-1 max-w-md">
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-black text-slate-900">{activePharmacy.name}</h5>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {activePharmacy.distanceKm} km away
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{activePharmacy.address}</p>
            {activePharmacy.operatingHours && (
              <p className="text-[11px] text-slate-500">Hours: {activePharmacy.operatingHours}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activePharmacy.phone && (
              <a
                href={`tel:${activePharmacy.phone}`}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>Call</span>
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activePharmacy.coordinates.latitude},${activePharmacy.coordinates.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-[#1e40af] hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

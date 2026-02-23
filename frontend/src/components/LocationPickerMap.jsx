import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, Navigation, Search, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Detect environment ────────────────────────────────────────────────────────
// Use Google Maps only on production (non-localhost) domains
const IS_PRODUCTION = !['localhost', '127.0.0.1'].includes(window.location.hostname);
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const USE_GOOGLE_MAPS = IS_PRODUCTION && Boolean(GOOGLE_MAPS_API_KEY);

// ── Leaflet (OSM) imports – always safe ───────────────────────────────────────
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// ── Google Maps imports – only used in production ─────────────────────────────
import { GoogleMap, useJsApiLoader, Marker as GMarker, StandaloneSearchBox } from '@react-google-maps/api';

const LIBRARIES = ['places'];
const MAP_STYLE = { width: '100%', height: '100%' };
const GMAP_OPTIONS = { zoomControl: true, streetViewControl: false, mapTypeControl: true, fullscreenControl: false };

// =============================================================================
// LEAFLET MAP (localhost / dev)
// =============================================================================
const LeafletMapController = ({ center }) => {
    const map = useMap();
    useEffect(() => { if (center) map.flyTo(center, map.getZoom(), { duration: 1.2 }); }, [center, map]);
    return null;
};
const LeafletClickHandler = ({ onClick }) => {
    useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
    return null;
};

const LeafletMap = ({ center, onLocationChange }) => {
    const [pos, setPos] = useState(center);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const timer = useRef(null);

    useEffect(() => setPos(center), [center]);

    const handleClick = (lat, lng) => { setPos([lat, lng]); onLocationChange(lat, lng); };

    const search = async (q) => {
        if (!q || q.length < 3) { setResults([]); return; }
        setIsSearching(true);
        try {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5`);
            setResults(await r.json());
            setShowDropdown(true);
        } catch { } finally { setIsSearching(false); }
    };

    const pick = (r) => {
        const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
        setPos([lat, lon]);
        setQuery(r.display_name);
        setShowDropdown(false);
        onLocationChange(lat, lon, r.display_name);
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); clearTimeout(timer.current); timer.current = setTimeout(() => search(e.target.value), 500); }}
                        onFocus={() => query.length >= 3 && setShowDropdown(true)}
                        placeholder="Search for a place or address..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FD6941]/30 focus:border-[#FD6941] transition-all"
                    />
                    {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="w-4 h-4 text-[#FD6941] animate-spin" /></div>}
                </div>
                {showDropdown && results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[1000] overflow-hidden">
                        {results.map((r, i) => (
                            <button key={i} onClick={() => pick(r)} className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-gray-600 line-clamp-2">{r.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
                {showDropdown && <div className="fixed inset-0 z-[-1]" onClick={() => setShowDropdown(false)} />}
            </div>

            <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0">
                <MapContainer center={pos} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LeafletMapController center={pos} />
                    <LeafletClickHandler onClick={handleClick} />
                    <Marker position={pos} />
                </MapContainer>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
                🔍 Search above · 📍 Click the map to set pin · 🛰️ Or use GPS
            </p>
        </div>
    );
};

// =============================================================================
// GOOGLE MAP (production)
// =============================================================================
const GoogleMapView = ({ center, onLocationChange }) => {
    const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: LIBRARIES });
    const [pos, setPos] = useState(center);
    const mapRef = useRef(null);
    const sbRef = useRef(null);

    useEffect(() => setPos(center), [center]);

    const handleClick = useCallback((e) => {
        const lat = e.latLng.lat(), lng = e.latLng.lng();
        setPos({ lat, lng }); onLocationChange(lat, lng);
    }, [onLocationChange]);

    const handleDrag = useCallback((e) => {
        const lat = e.latLng.lat(), lng = e.latLng.lng();
        setPos({ lat, lng }); onLocationChange(lat, lng);
    }, [onLocationChange]);

    const handlePlaces = () => {
        const places = sbRef.current?.getPlaces();
        if (!places?.length) return;
        const loc = places[0].geometry?.location;
        if (!loc) return;
        const lat = loc.lat(), lng = loc.lng(), np = { lat, lng };
        setPos(np); onLocationChange(lat, lng, places[0].formatted_address || places[0].name || '');
        if (mapRef.current) { mapRef.current.panTo(np); mapRef.current.setZoom(17); }
    };

    if (loadError) return (
        <div className="h-56 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-xs text-red-500 p-4 text-center">
            ⚠️ Google Maps failed to load. Check your API key in Google Cloud Console.
        </div>
    );

    if (!isLoaded) return (
        <div className="h-64 rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading map...
        </div>
    );

    return (
        <div className="space-y-3">
            <StandaloneSearchBox onLoad={(r) => (sbRef.current = r)} onPlacesChanged={handlePlaces}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        placeholder="Search for a place or address..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FD6941]/30 focus:border-[#FD6941] transition-all"
                    />
                </div>
            </StandaloneSearchBox>

            <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <GoogleMap
                    mapContainerStyle={MAP_STYLE}
                    center={pos}
                    zoom={15}
                    options={GMAP_OPTIONS}
                    onClick={handleClick}
                    onLoad={(m) => (mapRef.current = m)}
                >
                    <GMarker position={pos} draggable onDragEnd={handleDrag} animation={2} />
                </GoogleMap>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
                🔍 Search above · 📍 Click or drag the pin · 🛰️ Or use GPS
            </p>
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const LocationPickerMap = ({ lat, lng, onLocationSelect, onAddressUpdate }) => {
    const validLat = parseFloat(lat) || 23.0225;
    const validLng = parseFloat(lng) || 72.5714;
    const [isGeolocating, setIsGeolocating] = useState(false);

    const reverseGeocode = async (latitude, longitude) => {
        try {
            if (USE_GOOGLE_MAPS) {
                const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`);
                const d = await r.json();
                if (d.results?.[0]) onAddressUpdate(d.results[0].formatted_address);
            } else {
                const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                const d = await r.json();
                if (d.display_name) onAddressUpdate(d.display_name);
            }
        } catch { }
    };

    const handleLocationChange = (lat, lng, address) => {
        onLocationSelect(lat, lng);
        if (address) onAddressUpdate(address);
        else reverseGeocode(lat, lng);
    };

    const handleGetMyLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
        setIsGeolocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                handleLocationChange(latitude, longitude);
                setIsGeolocating(false);
                toast.success('Location detected!');
            },
            () => { setIsGeolocating(false); toast.error('Could not get location. Please allow access.'); },
            { timeout: 10000 }
        );
    };

    const googleCenter = { lat: validLat, lng: validLng };
    const osmCenter = [validLat, validLng];

    return (
        <div className="space-y-3">
            {/* Map — Google on production, OSM on localhost */}
            {USE_GOOGLE_MAPS
                ? <GoogleMapView center={googleCenter} onLocationChange={handleLocationChange} />
                : <LeafletMap center={osmCenter} onLocationChange={handleLocationChange} />
            }

            {/* GPS Button */}
            <button
                type="button"
                onClick={handleGetMyLocation}
                disabled={isGeolocating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FD6941]/10 text-[#FD6941] border border-[#FD6941]/20 rounded-full text-sm font-normal hover:bg-[#FD6941]/20 transition-all active:scale-95 disabled:opacity-60"
            >
                {isGeolocating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Detecting location...</>
                    : <><Navigation className="w-4 h-4" /> Use My Current Location</>}
            </button>
        </div>
    );
};

export default LocationPickerMap;

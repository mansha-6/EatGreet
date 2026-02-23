import React, { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { Loader2, Navigation, Search, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Leaflet imports (always bundled, async rendered only when needed) ──────────
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ── Google Maps imports (only used when API key is valid) ─────────────────────
import { GoogleMap, useJsApiLoader, Marker as GMarker, StandaloneSearchBox } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places'];
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const GOOGLE_MAP_OPTIONS = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Leaflet sub-components
// ─────────────────────────────────────────────────────────────────────────────
const MapController = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, map.getZoom(), { duration: 1.2 });
    }, [center, map]);
    return null;
};

const MapClickHandler = ({ onClick }) => {
    useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps inner component (rendered only after useJsApiLoader succeeds)
// ─────────────────────────────────────────────────────────────────────────────
const GoogleMapInner = ({ center, onLocationChange }) => {
    const [markerPos, setMarkerPos] = useState(center);
    const mapRef = useRef(null);
    const searchBoxRef = useRef(null);

    // Keep in sync if parent centre changes (GPS / prop update)
    useEffect(() => setMarkerPos(center), [center]);

    const handleMapClick = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        onLocationChange(lat, lng);
    }, [onLocationChange]);

    const handleDragEnd = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        onLocationChange(lat, lng);
    }, [onLocationChange]);

    const handlePlacesChanged = () => {
        const places = searchBoxRef.current?.getPlaces();
        if (!places || !places.length) return;
        const loc = places[0].geometry?.location;
        if (!loc) return;
        const lat = loc.lat();
        const lng = loc.lng();
        setMarkerPos({ lat, lng });
        onLocationChange(lat, lng, places[0].formatted_address || places[0].name || '');
        if (mapRef.current) { mapRef.current.panTo({ lat, lng }); mapRef.current.setZoom(17); }
    };

    return (
        <div className="space-y-3">
            <StandaloneSearchBox
                onLoad={(r) => (searchBoxRef.current = r)}
                onPlacesChanged={handlePlacesChanged}
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search for a place or address..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FD6941]/30 focus:border-[#FD6941] transition-all"
                    />
                </div>
            </StandaloneSearchBox>

            <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={markerPos}
                    zoom={15}
                    options={GOOGLE_MAP_OPTIONS}
                    onClick={handleMapClick}
                    onLoad={(m) => (mapRef.current = m)}
                >
                    <GMarker position={markerPos} draggable onDragEnd={handleDragEnd} animation={2} />
                </GoogleMap>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
                🔍 Search above · 📍 Click or drag the pin · 🛰️ Or use GPS
            </p>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps wrapper — handles loader state & error fallback
// ─────────────────────────────────────────────────────────────────────────────
const GoogleMapsWrapper = ({ center, onLocationChange, onFallback }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    useEffect(() => {
        if (loadError) {
            console.warn('Google Maps failed to load, switching to OSM fallback.');
            onFallback();
        }
    }, [loadError, onFallback]);

    if (loadError) return null; // onFallback will trigger re-render with OSM
    if (!isLoaded) {
        return (
            <div className="h-64 rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Google Maps...
            </div>
        );
    }

    return <GoogleMapInner center={center} onLocationChange={onLocationChange} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Leaflet / OSM fallback map
// ─────────────────────────────────────────────────────────────────────────────
const OSMMap = ({ center, onLocationChange }) => {
    const [markerPos, setMarkerPos] = useState(center);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeout = useRef(null);

    useEffect(() => setMarkerPos(center), [center]);

    const handleClick = (lat, lng) => {
        setMarkerPos([lat, lng]);
        onLocationChange(lat, lng);
    };

    const handleSearch = async (query) => {
        if (!query || query.length < 3) { setSearchResults([]); return; }
        setIsSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await res.json();
            setSearchResults(data);
            setShowResults(true);
        } catch (e) { console.error(e); }
        finally { setIsSearching(false); }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => handleSearch(val), 500);
    };

    const selectResult = (r) => {
        const lat = parseFloat(r.lat);
        const lon = parseFloat(r.lon);
        setMarkerPos([lat, lon]);
        setSearchQuery(r.display_name);
        setShowResults(false);
        onLocationChange(lat, lon, r.display_name);
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                        placeholder="Search for a place or address..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FD6941]/30 focus:border-[#FD6941] transition-all"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 text-[#FD6941] animate-spin" />
                        </div>
                    )}
                </div>
                {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[1000] overflow-hidden">
                        {searchResults.map((r, i) => (
                            <button
                                key={i}
                                onClick={() => selectResult(r)}
                                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-gray-600 line-clamp-2">{r.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
                {showResults && <div className="fixed inset-0 z-[-1]" onClick={() => setShowResults(false)} />}
            </div>

            <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0">
                <MapContainer center={markerPos} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController center={markerPos} />
                    <MapClickHandler onClick={handleClick} />
                    <Marker position={markerPos} />
                </MapContainer>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
                🔍 Search above · 📍 Click the map to set pin · 🛰️ Or use GPS (OpenStreetMap)
            </p>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export — decides which map engine to use
// ─────────────────────────────────────────────────────────────────────────────
const LocationPickerMap = ({ lat, lng, onLocationSelect, onAddressUpdate }) => {
    const validLat = parseFloat(lat) || 23.0225;
    const validLng = parseFloat(lng) || 72.5714;

    // Use Google Maps only when we actually have a key configured
    const hasGoogleKey = Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 10);
    const [useGoogleMaps, setUseGoogleMaps] = useState(hasGoogleKey);
    const [isGeolocating, setIsGeolocating] = useState(false);

    // Convert lat/lng to the format each engine needs
    const googleCenter = { lat: validLat, lng: validLng };
    const osmCenter = [validLat, validLng];

    const handleLocationChange = (newLat, newLng, address) => {
        onLocationSelect(newLat, newLng);
        if (address) {
            onAddressUpdate(address);
        } else {
            // Reverse geocode using the appropriate service
            const url = hasGoogleKey && useGoogleMaps
                ? `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLat},${newLng}&key=${GOOGLE_MAPS_API_KEY}`
                : `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}`;

            fetch(url)
                .then((r) => r.json())
                .then((d) => {
                    const addr = d.results?.[0]?.formatted_address || d.display_name;
                    if (addr) onAddressUpdate(addr);
                })
                .catch(console.error);
        }
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

    return (
        <div className="space-y-3">
            {/* Engine badge */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">
                    {useGoogleMaps ? '🗺️ Google Maps' : '🌍 OpenStreetMap'}
                </span>
                {hasGoogleKey && (
                    <button
                        type="button"
                        onClick={() => setUseGoogleMaps((v) => !v)}
                        className="text-[10px] text-[#FD6941] hover:underline"
                    >
                        Switch to {useGoogleMaps ? 'OpenStreetMap' : 'Google Maps'}
                    </button>
                )}
            </div>

            {/* Map */}
            {useGoogleMaps ? (
                <GoogleMapsWrapper
                    center={googleCenter}
                    onLocationChange={handleLocationChange}
                    onFallback={() => setUseGoogleMaps(false)}
                />
            ) : (
                <OSMMap center={osmCenter} onLocationChange={handleLocationChange} />
            )}

            {/* GPS Button (shared) */}
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

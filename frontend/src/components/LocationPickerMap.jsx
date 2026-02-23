import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, Navigation, Search, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix for default marker icon in Leaflet + Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Internal component to handle map movement/center updates
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || map.getZoom(), { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
};

// Internal component to handle click events on the map
const MapEvents = ({ onClick }) => {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const LocationPickerMap = ({ lat, lng, onLocationSelect, onAddressUpdate }) => {
    const validLat = parseFloat(lat) || 23.0225;
    const validLng = parseFloat(lng) || 72.5714;

    const [markerPos, setMarkerPos] = useState([validLat, validLng]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isGeolocating, setIsGeolocating] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const searchTimeout = useRef(null);

    // Sync state with props if they change externally
    useEffect(() => {
        if (lat && lng && (lat !== markerPos[0] || lng !== markerPos[1])) {
            setMarkerPos([parseFloat(lat), parseFloat(lng)]);
        }
    }, [lat, lng]);

    const reverseGeocode = useCallback(async (latitude, longitude) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            if (data.display_name) {
                onAddressUpdate(data.display_name);
            }
        } catch (err) {
            console.error('Reverse geocode failed:', err);
        }
    }, [onAddressUpdate]);

    const handleLocationChange = (newLat, newLng) => {
        const pos = [newLat, newLng];
        setMarkerPos(pos);
        onLocationSelect(newLat, newLng);
        reverseGeocode(newLat, newLng);
    };

    const handleSearch = async (query) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await res.json();
            setSearchResults(data);
            setShowResults(true);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => handleSearch(val), 500);
    };

    const selectResult = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        handleLocationChange(lat, lon);
        setSearchQuery(result.display_name);
        setShowResults(false);
    };

    const handleGetMyLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported by your browser');
            return;
        }
        setIsGeolocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                handleLocationChange(latitude, longitude);
                setIsGeolocating(false);
                toast.success('Location detected!');
            },
            () => {
                setIsGeolocating(false);
                toast.error('Could not get location. Please allow access.');
            },
            { timeout: 10000 }
        );
    };

    return (
        <div className="space-y-3">
            {/* Search Box */}
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

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {searchResults.map((res, i) => (
                            <button
                                key={i}
                                onClick={() => selectResult(res)}
                                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-gray-600 line-clamp-2">{res.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {showResults && (
                    <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setShowResults(false)}
                    ></div>
                )}
            </div>

            {/* GPS Button */}
            <button
                type="button"
                onClick={handleGetMyLocation}
                disabled={isGeolocating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FD6941]/10 text-[#FD6941] border border-[#FD6941]/20 rounded-full text-sm font-normal hover:bg-[#FD6941]/20 transition-all active:scale-95 disabled:opacity-60"
            >
                {isGeolocating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Detecting location...</>
                ) : (
                    <><Navigation className="w-4 h-4" /> Use My Current Location</>
                )}
            </button>

            {/* Leaflet Map */}
            <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0">
                <MapContainer
                    center={markerPos}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController center={markerPos} />
                    <MapEvents onClick={handleLocationChange} />
                    <Marker position={markerPos} />
                </MapContainer>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
                🔍 Search above · 📍 Click the map to set pin · 🛰️ Or use GPS
            </p>
        </div>
    );
};

export default LocationPickerMap;

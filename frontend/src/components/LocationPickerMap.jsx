import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api';
import { Loader2, Navigation, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places'];
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const MAP_OPTIONS = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
};

const LocationPickerMap = ({ lat, lng, onLocationSelect, onAddressUpdate }) => {
    const validLat = parseFloat(lat) || 23.0225;
    const validLng = parseFloat(lng) || 72.5714;

    const [markerPos, setMarkerPos] = useState({ lat: validLat, lng: validLng });
    const [isGeolocating, setIsGeolocating] = useState(false);
    const mapRef = useRef(null);
    const searchBoxRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const reverseGeocode = useCallback(async (latitude, longitude) => {
        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await res.json();
            if (data.results?.[0]) onAddressUpdate(data.results[0].formatted_address);
        } catch (err) {
            console.error('Reverse geocode failed:', err);
        }
    }, [onAddressUpdate]);

    const handleMapClick = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        onLocationSelect(lat, lng);
        reverseGeocode(lat, lng);
    }, [onLocationSelect, reverseGeocode]);

    const handleMarkerDrag = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        onLocationSelect(lat, lng);
        reverseGeocode(lat, lng);
    }, [onLocationSelect, reverseGeocode]);

    const handlePlacesChanged = () => {
        const places = searchBoxRef.current?.getPlaces();
        if (!places?.length) return;
        const loc = places[0].geometry?.location;
        if (!loc) return;
        const lat = loc.lat();
        const lng = loc.lng();
        const newPos = { lat, lng };
        setMarkerPos(newPos);
        onLocationSelect(lat, lng);
        onAddressUpdate(places[0].formatted_address || places[0].name || '');
        if (mapRef.current) { mapRef.current.panTo(newPos); mapRef.current.setZoom(17); }
    };

    const handleGetMyLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
        setIsGeolocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                const newPos = { lat: latitude, lng: longitude };
                setMarkerPos(newPos);
                onLocationSelect(latitude, longitude);
                reverseGeocode(latitude, longitude);
                if (mapRef.current) { mapRef.current.panTo(newPos); mapRef.current.setZoom(17); }
                setIsGeolocating(false);
                toast.success('Location detected!');
            },
            () => { setIsGeolocating(false); toast.error('Could not get location. Please allow access.'); },
            { timeout: 10000 }
        );
    };

    if (loadError) {
        return (
            <div className="h-56 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-xs text-red-500 p-4 text-center">
                ⚠️ Google Maps failed to load. Please check your API key configuration.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-64 rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading map...
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Search Box */}
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

            {/* Google Map */}
            <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={markerPos}
                    zoom={15}
                    options={MAP_OPTIONS}
                    onClick={handleMapClick}
                    onLoad={(m) => (mapRef.current = m)}
                >
                    <Marker
                        position={markerPos}
                        draggable
                        onDragEnd={handleMarkerDrag}
                        animation={2}
                    />
                </GoogleMap>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
                🔍 Search above · 📍 Click or drag the pin · 🛰️ Or use GPS
            </p>
        </div>
    );
};

export default LocationPickerMap;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import '@google/model-viewer';
import { X, Plus, Minus, Clock, Zap } from 'lucide-react';
import { menuAPI } from '../../utils/api';
import arIcon from '../../assets/3d-icon-black.svg';
import { useSettings } from '../../context/SettingsContext';

const currencyMap = {
    'USD': '$',
    'EUR': '€',
    'INR': '₹',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$'
};

const generateSlug = (name) => name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'item';

const Customer3DViewer = () => {
    const { itemName } = useParams();
    const navigate = useNavigate();
    const { user, currencySymbol: contextSymbol } = useSettings();
    const {
        cart, addToCart, removeFromCart,
        restaurantId,
        tenantName,
        currency
    } = useOutletContext();

    const activeSymbol = (user && user.role === 'admin' && user.restaurantName?.toLowerCase() === tenantName?.toLowerCase())
        ? contextSymbol
        : (currencyMap[currency] || '₹');

    const [menuItems, setMenuItems] = useState([]);
    const [selected3DItem, setSelected3DItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const initialItemNameRef = React.useRef(itemName);

    useEffect(() => {
        const fetchItems = async () => {
            setIsLoading(true);
            try {
                const params = {
                    restaurantName: tenantName,
                    restaurantId
                };
                const menuRes = await menuAPI.getAll(params);
                const items = menuRes.data || [];
                setMenuItems(items);
                
                // Find initial item
                const initialItem = items.find(i => generateSlug(i.name) === itemName) || items.find(i => i.models && i.models.length > 0);
                if (initialItem) {
                    setSelected3DItem(initialItem);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (menuItems.length === 0 && (tenantName || restaurantId)) {
            fetchItems();
        }
    }, [tenantName, restaurantId]); // Fetch ONLY once on mount

    // Listen to URL changes for backward/forward navigation
    useEffect(() => {
        if (menuItems.length > 0) {
            const target = menuItems.find(i => generateSlug(i.name) === itemName) || menuItems.find(i => i.models && i.models.length > 0);
            if (target && target._id !== selected3DItem?._id) {
                setSelected3DItem(target);
            }
        }
    }, [itemName, menuItems]);

    // Handle back navigation
    const goBack = () => {
        navigate(-1);
    };

    // Move INITIAL selectedItem to the front permanently
    const sliderItems = React.useMemo(() => {
        const allModelItems = menuItems.filter(i => i.models && i.models.length > 0);
        if (allModelItems.length === 0) return [];

        const initialIndex = allModelItems.findIndex(i => generateSlug(i.name) === initialItemNameRef.current);
        if (initialIndex > -1) {
            const initialItem = allModelItems[initialIndex];
            return [initialItem, ...allModelItems.filter(i => i._id !== initialItem._id)];
        }
        return allModelItems;
    }, [menuItems]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[110] bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#FD6941]/20 border-t-[#FD6941] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!selected3DItem) {
        return (
            <div className="fixed inset-0 z-[110] bg-gray-50 flex items-center justify-center flex-col">
                <p className="text-gray-500 mb-4">No 3D Models available for this item.</p>
                <button onClick={goBack} className="px-6 py-2 bg-[#FD6941] text-white rounded-full font-medium">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] bg-gray-50 flex flex-col p-2 md:p-4 animate-in fade-in zoom-in-95 duration-200 overflow-hidden overscroll-none touch-none">
            {/* Header / Close Button */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-[120]">
                <button
                    onClick={goBack}
                    className="w-10 h-10 sm:w-11 sm:h-11 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-900 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md font-medium"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* 3D Model Viewer Area */}
            <div className="flex-1 w-full h-full min-h-[50vh] bg-transparent flex items-center justify-center relative rounded-3xl overflow-hidden mt-0 border-2 border-white sm:border-transparent">
                <model-viewer
                    src={selected3DItem.models[0]?.url || selected3DItem.models[0]}
                    alt={selected3DItem.name}
                    camera-controls
                    auto-rotate
                    crossorigin="anonymous"
                    reveal="auto"
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    ar-scale="fixed"
                    shadow-intensity="1"
                    shadow-softness="1"
                    style={{ width: '100%', height: '100%', minHeight: '300px', backgroundColor: 'transparent', display: 'block' }}
                    className="w-full h-full object-contain pointer-events-auto"
                >
                    {/* AR Button Slot */}
                    <button
                        slot="ar-button"
                        className="absolute top-6 left-6 z-[120] px-5 py-2.5 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-900 rounded-full flex items-center gap-2 shadow-md hover:bg-white transition-all font-medium"
                    >
                        <img src={arIcon} alt="AR Space" className="w-5 h-5" />
                        View in your space
                    </button>

                    {/* UI Overlays (Visible in WebXR AR) */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
                        
                        {/* Selected Item Info */}
                        <div className="px-6 pb-4 flex items-end justify-between pointer-events-auto">
                            <div className="flex-1 pr-4 text-left">
                                <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight mb-1 drop-shadow-sm">{selected3DItem.name}</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-medium text-[#FD6941] drop-shadow-sm">{activeSymbol}{Number(selected3DItem.displayPrice || selected3DItem.price).toFixed(0)}</span>
                                    {selected3DItem.time && (
                                        <>
                                            <span className="text-gray-400 font-medium text-sm px-1">•</span>
                                            <span className="flex items-center gap-1 text-sm text-gray-500 font-medium tracking-wide">
                                                <Clock className="w-3.5 h-3.5" /> {selected3DItem.time}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center justify-end">
                                {selected3DItem.isAvailable ? (
                                    cart[selected3DItem._id] ? (
                                        <div className="flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-md border border-[#FFE4DE] text-gray-900 rounded-full shadow-lg h-12 md:h-14 px-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFromCart(selected3DItem._id); }}
                                                className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white border border-[#FFE4DE] text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-all shrink-0"
                                            >
                                                <Minus className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                            <span className="text-lg md:text-xl font-medium min-w-[1.2rem] text-center text-[#FD6941] px-0.5">{cart[selected3DItem._id].qty}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addToCart(selected3DItem); }}
                                                className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FD6941] text-white flex items-center justify-center hover:bg-[#FD6941]/90 transition-all shrink-0 shadow-sm"
                                            >
                                                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addToCart(selected3DItem); }}
                                            className="w-14 h-14 bg-[#FD6941] text-white rounded-full font-medium shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                                        >
                                            <Plus className="w-7 h-7" />
                                        </button>
                                    )
                                ) : (
                                    <div className="px-4 py-2 bg-gray-200/90 backdrop-blur-sm text-gray-500 rounded-full font-medium text-xs text-center border border-gray-300">
                                        Unavailable
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Horizontal List of other 3D items */}
                        {sliderItems.length > 1 && (
                            <div className="pb-6 pt-2">
                                <div className="flex items-center gap-4 px-6 overflow-x-auto no-scrollbar pointer-events-auto touch-pan-x overscroll-x-contain">
                                    {sliderItems.map(item => (
                                        <div 
                                            key={item._id}
                                            onClick={() => {
                                                setSelected3DItem(item);
                                                navigate(`../${generateSlug(item.name)}`, { replace: true, relative: "path" });
                                            }}
                                            className={`shrink-0 w-24 md:w-28 rounded-2xl md:rounded-[1.5rem] overflow-hidden cursor-pointer border-2 transition-all duration-300 ${selected3DItem._id === item._id ? 'border-[#FD6941] scale-105 shadow-[0_4px_15px_rgba(253,105,65,0.3)]' : 'border-white/50 bg-white/20 backdrop-blur-md opacity-80 hover:opacity-100 shadow-sm'}`}
                                        >
                                            <div className="h-16 md:h-20 w-full bg-gray-100/50 p-1 flex items-center justify-center">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl md:rounded-2xl" />
                                            </div>
                                            <div className="p-2 bg-white/90 backdrop-blur-sm text-center border-t border-white/20">
                                                <p className="text-[10px] md:text-xs text-gray-800 truncate font-medium">{item.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </model-viewer>
            </div>
        </div>
    );
};

export default Customer3DViewer;

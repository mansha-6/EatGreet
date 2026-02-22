import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, X, Image as ImageIcon, Video, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { useSettings } from '../../context/SettingsContext';
import apis from '../../utils/api';

const AdminOffers = () => {
    const { user } = useSettings();
    const tenantName = user?.restaurantName;
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [menuItems, setMenuItems] = useState([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Form State
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [code, setCode] = useState('');
    const [type, setType] = useState('color'); // color, image, video
    const [bgColor, setBgColor] = useState('bg-[#FD6941]');
    const [textColor, setTextColor] = useState('text-white');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [status, setStatus] = useState(true);
    const [applicableItems, setApplicableItems] = useState([]);
    const [discountPercentage, setDiscountPercentage] = useState(0);

    const abortControllerRef = useRef(null);

    const colorOptions = [
        { label: 'Orange', bg: 'bg-[#FD6941]', text: 'text-white' },
        { label: 'Dark', bg: 'bg-gray-800', text: 'text-white' },
        { label: 'Green', bg: 'bg-emerald-500', text: 'text-white' },
        { label: 'Blue', bg: 'bg-blue-500', text: 'text-white' },
        { label: 'Purple', bg: 'bg-purple-500', text: 'text-white' },
        { label: 'Light', bg: 'bg-gray-100', text: 'text-gray-800' },
        { label: 'Yellow', bg: 'bg-yellow-400', text: 'text-gray-900' },
    ];

    useEffect(() => {
        if (tenantName) {
            fetchOffers();
            fetchMenuItems();
        }
    }, [tenantName]);

    const fetchMenuItems = async () => {
        try {
            const res = await apis.menuAPI.getAll({ restaurantName: tenantName });
            setMenuItems(res.data);
        } catch (error) {
            console.error("Failed to fetch menu items", error);
        }
    };

    const fetchOffers = async () => {
        try {
            setIsLoading(true);
            const res = await apis.offerAPI.getAll({ restaurantName: tenantName });
            setOffers(res.data);
        } catch (error) {
            console.error("Failed to fetch offers", error);
            toast.error("Failed to load offers");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setTitle('');
        setSubtitle('');
        setCode('');
        setType('color');
        setBgColor('bg-[#FD6941]');
        setTextColor('text-white');
        setMediaFile(null);
        setMediaPreview('');
        setStatus(true);
        setApplicableItems([]);
        setDiscountPercentage(0);
        setEditingOffer(null);
        setUploadProgress(0);
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (offer) => {
        resetForm();
        setEditingOffer(offer);
        setTitle(offer.title || '');
        setSubtitle(offer.subtitle || '');
        setCode(offer.code || '');
        setType(offer.type || 'color');
        setBgColor(offer.bg || 'bg-[#FD6941]');
        setTextColor(offer.text || 'text-white');
        setStatus(offer.status === 'ACTIVE');
        setMediaPreview(offer.src || '');
        setApplicableItems(offer.applicableItems || []);
        setDiscountPercentage(offer.discountPercentage || 0);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video');
        const isImage = file.type.startsWith('image');

        if (type === 'video' && !isVideo) {
            toast.error('Please select a video file.');
            return;
        }
        if (type === 'image' && !isImage) {
            toast.error('Please select an image file.');
            return;
        }

        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            toast.error("File is too large (>20MB)");
            return;
        }

        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        // Validation
        if (type === 'color' && (!title || !code)) {
            toast.error('Main Title and Promo Code are required for color offers.');
            return;
        }
        if ((type === 'image' || type === 'video') && !mediaFile && !mediaPreview) {
            toast.error(`Please upload a ${type}.`);
            return;
        }

        const loadToast = toast.loading('Saving offer...', { duration: Infinity });

        try {
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            let uploadedUrl = mediaPreview;

            // Upload file if new one selected
            if (mediaFile && (type === 'image' || type === 'video')) {
                toast.loading('Uploading media...', { id: loadToast });
                const res = await apis.uploadAPI.uploadDirectNew(mediaFile, (percent) => {
                    setUploadProgress(percent);
                }, { signal }, type === 'video' ? 'video' : 'image');

                uploadedUrl = res.data.secure_url;
            }

            toast.loading('Saving details...', { id: loadToast });

            const offerData = {
                title,
                subtitle,
                code,
                type,
                bg: bgColor,
                text: textColor,
                src: type === 'color' ? '' : uploadedUrl,
                status: status ? 'ACTIVE' : 'INACTIVE',
                applicableItems,
                discountPercentage: Number(discountPercentage),
                restaurantName: tenantName
            };

            if (editingOffer) {
                await apis.offerAPI.update(editingOffer._id, offerData);
                toast.success('Offer updated successfully', { id: loadToast, duration: 2000 });
            } else {
                await apis.offerAPI.create(offerData);
                toast.success('Offer created successfully', { id: loadToast, duration: 2000 });
            }

            setIsModalOpen(false);
            fetchOffers();
        } catch (error) {
            setUploadProgress(0);
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                toast.dismiss(loadToast);
                toast('Upload cancelled', { icon: '🛑' });
            } else {
                toast.error('Failed to save offer: ' + (error.message || 'Unknown error'), { id: loadToast });
            }
        } finally {
            abortControllerRef.current = null;
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-normal text-gray-800 text-sm">Delete this offer?</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                setOffers(prev => prev.filter(o => o._id !== id));
                                await apis.offerAPI.delete(id);
                                toast.success('Offer deleted');
                            } catch (error) {
                                toast.error('Failed to delete offer');
                                fetchOffers(); // Revert
                            }
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-normal hover:bg-red-600 transition-colors"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-normal hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const filteredOffers = offers.filter(o =>
        (o.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 relative pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Offers & Promos</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage discounts and promotional campaigns</p>
                </div>
                <button
                    onClick={openModal}
                    className="bg-[#FD6941] hover:bg-[#FD6941]/90 text-white h-10 sm:h-12 px-4 sm:px-6 rounded-full font-normal flex items-center justify-center gap-2 transition-all duration-300 shadow-sm text-sm"
                >
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                    <span className="hidden sm:block">
                        Add Offer
                    </span>
                </button>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-gray-100 min-h-[calc(100vh-12rem)]">
                <div className="flex flex-col sm:flex-row items-center mb-6 sm:mb-8 gap-4 justify-between">
                    <h2 className="text-[16px] sm:text-[22px] font-normal text-black w-full sm:w-auto">All Offers</h2>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 z-10" />
                        <input
                            type="text"
                            placeholder="Search by title or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#FD6941] transition-all"
                        />
                    </div>
                </div>

                {isLoading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD6941]"></div>
                    </div>
                )}

                {!isLoading && filteredOffers.length === 0 && (
                    <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-normal text-gray-800 mb-1">No offers found</h3>
                        <p className="text-sm">Create an offer to showcase to your customers.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredOffers.map((offer) => (
                        <div key={offer._id} className={`group relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col ${!offer.status ? 'opacity-60 grayscale-[50%]' : ''}`}>

                            {/* Media or Color Header */}
                            <div className={`relative h-40 w-full shrink-0 flex items-center justify-center ${offer.type === 'color' ? offer.bg : 'bg-gray-50'}`}>
                                {offer.type === 'video' ? (
                                    <video src={offer.src} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                                ) : offer.type === 'image' ? (
                                    <img src={offer.src} className="w-full h-full object-cover" alt={offer.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-tr from-black/10 to-transparent">
                                        <span className={`text-3xl font-bold tracking-tight text-center leading-tight drop-shadow-sm ${offer.text}`}>
                                            {offer.title}
                                        </span>
                                    </div>
                                )}

                                {/* Status badge */}
                                {!offer.status && (
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-red-500 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                                        INACTIVE
                                    </div>
                                )}
                            </div>

                            {/* Content Body */}
                            <div className="flex flex-col flex-1 p-5 bg-white">
                                <div className="flex justify-between items-start mb-3 gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-gray-900 font-semibold text-lg truncate" title={offer.title}>{offer.title}</h3>
                                        {offer.subtitle && (
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed" title={offer.subtitle}>{offer.subtitle}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">USE CODE</span>
                                        <code className="text-[#FD6941] bg-[#FD6941]/10 px-2.5 py-1 rounded-md text-sm font-bold tracking-wider border border-[#FD6941]/20">
                                            {offer.code}
                                        </code>
                                    </div>
                                    {offer.discountPercentage > 0 && (
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">DISCOUNT</span>
                                            <span className="text-gray-900 font-semibold text-sm">
                                                {offer.discountPercentage}% OFF
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Overlay Controls */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                                <button className="p-2 bg-white/90 backdrop-blur-md shadow-sm text-gray-600 rounded-lg hover:bg-white hover:text-blue-600 transition-colors" onClick={() => handleEdit(offer)}>
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-white/90 backdrop-blur-md shadow-sm text-gray-600 rounded-lg hover:bg-white hover:text-red-600 transition-colors" onClick={() => handleDelete(offer._id)}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Offer Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 w-full h-[100dvh] top-0 left-0 bg-black/70 backdrop-blur-xl flex items-end sm:items-center justify-center z-[99999] px-2">
                    <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-2xl max-h-[92dvh] sm:max-h-[95vh] shadow-2xl animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 overflow-hidden relative z-10 flex flex-col">
                        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-normal text-gray-800">{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 text-gray-500 rounded-full transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-6">

                            {/* Type Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-normal text-gray-700">Offer Type</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'color', icon: Palette, label: 'Color & Text' },
                                        { id: 'image', icon: ImageIcon, label: 'Image' },
                                        { id: 'video', icon: Video, label: 'Video' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setType(t.id);
                                                setMediaPreview('');
                                                setMediaFile(null);
                                            }}
                                            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-2 border-2 rounded-2xl transition-all ${type === t.id ? 'border-[#FD6941] bg-[#FD6941] text-white' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <t.icon className={`w-5 h-5 ${type === t.id ? 'text-white' : 'text-gray-400'}`} />
                                            <span className="text-xs font-normal">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {type === 'color' && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-normal text-gray-700">Main Title *</label>
                                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 50% OFF" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD6941] transition-all text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-normal text-gray-700">Promo Code *</label>
                                            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME50" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD6941] transition-all text-sm uppercase" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-normal text-gray-700">Subtitle</label>
                                        <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. On your first order" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD6941] transition-all text-sm" />
                                    </div>
                                </>
                            )}

                            {type === 'color' ? (
                                <div className="space-y-2">
                                    <label className="block text-sm font-normal text-gray-700">Color Palette</label>
                                    <div className="flex flex-wrap gap-2">
                                        {colorOptions.map(col => (
                                            <button
                                                key={col.label}
                                                onClick={() => { setBgColor(col.bg); setTextColor(col.text); }}
                                                className={`w-10 h-10 rounded-full ${col.bg} border-2 ${bgColor === col.bg ? 'border-black scale-110 shadow-md' : 'border-transparent hover:scale-110'} transition-all`}
                                                title={col.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors relative h-48">
                                        <input
                                            type="file"
                                            id="media-upload"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            accept={type === 'video' ? 'video/*' : 'image/*'}
                                            onChange={handleFileChange}
                                        />
                                        {!mediaPreview ? (
                                            <>
                                                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center text-gray-400 mb-3 shadow-sm">
                                                    {type === 'video' ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                                </div>
                                                <p className="text-sm font-normal text-gray-700">Click to upload {type}</p>
                                                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Vertical aspect ratio recommended</p>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 rounded-2xl overflow-hidden p-1">
                                                {type === 'video' ? (
                                                    <video src={mediaPreview} className="w-full h-full object-contain rounded-xl" autoPlay muted loop />
                                                ) : (
                                                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                                                )}
                                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded shadow-sm z-20">Preview</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {type === 'color' && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-800">Offer Restrictions & Discounts</h3>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-normal text-gray-700">Applicable Items (Optional)</label>
                                        <p className="text-xs text-gray-500 mb-2">Select specific items this offer applies to. If empty, it applies to all items.</p>
                                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto no-scrollbar">
                                            {menuItems.map(item => (
                                                <div key={item._id} className="flex items-center px-4 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer" onClick={() => {
                                                    if (applicableItems.includes(item._id)) {
                                                        setApplicableItems(prev => prev.filter(id => id !== item._id));
                                                    } else {
                                                        setApplicableItems(prev => [...prev, item._id]);
                                                    }
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={applicableItems.includes(item._id)}
                                                        readOnly
                                                        className="w-4 h-4 text-[#FD6941] rounded border-gray-300 focus:ring-[#FD6941]"
                                                    />
                                                    <span className="ml-3 text-sm text-gray-700">{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-gray-500">{applicableItems.length} items selected</div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-normal text-gray-700">Discount Percentage (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={discountPercentage}
                                            onChange={(e) => setDiscountPercentage(e.target.value)}
                                            placeholder="e.g. 10"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD6941] transition-all text-sm"
                                        />
                                        <p className="text-xs text-gray-500">How much discount to apply to the applicable items when someone clicks this offer. Set to 0 for no automatic discount calculation.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <h4 className="text-sm font-normal text-gray-800">Status</h4>
                                    <p className="text-xs text-gray-500">Enable or disable this offer immediately</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={status} onChange={(e) => setStatus(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FD6941]"></div>
                                </label>
                            </div>

                        </div>

                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-gray-100 h-1.5 shrink-0">
                                <div className="bg-[#FD6941] h-1.5 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}

                        <div className="p-5 sm:p-6 pb-8 sm:pb-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-normal text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-6 py-2.5 text-sm font-normal text-white bg-[#FD6941] rounded-full hover:bg-[#FD6941] transition-colors shadow-sm  flex items-center gap-2">
                                {uploadProgress > 0 && uploadProgress < 100 ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Save Offer'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}

        </div>
    );
};

export default AdminOffers;

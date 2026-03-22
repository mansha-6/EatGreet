import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Utensils, Coffee, Pizza, Salad, Cake, Sandwich, X, Filter, Leaf, Wheat, Flame, Egg, Fish, Milk, Droplet, Martini, Beef, Soup, IceCream, Beer, Drumstick, GlassWater, Apple, Cookie, ChefHat, Heater, Container } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import * as FaIcons from 'react-icons/fa6';
import * as GiIcons from 'react-icons/gi';
import * as MdIcons from 'react-icons/md';
import * as SlIcons from 'react-icons/sl';

import { categoryAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { useSettings } from '../../context/SettingsContext';

// Master list of all available icons from multiple libraries (unfiltered)
const allIcons = [
    ...Object.keys(LucideIcons).filter(k => /^[A-Z]/.test(k) && k !== 'LucideIcon' && k !== 'Icon' && k !== 'createLucideIcon').map(name => ({ name, prefix: 'lc', Icon: LucideIcons[name] })),
    ...Object.keys(FaIcons).filter(k => k.startsWith('Fa')).map(name => ({ name, prefix: 'fa', Icon: FaIcons[name] })),
    ...Object.keys(GiIcons).filter(k => k.startsWith('Gi')).map(name => ({ name, prefix: 'gi', Icon: GiIcons[name] })),
    ...Object.keys(MdIcons).filter(k => k.startsWith('Md')).map(name => ({ name, prefix: 'md', Icon: MdIcons[name] })),
    ...Object.keys(SlIcons).filter(k => k.startsWith('Sl')).map(name => ({ name, prefix: 'sl', Icon: SlIcons[name] }))
];

const AdminCategory = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryStatus, setNewCategoryStatus] = useState(true);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedIconName, setSelectedIconName] = useState('Utensils');
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(''); // 'ACTIVE', 'INACTIVE', or ''

    // New Icon Picker Modal state
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [iconSearchTerm, setIconSearchTerm] = useState('');

    const filterRef = useRef(null);
    const socket = useSocket();
    const { user } = useSettings();

    // Close filter dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!socket || !user?.restaurantName) return;

        socket.emit('joinRestaurant', user.restaurantName);

        socket.on('categoryUpdated', (payload) => {
            console.log("Real-time category update received", payload.action);
            fetchCategories(); // Simple refresh for now
        });

        return () => socket.off('categoryUpdated');
    }, [socket]);

    const iconOptions = [
        { icon: Utensils, label: 'Utensils' },
        { icon: Leaf, label: 'Vegan/Veg' },
        { icon: Coffee, label: 'Coffee' },
        { icon: Pizza, label: 'Pizza' },
        { icon: Salad, label: 'Healthy' },
        { icon: Cake, label: 'Dessert' },
        { icon: Sandwich, label: 'Sandwich' },
        { icon: Wheat, label: 'Grain' },
        { icon: Flame, label: 'Spicy' },
        { icon: Egg, label: 'Egg' },
        { icon: Fish, label: 'Seafood' },
        { icon: Milk, label: 'Dairy' },
        { icon: Droplet, label: 'Liquid' },
        { icon: Martini, label: 'Mocktails' },
        { icon: Beef, label: 'Steak/Meat' },
        { icon: Soup, label: 'Soup' },
        { icon: IceCream, label: 'Ice Cream' },
        { icon: Beer, label: 'Drinks' },
        { icon: Drumstick, label: 'Chicken' },
        { icon: GlassWater, label: 'Water' },
        { icon: Apple, label: 'Fruits' },
        { icon: Cookie, label: 'Bakery' },
        { icon: ChefHat, label: 'Specials' },
        { icon: Heater, label: 'Burger' },
        { icon: Container, label: 'Chinese' },
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const { data } = await categoryAPI.getAll();
            setCategories(data);
        } catch (error) {
            toast.error('Failed to fetch categories');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setNewCategoryStatus(category.status === 'ACTIVE');

        setSelectedIconName(category.icon || 'Utensils');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!newCategoryName.trim()) {
            toast.error("Please enter a category name.");
            return;
        }

        if (!selectedIconName) {
            toast.error("Please select an icon to represent the category.");
            return;
        }

        // Optimistic Update Setup
        const previousCategories = [...categories];

        try {
            const categoryData = {
                name: newCategoryName,
                icon: selectedIconName,
                status: newCategoryStatus ? 'ACTIVE' : 'INACTIVE',
                image: ''
            };

            // OPTIMISTIC UI: Update local state before API call
            if (editingCategory) {
                setCategories(prev => prev.map(c =>
                    c._id === editingCategory._id ? { ...c, ...categoryData } : c
                ));
                closeModal(); // Replaced clearForm() with existing closeModal()
                await categoryAPI.update(editingCategory._id, categoryData);
                toast.success('Category updated');
            } else {
                // For 'create', we don't have the real ID yet, so we'll just wait or use a temp ID
                // Simpler for create to just wait for response
                const { data } = await categoryAPI.create(categoryData);
                setCategories(prev => [data, ...prev]);
                toast.success('Category created');
                closeModal(); // Replaced clearForm() with existing closeModal()
            }
        } catch (error) {
            toast.error('Failed to save category');
            setCategories(previousCategories); // Rollback
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setNewCategoryName('');
        setNewCategoryStatus(true);
        setSelectedIconName('Utensils');
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const previousCategories = [...categories];

        // OPTIMISTIC UI
        setCategories(prev => prev.map(c =>
            c._id === id ? { ...c, status: newStatus } : c
        ));

        try {
            await categoryAPI.update(id, { status: newStatus });
            fetchCategories();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-normal text-gray-800 text-sm">Delete this category? Items will be uncategorized.</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await categoryAPI.delete(id);
                                toast.success('Category deleted successfully');
                                fetchCategories();
                            } catch (error) {
                                toast.error('Failed to delete category');
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


    return (
        <div className="space-y-4 sm:space-y-4 relative pb-10">
            {/* Header Section */}
            <div className="flex justify-between items-center gap-4">
                <h1 className="text-[20px] sm:text-[24px] lg:text-[28px] font-normal text-black tracking-tight leading-none">Category Management</h1>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => { setEditingCategory(null); setNewCategoryName(''); setIsModalOpen(true); }}
                        className="bg-[#FD6941] hover:bg-[#FD6941]/90 text-white p-2.5 sm:p-3 rounded-full font-normal flex items-center justify-center gap-0 group transition-all duration-300 shadow-sm text-sm overflow-hidden h-10 w-10 sm:h-12 sm:w-12 sm:hover:w-auto sm:hover:px-6 sm:hover:gap-2"
                    >
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden hidden sm:block">
                            Add Category
                        </span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-gray-100 min-h-[calc(100vh-12rem)]">

                {/* Search & Toolbar */}
                <div className="flex flex-row items-center mb-5 gap-2 sm:gap-4 justify-between">
                    <h2 className="text-[14px] sm:text-[22px] font-normal text-black shrink-0">All Categories</h2>

                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 sm:flex-none max-w-[200px] sm:max-w-none sm:w-80">
                            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-5 sm:h-5 z-10" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-gray-50 border-none sm:border-solid rounded-full text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#FD6941] transition-all"
                            />
                        </div>
                        {/* Status Filter Dropdown */}
                        <div className="relative shrink-0" ref={filterRef}>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`p-2 sm:p-3 rounded-full transition-colors border ${selectedStatusFilter ? 'bg-[#FD6941] border-[#FD6941] text-[#FD6941]' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                title="Filter Categories"
                            >
                                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                                {selectedStatusFilter && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FD6941] border-[1.5px] border-white rounded-full"></span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex flex-col">
                                        <button
                                            onClick={() => { setSelectedStatusFilter(''); setIsFilterOpen(false); }}
                                            className={`text-left px-4 py-3 text-sm transition-colors ${selectedStatusFilter === '' ? 'bg-[#FD6941]/5 text-[#FD6941] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            All Categories
                                        </button>
                                        <button
                                            onClick={() => { setSelectedStatusFilter('ACTIVE'); setIsFilterOpen(false); }}
                                            className={`text-left px-4 py-3 text-sm transition-colors border-t border-gray-50 ${selectedStatusFilter === 'ACTIVE' ? 'bg-[#FD6941]/5 text-[#FD6941] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Active
                                        </button>
                                        <button
                                            onClick={() => { setSelectedStatusFilter('INACTIVE'); setIsFilterOpen(false); }}
                                            className={`text-left px-4 py-3 text-sm transition-colors border-t border-gray-50 ${selectedStatusFilter === 'INACTIVE' ? 'bg-[#FD6941]/5 text-[#FD6941] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-h-[calc(100vh-260px)] overflow-y-auto no-scrollbar pb-10">
                    {/* Category Cards */}
                    {categories.filter(c => {
                        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesStatus = selectedStatusFilter === '' ? true : c.status === selectedStatusFilter;
                        return matchesSearch && matchesStatus;
                    }).map((category) => {
                        // Resolve Icon Component from various libraries
                        let DisplayIcon = Utensils;
                        if (category.icon) {
                            if (category.icon.startsWith('gi:')) DisplayIcon = GiIcons[category.icon.split(':')[1]] || Utensils;
                            else if (category.icon.startsWith('fa:')) DisplayIcon = FaIcons[category.icon.split(':')[1]] || Utensils;
                            else if (category.icon.startsWith('lc:')) DisplayIcon = LucideIcons[category.icon.split(':')[1]] || Utensils;
                            else if (category.icon.startsWith('md:')) DisplayIcon = MdIcons[category.icon.split(':')[1]] || Utensils;
                            else if (category.icon.startsWith('sl:')) DisplayIcon = SlIcons[category.icon.split(':')[1]] || Utensils;
                            else {
                                // Fallback for old/legacy icons
                                const matchedOption = iconOptions.find(opt => opt.label === category.icon);
                                DisplayIcon = matchedOption ? matchedOption.icon : (LucideIcons[category.icon] || Utensils);
                            }
                        }

                        return (
                            <div key={category._id}
                                className="bg-white rounded-[1.5rem] p-4 sm:p-6 border border-gray-100 shadow-sm transition-all group flex flex-row sm:flex-col min-h-[140px] sm:min-h-[16rem] h-auto gap-4 sm:gap-0 relative overflow-hidden">

                                {/* Mobile ONLY: Status Badge at top right corner */}
                                <div className="sm:hidden absolute top-3 right-3 z-10">
                                    <span className={`text-[9px] font-normal px-2 py-0.5 rounded-md uppercase tracking-wider ${category.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {category.status || 'INACTIVE'}
                                    </span>
                                </div>

                                {/* Tablet & Desktop: Actions at top right */}
                                <div className="hidden sm:flex absolute top-6 right-6 gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(category._id); }}
                                        className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Left Column (Mobile) / Top Area (Desktop) */}
                                <div className="flex flex-col justify-between shrink-0 mb-0 sm:mb-6">
                                    <div className={`w-14 h-14 sm:w-14 sm:h-14 rounded-2xl bg-[#F3F3F3]/50 text-[#FD6941] flex items-center justify-center shrink-0`}>
                                        <DisplayIcon className="w-7 h-7 sm:w-7 sm:h-7" />
                                    </div>

                                    {/* Mobile ONLY: Actions at bottom-left */}
                                    <div className="flex sm:hidden gap-1.5 mt-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(category._id); }}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column (Mobile) / Middle Area (Desktop) */}
                                <div className="flex-1 flex flex-col justify-between sm:justify-start py-0 sm:py-1 sm:mb-8">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-normal text-gray-800 mb-0.5 sm:mb-1 line-clamp-1">{category.name}</h3>
                                        <p className="text-gray-400 text-[10px] sm:text-sm font-normal">{category.count || 0} Items Available</p>
                                    </div>

                                    {/* Mobile ONLY: Toggle at bottom-right of this column */}
                                    <div className="flex sm:hidden justify-end mt-auto scale-90 origin-right" onClick={(e) => e.stopPropagation()}>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={category.status === 'ACTIVE'}
                                                onChange={() => handleToggleStatus(category._id, category.status)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Desktop ONLY Bottom Section: Status & Toggle */}
                                <div className="hidden sm:flex flex-row items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs font-normal uppercase tracking-wider">Status</span>
                                        <span className={`text-[10px] font-normal px-2 py-0.5 rounded-md uppercase tracking-wider ${category.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {category.status || 'INACTIVE'}
                                        </span>
                                    </div>

                                    <div className="origin-center" onClick={(e) => e.stopPropagation()}>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={category.status === 'ACTIVE'}
                                                onChange={() => handleToggleStatus(category._id, category.status)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add New Category Card */}
                    <div
                        onClick={() => { setEditingCategory(null); setNewCategoryName(''); setIsModalOpen(true); }}
                        className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[1.5rem] p-4 sm:p-6 text-center cursor-pointer hover:border-transparent hover:shadow-lg hover:bg-white transition-all group flex flex-row sm:flex-col items-center justify-center min-h-[140px] sm:min-h-[16rem] h-auto gap-4"
                    >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-[#FD6941]" />
                        </div>
                        <h3 className="text-base sm:text-lg font-normal text-gray-700">Add New Category</h3>
                    </div>
                </div>
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 w-full h-[100dvh] top-0 left-0 bg-black/40 backdrop-blur-xl flex items-end sm:items-center justify-center z-[99999] px-2 sm:px-4">
                    <div className="fixed inset-0" onClick={closeModal} />
                    <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 pb-10 sm:pb-8 shadow-2xl animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 relative z-10 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-normal text-gray-800">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Icon Selection */}
                            <div>
                                <label className="block text-sm font-normal text-gray-700 mb-4">Choose Category Icon</label>

                                {/* Icon Selection Grid */}
                                <div className="grid grid-cols-5 gap-3 mb-6">
                                    {iconOptions.slice(0, 4).map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedIconName(opt.label)}
                                            className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all border ${selectedIconName === opt.label ? 'bg-[#FD6941]/10 text-[#FD6941] shadow-sm border-[#FD6941] scale-105' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}
                                            title={opt.label}
                                        >
                                            <opt.icon className="w-6 h-6" />
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setIsIconPickerOpen(true)}
                                        className="p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#FD6941] border border-transparent hover:border-[#FD6941]/30"
                                        title="Browse Library"
                                    >
                                        <div className="flex gap-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                        </div>
                                        <span className="text-[10px] mt-1 font-medium font-sans">More</span>
                                    </button>
                                </div>

                                {/* Active Icon Preview */}
                                <div className="bg-[#FD6941]/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-[#FD6941]/20 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 text-[#FD6941]">
                                        {(() => {
                                            if (selectedIconName.startsWith('gi:')) {
                                                const Icon = GiIcons[selectedIconName.split(':')[1]];
                                                return Icon ? <Icon className="w-8 h-8" /> : <Utensils className="w-8 h-8" />;
                                            } else if (selectedIconName.startsWith('fa:')) {
                                                const Icon = FaIcons[selectedIconName.split(':')[1]];
                                                return Icon ? <Icon className="w-8 h-8" /> : <Utensils className="w-8 h-8" />;
                                            } else if (selectedIconName.startsWith('lc:')) {
                                                const Icon = LucideIcons[selectedIconName.split(':')[1]];
                                                return Icon ? <Icon className="w-8 h-8" /> : <Utensils className="w-8 h-8" />;
                                            } else if (selectedIconName.startsWith('md:')) {
                                                const Icon = MdIcons[selectedIconName.split(':')[1]];
                                                return Icon ? <Icon className="w-8 h-8" /> : <Utensils className="w-8 h-8" />;
                                            } else if (selectedIconName.startsWith('sl:')) {
                                                const Icon = SlIcons[selectedIconName.split(':')[1]];
                                                return Icon ? <Icon className="w-8 h-8" /> : <Utensils className="w-8 h-8" />;
                                            }
                                            // Fallback for legacy
                                            const matchedActiveOption = iconOptions.find(opt => opt.label === selectedIconName);
                                            const LegacyIcon = matchedActiveOption ? matchedActiveOption.icon : (LucideIcons[selectedIconName] || Utensils);
                                            return <LegacyIcon className="w-8 h-8" />;
                                        })()}
                                    </div>
                                    <p className="text-sm text-gray-800 font-normal">Preview Icon</p>
                                    <p className="text-xs text-gray-400 mt-1">Representing your category</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-normal text-gray-700 mb-2">Category Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Breakfast Specials"
                                    className="w-full px-5 py-3 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#FD6941] focus:border-[#FD6941] transition-all bg-white
"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <label className="block text-sm font-normal text-gray-800">Active Status</label>
                                    <p className="text-xs text-gray-400">Visible on menu immediately</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={newCategoryStatus}
                                        onChange={() => setNewCategoryStatus(!newCategoryStatus)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                </label>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full py-4 rounded-full bg-[#FD6941] text-white text-sm sm:text-base font-normal hover:bg-[#FD6941]/90 shadow-lg  transition-all mt-4"
                            >
                                {editingCategory ? 'Update Category' : 'Create Category'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Icon Picker Modal */}
            {isIconPickerOpen && createPortal(
                <div className="fixed inset-0 w-full h-[100dvh] top-0 left-0 bg-black/20 backdrop-blur-xl flex items-center justify-center z-[999999] px-4">
                    <div className="fixed inset-0" onClick={() => setIsIconPickerOpen(false)} />
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6 sm:p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 relative z-10 max-h-[85vh] overflow-hidden">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h2 className="text-xl font-medium text-gray-800">Browse Full Icon Library</h2>
                            <button onClick={() => setIsIconPickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="relative mb-6 shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search all icons... e.g. 'Coffee', 'Zap', 'Smile'"
                                value={iconSearchTerm}
                                onChange={(e) => setIconSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#FD6941] transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 overflow-y-auto no-scrollbar pb-4 flex-1">
                            {allIcons.filter(item =>
                                item.name.toLowerCase().includes(iconSearchTerm.toLowerCase())
                            ).slice(0, 160).map((item) => {
                                const fullKey = `${item.prefix}:${item.name}`;
                                return (
                                    <button
                                        key={fullKey}
                                        onClick={() => {
                                            setSelectedIconName(fullKey);
                                            setIsIconPickerOpen(false);
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all aspect-square ${selectedIconName === fullKey ? 'bg-[#FD6941]/10 text-[#FD6941] border border-[#FD6941] shadow-sm scale-105' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}
                                        title={item.name}
                                    >
                                        <item.Icon className="w-8 h-8 sm:w-6 sm:h-6" />
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 shrink-0">
                            <p className="text-xs text-gray-400">Scroll to see more matching icons</p>
                            <div className="flex flex-wrap gap-2 justify-end">
                                <span className="px-2 py-1 bg-gray-50 rounded-md text-[9px] text-gray-500 uppercase">Lucide</span>
                                <span className="px-2 py-1 bg-gray-50 rounded-md text-[9px] text-gray-500 uppercase">FontAwesome</span>
                                <span className="px-2 py-1 bg-gray-50 rounded-md text-[9px] text-gray-500 uppercase">GameIcons</span>
                                <span className="px-2 py-1 bg-gray-50 rounded-md text-[9px] text-gray-500 uppercase">Material</span>
                                <span className="px-2 py-1 bg-gray-50 rounded-md text-[9px] text-gray-500 uppercase">Streamline</span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminCategory;
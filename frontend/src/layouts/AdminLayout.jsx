import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DynamicNavbar from '../components/DynamicNavbar';

const AdminLayout = () => {
    const location = useLocation();
    const pathEnd = location.pathname.split('/').pop();

    // Pages that should stay fixed (no scroll) - desktop dashboard mainly
    // On mobile, ALL pages need to be scrollable for good UX
    const isDashboard = pathEnd === 'admin';
    
    // These pages always get scroll (content can be taller than viewport)
    const isScrollablePage = true; // All admin pages should be scrollable for mobile compatibility

    useEffect(() => {
        // Always allow scroll - critical for mobile/tablet responsiveness
        document.body.style.overflow = 'auto';
        document.body.style.touchAction = 'auto';
        document.body.style.overscrollBehavior = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.overscrollBehavior = 'auto';

        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.body.style.overscrollBehavior = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.overscrollBehavior = '';
        };
    }, [location.pathname]);

    // Prevent image dragging globally in admin
    const handleDragStart = (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    };

    return (
        <div
            className="min-h-screen bg-gray-50 select-none flex flex-col"
            onDragStart={handleDragStart}
            style={{ WebkitUserDrag: 'none' }}
        >
            <DynamicNavbar />
            <main className="flex-1 px-4 sm:px-6 lg:px-[30px] pt-2 pb-6 sm:py-6 w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;


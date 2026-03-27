import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DynamicNavbar from '../components/DynamicNavbar';

const AdminLayout = () => {
    const location = useLocation();
    const isDashboard = location.pathname.split('/').pop() === 'admin';
    const isScrollablePage = isDashboard || location.pathname.includes('/orders') || location.pathname.includes('/sales');

    useEffect(() => {
        // Prevent body/html scroll/stretch globally in admin
        const originalBodyStyle = document.body.style.cssText;
        const originalHtmlStyle = document.documentElement.style.cssText;
        
        if (!isScrollablePage) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            document.body.style.overscrollBehavior = 'none';
            
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.overscrollBehavior = 'none';
        } else {
            document.body.style.overflow = 'auto';
            document.body.style.touchAction = 'auto';
            document.body.style.overscrollBehavior = 'auto';
            
            document.documentElement.style.overflow = 'auto';
            document.documentElement.style.overscrollBehavior = 'auto';
        }

        return () => {
            document.body.style.cssText = originalBodyStyle;
            document.documentElement.style.cssText = originalHtmlStyle;
        };
    }, [isScrollablePage]);

    // Prevent image dragging globally in admin
    const handleDragStart = (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    };

    return (
        <div 
            className={`fixed inset-0 bg-gray-50 select-none flex flex-col ${!isScrollablePage ? 'overscroll-none overflow-hidden touch-none' : ''}`}
            onDragStart={handleDragStart}
            style={{ WebkitUserDrag: 'none' }}
        >
            <DynamicNavbar />
            <main className={`flex-1 px-4 sm:px-6 lg:px-[30px] pt-2 pb-6 sm:py-6 w-full no-scrollbar ${isScrollablePage ? 'overflow-y-auto' : 'overflow-hidden overscroll-none'}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;


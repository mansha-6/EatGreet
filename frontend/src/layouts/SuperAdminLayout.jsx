import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DynamicNavbar from '../components/DynamicNavbar';

const SuperAdminLayout = () => {
    const location = useLocation();

    useEffect(() => {
        // Always allow scroll — critical for mobile/tablet responsiveness
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

    return (
        <div className="min-h-screen bg-[#F0F2F4] flex flex-col">
            <DynamicNavbar />
            <main className="flex-1 w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default SuperAdminLayout;

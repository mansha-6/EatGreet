import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DynamicNavbar from '../components/DynamicNavbar';

const SuperAdminLayout = () => {
    const location = useLocation();

    useEffect(() => {
        // Always allow scroll — critical for mobile/tablet responsiveness
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';
        document.body.style.touchAction = 'auto';
        document.body.style.overscrollBehavior = 'auto';
        document.documentElement.style.overflowY = 'auto';
        document.documentElement.style.overflowX = 'hidden';
        document.documentElement.style.overscrollBehavior = 'auto';

        return () => {
            document.body.style.overflowY = '';
            document.body.style.overflowX = '';
            document.body.style.touchAction = '';
            document.body.style.overscrollBehavior = '';
            document.documentElement.style.overflowY = '';
            document.documentElement.style.overflowX = '';
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

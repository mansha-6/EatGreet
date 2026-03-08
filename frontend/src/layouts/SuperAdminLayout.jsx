import React from 'react';
import { Outlet } from 'react-router-dom';
import DynamicNavbar from '../components/DynamicNavbar';

const SuperAdminLayout = () => {
    return (
        <div className="flex flex-col h-screen bg-[#F0F2F4] overflow-hidden overscroll-none">
            <DynamicNavbar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden w-full no-scrollbar flex flex-col min-h-0 overscroll-none">
                <Outlet />
            </main>
        </div>
    );
};

export default SuperAdminLayout;

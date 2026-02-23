
import { Outlet, useParams } from 'react-router-dom';
import DynamicNavbar from '../components/DynamicNavbar';

const KitchenLayout = () => {
    const { restaurantName } = useParams();

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] selection:bg-[#FD6941]/30 selection:text-[#FD6941]">
            <DynamicNavbar />

            {/* Content Container */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-[30px] py-6 w-full no-scrollbar">
                <Outlet />
            </main>
        </div>
    );
};

export default KitchenLayout;

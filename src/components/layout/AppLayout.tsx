import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pt-24 lg:pt-24">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

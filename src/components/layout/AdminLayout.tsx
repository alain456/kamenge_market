import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="min-h-screen bg-[#d2e8d5] flex flex-col md:flex-row font-sans text-gray-800 antialiased p-2 md:p-3 lg:p-4">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area Container */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-4">
        {/* Topbar Header */}
        <Topbar
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          globalSearchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        {/* Dynamic Page Outlet Container */}
        <div className="flex-1 overflow-y-auto pr-1">
          <Outlet context={{ selectedPeriod, globalSearch }} />
        </div>
      </main>
    </div>
  );
};

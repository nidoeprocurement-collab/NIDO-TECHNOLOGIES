import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const COLLAPSE_STORAGE_KEY = 'nido:sidebar-collapsed';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore storage errors (e.g. private browsing)
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen max-w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

      {/* Main Content — takes the remaining width next to the fixed sidebar,
          so the header and page body always span exactly the same width.
          When the sidebar is hidden, the content stretches to fill the
          freed-up space instead of leaving a gap. */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Top Bar + Page Content share one scroll container, so the header
            scrolls away with the rest of the page instead of staying fixed. */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          <TopBar />
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

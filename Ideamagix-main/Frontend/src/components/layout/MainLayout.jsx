import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import PropTypes from 'prop-types';

const MainLayout = ({ navItems }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentNavItem = navItems.find(item => location.pathname.startsWith(item.href));
  const pageTitle = currentNavItem ? currentNavItem.label : 'Dashboard';

  return (
    <div className="min-h-screen w-full">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navItems={navItems}
      />
      <div className="flex flex-col lg:pl-64">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title={pageTitle}
        />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

MainLayout.propTypes = {
  navItems: PropTypes.array.isRequired,
};

export default MainLayout;

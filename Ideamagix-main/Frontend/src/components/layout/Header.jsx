import React from 'react';
import PropTypes from 'prop-types';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ setSidebarOpen, title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-muted-foreground"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.role}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

Header.propTypes = {
  setSidebarOpen: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default Header;

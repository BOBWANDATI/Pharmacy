import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>PharmaLink</h2>
        </div>
        <div className="navbar-links">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/drugs" 
            className={`nav-link ${isActive('/drugs') ? 'active' : ''}`}
          >
            Drugs
          </Link>
          <Link 
            to="/sales" 
            className={`nav-link ${isActive('/sales') ? 'active' : ''}`}
          >
            Sales
          </Link>
          <Link 
            to="/suppliers" 
            className={`nav-link ${isActive('/suppliers') ? 'active' : ''}`}
          >
            Suppliers
          </Link>
          <Link 
            to="/reports" 
            className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
          >
            Reports
          </Link>
          <Link 
            to="/settings" 
            className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
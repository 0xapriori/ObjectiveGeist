import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/">Anoma Forum Summarizer</Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/daily-summaries">Daily Summaries</Link></li>
            <li><Link to="/stats/users">User Stats</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;

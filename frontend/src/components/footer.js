import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Anoma Forum Summarizer</p>
        <p>
          <a href="https://research.anoma.net" target="_blank" rel="noopener noreferrer">
            Visit the Anoma Research Forum
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

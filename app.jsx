import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [basename, setBasename] = useState('');

  useEffect(() => {
    const path = window.location.pathname;
    const basePath = path.substring(0, path.lastIndexOf('/'));
    setBasename(basePath);

    const checkDependencies = () => {
      if (window.Web3Provider && window.Home) {
        setIsReady(true);
      }
    };

    checkDependencies();
    const interval = setInterval(checkDependencies, 100);
    return () => clearInterval(interval);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <window.Web3Provider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<window.Home />} />
        </Routes>
      </BrowserRouter>
    </window.Web3Provider>
  );
}

createRoot(document.getElementById('renderDiv')).render(<App />);
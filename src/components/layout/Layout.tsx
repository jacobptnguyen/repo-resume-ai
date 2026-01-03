import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};


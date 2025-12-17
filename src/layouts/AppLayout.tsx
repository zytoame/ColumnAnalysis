import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showHeader = true, 
  showNav = true,
  title = "Buddy"
}) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background pb-16">
      {showHeader && (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </header>
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

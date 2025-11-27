'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ImageIcon, LayoutGrid } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const tabs: Tab[] = [
  {
    id: 'image-factory',
    label: 'ImageFactory',
    href: '/image-factory',
    icon: <ImageIcon className="w-5 h-5" />,
  },
  {
    id: 'content-factory',
    label: 'ContentFactory',
    href: '/content-factory',
    icon: <LayoutGrid className="w-5 h-5" />,
    badge: 'Coming Soon',
  },
];

export default function TabNavigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const isActive = pathname?.startsWith(tab.href);
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`
                  flex items-center space-x-2 px-4 py-3 text-sm font-medium
                  border-b-2 transition-all duration-200
                  ${isActive 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}



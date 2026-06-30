"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: 'dashboard' },
  { name: 'Weekly Report', href: '/weekly', icon: 'calendar_view_week' },
  { name: 'Monthly Report', href: '/monthly', icon: 'analytics' },
  { name: 'Team Report', href: '/team-performance', icon: 'group' },
  { name: 'Monthly Backups', href: '/backup', icon: 'database' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] flex flex-col py-6 z-50 bg-primary dark:bg-primary-container text-on-primary">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-secondary-fixed text-3xl">corporate_fare</span>
          <div className="flex flex-col">
            <span className="text-headline-md font-bold leading-tight">CREATIVES FOCUS</span>
          </div>
        </div>
      </div>
      <nav className="flex-grow">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={isActive
                    ? "bg-secondary/20 text-secondary-fixed-dim border-l-4 border-secondary-fixed-dim flex items-center py-3 px-4 transition-all duration-200"
                    : "text-on-primary/60 border-l-4 border-transparent flex items-center py-3 px-4 hover:bg-on-primary/10 transition-all duration-200"}
                >
                  <span className="material-symbols-outlined mr-3">{item.icon}</span>
                  <span className="text-label-sm font-label-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-4 mt-auto pt-6 border-t border-on-primary/10">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-on-primary/60 flex items-center py-3 px-4 hover:bg-error/20 hover:text-error-container transition-all duration-200"
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          <span className="text-label-sm font-label-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

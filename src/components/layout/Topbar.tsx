/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Topbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  let pageTitle = "Team Overview";
  if (pathname === '/weekly') pageTitle = "Weekly Production Report";
  if (pathname === '/monthly') pageTitle = "Monthly Production Report";
  if (pathname === '/team-performance') pageTitle = "Team Report";
  if (pathname === '/backup') pageTitle = "Monthly Backups";

  return (
    <header className="fixed top-0 right-0 left-0 h-16 flex items-center justify-between px-6 z-40 ml-[260px] bg-primary dark:bg-primary-container text-on-primary border-b border-on-primary/10">
      <div className="flex items-center space-x-4">
        <span className="text-on-primary font-bold text-headline-md">{pageTitle}</span>
        <div className="h-6 w-[1px] bg-on-primary/20"></div>
        <span className="text-on-primary/70 font-medium text-body-md hidden sm:inline-block">PRODUCTIVITY TRACKER</span>
      </div>

      <div className="flex items-center gap-4">

        {session?.user && (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-on-primary/20 flex items-center justify-center bg-surface-tint text-on-tertiary">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold">{session.user.name?.charAt(0) || 'U'}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

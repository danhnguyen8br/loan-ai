'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface AdminNavigationProps {
  onLogout?: () => void;
}

export function AdminNavigation({ onLogout }: AdminNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-dark-darker sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin/templates" className="flex items-center gap-3">
              <Image
                src="/assets/leadity-logo.png"
                alt="Leadity Logo"
                width={100}
                height={32}
                className="h-8 w-auto brightness-0 invert"
                priority
              />
              <span className="text-primary font-bold text-lg tracking-wide">ADMIN</span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
              <Link
                href="/admin/templates"
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                  transition-all duration-200
                  ${pathname === '/admin/templates' || pathname.startsWith('/admin/templates/')
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Templates
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
            <Link 
              href="/simulator" 
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Simulator
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-leadity-header sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/simulator" className="flex items-center">
              <Image
                src="/assets/leadity-logo.png"
                alt="Leadity Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-2">
              <Link
                href="/simulator"
                className={`
                  relative px-4 py-2 text-base font-medium rounded-leadity-md
                  transition-all duration-200
                  ${pathname === '/simulator'
                    ? 'text-gray-900 bg-primary/15 border border-primary/30'
                    : 'text-gray-900 bg-primary hover:bg-primary-dark hover:text-white shadow-sm'
                  }
                `}
              >
                Mô Phỏng Chi Phí
                {pathname === '/simulator' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                )}
              </Link>
            </div>
          </div>
{/* Admin link hidden - access via /admin directly */}
        </div>
      </div>
    </nav>
  );
}

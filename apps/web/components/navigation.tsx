'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="bg-white shadow-leadity-header sticky top-0 z-50 border-b border-leadity-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="https://leadity.ai" className="flex items-center">
                <Image
                  src="/assets/leadity-logo.png"
                  alt="Leadity Logo"
                  width={120}
                  height={40}
                  style={{ height: '2.5rem', width: 'auto' }}
                  priority
                />
              </a>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-2">
                <Link
                  href="/"
                  className={`
                    relative px-4 py-2 text-base font-medium rounded-leadity-md
                    transition-all duration-200
                    ${pathname === '/'
                      ? 'text-dark-darker bg-primary/15 border border-primary/30'
                      : 'text-dark-darker hover:bg-primary/10'
                    }
                  `}
                >
                  Tìm gói vay
                  {pathname === '/' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-dark rounded-full" />
                  )}
                </Link>
                <Link
                  href="/about"
                  className={`
                    relative px-4 py-2 text-base font-medium rounded-leadity-md
                    transition-all duration-200
                    ${pathname === '/about'
                      ? 'text-dark-darker bg-primary/15 border border-primary/30'
                      : 'text-dark-darker hover:bg-primary/10'
                    }
                  `}
                >
                  Giới thiệu
                  {pathname === '/about' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-dark rounded-full" />
                  )}
                </Link>
              </div>
            </div>

            {/* Mobile hamburger button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg text-dark-darker hover:bg-primary/10 transition-colors focus:outline-none"
                aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                aria-expanded={isMobileMenuOpen}
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span 
                    className={`block h-0.5 w-full bg-current rounded-full transition-all duration-300 origin-center ${
                      isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                    }`}
                  />
                  <span 
                    className={`block h-0.5 w-full bg-current rounded-full transition-all duration-300 ${
                      isMobileMenuOpen ? 'opacity-0 scale-0' : ''
                    }`}
                  />
                  <span 
                    className={`block h-0.5 w-full bg-current rounded-full transition-all duration-300 origin-center ${
                      isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 sm:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile menu panel */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-72 bg-white z-40 sm:hidden shadow-xl transform transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col p-4 space-y-2">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`
              relative px-4 py-3 text-lg font-medium rounded-xl
              transition-all duration-200
              ${pathname === '/'
                ? 'text-dark-darker bg-primary/15 border border-primary/30'
                : 'text-dark-darker hover:bg-primary/10'
              }
            `}
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Tìm gói vay
            </span>
            {pathname === '/' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-dark rounded-r-full" />
            )}
          </Link>
          <Link
            href="/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`
              relative px-4 py-3 text-lg font-medium rounded-xl
              transition-all duration-200
              ${pathname === '/about'
                ? 'text-dark-darker bg-primary/15 border border-primary/30'
                : 'text-dark-darker hover:bg-primary/10'
              }
            `}
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Giới thiệu
            </span>
            {pathname === '/about' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-dark rounded-r-full" />
            )}
          </Link>
        </div>

        {/* Bottom branding in mobile menu */}
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-400 text-center">
              Powered by Leadity AI
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

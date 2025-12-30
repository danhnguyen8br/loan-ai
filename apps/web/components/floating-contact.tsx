"use client";

import { useState, useEffect, useRef } from "react";

interface FloatingContactProps {
  phoneNumber?: string;
  zaloUrl?: string;
}

export function FloatingContact({
  phoneNumber = "0948386873",
  zaloUrl = "https://zalo.me/0948386873",
}: FloatingContactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fade in after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Contact Options */}
      <div
        className={`flex flex-col gap-3 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Zalo Button */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 animate-slide-up"
          style={{ animationDelay: "50ms" }}
          onClick={() => setIsOpen(false)}
        >
          <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Chat Zalo
          </span>
          <div className="w-14 h-14 rounded-full bg-[#0068FF] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 touch-target">
            <ZaloIcon className="w-8 h-8 text-white" />
          </div>
        </a>

        {/* Call Button */}
        <a
          href={`tel:${phoneNumber}`}
          className="group flex items-center gap-3 animate-slide-up"
          style={{ animationDelay: "100ms" }}
          onClick={() => setIsOpen(false)}
        >
          <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Gọi ngay
          </span>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7CD734] to-[#4DC614] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 touch-target">
            <PhoneIcon className="w-7 h-7 text-white" />
          </div>
        </a>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 touch-target ${
          isOpen
            ? "bg-gray-800 rotate-45"
            : "bg-gradient-to-br from-[#7CD734] to-[#4DC614] animate-pulse-subtle"
        }`}
        aria-label={isOpen ? "Đóng menu liên hệ" : "Mở menu liên hệ"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <CloseIcon className="w-7 h-7 text-white" />
        ) : (
          <ChatBubbleIcon className="w-8 h-8 text-white" />
        )}
      </button>

      {/* Ripple animation for attention */}
      {!isOpen && (
        <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none">
          <div className="absolute inset-0 rounded-full bg-[#7CD734] animate-ping opacity-20" />
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% {
            box-shadow: 0 10px 25px -5px rgba(124, 215, 52, 0.4),
                        0 8px 10px -6px rgba(124, 215, 52, 0.3);
          }
          50% {
            box-shadow: 0 20px 35px -5px rgba(124, 215, 52, 0.5),
                        0 15px 20px -6px rgba(124, 215, 52, 0.4);
          }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Icons
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="currentColor">
      <path d="M12.5 6C8.91 6 6 8.91 6 12.5v23C6 39.09 8.91 42 12.5 42h23c3.59 0 6.5-2.91 6.5-6.5v-23C42 8.91 39.09 6 35.5 6h-23zm2.14 9h11.97c.56 0 1.06.22 1.43.58.38.38.6.91.55 1.47-.03.33-.11.65-.25.95-.64 1.37-1.94 3.54-3.34 5.64-1.4 2.1-2.89 4.13-3.89 5.28h6.42c.74 0 1.34.6 1.34 1.34 0 .74-.6 1.34-1.34 1.34H14.64c-.56 0-1.07-.22-1.44-.59a2.01 2.01 0 01-.55-1.47c.03-.33.11-.65.26-.95.64-1.36 1.94-3.53 3.34-5.63 1.4-2.1 2.89-4.13 3.89-5.28h-5.5c-.74 0-1.34-.6-1.34-1.34 0-.74.6-1.34 1.34-1.34zm18.3 3.54c.67 0 1.3.26 1.77.73.47.47.73 1.1.73 1.77v7.52c0 .67-.26 1.3-.73 1.77-.47.47-1.1.73-1.77.73-.67 0-1.3-.26-1.77-.73a2.49 2.49 0 01-.73-1.77v-7.52c0-.67.26-1.3.73-1.77.47-.47 1.1-.73 1.77-.73z" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}


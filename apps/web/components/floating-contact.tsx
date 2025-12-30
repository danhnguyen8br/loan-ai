"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface FloatingContactProps {
  phoneNumber?: string;
  zaloUrl?: string;
  whatsappNumber?: string;
}

export function FloatingContact({
  phoneNumber = "0948386873",
  zaloUrl = "https://zalo.me/0948386873",
  whatsappNumber = "+84948386873",
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
        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 animate-slide-up"
          style={{ animationDelay: "50ms" }}
          onClick={() => setIsOpen(false)}
        >
          <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            WhatsApp
          </span>
          <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 touch-target">
            <WhatsAppIcon className="w-8 h-8 text-white" />
          </div>
        </a>

        {/* Zalo Button */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 animate-slide-up"
          style={{ animationDelay: "100ms" }}
          onClick={() => setIsOpen(false)}
        >
          <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Chat Zalo
          </span>
          <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 touch-target overflow-hidden">
            <Image src="/assets/zalo-logo.svg" alt="Zalo" width={56} height={56} />
          </div>
        </a>

        {/* Call Button */}
        <a
          href={`tel:${phoneNumber}`}
          className="group flex items-center gap-3 animate-slide-up"
          style={{ animationDelay: "150ms" }}
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


function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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

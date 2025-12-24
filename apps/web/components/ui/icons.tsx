/**
 * Leadity Icon System
 * 
 * Design Guidelines:
 * - Góc vuông/góc nhọn (Sharp corners with strokeLinecap="square", strokeLinejoin="miter")
 * - Đường nét rõ ràng, dứt khoát (Clear, decisive lines)
 * - Tạo cảm giác mạnh mẽ, chính xác, hiệu suất cao
 * - Phù hợp với lĩnh vực công nghệ và tài chính
 * 
 * Usage:
 * import { Icons } from '@/components/ui/icons';
 * <Icons.Home className="w-6 h-6 text-primary" />
 */

import { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

// Common props for all icons - sharp corners style
const sharpStroke = {
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
};

// =============================================================================
// NAVIGATION & UI ICONS
// =============================================================================

function Home({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path 
        d="M3 12L12 3L21 12" 
        {...sharpStroke}
      />
      <path 
        d="M5 10V20H10V15H14V20H19V10" 
        {...sharpStroke}
      />
    </svg>
  );
}

function Building({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path 
        d="M4 21V7L12 3L20 7V21H4Z" 
        {...sharpStroke}
      />
      <path d="M8 10H10M14 10H16M8 14H10M14 14H16M8 18H10M14 18H16" {...sharpStroke} />
    </svg>
  );
}

function Search({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="4" y="4" width="12" height="12" rx="0" {...sharpStroke} />
      <path d="M14 14L20 20" {...sharpStroke} />
    </svg>
  );
}

function Edit({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 20H8L18 10L14 6L4 16V20Z" {...sharpStroke} />
      <path d="M14 6L18 10" {...sharpStroke} />
      <path d="M17 3L21 7L18 10L14 6L17 3Z" {...sharpStroke} />
    </svg>
  );
}

function Money({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="2" y="6" width="20" height="12" {...sharpStroke} />
      <path d="M12 10V14" {...sharpStroke} />
      <path d="M10 12H14" {...sharpStroke} />
      <path d="M6 10V14" {...sharpStroke} />
      <path d="M18 10V14" {...sharpStroke} />
    </svg>
  );
}

function Sparkles({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M12 2V6M12 18V22" {...sharpStroke} />
      <path d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07" {...sharpStroke} />
      <path d="M2 12H6M18 12H22" {...sharpStroke} />
      <path d="M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" {...sharpStroke} />
      <rect x="9" y="9" width="6" height="6" {...sharpStroke} />
    </svg>
  );
}

function Check({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2.5}
      {...props}
    >
      <path d="M4 12L10 18L20 6" {...sharpStroke} />
    </svg>
  );
}

function X({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2.5}
      {...props}
    >
      <path d="M6 6L18 18M18 6L6 18" {...sharpStroke} />
    </svg>
  );
}

function ChevronDown({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2.5}
      {...props}
    >
      <path d="M6 9L12 15L18 9" {...sharpStroke} />
    </svg>
  );
}

function ChevronRight({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2.5}
      {...props}
    >
      <path d="M9 6L15 12L9 18" {...sharpStroke} />
    </svg>
  );
}

function ArrowRight({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 12H20" {...sharpStroke} />
      <path d="M14 6L20 12L14 18" {...sharpStroke} />
    </svg>
  );
}

function ArrowLeft({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M20 12H4" {...sharpStroke} />
      <path d="M10 6L4 12L10 18" {...sharpStroke} />
    </svg>
  );
}

// =============================================================================
// LOAN & FINANCE ICONS
// =============================================================================

function Mortgage({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      {/* House */}
      <path d="M3 12L12 4L21 12" {...sharpStroke} />
      <path d="M5 10V20H19V10" {...sharpStroke} />
      {/* Door */}
      <rect x="10" y="14" width="4" height="6" {...sharpStroke} />
      {/* Dollar sign */}
      <path d="M12 7V9M11 8H13" {...sharpStroke} strokeWidth={1.5} />
    </svg>
  );
}

function Refinance({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      {/* Two rotating arrows forming a cycle - sharp corners */}
      <path d="M4 12H2V4H10V6H5.5L8 8.5" {...sharpStroke} />
      <path d="M20 12H22V20H14V18H18.5L16 15.5" {...sharpStroke} />
      {/* Arrow heads */}
      <path d="M6 10L4 12L2 10" {...sharpStroke} />
      <path d="M18 14L20 12L22 14" {...sharpStroke} />
    </svg>
  );
}

function BankTransfer({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      {/* Bank 1 */}
      <path d="M2 8L6 5L10 8V12H2V8Z" {...sharpStroke} />
      <path d="M4 12V10M6 12V10M8 12V10" {...sharpStroke} strokeWidth={1.5} />
      {/* Bank 2 */}
      <path d="M14 8L18 5L22 8V12H14V8Z" {...sharpStroke} />
      <path d="M16 12V10M18 12V10M20 12V10" {...sharpStroke} strokeWidth={1.5} />
      {/* Arrow */}
      <path d="M7 16H17" {...sharpStroke} />
      <path d="M14 13L17 16L14 19" {...sharpStroke} />
    </svg>
  );
}

function Calculator({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="4" y="2" width="16" height="20" {...sharpStroke} />
      <rect x="6" y="4" width="12" height="4" {...sharpStroke} />
      <path d="M7 11H9M11 11H13M15 11H17" {...sharpStroke} />
      <path d="M7 14H9M11 14H13M15 14H17" {...sharpStroke} />
      <path d="M7 17H9M11 17H13M15 17H17" {...sharpStroke} />
    </svg>
  );
}

function Percentage({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M19 5L5 19" {...sharpStroke} />
      <rect x="5" y="5" width="4" height="4" {...sharpStroke} />
      <rect x="15" y="15" width="4" height="4" {...sharpStroke} />
    </svg>
  );
}

function Wallet({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M2 6H18V4H4V20H20V8H2V6Z" {...sharpStroke} />
      <rect x="4" y="6" width="16" height="14" {...sharpStroke} />
      <path d="M16 14H18V12H16V14Z" fill="currentColor" {...sharpStroke} />
    </svg>
  );
}

function TrendUp({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 18L10 12L14 16L20 6" {...sharpStroke} />
      <path d="M14 6H20V12" {...sharpStroke} />
    </svg>
  );
}

function TrendDown({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 6L10 12L14 8L20 18" {...sharpStroke} />
      <path d="M14 18H20V12" {...sharpStroke} />
    </svg>
  );
}

function Lightning({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M13 2L4 14H11L10 22L19 10H12L13 2Z" {...sharpStroke} />
    </svg>
  );
}

function CoinStack({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 8H20M4 8V12M4 8V4H20V8M20 8V12M4 12H20M4 12V16M20 12V16M4 16H20M4 16V20H20V16" {...sharpStroke} />
    </svg>
  );
}

// =============================================================================
// INFO & STATUS ICONS
// =============================================================================

function Info({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" {...sharpStroke} />
      <path d="M12 8V8.5M12 11V16" {...sharpStroke} strokeWidth={2.5} />
    </svg>
  );
}

function InfoCircle({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <circle cx="12" cy="12" r="9" {...sharpStroke} />
      <path d="M12 8V8.5" {...sharpStroke} strokeWidth={2.5} />
      <path d="M12 11V16" {...sharpStroke} />
    </svg>
  );
}

function Warning({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M12 3L2 21H22L12 3Z" {...sharpStroke} />
      <path d="M12 10V14" {...sharpStroke} />
      <path d="M12 17V17.5" {...sharpStroke} strokeWidth={2.5} />
    </svg>
  );
}

function Star({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z" {...sharpStroke} />
    </svg>
  );
}

function StarFilled({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      stroke="currentColor" 
      strokeWidth={1}
      {...props}
    >
      <path d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z" {...sharpStroke} />
    </svg>
  );
}

function Bookmark({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M5 3H19V21L12 15L5 21V3Z" {...sharpStroke} />
    </svg>
  );
}

function Tag({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M3 3H12L21 12L12 21L3 12V3Z" {...sharpStroke} />
      <rect x="6" y="6" width="2" height="2" fill="currentColor" {...sharpStroke} />
    </svg>
  );
}

// =============================================================================
// ACTION ICONS
// =============================================================================

function Plus({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2.5}
      {...props}
    >
      <path d="M12 4V20M4 12H20" {...sharpStroke} />
    </svg>
  );
}

function Minus({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2.5}
      {...props}
    >
      <path d="M4 12H20" {...sharpStroke} />
    </svg>
  );
}

function Refresh({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 4V10H10" {...sharpStroke} />
      <path d="M20 20V14H14" {...sharpStroke} />
      <path d="M4 10C4 10 6 6 12 6C18 6 20 12 20 12" {...sharpStroke} />
      <path d="M20 14C20 14 18 18 12 18C6 18 4 12 4 12" {...sharpStroke} />
    </svg>
  );
}

function Settings({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="9" y="9" width="6" height="6" {...sharpStroke} />
      <path d="M10 3H14V5H10V3Z" {...sharpStroke} />
      <path d="M10 19H14V21H10V19Z" {...sharpStroke} />
      <path d="M3 10V14H5V10H3Z" {...sharpStroke} />
      <path d="M19 10V14H21V10H19Z" {...sharpStroke} />
      <path d="M5.5 5.5L7.5 7.5M16.5 16.5L18.5 18.5" {...sharpStroke} />
      <path d="M5.5 18.5L7.5 16.5M16.5 7.5L18.5 5.5" {...sharpStroke} />
    </svg>
  );
}

function Menu({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2.5}
      {...props}
    >
      <path d="M3 6H21M3 12H21M3 18H21" {...sharpStroke} />
    </svg>
  );
}

function Grid({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="3" y="3" width="7" height="7" {...sharpStroke} />
      <rect x="14" y="3" width="7" height="7" {...sharpStroke} />
      <rect x="3" y="14" width="7" height="7" {...sharpStroke} />
      <rect x="14" y="14" width="7" height="7" {...sharpStroke} />
    </svg>
  );
}

function List({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M8 6H21M8 12H21M8 18H21" {...sharpStroke} />
      <rect x="3" y="5" width="2" height="2" fill="currentColor" {...sharpStroke} />
      <rect x="3" y="11" width="2" height="2" fill="currentColor" {...sharpStroke} />
      <rect x="3" y="17" width="2" height="2" fill="currentColor" {...sharpStroke} />
    </svg>
  );
}

function Filter({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M3 4H21L14 12V20L10 22V12L3 4Z" {...sharpStroke} />
    </svg>
  );
}

function Download({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M12 3V15" {...sharpStroke} />
      <path d="M7 10L12 15L17 10" {...sharpStroke} />
      <path d="M4 17V21H20V17" {...sharpStroke} />
    </svg>
  );
}

function Share({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="14" y="3" width="6" height="6" {...sharpStroke} />
      <rect x="14" y="15" width="6" height="6" {...sharpStroke} />
      <rect x="4" y="9" width="6" height="6" {...sharpStroke} />
      <path d="M10 11L14 7M10 13L14 17" {...sharpStroke} />
    </svg>
  );
}

function Link({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M10 14L14 10" {...sharpStroke} />
      <path d="M7 17L4 17L4 10L8 6L11 6" {...sharpStroke} />
      <path d="M17 7L20 7L20 14L16 18L13 18" {...sharpStroke} />
    </svg>
  );
}

// =============================================================================
// USER & PEOPLE ICONS
// =============================================================================

function User({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="8" y="4" width="8" height="8" {...sharpStroke} />
      <path d="M4 20V18C4 16 6 14 12 14C18 14 20 16 20 18V20H4Z" {...sharpStroke} />
    </svg>
  );
}

function Users({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="6" y="4" width="6" height="6" {...sharpStroke} />
      <path d="M2 18V16C2 14.5 4 13 9 13C11 13 12 13.5 12 13.5" {...sharpStroke} />
      <rect x="14" y="6" width="5" height="5" {...sharpStroke} />
      <path d="M22 20V18C22 16.5 20 15 16.5 15C13 15 11 16.5 11 18V20H22Z" {...sharpStroke} />
    </svg>
  );
}

// =============================================================================
// DOCUMENT ICONS
// =============================================================================

function Document({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 4H14L20 10V20H4V4Z" {...sharpStroke} />
      <path d="M14 4V10H20" {...sharpStroke} />
    </svg>
  );
}

function DocumentText({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 4H14L20 10V20H4V4Z" {...sharpStroke} />
      <path d="M14 4V10H20" {...sharpStroke} />
      <path d="M8 13H16M8 16H12" {...sharpStroke} />
    </svg>
  );
}

function Folder({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M3 7V19H21V7H11L9 5H3V7Z" {...sharpStroke} />
    </svg>
  );
}

function Clipboard({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="5" y="4" width="14" height="18" {...sharpStroke} />
      <path d="M9 4V2H15V4" {...sharpStroke} />
      <path d="M8 10H16M8 14H16M8 18H12" {...sharpStroke} />
    </svg>
  );
}

function Calendar({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="3" y="5" width="18" height="16" {...sharpStroke} />
      <path d="M3 9H21" {...sharpStroke} />
      <path d="M7 3V5M17 3V5" {...sharpStroke} />
      <path d="M7 13H9M11 13H13M15 13H17M7 17H9M11 17H13" {...sharpStroke} />
    </svg>
  );
}

function Clock({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" {...sharpStroke} />
      <path d="M12 7V12H16" {...sharpStroke} />
    </svg>
  );
}

// =============================================================================
// COMMUNICATION ICONS
// =============================================================================

function Mail({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="3" y="5" width="18" height="14" {...sharpStroke} />
      <path d="M3 5L12 12L21 5" {...sharpStroke} />
    </svg>
  );
}

function Phone({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M5 4H9L11 9L8 11C9 13 11 15 13 16L15 13L20 15V19C20 20 19 21 18 21C9 21 3 15 3 6C3 5 4 4 5 4Z" {...sharpStroke} />
    </svg>
  );
}

function Bell({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M6 10V16L4 18V19H20V18L18 16V10C18 7 15 4 12 4C9 4 6 7 6 10Z" {...sharpStroke} />
      <path d="M10 19V20C10 21 11 22 12 22C13 22 14 21 14 20V19" {...sharpStroke} />
    </svg>
  );
}

// =============================================================================
// MISC ICONS
// =============================================================================

function Location({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M12 3C8 3 5 6 5 10C5 15 12 21 12 21C12 21 19 15 19 10C19 6 16 3 12 3Z" {...sharpStroke} />
      <rect x="10" y="8" width="4" height="4" {...sharpStroke} />
    </svg>
  );
}

function Target({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" {...sharpStroke} />
      <rect x="7" y="7" width="10" height="10" {...sharpStroke} />
      <rect x="10" y="10" width="4" height="4" fill="currentColor" {...sharpStroke} />
    </svg>
  );
}

function Shield({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M12 3L4 7V12C4 16 7 20 12 22C17 20 20 16 20 12V7L12 3Z" {...sharpStroke} />
    </svg>
  );
}

function Lock({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <rect x="5" y="10" width="14" height="11" {...sharpStroke} />
      <path d="M8 10V7C8 5 9 3 12 3C15 3 16 5 16 7V10" {...sharpStroke} />
      <rect x="11" y="14" width="2" height="4" fill="currentColor" {...sharpStroke} />
    </svg>
  );
}

function Eye({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" {...sharpStroke} />
      <rect x="10" y="10" width="4" height="4" {...sharpStroke} />
    </svg>
  );
}

function EyeOff({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M2 12C2 12 5 5 12 5C13 5 14 5.2 15 5.5M22 12C22 12 20 17 15 18.5" {...sharpStroke} />
      <path d="M3 3L21 21" {...sharpStroke} />
      <rect x="10" y="10" width="4" height="4" {...sharpStroke} />
    </svg>
  );
}

function Heart({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M12 6L8 3H4V7L12 20L20 7V3H16L12 6Z" {...sharpStroke} />
    </svg>
  );
}

function ThumbUp({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M4 21V11H7V21H4Z" {...sharpStroke} />
      <path d="M7 11L10 3H13L11 9H20V14L17 21H7V11Z" {...sharpStroke} />
    </svg>
  );
}

function LightBulb({ className, ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path d="M9 18H15V21H9V18Z" {...sharpStroke} />
      <path d="M9 18C9 18 7 16 7 12C7 9 9 6 12 6C15 6 17 9 17 12C17 16 15 18 15 18" {...sharpStroke} />
      <path d="M12 2V4" {...sharpStroke} />
      <path d="M4 12H2M22 12H20" {...sharpStroke} />
      <path d="M5 5L6.5 6.5M19 5L17.5 6.5" {...sharpStroke} />
    </svg>
  );
}

// =============================================================================
// EXPORT
// =============================================================================

export const Icons = {
  // Navigation & UI
  Home,
  Building,
  Search,
  Edit,
  Money,
  Sparkles,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  
  // Loan & Finance
  Mortgage,
  Refinance,
  BankTransfer,
  Calculator,
  Percentage,
  Wallet,
  TrendUp,
  TrendDown,
  Lightning,
  CoinStack,
  
  // Info & Status
  Info,
  InfoCircle,
  Warning,
  Star,
  StarFilled,
  Bookmark,
  Tag,
  
  // Actions
  Plus,
  Minus,
  Refresh,
  Settings,
  Menu,
  Grid,
  List,
  Filter,
  Download,
  Share,
  Link,
  
  // User & People
  User,
  Users,
  
  // Documents
  Document,
  DocumentText,
  Folder,
  Clipboard,
  Calendar,
  Clock,
  
  // Communication
  Mail,
  Phone,
  Bell,
  
  // Misc
  Location,
  Target,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Heart,
  ThumbUp,
  LightBulb,
};

export type IconName = keyof typeof Icons;


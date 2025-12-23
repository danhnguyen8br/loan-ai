'use client';

import { ReactNode, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

export interface InfoTooltipProps {
  /** Content to display in the tooltip */
  content: ReactNode;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Size of the info icon */
  size?: 'sm' | 'md';
  /** Optional custom className for the trigger */
  className?: string;
  /** Side of the tooltip relative to trigger */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignment of the tooltip */
  align?: 'start' | 'center' | 'end';
}

/**
 * InfoTooltip Component
 * 
 * Displays a small circular "i" icon that shows a tooltip on hover (desktop)
 * or tap (mobile). Fully accessible with keyboard navigation.
 */
export function InfoTooltip({
  content,
  ariaLabel = 'Thông tin thêm',
  size = 'sm',
  className = '',
  side = 'top',
  align = 'center',
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  const iconSize = size === 'sm' ? 14 : 16;
  const containerSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={500}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className={`
              inline-flex items-center justify-center
              ${containerSize}
              rounded-full
              bg-primary/20 hover:bg-primary/30
              text-primary-dark
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1
              cursor-help
              ${className}
            `}
            aria-label={ariaLabel}
            onClick={() => setOpen(!open)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
          >
            <Info size={iconSize} strokeWidth={2.5} />
          </button>
        </Tooltip.Trigger>
        
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className="
              z-50
              max-w-[300px] min-w-[200px]
              px-4 py-3
              bg-dark-darker text-white
              text-sm leading-relaxed
              rounded-xl
              shadow-lg shadow-black/20
              
              animate-in fade-in-0 zoom-in-95
              data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
              data-[side=bottom]:slide-in-from-top-2
              data-[side=left]:slide-in-from-right-2
              data-[side=right]:slide-in-from-left-2
              data-[side=top]:slide-in-from-bottom-2
            "
            onPointerDownOutside={() => setOpen(false)}
            onEscapeKeyDown={() => setOpen(false)}
          >
            {content}
            <Tooltip.Arrow 
              className="fill-dark-darker" 
              width={12} 
              height={6} 
            />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/**
 * InfoTooltip with styled content for glossary terms
 */
export interface GlossaryTooltipContentProps {
  /** Main definition text */
  definition: string;
  /** Optional examples */
  examples?: string[];
  /** Optional long description (if needed in future) */
  longDescription?: string;
}

export function GlossaryTooltipContent({
  definition,
  examples,
  longDescription,
}: GlossaryTooltipContentProps) {
  return (
    <div className="space-y-2">
      <p className="text-white/95 leading-relaxed">{definition}</p>
      
      {longDescription && (
        <p className="text-white/70 text-xs leading-relaxed border-t border-white/10 pt-2">
          {longDescription}
        </p>
      )}
      
      {examples && examples.length > 0 && (
        <div className="border-t border-white/10 pt-2">
          <p className="text-xs text-primary font-medium mb-1">Ví dụ:</p>
          <ul className="space-y-1">
            {examples.map((example, index) => (
              <li 
                key={index} 
                className="text-xs text-white/80 leading-relaxed flex items-start"
              >
                <span className="text-primary mr-1.5 mt-0.5">•</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


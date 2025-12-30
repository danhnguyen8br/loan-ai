'use client';

import { ReactNode } from 'react';
import { InfoTooltip, GlossaryTooltipContent } from './info-tooltip';
import { findEntryByTerm, findEntryByKey, type GlossaryEntry } from '@/lib/glossary.vi';

export interface GlossaryTermProps {
  /** 
   * The banking term to look up in the glossary.
   * Can be the display term (e.g., "Lãi suất ưu đãi") or the key (e.g., "promo_rate")
   */
  term: string;
  /** 
   * Optional children to display as the term text.
   * If not provided, the term prop will be displayed.
   */
  children?: ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Size of the info icon */
  size?: 'sm' | 'md';
  /** Whether to use underline styling for the term */
  underline?: boolean;
  /** Tooltip position */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * GlossaryTerm Component
 * 
 * Renders a term with an info tooltip showing the Vietnamese explanation
 * from the glossary. If the term is not found, renders plain text.
 * 
 * @example
 * // Using term lookup
 * <GlossaryTerm term="Lãi suất ưu đãi" />
 * 
 * // Using key lookup with custom display text
 * <GlossaryTerm term="promo_rate">Promotional Rate</GlossaryTerm>
 * 
 * // With custom styling
 * <GlossaryTerm term="LTV" className="font-medium" underline />
 */
export function GlossaryTerm({
  term,
  children,
  className = '',
  size = 'sm',
  underline = false,
  side = 'top',
}: GlossaryTermProps) {
  // Try to find by term first, then by key
  const entry: GlossaryEntry | null = findEntryByTerm(term) || findEntryByKey(term);

  // If no entry found, render plain text
  if (!entry) {
    return <span className={className}>{children || term}</span>;
  }

  const displayText = children || term;

  return (
    <span 
      className={`
        inline-flex items-center gap-1
        ${underline ? 'border-b border-dashed border-primary/50' : ''}
        ${className}
      `}
    >
      <span>{displayText}</span>
      <InfoTooltip
        content={
          <GlossaryTooltipContent
            definition={entry.short}
            examples={entry.examples}
          />
        }
        ariaLabel={`Giải thích: ${entry.terms[0]}`}
        size={size}
        side={side}
      />
    </span>
  );
}

/**
 * A variant that wraps text and places icon inline
 * Useful for table headers or compact layouts
 */
export interface GlossaryLabelProps extends Omit<GlossaryTermProps, 'children'> {
  /** The label text to display */
  label: string;
}

export function GlossaryLabel({
  term,
  label,
  className = '',
  size = 'sm',
  side = 'top',
}: GlossaryLabelProps) {
  const entry: GlossaryEntry | null = findEntryByTerm(term) || findEntryByKey(term);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{label}</span>
      {entry && (
        <InfoTooltip
          content={
            <GlossaryTooltipContent
              definition={entry.short}
              examples={entry.examples}
            />
          }
          ariaLabel={`Giải thích: ${entry.terms[0]}`}
          size={size}
          side={side}
        />
      )}
    </span>
  );
}

/**
 * InfoIcon-only component for use in table headers or tight spaces
 * Just renders the icon without any text
 */
export interface GlossaryIconProps {
  /** The term key to look up */
  term: string;
  /** Size of the icon */
  size?: 'sm' | 'md';
  /** Tooltip position */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Additional classes */
  className?: string;
}

export function GlossaryIcon({
  term,
  size = 'sm',
  side = 'top',
  className = '',
}: GlossaryIconProps) {
  const entry: GlossaryEntry | null = findEntryByTerm(term) || findEntryByKey(term);

  if (!entry) return null;

  return (
    <InfoTooltip
      content={
        <GlossaryTooltipContent
          definition={entry.short}
          examples={entry.examples}
        />
      }
      ariaLabel={`Giải thích: ${entry.terms[0]}`}
      size={size}
      side={side}
      className={className}
    />
  );
}



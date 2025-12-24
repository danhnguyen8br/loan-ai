'use client';

import { useState, useMemo } from 'react';
import { Icons } from '@/components/ui/icons';
import type { ScheduleRowResponse } from '@/app/api/simulator/recommend/route';

interface DetailedScheduleTableProps {
  schedule: ScheduleRowResponse[];
  promoEndMonth?: number;
}

export function DetailedScheduleTable({ schedule, promoEndMonth = 24 }: DetailedScheduleTableProps) {
  const [displayMode, setDisplayMode] = useState<'summary' | 'detail'>('summary');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([1])); // Year 1 expanded by default

  // Group schedule by year
  const yearlyData = useMemo(() => {
    const years: { 
      year: number; 
      months: ScheduleRowResponse[];
      totalPayment: number;
      totalInterest: number;
      totalPrincipal: number;
      startBalance: number;
      endBalance: number;
      avgRate: number;
    }[] = [];

    let currentYear = 1;
    let currentMonths: ScheduleRowResponse[] = [];

    for (const row of schedule) {
      const yearForMonth = Math.ceil(row.month / 12);
      
      if (yearForMonth !== currentYear && currentMonths.length > 0) {
        // Finish current year
        years.push(calculateYearSummary(currentYear, currentMonths));
        currentMonths = [];
        currentYear = yearForMonth;
      }
      
      currentMonths.push(row);
    }

    // Don't forget the last year
    if (currentMonths.length > 0) {
      years.push(calculateYearSummary(currentYear, currentMonths));
    }

    return years;
  }, [schedule]);

  // Calculate overall totals
  const totals = useMemo(() => ({
    interest: schedule.reduce((sum, r) => sum + r.interest, 0),
    principal: schedule.reduce((sum, r) => sum + r.principal_scheduled + r.extra_principal, 0),
    fees: schedule.reduce((sum, r) => sum + r.fees, 0),
    insurance: schedule.reduce((sum, r) => sum + r.insurance, 0),
    total: schedule.reduce((sum, r) => sum + r.payment_total, 0),
  }), [schedule]);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedYears(new Set(yearlyData.map(y => y.year)));
  };

  const collapseAll = () => {
    setExpandedYears(new Set());
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-dark to-primary px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-text-inverse" />
            <h4 className="font-semibold text-text-inverse text-base sm:text-lg">Lịch Trả Nợ Chi Tiết</h4>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setDisplayMode(displayMode === 'summary' ? 'detail' : 'summary')}
              className="text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              {displayMode === 'summary' ? 'Chi tiết' : 'Tóm tắt'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-primary-50 border-b border-primary/30">
        <StatBox label="Tổng Lãi" value={formatVND(totals.interest)} color="red" />
        <StatBox label="Tổng Gốc" value={formatVND(totals.principal)} color="blue" />
        <StatBox label="Tổng Phí" value={formatVND(totals.fees + totals.insurance)} color="orange" />
        <StatBox label="Tổng TT" value={formatVND(totals.total)} color="green" />
      </div>

      {/* Expand/Collapse buttons */}
      <div className="flex justify-between items-center px-4 py-2.5 bg-leadity-gray-lighter border-b border-leadity-gray-light">
        <span className="text-sm text-text-muted">{schedule.length} tháng • {yearlyData.length} năm</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={collapseAll}
            className="text-sm text-text-muted hover:text-leadity-gray"
          >
            Thu gọn
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="text-sm text-primary-dark hover:text-primary font-medium"
          >
            Mở rộng tất cả
          </button>
        </div>
      </div>

      {/* Year-by-Year View */}
      <div className="divide-y divide-gray-100">
        {yearlyData.map((yearData) => {
          const isExpanded = expandedYears.has(yearData.year);
          const isPromoYear = yearData.year <= Math.ceil(promoEndMonth / 12);
          const hasPromoEnd = yearData.months.some(m => m.month === promoEndMonth);
          const hasPayoff = yearData.months.some(m => m.is_payoff_month);
          
          return (
            <div key={yearData.year}>
              {/* Year Header - Clickable */}
              <button
                type="button"
                onClick={() => toggleYear(yearData.year)}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-leadity-gray-lighter transition-colors touch-manipulation ${
                  isExpanded ? 'bg-leadity-gray-lighter' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm sm:text-base font-bold ${
                    isPromoYear ? 'bg-primary-50 text-primary-700' : 'bg-status-warning-light text-status-warning-dark'
                  }`}>
                    N{yearData.year}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-dark-darker text-base">
                      Năm {yearData.year}
                      {isPromoYear && !hasPromoEnd && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded">Ưu đãi</span>
                      )}
                      {hasPromoEnd && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-status-warning-light text-status-warning rounded">Hết ưu đãi</span>
                      )}
                      {hasPayoff && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded">Tất toán</span>
                      )}
                    </div>
                    <div className="text-sm text-text-muted">
                      Lãi suất TB: {yearData.avgRate.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-dark-darker">{formatVND(yearData.totalPayment)}</div>
                    <div className="text-sm text-text-muted">
                      Lãi: {formatVND(yearData.totalInterest)}
                    </div>
                  </div>
                  <Icons.ChevronDown 
                    className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </div>
              </button>

              {/* Expanded Monthly Details */}
              {isExpanded && (
                <div className="bg-gray-50/50">
                  {displayMode === 'summary' ? (
                    <MonthlyListView months={yearData.months} promoEndMonth={promoEndMonth} />
                  ) : (
                    <MonthlyTableView months={yearData.months} promoEndMonth={promoEndMonth} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-leadity-gray-lighter border-t border-leadity-gray-light">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary-dark"></div>
            <span className="text-text-muted">Kỳ ưu đãi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-muted">Lãi thả nổi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-text-muted">Tất toán</span>
          </div>
        </div>
        <p className="text-sm text-text-disabled mt-2 italic">
          * Số liệu làm tròn để dễ đọc. Liên hệ tư vấn để có thông tin chính xác.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function StatBox({ label, value, color }: { label: string; value: string; color: 'red' | 'blue' | 'orange' | 'green' }) {
  // Using WCAG AA compliant colors
  const colorMap = {
    red: 'text-status-error',
    blue: 'text-dark',
    orange: 'text-status-warning',
    green: 'text-primary-700',
  };

  return (
    <div className="text-center">
      <div className="text-sm text-text-muted">{label}</div>
      <div className={`text-base sm:text-lg font-bold ${colorMap[color]}`}>{value}</div>
    </div>
  );
}

function MonthlyListView({ months, promoEndMonth }: { months: ScheduleRowResponse[]; promoEndMonth: number }) {
  return (
    <div className="divide-y divide-leadity-gray-light">
      {months.map((row) => {
        const isPromoEnd = row.month === promoEndMonth;
        const isPayoff = row.is_payoff_month;
        const isPromo = row.month <= promoEndMonth;
        
        return (
          <div 
            key={row.month} 
            className={`px-4 py-3 flex items-center justify-between ${
              isPayoff ? 'bg-primary-50' : isPromoEnd ? 'bg-status-warning-light' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                isPayoff ? 'bg-primary-dark text-text-inverse' : 
                isPromo ? 'bg-primary-50 text-primary-700' : 'bg-status-warning-light text-status-warning-dark'
              }`}>
                T{row.month}
              </div>
              <div>
                <div className="text-base text-leadity-gray">
                  <span className="font-medium">Lãi:</span> {formatVND(row.interest)}
                  <span className="mx-1 text-leadity-gray-light">|</span>
                  <span className="font-medium">Gốc:</span> {formatVND(row.principal_scheduled)}
                </div>
                <div className="text-sm text-text-muted">
                  {row.rate_annual_pct.toFixed(2)}%/năm • Dư nợ: {formatVND(row.balance_end)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-dark-darker text-lg">{formatVND(row.payment_total)}</div>
              {isPayoff && (
                <div className="text-base text-primary-700 font-medium">Tất toán</div>
              )}
              {isPromoEnd && !isPayoff && (
                <div className="text-base text-status-warning font-medium">Hết ưu đãi</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyTableView({ months, promoEndMonth }: { months: ScheduleRowResponse[]; promoEndMonth: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead className="bg-leadity-gray-light">
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-leadity-gray-muted whitespace-nowrap">Tháng</th>
            <th className="px-3 py-3 text-right font-semibold text-leadity-gray-muted whitespace-nowrap">Lãi suất</th>
            <th className="px-3 py-3 text-right font-semibold text-leadity-gray-muted whitespace-nowrap">Dư nợ đầu</th>
            <th className="px-3 py-3 text-right font-semibold text-leadity-gray-muted whitespace-nowrap">Lãi</th>
            <th className="px-3 py-3 text-right font-semibold text-leadity-gray-muted whitespace-nowrap">Gốc</th>
            <th className="px-3 py-3 text-right font-semibold text-leadity-gray-muted bg-leadity-gray-light whitespace-nowrap">Tổng TT</th>
            <th className="px-3 py-3 text-right font-semibold text-leadity-gray-muted whitespace-nowrap">Dư nợ cuối</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-leadity-gray-light/50">
          {months.map((row) => {
            const isPromoEnd = row.month === promoEndMonth;
            const isPayoff = row.is_payoff_month;
            
            return (
              <tr 
                key={row.month} 
                className={
                  isPayoff ? 'bg-primary-50' : 
                  isPromoEnd ? 'bg-status-warning-light' : 
                  row.month % 2 === 0 ? 'bg-leadity-gray-lighter/30' : ''
                }
              >
                <td className="px-3 py-2.5 font-medium text-dark whitespace-nowrap">
                  T{row.month}
                  {isPayoff && <span className="ml-1 text-primary-dark">✓</span>}
                  {isPromoEnd && !isPayoff && <span className="ml-1 text-status-warning">↓</span>}
                </td>
                <td className="px-3 py-2.5 text-right text-leadity-gray-muted whitespace-nowrap">{row.rate_annual_pct.toFixed(2)}%</td>
                <td className="px-3 py-2.5 text-right text-leadity-gray-muted whitespace-nowrap">{formatVND(row.balance_start)}</td>
                <td className="px-3 py-2.5 text-right text-status-error whitespace-nowrap">{formatVND(row.interest)}</td>
                <td className="px-3 py-2.5 text-right text-leadity-gray whitespace-nowrap">{formatVND(row.principal_scheduled + row.extra_principal)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-dark-darker bg-leadity-gray-lighter whitespace-nowrap">{formatVND(row.payment_total)}</td>
                <td className="px-3 py-2.5 text-right text-leadity-gray-muted whitespace-nowrap">{formatVND(row.balance_end)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function calculateYearSummary(year: number, months: ScheduleRowResponse[]) {
  return {
    year,
    months,
    totalPayment: months.reduce((sum, m) => sum + m.payment_total, 0),
    totalInterest: months.reduce((sum, m) => sum + m.interest, 0),
    totalPrincipal: months.reduce((sum, m) => sum + m.principal_scheduled + m.extra_principal, 0),
    startBalance: months[0]?.balance_start ?? 0,
    endBalance: months[months.length - 1]?.balance_end ?? 0,
    avgRate: months.length > 0 
      ? months.reduce((sum, m) => sum + m.rate_annual_pct, 0) / months.length 
      : 0,
  };
}

function formatVND(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (absAmount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} tr`;
  }
  if (absAmount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} K`;
  }
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}


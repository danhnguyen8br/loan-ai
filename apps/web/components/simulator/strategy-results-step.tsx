'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Icons } from '@/components/ui/icons';
import { GlossaryIcon } from '@/components/ui/glossary-term';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import type { 
  ScheduleRow, 
  MortgagePurchaseResult, 
  RefinanceResult,
  ProductTemplate,
  MortgageMultiStrategyResult,
  RefinanceMultiStrategyResult,
  MortgagePurchaseForm,
  RefinanceForm,
  SimulateResponseV3,
  MortgageStrategyId,
  RefinanceStrategyId,
} from '@/lib/simulator-types';
import { 
  MORTGAGE_STRATEGY_LABELS, 
  REFINANCE_STRATEGY_LABELS,
  EXIT_RULE_LABELS,
  REFINANCE_OBJECTIVE_LABELS,
  formatVND, 
  formatShortVND, 
  formatPercent 
} from '@/lib/simulator-types';
import type { SimulatorFormData } from './inputs-step';

interface StrategyResultsStepProps {
  category: 'MORTGAGE_RE' | 'REFINANCE';
  // Product selection
  templates: ProductTemplate[];
  selectedTemplates: string[];
  onTemplateChange: (templateIds: string[]) => void;
  // Form data with strategy params
  formData: SimulatorFormData;
  onFormChange: (data: SimulatorFormData) => void;
  // Simulation
  onSimulate: () => Promise<void>;
  isSimulating: boolean;
  results: SimulateResponseV3 | null;
  // Reset
  onReset: () => void;
}

export function StrategyResultsStep({
  category,
  templates,
  selectedTemplates,
  onTemplateChange,
  formData,
  onFormChange,
  onSimulate,
  isSimulating,
  results,
  onReset,
}: StrategyResultsStepProps) {
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [hasSimulated, setHasSimulated] = useState(false);

  // Filter templates by category
  const categoryTemplates = useMemo(() => 
    templates.filter(t => t.category === category),
    [templates, category]
  );
  
  // Always select ALL templates automatically - no user selection needed
  useEffect(() => {
    if (categoryTemplates.length > 0) {
      const allTemplateIds = categoryTemplates.map(t => t.id);
      // Only update if different to avoid infinite loops
      if (JSON.stringify(allTemplateIds.sort()) !== JSON.stringify([...selectedTemplates].sort())) {
        onTemplateChange(allTemplateIds);
      }
    }
  }, [categoryTemplates, selectedTemplates, onTemplateChange]);
  
  // Use ref to hold the latest onSimulate to avoid re-triggering effect
  const onSimulateRef = useRef(onSimulate);
  const isSimulatingRef = useRef(false);
  
  useEffect(() => {
    onSimulateRef.current = onSimulate;
  }, [onSimulate]);

  // Create a stable key from config to detect meaningful changes
  const configKey = useMemo(() => {
    const mortgageData = formData as MortgagePurchaseForm;
    const refiData = formData as RefinanceForm;
    // Include all simulation-affecting params: strategy params + simulation options
    return `${categoryTemplates.map(t => t.id).sort().join(',')}-${mortgageData.extra_principal_vnd}-${mortgageData.exit_rule}-${mortgageData.exit_custom_month}-${refiData.objective}-${formData.stress_bump}-${formData.include_insurance}-${formData.repayment_method}`;
  }, [formData, categoryTemplates]);

  // Auto-simulate when config changes
  useEffect(() => {
    if (categoryTemplates.length > 0 && !isSimulatingRef.current) {
      const timer = setTimeout(() => {
        if (!isSimulatingRef.current) {
          isSimulatingRef.current = true;
          onSimulateRef.current()
            .then(() => setHasSimulated(true))
            .finally(() => { isSimulatingRef.current = false; });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [configKey, categoryTemplates.length]);

  // Get best result for summary banner
  const bestResult = useMemo(() => {
    if (!results) return null;
    
    if (results.type === 'MORTGAGE_RE') {
      let best: { templateResult: MortgageMultiStrategyResult; strategyId: MortgageStrategyId } | null = null;
      let lowestCost = Infinity;
      
      for (const templateResult of results.results) {
        for (const strategy of templateResult.strategies) {
          const cost = strategy.result.totals.total_cost_excl_principal;
          if (cost < lowestCost) {
            lowestCost = cost;
            best = { templateResult, strategyId: strategy.strategy_id };
          }
        }
      }
      return best;
    } else {
      let best: { templateResult: RefinanceMultiStrategyResult; strategyId: RefinanceStrategyId } | null = null;
      let highestSaving = -Infinity;
      
      for (const templateResult of results.results) {
        for (const strategy of templateResult.strategies) {
          if (strategy.result.net_saving_vnd > highestSaving) {
            highestSaving = strategy.result.net_saving_vnd;
            best = { templateResult, strategyId: strategy.strategy_id };
          }
        }
      }
      return best;
    }
  }, [results]);

  const downloadCSV = (schedule: ScheduleRow[], filename: string) => {
    const headers = ['Tháng', 'Ngày', 'Lãi Suất (%)', 'Dư Nợ Đầu Kỳ', 'Lãi', 'Gốc Kỳ Hạn', 'Gốc Thêm', 'Phí', 'Bảo Hiểm', 'Tổng Thanh Toán', 'Dư Nợ Cuối Kỳ'];
    
    const rows = schedule.map(row => [
      row.month,
      row.date,
      row.rate_annual_pct.toFixed(2),
      row.balance_start,
      row.interest,
      row.principal_scheduled,
      row.extra_principal,
      row.fees,
      row.insurance,
      row.payment_total,
      row.balance_end,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Strategy & Simulation Config - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strategy Config */}
        <Card variant="bordered">
          <CardHeader>
            <h3 className="text-lg font-semibold text-dark-darker">
              Điều chỉnh chiến lược trả nợ
            </h3>
            <p className="text-xs text-gray-500">
              {category === 'MORTGAGE_RE' 
                ? 'Tự động chạy 3 chiến lược: Thanh Toán Tối Thiểu, Trả Thêm Gốc, Tất Toán Sớm'
                : 'Tự động chạy 3 chiến lược: Chuyển NH ngay, Chuyển NH + Trả nhanh, Thời điểm tối ưu'}
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {category === 'MORTGAGE_RE' ? (
              <MortgageStrategyConfig 
                formData={formData as MortgagePurchaseForm}
                onChange={(updates) => onFormChange({ ...formData, ...updates } as SimulatorFormData)}
              />
            ) : (
              <RefinanceStrategyConfig
                formData={formData as RefinanceForm}
                onChange={(updates) => onFormChange({ ...formData, ...updates } as SimulatorFormData)}
              />
            )}
          </CardBody>
        </Card>

        {/* Simulation Options */}
        <SimulationOptionsConfig
          formData={formData}
          onChange={(updates) => onFormChange({ ...formData, ...updates } as SimulatorFormData)}
        />
      </div>

      {/* Loading State */}
      {isSimulating && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Đang mô phỏng 3 chiến lược...</span>
        </div>
      )}

      {/* Results Section */}
      {results && !isSimulating && (
        <div className="space-y-6">
          {/* Mortgage Results */}
          {results.type === 'MORTGAGE_RE' && (
            <MortgageResultsDisplay 
              results={results.results}
              templates={categoryTemplates}
              expandedResult={expandedResult}
              setExpandedResult={setExpandedResult}
              downloadCSV={downloadCSV}
            />
          )}

          {/* Refinance Results */}
          {results.type === 'REFINANCE' && (
            <RefinanceResultsDisplay 
              results={results.results}
              templates={categoryTemplates}
              expandedResult={expandedResult}
              setExpandedResult={setExpandedResult}
              downloadCSV={downloadCSV}
            />
          )}

          {/* Disclaimer */}
          <Card variant="bordered" className="bg-amber-50 border-amber-200 max-w-4xl mx-auto">
            <CardBody className="p-4">
              <div className="flex items-start">
                <Icons.Warning className="w-5 h-5 text-amber-600 mr-3 mt-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1 text-sm mt-3">Lưu Ý</h4>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Đây là mô phỏng dựa trên gói vay mẫu, không phải sản phẩm ngân hàng thực tế.</li>
                    <li>Sử dụng xấp xỉ theo tháng (annual_rate/12). Lãi suất và phí có thể thay đổi.</li>
                    <li>
                      <strong>Số liệu trên giao diện đã được làm tròn</strong> (2 chữ số thập phân cho tỷ, 1 cho triệu). 
                      Tải file CSV để xem chi tiết chính xác từng đồng.
                    </li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={onReset}>
              Mô Phỏng Mới
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && !isSimulating && hasSimulated && (
        <div className="text-center py-8">
          <p className="text-gray-500">Không có kết quả. Vui lòng kiểm tra lại thông tin.</p>
        </div>
      )}
    </div>
  );
}

// Strategy Info Tooltip Content Component
function StrategyTooltipContent({ 
  strategyInfo 
}: { 
  strategyInfo: { name: string; description: string; pros: string[]; cons: string[] } 
}) {
  return (
    <div className="space-y-2">
      <p className="text-white/95 leading-relaxed">{strategyInfo.description}</p>
      <div className="border-t border-white/10 pt-2">
        <p className="text-xs text-[#77FF45] font-medium mb-1">✓ Ưu điểm:</p>
        <ul className="space-y-0.5">
          {strategyInfo.pros.map((pro, i) => (
            <li key={i} className="text-xs text-white/80 leading-relaxed flex items-start">
              <span className="text-[#77FF45] mr-1.5 mt-0.5">•</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-white/10 pt-2">
        <p className="text-xs text-orange-400 font-medium mb-1">✗ Nhược điểm:</p>
        <ul className="space-y-0.5">
          {strategyInfo.cons.map((con, i) => (
            <li key={i} className="text-xs text-white/80 leading-relaxed flex items-start">
              <span className="text-orange-400 mr-1.5 mt-0.5">•</span>
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Strategy Info Tooltip Component using InfoTooltip
function StrategyInfoTooltip({ 
  strategyInfo 
}: { 
  strategyInfo: { name: string; description: string; pros: string[]; cons: string[] } 
}) {
  return (
    <InfoTooltip
      content={<StrategyTooltipContent strategyInfo={strategyInfo} />}
      ariaLabel={`Giải thích: ${strategyInfo.name}`}
      size="sm"
      side="right"
    />
  );
}

// Mortgage Strategy Config Component
function MortgageStrategyConfig({ 
  formData, 
  onChange 
}: { 
  formData: MortgagePurchaseForm;
  onChange: (updates: Partial<MortgagePurchaseForm>) => void;
}) {
  const extraPrincipal = formData.extra_principal_vnd || 0;
  
  return (
    <div className="space-y-3">
      {/* M1: Min Payment - No parameters, just info */}
      <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50 hover:shadow-sm transition-all duration-200 cursor-default group">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800 text-sm flex items-center gap-2">
            <span className="w-7 h-7 bg-[#343839] group-hover:bg-[#141718] text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">M1</span>
            <span className="group-hover:text-gray-900 transition-colors">{MORTGAGE_STRATEGY_LABELS.M1_MIN_PAYMENT.name}</span>
            <StrategyInfoTooltip strategyInfo={MORTGAGE_STRATEGY_LABELS.M1_MIN_PAYMENT} />
          </h4>
          <span className="text-xs text-gray-500 bg-gray-200 group-hover:bg-gray-300 px-2 py-0.5 rounded-full transition-colors">Tự động</span>
        </div>
        <p className="text-xs text-gray-500 group-hover:text-gray-600 mt-2 ml-9 transition-colors">
          Chỉ trả đúng kỳ hạn tối thiểu, giữ thanh khoản tối đa
        </p>
      </div>

      {/* M2: Extra Principal - Slider */}
      <div className="p-4 bg-[#F7FFF3] rounded-xl border-2 border-[#7CD734]/50 hover:border-[#7CD734] hover:bg-[#F7FFF3]/80 hover:shadow-sm transition-all duration-200 group">
        <h4 className="font-medium text-[#343839] mb-3 text-sm flex items-center gap-2">
          <span className="w-7 h-7 bg-[#4DC614] group-hover:bg-[#7CD734] text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">M2</span>
          <span className="group-hover:text-[#141718] transition-colors">{MORTGAGE_STRATEGY_LABELS.M2_EXTRA_PRINCIPAL.name}</span>
          <StrategyInfoTooltip strategyInfo={MORTGAGE_STRATEGY_LABELS.M2_EXTRA_PRINCIPAL} />
        </h4>
        <div className="space-y-3 ml-9">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#343839]">Trả thêm gốc mỗi tháng:</span>
            <span className="font-bold text-[#141718] text-lg bg-[#F7FFF3] px-3 py-1 rounded-lg border border-[#7CD734]/30">
              {formatShortVND(extraPrincipal)}/tháng
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10_000_000_000}
            step={1_000_000}
            value={extraPrincipal}
            onChange={(e) => onChange({ extra_principal_vnd: Number(e.target.value) })}
            className="w-full h-2 bg-[#E8ECEF] rounded-lg appearance-none cursor-pointer accent-[#4DC614]"
          />
          <div className="flex justify-between text-xs text-[#343839]">
            <span>0</span>
            <span>100tr</span>
            <span>500tr</span>
            <span>1 tỷ</span>
            <span>5 tỷ</span>
            <span>10 tỷ</span>
          </div>
          {/* Quick presets */}
          <div className="flex gap-1.5 flex-wrap">
            {[5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => onChange({ extra_principal_vnd: amount })}
                className={`px-2.5 py-1.5 text-xs rounded-lg transition-all duration-150 ${
                  extraPrincipal === amount
                    ? 'bg-[#4DC614] text-white font-medium shadow-sm'
                    : 'bg-white border border-[#7CD734]/50 text-[#343839] hover:border-[#7CD734] hover:bg-[#F7FFF3]'
                }`}
              >
                {formatShortVND(amount)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* M3: Exit Plan */}
      <div className="p-4 bg-[#F7FFF3]/50 rounded-xl border-2 border-[#7CD734]/30 hover:border-[#7CD734]/60 hover:bg-[#F7FFF3] hover:shadow-sm transition-all duration-200 group">
        <h4 className="font-medium text-[#343839] mb-3 text-sm flex items-center gap-2">
          <span className="w-7 h-7 bg-[#7CD734] group-hover:bg-[#4DC614] text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">M3</span>
          <span className="group-hover:text-[#141718] transition-colors">{MORTGAGE_STRATEGY_LABELS.M3_EXIT_PLAN.name}</span>
          <StrategyInfoTooltip strategyInfo={MORTGAGE_STRATEGY_LABELS.M3_EXIT_PLAN} />
        </h4>
        <div className="ml-9">
          <Select
            value={formData.exit_rule || 'PROMO_END'}
            onChange={(e) => {
              const nextExitRule = e.target.value as MortgagePurchaseForm['exit_rule'];
              const updates: Partial<MortgagePurchaseForm> = { exit_rule: nextExitRule };
              // Provide sensible defaults when switching into modes that require extra params,
              // while still allowing the user to clear the input afterwards.
              if (nextExitRule === 'FEE_THRESHOLD' && formData.exit_fee_threshold_pct == null) {
                updates.exit_fee_threshold_pct = 0;
              }
              if (nextExitRule === 'CUSTOM' && formData.exit_custom_month == null) {
                updates.exit_custom_month = 24;
              }
              onChange(updates);
            }}
            className="text-sm"
          >
            {Object.entries(EXIT_RULE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          
          {formData.exit_rule === 'FEE_THRESHOLD' && (
            <div className="mt-2">
              <label className="block text-xs text-[#343839] mb-1">Ngưỡng phí (%)</label>
              <Input
                type="number"
                min={0}
                max={5}
                step={0.5}
                value={formData.exit_fee_threshold_pct ?? ''}
                onChange={(e) =>
                  onChange({
                    exit_fee_threshold_pct: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                className="text-sm"
              />
            </div>
          )}
          
          {formData.exit_rule === 'CUSTOM' && (
            <div className="mt-2">
              <label className="block text-xs text-[#343839] mb-1">Tháng tất toán</label>
              <Input
                type="number"
                min={1}
                max={60}
                value={formData.exit_custom_month ?? ''}
                onChange={(e) =>
                  onChange({
                    exit_custom_month: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                className="text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Refinance Strategy Config Component
function RefinanceStrategyConfig({ 
  formData, 
  onChange 
}: { 
  formData: RefinanceForm;
  onChange: (updates: Partial<RefinanceForm>) => void;
}) {
  const extraPrincipal = formData.extra_principal_vnd || 0;
  
  return (
    <div className="space-y-3">
      {/* R1: Refinance Now - No parameters, just info */}
      <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50 hover:shadow-sm transition-all duration-200 cursor-default group">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800 text-sm flex items-center gap-2">
            <span className="w-7 h-7 bg-[#343839] group-hover:bg-[#141718] text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">R1</span>
            <span className="group-hover:text-gray-900 transition-colors">{REFINANCE_STRATEGY_LABELS.R1_REFI_NOW_LIQUIDITY.name}</span>
            <StrategyInfoTooltip strategyInfo={REFINANCE_STRATEGY_LABELS.R1_REFI_NOW_LIQUIDITY} />
          </h4>
          <span className="text-xs text-gray-500 bg-gray-200 group-hover:bg-gray-300 px-2 py-0.5 rounded-full transition-colors">Tự động</span>
        </div>
        <p className="text-xs text-gray-500 group-hover:text-gray-600 mt-2 ml-9 transition-colors">
          Chuyển vay ngay lập tức, chỉ trả số tiền tối thiểu hàng tháng
        </p>
      </div>

      {/* R2: Extra Principal - Slider */}
      <div className="p-4 bg-[#F7FFF3] rounded-xl border-2 border-[#7CD734]/50 hover:border-[#7CD734] hover:bg-[#F7FFF3]/80 hover:shadow-sm transition-all duration-200 group">
        <h4 className="font-medium text-[#343839] mb-3 text-sm flex items-center gap-2">
          <span className="w-7 h-7 bg-[#4DC614] group-hover:bg-[#7CD734] text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">R2</span>
          <span className="group-hover:text-[#141718] transition-colors">{REFINANCE_STRATEGY_LABELS.R2_REFI_NOW_ACCELERATE.name}</span>
          <StrategyInfoTooltip strategyInfo={REFINANCE_STRATEGY_LABELS.R2_REFI_NOW_ACCELERATE} />
        </h4>
        <div className="space-y-3 ml-9">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#343839]">Trả thêm gốc mỗi tháng:</span>
            <span className="font-bold text-[#141718] text-lg bg-[#F7FFF3] px-3 py-1 rounded-lg border border-[#7CD734]/30">
              {formatShortVND(extraPrincipal)}/tháng
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10_000_000_000}
            step={1_000_000}
            value={extraPrincipal}
            onChange={(e) => onChange({ extra_principal_vnd: Number(e.target.value) })}
            className="w-full h-2 bg-[#E8ECEF] rounded-lg appearance-none cursor-pointer accent-[#4DC614]"
          />
          <div className="flex justify-between text-xs text-[#343839]">
            <span>0</span>
            <span>100tr</span>
            <span>500tr</span>
            <span>1 tỷ</span>
            <span>5 tỷ</span>
            <span>10 tỷ</span>
          </div>
          {/* Quick presets */}
          <div className="flex gap-1.5 flex-wrap">
            {[5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => onChange({ extra_principal_vnd: amount })}
                className={`px-2.5 py-1.5 text-xs rounded-lg transition-all duration-150 ${
                  extraPrincipal === amount
                    ? 'bg-[#4DC614] text-white font-medium shadow-sm'
                    : 'bg-white border border-[#7CD734]/50 text-[#343839] hover:border-[#7CD734] hover:bg-[#F7FFF3]'
                }`}
              >
                {formatShortVND(amount)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* R3: Objective */}
      <div className="p-4 bg-[#F7FFF3]/50 rounded-xl border-2 border-[#7CD734]/30 hover:border-[#7CD734]/60 hover:bg-[#F7FFF3] hover:shadow-sm transition-all duration-200 group">
        <h4 className="font-medium text-[#343839] mb-3 text-sm flex items-center gap-2">
          <span className="w-7 h-7 bg-[#7CD734] group-hover:bg-[#4DC614] text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">R3</span>
          <span className="group-hover:text-[#141718] transition-colors">{REFINANCE_STRATEGY_LABELS.R3_OPTIMAL_TIMING.name}</span>
          <StrategyInfoTooltip strategyInfo={REFINANCE_STRATEGY_LABELS.R3_OPTIMAL_TIMING} />
        </h4>
        <div className="ml-9">
          <Select
            value={formData.objective || 'MAX_NET_SAVING'}
            onChange={(e) => onChange({ objective: e.target.value as RefinanceForm['objective'] })}
            className="text-sm"
          >
            {Object.entries(REFINANCE_OBJECTIVE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <p className="text-xs text-gray-500 group-hover:text-gray-600 mt-2 transition-colors">
            Hệ thống sẽ tự động tìm tháng chuyển ngân hàng tối ưu trong khoảng thời gian mô phỏng
          </p>
        </div>
      </div>
    </div>
  );
}

// Simulation Options Config Component
function SimulationOptionsConfig({ 
  formData, 
  onChange 
}: { 
  formData: SimulatorFormData;
  onChange: (updates: Partial<SimulatorFormData>) => void;
}) {
  return (
    <Card variant="bordered" className="bg-slate-50/50">
      <CardHeader className="pb-2">
        <h3 className="text-base font-semibold text-dark-darker flex items-center">
          <Icons.Settings className="w-5 h-5 mr-2 text-primary" />
          Tùy Chọn Mô Phỏng
        </h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Repayment Method */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              Phương Thức Trả Nợ
              <GlossaryIcon term="annuity" size="sm" />
            </label>
            <Select
              value={formData.repayment_method || 'annuity'}
              onChange={(e) => onChange({ repayment_method: e.target.value as 'annuity' | 'equal_principal' })}
              className="text-sm"
            >
              <option value="annuity">Gốc + lãi chia đều (Niên kim)</option>
              <option value="equal_principal">Gốc cố định, lãi giảm dần</option>
            </Select>
            <p className="text-[10px] text-gray-400 mt-1">
              {formData.repayment_method === 'equal_principal' 
                ? '💰 Tháng đầu cao nhất, giảm dần. Tổng lãi thấp hơn.'
                : '💰 Trả đều mỗi tháng, dễ lập ngân sách. Tổng lãi cao hơn.'}
            </p>
          </div>

          {/* Stress Test */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              Kịch Bản Lãi Suất
              <GlossaryIcon term="floating_rate" size="sm" />
            </label>
            <Select
              value={formData.stress_bump?.toString() || '2'}
              onChange={(e) => onChange({ stress_bump: parseInt(e.target.value) as 0 | 2 | 4 })}
              className="text-sm"
            >
              <option value="0">Cơ sở (+0%)</option>
              <option value="2">Tăng vừa (+2%)</option>
              <option value="4">Tăng mạnh (+4%)</option>
            </Select>
            <p className="text-[10px] text-gray-400 mt-1">
              Lãi suất sau kỳ ưu đãi sẽ tăng thêm {formData.stress_bump || 2}%
            </p>
          </div>

          {/* Include Insurance */}
          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.include_insurance || false}
                onChange={(e) => onChange({ include_insurance: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Bao gồm bảo hiểm</span>
            </label>
            <p className="text-[10px] text-gray-400 mt-0.5 ml-6">
              Tính phí bảo hiểm theo quy định gói vay
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Mortgage Results Display Component
function MortgageResultsDisplay({ 
  results,
  templates,
  expandedResult, 
  setExpandedResult,
  downloadCSV 
}: {
  results: MortgageMultiStrategyResult[];
  templates: ProductTemplate[];
  expandedResult: string | null;
  setExpandedResult: (key: string | null) => void;
  downloadCSV: (schedule: ScheduleRow[], filename: string) => void;
}) {
  // Find best overall
  let bestCost = Infinity;
  let bestKey = '';
  
  for (const templateResult of results) {
    for (const strategy of templateResult.strategies) {
      const cost = strategy.result.totals.total_cost_excl_principal;
      if (cost < bestCost) {
        bestCost = cost;
        bestKey = `${templateResult.template_id}-${strategy.strategy_id}`;
      }
    }
  }

  // Get selected cell data
  const getSelectedData = () => {
    if (!expandedResult) return null;
    const [templateId, strategyId] = expandedResult.split('::');
    const templateResult = results.find(r => r.template_id === templateId);
    if (!templateResult) return null;
    const strategyResult = templateResult.strategies.find(s => s.strategy_id === strategyId);
    if (!strategyResult) return null;
    const template = templates.find(t => t.id === templateId);
    return { templateResult, strategyResult, template };
  };

  const selectedData = getSelectedData();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-dark-darker">
          So Sánh 3 Chiến Lược × {results.length} Gói Vay
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Nhấp vào ô để xem chi tiết gói vay và lịch thanh toán
        </p>
      </div>

      {/* Strategy Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {(['M1_MIN_PAYMENT', 'M2_EXTRA_PRINCIPAL', 'M3_EXIT_PLAN'] as MortgageStrategyId[]).map((sid, idx) => (
          <div key={sid} className="flex items-center gap-2 text-sm">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
              idx === 0 ? 'bg-[#343839]' : idx === 1 ? 'bg-[#4DC614]' : 'bg-[#7CD734]'
            }`}>
              M{idx + 1}
            </span>
            <span className="text-gray-600">{MORTGAGE_STRATEGY_LABELS[sid]?.name}</span>
          </div>
        ))}
      </div>

      {/* Results Table - Clickable Cells with Product Highlights */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 min-w-[200px]">Gói Vay</th>
              <th className="px-2 py-3 text-center font-semibold text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 bg-[#343839] text-white rounded-full flex items-center justify-center text-xs">M1</span>
                  Chi Phí
                </span>
              </th>
              <th className="px-2 py-3 text-center font-semibold text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 bg-[#4DC614] text-white rounded-full flex items-center justify-center text-xs">M2</span>
                  Chi Phí
                </span>
              </th>
              <th className="px-2 py-3 text-center font-semibold text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 bg-[#7CD734] text-white rounded-full flex items-center justify-center text-xs">M3</span>
                  Chi Phí
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {results.map((templateResult) => {
              const template = templates.find(t => t.id === templateResult.template_id);
              const m1 = templateResult.strategies.find(s => s.strategy_id === 'M1_MIN_PAYMENT');
              const m2 = templateResult.strategies.find(s => s.strategy_id === 'M2_EXTRA_PRINCIPAL');
              const m3 = templateResult.strategies.find(s => s.strategy_id === 'M3_EXIT_PLAN');
              const floatingRate = template ? template.rates.floating_reference_assumption_pct + template.rates.floating_margin_pct : 0;
              
              return (
                <tr key={templateResult.template_id} className="hover:bg-gray-50">
                  {/* Product Highlight Column */}
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-dark-darker text-sm leading-tight">{templateResult.template_name}</span>
                      {template && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#F7FFF3] text-[#4DC614] rounded font-medium">
                            {template.rates.promo_fixed_rate_pct}% × {template.rates.promo_fixed_months}T
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                            → {floatingRate.toFixed(1)}%
                          </span>
                          {template.grace.grace_principal_months > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                              Ân hạn {template.grace.grace_principal_months}T
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    {m1 && (
                      <ClickableStrategyCell
                        result={m1.result}
                        isBest={`${templateResult.template_id}-M1_MIN_PAYMENT` === bestKey}
                        isSelected={expandedResult === `${templateResult.template_id}::M1_MIN_PAYMENT`}
                        color="gray"
                        onClick={() => setExpandedResult(
                          expandedResult === `${templateResult.template_id}::M1_MIN_PAYMENT` 
                            ? null 
                            : `${templateResult.template_id}::M1_MIN_PAYMENT`
                        )}
                      />
                    )}
                  </td>
                  <td className="px-1 py-1">
                    {m2 && (
                      <ClickableStrategyCell
                        result={m2.result}
                        isBest={`${templateResult.template_id}-M2_EXTRA_PRINCIPAL` === bestKey}
                        isSelected={expandedResult === `${templateResult.template_id}::M2_EXTRA_PRINCIPAL`}
                        color="blue"
                        onClick={() => setExpandedResult(
                          expandedResult === `${templateResult.template_id}::M2_EXTRA_PRINCIPAL` 
                            ? null 
                            : `${templateResult.template_id}::M2_EXTRA_PRINCIPAL`
                        )}
                      />
                    )}
                  </td>
                  <td className="px-1 py-1">
                    {m3 && (
                      <ClickableStrategyCell
                        result={m3.result}
                        isBest={`${templateResult.template_id}-M3_EXIT_PLAN` === bestKey}
                        isSelected={expandedResult === `${templateResult.template_id}::M3_EXIT_PLAN`}
                        color="purple"
                        onClick={() => setExpandedResult(
                          expandedResult === `${templateResult.template_id}::M3_EXIT_PLAN` 
                            ? null 
                            : `${templateResult.template_id}::M3_EXIT_PLAN`
                        )}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Detail View */}
      {selectedData && (
        <SelectedCellDetail
          templateName={selectedData.templateResult.template_name}
          strategyId={selectedData.strategyResult.strategy_id}
          strategyLabel={selectedData.strategyResult.strategy_label}
          template={selectedData.template}
          result={selectedData.strategyResult.result}
          onClose={() => setExpandedResult(null)}
          onDownloadCSV={() => downloadCSV(
            selectedData.strategyResult.result.schedule,
            `${selectedData.templateResult.template_name}_${selectedData.strategyResult.strategy_id}.csv`
          )}
        />
      )}
    </div>
  );
}

// Refinance Results Display Component
function RefinanceResultsDisplay({ 
  results,
  templates,
  expandedResult, 
  setExpandedResult,
  downloadCSV 
}: {
  results: RefinanceMultiStrategyResult[];
  templates: ProductTemplate[];
  expandedResult: string | null;
  setExpandedResult: (key: string | null) => void;
  downloadCSV: (schedule: ScheduleRow[], filename: string) => void;
}) {
  // Find best overall
  let bestSaving = -Infinity;
  let bestKey = '';
  
  for (const templateResult of results) {
    for (const strategy of templateResult.strategies) {
      const saving = strategy.result.net_saving_vnd;
      if (saving > bestSaving) {
        bestSaving = saving;
        bestKey = `${templateResult.template_id}-${strategy.strategy_id}`;
      }
    }
  }

  // Get selected cell data
  const getSelectedData = () => {
    if (!expandedResult) return null;
    const [templateId, strategyId] = expandedResult.split('::');
    const templateResult = results.find(r => r.template_id === templateId);
    if (!templateResult) return null;
    const strategyResult = templateResult.strategies.find(s => s.strategy_id === strategyId);
    if (!strategyResult) return null;
    const template = templates.find(t => t.id === templateId);
    return { templateResult, strategyResult, template };
  };

  const selectedData = getSelectedData();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-dark-darker">
          So Sánh 3 Chiến Lược Chuyển Ngân Hàng × {results.length} Gói Vay
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Nhấp vào ô để xem chi tiết gói vay và lịch thanh toán
        </p>
      </div>

      {/* Strategy Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {(['R1_REFI_NOW_LIQUIDITY', 'R2_REFI_NOW_ACCELERATE', 'R3_OPTIMAL_TIMING'] as RefinanceStrategyId[]).map((sid, idx) => (
          <div key={sid} className="flex items-center gap-2 text-sm">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
              idx === 0 ? 'bg-[#343839]' : idx === 1 ? 'bg-[#4DC614]' : 'bg-[#7CD734]'
            }`}>
              R{idx + 1}
            </span>
            <span className="text-gray-600">{REFINANCE_STRATEGY_LABELS[sid]?.name}</span>
          </div>
        ))}
      </div>

      {/* Results Table - Clickable Cells with Product Highlights */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 min-w-[200px]">Gói chuyển ngân hàng</th>
              <th className="px-2 py-3 text-center font-semibold text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 bg-[#343839] text-white rounded-full flex items-center justify-center text-xs">R1</span>
                  Tiết Kiệm
                </span>
              </th>
              <th className="px-2 py-3 text-center font-semibold text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 bg-[#4DC614] text-white rounded-full flex items-center justify-center text-xs">R2</span>
                  Tiết Kiệm
                </span>
              </th>
              <th className="px-2 py-3 text-center font-semibold text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 bg-[#7CD734] text-white rounded-full flex items-center justify-center text-xs">R3</span>
                  Tiết Kiệm
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {results.map((templateResult) => {
              const template = templates.find(t => t.id === templateResult.template_id);
              const r1 = templateResult.strategies.find(s => s.strategy_id === 'R1_REFI_NOW_LIQUIDITY');
              const r2 = templateResult.strategies.find(s => s.strategy_id === 'R2_REFI_NOW_ACCELERATE');
              const r3 = templateResult.strategies.find(s => s.strategy_id === 'R3_OPTIMAL_TIMING');
              const floatingRate = template ? template.rates.floating_reference_assumption_pct + template.rates.floating_margin_pct : 0;
              
              return (
                <tr key={templateResult.template_id} className="hover:bg-gray-50">
                  {/* Product Highlight Column */}
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-dark-darker text-sm leading-tight">{templateResult.template_name}</span>
                      {template && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#F7FFF3] text-[#4DC614] rounded font-medium">
                            {template.rates.promo_fixed_rate_pct}% × {template.rates.promo_fixed_months}T
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                            → {floatingRate.toFixed(1)}%
                          </span>
                          {template.fees.refinance_processing_fee_pct !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                              Phí {template.fees.refinance_processing_fee_pct}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    {r1 && (
                      <ClickableRefinanceCell
                        result={r1.result}
                        isBest={`${templateResult.template_id}-R1_REFI_NOW_LIQUIDITY` === bestKey}
                        isSelected={expandedResult === `${templateResult.template_id}::R1_REFI_NOW_LIQUIDITY`}
                        onClick={() => setExpandedResult(
                          expandedResult === `${templateResult.template_id}::R1_REFI_NOW_LIQUIDITY`
                            ? null
                            : `${templateResult.template_id}::R1_REFI_NOW_LIQUIDITY`
                        )}
                      />
                    )}
                  </td>
                  <td className="px-1 py-1">
                    {r2 && (
                      <ClickableRefinanceCell
                        result={r2.result}
                        isBest={`${templateResult.template_id}-R2_REFI_NOW_ACCELERATE` === bestKey}
                        isSelected={expandedResult === `${templateResult.template_id}::R2_REFI_NOW_ACCELERATE`}
                        onClick={() => setExpandedResult(
                          expandedResult === `${templateResult.template_id}::R2_REFI_NOW_ACCELERATE`
                            ? null
                            : `${templateResult.template_id}::R2_REFI_NOW_ACCELERATE`
                        )}
                      />
                    )}
                  </td>
                  <td className="px-1 py-1">
                    {r3 && (
                      <ClickableRefinanceCell
                        result={r3.result}
                        isBest={`${templateResult.template_id}-R3_OPTIMAL_TIMING` === bestKey}
                        isSelected={expandedResult === `${templateResult.template_id}::R3_OPTIMAL_TIMING`}
                        optimalMonth={r3.optimal_refi_month}
                        onClick={() => setExpandedResult(
                          expandedResult === `${templateResult.template_id}::R3_OPTIMAL_TIMING`
                            ? null
                            : `${templateResult.template_id}::R3_OPTIMAL_TIMING`
                        )}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Detail View */}
      {selectedData && (
        <SelectedRefinanceCellDetail
          templateName={selectedData.templateResult.template_name}
          strategyId={selectedData.strategyResult.strategy_id}
          strategyLabel={selectedData.strategyResult.strategy_label}
          template={selectedData.template}
          result={selectedData.strategyResult.result}
          onClose={() => setExpandedResult(null)}
          onDownloadCSV={() => downloadCSV(
            selectedData.strategyResult.result.refinance.schedule,
            `${selectedData.templateResult.template_name}_${selectedData.strategyResult.strategy_id}.csv`
          )}
        />
      )}
    </div>
  );
}

// Clickable Strategy Cell for Mortgage - Interactive version
function ClickableStrategyCell({ 
  result, 
  isBest,
  isSelected,
  color,
  onClick,
}: { 
  result: MortgagePurchaseResult; 
  isBest: boolean;
  isSelected: boolean;
  color: 'gray' | 'blue' | 'purple';
  onClick: () => void;
}) {
  const colorStyles = {
    gray: {
      bg: isSelected ? 'bg-[#E8ECEF] ring-2 ring-[#343839]' : 'bg-gray-50 hover:bg-gray-100',
      text: isBest ? 'text-[#4DC614]' : 'text-gray-700',
    },
    blue: {
      bg: isSelected ? 'bg-[#F7FFF3] ring-2 ring-[#4DC614]' : 'bg-[#F7FFF3]/50 hover:bg-[#F7FFF3]',
      text: isBest ? 'text-[#4DC614]' : 'text-[#343839]',
    },
    purple: {
      bg: isSelected ? 'bg-[#F7FFF3] ring-2 ring-[#7CD734]' : 'bg-[#F7FFF3]/30 hover:bg-[#F7FFF3]/60',
      text: isBest ? 'text-[#4DC614]' : 'text-[#343839]',
    },
  };

  const styles = colorStyles[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-2 rounded-lg transition-all cursor-pointer ${styles.bg} ${isSelected ? 'shadow-md' : 'hover:shadow-sm'}`}
    >
      <div className={`font-semibold ${styles.text}`}>
        {formatShortVND(result.totals.total_cost_excl_principal)}
      </div>
      {result.metrics.payoff_month && (
        <div className="text-[10px] text-gray-500">Tất toán T{result.metrics.payoff_month}</div>
      )}
      {isBest && <div className="text-[10px] text-[#4DC614] font-medium">✓ Tốt nhất</div>}
      {isSelected && (
        <div className="text-[10px] text-gray-400 mt-1">▼ Đang xem</div>
      )}
    </button>
  );
}

// Clickable Strategy Cell for Refinance - Interactive version
function ClickableRefinanceCell({ 
  result, 
  isBest,
  isSelected,
  optimalMonth,
  onClick,
}: { 
  result: RefinanceResult; 
  isBest: boolean;
  isSelected: boolean;
  optimalMonth?: number;
  onClick: () => void;
}) {
  const isPositive = result.net_saving_vnd > 0;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-2 rounded-lg transition-all cursor-pointer ${
        isSelected 
          ? (isPositive ? 'bg-[#F7FFF3] ring-2 ring-[#4DC614] shadow-md' : 'bg-amber-100 ring-2 ring-amber-500 shadow-md')
          : (isPositive ? 'bg-[#F7FFF3]/50 hover:bg-[#F7FFF3] hover:shadow-sm' : 'bg-amber-50 hover:bg-amber-100 hover:shadow-sm')
      }`}
    >
      <div className={`font-semibold ${
        isBest ? 'text-[#4DC614]' : isPositive ? 'text-[#4DC614]' : 'text-amber-600'
      }`}>
        {isPositive ? '+' : ''}{formatShortVND(result.net_saving_vnd)}
      </div>
      {result.break_even_month && (
        <div className="text-[10px] text-gray-500">Hoà vốn T{result.break_even_month}</div>
      )}
      {optimalMonth !== undefined && optimalMonth > 0 && (
        <div className="text-[10px] text-[#4DC614]">Chuyển NH tháng {optimalMonth}</div>
      )}
      {isBest && <div className="text-[10px] text-[#4DC614] font-medium">✓ Tốt nhất</div>}
      {isSelected && (
        <div className="text-[10px] text-gray-400 mt-1">▼ Đang xem</div>
      )}
    </button>
  );
}

// Selected Cell Detail Component for Mortgage
function SelectedCellDetail({ 
  templateName,
  strategyId,
  strategyLabel,
  template,
  result,
  onClose,
  onDownloadCSV,
}: {
  templateName: string;
  strategyId: MortgageStrategyId;
  strategyLabel: string;
  template?: ProductTemplate;
  result: MortgagePurchaseResult;
  onClose: () => void;
  onDownloadCSV: () => void;
}) {
  // Calculate floating rate from components
  const referenceRate = template?.rates.floating_reference_assumption_pct || 0;
  const marginRate = template?.rates.floating_margin_pct || 0;
  const stressBump = result.input.stress?.floating_rate_bump_pct || 0;
  const floatingRate = referenceRate + marginRate + stressBump;
  
  // Strategy color mapping
  const strategyColorClass = {
    M1_MIN_PAYMENT: 'text-[#343839]',
    M2_EXTRA_PRINCIPAL: 'text-[#4DC614]',
    M3_EXIT_PLAN: 'text-[#7CD734]',
  }[strategyId] || 'text-primary';
  
  return (
    <Card variant="bordered" className="bg-gradient-to-br from-[#F7FFF3] to-white border-[#7CD734]/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <h4 className="font-bold text-dark-darker text-lg">Gói vay: {templateName}</h4>
            <p className={`text-sm font-medium ${strategyColorClass}`}>Chiến lược trả nợ: {strategyLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onDownloadCSV}>
              <Icons.Download className="w-4 h-4 mr-1" />
              Tải CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <Icons.X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Product Details Section */}
        {template && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Icons.DocumentText className="w-4 h-4 mr-2 text-primary" />
              Chi Tiết Gói Vay
            </h5>
            
            {/* Interest Rates Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Lãi suất ưu đãi</span>
                <span className="font-semibold text-[#4DC614]">{template.rates.promo_fixed_rate_pct}% × {template.rates.promo_fixed_months}T</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Sau ưu đãi (thả nổi)</span>
                <span className="font-semibold text-orange-700">{floatingRate.toFixed(1)}%</span>
              </div>
              {template.grace.grace_principal_months > 0 && (
                <div>
                  <span className="text-gray-500 block text-xs">Ân hạn gốc</span>
                  <span className="font-semibold text-purple-700">{template.grace.grace_principal_months} tháng</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 block text-xs">Tỷ lệ vay tối đa</span>
                <span className="font-semibold">{template.loan_limits.max_ltv_pct}%</span>
              </div>
            </div>

            {/* Floating Rate Formula */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-xs whitespace-nowrap">Công thức lãi suất sau ưu đãi:</span>
                <div className="text-xs">
                  <div className="inline-flex items-center gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded font-medium">
                      Lãi tham chiếu: {referenceRate}%
                    </span>
                    <span className="text-gray-400">+</span>
                    <span className="px-1.5 py-0.5 bg-[#F7FFF3] text-[#4DC614] rounded font-medium">
                      Biên độ: {marginRate}%
                    </span>
                    {stressBump > 0 && (
                      <>
                        <span className="text-gray-400">+</span>
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                          Kịch bản lãi tăng: +{stressBump}%
                        </span>
                      </>
                    )}
                    <span className="text-gray-400">=</span>
                    <span className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded font-bold">
                      {floatingRate.toFixed(1)}%/năm
                    </span>
                  </div>
                  {template.assumptions?.reference_rate_note && (
                    <p className="text-[10px] text-gray-400 mt-1 italic">
                      * {template.assumptions.reference_rate_note}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Insurance Section */}
            {template.fees.insurance && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-xs whitespace-nowrap flex items-center gap-1">
                    <Icons.Shield className="w-3.5 h-3.5 text-purple-500" />
                    Bảo hiểm:
                  </span>
                  <div className="text-xs flex flex-wrap gap-2">
                    {template.fees.insurance.annual_pct !== undefined && template.fees.insurance.annual_pct > 0 ? (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {template.fees.insurance.annual_pct}%/năm {template.fees.insurance.basis === 'on_balance' ? 'trên dư nợ' : 'trên giá trị BĐS'}
                      </span>
                    ) : template.fees.insurance.annual_vnd !== undefined && template.fees.insurance.annual_vnd > 0 ? (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {formatShortVND(template.fees.insurance.annual_vnd)}/năm
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Không áp dụng</span>
                    )}
                    {template.fees.insurance.mandatory && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px]">Bắt buộc</span>
                    )}
                    {!template.fees.insurance.mandatory && template.fees.insurance.enabled_default && (
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px]">Tùy chọn (mặc định có)</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other Fees Section */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-xs whitespace-nowrap flex items-center gap-1">
                  <Icons.Money className="w-3.5 h-3.5 text-orange-500" />
                  Các loại phí:
                </span>
                <div className="text-xs flex flex-wrap gap-1.5">
                  {template.fees.origination_fee_pct !== undefined && template.fees.origination_fee_pct > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                      Phí giải ngân: {template.fees.origination_fee_pct}%
                    </span>
                  )}
                  {template.fees.origination_fee_vnd !== undefined && template.fees.origination_fee_vnd > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                      Phí giải ngân: {formatShortVND(template.fees.origination_fee_vnd)}
                    </span>
                  )}
                  {template.fees.appraisal_fee_vnd !== undefined && template.fees.appraisal_fee_vnd > 0 && (
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                      Phí thẩm định: {formatShortVND(template.fees.appraisal_fee_vnd)}
                    </span>
                  )}
                  {template.fees.recurring_monthly_fee_vnd !== undefined && template.fees.recurring_monthly_fee_vnd > 0 && (
                    <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                      Phí quản lý: {formatShortVND(template.fees.recurring_monthly_fee_vnd)}/tháng
                    </span>
                  )}
                  {/* Show if no fees */}
                  {(!template.fees.origination_fee_pct || template.fees.origination_fee_pct === 0) &&
                   (!template.fees.origination_fee_vnd || template.fees.origination_fee_vnd === 0) &&
                   (!template.fees.appraisal_fee_vnd || template.fees.appraisal_fee_vnd === 0) &&
                   (!template.fees.recurring_monthly_fee_vnd || template.fees.recurring_monthly_fee_vnd === 0) && (
                    <span className="px-1.5 py-0.5 bg-[#F7FFF3] text-[#4DC614] rounded">
                      Miễn phí giải ngân & thẩm định
                    </span>
                  )}
                </div>
              </div>
              {template.assumptions?.fee_notes && (
                <p className="text-[10px] text-gray-400 mt-1 ml-5 italic">
                  * {template.assumptions.fee_notes}
                </p>
              )}
            </div>

            {/* Prepayment Penalty */}
            {template.prepayment_penalty.schedule.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-500 text-xs">Phí tất toán sớm: </span>
                <span className="text-xs text-gray-700">
                  {template.prepayment_penalty.schedule.slice(0, 3).map((tier, idx) => (
                    <span key={idx}>
                      {idx > 0 && ' → '}
                      Năm {Math.floor(tier.from_month_inclusive / 12) + 1}: {tier.fee_pct}%
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        )}
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-[#F7FFF3] rounded-lg">
            <div className="text-xs text-[#343839] mb-1">Tổng Chi Phí</div>
            <div className="font-bold text-[#141718]">{formatShortVND(result.totals.total_cost_excl_principal)}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-xs text-red-600 mb-1">Tổng Lãi</div>
            <div className="font-bold text-red-800">{formatShortVND(result.totals.total_interest)}</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-xs text-orange-600 mb-1">Tổng Phí</div>
            <div className="font-bold text-orange-800">{formatShortVND(result.totals.total_fees)}</div>
          </div>
          <div className="p-3 bg-[#E8ECEF] rounded-lg">
            <div className="text-xs text-[#343839] mb-1">TT/Tháng Cao Nhất</div>
            <div className="font-bold text-[#141718]">{formatShortVND(result.metrics.max_monthly_payment)}</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="flex flex-wrap gap-4 text-sm">
          {result.metrics.payoff_month && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Tất toán:</span>
              <span className="font-medium">Tháng {result.metrics.payoff_month}</span>
            </div>
          )}
          {result.metrics.apr_pct !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">APR:</span>
              <span className="font-medium">{formatPercent(result.metrics.apr_pct, 2)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Tiền mặt cần:</span>
            <span className="font-medium">{formatShortVND(result.closing_cash_needed_vnd)}</span>
          </div>
        </div>

        {/* Monthly Schedule Table */}
        <MonthlyScheduleTable 
          schedule={result.schedule} 
          title={`Lịch Thanh Toán Chi Tiết`}
        />
      </CardBody>
    </Card>
  );
}

// Selected Cell Detail Component for Refinance
function SelectedRefinanceCellDetail({ 
  templateName,
  strategyId,
  strategyLabel,
  template,
  result,
  onClose,
  onDownloadCSV,
}: {
  templateName: string;
  strategyId: RefinanceStrategyId;
  strategyLabel: string;
  template?: ProductTemplate;
  result: RefinanceResult;
  onClose: () => void;
  onDownloadCSV: () => void;
}) {
  const isPositive = result.net_saving_vnd > 0;
  // Calculate floating rate from components
  const referenceRate = template?.rates.floating_reference_assumption_pct || 0;
  const marginRate = template?.rates.floating_margin_pct || 0;
  const stressBump = result.input.stress?.floating_rate_bump_pct || 0;
  const floatingRate = referenceRate + marginRate + stressBump;
  
  // Strategy color mapping for Refinance
  const strategyColorClass = {
    R1_REFI_NOW_LIQUIDITY: 'text-[#343839]',
    R2_REFI_NOW_ACCELERATE: 'text-[#4DC614]',
    R3_OPTIMAL_TIMING: 'text-[#7CD734]',
  }[strategyId] || 'text-primary';
  
  return (
    <Card variant="bordered" className={`${
      isPositive 
        ? 'bg-gradient-to-br from-[#F7FFF3] to-white border-[#7CD734]/50' 
        : 'bg-gradient-to-br from-amber-50 to-white border-amber-300'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <h4 className="font-bold text-dark-darker text-lg">Gói vay: {templateName}</h4>
            <p className={`text-sm font-medium ${strategyColorClass}`}>Chiến lược trả nợ: {strategyLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onDownloadCSV}>
              <Icons.Download className="w-4 h-4 mr-1" />
              Tải CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <Icons.X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Product Details Section */}
        {template && (
          <div className="p-4 bg-white/50 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Icons.DocumentText className="w-4 h-4 mr-2 text-primary" />
              Chi Tiết Gói Chuyển Ngân Hàng
            </h5>
            
            {/* Interest Rates Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Lãi suất ưu đãi</span>
                <span className="font-semibold text-[#4DC614]">{template.rates.promo_fixed_rate_pct}% × {template.rates.promo_fixed_months}T</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Sau ưu đãi (thả nổi)</span>
                <span className="font-semibold text-orange-700">{floatingRate.toFixed(1)}%</span>
              </div>
              {template.fees.refinance_processing_fee_pct !== undefined && (
                <div>
                <span className="text-gray-500 block text-xs">Phí xử lý chuyển ngân hàng</span>
                  <span className="font-semibold text-teal-700">{template.fees.refinance_processing_fee_pct}%</span>
                </div>
              )}
              {template.grace.grace_principal_months > 0 && (
                <div>
                  <span className="text-gray-500 block text-xs">Ân hạn gốc</span>
                  <span className="font-semibold text-purple-700">{template.grace.grace_principal_months} tháng</span>
                </div>
              )}
            </div>

            {/* Floating Rate Formula */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-xs whitespace-nowrap">Công thức lãi suất sau ưu đãi:</span>
                <div className="text-xs">
                  <div className="inline-flex items-center gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded font-medium">
                      Lãi tham chiếu: {referenceRate}%
                    </span>
                    <span className="text-gray-400">+</span>
                    <span className="px-1.5 py-0.5 bg-[#F7FFF3] text-[#4DC614] rounded font-medium">
                      Biên độ: {marginRate}%
                    </span>
                    {stressBump > 0 && (
                      <>
                        <span className="text-gray-400">+</span>
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                          Kịch bản lãi tăng: +{stressBump}%
                        </span>
                      </>
                    )}
                    <span className="text-gray-400">=</span>
                    <span className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded font-bold">
                      {floatingRate.toFixed(1)}%/năm
                    </span>
                  </div>
                  {template.assumptions?.reference_rate_note && (
                    <p className="text-[10px] text-gray-400 mt-1 italic">
                      * {template.assumptions.reference_rate_note}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Insurance Section */}
            {template.fees.insurance && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-xs whitespace-nowrap flex items-center gap-1">
                    <Icons.Shield className="w-3.5 h-3.5 text-purple-500" />
                    Bảo hiểm:
                  </span>
                  <div className="text-xs flex flex-wrap gap-2">
                    {template.fees.insurance.annual_pct !== undefined && template.fees.insurance.annual_pct > 0 ? (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {template.fees.insurance.annual_pct}%/năm {template.fees.insurance.basis === 'on_balance' ? 'trên dư nợ' : 'trên giá trị BĐS'}
                      </span>
                    ) : template.fees.insurance.annual_vnd !== undefined && template.fees.insurance.annual_vnd > 0 ? (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {formatShortVND(template.fees.insurance.annual_vnd)}/năm
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Không áp dụng</span>
                    )}
                    {template.fees.insurance.mandatory && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px]">Bắt buộc</span>
                    )}
                    {!template.fees.insurance.mandatory && template.fees.insurance.enabled_default && (
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px]">Tùy chọn (mặc định có)</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other Fees Section */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-xs whitespace-nowrap flex items-center gap-1">
                  <Icons.Money className="w-3.5 h-3.5 text-orange-500" />
                  Các loại phí:
                </span>
                <div className="text-xs flex flex-wrap gap-1.5">
                  {template.fees.refinance_processing_fee_pct !== undefined && template.fees.refinance_processing_fee_pct > 0 && (
                    <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                      Phí xử lý: {template.fees.refinance_processing_fee_pct}%
                    </span>
                  )}
                  {template.fees.refinance_processing_fee_vnd !== undefined && template.fees.refinance_processing_fee_vnd > 0 && (
                    <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                      Phí xử lý: {formatShortVND(template.fees.refinance_processing_fee_vnd)}
                    </span>
                  )}
                  {template.fees.origination_fee_pct !== undefined && template.fees.origination_fee_pct > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                      Phí giải ngân: {template.fees.origination_fee_pct}%
                    </span>
                  )}
                  {template.fees.origination_fee_vnd !== undefined && template.fees.origination_fee_vnd > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                      Phí giải ngân: {formatShortVND(template.fees.origination_fee_vnd)}
                    </span>
                  )}
                  {template.fees.appraisal_fee_vnd !== undefined && template.fees.appraisal_fee_vnd > 0 && (
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                      Phí thẩm định: {formatShortVND(template.fees.appraisal_fee_vnd)}
                    </span>
                  )}
                  {template.fees.recurring_monthly_fee_vnd !== undefined && template.fees.recurring_monthly_fee_vnd > 0 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                      Phí quản lý: {formatShortVND(template.fees.recurring_monthly_fee_vnd)}/tháng
                    </span>
                  )}
                  {/* Show if no fees */}
                  {(!template.fees.refinance_processing_fee_pct || template.fees.refinance_processing_fee_pct === 0) &&
                   (!template.fees.refinance_processing_fee_vnd || template.fees.refinance_processing_fee_vnd === 0) &&
                   (!template.fees.origination_fee_pct || template.fees.origination_fee_pct === 0) &&
                   (!template.fees.origination_fee_vnd || template.fees.origination_fee_vnd === 0) &&
                   (!template.fees.appraisal_fee_vnd || template.fees.appraisal_fee_vnd === 0) &&
                   (!template.fees.recurring_monthly_fee_vnd || template.fees.recurring_monthly_fee_vnd === 0) && (
                    <span className="px-1.5 py-0.5 bg-[#F7FFF3] text-[#4DC614] rounded">
                      Miễn các loại phí
                    </span>
                  )}
                </div>
              </div>
              {template.assumptions?.fee_notes && (
                <p className="text-[10px] text-gray-400 mt-1 ml-5 italic">
                  * {template.assumptions.fee_notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Saving Banner */}
        <div className={`p-4 rounded-lg ${isPositive ? 'bg-[#F7FFF3]' : 'bg-amber-100'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isPositive ? 'text-[#343839]' : 'text-amber-700'}`}>
              {isPositive ? 'Bạn tiết kiệm được:' : 'Chi phí thêm:'}
            </span>
            <span className={`text-2xl font-bold ${isPositive ? 'text-[#4DC614]' : 'text-amber-700'}`}>
              {isPositive ? '+' : ''}{formatShortVND(result.net_saving_vnd)}
            </span>
          </div>
          {result.break_even_month && (
            <div className={`text-sm mt-1 ${isPositive ? 'text-[#4DC614]' : 'text-amber-600'}`}>
              Hoà vốn sau tháng {result.break_even_month}
            </div>
          )}
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="text-xs text-gray-600 mb-1">Chi phí khoản vay cũ</div>
            <div className="font-bold text-gray-800">{formatShortVND(result.baseline.totals.total_cost_excl_principal)}</div>
          </div>
          <div className="p-3 bg-[#F7FFF3] rounded-lg border border-[#7CD734]/50">
            <div className="text-xs text-[#343839] mb-1">Chi phí khoản vay mới</div>
            <div className="font-bold text-[#141718]">{formatShortVND(result.refinance.totals.total_cost_excl_principal)}</div>
          </div>
        </div>

        {/* Switching Costs */}
        <div className="p-3 bg-orange-50 rounded border border-orange-200 text-sm">
          <span className="font-medium text-orange-800">Chi phí chuyển đổi: </span>
          <span className="text-orange-700">{formatShortVND(result.breakdown.switching_costs_total)}</span>
          <span className="text-gray-500 ml-2">
            (Phí tất toán sớm: {formatShortVND(result.breakdown.old_prepayment_fee)})
          </span>
        </div>

        {/* Monthly Schedule Table for new loan */}
        <MonthlyScheduleTable 
          schedule={result.refinance.schedule} 
          title={`Lịch Thanh Toán Khoản Vay Mới`}
        />
      </CardBody>
    </Card>
  );
}

// Monthly Schedule Table Component - Full detailed view
function MonthlyScheduleTable({ 
  schedule, 
  title 
}: { 
  schedule: ScheduleRow[];
  title: string;
}) {
  const [displayCount, setDisplayCount] = useState(12);
  const [showAllColumns, setShowAllColumns] = useState(false);
  
  // Calculate summary totals
  const totals = useMemo(() => {
    return schedule.reduce((acc, row) => ({
      interest: acc.interest + row.interest,
      principal: acc.principal + row.principal_scheduled + row.extra_principal,
      fees: acc.fees + row.fees,
      insurance: acc.insurance + row.insurance,
      total: acc.total + row.payment_total,
    }), { interest: 0, principal: 0, fees: 0, insurance: 0, total: 0 });
  }, [schedule]);

  const displayedRows = schedule.slice(0, displayCount);
  const hasMore = schedule.length > displayCount;
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Calendar className="w-5 h-5 text-slate-600" />
          <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
          <span className="text-xs text-slate-500">({schedule.length} tháng)</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showAllColumns}
              onChange={(e) => setShowAllColumns(e.target.checked)}
              className="w-3 h-3"
            />
            Chi tiết
          </label>
        </div>
      </div>
      
      {/* Summary Row */}
      <div className="bg-[#F7FFF3] px-4 py-2 grid grid-cols-5 gap-4 text-xs border-b border-[#7CD734]/30">
        <div>
          <span className="text-[#343839]">Tổng Lãi:</span>
          <span className="ml-1 font-semibold text-[#141718]">{formatShortVND(totals.interest)}</span>
        </div>
        <div>
          <span className="text-[#343839]">Tổng Gốc:</span>
          <span className="ml-1 font-semibold text-[#141718]">{formatShortVND(totals.principal)}</span>
        </div>
        <div>
          <span className="text-[#343839]">Tổng Phí:</span>
          <span className="ml-1 font-semibold text-[#141718]">{formatShortVND(totals.fees)}</span>
        </div>
        <div>
          <span className="text-[#343839]">Tổng BH:</span>
          <span className="ml-1 font-semibold text-[#141718]">{formatShortVND(totals.insurance)}</span>
        </div>
        <div>
          <span className="text-[#343839]">Tổng TT:</span>
          <span className="ml-1 font-bold text-[#141718]">{formatShortVND(totals.total)}</span>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">Tháng</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">Ngày</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap">Lãi Suất</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap">Dư Nợ Đầu</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap">Lãi</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap">Gốc Kỳ Hạn</th>
              {showAllColumns && (
                <>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap">Gốc Thêm</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap">Phí</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap">Bảo Hiểm</th>
                </>
              )}
              <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap bg-slate-100">Tổng TT</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap">Dư Nợ Cuối</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedRows.map((row, idx) => {
              // Determine row styling based on events
              const isPromoEnd = idx > 0 && displayedRows[idx - 1].rate_annual_pct !== row.rate_annual_pct;
              const isPayoff = row.is_payoff_month;
              const hasExtraPrincipal = row.extra_principal > 0;
              
              let rowClass = '';
              if (isPayoff) {
                rowClass = 'bg-[#F7FFF3] border-l-4 border-l-[#4DC614]';
              } else if (isPromoEnd) {
                rowClass = 'bg-amber-50 border-l-4 border-l-amber-400';
              } else if (hasExtraPrincipal) {
                rowClass = 'bg-[#F7FFF3]/50';
              } else if (idx % 2 === 1) {
                rowClass = 'bg-gray-50/50';
              }
              
              return (
                <tr key={row.month} className={rowClass}>
                  <td className="px-3 py-2 text-gray-800 font-medium">
                    <div className="flex items-center gap-1">
                      {row.month}
                      {isPayoff && (
                        <span className="text-[10px] bg-[#4DC614] text-white px-1.5 py-0.5 rounded-full">Tất toán</span>
                      )}
                      {isPromoEnd && !isPayoff && (
                        <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">Hết ưu đãi</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-[11px]">{row.date}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-medium ${isPromoEnd ? 'text-amber-600' : 'text-gray-700'}`}>
                      {formatPercent(row.rate_annual_pct, 2)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">{formatShortVND(row.balance_start)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{formatShortVND(row.interest)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatShortVND(row.principal_scheduled)}</td>
                  {showAllColumns && (
                    <>
                      <td className="px-3 py-2 text-right text-[#4DC614]">
                        {row.extra_principal > 0 ? formatShortVND(row.extra_principal) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-600">
                        {row.fees > 0 ? formatShortVND(row.fees) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-600">
                        {row.insurance > 0 ? formatShortVND(row.insurance) : '—'}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 text-right font-bold text-gray-900 bg-slate-50">
                    {formatShortVND(row.payment_total)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 font-medium">
                    {formatShortVND(row.balance_end)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Load More / Show Less */}
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Hiển thị {displayedRows.length} / {schedule.length} tháng
        </div>
        <div className="flex items-center gap-2">
          {displayCount > 12 && (
            <button
              type="button"
              onClick={() => setDisplayCount(12)}
              className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              Thu gọn
            </button>
          )}
          {hasMore && (
            <button
              type="button"
              onClick={() => setDisplayCount(prev => Math.min(prev + 24, schedule.length))}
              className="text-xs text-primary font-medium hover:text-primary-dark px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              Xem thêm {Math.min(24, schedule.length - displayCount)} tháng
            </button>
          )}
          {schedule.length > 12 && displayCount < schedule.length && (
            <button
              type="button"
              onClick={() => setDisplayCount(schedule.length)}
              className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              Xem tất cả
            </button>
          )}
        </div>
      </div>
      
      {/* Legend & Rounding Note */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-[10px] mb-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-l-4 border-l-[#4DC614] bg-[#F7FFF3]"></div>
            <span className="text-gray-500">Tháng tất toán</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-l-4 border-l-amber-500 bg-amber-50"></div>
            <span className="text-gray-500">Thay đổi lãi suất</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[#F7FFF3]"></div>
            <span className="text-gray-500">Có trả thêm gốc</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 italic">
          * Số liệu đã được làm tròn để dễ đọc. Tải CSV để xem chính xác từng đồng.
        </p>
      </div>
    </div>
  );
}

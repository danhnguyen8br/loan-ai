'use client';

import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { GlossaryLabel, GlossaryIcon } from '@/components/ui/glossary-term';
import { STRATEGY_LABELS, formatVND } from '@/lib/simulator-types';

interface StrategyStepProps {
  selectedStrategies: string[];
  extraPrincipalVnd?: number;
  milestoneType?: string;
  thresholdPct?: number;
  onStrategyChange: (strategies: string[]) => void;
  onExtraPrincipalChange: (value: number | undefined) => void;
  onMilestoneTypeChange: (value: string) => void;
  onThresholdChange: (value: number | undefined) => void;
}

export function StrategyStep({
  selectedStrategies,
  extraPrincipalVnd,
  milestoneType,
  thresholdPct,
  onStrategyChange,
  onExtraPrincipalChange,
  onMilestoneTypeChange,
  onThresholdChange,
}: StrategyStepProps) {
  const strategies = [
    {
      id: 'STRATEGY_MIN_PAYMENT',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      benefits: ['Thanh khoản cao', 'Linh hoạt tài chính', 'Rủi ro thấp'],
      suitable: 'Người ưu tiên giữ tiền mặt',
    },
    {
      id: 'STRATEGY_FIXED_EXTRA_PRINCIPAL',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      benefits: ['Giảm tổng lãi', 'Trả nợ sớm hơn', 'Tiết kiệm dài hạn'],
      suitable: 'Người có thu nhập ổn định cao',
    },
    {
      id: 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      benefits: ['Kế hoạch rõ ràng', 'Tối ưu phí tất toán', 'Linh hoạt thoát'],
      suitable: 'Người có kế hoạch bán nhà/tái tài trợ',
    },
  ];

  const toggleStrategy = (strategyId: string) => {
    if (selectedStrategies.includes(strategyId)) {
      // Don't allow deselecting all strategies
      if (selectedStrategies.length > 1) {
        onStrategyChange(selectedStrategies.filter(id => id !== strategyId));
      }
    } else {
      onStrategyChange([...selectedStrategies, strategyId]);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '';
    return value.toLocaleString('vi-VN');
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/\D/g, ''), 10) || 0;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-dark-darker mb-2">
          Chọn Chiến Lược Trả Nợ
        </h2>
        <p className="text-gray-600">
          Chọn một hoặc nhiều chiến lược để so sánh chi phí
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {strategies.map((strategy) => {
          const label = STRATEGY_LABELS[strategy.id];
          const isSelected = selectedStrategies.includes(strategy.id);
          
          return (
            <div key={strategy.id} className="space-y-4">
              <Card
                variant={isSelected ? 'elevated' : 'bordered'}
                hover
                className={`cursor-pointer transition-all duration-300 h-full ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                onClick={() => toggleStrategy(strategy.id)}
              >
                <CardBody className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-primary text-dark-darker' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {strategy.icon}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-dark-darker" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-dark-darker mb-2">
                    {label.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {label.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {strategy.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {benefit}
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Phù hợp:</span> {strategy.suitable}
                    </p>
                  </div>
                </CardBody>
              </Card>
              
              {/* Strategy-specific options */}
              {isSelected && strategy.id === 'STRATEGY_FIXED_EXTRA_PRINCIPAL' && (
                <Card variant="bordered" className="bg-primary/5">
                  <CardBody className="p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số Tiền Trả Thêm Mỗi Tháng
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: 10,000,000"
                      value={formatCurrency(extraPrincipalVnd)}
                      onChange={(e) => onExtraPrincipalChange(parseCurrency(e.target.value) || undefined)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {extraPrincipalVnd && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatVND(extraPrincipalVnd)} / tháng
                      </p>
                    )}
                    
                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[5_000_000, 10_000_000, 20_000_000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExtraPrincipalChange(amount);
                          }}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            extraPrincipalVnd === amount
                              ? 'bg-primary text-dark-darker'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
                          }`}
                        >
                          {formatVND(amount)}
                        </button>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
              
              {isSelected && strategy.id === 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE' && (
                <Card variant="bordered" className="bg-primary/5">
                  <CardBody className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <GlossaryLabel term="settlement" label="Mốc Tất Toán" size="sm" />
                      </label>
                      <Select
                        value={milestoneType || 'payoff_at_end_of_promo'}
                        onChange={(e) => {
                          e.stopPropagation();
                          onMilestoneTypeChange(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="payoff_at_end_of_promo">Cuối kỳ ưu đãi</option>
                        <option value="payoff_at_end_of_grace">Cuối kỳ ân hạn</option>
                        <option value="payoff_when_prepay_fee_hits_threshold">Khi phí tất toán ≤ ngưỡng</option>
                      </Select>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <GlossaryLabel term="promo_rate" label="Kỳ ưu đãi" size="sm" />
                        <span className="text-gray-400">|</span>
                        <GlossaryLabel term="grace_period" label="Kỳ ân hạn" size="sm" />
                      </div>
                    </div>
                    
                    {milestoneType === 'payoff_when_prepay_fee_hits_threshold' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <GlossaryLabel term="prepayment_fee" label="Ngưỡng Phí Trả Nợ Trước Hạn" size="sm" /> (%)
                        </label>
                        <Select
                          value={thresholdPct?.toString() || '0'}
                          onChange={(e) => {
                            e.stopPropagation();
                            onThresholdChange(parseInt(e.target.value));
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="0">0% (Miễn phí)</option>
                          <option value="1">≤ 1%</option>
                          <option value="2">≤ 2%</option>
                        </Select>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="max-w-2xl mx-auto">
        <Card variant="bordered" className="bg-gray-50">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">
                  Đã chọn <span className="font-semibold text-dark-darker">{selectedStrategies.length}</span> chiến lược để so sánh
                </span>
              </div>
              <div className="flex gap-2">
                {selectedStrategies.map((id) => (
                  <span key={id} className="px-2 py-1 text-xs bg-primary/10 text-primary-dark rounded">
                    {STRATEGY_LABELS[id]?.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


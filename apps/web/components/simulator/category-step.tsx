'use client';

import { Card, CardBody } from '@/components/ui/card';
import { CATEGORY_LABELS } from '@/lib/simulator-types';

interface CategoryStepProps {
  selectedCategory: 'MORTGAGE_RE' | 'REFINANCE' | null;
  onSelect: (category: 'MORTGAGE_RE' | 'REFINANCE') => void;
}

export function CategoryStep({ selectedCategory, onSelect }: CategoryStepProps) {
  const categories = [
    {
      id: 'MORTGAGE_RE' as const,
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      features: ['Mua nhà ở', 'Mua căn hộ', 'Xây dựng', 'Sửa chữa'],
    },
    {
      id: 'REFINANCE' as const,
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      features: ['Chuyển nợ', 'Tái tài trợ', 'Giảm lãi suất', 'Rút tiền thêm'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-dark-darker mb-2">
          Chọn Loại Vay
        </h2>
        <p className="text-gray-600">
          Bạn muốn mô phỏng chi phí cho loại vay nào?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {categories.map((cat) => {
          const label = CATEGORY_LABELS[cat.id];
          const isSelected = selectedCategory === cat.id;
          
          return (
            <Card
              key={cat.id}
              variant={isSelected ? 'elevated' : 'bordered'}
              hover
              className={`cursor-pointer transition-all duration-300 ${
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onClick={() => onSelect(cat.id)}
            >
              <CardBody className="p-8 text-center">
                <div className={`mt-6 w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-primary text-dark-darker' : 'bg-gray-100 text-gray-600'
                }`}>
                  {cat.icon}
                </div>
                
                <h3 className="text-xl font-semibold text-dark-darker mb-2">
                  {label.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {label.description}
                </p>
                
                <div className="flex flex-wrap justify-center gap-2">
                  {cat.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                
                {isSelected && (
                  <div className="mt-4 flex items-center justify-center text-primary-dark font-medium">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Đã chọn
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


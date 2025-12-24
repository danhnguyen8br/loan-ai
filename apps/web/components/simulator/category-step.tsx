'use client';

import { Card, CardBody } from '@/components/ui/card';
import { CATEGORY_LABELS } from '@/lib/simulator-types';
import { Icons } from '@/components/ui/icons';

interface CategoryStepProps {
  selectedCategory: 'MORTGAGE_RE' | 'REFINANCE' | null;
  onSelect: (category: 'MORTGAGE_RE' | 'REFINANCE') => void;
}

export function CategoryStep({ selectedCategory, onSelect }: CategoryStepProps) {
  const categories = [
    {
      id: 'MORTGAGE_RE' as const,
      icon: <Icons.Mortgage className="w-12 h-12" />,
      features: ['Mua nhà ở', 'Mua căn hộ', 'Xây dựng', 'Sửa chữa'],
    },
    {
      id: 'REFINANCE' as const,
      icon: <Icons.BankTransfer className="w-12 h-12" />,
      features: ['Chuyển nợ', 'Chuyển ngân hàng', 'Giảm lãi suất', 'Rút tiền thêm'],
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
                    <Icons.Check className="w-5 h-5 mr-1" />
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


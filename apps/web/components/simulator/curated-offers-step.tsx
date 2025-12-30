'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { getCuratedOffers, type CuratedOffer } from '@/data/simulator-curated-offers';
import { useTemplates } from '@/lib/hooks/use-simulator';
import type { ProductTemplate } from '@/lib/simulator-types';

type Category = 'MORTGAGE_RE' | 'REFINANCE';

interface CuratedOffersStepProps {
  onContinue: (category: Category) => void;
}

export function CuratedOffersStep({ onContinue }: CuratedOffersStepProps) {
  const [activeTab, setActiveTab] = useState<Category>('MORTGAGE_RE');
  const offers = getCuratedOffers(activeTab);
  const { data } = useTemplates(activeTab);

  const templatesById = new Map<string, ProductTemplate>(
    (data?.templates ?? []).map((t) => [t.id, t])
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Hidden on desktop since parent has title */}
      <div className="text-center px-4 sm:px-6 lg:px-0 lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Hiểu Rõ Gói Vay Thế Chấp
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          3 gói vay tiêu biểu giúp bạn nắm bắt các yếu tố quan trọng nhất
        </p>
      </div>

      {/* Category Tabs - Touch friendly */}
      <div className="flex rounded-xl bg-leadity-gray-lighter p-1 mx-4 sm:mx-6 lg:mx-0">
        <button
          type="button"
          onClick={() => setActiveTab('MORTGAGE_RE')}
          className={`flex-1 py-3 sm:py-3.5 px-3 sm:px-4 rounded-lg text-base font-medium transition-all touch-manipulation flex items-center justify-center gap-2 ${
            activeTab === 'MORTGAGE_RE'
              ? 'bg-white text-dark-darker shadow-sm'
              : 'text-leadity-gray-muted hover:text-dark-darker active:bg-leadity-gray-light'
          }`}
        >
          <Icons.Mortgage className={`w-5 h-5 ${activeTab === 'MORTGAGE_RE' ? 'text-primary-700' : ''}`} />
          Vay Mua BĐS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REFINANCE')}
          className={`flex-1 py-3 sm:py-3.5 px-3 sm:px-4 rounded-lg text-base font-medium transition-all touch-manipulation flex items-center justify-center gap-2 ${
            activeTab === 'REFINANCE'
              ? 'bg-white text-dark-darker shadow-sm'
              : 'text-leadity-gray-muted hover:text-dark-darker active:bg-leadity-gray-light'
          }`}
        >
          <Icons.BankTransfer className={`w-5 h-5 ${activeTab === 'REFINANCE' ? 'text-primary-700' : ''}`} />
          Chuyển Ngân Hàng
        </button>
      </div>

      {/* Offer Cards */}
      <div className="space-y-3 sm:space-y-4 px-4 sm:px-6 lg:px-0">
        {offers.map((offer, idx) => (
          <OfferCard
            key={offer.templateId}
            offer={offer}
            index={idx}
            template={templatesById.get(offer.templateId)}
          />
        ))}
      </div>

      {/* CTA - Sticky on mobile, normal on desktop */}
      <div className="px-4 sm:px-6 lg:px-0 pt-2 pb-4 sm:pb-6 lg:pb-0 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent lg:static lg:bg-transparent">
        <Button
          onClick={() => onContinue(activeTab)}
          className="w-full py-4 text-lg font-semibold touch-manipulation active:scale-[0.98] transition-transform"
        >
          Tính Cho Trường Hợp Của Bạn
          <Icons.ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-sm text-gray-500 mt-3 lg:hidden">
          Chỉ mất 30 giây để nhận kết quả
        </p>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  index,
  template,
}: {
  offer: CuratedOffer;
  index: number;
  template?: ProductTemplate;
}) {
  const [expanded, setExpanded] = useState(index === 0); // First card expanded by default

  return (
    <Card
      variant="bordered"
      className={`overflow-hidden transition-all duration-300 ${
        expanded ? 'ring-2 ring-primary/50' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left touch-manipulation"
      >
        <div className="p-3 sm:p-3.5 flex items-start gap-3">
          {/* Rank Badge */}
          <div
            className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-dark flex items-center justify-center text-text-inverse font-bold text-sm shadow-sm"
          >
            {offer.rank}
          </div>

          <div className="flex-1 min-w-0 flex items-center">
            <h3 className="font-semibold text-dark-darker text-base sm:text-lg">
              {template?.description ?? offer.headline}
            </h3>
          </div>

          {/* Expand Icon */}
          <Icons.ChevronDown 
            className={`w-5 h-5 text-text-muted transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <CardBody className="pt-0 px-3 sm:px-4 pb-2.5 sm:pb-3">
          <div className="border-t border-leadity-gray-light pt-2 sm:pt-2.5">
            <ul className="space-y-1.5 sm:space-y-2">
              {offer.highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm sm:text-base">
                  <Icons.Check className="w-4 h-4 text-primary-700 mt-0.5 flex-shrink-0" />
                  <span className="text-leadity-gray">{highlight}</span>
                </li>
              ))}
            </ul>

            {offer.disclaimer && (
              <p className="mt-3 text-xs sm:text-sm text-text-muted italic">{offer.disclaimer}</p>
            )}
          </div>
        </CardBody>
      )}
    </Card>
  );
}


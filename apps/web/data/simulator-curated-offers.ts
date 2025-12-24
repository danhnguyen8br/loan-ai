/**
 * Curated Top 3 offers for the simplified simulator flow.
 * Maps to template_ids in @loan-ai/loan-engine.
 */

export interface CuratedOffer {
  /** Must match a template id in @loan-ai/loan-engine */
  templateId: string;
  /** Short headline for the card */
  headline: string;
  /** 4-6 bullet points highlighting key features */
  highlights: string[];
  /** One-sentence persona description */
  persona: string;
  /** Optional disclaimer */
  disclaimer?: string;
  /** Display rank 1-3 */
  rank: 1 | 2 | 3;
}

export interface CuratedOffersConfig {
  MORTGAGE_RE: CuratedOffer[];
  REFINANCE: CuratedOffer[];
}

export const CURATED_OFFERS: CuratedOffersConfig = {
  MORTGAGE_RE: [
    {
      templateId: 'market2025_mortgage_promo_6m',
      headline: 'Gói vay mua nhà ưu đãi 6T (lãi đầu kỳ thấp)',
      highlights: [
        '6 tháng đầu lãi suất ưu đãi (đẩy mạnh đầu kỳ)',
        'Sau ưu đãi: thả nổi ≈ LS 12T + biên độ (thường 3–5%/năm)',
        'LTV tối đa 85%, ân hạn gốc 24 tháng',
        'Phí ban đầu: 0.5% tiền vay + ~3 triệu định giá',
        'Trả sớm: phí giảm dần 3% → 2% → 1% → 0%',
      ],
      persona: 'Dành cho bạn ưu tiên lãi thấp đầu kỳ và có kế hoạch tất toán/đảo nợ sớm.',
      disclaimer: 'Nguồn: tổng hợp mặt bằng thị trường (12/2025), không hiển thị tên ngân hàng.',
      rank: 1,
    },
    {
      templateId: 'market2025_mortgage_fixed_24m',
      headline: 'Gói vay mua nhà cố định 24T (cân bằng)',
      highlights: [
        'Cố định 24 tháng để giảm rủi ro tăng lãi',
        'Sau ưu đãi: thả nổi ≈ LS 12T + biên độ',
        'Ân hạn gốc 36 tháng, kỳ hạn vay đến 25 năm',
        'LTV tối đa 80% (thông lệ phổ biến)',
        'Trả sớm: phí giảm dần 3% → 2% → 1% → 0%',
      ],
      persona: 'Dành cho bạn muốn chi phí dễ dự báo trong 2 năm đầu.',
      disclaimer: 'Nguồn: tổng hợp mặt bằng thị trường (12/2025), không hiển thị tên ngân hàng.',
      rank: 2,
    },
    {
      templateId: 'market2025_mortgage_fixed_60m',
      headline: 'Gói vay mua nhà cố định 60T (ổn định dài)',
      highlights: [
        'Cố định dài để giảm biến động lãi suất',
        'Phù hợp người ưu tiên “chắc chi phí” hơn lãi rẻ',
        'Ân hạn gốc 12 tháng, kỳ hạn vay đến 20 năm',
        'Trả sớm: phí cao hơn ở giai đoạn đầu, giảm dần về 0%',
      ],
      persona: 'Dành cho bạn muốn ổn định dài hạn và ít muốn “đánh cược” lãi thả nổi.',
      disclaimer: 'Nguồn: tổng hợp mặt bằng thị trường (12/2025), không hiển thị tên ngân hàng.',
      rank: 3,
    },
  ],
  REFINANCE: [
    {
      templateId: 'market2025_refinance_promo_12m',
      headline: 'Gói chuyển nợ ưu đãi 12T (giảm lãi nhanh)',
      highlights: [
        'Ưu đãi 12 tháng đầu để giảm chi phí lãi ngay',
        'Sau ưu đãi: thả nổi ≈ LS 12T + biên độ',
        'Ân hạn gốc 12 tháng (giảm áp lực đầu kỳ)',
        'Phí xử lý khoảng 0.3% + ~2.5 triệu định giá',
        'Trả sớm: phí giảm dần 3% → 2% → 1% → 0%',
      ],
      persona: 'Dành cho bạn muốn giảm lãi ngay, kỳ vọng tất toán/đảo nợ trong 1–2 năm.',
      disclaimer: 'Nguồn: tổng hợp mặt bằng thị trường (12/2025), không hiển thị tên ngân hàng.',
      rank: 1,
    },
    {
      templateId: 'market2025_refinance_fixed_24m',
      headline: 'Gói chuyển nợ cố định 24T (dễ lập kế hoạch)',
      highlights: [
        'Cố định 24 tháng để “khóa” chi phí',
        'Ân hạn gốc 24 tháng (tuỳ hồ sơ)',
        'Sau ưu đãi: thả nổi ≈ LS 12T + biên độ',
        'Phí xử lý khoảng 0.4% + ~2.5 triệu định giá',
        'Phù hợp người muốn ổn định trong 2 năm đầu sau chuyển nợ',
      ],
      persona: 'Dành cho bạn muốn dễ dự báo dòng tiền sau khi chuyển nợ.',
      disclaimer: 'Nguồn: tổng hợp mặt bằng thị trường (12/2025), không hiển thị tên ngân hàng.',
      rank: 2,
    },
    {
      templateId: 'market2025_refinance_low_margin_float',
      headline: 'Gói chuyển nợ biên độ thấp (linh hoạt)',
      highlights: [
        'Biên độ thả nổi thấp → lợi khi lãi thị trường giảm/ổn định',
        'Ưu đãi ngắn 6 tháng trước khi thả nổi',
        'Penalty trả sớm ngắn hơn (2 năm) ở mức phổ biến',
        'Phù hợp hồ sơ tốt (LTV/Tỷ lệ nợ/thu nhập chặt hơn)',
        'Phí xử lý khoảng 0.5% + ~2 triệu định giá',
      ],
      persona: 'Dành cho bạn chấp nhận biến động lãi, ưu tiên biên độ thấp.',
      disclaimer: 'Nguồn: tổng hợp mặt bằng thị trường (12/2025), không hiển thị tên ngân hàng.',
      rank: 3,
    },
  ],
};

/**
 * Helper to get curated offers by category
 */
export function getCuratedOffers(category: 'MORTGAGE_RE' | 'REFINANCE'): CuratedOffer[] {
  return CURATED_OFFERS[category].sort((a, b) => a.rank - b.rank);
}

/**
 * Helper to get a single curated offer by template id
 */
export function getCuratedOfferByTemplateId(templateId: string): CuratedOffer | undefined {
  const all = [...CURATED_OFFERS.MORTGAGE_RE, ...CURATED_OFFERS.REFINANCE];
  return all.find((o) => o.templateId === templateId);
}


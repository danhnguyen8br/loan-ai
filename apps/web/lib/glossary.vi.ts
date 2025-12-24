/**
 * Vietnamese Banking Terms Glossary
 * 
 * This module provides definitions for common banking and loan terms
 * displayed throughout the application with Vietnamese explanations.
 */

export type GlossaryEntry = {
  /** Machine-readable identifier */
  key: string;
  /** Terms/synonyms displayed in the UI that map to this definition */
  terms: string[];
  /** 1-2 line Vietnamese definition for tooltip */
  short: string;
  /** Optional longer explanation */
  long?: string;
  /** Optional usage examples */
  examples?: string[];
  /** Optional related links */
  links?: { label: string; href: string }[];
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    key: 'grace_period',
    terms: ['Ân hạn nợ gốc', 'Ân hạn gốc', 'Thời gian ân hạn'],
    short: 'Khoảng thời gian đầu chỉ trả lãi, chưa trả gốc. Thường áp dụng 6-12 tháng đầu để giảm áp lực tài chính ban đầu.',
    long: 'Trong thời gian ân hạn, bạn chỉ cần trả lãi hàng tháng mà không phải trả nợ gốc. Sau khi hết ân hạn, bạn sẽ bắt đầu trả cả gốc và lãi theo lịch trình đã thỏa thuận.',
    examples: ['Vay 2 tỷ, ân hạn 12 tháng → 12 tháng đầu chỉ trả lãi ~16 triệu/tháng'],
  },
  {
    key: 'promo_rate',
    terms: ['Lãi suất ưu đãi', 'Lãi ưu đãi', 'LS ưu đãi', 'Promotional Rate'],
    short: 'Lãi suất thấp trong thời gian đầu (thường 6-24 tháng). Sau đó chuyển sang lãi suất thả nổi theo thị trường.',
    long: 'Ngân hàng thường đưa ra mức lãi suất ưu đãi cố định trong giai đoạn đầu để thu hút khách hàng. Khi hết ưu đãi, lãi suất sẽ điều chỉnh theo công thức: Lãi tham chiếu + Biên độ.',
    examples: ['Lãi 5.9%/năm trong 12 tháng đầu, sau đó theo lãi thị trường'],
  },
  {
    key: 'floating_rate',
    terms: ['Lãi suất thả nổi', 'LS thả nổi', 'Lãi thả nổi', 'Floating Rate'],
    short: 'Lãi suất thay đổi theo điều kiện thị trường. Được tính bằng: Lãi tham chiếu + Biên độ ngân hàng.',
    long: 'Khác với lãi suất cố định, lãi thả nổi biến động theo lãi suất thị trường. Điều này có thể có lợi khi lãi suất giảm, nhưng cũng có rủi ro khi lãi suất tăng.',
  },
  {
    key: 'margin',
    terms: ['Biên độ', 'Margin', 'Biên độ lãi suất'],
    short: 'Phần chênh lệch ngân hàng cộng thêm vào lãi tham chiếu để tính lãi thả nổi. Thường 3-4%/năm.',
    long: 'Biên độ là mức lợi nhuận của ngân hàng, thường cố định trong suốt kỳ vay. Lãi suất thực = Lãi tham chiếu (thay đổi) + Biên độ (cố định).',
    examples: ['Biên độ 3.5% + Lãi tham chiếu 6% = Lãi vay 9.5%/năm'],
  },
  {
    key: 'reference_rate',
    terms: ['Lãi tham chiếu', 'Lãi suất tham chiếu', 'Reference Rate', 'Benchmark Rate'],
    short: 'Mức lãi suất cơ sở do ngân hàng công bố định kỳ, dùng làm chuẩn để tính lãi thả nổi.',
    long: 'Mỗi ngân hàng có cách tính lãi tham chiếu riêng, thường dựa trên lãi suất tiết kiệm 12-13 tháng hoặc trung bình của thị trường. Được cập nhật định kỳ (tháng/quý).',
    examples: ['Ví dụ: Lãi tiết kiệm/huy động 12 tháng + 3%'],
  },
  {
    key: 'prepayment_fee',
    terms: ['Phí trả nợ trước hạn', 'Phí trả trước', 'Prepayment Fee', 'Early Repayment Fee'],
    short: 'Phí phạt khi trả nợ sớm hơn lịch. Thường 1-3% số tiền trả trước, giảm dần theo thời gian.',
    long: 'Ngân hàng tính phí này để bù đắp lãi suất mất đi khi khách hàng tất toán sớm. Nhiều ngân hàng miễn phí sau 3-5 năm hoặc cho phép trả trước một phần không mất phí.',
    examples: ['Trả trước 500 triệu, phí 2% = 10 triệu phí trả nợ trước hạn'],
  },
  {
    key: 'declining_balance',
    terms: ['Dư nợ giảm dần', 'Trả gốc đều', 'Declining Balance'],
    short: 'Phương thức trả nợ gốc đều mỗi tháng, lãi tính trên dư nợ còn lại → Tổng tiền trả giảm dần theo thời gian.',
    long: 'Số tiền gốc cố định mỗi tháng, nhưng tiền lãi giảm dần vì dư nợ giảm. Tổng chi phí lãi thường thấp hơn phương thức niên kim, nhưng gánh nặng tài chính cao hơn ở đầu kỳ.',
    examples: ['Vay 2 tỷ/20 năm: Gốc ~8.3 triệu/tháng + Lãi giảm dần'],
  },
  {
    key: 'annuity',
    terms: ['Niên kim', 'Annuity', 'Trả đều', 'Equal Monthly Payment', 'Gốc + lãi chia đều'],
    short: 'Tổng tiền trả mỗi kỳ gần như cố định (trong cùng giai đoạn lãi suất). Đầu kỳ lãi cao, gốc thấp; về sau gốc tăng dần, lãi giảm dần.',
    long: `💡 Ý tưởng: Trong một giai đoạn lãi suất cố định, tổng tiền trả hàng tháng là như nhau. Điều này giúp dễ lập ngân sách gia đình.

📊 Cấu trúc dòng tiền: Kỳ đầu lãi chiếm tỷ trọng lớn, gốc nhỏ; về sau gốc tăng dần, lãi giảm dần (vì dư nợ giảm).

✅ Ưu điểm:
• Áp lực tháng đầu thấp hơn Equal Principal
• Dễ vượt qua đánh giá gánh nợ hàng tháng của ngân hàng
• Dễ cân đối ngân sách hàng tháng

⚠️ Nhược điểm:
• Tổng lãi thường cao hơn so với gốc đều (vì giảm dư nợ chậm hơn ở giai đoạn đầu)

📌 Lưu ý: Với khoản vay thả nổi hoặc reset lãi, "tiền trả cố định" chỉ áp dụng trong từng giai đoạn. Đến kỳ reset, ngân hàng có thể tính lại số tiền trả theo lãi suất mới.`,
    examples: [
      'Vay 2 tỷ/20 năm, lãi 9%: Trả đều ~18 triệu/tháng',
      'Tháng 1: Trả 18tr (Gốc 3tr + Lãi 15tr) → Tháng 240: Trả 18tr (Gốc 17.5tr + Lãi 0.5tr)',
    ],
  },
  {
    key: 'ltv',
    terms: ['LTV', 'Tỷ lệ vay/giá nhà', 'Phần trăm vay so với giá nhà', 'Loan-to-Value', 'Tỷ lệ cho vay'],
    short: 'Phần trăm số tiền vay so với giá trị tài sản thế chấp. Ngân hàng thường cho vay tối đa 70-80% giá trị.',
    long: 'Tỷ lệ vay/giá nhà = (Số tiền vay ÷ Giá trị tài sản) × 100%. Tỷ lệ càng thấp, rủi ro cho ngân hàng càng thấp → bạn có thể được lãi suất tốt hơn.',
    examples: ['Nhà trị giá 3 tỷ, vay 2.1 tỷ → Tỷ lệ vay = 70%'],
  },
  {
    key: 'dti_dsr',
    terms: ['DTI', 'DSR', '% thu nhập trả nợ', 'Gánh nợ hàng tháng', 'Tỷ lệ nợ/thu nhập', 'Debt-to-Income', 'Debt Service Ratio'],
    short: 'Phần trăm thu nhập bạn phải dành để trả nợ mỗi tháng. Ngân hàng thường yêu cầu không quá 50-60%.',
    long: '% thu nhập trả nợ = (Tổng nợ trả hàng tháng ÷ Thu nhập ròng) × 100%. Bao gồm cả khoản vay mới và các nợ hiện có (thẻ tín dụng, vay tiêu dùng...).',
    examples: ['Thu nhập 30 triệu, tổng nợ phải trả 15 triệu/tháng → Gánh nợ = 50%'],
  },
  {
    key: 'settlement',
    terms: ['Tất toán', 'Thanh toán toàn bộ', 'Full Settlement', 'Payoff'],
    short: 'Trả hết toàn bộ dư nợ còn lại để đóng khoản vay. Có thể phát sinh phí trả nợ trước hạn.',
    long: 'Khi tất toán, bạn cần thanh toán: dư nợ gốc + lãi phát sinh đến ngày tất toán + phí trả nợ trước hạn (nếu có). Sau tất toán, ngân hàng sẽ giải chấp tài sản.',
  },
  {
    key: 'refinance',
    terms: ['Chuyển ngân hàng', 'Refinance', 'Đảo nợ', 'Chuyển khoản vay'],
    short: 'Vay khoản mới để trả khoản cũ, thường để hưởng lãi suất tốt hơn hoặc điều kiện phù hợp hơn.',
    long: 'Refinance có thể ở cùng ngân hàng hoặc chuyển sang ngân hàng khác. Cần tính toán kỹ: lãi suất mới, phí tất toán sớm, phí thẩm định lại, và tổng chi phí để đảm bảo có lợi.',
    examples: ['Đang vay 10%/năm, refinance sang gói 8% → tiết kiệm 2%/năm'],
  },
  {
    key: 'disbursement',
    terms: ['Giải ngân', 'Disbursement', 'Rút vốn'],
    short: 'Ngân hàng chuyển tiền vay cho khách hàng hoặc bên thụ hưởng (người bán nhà). Có thể giải ngân 1 lần hoặc nhiều đợt.',
    long: 'Giải ngân thường diễn ra sau khi hoàn tất thủ tục pháp lý, công chứng hợp đồng, và đăng ký giao dịch bảo đảm. Với nhà đang xây, có thể giải ngân theo tiến độ.',
  },
  {
    key: 'property_valuation',
    terms: ['Thẩm định', 'Định giá tài sản', 'Property Valuation', 'Thẩm định giá'],
    short: 'Đánh giá giá trị tài sản thế chấp do ngân hàng hoặc đơn vị độc lập thực hiện. Phí khoảng 0.1-0.3% giá trị.',
    long: 'Kết quả thẩm định quyết định số tiền tối đa được vay (theo tỷ lệ vay/giá nhà). Thẩm định xem xét: vị trí, diện tích, pháp lý, tình trạng xây dựng, giá thị trường khu vực.',
    examples: ['Nhà mua 3 tỷ, thẩm định được 2.8 tỷ → Vay tối đa 2.8 × 70% = 1.96 tỷ'],
  },
  {
    key: 'cic',
    terms: ['CIC', 'Trung tâm Thông tin Tín dụng', 'Credit Information Center'],
    short: 'Trung tâm Thông tin Tín dụng Quốc gia: Lưu trữ lịch sử vay nợ. Nợ xấu CIC ảnh hưởng khả năng vay.',
    long: 'CIC thuộc Ngân hàng Nhà nước, lưu trữ thông tin tín dụng của cá nhân/doanh nghiệp tại Việt Nam. Phân loại nợ từ 1-5, trong đó nhóm 3-5 là nợ xấu. Lịch sử xấu tồn tại 5 năm.',
    examples: ['Nợ nhóm 1: Đủ tiêu chuẩn', 'Nợ nhóm 5: Có khả năng mất vốn'],
  },
  {
    key: 'apr',
    terms: ['APR', 'Annual Percentage Rate', 'Lãi suất thực tế/năm'],
    short: 'Lãi suất thực tế hàng năm bao gồm cả phí. Dùng để so sánh chi phí thực giữa các khoản vay.',
    long: 'APR phản ánh tổng chi phí vay (lãi + phí) quy về lãi suất năm. APR cao hơn lãi suất danh nghĩa vì đã tính phí. Là chỉ số quan trọng để so sánh các sản phẩm vay.',
  },
  {
    key: 'collateral',
    terms: ['Tài sản thế chấp', 'Thế chấp', 'Collateral', 'TSTC'],
    short: 'Tài sản dùng để đảm bảo khoản vay. Thường là bất động sản, xe, sổ tiết kiệm.',
    long: 'Ngân hàng giữ quyền xử lý tài sản nếu khách hàng không trả được nợ. Với bất động sản, cần đăng ký giao dịch bảo đảm tại Văn phòng Đăng ký Đất đai.',
  },
  {
    key: 'monthly_payment',
    terms: ['Trả hàng tháng', 'Tiền trả/tháng', 'Monthly Payment', 'Kỳ hạn trả'],
    short: 'Số tiền bạn phải trả cho ngân hàng mỗi tháng, bao gồm cả gốc và lãi.',
    long: 'Tiền trả hàng tháng phụ thuộc vào: số tiền vay, lãi suất, kỳ hạn vay, và phương thức trả nợ. Với vay thả nổi, số tiền này có thể thay đổi khi lãi suất điều chỉnh.',
  },
  {
    key: 'total_cost',
    terms: ['Tổng chi phí', 'Chi phí toàn bộ', 'Total Cost'],
    short: 'Tổng số tiền bạn phải trả ngoài tiền gốc vay: lãi + phí + bảo hiểm.',
    long: 'Đây là con số quan trọng nhất để so sánh các khoản vay. Hai gói vay có lãi suất khác nhau nhưng tổng chi phí có thể tương đương do phí và kỳ hạn khác nhau.',
    examples: ['Vay 2 tỷ/20 năm, tổng chi phí 1.5 tỷ → Tổng phải trả 3.5 tỷ'],
  },
  {
    key: 'break_even',
    terms: ['Hoà vốn', 'Điểm hoà vốn', 'Break-even', 'Hòa vốn'],
    short: 'Thời điểm mà lợi ích từ việc chuyển ngân hàng bắt đầu vượt qua chi phí chuyển đổi.',
    long: 'Khi refinance, bạn phải trả phí tất toán sớm, phí thẩm định lại. Điểm hoà vốn cho biết sau bao lâu bạn sẽ bắt đầu tiết kiệm thực sự so với giữ khoản vay cũ.',
    examples: ['Hoà vốn sau 18 tháng → Từ tháng 19, bạn bắt đầu tiết kiệm thật'],
  },
  {
    key: 'fixed_rate',
    terms: ['Lãi suất cố định', 'LS cố định', 'Fixed Rate', 'Lãi cố định'],
    short: 'Lãi suất không đổi trong một khoảng thời gian cam kết. Giúp ổn định chi phí, dễ lập kế hoạch.',
    long: 'Với lãi cố định, số tiền trả không bị ảnh hưởng bởi biến động thị trường trong thời gian cam kết. Tuy nhiên, thường cao hơn lãi thả nổi khi thị trường ổn định.',
    examples: ['Cố định 8%/năm trong 36 tháng, sau đó thả nổi'],
  },
  {
    key: 'repayment_method',
    terms: ['Phương thức trả nợ', 'Phương thức trả', 'Repayment Method'],
    short: 'Cách phân chia tiền gốc và lãi trong mỗi kỳ trả nợ. Có 2 loại phổ biến: Niên kim (Annuity) và Gốc cố định (Equal Principal).',
    long: `📌 Hai phương thức trả nợ phổ biến tại Việt Nam:

1️⃣ Niên kim (Annuity): Tổng tiền trả đều mỗi tháng
   • Đầu kỳ: nhiều lãi, ít gốc → Cuối kỳ: ít lãi, nhiều gốc
   • Ưu: Dễ lập ngân sách, áp lực ban đầu thấp
   • Nhược: Tổng lãi cao hơn

2️⃣ Gốc cố định (Equal Principal): Gốc đều mỗi tháng, lãi giảm dần
   • Đầu kỳ: trả cao nhất → Giảm dần theo thời gian
   • Ưu: Tổng lãi thấp hơn, tiết kiệm dài hạn
   • Nhược: Áp lực đầu kỳ cao, cần dòng tiền khỏe`,
    examples: [
      'Niên kim: Vay 2 tỷ/20 năm, 9% → Trả đều ~18 triệu/tháng suốt kỳ vay',
      'Gốc cố định: Vay 2 tỷ/20 năm → Tháng 1: 23.3tr, giảm dần đến 8.4tr',
    ],
  },
  {
    key: 'equal_principal',
    terms: ['Gốc cố định', 'Gốc đều', 'Equal Principal', 'Trả gốc đều', 'Gốc cố định lãi giảm dần'],
    short: 'Mỗi kỳ trả một phần gốc cố định, lãi tính trên dư nợ còn lại nên giảm dần. Tháng đầu trả cao nhất, sau đó giảm dần.',
    long: `💡 Ý tưởng: Mỗi kỳ trả một phần gốc cố định bằng nhau, lãi tính trên dư nợ còn lại nên giảm dần theo thời gian.

📊 Cấu trúc dòng tiền: Tháng đầu trả cao nhất (gốc + lãi trên toàn bộ dư nợ), sau đó tổng tiền trả giảm dần vì lãi giảm.

✅ Ưu điểm:
• Tổng lãi thấp hơn Annuity (vì dư nợ giảm nhanh hơn ngay từ đầu)
• Càng về sau càng nhẹ gánh
• Tiết kiệm chi phí dài hạn

⚠️ Nhược điểm:
• Áp lực tháng đầu cao hơn (cần dòng tiền khỏe)
• Có thể khó vượt qua đánh giá gánh nợ hàng tháng hơn Annuity
• Gánh nặng tài chính lớn hơn ở giai đoạn đầu khi thu nhập có thể chưa cao

📌 Phù hợp với: Người có thu nhập ổn định, muốn tiết kiệm tổng lãi, hoặc dự kiến thu nhập tăng trong tương lai.`,
    examples: [
      'Vay 2 tỷ/20 năm: Gốc 8.3 triệu/tháng cố định',
      'Tháng 1: Trả 23.3tr (Gốc 8.3tr + Lãi 15tr) → Tháng 240: Trả 8.4tr (Gốc 8.3tr + Lãi 0.1tr)',
    ],
  },
];

/**
 * Find a glossary entry by term (case-insensitive, partial match supported)
 * @param term - The term to search for
 * @returns The matching GlossaryEntry or null if not found
 */
export function findEntryByTerm(term: string): GlossaryEntry | null {
  if (!term || term.trim() === '') return null;
  
  const normalizedTerm = term.toLowerCase().trim();
  
  return GLOSSARY.find(entry =>
    entry.terms.some(t => t.toLowerCase() === normalizedTerm)
  ) || null;
}

/**
 * Find glossary entry by exact key
 * @param key - The machine key to search for
 * @returns The matching GlossaryEntry or null if not found
 */
export function findEntryByKey(key: string): GlossaryEntry | null {
  return GLOSSARY.find(entry => entry.key === key) || null;
}

/**
 * Check if a term exists in the glossary
 * @param term - The term to check
 * @returns boolean indicating if term is in glossary
 */
export function isGlossaryTerm(term: string): boolean {
  return findEntryByTerm(term) !== null;
}

/**
 * Get all terms from the glossary as a flat array
 * Useful for highlighting or detection
 */
export function getAllTerms(): string[] {
  return GLOSSARY.flatMap(entry => entry.terms);
}


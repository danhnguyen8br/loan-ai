'use client';

import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7CD734]/10 via-transparent to-[#4DC614]/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7CD734]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#4DC614]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Chào mừng đến với{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4DC614] to-[#7CD734]">
                Leadity
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Đối tác tài chính đáng tin cậy, giúp bạn tìm được gói vay thế chấp tốt nhất
            </p>
          </div>
        </div>
      </section>

      {/* About Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="space-y-12">
          
          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7CD734] to-[#4DC614] flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Sứ Mệnh Của Chúng Tôi</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Leadity ra đời với sứ mệnh đơn giản hóa quá trình vay thế chấp cho người Việt Nam. 
                  Chúng tôi tin rằng mọi người đều xứng đáng có được giải pháp tài chính minh bạch, 
                  phù hợp với hoàn cảnh và mục tiêu riêng của mình.
                </p>
              </div>
            </div>
          </div>

          {/* What We Do */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Chúng Tôi Làm Gì?</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#7CD734]/5 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#7CD734]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#4DC614]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">So Sánh Gói Vay</h3>
                  <p className="text-gray-600 text-sm">Phân tích và so sánh hàng trăm sản phẩm vay từ các ngân hàng hàng đầu</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#7CD734]/5 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#7CD734]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#4DC614]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Tư Vấn Cá Nhân Hóa</h3>
                  <p className="text-gray-600 text-sm">Đội ngũ chuyên gia tư vấn 1-1 dựa trên nhu cầu cụ thể của bạn</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#7CD734]/5 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#7CD734]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#4DC614]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Hỗ Trợ Hồ Sơ</h3>
                  <p className="text-gray-600 text-sm">Đồng hành cùng bạn trong toàn bộ quá trình nộp hồ sơ vay</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#7CD734]/5 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#7CD734]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#4DC614]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Đàm Phán Lãi Suất</h3>
                  <p className="text-gray-600 text-sm">Thương lượng để có được mức lãi suất tốt nhất cho khách hàng</p>
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-8 text-center">Tại Sao Chọn Leadity?</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#7CD734] flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-900">10+</span>
                </div>
                <h3 className="font-semibold mb-2">Ngân Hàng Đối Tác</h3>
                <p className="text-gray-400 text-sm">Hợp tác với các ngân hàng hàng đầu Việt Nam</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#7CD734] flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-900">0đ</span>
                </div>
                <h3 className="font-semibold mb-2">Phí Tư Vấn</h3>
                <p className="text-gray-400 text-sm">Hoàn toàn miễn phí cho khách hàng cá nhân</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#7CD734] flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-900">24h</span>
                </div>
                <h3 className="font-semibold mb-2">Phản Hồi Nhanh</h3>
                <p className="text-gray-400 text-sm">Cam kết tư vấn trong vòng 24 giờ</p>
              </div>
            </div>
          </div>

          {/* Process */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quy Trình Làm Việc</h2>
            <div className="space-y-6">
              {[
                { step: 1, title: 'Tìm Hiểu Nhu Cầu', desc: 'Lắng nghe và hiểu rõ mục tiêu tài chính của bạn' },
                { step: 2, title: 'Phân Tích & Đề Xuất', desc: 'So sánh các gói vay phù hợp từ nhiều ngân hàng' },
                { step: 3, title: 'Hỗ Trợ Hồ Sơ', desc: 'Chuẩn bị và nộp hồ sơ vay hoàn chỉnh' },
                { step: 4, title: 'Giải Ngân', desc: 'Theo dõi và hỗ trợ đến khi nhận được khoản vay' },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7CD734] to-[#4DC614] flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden sm:block">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#7CD734]/20 to-[#4DC614]/20 rounded-2xl p-8 text-center border border-[#7CD734]/30">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Sẵn Sàng Bắt Đầu?</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Liên hệ với chúng tôi ngay hôm nay để được tư vấn miễn phí về các gói vay thế chấp phù hợp nhất.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#7CD734] to-[#4DC614] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Tính Toán Gói Vay
              </a>
              <a
                href="tel:0948386873"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold px-8 py-3 rounded-xl border-2 border-gray-200 hover:border-[#7CD734] transition-all hover:shadow-lg"
              >
                <svg className="w-5 h-5 text-[#4DC614]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Gọi: 0948 386 873
              </a>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}


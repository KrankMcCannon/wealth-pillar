"use client";

import BottomNavigation from "../../../components/bottom-navigation";

export default function InvestmentsPage() {

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC'}}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button className="text-[#1F2937] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-[#EFF2FE] transition-colors">
              <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 className="text-[#1F2937] text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Investments</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <main className="p-4 pb-24">
          {/* Portfolio Summary */}
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 mb-6">
            <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-base font-bold text-gray-800">Total Portfolio</p>
                <div className="text-gray-400">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-52-12a12,12,0,1,0,12,12A12,12,0,0,0,88,116Zm104,0a12,12,0,1,0,12,12A12,12,0,0,0,192,116Z"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">$48,270.50</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>+$3,270.50</span>
                  <span className="text-green-600">+7.3%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-green-500" style={{width: '73%'}}></div>
                </div>
              </div>
            </div>
            <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-base font-bold text-gray-800">Stocks</p>
                <div className="text-gray-400">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-52-12a12,12,0,1,0,12,12A12,12,0,0,0,88,116Zm104,0a12,12,0,1,0,12,12A12,12,0,0,0,192,116Z"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">$32,450</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>67% of portfolio</span>
                  <span className="text-green-600">+12%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-blue-500" style={{width: '67%'}}></div>
                </div>
              </div>
            </div>
            <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-base font-bold text-gray-800">Crypto</p>
                <div className="text-gray-400">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-52-12a12,12,0,1,0,12,12A12,12,0,0,0,88,116Zm104,0a12,12,0,1,0,12,12A12,12,0,0,0,192,116Z"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">$15,820</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>33% of portfolio</span>
                  <span className="text-red-600">-3%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-orange-500" style={{width: '33%'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Holdings */}
          <section>
            <div className="flex items-center justify-between px-4 pb-3 pt-5">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Your Holdings</h2>
              <button className="text-sm font-medium text-[#7578EC]">View All</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-base font-medium text-gray-800">AAPL</p>
                      <span className="text-sm font-medium text-gray-600">$15,430</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Apple Inc. • 85 shares</span>
                      <span className="text-sm font-medium text-green-600">+8.2%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    ₿
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-base font-medium text-gray-800">BTC</p>
                      <span className="text-sm font-medium text-gray-600">$12,850</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Bitcoin • 0.28 BTC</span>
                      <span className="text-sm font-medium text-red-600">-2.1%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-base font-medium text-gray-800">TSLA</p>
                      <span className="text-sm font-medium text-gray-600">$8,920</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Tesla Inc. • 42 shares</span>
                      <span className="text-sm font-medium text-green-600">+15.7%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M240,128a15.79,15.79,0,0,1-10.5,15l-63.44,23.07L143,229.5a16,16,0,0,1-30,0L90,166.06,26.5,143a16,16,0,0,1,0-30L90,89.94,113,26.5a16,16,0,0,1,30,0L166.06,90,229.5,113A15.79,15.79,0,0,1,240,128Z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-base font-medium text-gray-800">SPY</p>
                      <span className="text-sm font-medium text-gray-600">$11,070</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">SPDR S&P 500 ETF • 25 shares</span>
                      <span className="text-sm font-medium text-green-600">+4.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Performance insight */}
          <section className="mt-8">
            <div className="rounded-2xl bg-gradient-to-r from-[#7578EC] to-[#EC4899] p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Portfolio Performance</h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">+7.3%</div>
                <div className="flex-1">
                  <p className="text-sm opacity-90 mb-1">This month</p>
                  <div className="w-full h-2 bg-white/30 rounded-full">
                    <div className="h-2 bg-white rounded-full" style={{width: '73%'}}></div>
                  </div>
                </div>
              </div>
              <p className="text-sm opacity-90 mt-3">Your portfolio is outperforming the S&P 500 by 2.1% this month.</p>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
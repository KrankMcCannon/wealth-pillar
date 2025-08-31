"use client";

import BottomNavigation from "../../../components/bottom-navigation";

export default function ReportsPage() {
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
            <h1 className="text-[#1F2937] text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Reports</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <main className="p-4 pb-24">
          {/* Monthly Overview */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Overview</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">$8,250</p>
                  <p className="text-xs text-green-600">+15% vs last month</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">$5,420</p>
                  <p className="text-xs text-red-600">+8% vs last month</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Net Savings</p>
                <p className="text-3xl font-bold text-blue-600">$2,830</p>
                <p className="text-xs text-blue-600">+22% vs last month</p>
              </div>
            </div>
          </section>

          {/* Spending by Category */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Spending by Category</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-gray-800">Housing</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">$1,200</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '35%'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">35% of total expenses</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-800">Groceries</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">$850</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '25%'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">25% of total expenses</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium text-gray-800">Transportation</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">$680</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '20%'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">20% of total expenses</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium text-gray-800">Entertainment</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">$450</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '13%'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">13% of total expenses</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-gray-800">Other</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">$240</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: '7%'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">7% of total expenses</p>
              </div>
            </div>
          </section>

          {/* Savings Progress */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Savings Progress</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-800">Annual Goal</span>
                <span className="text-sm font-bold text-gray-900">$15,000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-green-500 h-3 rounded-full" style={{width: '68%'}}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">$10,200 saved</span>
                <span className="text-gray-600">68% complete</span>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#7578EC] text-white">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,136H40V56H216V176ZM104,120v24a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm32-16v40a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32-16v56a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Export Report</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Set Goals</span>
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "../../../components/bottom-navigation";
import { investmentService } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { EnhancedHolding, PortfolioData, type InvestmentHolding } from "@/lib/types";

export default function InvestmentsPage() {
  const router = useRouter();
  const [investments, setInvestments] = useState<InvestmentHolding[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const investmentsData = await investmentService.getAll();
        setInvestments(investmentsData);
      } catch (error) {
        console.error('Failed to load investments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Memoized calculations for portfolio data
  const portfolioData: PortfolioData = useMemo(() => {
    const totalValue = investments.reduce((sum: number, holding: InvestmentHolding) => {
      return sum + (holding.quantity * holding.current_price);
    }, 0);
    
    const totalCost = investments.reduce((sum: number, holding: InvestmentHolding) => {
      return sum + (holding.quantity * holding.purchase_price);
    }, 0);
    
    const gainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      gainLoss,
      gainLossPercent,
      holdings: investments.map((holding: InvestmentHolding): EnhancedHolding => {
        const currentValue = holding.quantity * holding.current_price;
        const purchaseValue = holding.quantity * holding.purchase_price;
        const individualGain = currentValue - purchaseValue;
        const individualGainPercent = purchaseValue > 0 ? (individualGain / purchaseValue) * 100 : 0;
        
        return {
          ...holding,
          currentValue,
          gainLoss: individualGain,
          gainLossPercent: individualGainPercent
        };
      })
    };
  }, [investments]);

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC'}}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7578EC]"></div>
        </div>
      ) : (
        <>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button 
              className="text-[#1F2937] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-[#EFF2FE] transition-colors"
              onClick={() => router.push('/dashboard')}
            >
              <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 className="text-[#1F2937] text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Investimenti</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <main className="p-4 pb-24">
          {/* Portfolio Summary */}
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 mb-6">
            <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-base font-bold text-gray-800">Portafoglio Totale</p>
                <div className="text-gray-400">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-52-12a12,12,0,1,0,12,12A12,12,0,0,0,88,116Zm104,0a12,12,0,1,0,12,12A12,12,0,0,0,192,116Z"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(portfolioData.totalValue)}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>{portfolioData.gainLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(portfolioData.gainLoss))}</span>
                  <span className={portfolioData.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {portfolioData.gainLoss >= 0 ? '+' : ''}{portfolioData.gainLossPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div 
                    className={`h-2 rounded-full ${portfolioData.gainLoss >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{width: `${Math.min(Math.abs(portfolioData.gainLossPercent), 100)}%`}}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-base font-bold text-gray-800">Azioni</p>
                <div className="text-gray-400">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-52-12a12,12,0,1,0,12,12A12,12,0,0,0,88,116Zm104,0a12,12,0,1,0,12,12A12,12,0,0,0,192,116Z"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">$32,450</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>67% del portafoglio</span>
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
                  <span>33% del portafoglio</span>
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
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Le Tue Partecipazioni</h2>
              <button className="text-sm font-medium text-[#7578EC]">Visualizza Tutte</button>
            </div>
            <div className="space-y-3">
              {portfolioData.holdings.length > 0 ? (
                portfolioData.holdings.map((holding: EnhancedHolding, index: number) => (
                  <div key={holding.id || index} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                          <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-base font-medium text-gray-800">{holding.symbol}</p>
                          <span className="text-sm font-medium text-gray-600">{formatCurrency(holding.currentValue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{holding.name} • {holding.quantity} azioni</span>
                          <span className={`text-sm font-medium ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nessuna partecipazione trovata</p>
                </div>
              )}
            </div>
          </section>

          {/* Performance insight */}
          <section className="mt-8">
            <div className="rounded-2xl bg-gradient-to-r from-[#7578EC] to-[#EC4899] p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Performance del Portafoglio</h3>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${portfolioData.gainLoss >= 0 ? '' : 'text-red-200'}`}>
                  {portfolioData.gainLoss >= 0 ? '+' : ''}{portfolioData.gainLossPercent.toFixed(1)}%
                </div>
                <div className="flex-1">
                  <p className="text-sm opacity-90 mb-1">Questo mese</p>
                  <div className="w-full h-2 bg-white/30 rounded-full">
                    <div 
                      className="h-2 bg-white rounded-full" 
                      style={{width: `${Math.min(Math.abs(portfolioData.gainLossPercent), 100)}%`}}
                    ></div>
                  </div>
                </div>
              </div>
              <p className="text-sm opacity-90 mt-3">
                {portfolioData.gainLoss >= 0 
                  ? `Il tuo portafoglio sta superando l'S&P 500 del ${(portfolioData.gainLossPercent - 5).toFixed(1)}% questo mese.`
                  : `Il tuo portafoglio sta sottoperformando rispetto all'S&P 500 questo mese.`
                }
              </p>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
        </>
      )}
    </div>
  );
}
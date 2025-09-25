"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "../../../components/bottom-navigation";
import { SectionHeader } from "@/components/section-header";
import UserSelector from "@/components/user-selector";
import { useInvestments, usePortfolioData, useUserSelection } from "@/hooks";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, PieChart } from "lucide-react";
import { EnhancedHolding, PortfolioData, type InvestmentHolding } from "@/lib/types";

export default function InvestmentsPage() {
  const router = useRouter();
  const { data: investments = [], isLoading: investmentsLoading } = useInvestments();

  // Use centralized user selection
  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading
  } = useUserSelection();

  // Get portfolio data for the selected user
  const { data: portfolioDataFromApi, isLoading: portfolioLoading } = usePortfolioData(
    selectedViewUserId === 'all' ? (currentUser?.id || '') : selectedViewUserId
  );


  // Filter investments based on selected user/group
  const filteredInvestments = useMemo(() => {
    if (!currentUser) return [];

    if (selectedViewUserId === 'all') {
      return investments;
    }

    return investments.filter(investment => investment.user_id === selectedViewUserId);
  }, [investments, selectedViewUserId, currentUser]);

  // Memoized calculations for portfolio data
  const portfolioData: PortfolioData = useMemo(() => {
    // Use API data if available, otherwise calculate from filtered investments
    if (portfolioDataFromApi && selectedViewUserId !== 'all') {
      return portfolioDataFromApi;
    }

    const totalValue = filteredInvestments.reduce((sum: number, holding: InvestmentHolding) => {
      return sum + (holding.quantity * holding.current_price);
    }, 0);

    const totalCost = filteredInvestments.reduce((sum: number, holding: InvestmentHolding) => {
      return sum + (holding.quantity * holding.purchase_price);
    }, 0);

    const gainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      gainLoss,
      gainLossPercent,
      holdings: filteredInvestments.map((holding: InvestmentHolding): EnhancedHolding => {
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
  }, [filteredInvestments, portfolioDataFromApi, selectedViewUserId]);

  // Helper function to determine asset type based on symbol
  const getAssetType = (symbol: string): 'stock' | 'crypto' => {
    const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'MATIC', 'LINK', 'UNI'];
    return cryptoSymbols.includes(symbol.toUpperCase()) ? 'crypto' : 'stock';
  };

  // Calculate breakdown by asset type
  const assetBreakdown = useMemo(() => {
    const stocksValue = filteredInvestments
      .filter(holding => getAssetType(holding.symbol) === 'stock')
      .reduce((sum, holding) => sum + (holding.quantity * holding.current_price), 0);

    const cryptoValue = filteredInvestments
      .filter(holding => getAssetType(holding.symbol) === 'crypto')
      .reduce((sum, holding) => sum + (holding.quantity * holding.current_price), 0);

    const stocksCost = filteredInvestments
      .filter(holding => getAssetType(holding.symbol) === 'stock')
      .reduce((sum, holding) => sum + (holding.quantity * holding.purchase_price), 0);

    const cryptoCost = filteredInvestments
      .filter(holding => getAssetType(holding.symbol) === 'crypto')
      .reduce((sum, holding) => sum + (holding.quantity * holding.purchase_price), 0);

    const stocksGainPercent = stocksCost > 0 ? ((stocksValue - stocksCost) / stocksCost) * 100 : 0;
    const cryptoGainPercent = cryptoCost > 0 ? ((cryptoValue - cryptoCost) / cryptoCost) * 100 : 0;

    const totalValue = portfolioData.totalValue;
    const stocksPercentage = totalValue > 0 ? (stocksValue / totalValue) * 100 : 0;
    const cryptoPercentage = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;

    return {
      stocks: {
        value: stocksValue,
        percentage: stocksPercentage,
        gainPercent: stocksGainPercent
      },
      crypto: {
        value: cryptoValue,
        percentage: cryptoPercentage,
        gainPercent: cryptoGainPercent
      }
    };
  }, [filteredInvestments, portfolioData.totalValue]);

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC'}}>
      {investmentsLoading || userSelectionLoading || portfolioLoading ? (
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

        <UserSelector
          users={users}
          currentUser={currentUser}
          selectedGroupFilter={selectedViewUserId}
          onGroupFilterChange={updateViewUserId}
        />

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
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(assetBreakdown.stocks.value)}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>{Math.round(assetBreakdown.stocks.percentage)}% del portafoglio</span>
                  <span className={assetBreakdown.stocks.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {assetBreakdown.stocks.gainPercent >= 0 ? '+' : ''}{assetBreakdown.stocks.gainPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-blue-500" style={{width: `${Math.round(assetBreakdown.stocks.percentage)}%`}}></div>
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
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(assetBreakdown.crypto.value)}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>{Math.round(assetBreakdown.crypto.percentage)}% del portafoglio</span>
                  <span className={assetBreakdown.crypto.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {assetBreakdown.crypto.gainPercent >= 0 ? '+' : ''}{assetBreakdown.crypto.gainPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-orange-500" style={{width: `${Math.round(assetBreakdown.crypto.percentage)}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Holdings */}
          <section>
            <SectionHeader
              title="Le Tue Partecipazioni"
              icon={PieChart}
              iconClassName="text-blue-600"
              className="px-4 pb-3 pt-5"
            >
              <button className="text-sm font-medium text-[#7578EC]">Visualizza Tutte</button>
            </SectionHeader>
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
              <SectionHeader
                title="Performance del Portafoglio"
                icon={BarChart3}
                iconClassName="text-white"
                className="mb-2 text-white"
              />
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

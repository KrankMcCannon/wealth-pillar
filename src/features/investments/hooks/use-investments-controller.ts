/**
 * Investments Controller Hook
 * Extracts ALL business logic from investments/page.tsx
 * Follows MVC pattern established in useTransactionsController
 *
 * Responsibilities:
 * 1. Data fetching (investments, portfolio data)
 * 2. UI state management
 * 3. Business logic (portfolio calculations, asset breakdown)
 * 4. Action handlers (navigation)
 */

'use client';

import { EnhancedHolding, InvestmentHolding, PortfolioData, useInvestments, usePortfolioData, useUserSelection } from '@/lib';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * Asset breakdown by type (stocks vs crypto)
 */
interface AssetBreakdown {
  stocks: {
    value: number;
    percentage: number;
    gainPercent: number;
  };
  crypto: {
    value: number;
    percentage: number;
    gainPercent: number;
  };
}

/**
 * Helper function to determine asset type based on symbol
 */
function getAssetType(symbol: string): 'stock' | 'crypto' {
  const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'MATIC', 'LINK', 'UNI'];
  return cryptoSymbols.includes(symbol.toUpperCase()) ? 'crypto' : 'stock';
}

export function useInvestmentsController() {
  const router = useRouter();

  // ========================================
  // DATA FETCHING
  // ========================================
  const { data: investments = [], isLoading: investmentsLoading } = useInvestments();

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

  // ========================================
  // COMPUTED DATA
  // ========================================

  // Filter investments based on selected user/group
  const filteredInvestments = useMemo(() => {
    if (!currentUser) return [];

    if (selectedViewUserId === 'all') {
      return investments;
    }

    return investments.filter(investment => investment.user_id === selectedViewUserId);
  }, [investments, selectedViewUserId, currentUser]);

  // Calculate portfolio data
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

  // Calculate breakdown by asset type
  const assetBreakdown: AssetBreakdown = useMemo(() => {
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

  // ========================================
  // LOADING STATE
  // ========================================
  const isLoading = investmentsLoading || userSelectionLoading || portfolioLoading;

  // ========================================
  // ACTION HANDLERS
  // ========================================

  const handleBackClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // ========================================
  // RETURN API
  // ========================================
  return {
    // Raw Data
    currentUser,
    selectedViewUserId,
    users,

    // Computed Data
    portfolioData,
    assetBreakdown,

    // Loading State
    isLoading,

    // State Setters
    updateViewUserId,

    // Actions
    handleBackClick,
  };
}

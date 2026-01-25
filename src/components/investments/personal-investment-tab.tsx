"use client";

import { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShareSelector } from './share-selector';
import { MetricCard, MetricGrid } from "@/components/ui/layout";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

export interface Investment {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  shares_acquired: number;
  currentPrice?: number;
  currentValue?: number;
  currency: string;
  tax_paid?: number;
  totalPaid?: number;
  totalCost?: number;
  totalGain?: number;
  net_earn?: number;
  created_at: Date | string | null;
}

interface PersonalInvestmentTabProps {
  investments: Investment[];
  summary: {
    totalInvested: number;
    totalTaxPaid?: number;
    totalCost?: number;
    totalPaid?: number;
    totalCurrentValue: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
  indexData?: { datetime: string; close: string }[];
  historicalData?: { date: string; value: number }[];
  currentIndex?: string;
}

export function PersonalInvestmentTab({ investments, summary, indexData, historicalData, currentIndex = 'SPY' }: PersonalInvestmentTabProps) {
  const benchmarkAnchorId = 'benchmark-chart';

  const handleBenchmarkChange = (symbol: string) => {
    if (symbol && symbol !== currentIndex) {
      const nextSymbol = symbol.toUpperCase();
      const url = `?index=${encodeURIComponent(nextSymbol)}#${benchmarkAnchorId}`;
      window.location.assign(url);
    }
  };

  // Prepare data for "Personal Forecast"
  const forecastData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const data = [];

    // Calculate per-investment CAGR or simple rate
    const investmentsWithRate = investments.map(inv => {
      const start = new Date(inv.created_at || new Date());
      const now = new Date();
      // Years held, minimum 0.1 to avoid extreme rates
      const yearsHeld = Math.max(0.1, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

      const investedBase = inv.totalPaid ?? inv.totalCost ?? Number(inv.amount);

      let annualRate = 0;
      if (investedBase > 0 && (inv.currentValue || 0) > 0) {
        annualRate = Math.pow((inv.currentValue || 0) / investedBase, 1 / yearsHeld) - 1;
      }

      // Clamp unrealistic rates/fallback
      if (yearsHeld < 0.25) annualRate = 0.07;

      return {
        ...inv,
        annualRate,
        initialForForecast: inv.currentValue || 0
      };
    });

    for (let i = 0; i <= 10; i++) {
      let yearTotal = 0;

      investmentsWithRate.forEach(inv => {
        // Compound: Current * (1+r)^t (Reinvest always implied now)
        yearTotal += inv.initialForForecast * Math.pow(1 + inv.annualRate, i);
      });

      data.push({
        year: currentYear + i,
        amount: Math.round(yearTotal)
      });
    }
    return data;
  }, [investments]);

  const investmentMetrics = useMemo(() => {
    return investments.map((inv) => {
      const totalPaid = inv.totalPaid ?? inv.totalCost ?? (Number(inv.amount) + (Number(inv.tax_paid) || 0));
      const currentValue = Number(inv.currentValue || 0);
      const totalGain = inv.totalGain ?? (currentValue - totalPaid);
      return {
        ...inv,
        totalPaid,
        totalGain,
        currentValue,
      };
    });
  }, [investments]);

  const isPositiveReturn = summary.totalReturn >= 0;

  return (
    <div className="space-y-8">
      {/* Metrics Row - Using MetricCard/MetricGrid (Reports Style) */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Valore Attuale"
          icon={<Wallet className="w-4 h-4" />}
          iconColor="accent"
          labelTone="variant"
          value={summary.totalCurrentValue}
          valueType="income" // Using 'income' style for current value (usually bold/colored) or 'neutral'
          valueSize="xl"
          description={
            <span className={isPositiveReturn ? "text-emerald-600" : "text-rose-600"}>
              {isPositiveReturn ? '+' : ''}
              {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(summary.totalReturn)}
              {' '}
              ({summary.totalReturnPercent.toFixed(2)}%)
            </span>
          }
          variant="highlighted"
        />

        <MetricCard
          label="Investito"
          icon={<PiggyBank className="w-4 h-4" />}
          iconColor="accent"
          labelTone="variant"
          value={summary.totalInvested}
          valueType="neutral"
          valueSize="xl"
          description="Costo quote"
          variant="default"
        />

        <MetricCard
          label="Tasse Pagate"
          icon={<TrendingDown className="w-4 h-4" />}
          iconColor="destructive"
          labelTone="variant"
          value={summary.totalTaxPaid || 0}
          valueType="expense"
          valueSize="xl"
          description="Bollo + commissioni"
          variant="danger"
        />

        <MetricCard
          label="Totale Pagato"
          icon={<TrendingUp className="w-4 h-4" />}
          iconColor="muted"
          labelTone="variant"
          value={summary.totalPaid ?? summary.totalCost ?? 0}
          valueType="neutral"
          valueSize="xl"
          description="Investito + tasse"
          variant="default"
        />
      </MetricGrid>

      {/* Charts Row */}
      <div className="grid gap-8 grid-cols-1">
        {/* Historical Performance Chart */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl text-primary">Andamento Storico</CardTitle>
            <CardDescription className="text-primary/70">Valore effettivo del portafoglio nel tempo</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {historicalData && historicalData.length > 0 ? (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis
                      dataKey="date"
                      stroke="#7678E4"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      minTickGap={30}
                      dy={10}
                    />
                    <YAxis
                      stroke="#7678E4"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${new Intl.NumberFormat('it-IT', { notation: 'compact', compactDisplay: 'short' }).format(value)}€`}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a' }}
                      formatter={(value) => [new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0), "Valore"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHistory)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[350px] items-center justify-center text-primary/50 bg-primary/5 rounded-lg">
                Dati storici non sufficienti
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forecast Chart */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl text-primary">Previsione Portafoglio (10 Anni)</CardTitle>
            <CardDescription className="text-primary/70">Basato sul rendimento storico reale</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis
                    dataKey="year"
                    stroke="#7678E4"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#7678E4"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${new Intl.NumberFormat('it-IT', { notation: 'compact', compactDisplay: 'short' }).format(value)}€`}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a' }}
                    formatter={(value) => [new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0), "Valore"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Benchmark / Index Chart */}
        <Card className="border-none shadow-md overflow-hidden" id={benchmarkAnchorId}>
          <CardHeader className="px-6 pt-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-primary">Benchmark</CardTitle>
                <CardDescription className="text-primary/70">Confronta con {currentIndex}</CardDescription>
              </div>
              <div className="w-full md:w-auto min-w-[200px]">
                <ShareSelector
                  value={currentIndex}
                  onChange={handleBenchmarkChange}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {indexData && indexData.length > 0 ? (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...indexData].reverse()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis
                      dataKey="datetime"
                      minTickGap={40}
                      tickFormatter={(val) => val.split(' ')[0]}
                      stroke="#7678E4"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#7678E4"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => new Intl.NumberFormat('it-IT', { notation: 'compact', compactDisplay: 'short' }).format(value)}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a' }}
                      formatter={(value) =>
                        new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0)
                      }
                    />
                    <Line type="monotone" dataKey="close" stroke="#0ea5e9" dot={false} strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[350px] items-center justify-center text-primary/50 bg-primary/5 rounded-lg">
                Dati non disponibili
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="px-6 pt-6 border-b bg-primary/5">
          <CardTitle className="text-xl text-primary">Le Tue Partecipazioni</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {investments.length > 0 ? (
            <div className="divide-y">
              {investmentMetrics.map((inv) => {
                return (
                  <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 px-4 hover:bg-primary/5 transition-colors duration-200">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-semibold text-lg text-primary">{inv.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {inv.symbol}
                        </span>
                        <span className="text-sm text-primary/60">•</span>
                        <span className="text-sm text-primary/60">{Number(inv.shares_acquired)} quote</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 bg-primary/5 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                      <p className="font-bold text-xl text-primary">
                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: inv.currency }).format(inv.currentValue || 0)}
                      </p>
                      <div className="flex flex-row sm:flex-col justify-between sm:items-end gap-x-4">
                        <p className="text-xs text-primary/60 mt-1">
                          Pagato: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: inv.currency }).format(inv.totalPaid)}
                        </p>
                        <p className={`text-sm font-medium mt-1 ${inv.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {inv.totalGain >= 0 ? '+' : ''}
                          {new Intl.NumberFormat('it-IT', { style: 'currency', currency: inv.currency }).format(inv.totalGain)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-primary/60">
              Nessun investimento attivo.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

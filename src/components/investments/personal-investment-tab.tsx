import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface Investment {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  shares_acquired: number;
  currentPrice?: number;
  currentValue?: number;
  currency: string;
  net_earn?: number;
  created_at: Date | string | null;
}

interface PersonalInvestmentTabProps {
  investments: Investment[];
  summary: {
    totalInvested: number;
    totalCurrentValue: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
  indexData?: { datetime: string; close: string }[];
  currentIndex?: string;
}

export function PersonalInvestmentTab({ investments, summary, indexData, currentIndex = 'SPY' }: PersonalInvestmentTabProps) {
  const router = useRouter();
  const [reinvest, setReinvest] = useState(true);

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

      let annualRate = 0;
      if (Number(inv.amount) > 0 && (inv.currentValue || 0) > 0) {
        annualRate = Math.pow((inv.currentValue || 0) / Number(inv.amount), 1 / yearsHeld) - 1;
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
        if (reinvest) {
          // Compound: Current * (1+r)^t
          yearTotal += inv.initialForForecast * Math.pow(1 + inv.annualRate, i);
        } else {
          // Payout: Capital stays + accumulated simple return
          yearTotal += inv.initialForForecast + (inv.initialForForecast * inv.annualRate * i);
        }
      });

      data.push({
        year: currentYear + i,
        amount: Math.round(yearTotal)
      });
    }
    return data;
  }, [investments, reinvest]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(summary.totalCurrentValue)}
            </div>
            <p className="text-xs text-primary">
              {summary.totalReturn >= 0 ? '+' : ''}
              {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(summary.totalReturn)}
              {' '}
              ({summary.totalReturnPercent.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>

        <Card className="pt-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investito Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(summary.totalInvested)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="pt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Previsione Portafoglio (10 Anni)</CardTitle>
                <CardDescription className="text-primary">Basato sul rendimento storico reale</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="reinvest" checked={reinvest} onCheckedChange={setReinvest} />
                <Label htmlFor="reinvest">Accumulo</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] w-full min-w-0 py-6 pl-0">
            <div style={{ width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ left: -15, right: 10 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" stroke="#3b82f6" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#3b82f6" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value: any) => [new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value as number), "Valore"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="pt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Indice di Trading</CardTitle>
              <CardDescription className="text-primary">Confronta con {currentIndex}</CardDescription>
            </div>
            <Select
              defaultValue={currentIndex}
              onValueChange={(val) => {
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('index', val);
                router.push(`?${searchParams.toString()}`);
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Indice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPY">S&P 500</SelectItem>
                <SelectItem value="QQQ">Nasdaq</SelectItem>
                <SelectItem value="DIA">Dow Jones</SelectItem>
                <SelectItem value="BTC/USD">Bitcoin</SelectItem>
                <SelectItem value="EUR/USD">EUR/USD</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[300px] w-full min-w-0 p-6 pl-0">
            {indexData && indexData.length > 0 ? (
              <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...indexData].reverse()} margin={{ left: -15, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="datetime" minTickGap={30} tickFormatter={(val) => val.split(' ')[0]} stroke="#3b82f6" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#3b82f6" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-primary">
                Dati non disponibili
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      <Card className="pt-4">
        <CardHeader>
          <CardTitle>Le Tue Partecipazioni</CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length > 0 ? (
            <div className="space-y-4">
              {investments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between border-b p-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{inv.name}</p>
                    <p className="text-sm text-primary">{inv.symbol} • {Number(inv.shares_acquired)} quote</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: inv.currency }).format(inv.currentValue || 0)}
                    </p>
                    <p className={`text-sm ${(inv.currentValue || 0) - Number(inv.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(inv.currentValue || 0) - Number(inv.amount) >= 0 ? '+' : ''}
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: inv.currency }).format((inv.currentValue || 0) - Number(inv.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-primary">
              Nessun investimento attivo.
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
}

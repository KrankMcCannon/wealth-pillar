"use client";

import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { investmentsStyles } from "@/features/investments/theme/investments-styles";

interface InvestmentHistoryChartProps {
  data: { date: string; value: number }[];
}

export function InvestmentHistoryChart({ data }: InvestmentHistoryChartProps) {
  const hasData = data && data.length > 0;

  return (
    <Card className={investmentsStyles.card.root}>
      <CardHeader className={investmentsStyles.card.header}>
        <CardTitle className={investmentsStyles.card.title}>Andamento Storico</CardTitle>
        <CardDescription className={investmentsStyles.card.description}>Valore effettivo del portafoglio nel tempo</CardDescription>
      </CardHeader>
      <CardContent className={investmentsStyles.card.content}>
        {hasData ? (
          <div className={investmentsStyles.charts.container}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <div className={investmentsStyles.charts.fallback}>
            Dati storici non sufficienti
          </div>
        )}
      </CardContent>
    </Card>
  );
}

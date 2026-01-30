"use client";

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShareSelector } from './share-selector';
import { investmentsStyles } from "@/features/investments/theme/investments-styles";

interface BenchmarkChartProps {
  indexData?: Array<{ datetime?: string; time?: string; date?: string; close: string | number }>;
  currentIndex: string;
  onBenchmarkChange: (symbol: string) => void;
  anchorId?: string;
}

export function BenchmarkChart({ indexData, currentIndex, onBenchmarkChange, anchorId }: Readonly<BenchmarkChartProps>) {
  const hasData = indexData && indexData.length > 0;
  const sortedData = hasData ? [...indexData].reverse() : [];

  return (
    <Card className={investmentsStyles.card.root} id={anchorId}>
      <CardHeader className="px-6 pt-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className={investmentsStyles.card.title}>Benchmark</CardTitle>
            <CardDescription className={investmentsStyles.card.description}>Confronta con {currentIndex}</CardDescription>
          </div>
          <div className="w-full md:w-auto min-w-[200px]">
            <ShareSelector
              value={currentIndex}
              onChange={onBenchmarkChange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className={investmentsStyles.card.content}>
        {hasData ? (
          <div className={investmentsStyles.charts.container}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <div className={investmentsStyles.charts.fallback}>
            Dati non disponibili
          </div>
        )}
      </CardContent>
    </Card>
  );
}

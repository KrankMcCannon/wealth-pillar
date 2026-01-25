"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SandboxForecastTab() {
  const [amount, setAmount] = useState<number>(1000);
  const [years, setYears] = useState<number>(10);
  const [rate, setRate] = useState<number>(7);

  const forecastData = useMemo(() => {
    const data = [];
    let current = amount;
    const r = rate / 100;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i <= years; i++) {
      data.push({
        year: currentYear + i,
        amount: Math.round(current)
      });
      current = current * (1 + r);
    }
    return data;
  }, [amount, years, rate]);

  return (
    <div className="space-y-8">
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="px-6 pt-6 border-b bg-muted/10">
          <CardTitle className="text-xl">Sandbox Previsionale</CardTitle>
          <CardDescription className="text-foreground/70">Simula la crescita di un investimento nel tempo modificando i parametri qui sotto.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-8 md:grid-cols-3 p-8 bg-card">
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-sm font-medium text-primary/80">Importo Iniziale (€)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="font-medium text-lg h-12 text-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="rate" className="text-sm font-medium text-primary/80">Rendimento Annuo (%)</Label>
              <Input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="font-medium text-lg h-12 text-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="years" className="text-sm font-medium text-primary/80">Durata (Anni)</Label>
              <Input
                id="years"
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="font-medium text-lg h-12 text-primary"
              />
            </div>
          </div>

          <div className="p-6 border-t">
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(value: any) => [new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value), "Valore"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

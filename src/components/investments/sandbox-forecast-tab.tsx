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
    <div className="space-y-6">
      <Card className="pt-4">
        <CardHeader>
          <CardTitle>Sandbox Previsionale</CardTitle>
          <CardDescription className="text-primary">Simula la crescita di un investimento nel tempo.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Importo Iniziale (€)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rendimento Annuo (%)</Label>
              <Input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years">Durata (Anni)</Label>
              <Input
                id="years"
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="h-[400px] w-full py-6 pl-0">
            <div style={{ width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ left: -15, right: 10 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" stroke="#3b82f6" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#3b82f6" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value: any) => [new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value), "Valore"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

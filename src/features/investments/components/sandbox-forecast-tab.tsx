'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { investmentsStyles } from '@/features/investments/theme/investments-styles';
import {
  investmentChartColors,
  rechartsAnimationOff,
  rechartsSandboxInitialDimension,
  rechartsTooltipContentStyle,
  rechartsTooltipItemStyle,
} from './investment-chart-theme';
import { InvestmentChartContainer } from './investment-chart-container';

const MAX_FORECAST_AMOUNT = 1e12;
const MAX_FORECAST_YEARS = 80;
const MIN_FORECAST_YEARS = 1;

export function clampAmount(raw: string, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_FORECAST_AMOUNT, Math.max(0, n));
}

export function clampYears(raw: string, fallback: number): number {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_FORECAST_YEARS, Math.max(MIN_FORECAST_YEARS, n));
}

export function clampRate(raw: string, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(50, Math.max(-50, n));
}

export function buildForecastSeries(amount: number, years: number, rate: number) {
  const data: Array<{ year: number; amount: number }> = [];
  let current = amount;
  const r = rate / 100;
  const currentYear = new Date().getFullYear();

  for (let i = 0; i <= years; i++) {
    data.push({
      year: currentYear + i,
      amount: Math.round(current),
    });
    current = current * (1 + r);
  }
  return data;
}

export function SandboxForecastTab() {
  const t = useTranslations('Investments.SandboxTab');
  const locale = useLocale();
  const titleId = useId();
  const chartSummaryId = useId();
  const [amount, setAmount] = useState<number>(1000);
  const [years, setYears] = useState<number>(10);
  const [rate, setRate] = useState<number>(7);

  const forecastData = useMemo(
    () => buildForecastSeries(amount, years, rate),
    [amount, years, rate]
  );

  const firstForecast = forecastData[0];
  const lastForecast = forecastData[forecastData.length - 1];
  const chartSrSummary =
    firstForecast && lastForecast
      ? t('chartDataSummary', {
          startYear: firstForecast.year,
          endYear: lastForecast.year,
          value: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
            lastForecast.amount
          ),
        })
      : null;

  const onAmountChange = useCallback((raw: string) => {
    setAmount((prev) => clampAmount(raw, prev));
  }, []);

  const onYearsChange = useCallback((raw: string) => {
    setYears((prev) => clampYears(raw, prev));
  }, []);

  const onRateChange = useCallback((raw: string) => {
    setRate((prev) => clampRate(raw, prev));
  }, []);

  return (
    <div className={investmentsStyles.container}>
      <Card
        role="region"
        aria-labelledby={titleId}
        aria-describedby={chartSrSummary ? chartSummaryId : undefined}
        className={investmentsStyles.card.root}
      >
        <CardHeader className={investmentsStyles.card.headerWithBorder}>
          <CardTitle id={titleId} className={investmentsStyles.card.title}>
            {t('title')}
          </CardTitle>
          <CardDescription className={investmentsStyles.card.description}>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className={investmentsStyles.card.contentNoPadding}>
          <FieldGroup className={investmentsStyles.sandbox.fieldsWrap}>
            <Field>
              <FieldLabel htmlFor="amount">{t('fields.initialAmount')}</FieldLabel>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min={0}
                max={MAX_FORECAST_AMOUNT}
                step={1}
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                className={investmentsStyles.sandbox.input}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="rate">{t('fields.annualReturn')}</FieldLabel>
              <Input
                id="rate"
                type="number"
                inputMode="decimal"
                min={-50}
                max={50}
                step={0.1}
                value={rate}
                onChange={(e) => onRateChange(e.target.value)}
                className={investmentsStyles.sandbox.input}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="years">{t('fields.durationYears')}</FieldLabel>
              <Input
                id="years"
                type="number"
                inputMode="numeric"
                min={MIN_FORECAST_YEARS}
                max={MAX_FORECAST_YEARS}
                step={1}
                value={years}
                onChange={(e) => onYearsChange(e.target.value)}
                className={investmentsStyles.sandbox.input}
              />
            </Field>
          </FieldGroup>

          <div className={investmentsStyles.sandbox.chartSection}>
            {chartSrSummary ? (
              <p id={chartSummaryId} className="sr-only">
                {chartSrSummary}
              </p>
            ) : null}
            <InvestmentChartContainer
              className={investmentsStyles.charts.sandboxContainer}
              aria-hidden
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={rechartsSandboxInitialDimension}
              >
                <AreaChart data={forecastData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={investmentChartColors.areaAccent}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={investmentChartColors.areaAccent}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={investmentChartColors.grid}
                  />
                  <XAxis
                    dataKey="year"
                    stroke={investmentChartColors.axis}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke={investmentChartColors.axis}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const n = Number(value);
                      if (!Number.isFinite(n)) return '';
                      return `${new Intl.NumberFormat(locale, {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(n)}€`;
                    }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={rechartsTooltipContentStyle()}
                    itemStyle={rechartsTooltipItemStyle}
                    formatter={(value) => [
                      new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
                        Number(value ?? 0) || 0
                      ),
                      t('valueSeriesLabel'),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={investmentChartColors.areaAccent}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorForecast)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    {...rechartsAnimationOff}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </InvestmentChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

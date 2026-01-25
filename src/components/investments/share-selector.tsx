'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Search, Loader2, Globe, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  getShareRegionsAction,
  getShareAssetTypesAction,
  getSharesAction,
  getPopularSharesAction,
  fetchAndSaveNewShareAction,
} from '@/features/investments/actions/share-actions';
import type { Database } from '@/lib/types/database.types';

type AvailableShare = Database['public']['Tables']['available_shares']['Row'];

// Region display names
const REGION_LABELS: Record<string, string> = {
  'europe': '🇪🇺 Europa',
  'north_america': '🇺🇸 Nord America',
  'asia': '🇯🇵 Asia',
  'global': '🌍 Globale',
};

// Asset type display names
const ASSET_TYPE_LABELS: Record<string, string> = {
  'etf': '📊 ETF',
  'stock': '📈 Azioni',
  'etc': '🥇 ETC (Commodities)',
  'bond': '📜 Obbligazioni',
};

interface ShareSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

export function ShareSelector({ value, onChange, className }: ShareSelectorProps) {
  // State for cascading selection
  const [step, setStep] = useState<'region' | 'type' | 'share' | 'custom'>('region');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Data state
  const [regions, setRegions] = useState<string[]>([]);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [shares, setShares] = useState<AvailableShare[]>([]);
  const [popularShares, setPopularShares] = useState<AvailableShare[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  // Load regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      const result = await getShareRegionsAction();
      if (result.data) {
        setRegions(result.data);
      }
    };
    loadRegions();
  }, []);

  // Load popular shares on mount
  useEffect(() => {
    const loadPopular = async () => {
      const result = await getPopularSharesAction();
      if (result.data) {
        setPopularShares(result.data);
      }
    };
    loadPopular();
  }, []);

  // Load asset types when region changes
  useEffect(() => {
    if (selectedRegion) {
      const loadAssetTypes = async () => {
        setIsLoading(true);
        const result = await getShareAssetTypesAction(selectedRegion);
        if (result.data) {
          setAssetTypes(result.data);
        }
        setIsLoading(false);
      };
      loadAssetTypes();
    }
  }, [selectedRegion]);

  // Load shares when asset type changes
  useEffect(() => {
    if (selectedRegion && selectedType) {
      const loadShares = async () => {
        setIsLoading(true);
        const result = await getSharesAction(selectedRegion, selectedType);
        if (result.data) {
          setShares(result.data);
        }
        setIsLoading(false);
      };
      loadShares();
    }
  }, [selectedRegion, selectedType]);

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    setSelectedType('');
    setShares([]);
    setStep('type');
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('share');
  };

  const handleShareSelect = (share: AvailableShare) => {
    onChange(share.symbol);
    setIsOpen(false);
    resetSelection();
  };

  const handlePopularSelect = (share: AvailableShare) => {
    onChange(share.symbol);
    setIsOpen(false);
  };

  const resetSelection = () => {
    setStep('region');
    setSelectedRegion('');
    setSelectedType('');
    setShares([]);
  };

  const handleCustomSubmit = async () => {
    if (!customSymbol.trim()) return;

    setIsLoading(true);
    setCustomError(null);

    const result = await fetchAndSaveNewShareAction(
      customSymbol.toUpperCase(),
      selectedRegion || 'north_america',
      selectedType || 'stock'
    );

    if (result.error) {
      setCustomError(result.error);
    } else if (result.data) {
      onChange(result.data.symbol);
      setIsOpen(false);
      setCustomSymbol('');
      resetSelection();
    }

    setIsLoading(false);
  };

  const goBack = () => {
    if (step === 'custom') {
      setStep('share');
      setCustomError(null);
    } else if (step === 'share') {
      setStep('type');
      setShares([]);
    } else if (step === 'type') {
      setStep('region');
      setSelectedRegion('');
      setAssetTypes([]);
    }
  };

  // Find current selection name for display
  const currentShare = popularShares.find(s => s.symbol === value) ||
    shares.find(s => s.symbol === value);

  return (
    <div className={className}>
      {/* Current Value Display / Trigger */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {value ? (
            <span>{value} {currentShare ? `- ${currentShare.name}` : ''}</span>
          ) : (
            <span className="text-muted-foreground">Seleziona benchmark...</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <Card className="mt-2 absolute z-50 w-full max-w-md shadow-lg">
          <CardContent className="p-4">
            {/* Header with back button */}
            {step !== 'region' && (
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <Button variant="ghost" size="sm" onClick={goBack}>
                  ← Indietro
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedRegion && REGION_LABELS[selectedRegion]}
                  {selectedType && ` > ${ASSET_TYPE_LABELS[selectedType]}`}
                </span>
              </div>
            )}

            {/* Step 1: Region Selection */}
            {step === 'region' && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Seleziona Regione
                </h4>

                {/* Popular Shares Quick Access */}
                {popularShares.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">🔥 Più Popolari</p>
                    <div className="flex flex-wrap gap-2">
                      {popularShares.slice(0, 6).map(share => (
                        <Button
                          key={share.id}
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePopularSelect(share)}
                          className="text-xs"
                        >
                          {share.symbol}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  {regions.map(region => (
                    <Button
                      key={region}
                      variant="ghost"
                      className="justify-between h-12"
                      onClick={() => handleRegionSelect(region)}
                    >
                      <span>{REGION_LABELS[region] || region}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Asset Type Selection */}
            {step === 'type' && (
              <div className="space-y-3">
                <h4 className="font-medium">Tipo di Asset</h4>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {assetTypes.map(type => (
                      <Button
                        key={type}
                        variant="ghost"
                        className="justify-between h-12"
                        onClick={() => handleTypeSelect(type)}
                      >
                        <span>{ASSET_TYPE_LABELS[type] || type}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Share Selection */}
            {step === 'share' && (
              <div className="space-y-3">
                <h4 className="font-medium">Seleziona {ASSET_TYPE_LABELS[selectedType]}</h4>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="max-h-[250px] overflow-y-auto space-y-1">
                      {shares.map(share => (
                        <Button
                          key={share.id}
                          variant="ghost"
                          className="w-full justify-start h-auto py-3 px-3"
                          onClick={() => handleShareSelect(share)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{share.symbol}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                              {share.name}
                            </span>
                          </div>
                          {share.is_popular && (
                            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Popolare
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>

                    {/* Can't find option */}
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-primary underline-offset-4 hover:underline"
                      onClick={() => setStep('custom')}
                    >
                      Non trovi quello che cerchi? Aggiungi manualmente
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Custom Symbol Entry */}
            {step === 'custom' && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Aggiungi Simbolo
                </h4>
                <p className="text-xs text-muted-foreground">
                  Inserisci il simbolo del ticker (es. AAPL, VOO, VWCE.DE)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    placeholder="Es. AAPL"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCustomSubmit();
                    }}
                  />
                  <Button
                    onClick={handleCustomSubmit}
                    disabled={isLoading || !customSymbol.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Cerca'
                    )}
                  </Button>
                </div>
                {customError && (
                  <p className="text-xs text-red-500">{customError}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

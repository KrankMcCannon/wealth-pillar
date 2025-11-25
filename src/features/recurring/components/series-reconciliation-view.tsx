"use client";

import { useState } from "react";
import { Calendar, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { RecurringTransactionSeries } from "@/src/lib";
import { Badge, Card, Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui";
import { SectionHeader } from "@/src/components/layout";

interface SeriesReconciliationViewProps {
  series: RecurringTransactionSeries;
  className?: string;
}

export function SeriesReconciliationView({ series, className = "" }: SeriesReconciliationViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview");

  if (false) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!false) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8 text-muted-foreground">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <p className="font-medium text-black">Errore nel caricamento dei dati di riconciliazione</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <SectionHeader
        title={`Riconciliazione: ${series.description}`}
        subtitle={`Storico delle esecuzioni e pagamenti effettuati`}
        className="mb-6"
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg border-2 ${
            false ? "bg-primary/10 border-primary/20" : "bg-warning/10 border-warning/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {false ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-warning" />
            )}
            <span className={`font-medium ${false ? "text-primary" : "text-warning"}`}>Stato Serie</span>
          </div>
          <div className={`text-2xl font-bold ${false ? "text-primary" : "text-warning"}`}>{1}%</div>
          <div className={`text-sm ${false ? "text-primary" : "text-warning"}`}>Tasso di successo</div>
        </div>

        <div className="p-4 rounded-lg border-2 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">Esecuzioni</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {0}/{0}
          </div>
          <div className="text-sm text-primary">Effettuate/Previste</div>
        </div>

        <div className="p-4 rounded-lg border-2 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary/70" />
            <span className="font-medium text-primary">Importo Totale</span>
          </div>
          <div className="text-2xl font-bold text-primary">{0}</div>
          <div className="text-sm text-primary/70">Pagato finora</div>
        </div>
      </div>

      {/* Issues Alert */}
      {false && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="font-medium text-destructive">Problemi Rilevati</span>
          </div>
          <ul className="text-sm text-destructive space-y-1">
            {false && <li>• {0} pagamenti mancanti</li>}
            {false && (
              <li>
                • Differenza di importo: {Math.abs(0)}
                {false ? " in eccesso" : " in difetto"}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "transactions")}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="transactions">Transazioni ({0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary border-b border-primary/20 pb-2">Riepilogo Finanziario</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Importo per esecuzione:</span>
                  <span className="font-semibold">{0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Esecuzioni previste:</span>
                  <span className="font-semibold">{0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Totale previsto:</span>
                  <span className="font-semibold">{0}</span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Esecuzioni effettuate:</span>
                  <span className="font-semibold text-primary">{0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Totale pagato:</span>
                  <span className="font-semibold text-primary">{0}</span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Differenza:</span>
                  <span
                    className={`font-semibold ${0 === 0 ? "text-accent" : 0 > 0 ? "text-warning" : "text-destructive"}`}
                  >
                    {0 === 0 ? "Nessuna" : Math.abs(0)}
                    {0 > 0 && " (eccesso)"}
                    {0 < 0 && " (difetto)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary border-b border-primary/20 pb-2">Timeline Esecuzioni</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Prima esecuzione:</span>
                  <span className="font-semibold">{0 > 0 ? new Date().toLocaleDateString("it-IT") : "N/A"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Prossima prevista:</span>
                  <span className="font-semibold text-primary">
                    {new Date(series.due_date).toLocaleDateString("it-IT")}
                  </span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Frequenza:</span>
                  <span className="font-semibold">{series.frequency}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-primary">Transazioni Generate</h3>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {0} transazioni
              </Badge>
            </div>

            {0 > 0 ? (
              <div className="space-y-3">
                {[]
                  .sort(() => new Date().getTime() - new Date().getTime())
                  .map(() => (
                    <div
                      key={0}
                      className="flex items-center justify-between p-4 bg-card rounded-lg border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            "income" === "income" ? "bg-success/10" : "bg-destructive/10"
                          }`}
                        >
                          {"income" === "income" ? (
                            <TrendingUp className="w-5 h-5 text-success" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-primary">{""}</div>
                          <div className="text-sm text-primary/70">
                            {new Date().toLocaleDateString("it-IT")} • {""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${"income" === "income" ? "text-success" : "text-destructive"}`}>
                          {0}
                        </div>
                        <div className="text-xs text-primary/70">ID: {0}</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-primary/70">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-primary/30" />
                <p>Nessuna transazione generata</p>
                <p className="text-sm mt-1">Le transazioni generate da questa serie appariranno qui</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default SeriesReconciliationView;

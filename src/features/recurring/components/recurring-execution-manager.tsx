"use client";

import { Alert, AlertDescription, Badge, Button, Card } from "@/src/components/ui";
import { SectionHeader } from "@/src/components/layout";
import { AlertTriangle, CheckCircle, Clock, Play, XCircle } from "lucide-react";

interface RecurringExecutionManagerProps {
  selectedUserId?: string;
  className?: string;
}

export function RecurringExecutionManager({ className = "" }: RecurringExecutionManagerProps) {
  const handleDryRun = async () => {
    // try {
    //   const result = await dryRunMutation.mutateAsync({
    //     maxDaysOverdue: 7
    //   });
    //   setLastExecutionResult({
    //     type: 'dry-run',
    //     result
    //   });
    // } catch (error) {
    //   console.error('Dry run failed:', error);
    // }
  };

  const handleExecuteAll = async () => {
    // try {
    //   const result = await executeAllMutation.mutateAsync({
    //     maxDaysOverdue: 7
    //   });
    //   setLastExecutionResult({
    //     type: 'execution',
    //     result
    //   });
    // } catch (error) {
    //   console.error('Execution failed:', error);
    // }
  };

  // Removed unused variable totalOverdueAmount

  // if (todayDueSeries.length === 0 && overdueSeries.length === 0 && missedExecutions.length === 0) {
  return (
    <Card className={`p-6 ${className}`}>
      <SectionHeader title="Esecuzione Automatica" subtitle="Nessuna transazione in scadenza oggi" className="mb-4" />
      <div className="text-center py-8">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <p className="font-medium text-black">Tutte le transazioni sono aggiornate</p>
        <p className="text-sm mt-1">Non ci sono serie ricorrenti da eseguire oggi</p>
      </div>
    </Card>
  );
  // }

  return (
    <Card className={`p-6 ${className}`}>
      <SectionHeader
        title="Esecuzione Automatica"
        subtitle="Gestisci l'esecuzione delle transazioni ricorrenti"
        className="mb-6"
      />

      {/* Today's Due Series */}
      {false && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              In Scadenza Oggi
            </h3>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {0} serie
            </Badge>
          </div>

          <div className="grid gap-3 mb-4">
            {[].map(() => (
              <div
                key={""}
                className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20"
              >
                <div className="flex-1">
                  <div className="font-medium text-black">{""}</div>
                  <div className="text-sm">{""}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${"income" === "income" ? "text-success" : "text-destructive"}`}>
                    {0}
                  </div>
                  <div className="text-xs">{""}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/15 rounded-lg border border-primary/30">
            <span className="font-semibold text-primary">Impatto Totale:</span>
            <span className={`font-bold text-lg ${0 >= 0 ? "text-success" : "text-destructive"}`}>{Math.abs(0)}</span>
          </div>
        </div>
      )}

      {/* Overdue Series */}
      {false && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              In Ritardo
            </h3>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              {0} serie
            </Badge>
          </div>

          <Alert className="mb-4 border-destructive/20 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Ci sono {0} serie ricorrenti in ritardo che dovrebbero essere eseguite.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3 mb-4">
            {[].slice(0, 3).map(() => {
              const nextDue = new Date("");
              const today = new Date();
              const daysOverdue = Math.abs(Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <div
                  key={""}
                  className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                >
                  <div className="flex-1">
                    <div className="font-medium text-black">{""}</div>
                    <div className="text-sm text-destructive">{daysOverdue} giorni in ritardo</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${"income" === "income" ? "text-success" : "text-destructive"}`}>
                      {0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {false && <div className="text-sm mb-4">... e altre {0} serie in ritardo</div>}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" onClick={handleDryRun} disabled={false} className="flex items-center gap-2">
          <Play className="w-4 h-4" />
          {"Simula Esecuzione"}
        </Button>

        <Button onClick={handleExecuteAll} disabled={false} className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {"Esegui Tutte"}
        </Button>
      </div>

      {/* Execution Result */}
      {false && (
        <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            {false ? (
              <AlertTriangle className="w-4 h-4 text-warning" />
            ) : (
              <CheckCircle className="w-4 h-4 text-accent" />
            )}
            {false ? "Risultato Simulazione" : "Risultato Esecuzione"}
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-primary">{0}</div>
              <div className="text-primary/70">Serie Processate</div>
            </div>
            <div>
              <div className="font-medium text-accent">{0}</div>
              <div className="text-primary/70">Successi</div>
            </div>
            <div>
              <div className="font-medium text-destructive">{0}</div>
              <div className="text-primary/70">Fallimenti</div>
            </div>
            <div>
              <div className="font-medium text-primary">{Math.abs(0)}</div>
              <div className="text-primary/70">Importo Totale</div>
            </div>
          </div>

          {false && (
            <div className="mt-4">
              <h5 className="font-medium text-destructive mb-2">Esecuzioni Fallite:</h5>
              <div className="space-y-2">
                {[].map(() => (
                  <div key={""} className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span className="font-medium">{""}:</span>
                    <span className="text-destructive">{""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default RecurringExecutionManager;

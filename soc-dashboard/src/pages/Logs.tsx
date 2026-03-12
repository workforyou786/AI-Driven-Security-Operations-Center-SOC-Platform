import React, { useState } from "react";
import { useListLogs, useRunAnomalyDetection } from "@workspace/api-client-react";
import { Card, Button, Badge, Select } from "@/components/ui-elements";
import { formatSeverity } from "@/lib/utils";
import { Terminal, BrainCircuit, Play, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Logs() {
  const [logType, setLogType] = useState<any>("");
  const { data: logs, isLoading } = useListLogs({ type: logType || undefined, limit: 100 });
  const { mutate: runAnomaly, isPending: isRunningAnomaly } = useRunAnomalyDetection();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRunAnomaly = () => {
    runAnomaly(undefined, {
      onSuccess: (res) => {
        toast({
          title: "Detection Complete",
          description: `Analyzed ${res.logsAnalyzed} logs. Found ${res.anomaliesFound} anomalies.`,
          variant: res.anomaliesFound > 0 ? "destructive" : "default"
        });
        queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      }
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Security Logs</h1>
          <p className="text-muted-foreground text-sm">Raw ingestion stream with ML-powered anomaly detection.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select className="w-40 bg-card" value={logType} onChange={(e) => setLogType(e.target.value)}>
            <option value="">All Streams</option>
            <option value="auth">Auth</option>
            <option value="network">Network</option>
            <option value="firewall">Firewall</option>
            <option value="web">Web</option>
          </Select>
          <Button variant="cyan" className="gap-2" onClick={handleRunAnomaly} disabled={isRunningAnomaly}>
            {isRunningAnomaly ? <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" /> : <BrainCircuit className="h-4 w-4" />}
            Run ML Detection
          </Button>
        </div>
      </div>

      <Card className="flex-1 bg-[#0a0a0a] border-border/30 overflow-hidden flex flex-col font-mono shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
        <div className="flex-1 overflow-auto p-4 space-y-1.5 text-xs text-muted-foreground">
          {isLoading ? (
            <div className="text-primary animate-pulse flex items-center gap-2"><Terminal className="h-4 w-4" /> Establishing secure stream...</div>
          ) : logs?.length === 0 ? (
            <div>No logs found for selected criteria.</div>
          ) : (
            logs?.map((log) => (
              <div 
                key={log.id} 
                className={`flex items-start gap-4 p-1.5 rounded hover:bg-white/5 transition-colors ${log.isAnomaly ? 'bg-red-500/10 border-l-2 border-red-500' : ''}`}
              >
                <div className="w-36 flex-shrink-0 opacity-60">
                  {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                </div>
                <div className="w-20 flex-shrink-0">
                  <Badge variant="outline" className="text-[10px] h-5 border-border/50 text-foreground/70">
                    {log.type}
                  </Badge>
                </div>
                {log.severity && (
                  <div className="w-20 flex-shrink-0">
                    <span className={formatSeverity(log.severity).replace('bg-', 'text-').split(' ')[1]}>
                      [{log.severity.toUpperCase()}]
                    </span>
                  </div>
                )}
                <div className="flex-1 text-white/80 break-all">
                  {log.message}
                </div>
                {log.isAnomaly && (
                  <div className="flex items-center gap-1 text-red-400 font-bold px-2 bg-red-500/10 rounded">
                    <AlertTriangle className="h-3 w-3" /> Anomaly ({log.anomalyScore?.toFixed(2)})
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="h-8 bg-secondary/50 border-t border-border/50 flex items-center px-4 text-[10px] text-primary">
          <span className="flex h-2 w-2 relative mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          STREAM ACTIVE - {logs?.length || 0} RECORDS IN BUFFER
        </div>
      </Card>
    </div>
  );
}

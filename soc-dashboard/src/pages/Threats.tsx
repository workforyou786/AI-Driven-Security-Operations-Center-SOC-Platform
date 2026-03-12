import React, { useState } from "react";
import { useListThreats, useUpdateThreatStatus, useBlockIp } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select } from "@/components/ui-elements";
import { formatSeverity } from "@/lib/utils";
import { Search, Filter, ShieldOff, CheckCircle, Crosshair, Target, Clock, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Threats() {
  const [statusFilter, setStatusFilter] = useState<any>("");
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: threats, isLoading } = useListThreats({
    status: statusFilter || undefined,
    limit: 100
  });

  const { mutate: updateStatus, isPending: isUpdating } = useUpdateThreatStatus();
  const { mutate: blockIp, isPending: isBlocking } = useBlockIp();

  const handleUpdateStatus = (id: number, newStatus: any) => {
    updateStatus(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `Threat marked as ${newStatus}` });
          queryClient.invalidateQueries({ queryKey: ["/api/threats"] });
          if (selectedThreat?.id === id) setSelectedThreat({ ...selectedThreat, status: newStatus });
        }
      }
    );
  };

  const handleBlockIp = (ip: string, threatId: number) => {
    blockIp(
      { data: { ip, reason: `Automated block from Threat #${threatId}`, threatId, duration: '24h' } },
      {
        onSuccess: () => {
          toast({ title: "IP Blocked", description: `${ip} has been blocked for 24h` });
        }
      }
    );
  };

  return (
    <div className="flex h-full gap-6 relative">
      {/* Main Table */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedThreat ? 'lg:pr-[400px]' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Threats & Alerts</h1>
            <p className="text-muted-foreground text-sm">Investigate and respond to detected security events.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select 
              className="w-40 bg-card" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </Select>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col border-border/50">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Detected At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-32">Loading threats...</TableCell></TableRow>
                ) : threats?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground">No threats found.</TableCell></TableRow>
                ) : (
                  threats?.map((threat) => (
                    <TableRow 
                      key={threat.id} 
                      className={`cursor-pointer ${selectedThreat?.id === threat.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                      onClick={() => setSelectedThreat(threat)}
                    >
                      <TableCell className="text-muted-foreground">#{threat.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{threat.title}</TableCell>
                      <TableCell>
                        <Badge className={formatSeverity(threat.severity)}>{threat.severity}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{threat.sourceIp}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${threat.riskScore > 80 ? 'bg-destructive' : threat.riskScore > 50 ? 'bg-orange-500' : 'bg-primary'}`} 
                              style={{ width: `${threat.riskScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{threat.riskScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{threat.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {format(new Date(threat.detectedAt), 'MMM dd, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Side Panel (Details) */}
      {selectedThreat && (
        <div className="fixed right-6 top-24 bottom-6 w-[380px] bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl flex flex-col z-30 animate-in slide-in-from-right-8">
          <div className="p-4 border-b border-border/50 flex items-center justify-between bg-secondary/20">
            <h3 className="font-semibold text-lg text-white">Threat #{selectedThreat.id}</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedThreat(null)} className="h-8 w-8 rounded-full">✕</Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={formatSeverity(selectedThreat.severity)}>{selectedThreat.severity}</Badge>
                <Badge variant="outline" className="font-mono">{selectedThreat.type}</Badge>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{selectedThreat.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedThreat.description || "No description provided by detection engine."}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Crosshair className="h-3 w-3"/> Source</div>
                <div className="font-mono text-sm text-white break-all">{selectedThreat.sourceIp}</div>
              </div>
              <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Target className="h-3 w-3"/> Target</div>
                <div className="font-mono text-sm text-white break-all">{selectedThreat.targetHost || 'N/A'}</div>
              </div>
            </div>

            {selectedThreat.mitreTactic && (
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">MITRE ATT&CK Context</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-white font-mono mr-2">{selectedThreat.mitreId}</span>
                  {selectedThreat.mitreTactic}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/> Detection Timeline</h4>
              <div className="text-sm text-muted-foreground pl-6 border-l border-border ml-2 space-y-3 relative">
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                  <span className="text-white">{format(new Date(selectedThreat.detectedAt), 'MMM dd, yyyy HH:mm:ss')}</span>
                  <div className="text-xs mt-0.5">Initial Detection</div>
                </div>
              </div>
            </div>
            
            {selectedThreat.rawLog && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Raw Log Evidence</h4>
                <div className="bg-black/50 p-3 rounded-md border border-border/50 font-mono text-[10px] text-green-400 overflow-x-auto">
                  {selectedThreat.rawLog}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/50 bg-secondary/20 grid grid-cols-2 gap-2">
            {selectedThreat.status === 'open' && (
              <Button size="sm" variant="cyan" onClick={() => handleUpdateStatus(selectedThreat.id, 'investigating')} disabled={isUpdating}>
                Start Investigation
              </Button>
            )}
            {(selectedThreat.status === 'open' || selectedThreat.status === 'investigating') && (
              <>
                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus(selectedThreat.id, 'resolved')} disabled={isUpdating}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                </Button>
                <Button size="sm" variant="outline" className="border-dashed" onClick={() => handleUpdateStatus(selectedThreat.id, 'false_positive')} disabled={isUpdating}>
                  False Positive
                </Button>
              </>
            )}
            <Button size="sm" variant="destructive" className="col-span-2" onClick={() => handleBlockIp(selectedThreat.sourceIp, selectedThreat.id)} disabled={isBlocking}>
              <ShieldOff className="h-4 w-4 mr-1" /> Block Source IP
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

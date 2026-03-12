import React, { useState } from "react";
import { useListBlockedIps, useBlockIp } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/components/ui-elements";
import { ShieldOff, Lock, Unlock, Activity, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Response() {
  const { data: blockedIps, isLoading } = useListBlockedIps();
  const { mutate: blockIp, isPending } = useBlockIp();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("24h");

  const handleBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip || !reason) return;

    blockIp(
      { data: { ip, reason, duration: duration as any } },
      {
        onSuccess: (res) => {
          toast({ title: "Action Executed", description: res.message });
          setIp("");
          setReason("");
          queryClient.invalidateQueries({ queryKey: ["/api/response/blocked-ips"] });
        },
        onError: (err: any) => {
          toast({ title: "Failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">SOAR Capabilities</h1>
        <p className="text-muted-foreground text-sm">Security Orchestration, Automation, and Response actions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual Action Card */}
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldOff className="h-5 w-5" />
              Manual IP Block
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBlock} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">IP Address</label>
                <Input placeholder="e.g. 192.168.1.100" value={ip} onChange={(e) => setIp(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Reason</label>
                <Input placeholder="Why block this IP?" value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Duration</label>
                <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="1h">1 Hour</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="permanent">Permanent</option>
                </Select>
              </div>
              <Button type="submit" variant="destructive" className="w-full mt-2" disabled={isPending}>
                {isPending ? "Executing..." : "Execute Block Rule"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Blocklist Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Active Firewall Blocklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Blocked At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-32">Loading blocklist...</TableCell></TableRow>
                ) : blockedIps?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No active blocks.</TableCell></TableRow>
                ) : (
                  blockedIps?.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-mono text-red-400 font-semibold">{rule.ip}</TableCell>
                      <TableCell className="text-muted-foreground">{rule.reason}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(rule.blockedAt), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell><Badge variant="outline">{rule.duration}</Badge></TableCell>
                      <TableCell className="text-right">
                        {rule.isActive ? (
                          <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 cursor-pointer border-transparent">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

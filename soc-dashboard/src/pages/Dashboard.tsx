import React, { useState } from "react";
import { useGetAnalyticsSummary, useGetThreatTimeline, useGetThreatDistribution, useGetTopAttackers, useListThreats, useSimulateAttack } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input, Select } from "@/components/ui-elements";
import { formatSeverity } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, Activity, Target, Shield, Server, ArrowRight, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

const COLORS = {
  critical: "#e11d48",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  anomaly: "#a855f7",
  brute_force: "#f43f5e",
  sql_injection: "#d946ef",
  malware: "#8b5cf6",
  port_scan: "#06b6d4",
  ddos: "#ef4444",
  phishing: "#f59e0b"
};

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary();
  const { data: timeline } = useGetThreatTimeline();
  const { data: distribution } = useGetThreatDistribution();
  const { data: topAttackers } = useGetTopAttackers();
  const { data: recentThreats } = useListThreats({ limit: 5 });
  
  const { mutate: simulate, isPending: isSimulating } = useSimulateAttack();
  const { toast } = useToast();

  const [simType, setSimType] = useState("brute_force");

  const handleSimulate = () => {
    simulate({ data: { attackType: simType as any, intensity: "medium" } }, {
      onSuccess: (res) => {
        toast({
          title: "Attack Simulated",
          description: res.message,
          variant: "default",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Simulation Failed",
          description: err.message || "Unknown error",
          variant: "destructive",
        });
      }
    });
  };

  if (loadingSummary || !summary) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">SOC Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time threat intelligence and security posture.</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-2 rounded-lg border border-border shadow-lg">
          <Select className="w-40 h-9" value={simType} onChange={(e) => setSimType(e.target.value)}>
            <option value="brute_force">Brute Force</option>
            <option value="sql_injection">SQL Injection</option>
            <option value="port_scan">Port Scan</option>
            <option value="malware">Malware</option>
          </Select>
          <Button size="sm" onClick={handleSimulate} disabled={isSimulating} className="gap-2">
            <Zap className="h-4 w-4" />
            {isSimulating ? "Simulating..." : "Simulate Attack"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Threats" value={summary.openThreats.toString()} total={summary.totalThreats.toString()} icon={ShieldAlert} color="text-red-500" />
        <StatCard title="Open Incidents" value={summary.openIncidents.toString()} total={summary.totalIncidents.toString()} icon={Target} color="text-orange-500" />
        <StatCard title="Anomalies Detected" value={summary.anomaliesDetected.toString()} icon={Activity} color="text-purple-500" />
        <StatCard title="Blocked IPs" value={summary.blockedIps.toString()} icon={Shield} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Threat Timeline (24h)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.critical} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.critical} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.high} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.high} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="hour" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="critical" stroke={COLORS.critical} fillOpacity={1} fill="url(#colorCrit)" strokeWidth={2} />
                <Area type="monotone" dataKey="high" stroke={COLORS.high} fillOpacity={1} fill="url(#colorHigh)" strokeWidth={2} />
                <Area type="monotone" dataKey="medium" stroke={COLORS.medium} fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Threat Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="type"
                >
                  {(distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.type] || COLORS.low} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Threats']} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attackers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Top Attackers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Hits</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(topAttackers || []).slice(0,5).map((atk) => (
                  <TableRow key={atk.ip}>
                    <TableCell className="font-medium text-white">{atk.ip}</TableCell>
                    <TableCell>{atk.count}</TableCell>
                    <TableCell>
                      <Badge className={formatSeverity(atk.severity)}>{atk.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      {atk.isBlocked ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">Blocked</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Active</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Threats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Alerts</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => window.location.href = '/threats'}>
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {(recentThreats || []).map((threat) => (
                <div key={threat.id} className="flex items-start justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge className={formatSeverity(threat.severity)}>{threat.severity}</Badge>
                      <span className="font-semibold text-sm text-white">{threat.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-1">
                      <span>{threat.sourceIp}</span>
                      <span>→</span>
                      <span>{threat.targetHost || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">Score: <span className="text-white">{threat.riskScore}</span></span>
                    <span className="text-[10px] text-muted-foreground/70">{new Date(threat.detectedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, total, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground tracking-tight">{title}</p>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-white">{value}</div>
          {total && <div className="text-sm text-muted-foreground">/ {total}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

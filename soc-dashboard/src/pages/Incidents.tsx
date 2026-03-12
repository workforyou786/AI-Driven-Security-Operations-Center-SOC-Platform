import React from "react";
import { useListIncidents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from "@/components/ui-elements";
import { formatSeverity } from "@/lib/utils";
import { Plus, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export default function Incidents() {
  const { data: incidents, isLoading } = useListIncidents({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Incident Management</h1>
          <p className="text-muted-foreground text-sm">Track, coordinate, and resolve security incidents.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Incident
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-32">Loading incidents...</TableCell></TableRow>
              ) : incidents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-64 text-muted-foreground flex flex-col items-center justify-center">
                    <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    No active incidents. Systems are secure.
                  </TableCell>
                </TableRow>
              ) : (
                incidents?.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="font-mono text-muted-foreground">INC-{inc.id}</TableCell>
                    <TableCell className="font-medium text-white">{inc.title}</TableCell>
                    <TableCell><Badge className={formatSeverity(inc.severity)}>{inc.severity}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize border-primary/30 text-primary bg-primary/5">{inc.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {inc.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] text-white">
                            {inc.assignedTo.substring(0,2).toUpperCase()}
                          </div>
                          {inc.assignedTo}
                        </div>
                      ) : (
                        <span className="italic opacity-50">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(inc.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

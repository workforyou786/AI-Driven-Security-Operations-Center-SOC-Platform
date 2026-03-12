import { db } from "@workspace/db";
import { threatsTable, incidentsTable, securityLogsTable, blockedIpsTable } from "@workspace/db/schema";

function randomIp() {
  const known = [
    "192.168.1.105", "10.0.0.23", "172.16.5.88",
    "45.33.32.156", "198.51.100.42", "203.0.113.15",
    "185.220.101.45", "104.21.12.88", "91.108.4.12",
    "95.142.111.34", "193.32.126.231", "77.88.21.3",
  ];
  return known[Math.floor(Math.random() * known.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setTime(d.getTime() - n * 60 * 60 * 1000 - Math.random() * 30 * 60 * 1000);
  return d;
}

async function seed() {
  console.log("Seeding SOC database...");

  // Clear existing data
  await db.delete(blockedIpsTable);
  await db.delete(securityLogsTable);
  await db.delete(incidentsTable);
  await db.delete(threatsTable);

  // Insert threats
  const threats = await db.insert(threatsTable).values([
    {
      title: "Brute Force Attack on SSH Server",
      description: "Multiple failed login attempts detected from Russian IP. 200+ attempts in 5 minutes targeting root account.",
      severity: "critical",
      type: "brute_force",
      status: "investigating",
      sourceIp: "185.220.101.45",
      targetHost: "auth-server-01",
      affectedUser: "root",
      riskScore: 95,
      mitreTactic: "Credential Access",
      mitreId: "T1110",
      detectedAt: hoursAgo(2),
      rawLog: '[2026-03-12T10:23:01Z] sshd: Failed password for root from 185.220.101.45 port 4521 ssh2 (attempt 201/200)',
    },
    {
      title: "SQL Injection Attack on Web Portal",
      description: "WAF detected SQL injection payload in HTTP request targeting the admin login form.",
      severity: "critical",
      type: "sql_injection",
      status: "open",
      sourceIp: "45.33.32.156",
      targetHost: "web-portal-prod",
      riskScore: 98,
      mitreTactic: "Initial Access",
      mitreId: "T1190",
      detectedAt: hoursAgo(1),
      rawLog: "GET /admin/login?user=admin'--&pass=x HTTP/1.1 | Source: 45.33.32.156",
    },
    {
      title: "Malware Execution Detected on Workstation",
      description: "Trojan.GenericKD.47185723 detected on workstation WS-042. Attempting to communicate with C2 server.",
      severity: "critical",
      type: "malware",
      status: "investigating",
      sourceIp: "10.0.0.23",
      targetHost: "WS-042",
      affectedUser: "jsmith",
      riskScore: 99,
      mitreTactic: "Execution",
      mitreId: "T1059",
      detectedAt: hoursAgo(4),
      rawLog: "[AV] ALERT: Trojan.GenericKD.47185723 found in C:\\Users\\jsmith\\Downloads\\invoice.exe",
    },
    {
      title: "Port Scan from External IP",
      description: "Systematic port scanning detected. Nmap SYN scan hitting all 65535 ports on perimeter firewall.",
      severity: "medium",
      type: "port_scan",
      status: "resolved",
      sourceIp: "203.0.113.15",
      targetHost: "firewall-01",
      riskScore: 55,
      mitreTactic: "Discovery",
      mitreId: "T1046",
      detectedAt: hoursAgo(8),
      resolvedAt: hoursAgo(6),
      rawLog: "[FW] Port scan detected from 203.0.113.15: SYN packets on ports 1-65535",
    },
    {
      title: "DDoS Attack on Public API",
      description: "Distributed denial of service attack targeting /api/v1 endpoint. 50,000 requests/second from botnet.",
      severity: "high",
      type: "ddos",
      status: "open",
      sourceIp: "104.21.12.88",
      targetHost: "api-gateway-prod",
      riskScore: 88,
      mitreTactic: "Impact",
      mitreId: "T1498",
      detectedAt: hoursAgo(3),
      rawLog: "[LB] Traffic spike: 50,234 req/s from 104.21.12.88 — Rate limit exceeded",
    },
    {
      title: "Phishing Campaign Targeting Finance",
      description: "Sophisticated spear-phishing email campaign detected. 15 emails sent to finance team impersonating CFO.",
      severity: "high",
      type: "phishing",
      status: "open",
      sourceIp: "91.108.4.12",
      targetHost: "mail-server-01",
      affectedUser: "finance@company.com",
      riskScore: 78,
      mitreTactic: "Initial Access",
      mitreId: "T1566",
      detectedAt: hoursAgo(5),
      rawLog: "[MAIL] Phishing detected: From: cfo@company-secure.net To: finance@company.com Subject: Urgent Wire Transfer",
    },
    {
      title: "Lateral Movement Detected in Internal Network",
      description: "Compromised account moving laterally through internal network using pass-the-hash technique.",
      severity: "critical",
      type: "lateral_movement",
      status: "investigating",
      sourceIp: "172.16.5.88",
      targetHost: "dc-server-01",
      affectedUser: "svc-account",
      riskScore: 97,
      mitreTactic: "Lateral Movement",
      mitreId: "T1021",
      detectedAt: daysAgo(1),
      rawLog: "[AD] Suspicious NTLM authentication from 172.16.5.88 using hash for svc-account",
    },
    {
      title: "Data Exfiltration Attempt",
      description: "Large volume of data transferred to external IP. 2.3GB uploaded to unknown destination over 30 minutes.",
      severity: "critical",
      type: "data_exfiltration",
      status: "resolved",
      sourceIp: "192.168.1.105",
      targetHost: "db-server-02",
      affectedUser: "dbadmin",
      riskScore: 96,
      mitreTactic: "Exfiltration",
      mitreId: "T1041",
      detectedAt: daysAgo(2),
      resolvedAt: daysAgo(2),
      rawLog: "[NET] Unusual outbound transfer: 2.3GB from 192.168.1.105 to 95.142.111.34 via HTTPS",
    },
    {
      title: "ML Anomaly: Unusual Login Pattern",
      description: "Isolation Forest model detected anomalous login pattern — user logged in from 3 different countries in 2 hours.",
      severity: "high",
      type: "anomaly",
      status: "open",
      sourceIp: "77.88.21.3",
      targetHost: "sso-server-01",
      affectedUser: "ajonson",
      riskScore: 82,
      mitreTactic: "Initial Access",
      mitreId: "T1078",
      detectedAt: hoursAgo(6),
      rawLog: "[ML] AnomalyScore=0.91: User ajonson: login from US, then RU, then CN within 2 hours",
    },
    {
      title: "Brute Force on Web Admin Panel",
      description: "Automated credential stuffing attack against WordPress admin login.",
      severity: "medium",
      type: "brute_force",
      status: "resolved",
      sourceIp: "193.32.126.231",
      targetHost: "cms-server-01",
      riskScore: 62,
      mitreTactic: "Credential Access",
      mitreId: "T1110",
      detectedAt: daysAgo(1),
      resolvedAt: daysAgo(1),
      rawLog: "[WEB] 1,200 POST /wp-admin requests in 10 minutes from 193.32.126.231",
    },
  ]).returning();

  // Insert incidents
  const now = new Date();
  const incidents = await db.insert(incidentsTable).values([
    {
      title: "Active Ransomware Campaign — CRITICAL",
      description: "Multiple systems compromised. Malware spreading through internal network via lateral movement. Immediate containment required.",
      severity: "critical",
      status: "investigating",
      assignedTo: "Sarah Chen (SOC L3)",
      affectedSystems: JSON.stringify(["WS-042", "WS-055", "file-server-01", "dc-server-01"]),
      threatIds: JSON.stringify([threats[2].id, threats[6].id]),
      timeline: JSON.stringify([
        { timestamp: hoursAgo(4).toISOString(), action: "Malware detected on WS-042", actor: "IDS System" },
        { timestamp: hoursAgo(3.5).toISOString(), action: "Incident escalated to SOC L2", actor: "Alert System" },
        { timestamp: hoursAgo(3).toISOString(), action: "SOC L3 analyst assigned — Sarah Chen", actor: "Manager" },
        { timestamp: hoursAgo(2).toISOString(), action: "WS-042 isolated from network", actor: "Sarah Chen" },
        { timestamp: hoursAgo(1).toISOString(), action: "Lateral movement detected on dc-server-01", actor: "Sarah Chen" },
      ]),
      responseActions: JSON.stringify(["Isolated WS-042 from network", "Blocked IP 10.0.0.23", "Notified incident response team"]),
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(1),
    },
    {
      title: "Data Breach Investigation",
      description: "Potential data exfiltration of 2.3GB from database server. Investigating scope of breach.",
      severity: "critical",
      status: "resolved",
      assignedTo: "Marcus Rodriguez (SOC L2)",
      affectedSystems: JSON.stringify(["db-server-02", "192.168.1.105"]),
      threatIds: JSON.stringify([threats[7].id]),
      timeline: JSON.stringify([
        { timestamp: daysAgo(2).toISOString(), action: "Unusual data transfer detected", actor: "DLP System" },
        { timestamp: daysAgo(2).toISOString(), action: "Transfer blocked — connection terminated", actor: "Firewall" },
        { timestamp: daysAgo(1).toISOString(), action: "Forensic analysis completed — PII data not in transfer", actor: "Marcus Rodriguez" },
        { timestamp: daysAgo(1).toISOString(), action: "Incident closed — false alarm", actor: "Marcus Rodriguez" },
      ]),
      responseActions: JSON.stringify(["Blocked outbound connection", "Revoked dbadmin credentials", "Full audit log exported"]),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
      resolvedAt: daysAgo(1),
    },
    {
      title: "Ongoing DDoS Attack — API Gateway",
      description: "Active DDoS attack on API gateway. CDN rate limiting partially mitigating impact.",
      severity: "high",
      status: "open",
      assignedTo: "Alex Kim (SOC L2)",
      affectedSystems: JSON.stringify(["api-gateway-prod", "load-balancer-01"]),
      threatIds: JSON.stringify([threats[4].id]),
      timeline: JSON.stringify([
        { timestamp: hoursAgo(3).toISOString(), action: "DDoS attack started — 50K req/s detected", actor: "Monitoring" },
        { timestamp: hoursAgo(2.5).toISOString(), action: "CDN rate limiting enabled", actor: "Alex Kim" },
        { timestamp: hoursAgo(2).toISOString(), action: "ISP contacted for upstream filtering", actor: "Alex Kim" },
      ]),
      responseActions: JSON.stringify(["CDN rate limiting enabled", "ISP filtering requested", "WAF rules updated"]),
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(2),
    },
  ]).returning();

  // Insert security logs
  const logMessages = [
    { type: "auth", message: "Successful SSH login for user devops from 10.0.1.5", severity: "info", sourceIp: "10.0.1.5" },
    { type: "auth", message: "Failed SSH login attempt from 185.220.101.45 for user root", severity: "high", sourceIp: "185.220.101.45" },
    { type: "auth", message: "Password reset requested for user jdoe@company.com", severity: "info", sourceIp: "10.0.1.23" },
    { type: "auth", message: "MFA bypass attempt detected for account admin@company.com", severity: "critical", sourceIp: "91.108.4.12" },
    { type: "network", message: "Outbound connection to known C2 server blocked: 95.142.111.34:4444", severity: "critical", sourceIp: "10.0.0.23" },
    { type: "network", message: "Large DNS query volume from internal host — possible DNS tunneling", severity: "high", sourceIp: "172.16.5.88" },
    { type: "network", message: "VPN connection established for user mwilson from 77.88.21.3", severity: "info", sourceIp: "77.88.21.3" },
    { type: "system", message: "Suspicious cron job added by non-root user: /etc/cron.d/update.sh", severity: "high", sourceIp: "10.0.0.23" },
    { type: "system", message: "Kernel module loaded: rootkit_detector.ko", severity: "medium", sourceIp: "10.0.1.1" },
    { type: "system", message: "System backup completed successfully on db-server-02", severity: "info", sourceIp: "10.0.2.5" },
    { type: "firewall", message: "Blocked inbound connection from 185.220.101.45 port 22 (SSH)", severity: "medium", sourceIp: "185.220.101.45" },
    { type: "firewall", message: "Port scan blocked: 203.0.113.15 scanning ports 1-1024", severity: "medium", sourceIp: "203.0.113.15" },
    { type: "firewall", message: "DDoS mitigation active — dropping packets from 104.21.12.88", severity: "high", sourceIp: "104.21.12.88" },
    { type: "web", message: "SQL injection attempt blocked: UNION SELECT payload in GET request", severity: "critical", sourceIp: "45.33.32.156" },
    { type: "web", message: "XSS payload detected in form submission from 193.32.126.231", severity: "high", sourceIp: "193.32.126.231" },
    { type: "web", message: "Normal web traffic — 1,200 API calls in last hour from CDN", severity: "info", sourceIp: "104.21.12.1" },
    { type: "auth", message: "Account locked: root after 50 failed attempts in 60 seconds", severity: "critical", sourceIp: "185.220.101.45" },
    { type: "network", message: "Unusual traffic spike detected — 10x normal baseline", severity: "high", sourceIp: "104.21.12.88" },
    { type: "system", message: "Antivirus scan completed — 3 threats quarantined on WS-042", severity: "critical", sourceIp: "10.0.0.23" },
    { type: "web", message: "Path traversal attempt: /../../../etc/passwd in URL", severity: "high", sourceIp: "198.51.100.42" },
  ];

  const logsToInsert = [];
  for (let i = 0; i < logMessages.length; i++) {
    const log = logMessages[i];
    logsToInsert.push({
      type: log.type as "auth" | "network" | "system" | "firewall" | "web",
      message: log.message,
      sourceIp: log.sourceIp,
      severity: log.severity,
      timestamp: hoursAgo(i * 0.5),
      raw: `[${hoursAgo(i * 0.5).toISOString()}] ${log.type.toUpperCase()} src=${log.sourceIp} ${log.message}`,
      anomalyScore: log.severity === "critical" ? 0.9 + Math.random() * 0.1 : log.severity === "high" ? 0.6 + Math.random() * 0.3 : Math.random() * 0.4,
      isAnomaly: log.severity === "critical" || log.severity === "high",
    });
  }
  await db.insert(securityLogsTable).values(logsToInsert);

  // Blocked IPs
  await db.insert(blockedIpsTable).values([
    { ip: "185.220.101.45", reason: "Brute force SSH attack — 200+ failed attempts", duration: "permanent", threatId: threats[0].id, isActive: true },
    { ip: "45.33.32.156", reason: "SQL injection attempt on web portal", duration: "7d", threatId: threats[1].id, isActive: true },
    { ip: "95.142.111.34", reason: "Known C2 server — data exfiltration destination", duration: "permanent", isActive: true },
    { ip: "104.21.12.88", reason: "DDoS attack source — 50K req/s", duration: "24h", threatId: threats[4].id, isActive: true },
    { ip: "203.0.113.15", reason: "Port scanning activity", duration: "1h", threatId: threats[3].id, isActive: false, unblockedAt: hoursAgo(0) },
  ]);

  console.log(`✅ Seeded: ${threats.length} threats, ${incidents.length} incidents, ${logsToInsert.length} logs, 5 blocked IPs`);
}

seed().catch(console.error);

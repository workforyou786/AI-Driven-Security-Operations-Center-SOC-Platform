# AI-Powered Security Operations Center (SOC) with Automated Incident Response

A **mini Security Operations Center (SOC)** platform built to demonstrate advanced cybersecurity monitoring, threat detection, and automated incident response using **ELK Stack, Wazuh, and machine learning**.

This project aligns closely with the skills required for **Cybersecurity Consultant roles at Ernst & Young**, including SOC operations, SIEM, EDR/NDR, SOAR automation, and incident response.

---

## 🚀 Project Goal

- Collect logs from endpoints and servers
- Detect cyber attacks in real-time
- Leverage **machine learning for anomaly detection**
- Automatically respond to threats with incident response automation
- Visualize security events on a SOC dashboard

---

## 🏗️ Architecture
Endpoints / Servers
│
│ Logs
▼
Log Collector (Filebeat)
│
▼
SIEM Platform (ELK Stack)
│
▼
Threat Detection Engine
(Python + ML)
│
▼
SOAR Automation
(Auto Block IP / Alert)
│
▼
SOC Dashboard
(Kibana)

---

## 🛠️ Technologies

### Security Monitoring
- **ELK Stack** (Elasticsearch, Logstash, Kibana)

### Detection & EDR
- **Wazuh**

### Networking Tools
- Wireshark
- Suricata IDS

### Programming & Automation
- Python
- Bash scripting for incident response

### Machine Learning
- Scikit-learn
- Isolation Forest / Random Forest for anomaly detection

---

## 🔑 Key Features

### 1️⃣ Log Collection
- Collect logs from Linux servers, web servers, and firewalls
- Examples: login attempts, suspicious commands, network connections

### 2️⃣ Attack Simulation
- Simulate attacks to test detection:
  - Brute force login
  - SQL injection
  - Malware execution
  - Port scanning
- Tools: Nmap, Metasploit, Hydra

### 3️⃣ SIEM Dashboard
- Built in **Kibana**
- Displays:
  - Suspicious logins
  - Top attacking IPs
  - Malware alerts
  - Network anomalies

### 4️⃣ Machine Learning Threat Detection
- Detects unusual network behavior with anomaly detection models
- Example using **Isolation Forest**:

```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(contamination=0.02)
model.fit(network_data)
predictions = model.predict(network_data)
5️⃣ Automated Incident Response (SOAR)

Scripts to automatically:

Block attacker IP

Send alert emails

Create incident tickets

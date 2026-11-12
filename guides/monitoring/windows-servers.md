---
title: Setting up advanced monitoring on a Windows server
description: Install the monitoring exporter on your Windows Server and open your firewall to our monitoring server, so our support team can watch CPU, RAM, disk space, availability and Remote Desktop. For servers with the Advanced monitoring add-on.
order: 1
last_updated: 2026-11-12
---

## What advanced monitoring does

With advanced monitoring, the HypeProxies support team watches your Windows server and is alerted when something looks wrong, often before it affects you. We track:

- CPU usage
- RAM usage
- Disk space
- Whether the server is up (ping)
- Whether Remote Desktop (RDP) answers

Monitoring is read-only: we collect usage numbers and check that the server answers. We don't need, and won't ask for, any login or password for your server.

> **Note:** Advanced monitoring is an add-on and is not included with your server. To add it, [open a ticket](https://dash.hypeproxies.com/submitticket.php) and tell us which server it's for. Set it up with the steps below once it's on your plan.

## Before you start

You need:

- A Windows Server you can sign in to as an administrator, with Remote Desktop already working.
- About 10 minutes.

All commands below run in **PowerShell as Administrator**: right-click **Start** > **Terminal (Admin)** or **Windows PowerShell (Admin)**.

## Step 1: Install Windows Exporter

Windows Exporter is a small open-source service that reports the server's usage numbers to our monitoring server.

1. Download the latest Windows Exporter installer from [github.com/prometheus-community/windows_exporter/releases](https://github.com/prometheus-community/windows_exporter/releases). Pick the file that ends in **amd64.msi**.
2. Right-click the installer and choose **Run as administrator**.
3. Keep the default port, **9182**.
4. Finish the installation.

## Step 2: Allow our monitoring server through Windows Firewall

Our monitoring server is **client-monitor.hypeproxies.com**. Windows Firewall rules take IP addresses, not names, so the first command looks up the server's address and the two rules use it. Run all three commands in the same PowerShell window.

1. Look up the monitoring server's address:

   ```powershell
   $monitor = (Resolve-DnsName client-monitor.hypeproxies.com -Type A).IPAddress
   $monitor
   ```

   You should see an IP address.

2. Allow the exporter (TCP port 9182):

   ```powershell
   New-NetFirewallRule -DisplayName "HypeProxies Monitoring Exporter" `
     -Direction Inbound -Protocol TCP -LocalPort 9182 `
     -RemoteAddress $monitor -Action Allow
   ```

3. Allow ping (ICMP echo):

   ```powershell
   New-NetFirewallRule -DisplayName "HypeProxies Monitoring ICMP" `
     -Direction Inbound -Protocol ICMPv4 -IcmpType 8 `
     -RemoteAddress $monitor -Action Allow
   ```

These rules let only our monitoring server reach the exporter and ping your server.

> **Note:** The rules keep the address from when you created them. If we ever change the monitoring server's address, we'll tell you; delete the two rules (`Remove-NetFirewallRule -DisplayName "HypeProxies Monitoring*"`) and run the three commands again.

> **Note:** If your server also sits behind another firewall (a hardware firewall, or a firewall in a control panel), allow the same traffic there: TCP port 9182 and ICMP echo from the address the first command showed.

## Step 3: Check that the exporter is running

1. Check the service:

   ```powershell
   Get-Service windows_exporter
   ```

   **Status** should be **Running**. If it shows **Stopped**, start it:

   ```powershell
   Start-Service windows_exporter
   ```

2. Check that the exporter answers:

   ```powershell
   (Invoke-WebRequest http://localhost:9182/metrics -UseBasicParsing).StatusCode
   ```

   You should see `200`.

## Step 4: Check Remote Desktop

Make sure Remote Desktop is turned on and you can connect to the server as usual. You don't need to change your existing Remote Desktop settings; we only check that it answers.

## Step 5: Tell us it's ready

Reply to your ticket, or [open a new one](https://dash.hypeproxies.com/submitticket.php), with your server's **public IP address**. We finish the setup on our side and confirm when monitoring is active.

## Troubleshooting

| Problem | What to do |
|---|---|
| `Resolve-DnsName` says the name does not exist | Check the spelling: `client-monitor.hypeproxies.com`. If it still fails, tell us in your ticket. |
| `Get-Service windows_exporter` says it cannot find the service | The installer didn't finish. Run it again as administrator (Step 1). |
| The service stops again after `Start-Service` | Restart the server, then check again. If it still stops, tell us in your ticket. |
| `Invoke-WebRequest` doesn't return `200` | Check that the service is running and that you kept port 9182 during installation. |
| We tell you we can't reach the server | Check both firewall rules exist (`Get-NetFirewallRule -DisplayName "HypeProxies Monitoring*"`) and any external firewall (Step 2). |

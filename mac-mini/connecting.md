# Connecting to Your Mac mini

_Last updated: 2026-11-04_

You can reach your Mac mini over the internet with SSH (terminal and file transfer) or with Screen Sharing / Apple Remote Desktop (full desktop), using the address, username and password from your client area.

**Contents**

- [Your login details](#your-login-details)
- [SSH (terminal)](#ssh-terminal)
  - [Log in with an SSH key (recommended)](#log-in-with-an-ssh-key-recommended)
  - [Turn off password login for SSH (recommended)](#turn-off-password-login-for-ssh-recommended)
- [File transfer](#file-transfer)
- [Screen Sharing from a Mac](#screen-sharing-from-a-mac)
- [Apple Remote Desktop](#apple-remote-desktop)
- [Remote desktop from Windows or Linux](#remote-desktop-from-windows-or-linux)
- [Optional: Screen Sharing through SSH](#optional-screen-sharing-through-ssh)
- [KVM console (free)](#kvm-console-free)
- [Good to know](#good-to-know)
- [Troubleshooting](#troubleshooting)

## Your login details

Open the client area > **Services** > your Mac mini. The service page shows:

| Field | Use |
|---|---|
| Address | Public IPv4 address of your Mac, used by every connection method |
| Username | Your macOS account (administrator) |
| Password | Click **Show password**; the same password works for SSH, Screen Sharing and the macOS login |

The Mac accepts connections on these ports:

| Port | Protocol | Used for |
|---|---|---|
| 22 | SSH | Terminal, SFTP, scp, rsync, SSH tunnels |
| 5900 | VNC (RFB) | Screen Sharing, Apple Remote Desktop, VNC viewers |

The free KVM console works in your browser through `https://kvm.hypeproxies.io` (port 443), see [KVM console](#kvm-console-free).

The examples below use `203.0.113.10` for the address and `client12345` for the username; replace them with yours.

## SSH (terminal)

SSH works from macOS, Linux and Windows 10/11 with the built-in `ssh` command.

1. Open Terminal (macOS, Linux) or PowerShell (Windows).
2. Run:

   ```bash
   ssh client12345@203.0.113.10
   ```

3. The first time, confirm the host key fingerprint with `yes`.
4. Enter your password (nothing is shown while you type).

You can also use PuTTY on Windows: Host Name = the address, Port = 22, Connection type = SSH.

### Log in with an SSH key (recommended)

On your own computer:

```bash
ssh-keygen -t ed25519            # only if you have no key yet
ssh-copy-id client12345@203.0.113.10
```

On Windows without `ssh-copy-id`, append the content of your `id_ed25519.pub` to `~/.ssh/authorized_keys` on the Mac (permissions `700` for `~/.ssh`, `600` for the file).

### Turn off password login for SSH (recommended)

Your Mac is on the public internet, and automated bots try passwords on port 22 all day. Many wrong passwords can lock your macOS account for a while, even though the bots never get in: your correct password is then refused, in SSH and in Screen Sharing. Once your key works, turn off SSH password login for your account, so guessed passwords are never checked.

1. Check that your key works: `ssh client12345@203.0.113.10` must log you in without asking for a password.
2. On the Mac, run this (replace `client12345` with your username in all three places):

   ```bash
   sudo tee /etc/ssh/sshd_config.d/200-client12345.conf >/dev/null <<'EOF'
   Match User client12345
       AuthenticationMethods publickey
       PasswordAuthentication no
       KbdInteractiveAuthentication no
   Match all
   EOF
   sudo /usr/sbin/sshd -t && echo OK || { sudo rm -f /etc/ssh/sshd_config.d/200-client12345.conf; echo "Error: setting removed"; }
   ```

3. The output must be `OK`. Keep your session open and test in a second window: the key still logs you in, and `ssh -o PubkeyAuthentication=no client12345@203.0.113.10` is refused.

This affects only your account and only SSH. Screen Sharing and the KVM console still use your password, so keep the long password from the client area. Lost your key? Log in with Screen Sharing or the KVM console and run:

```bash
sudo rm /etc/ssh/sshd_config.d/200-client12345.conf
```

## File transfer

Files are transferred over SSH (SFTP, port 22) with the same username and password or key.

```bash
# copy a file to the Mac's home folder
scp ./build.zip client12345@203.0.113.10:~/
# copy a folder back from the Mac
scp -r client12345@203.0.113.10:~/Projects/app ./app
# keep a folder in sync (only changed files are sent)
rsync -avz ./project/ client12345@203.0.113.10:~/project/
```

| Graphical app | Platform | Settings |
|---|---|---|
| Cyberduck | macOS, Windows | Open Connection > SFTP, server = address, port 22 |
| FileZilla | macOS, Windows, Linux | Host `sftp://203.0.113.10`, port 22 |
| WinSCP | Windows | File protocol SFTP, port 22 |
| Finder / Files | macOS, Linux | Use one of the apps above; plain FTP and SMB file sharing are not available |

## Screen Sharing from a Mac

The Screen Sharing app built into macOS gives you the full desktop with no extra software.

1. In Finder choose **Go > Connect to Server** (⌘K).
2. Enter `vnc://203.0.113.10` and click **Connect**.
3. Choose **As a registered user** and enter your username and password.
4. If the Mac shows the login window, log in with the same account.

You can also open the Screen Sharing app directly (Spotlight: "Screen Sharing") and enter the address. For a sharper image on a fast connection, choose **View > High Quality** in Screen Sharing.

## Apple Remote Desktop

If you manage several Macs with Apple Remote Desktop (Mac App Store), add your Mac mini by address.

1. In Remote Desktop choose **File > Add by Address**.
2. Enter the address, your username and password, then click **Add**.
3. Select the Mac and use **Control** or **Observe**.

Control and Observe work over port 5900. Reporting and other management features of Remote Desktop use port 3283; they may work but are not supported.

## Remote desktop from Windows or Linux

Use a VNC viewer that supports macOS login with a username and password, such as RealVNC Viewer (free).
<!-- TODO before publishing: test RealVNC Viewer against our Macs (macOS 27). -->

1. Install RealVNC Viewer.
2. Enter `203.0.113.10` (port 5900 is the default) and connect.
3. When asked, enter your macOS username and password.

Viewers that only ask for a password, without a username, usually cannot log in to macOS Screen Sharing.

## Optional: Screen Sharing through SSH

Sending the desktop through an SSH tunnel encrypts the whole session and works where port 5900 is blocked on your side.

```bash
ssh -N -L 5901:localhost:5900 client12345@203.0.113.10
```

Keep that window open, then connect your Screen Sharing app or VNC viewer to `localhost:5901` (on a Mac: `vnc://localhost:5901`).

## KVM console (free)

The KVM console shows your Mac's screen with keyboard and mouse even when SSH, Screen Sharing or the network of the Mac does not work, for example at the login window.

1. **Check your free sessions:** client area > your Mac mini > **KVM console**. You get **3 free sessions of 30 minutes per Mac in any 24 hours** (counted over the last 24 hours, not per calendar day). The page shows how many are left.
2. **Open the console:** on the KVM console page click **Open the KVM console**. The page shows a one-time username and password; keep it open.
3. Click the button **Open the KVM console** on that page. The console site `https://kvm.hypeproxies.io` opens in a new tab. The link works once, in that browser.
4. Log in with the one-time username and password from step 2.
5. Click your Mac's port name (for example _Dominion_KX3_Port2_), then **Connect**. The console opens in a new window: allow pop-ups for `kvm.hypeproxies.io` if your browser blocks it.
6. When you are done, close the console window. Your 30-minute session keeps running until it ends; opening the console again during it does not use another free session.

To use the console in another browser or after the link was used, click **Open the KVM console** again on the KVM console page: you get a new link and login, and the previous console closes.

| Message | Meaning / what to do |
|---|---|
| Console link not valid | The link was already used or the time ended: open the console again from the KVM console page |
| No active console session | Your console time ended, or you are in another browser than the one that opened the link: open the console again |
| Login not allowed | Log in only with the one-time username shown in the client area |
| All KVM consoles are in use | The console switch serves a few customers at a time: try again in a few minutes (a refused attempt does not use one of your free sessions) |
| The provider is working on this Mac right now | Our team is using the console of your Mac: try again in a few minutes |
| You used your 3 free console sessions of the last 24 hours | The page shows when the next session is available; for urgent help open a ticket |

## Good to know

- **Restart, never Shut Down.** A Mac that is shut down stays off until our team powers it on. Use Apple menu > Restart, `sudo shutdown -r now`, or **Restart Mac** in the client area (about 3 minutes).
- **Password reset:** **Reset password** in the client area sets a new password within about a minute; the old one stops working at once. macOS may ask for the old password once to unlock the login keychain.
- **Logging out is fine:** Screen Sharing then shows the login window and you log in again.
- **Not available on the service:** Wi-Fi, Bluetooth, changing network settings, adding user accounts, Erase All Content and Settings, physical access or USB devices. See the Terms of Use.
  <!-- TODO: link the published Terms of Use. -->
- **Extra IP addresses** are available only with the routed subnet add-on; contact support.
  <!-- TODO: link the routed subnet setup article when it exists. -->

## Troubleshooting

| Problem | What to do |
|---|---|
| Connection times out | Check the status on the service page. "Not reachable right now": wait 5 minutes or use **Restart Mac**; if it stays unreachable, open a ticket |
| "Permission denied" or wrong password | Copy the password again with **Show password**; if unsure, use **Reset password** |
| The correct password is refused (SSH and Screen Sharing) | Many wrong passwords sent from the internet locked your account for a while: try again later or open a ticket. To prevent it, use an SSH key and [turn off SSH password login](#turn-off-password-login-for-ssh-recommended) |
| Service shows "Suspended" | Access is disabled; check unpaid invoices or contact support |
| "REMOTE HOST IDENTIFICATION HAS CHANGED" (SSH) | Expected after the Mac was reinstalled; run `ssh-keygen -R 203.0.113.10` and connect again. If nothing was reinstalled, contact support before connecting |
| Screen Sharing shows a black or frozen screen | Disconnect and reconnect; if it persists, restart the Mac from the client area |
| VNC viewer asks only for a password | Use Screen Sharing (Mac) or a viewer with macOS username login (RealVNC Viewer) |
| A restart takes longer than 10 minutes | Open a ticket; our team will recover the Mac |

# Writing customer guides

## Where files go

- One folder per service: `mac-mini/`, `bare-metal/`, `vps/`, `proxy/`. A new service gets a new folder with a `README.md` and a row in the root [README.md](README.md).
- One guide per task, file names in lowercase with hyphens: `connecting.md`, `install-software.md`, `routed-ip-setup.md`.
- Add every new guide to its folder's `README.md` table.
- Images go in an `images/` folder next to the guide and are linked relatively: `![Client area](images/client-area.png)`.

## How to write

- Start from [templates/guide-template.md](templates/guide-template.md).
- Write for the customer: what to click, what to type, what they should see. One action per step.
- Use placeholders that cannot hit a real system: address `203.0.113.10` (documentation range), username `client12345`, domain `example.com`.
- Never put real IP addresses, usernames, passwords, internal hostnames or management systems in a guide.
- Commands go in fenced code blocks with a language (` ```bash `); menu paths in bold: **Go > Connect to Server**.
- Update the `_Last updated_` date when a guide changes.
- Notes for ourselves that customers must not see go in HTML comments: `<!-- TODO: ... -->` (they are not shown on GitHub, but they ARE in the file: never put secrets there).

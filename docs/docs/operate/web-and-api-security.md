# Web and API Security

R2Kernel can expose a browser console, REST APIs, and WebSocket endpoints from the
host control backend. Treat those endpoints as an operations surface, not as an
open development dashboard.

The security model has two gates.

- network admission decides where requests may come from
- authentication decides who may call the API

Use both when the API binds to anything broader than loopback.

Fresh installations use loopback binds with Console login, API authentication,
and Terminal disabled for local setup. The installer offers an optional Console
password and login step. Leaving login OFF lets anyone who can reach the Console
manage it and, before a password exists, register the first password without a
setup code. This is not protection from untrusted local users or installed packages.
An existing override may expose a network interface even after an upgrade;
review the effective configuration before starting services.

## Configuration

Security is one area of the host configuration described in
[Runtime Configuration](runtime-configuration.md). It is configured in
`runtime/config.yaml`.

```yaml
security:
  enabled: true
  network:
    allow_cidrs:
      - "127.0.0.1/32"
      - "192.0.2.0/24"
    allowed_origins:
      - "https://robot-admin.example.com"
    trust_forwarded_for: false
  api:
    require_auth: true
    token_env: "R2KERNEL_API_TOKEN"
    tokens_file: "<prefix>/var/lib/security/api_tokens.yaml"
  web:
    login_required: true
    admin_password_env: "R2KERNEL_WEB_ADMIN_PASSWORD"
    admin_password_file: "<prefix>/var/lib/security/admin_password"
    session_timeout_sec: 3600
    session_cookie_name: "r2kernel_session"
  health:
    unauthenticated: true
```

`allow_cidrs` should include only the management network and loopback. A browser
Origin allowlist is optional, but recommended when a fixed management URL is
used.

The network and hostname above are documentation examples, not deployable
defaults. Replace them with your management subnet and TLS-protected origin,
and configure real credentials before changing a listener bind. The HTTP
security settings do not protect registration UDP or host-to-host Control traffic.
Remote federation also requires its own configured frame security and keys,
and each peer's Host API port must be reachable from its peers, because
federation status is exchanged only through the authenticated Host API. Restrict native ports to approved peers with host
firewall and VPN policy; a VPN alone does not authenticate application users.
See [Runtime Configuration](runtime-configuration.md#security-before-exposure)
for explicit remote bind selection, including federation and outbound
Control interfaces. Loopback defaults do not disable time-sync traffic.

Federation's `optional` mode permits unsigned/plaintext inbound Event traffic
but initiates secure outbound connections; managed Optional and Required modes
require broker-validated, protected 16..4096-byte key material. Disabled startup
does not load that key. For an explicitly Disabled/Optional pair, the Disabled
host initiates and Optional waits, independent of host-name sorting and Event
publication direction. Both directions use the established connection;
homogeneous pairs keep the lexically lower-host initiator. Required remains
secure-only. Authentication/decryption failure never triggers a plaintext retry.

Federation discovery and desired-peer status expose the canonical
`event_transport_security_mode` (`disabled`, `optional`, or `required`). It is
covered by a signed snapshot's signature, but is only a connection-planning
hint—not proof of authentication, readiness, or remote Control authority.
Missing/malformed hints stay unknown and cannot downgrade local security.
Optional acceptance of unsigned Events does not authorize remote Control.

Hints only choose which host initiates first. A hint change never closes an
established connection, except that an authenticated `optional`/`required`
record closes a plaintext session that peer id initiated. A compatible pair
connects even with a missing or wrong hint within two control status intervals
plus the connect time. A `disabled` host and a `required` host never connect;
when the peer's hint shows its mode, the peer is listed under
`security_mode_incompatible`. `required` never accepts plaintext. When the peer
record is authenticated and states `optional` or `required`, a plaintext Event
session claiming that peer id is refused and counted as
`plaintext_sessions_refused`; a plaintext session never replaces a live secure
session of the same peer. When two hosts dial each other at once, both keep the
connection initiated by the lexically smaller host id, independent of accept
timing; the losing connection is counted in `duplicate_sessions_closed`. With federation security `disabled`, peer
snapshot hints, including relay ports, are unauthenticated. While a peer record
is authenticated and fresh, an unauthenticated snapshot for that peer is ignored
and counted as `unauthenticated_snapshots_ignored` on that peer record.
These connection rules are verified with two controllers on one host.

## API Keys

REST and WebSocket APIs accept either header form.

```http
Authorization: Bearer <api-key>
```

```http
X-R2Kernel-API-Key: <api-key>
```

Use Settings → Security to create and revoke normal API keys when the configured
store is readable and writable by the Control service account. Read-only or
unsafe stores are reported explicitly; the Console does not change OS ownership
or elevate its privileges. API
keys are displayed once at creation time and are hidden afterwards. If a key is
lost or suspected to be exposed, revoke it and create a new one.

API keys are intended for external clients, automation, monitoring, and
federation/bootstrap clients. The browser Web Console should not store a
long-lived API key. It uses the Web login session described below.

The API key storage file is YAML. The configuration field names use `token`
internally because the stored secret value is an authentication token.

```yaml
tokens:
  - name: operator-laptop
    role: operator
    token: replace-with-long-random-token
  - name: monitoring
    role: viewer
    token: replace-with-long-random-token
```

Roles are enforced by protected Host Control routes when security is enabled.

| Role | Access |
| --- | --- |
| `viewer` | read runtime state, specs, health, and Event streams |
| `operator` | viewer access plus Control WebSocket and managed package instance lifecycle operations |
| `admin` | operator access plus configuration writes, package install/removal, security management, and runtime apply/restart |

Unknown roles authenticate but do not satisfy protected mutating operations.

## Web Login

The browser console uses session cookies. Configure the admin password through a
private credential file or a service-managed environment variable. Avoid putting
real passwords directly in the main runtime YAML or command-line arguments.

Credential files must be regular, non-symlink files owned by the operating-system
user that reads them, with no group/other access. Their parent directory must not
be writable by group/others. A root-owned `0700` directory and `0600` file are not
readable by the standard non-root `r2kernel` Control service. Do not enable login
until the installation's credential access arrangement is verified. The Console
does not run as root or automatically widen these permissions.

For a supported writable credential store, Settings → Security accepts a new
password and confirmation when no password exists. The current-password field
shows N/A and is disabled for initial setup; no setup code is required. Once a password exists,
changing it requires the current password even when Console login is OFF. OFF
does not delete that password. A storage read error is not treated as absence.
Local recovery uses `r2kernel-config setup-password` and prompts without putting
the password in command arguments. On a managed native installation, the
administrator entry switches to the configured Control user for this operation;
it does not relax credential-file ownership checks. For an unmanaged installation,
run it as the credential-store owner. After local CLI recovery, restart Control to
revoke existing browser sessions. HTTP password changes revoke sessions directly.

Credential writes and policy configuration writes are separate capabilities.
Managed native service installation prepares both private stores for the Control
user. The Web Console and CLI share the same Control settings resolver and can
save supported login and Terminal policy. System-level configuration and
credential-source locations remain administrator-owned and read-only in the
GUI. Do not make the shared runtime directory writable to work around a reported
permission error. An unreadable password store is displayed as unavailable,
not as an unconfigured password.

After login, the browser receives an `HttpOnly` `SameSite=Lax` session cookie.
The frontend uses that cookie for same-origin REST calls and WebSocket
handshakes. This is the supported authentication path for the browser Console
when Console login is ON. Browser management requests use `/console/api/v1`
and apply the Console login policy. External `/api/v1` requests apply only the
API security policy. Console cookies never authenticate canonical API requests,
including on the same Console listener.

Cookie-authenticated Event and Control WebSockets close when their admitting
session expires, even while idle and without another HTTP request. Logout and
password changes also invalidate those sockets; unrelated session changes only
trigger a validity recheck. API-key and anonymous sockets are not assigned the
browser cookie's expiry lifetime.

Native HTTPS management uses a separate `Secure` `__Host-..._tls` cookie and
session scope. HTTP Console sessions do not authenticate HTTPS management, and
HTTPS sessions do not authenticate HTTP. Sign in again when changing origins.
Registered management cookies and API credentials are stripped from product
proxies; products provide their own user authentication.

HTTP browser sessions are accepted only on the actual Console listener. If
API or WebSocket listeners use different ports, external clients use API keys
there when API security is ON, rather than a Console cookie. Cookies do not have a browser port scope:
on the same hostname the browser may still send an HTTP cookie to a product
port, even though Control does not accept it there and removes it before
proxying to a product. This is not equivalent to separate-host isolation.

Settings → Security shows independent **Console login** and **API security**
ON/OFF controls. Enabling Console login requires a configured, readable password.
Neither policy is derived from `security.enabled`. A configuration that sets
`security.enabled: true` must therefore contain both the `security.api` and the
`security.web` section (the installed base configuration does); otherwise Control
refuses to load it rather than run with authentication silently off. With
`security.enabled: false`, an omitted section uses that policy's own default
(OFF). Reinstalling preserves the existing choices.
The Console never needs an API key. With Console login OFF it remains available
without password authentication even when API security is ON. Network admission
continues to apply. External canonical API clients need an API key only when
API security is ON.

| Console login | API security | Browser Console | External canonical API |
| --- | --- | --- | --- |
| OFF | OFF | anonymous | no key required |
| ON | OFF | password session | no key required |
| OFF | ON | anonymous | API key required |
| ON | ON | password session | API key required |

Turning Console login OFF intentionally leaves Console management accessible to
admitted clients. API security protects the canonical API surface; it does not
add authentication to an open Console. Console management routes are offered
only on the actual Console HTTP or native HTTPS listener. Product frontends and
proxies retain their own authentication and receive no management credentials.

Use the Web Console Settings page to change the admin password when
`security.web.admin_password_file` points to a managed password file. If the
password is supplied by environment variable, the runtime reports it as
externally controlled and the Web Console will not rewrite it.

## Gate Combinations

The security options are intentionally separated so development, API-only, and
browser-console deployments can use different policies.

| `security.enabled` | `api.require_auth` | `web.login_required` | Result |
| --- | --- | --- | --- |
| `false` | any | any | Security gates are disabled. Use only for local or trusted development. |
| `true` | `false` | `false` | Network admission applies, but API calls do not require identity. |
| `true` | `false` | `true` | Browser Console management requires a login session. Canonical external REST/WebSocket API requests do not require an API key. |
| `true` | `true` | `true` | Recommended browser Console mode. External clients use API keys; browser users log in and receive a session cookie. |
| `true` | `true` | `false` | Browser Console management remains available without a password or API key. Canonical external REST/WebSocket API requests require an API key. |

`security.network.allow_cidrs` belongs to the network-admission gate. It decides
which source IP/CIDR ranges may reach REST, WebSocket, package frontend, and Web
Console routes. `security.api.require_auth` and `security.web.login_required`
belong to the identity gate.

These authentication switches protect the **management Console and management
REST/WebSocket APIs**, not an installed product's own frontend. Package static
assets and instance-scoped context/API/WebSocket proxies use product admission;
the product is responsible for its own user authentication. Source-network
admission still applies. Product proxy requests do not forward registered
management cookies or API credentials to the component. Management aliases under
`/api/v1/control/` remain protected.

A frontend context requires a unique, live official package launch lease that
matches the installed package and manifest. CLI foreground, CLI detached, and
managed starts share this identity. A registry history entry alone, a stopped
process, or a generic SDK resource claim is not sufficient. Restart packages
through the updated launch service after updating the runtime; old leases lack
this identity. Context lookup does not create or repair an instance silently.

## Web Terminal

Web Terminal provides **Local OS login only**. It opens the OS login prompt in
the same Linux environment as Control and delegates account authentication to
that environment. On a native installation, this is the installed Linux host;
inside Kubernetes, it is the Pod's container. It never connects to an SSH
server, and it does not require an SSH host, port, key, Kubernetes Node
credentials, host mounts, or cluster API permissions. The service account that
runs `r2kernel` is non-login (`nologin`); an operator must sign in with an
existing OS account. Enabling Web Terminal neither creates an account nor
changes a password or grants `sudo` rights.

Managed native Linux installations provision the separate privileged local
login broker while Control remains non-root. A container image must include the
OS login facilities, existing accounts, and required broker permissions. A Pod
restricted from the required OS user transition cannot provide this feature
merely by enabling it.

Terminal defaults OFF and has an independent ON/OFF control. It can be enabled
while Console login is OFF: the OS login prompt authenticates the OS account
before granting a shell. Changing Terminal settings follows the running Console
policy; a protected Console requires an administrator, while an explicitly open
Console permits anonymous management. Enabling the relay does not create an OS
account or grant `sudo` rights.

Use **Save & apply Terminal** to save this category and update terminal policy
without a Control restart. Other category drafts remain unsaved. The global
**Save all changes (save only)** action saves drafts without applying them.
Terminal apply does not apply Security or listener changes; those retain their
existing runtime-apply requirements.
Applying Terminal policy ends active sessions. Local OS login is independent of
Console authentication; closing its page or disconnecting ends the relay, as do
its configured idle and lifetime limits.

### Console connection and native HTTPS on Linux

A new managed installation starts with HTTP and Terminal OFF. Select HTTP or
HTTPS in Settings → Security → Console connection. Choose the device certificate
and private key (generated uniquely for that device) or upload a custom PEM
certificate/private-key pair. The certificate must contain exact DNS/IP SANs
covering the current Console address. Invalid, expired, mismatched, incomplete,
or oversized material is rejected before changing the saved configuration.

Enter the Console port for the selected HTTP or HTTPS connection (defaults:
HTTP `18080`, HTTPS `18443`). Explicitly configured ports, including
`ui_port: 0` API sharing, are preserved. Missing port values use the defaults.
Choose **Save connection settings**, then **Apply all saved settings (restart)**.
Control restarts. When the address changes, Settings keeps a reconnect notice
visible; choose **Reconnect to Console** at the saved address after the restart.
A restricted root service stores protected TLS files and atomically updates only
HTTPS configuration. The Control process remains non-root. HTTPS OFF preserves
saved material for reuse, and reinstallation preserves the selected protocol.
Generated certificates require browser trust confirmation; the installer does
not distribute a shared private key.

The Console waits up to 30 s in total for the HTTPS settings service. A request
that cannot start within that time is refused as busy. A save that is not
answered in time is reported as possibly saved; reload Settings to see the
current state. The service requires a complete request within 5 s. Device TLS material is
generated into temporary files and renamed into place; an interrupted
generation is completed by the next save. Uploaded certificate and key files are
each written to a temporary file and renamed into place, key first; an upload
interrupted after the key is completed by the next upload of the same
certificate.

Control's HTTPS listener runs at most 32 TLS handshakes at once and at most 4
from one source address. A connection must send its ClientHello within 3 s and
finish the handshake within 10 s. Connections beyond either limit are closed
before the handshake without a response. Many sources together can still
occupy all 32 slots.

All Control HTTP listeners (API, WebSocket, Console HTTP and HTTPS) together
keep at most 256 connections open, and at most 64 from one source address. This
count includes TLS handshakes and open WebSocket/Terminal sessions. A connection
beyond either limit is closed at accept without a response. A connection must
send a complete request head within 10 s of being established and within 10 s
after each response; otherwise Control closes it. Many sources together can
still occupy all 256 connections.

Every Control HTTP route accepts a request body of at most 2 MiB, except
`POST /api/v1/control/packages/install` (and its `/console` alias), which
accepts twice `packages.max_upload_bytes` and reads the body only after the
admin check. The package API proxy
(`/api/v1/packages/{package_id}/instances/{instance_id}/api/...`) refuses a body over
2 MiB with 413, takes one of `control.package_proxy.http_max_concurrent` slots
before it reads the body, and answers 408 and closes the connection when the
whole body has not arrived within
`control.package_proxy.http_request_timeout_ms` (default 5000 ms). One source
address may hold at most a quarter of these slots (at least one; 16 of the
default 64); a request over its source's share or over the limit is answered
503. The same timeout then applies again to the upstream request. The
upstream response is read whole, up to 2 MiB; a larger upstream response is
answered 502.

The package WebSocket proxy
(`/api/v1/packages/{package_id}/instances/{instance_id}/ws/...`) holds one of
`control.package_proxy.ws_max_active` slots per session, and one source
address at most a quarter of them (at least one; 32 of the default 128); a
handshake over either limit is answered 503. Both directions of the proxy,
and the Control WebSockets `/api/v1/ws/events` and `/api/v1/ws/control`,
accept messages and frames of at most 2 MiB; a larger message ends the
session. The proxy pings the browser every 30 s, whatever the package sends.
It closes a proxied session when, for 60 s, no frame from the browser (a
message or the answer to a ping) arrives and no message to the browser is sent
after waiting for the connection to accept more data, or when one message
cannot be sent within 60 s. A browser answers pings by itself, so a live page
keeps its session even when it sends nothing. A page that reads slowly keeps
its session while the proxy's messages to it have to wait for its connection to
accept more data, even when its answer to a ping waits behind that data for more
than 60 s. A page that takes data more slowly than the package sends, but whose
connection buffers absorb the messages without such a wait, can be closed after
60 s. A page that has gone away, or that stops reading, is closed even while the
package keeps sending: at the latest about 120 s after its connection stopped
accepting data (the 60 s limit, plus up to 60 s for a message or ping whose send
had already started). The Control
WebSockets `/api/v1/ws/events` and `/api/v1/ws/control` have no ping, idle
limit or send timeout.

Terminal follows the current Console protocol without a separate transport
selection or HTTP exception: HTTP/ws or HTTPS/wss. Readiness checks the actual
connection, exact Origin/Host, OS login service, and session limits. Applying
Terminal ON/OFF does not restart Control. HTTP sends terminal traffic without
encryption; choose the Console protocol appropriate to the management network.

Native TLS is served by Control without an nginx proxy. HTTPS defaults to port
18443. Only the selected Console protocol is served. HTTPS closes the separate
HTTP Console listener. API/product HTTP listeners remain available under their
independent policies, but reject Console documents and management routes.
The HTTPS management origin excludes product frontend routes. Console login,
API security, stored passwords, and Terminal ON/OFF remain independent of the
connection selection. HTTP and HTTPS use separate Console session cookies.

The local administrator CLI remains available for provisioning outside the
managed Settings service:

```sh
sudo r2kernel-config management-https-native-prepare \
  --prefix <prefix> --owner-gid "$(getent group r2kernel | cut -d: -f3)"
sudo systemctl restart r2kernel-control
```

This explicit root preparation command enables HTTPS and reuses existing
complete TLS material. Container deployments must provision their own native
TLS material and OS login service. Support URLs are optional product metadata.

Example native HTTPS management configuration (replace all example values):

```yaml
control:
  api_host: "127.0.0.1"
  ws_host: "127.0.0.1"
  ui_host: "127.0.0.1"
  management_https:
    enabled: true
    bind_host: "0.0.0.0"
    port: 8443
    certificate_file: "<prefix>/management-tls/device.certificate.pem"
    private_key_file: "<prefix>/management-tls/device.private-key.pem"
    allowed_origins:
      - "https://robot-admin.example.com:8443"
  web_terminal:
    enabled: true
    max_sessions: 2
    connect_timeout_ms: 10000
    idle_timeout_sec: 900
    max_session_duration_sec: 3600
security:
  enabled: true
  api:
    require_auth: true
  web:
    login_required: true
    secure_cookie: true
  network:
    allowed_origins:
      - "https://robot-admin.example.com:8443"
    trust_forwarded_for: false
```

Use the password-file or environment-variable configuration described above
for the Web administrator credential. The OS account password is supplied only
at the local login prompt and is not stored in this configuration. `secure_cookie`
prevents the browser from sending its login cookie over plaintext HTTP.
HTTP management and native HTTPS have separate sessions; HTTPS always uses its
secure cookie regardless of the HTTP cookie setting. Exact permitted Console
origins and actual listener transport are required; forwarded headers never
establish TLS.

The supported `control.web_terminal` settings are `enabled`, `max_sessions`,
`connect_timeout_ms`, `idle_timeout_sec`, and `max_session_duration_sec`.
Remove legacy `transport`, `target_label`, `target_host`, `target_port`, and
`host_key_sha256` fields from existing configuration; unsupported fields are
rejected explicitly. Terminal readiness reports the fixed `local_login` mode.
The SSH target probe endpoint has been removed. An `allow_insecure_http` field is
rejected as an unknown field; Terminal always follows the Console connection.

Connection starts are limited to five per minute per directly observed peer,
including across Terminal settings apply. When the local login service is at
its session limit, Terminal Connect fails with error code `terminal_login_busy`
and the Console shows "Terminal login service is at its session
limit. Try again after another terminal session ends." Terminal status checks
the login service at most once per second. On stop, the login service ends
open sessions: each session's `login` receives SIGTERM, remaining session
processes are killed after 2 s, and the service waits up to 12 s in total for
its session supervisors; supervisors still running then are reported and the
service exits with an error. Login reservations count toward the
session cap. The managed local login service rejects disabled or excessive OS
pre-login timeouts: a configured `/etc/login.defs` `LOGIN_TIMEOUT` must be 1–120
seconds; an absent setting uses util-linux's 60-second default. These limits
complement rather than replace OS account lockout policy. A proxy may make
multiple browsers share a peer limit.

Restrict permitted browser origins and management-network access. A claimed
HTTPS Origin or forwarded header is not proof of an encrypted connection.

Terminal resources are bundled locally rather than loaded from a CDN. The
Terminal remains available in the existing Console menu, with `/terminal.html`
as an additional standalone page. That page is not a separate-origin security
boundary. Native HTTPS management excludes product frontends; when using HTTP
that also serves product routes, trust every frontend on that origin. Browser scripts or
extensions can capture OS login and `su`/`sudo` passwords and operate an authenticated
shell. Use a trusted management browser and origin.

Do not record WebSocket payloads or enable reverse-proxy request-body logging
for terminal traffic. Audit connection metadata rather than terminal contents.
The relay's disconnect and resource limits do not replace OS account policy,
authentication auditing, or process controls.

## Federation Security

Web/API security does not encrypt the cross-host federation data plane. It
protects browser and Host Control API access only.

Required Event framing protects raw TCP Event traffic against sniffing, frame
tampering and replay inside the configured shared-key trust group. A group member
is not a separately certified Station identity. Control forwarding uses
authenticated envelopes, not payload encryption; use the deployment's protected
network/VPN for confidentiality.

```yaml
federation:
  security:
    mode: "required"             # disabled, optional, required
    key_id: "robot-cell-a"
```

`disabled` keeps the lowest-overhead plaintext path. `required` is the
recommended appliance/product setting for a trusted closed federation group.
`optional` is useful during migration because it can accept plaintext inbound
peers while using secure outbound connections when key material is configured.

Event admission follows the receiver's configured mode:

| Mode | Federation registration receipt used for Event delivery |
| --- | --- |
| `disabled` | Unsigned receipts are supported; startup does not load a federation key. |
| `optional` | Unsigned receipts and correctly signed receipts are supported. A supplied signature must verify; invalid signatures are rejected, not treated as unsigned. Protected key material is loaded through the resource broker at startup. |
| `required` | A correctly signed receipt is mandatory. Missing, malformed, wrong-key, or incorrect signatures are rejected. |

This does not grant unsigned registrations remote Control binding authority:
remote Control still requires authenticated registrations and peer authority.
Every mode keeps Event's selected peer/publisher/topic provenance, local-name
and peer-name collision handling, codec compatibility, and receipt freshness
checks. Withdrawal or a changed epoch, session, or registration revision retires
the previous source lease; queued bytes cannot be relabeled as its replacement.

Federation status is exchanged only through each peer's Host API hello
(`GET /api/v1/control/federation/hello` on the peer's `api_port`), in every
mode. That request is subject to the peer's Host API authentication,
network allowlist and `federation.security` checks; there is no plaintext
status port or fallback. A peer whose hello fails is skipped until the next
status interval. A peer's `api_port` defaults to this host's
`control.api_port` (`8001`). Keep Host API security enabled with
`federation.security.mode: required`.

Production `optional`/`required` Control loads key material from the resource
broker's root-protected authority policy `federation_key_path`. Provision the
same reviewed trust-group key through the installed resource-authority workflow;
packages cannot read it through the broker. The normal inline `key`, `key_file`
and `key_env` resolver is compiled only for native test fixtures and is not a
production alternative to this broker path. The file may hold a keyring; rotate
it without a restart through
[Federation Key Rotation](../api/host-control-rest-api.md#federation-key-rotation).

The mode and key identifier remain configurable:

```text
r2kernel config set federation.security.mode required
r2kernel config set federation.security.key_id robot-cell-a
```

Runtime peer policy is separate from credentials and firewall policy. See
[Runtime Federation Peers](../api/host-control-rest-api.md#runtime-federation-peers)
for authenticated administration, generation/revision handling and restart
recovery. The federation data plane listens on `federation.bind_port`, default
`42001`, beside `control.api_port` `8001` (Host API, also used for federation
status) and `control_transport.relay_port` `41001`. Each is a per-host setting: a port that is
already in use fails Control startup with a bind error instead of moving, and
remote peers learn Event ports from the hello snapshot, so changing one host's
port needs no change on its peers. Build VPN/firewall allowlists from each
host's configured ports. `bind_port: 0` still allocates a port per start, which
an allowlist cannot name in advance. An IP/port allowlist does not
authorize individual API functions or fence an old Station execution.

## Public Health Endpoints

`/api/v1/health` and `/api/v1/ready` may remain unauthenticated for local service probes when
`security.health.unauthenticated=true`. Network admission still applies. Disable
that option if the deployment requires every HTTP endpoint to authenticate.

## Binding Policy

For local development, prefer.

```yaml
control:
  api_host: "127.0.0.1"
security:
  enabled: false
```

For an appliance or managed robot host, prefer.

```yaml
control:
  api_host: "0.0.0.0"
security:
  enabled: true
```

Then restrict `security.network.allow_cidrs`, configure at least one API key,
and configure a web admin password before exposing the UI on the management
network.

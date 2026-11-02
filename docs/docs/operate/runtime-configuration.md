# Runtime Configuration

R2Kernel™ is a configurable robotics runtime. Before choosing a CLI command or a
browser tool, identify which part of the installed host you are configuring.

This page writes the install prefix as `<prefix>`; the default prefix is listed in
[Installation](../getting-started/installation.md#interactive-install).

The active runtime config is this.

```text
<prefix>/runtime/config.yaml
```

The installer also provides a convenience entry point.

```text
<prefix>/config.yaml -> <prefix>/runtime/config.yaml
```

Configuration commands write overrides instead of rewriting the base file.
Unmanaged installations use the sibling override:

```text
<prefix>/runtime/config.override.yaml
```

Managed Linux service installations also prepare a private Control settings
override under `<prefix>/var/lib/control-config`. Control resolves the base,
system override, and then supported Control settings. The privileged resource
and time-sync services do not load that private Control override. The GUI and
management CLI use the same resolver. Relative paths still resolve beside the
base configuration, not beside the private override.

For ordinary SDK and runtime commands, load the installed environment in the
current shell, or opt into shell-profile integration during installation.

```text
. <prefix>/env.sh
```

This is not administrator authentication, and the modified PATH does not carry
over to `sudo`. System installations with Linux services provide a separate
administrator entry that selects the actual configured base file:

```bash
sudo /usr/local/bin/r2kernel-config
sudo /usr/local/bin/r2kernel-config paths
sudo /usr/local/bin/r2kernel-config set product.name "Acme Robot Controller"
```

If `/usr/local/bin` is in sudo's search path, `sudo r2kernel-config` is equivalent.
The entry does not depend on `env.sh`. User-home installs have no system-wide
entry. On installations predating this entry, use
`sudo <prefix>/runtime/bin/r2kernel-config --config <prefix>/runtime/config.yaml`.

System base and sibling override files remain root-owned and readable by the
service group; do not make the whole installation group-writable. Supported
operational settings are saved to the private Control override as the service
user, even when the administrator CLI was invoked through `sudo`. System-owned
fields are read-only in the GUI and CLI form. Use the administrator entry's
`set`/`unset` commands for privileged system changes. Without safe write access,
configuration surfaces report the restriction rather than changing ownership.
Saves validate the resolved settings, reject stale revisions, back up an existing
override, and replace it atomically. Runtime updates preserve existing base and
override configuration.

## Ways To Change Configuration

Use one of these surfaces depending on where you are operating from.

| Surface | Use |
| --- | --- |
| `r2kernel config tui` | interactive form for common settings |
| `r2kernel config get/set/unset` | scripted or SSH-based override changes by dotted key |
| Web Console Settings | browser-based editing and apply actions |
| direct YAML editing | site automation or reviewable base/override changes |

Examples.

```text
r2kernel config paths
r2kernel config print
r2kernel config get control.api_port
r2kernel config set product.name "Acme Robot Controller"
r2kernel config validate
```

When you edit YAML directly, validate before restarting services.

```text
r2kernel config validate
sudo systemctl restart r2kernel-control.service
```

Some settings are read only at service startup. Saving through the configuration
CLI never restarts services automatically: review the change, then schedule any
required restart yourself. Browser apply actions are a separate operation.

## Configuration Areas

The common operator-facing areas are these.

| Area | Representative keys | What it controls |
| --- | --- | --- |
| Product identity | `product.name`, `product.vendor`, `product.support_url` | names shown to product-facing clients and the Web Console |
| Host control | `control.api_host`, `control.api_port`, `control.ui_port`, `control.management_https.*`, `control.advertise_host` | canonical REST/WebSocket API, separate Console listeners, and peer reachability |
| System frontend | `control.frontend.mode`, `control.frontend.root` | bundled Console, custom product shell, or headless API mode |
| Package storage | `packages.install_dir`, `packages.additional_paths`, `packages.max_upload_bytes` | managed package storage, external package discovery, and upload limit |
| Resource authority | `resource_service.mode` | managed resource lease behavior |
| Web/API security | `security.enabled`, `security.network.allow_cidrs`, `security.api.*`, `security.web.*` | browser login, API auth, source-network gates, and sessions |
| Federation | `federation.peers`, `federation.membership_scope`, `federation.membership_file`, `federation.transport`, `federation.security.*` | bootstrap peer list, durable runtime admission, Event forwarding and federation security |
| Time sync | `time_sync.enabled`, `time_sync.nic`, `time_sync.role`, `time_sync.leader_host` | clock readiness and managed time-sync behavior |
| Control transport | `control_transport.*` | host-to-host Control relay, outbound lanes, RT memory preparation, and local Control buffer limits |
| Core worker scheduling | `core_scheduling.policy`, `core_scheduling.priority`, `core_scheduling.cores` | scheduling for internal communication and fast data workers |
| Shared memory | `shm_manager.*` | event shared-memory pool sizing |

The installed default keeps the bundled Web Console enabled on loopback port
`18080`; product API and WebSocket ports remain `8001`. Authentication is
disabled for this local setup profile, not configured
with a shared default password. Before exposing a host beyond loopback,
configure Web/API security and source-network policy. Existing override files
may retain older network-facing settings; inspect the effective configuration
after upgrades.

`federation.peers` seeds a Control only while no durable runtime membership
record exists. Later file edits do not overwrite that record or reset its
generations. Use the authenticated
[Runtime Federation Peers](../api/host-control-rest-api.md#runtime-federation-peers)
API to add, replace or remove live peers; saving generic configuration is not a
second membership writer.

Runtime upgrades use the installer rather than independent service restarts.
Only an installation of a final release is upgraded in place; a prerelease
installation must be removed with `r2kernel-uninstall` before installing
(see [Clean Installs And Upgrades](../getting-started/installation.md#clean-installs-and-upgrades)).
The installer stops declared dependent systemd units and application supervisors
before Control and `r2kernel-resourced`, replaces the runtime and SDK, then waits
for resource-service and Control readiness before restoring the original active
units. `--system-services skip` preserves this coordination for an already
registered prefix while skipping new service registration. Applications launched
outside systemd need to be stopped separately. An incomplete replacement leaves
the affected units stopped with a protected `/run/r2kernel-upgrade` recovery
journal; retry the same-prefix installation to finish the upgrade.

## Core Worker Scheduling

On Linux, internal Control transport, Event, and federation fast data workers
default to `SCHED_FIFO` priority 99. Host status refresh, resource reconciliation, time-sync
management, HTTP, and Web Console tasks remain on the normal executor.

```yaml
core_scheduling:
  policy: fifo       # other, fifo, or rr
  priority: 99       # other requires 0; fifo/rr require 1..99
  cores: []          # preserve inherited affinity; optionally select allowed CPUs
```

Omitted worker settings use these platform defaults. An explicitly configured
policy or priority is preserved; updating the runtime does not replace a saved
priority with the new default.

Each communication worker applies and reads back its own scheduling policy,
priority, and CPU affinity before accepting work. Startup logs include its
thread ID and the verified settings. A denied or invalid request fails worker
startup; it does not silently switch to `other`. Apply configuration changes
by restarting the runtime.
On a managed installation, edit these worker settings in the administrator-owned
base configuration; the Console's user-editable overlay does not grant changes
to the host scheduling policy.

The installed non-root Control service grants `LimitRTPRIO=99`,
`LimitMEMLOCK=64M` and `LimitNOFILE=65536`. These permit the admitted scheduling
and memory-lock configuration; they do not qualify real-time performance.
Managed packages do not inherit that real-time limit: each package is bounded
to its admitted CPU claim (see
[Resource Control](resource-control.md#subsystem-cpu-scheduling) and
[Real-Time Scheduling](realtime-scheduling.md)). Management tasks use
`SCHED_OTHER`. Other supported platforms default to `other` and inherited
affinity.

Listener resource exhaustion is reported without stopping Control. Admission
may be delayed or refused while the host is exhausted; inspect diagnostics and
restore sufficient file-descriptor and memory capacity. This is not an
availability or real-time guarantee.

Real-time operation requires sufficient memory-lock permissions and the
configured memory budget. Preparation and admission failures are explicit.
Allow headroom for active connections and capacity changes.

```yaml
control_transport:
  rt_memory_lock_enabled: true
  rt_memory_budget_bytes: 67108864  # 64MiB process admission limit
  rt_stack_prefault_bytes: 65536   # 64KiB per worker; maximum 256KiB
```

FIFO/RR requires memory locking. A lock failure, exhausted budget, or invalid
stack range fails preparation explicitly. To opt out of RT locking, select
`core_scheduling: {policy: other, priority: 0}`. Change these settings in the administrator-owned base configuration
and restart Control. Increasing the budget also requires a sufficient service
`LimitMEMLOCK`; changing the admission limit does not raise the OS limit.

These settings constrain runtime memory preparation, not every allocation in
application callbacks or response construction. They do not establish a
page-fault-free process or a worst-case transaction latency guarantee.

This setting does not select a policy for user subsystem processes. Declare
those policies separately in `package.yaml` under `resources.cpu`. RT priority
does not remove waits for shared locks or provider responses, and does not by
itself establish a deadline guarantee.

## Minimal Product Identity

Product metadata is safe to change first because it affects display and API
metadata, not the native runtime hot path.

```text
r2kernel config set product.name "Acme Robot Controller"
r2kernel config set product.vendor "Acme Robotics"
r2kernel config set product.support_url "https://support.example.com"
```

Product-facing clients can read these values through Host Control status and
capability APIs. The Web Console Settings page exposes the same fields.

## Host And Frontend Policy

The control backend serves REST APIs, WebSocket facade endpoints, and the system
frontend using the configured hosts and ports. Console HTTP defaults to
`control.ui_port: 18080`, while HTTPS defaults to
`control.management_https.port: 18443`. A missing Console port uses these
defaults. Explicit values are preserved, including `control.ui_port: 0`, which
shares `control.api_port`.

```yaml
control:
  api_host: "127.0.0.1"
  api_port: 8001
  ui_port: 18080
  frontend:
    mode: "bundled"   # bundled, custom, or disabled
```

Use `bundled` for the R2Kernel Web Console. Use `custom` when a product should
serve its own static operator UI from `/`. Use `disabled` for a headless host
that exposes Host Control APIs without a system frontend.

For the detailed product UI policy, see
[Product Frontend Modes](product-frontend-modes.md).

The managed Linux Console starts with HTTP. Settings → Security → Console
connection selects HTTP or native HTTPS and either a generated device identity
or a user-provided certificate/private-key PEM pair. Save, then apply saved
settings to restart Control and reconnect. `control.management_https` stores the
saved listener and protected material paths. A restricted root settings service
owns those files; the ordinary service override cannot replace their paths.
Console HTTP entry points redirect when HTTPS is active. Product/API HTTP ports
remain independent. HTTP and HTTPS Console sessions have separate cookie names
and session scopes. Product support URLs are optional metadata.

Console-origin `/console/api/v1` management uses Console login/session policy.
Canonical `/api/v1` REST and WebSocket requests use the independent API policy
and require an API key when API security is ON. Console cookies never authorize
canonical API requests, even with `ui_port: 0`. Browser WebSocket clients cannot
set arbitrary key headers; use the Console session endpoints for Console pages
or a product-owned server adapter for canonical API integration, never URL keys.

`control.web_terminal.enabled` defaults `false`. Terminal follows the Console
connection: HTTP/ws or HTTPS/wss. Settings → Terminal exposes ON/OFF and optional
session limits. Applying Terminal changes closes sessions without restarting
Control. Exact permitted origins, actual listener admission, and OS login checks
still apply. Any other `control.web_terminal` field, including
`allow_insecure_http`, is rejected as an unknown field.

## Security Before Exposure

Fresh API/UI/WebSocket, registration UDP, federation data, and
Control relay listener binds default to loopback. These defaults are not a
sandbox for local users or packages and do not disable managed PTP/time-sync
network traffic. Before binding a host to a reachable network, configure
credentials, access policy, and the required network interfaces explicitly.

Registration UDP (`control.udp_port`) binds the same host as
`control.api_host`. A datagram whose receive, reply or notification fails is
logged (at most one line per 5 s per kind) and does not stop Control. A reply
larger than 65,507 bytes is replaced by a short error that names the local Unix
control socket, and a UDP error text longer than 256 bytes is replaced by a
fixed message, so an error reply never quotes a long request value. Remote
logical-clock time sync probes a leader's `control.udp_port`, so a multi-host
logical clock needs that bind reachable.

```text
r2kernel config set security.enabled true
r2kernel config set security.api.require_auth true
r2kernel config set security.network.allow_cidrs '["127.0.0.1/32", "::1/128", "192.0.2.0/24"]'
```

Store API tokens and web passwords in private files owned by the Control service
user, or in service-managed environment variables, rather than inline YAML. See
[Web and API Security](web-and-api-security.md) for the full pattern.

The `192.0.2.0/24` network is an example documentation range: replace it with
your actual restricted management network. For remote deployment, select only
the necessary binds: `control.api_host`, `federation.bind_host`, and
`control_transport.bind_host`, plus a reachable `control.advertise_host`.
Federation status is exchanged only through each peer's authenticated Host
API hello, so every federated peer's `control.api_port` must be reachable
from its peers; Host API authentication, network allowlists and
`federation.security` apply to that request. A `federation.peers` entry
without `api_port`, including the plain-host form `peers: ["192.0.2.22"]`,
uses this host's `control.api_port` (default `8001`) as the peer's API port.
There is no separate federation status port: a configuration that sets
`control.tcp_host`, `control.tcp_port`, or `port`/`tcp_port` in a
`federation.peers` entry fails to load with an error naming the key; remove
the key. `control_transport.bind_host` also selects the default
outbound interface for host-to-host Control; setting peer addresses alone is insufficient. These binds
and the advertised host are read at startup: inject an overlay address through
the configuration before Control starts, and restart Control to move it. Peers
and federation keys, by contrast, change at runtime through the
[peer](../api/host-control-rest-api.md#runtime-federation-peers) and
[key rotation](../api/host-control-rest-api.md#federation-key-rotation) APIs.

`control_transport.relay_enabled` defaults to `true`. Set it to `false` to disable
the remote inbound Control relay listener and its receive workers, then apply
the settings to restart the runtime. Local Control and outbound clients for
configured peers remain enabled. Other hosts cannot send Control requests to
this host while its relay is off; this host can still send requests to peers
whose relays are enabled.

Control timing statistics cover at most 4096 distinct identities. Additional
identities are not tracked while capacity is exhausted;
`control_timing_identities_untracked` counts tracking refusals, not failed
application requests or distinct clients. Timing coverage can therefore be
incomplete under high identity churn. Unregistered and idle identities expire;
`control.subsystem_timeout` supplies the idle timeout when capacity is full.
These diagnostic limits do not expand an exchange deadline or establish
real-time qualification.

Web/API authentication covers HTTP and WebSocket routes, not all native ports.
Use TLS termination for remote browser/API access. Require federation frame
security and configured keys for remote federation, and restrict the
registration UDP and Control relay ports to trusted peers through firewall/VPN policy.
VPN membership does not replace application-user authentication or isolate
untrusted installed packages.

## Control Transport Settings

The `control_transport` section configures the runtime's Control relay for
host-to-host Control requests, its outbound lanes, real-time memory
preparation, and the local Control shared-memory limits. Every key is
optional; the section rejects unknown keys at load time.

| Key under `control_transport` | Default | Meaning |
| --- | --- | --- |
| `relay_enabled` | `true` | run the remote inbound Control relay listener and its receive workers |
| `bind_host` | `127.0.0.1` | relay listener bind and default outbound interface for host-to-host Control |
| `relay_port` | `41001` | Control relay listener port |
| `nic` | `auto` | advanced Control relay NIC override; application network policy belongs in package resources |
| `max_outbound_lanes` | 16 | concurrently active remote Control route/topic lanes; excess lanes fail explicitly |
| `max_outbound_pending_per_lane` | 4 | queued requests per outbound lane; stale requests are not sent later |
| `max_relay_inflight` | 16 | concurrent remote handler dispatches at this receiving host |
| `rt_memory_lock_enabled` | `true` on Linux | lock runtime memory for real-time workers (see [Core worker scheduling](#core-worker-scheduling)) |
| `rt_memory_budget_bytes` | 67108864 | process admission limit for locked runtime memory |
| `rt_stack_prefault_bytes` | 65536 | stack prefault per real-time worker; maximum 262144 |
| `shared_buffer_pool_name` | `r2kernel_control_local` | name of the local Control shared-memory pool |
| `shm_*`, `shared_buffer_slot_size` | see below | local Control memory limits described in [Local Control Memory Limits](#local-control-memory-limits) |

Before 1.0 this section had a different name. A configuration that still uses
the old section name fails to load with an error that names
`control_transport`; rename the section and keep its keys.

## Local Control Memory Limits

Local Control v5 runs over a Unix socket and uses reusable shared memory for
every application payload, regardless of payload size. There is no inline
payload path and no alternative local transport, so `control_transport` has no
key that selects a local delivery backend or an inline payload threshold; such a
key fails to load as an unknown field. The runtime also refuses to start while the
`R2KERNEL_CONTROL_VALIDATION_MODE` environment variable is set; unset it.
Host-to-host Control remains best-effort TCP.

Upgrade the runtime and all SDK-based subsystem processes together. Local
transport version mismatches fail explicitly; an unsuccessful exchange is not
automatically retried. Successful completion confirms that the response buffer
can be reused. Existing SDK-owned-buffer APIs are unchanged.

Prepare a bounded local Control lane during initialization with explicit request
and response capacities and a separate cold preparation budget. Preparation
must reach the selected provider and reserve the required resources without
calling the application handler. A connection or registration acknowledgement
alone does not establish provider readiness. Once prepared, requests exceeding
those capacities or using a changed route/binding require fresh preparation;
the timed path does not silently reconnect or grow buffers. Preparation is not
proof of 1 ms completion: route selection, payload processing, response handling,
and safe buffer reclamation all count in the exchange budget. Retained failures
and late completion remain errors; no automatic retry is implied.

| Key under `control_transport` | Default | Meaning |
| --- | --- | --- |
| `shm_min_region_bytes` | 4096 | minimum local shared-memory region size |
| `shared_buffer_slot_size` | 16777216 | maximum total size of one local region, including transport overhead |
| `shm_max_channels` | 128 | maximum active channels counted by the runtime's local Control transport |
| `shm_max_owned_bytes` | 67108864 | aggregate bytes for regions created by the runtime's local Control transport |
| `shm_max_mapped_bytes` | 67108864 | aggregate bytes for peer-owned regions mapped by that transport |

Request and response capacity are independent. A production local lane is
scoped to the selected endpoint, topic, bound source and exchange kind. One
exchange may be in flight on that lane; concurrent or reentrant use of the same
lane reports busy. Independent bound sources and interfaces have distinct
lanes within aggregate transport limits. This does not promise that a provider
callback or physical device can execute concurrently.

The configured region maximum is a cap, not an upfront reservation for every
active channel. Treat the channel count as an aggregate transport limit; it is
not guaranteed to match the number of logical interfaces one for one. Both byte
budgets must accommodate the configured maximum region and leave headroom for
concurrent use. Payload growth can temporarily require additional memory while
capacity changes, so allow enough room to stay within the applicable budget.

The byte budgets apply across the local Control transport, not per logical
interface. The created-region and peer-mapping budgets account for different
resources and both must accommodate the workload. Payload growth and concurrent
use need headroom. Limits fail explicitly; Control neither falls back to another
transport nor automatically retries. Validate changes and restart the affected
runtime and subsystem processes together. Event pool settings remain independent.

## Package And Runtime State

Managed package state should stay inside the R2Kernel product prefix. Product
installs use a writable package state location under the prefix so installed packages
survive runtime replacement while remaining owned by the control service.

Check the active value before changing it.

```text
r2kernel config get packages.install_dir
```

Relative paths resolve beside the active `config.yaml`. Prefer absolute paths
for site-specific product deployments when ambiguity would be risky.

`install_dir` and its ancestors must not be symbolic links; symlinked install
roots are not supported. To use a mounted volume, set the resolved directory.
Control refuses a symlinked install root with a message that names the symlink,
`packages.install_dir`, the active configuration file and the resolved directory
to configure:

```text
package install root must not have symlink ancestors: <ancestor> is a symlink to <target>. Set packages.install_dir in <config path> to the resolved directory <resolved directory> (r2kernel config set packages.install_dir <resolved directory>) and restart Control.
```

If the resolved directory cannot be computed, the message shows that error
instead of a path.

To make existing package trees available without copying them into the managed
install directory, add package directories or package roots to
`packages.additional_paths`.

```yaml
packages:
  install_dir: "<prefix>/var/lib/packages"
  additional_paths:
    - "/srv/robot-packages"
    - "../development/my-package"
```

An entry may point directly to a directory containing `package.yaml`, or to a
root whose immediate child directories contain `package.yaml`. Relative entries
resolve beside the active `config.yaml`. R2Kernel validates and exposes these
external packages through Runtime, including their frontend and contract specs,
but never copies or deletes their source directories. Remove an external package
by removing its entry from `additional_paths` and applying the configuration.

## Next Tools

After the configuration model is clear.

1. Use [CLI Tools](cli-tools.md) for SSH, automation, service checks, package
   lifecycle, and runtime diagnostics.
2. Use [Web Console Manual](web-console-manual.md) for browser-based operation
   on a host.
3. Use [Time Sync Operations](time-sync-operations.md),
   [Web and API Security](web-and-api-security.md),
   [Resource Control](resource-control.md), and
   [Deployment Checks](deployment-checks.md) for production-readiness checks.
4. Use [Product Frontend Modes](product-frontend-modes.md) when a product should
   replace or disable the bundled Web Console.

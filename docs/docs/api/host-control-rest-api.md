# Host Control REST API Guide

The Host Control REST API is the HTTP API exposed by the control backend.

Use it for operator tools, automation, monitoring, deployment checks, Web Console
integration, package management, and configuration workflows. Do not use it from
native subsystem hot paths. Subsystems should use the [Subsystem SDK
API](subsystem-sdk-api.md).

This page explains how to use the REST API. For the table-oriented route
catalog, see [Host Control REST Routes](../reference/host-control-rest-routes.md).

## Base Origin

The API is served from the control backend origin.

```text
http://<host>:<control.api_port>
```

The stable product-facing prefix is this.

```text
http://<host>:<control.api_port>/api/v1
```

Canonical Host Control REST and WebSocket routes use `/api/v1`. Unprefixed
API routes return HTTP `404` instead of falling through to the system frontend.

The bundled Web Console normally has a separate origin: HTTP port `18080`, or
native HTTPS port `18443` when enabled. The canonical API defaults to port
`8001`. Explicit port overrides are preserved; `control.ui_port: 0` explicitly
shares the API listener. Console management uses `/console/api/v1` on the actual
Console origin, not a session cookie on the canonical API. Managed package
frontend assets remain separate under `/api/v1/packages/<package-id>/ui/`.

## Security

Requests pass network admission and the authentication policy of their surface:

- canonical `/api/v1` uses API security and API keys
- Console-origin `/console/api/v1` uses Console login and sessions

Canonical API clients send either header when API security is ON:

```http
Authorization: Bearer <api-key>
```

```http
X-R2Kernel-API-Key: <api-key>
```

The Console signs in at `/console/api/v1/auth/login` on its own origin and uses
the issued session cookie for `/console/api/v1` requests. Console cookies never
authenticate canonical `/api/v1` requests, even on a shared listener. Console
login and API security are independent switches: enabling one does not protect
the other. Network admission always applies. See
[Web and API Security](../operate/web-and-api-security.md).

Authenticated identities carry one of three standard roles.

| Role | Intended use |
| --- | --- |
| `viewer` | read-only status, specs, events, and monitoring |
| `operator` | viewer access plus runtime operation such as Control WebSocket and app start/stop |
| `admin` | operator access plus config, package installation/removal, security, and service apply actions |

## Health And Readiness

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Lightweight process health and shared-memory manager connectivity |
| `GET` | `/api/v1/ready` | Runtime readiness with HTTP `200` when accepted and `503` when not ready |

`/api/v1/health` and `/api/v1/ready` may be unauthenticated when
`security.health.unauthenticated=true`. Network admission still applies.

## Runtime Status

`/api/v1/control/status` is the main operator snapshot. It includes subsystem
inventory, Event runtime state, Control runtime state, federation state,
time-sync state, resource state, managed package instances, and WebSocket
bridge health.

`managed_instances` is keyed by active resource lease ID. Each value identifies
the installed package and instance that owns that lease, plus its instance UI
route when a frontend is available. Stopped instances are omitted. Runtime
clients can therefore resolve managed actions from the same live snapshot as
`subsystem_status` without polling the package catalog separately.

```json
{
  "managed_instances": {
    "package-instance-lease-id": {
      "package_id": "vendor.package",
      "package_name": "Vendor Package",
      "instance_id": "robot.instance",
      "frontend": {
        "available": true,
        "url": "/api/v1/packages/vendor.package/ui/?instance=robot.instance&context=/api/v1/packages/vendor.package/instances/robot.instance/context"
      }
    }
  }
}
```

Use `/api/v1/control/specs` when building a spec dictionary browser, and
`/api/v1/control/bindings` when inspecting or changing runtime binding overrides.
Every product-facing API route is available under `/api/v1`, for example
`/api/v1/control/status` and `/api/v1/control/bindings`.

For the full table, see [Host Control REST Routes](../reference/host-control-rest-routes.md#runtime-status-and-bindings).

`GET /api/v1/shm_manager` remains available as a diagnostic/support snapshot.
Its implementation-level payload is not a stable application transport or
shared-memory management contract. Use health/readiness and runtime status for
ordinary integration; do not couple applications to its internal pool layout.

## Spatial Frame Graph

`GET /api/v1/control/frames` returns resolved spatial ports, static compound
mounts, dynamic subsystem transforms, and graph diagnostics.

Use the lookup route to compose one current transform.

```text
GET /api/v1/control/frames/lookup?source=component.localizer/map&target=component.arm/tool0
```

Stale dynamic edges remain in the graph response for diagnosis but are excluded
from lookup. Native subsystems should report owned transforms through the SDK;
the REST routes are for operator tools and external integrations.

## Subsystem Lifecycle

Request body example.

```json
{
  "transition": "pause",
  "reason": "operator request",
  "session_id": "optional-current-session-id"
}
```

Valid transition names are `start`, `pause`, `resume`, `stop`, `reset`,
`fault`, and `degrade`. The endpoint validates the current subsystem lifecycle
state, session activity, and notify endpoint before accepting the request.
Completion is observed through `/api/v1/control/status` or Runtime Graph after the next
subsystem heartbeat.

Managed process action request body example.

```json
{
  "action": "terminate",
  "session_id": "optional-current-session-id"
}
```

Valid process actions are `terminate` and `kill`. They require the subsystem to
have a managed resource lease. `terminate` sends `SIGTERM` with a grace window
and may escalate to `SIGKILL`; `kill` sends `SIGKILL` immediately.

For the full route table, see [Host Control REST Routes](../reference/host-control-rest-routes.md#subsystem-runtime-control).

## Configuration

Prefer `/api/v1/control/config/fields` for ordinary UI or automation changes. Use raw
override YAML only for advanced fields that do not yet have a structured form.
Configuration writes require an `admin` identity when security is enabled.

`/api/v1/control/runtime/apply` is the safe apply path for managed runtime changes. OS
policy changes, unmanaged subsystem processes, and low-level device policy may
still require manual service restart or host reboot.

For the full route table, see [Host Control REST Routes](../reference/host-control-rest-routes.md#configuration-and-runtime-apply).

## Security Management

API key secret values are returned once at creation time and are hidden
afterwards.
Security management requires an `admin` identity when security is enabled.

For the full route table, see [Host Control REST Routes](../reference/host-control-rest-routes.md#security).

## Runtime Federation Peers

`GET` and `PUT /api/v1/control/federation/peers` require an authenticated `admin`.
Enable management authentication (`security.enabled: true` and
`security.api.require_auth: true` for canonical API automation); disabled-mode
identities cannot use these routes. Console clients use the corresponding
`/console/api/v1` route and the existing Console session/origin policy.

`GET` returns `version`, `scope`, desired `revision`, `applied_revision`, `pending`
and the complete admitted `peers` list. Configure `federation.membership_scope`
before provisioning a project; its default is this Control's advertised host
identity (or `control.api_host` when unset), not an application-user identity.
`PUT` replaces the complete list, so omitting an existing peer removes it:

```json
{
  "version": 1,
  "scope": "robot-a",
  "expected_revision": 0,
  "revision": 1,
  "peers": [
    {
      "id": "station-b",
      "host": "10.50.0.12",
      "api_port": 8001,
      "generation": 1,
      "authority_epoch": "authenticated-peer-epoch"
    }
  ]
}
```

Read the current scope/revision before changing it. Revisions must advance;
`expected_revision` must match the current desired revision. An exact same
revision/list retry is idempotent and resumes a pending operation. A changed or
re-added peer needs a generation greater than every generation previously used
for that peer; removal retains a tombstone. `authority_epoch` is an optional
pin of authenticated discovery's execution epoch, not a user credential.
`api_port` is required: it is the peer's Host API port, the only path for
federation status. Control fetches the peer's authenticated
`GET /api/v1/control/federation/hello` there; a failed fetch skips that peer
until the next status interval. There is no status TCP port, and a peer entry
with the removed `port` field is rejected. Event connection ports come from the
accepted hello snapshot. `api_port` must be an explicit nonzero port; peer
policy does not change the local
`federation.bind_port` (default `42001`) or impose a VPN/firewall port policy.

`200` means policy publication and retirement of affected old Control-owned
Event and Control work completed. It does **not** mean a peer connected or
subscriptions synchronized; inspect `/api/v1/control/status` for that evidence. `202` with
`pending: true` is not applied success: retirement continues after the HTTP
caller disconnects. Query until `applied_revision == revision` and
`pending: false`, or retry that exact policy after an error. A different policy
cannot bypass an unsettled revision. Invalid input returns `400`, revision or
generation conflicts `409`, storage/durability errors `500`, and an unready
Control `503`. Never assume a `500` rolled back a record whose rename completed.

Local retirement does not stop a remote callback already dispatched, undo its
effects, or recall bytes already handed to a remote transport/subscriber.
Station execution stop/fence and address-reuse quarantine remain platform
responsibilities; peer policy is not a distributed actuator-completion barrier.

Policy is stored independently of installed packages. The default is
`<parent of packages.install_dir>/control-config/federation-peers-<hash>.json`,
where `<hash>` is the full SHA-256 of the canonical absolute install-root bytes.
It survives package removal and overrides bootstrap `federation.peers` after a
Control restart. Provision its parent for the Control account, private `0700`
with protected ancestors; new records and writer locks use `0600`. An explicit
`federation.membership_file` must remain outside the package install tree and
its aliases. Use a separately provisioned private directory for custom filenames,
not the installer's reserved managed configuration namespace. Scope/version
mismatch or unsafe state fails explicitly rather than restoring bootstrap peers.

An absent record selects configuration bootstrap. Do not delete the policy file
to recover a failed mutation: deleting it loses tombstones and can restore
configured peers. Moving the package install root also changes its default
policy identity; migrate retained policy explicitly instead of silently resetting it.

Concurrent policy writers are refused rather than overwriting a newer revision.
A successful response confirms durable local publication; it is not distributed
process fencing. On an error, inspect the stored revision and pending state
before repeating the exact request.

## Federation Key Rotation

`GET /api/v1/control/federation/security` and
`POST /api/v1/control/federation/security/reload` require the same authenticated
`admin` as runtime peers. Neither carries key material: the resource broker
re-reads its root-protected `federation_key_path`, and responses report key ids
only:

```json
{
  "ok": true,
  "mode": "required",
  "active_key_id": "project-2026-11",
  "accepted_key_ids": ["project-2026-10"],
  "generation": 2,
  "reloaded_at_ns": 1793000000000000000,
  "closed_sessions": []
}
```

The key file may hold one key (named by `federation.security.key_id`) or a
keyring whose first line is the header below. The `active` key signs outbound
handshakes, Control envelopes and registration snapshots;
`accept` keys are verified only. Ids use letters, digits, `.`, `_`, `-` or `:`
(at most 64), each key needs at least 16 bytes, at most 8 keys fit, and a
keyring's ids replace `federation.security.key_id`:

```text
# r2kernel federation keyring v1
active project-2026-11 hex:<64 hex digits>
accept project-2026-10 hex:<64 hex digits>
```

Rotate in three steps, finishing each step on every host of the trust group
before the next one. A host one step behind still interoperates in both
directions:

1. Stage: keep the current key `active` and add the new key as `accept`.
2. Switch: make the new key `active` and keep the old key as `accept`.
3. Retire: remove the old key.

Write the file atomically (same directory, root-owned, mode `0600`), then
`POST .../reload`. Established Event sessions keep their session keys through
steps 1 and 2. Step 3 closes only sessions derived from the removed key and
lists their peers in `closed_sessions`; those peers stay admitted and reconnect
with the active key on the next control tick, so their Event traffic pauses for
that reconnect. Control envelopes are verified per message and need no
reconnect.

A reload validates the whole file before changing anything: invalid material
returns `400` and keeps the current keys, an unreadable file `500`, a Control
without the broker or federation runtime `503`, and `disabled` mode `409`. A
reload never changes `federation.security.mode`; enabling or disabling security
still needs a restart.

## Managed Packages

Managed package endpoints operate on installable packages. A package declares
one subsystem entrypoint, its role, frontend assets, environment, package
parameters, and resource claims in `package.yaml`. Packages may contain
`role: gateway`, `role: component`, `role: compound`, or `role: app`
subsystems. `role: app` means an application subsystem. It is not the install
unit name.

`POST /api/v1/control/packages/install` accepts the archive fields `filename`,
`content_base64`, and `replace`. Installation registers one package record by
package name. `POST /api/v1/control/packages/{package_id}/start` may include
`instance_id`, `params`, `runtime_dir`, `bindings`, and `resources` to create a
concrete runtime instance from that installed package; unknown fields are
rejected with `400`. If `instance_id` is omitted, the package id is used.

`GET /api/v1/control/packages` answers `500` with `"code": "package_store_unavailable"`
when Control cannot open, lock or read the package store at
`packages.install_dir` (for example its permissions, or a file in place of the
directory); `error` names the path and the operating-system error. Repair the
store and retry. Package mutations preserve typed errors in `code`: policy
`400`, missing target `404`, conflict `409`, broker transport or not-dispatched
`503`, and store I/O or internal failure `500`. Match `code`, not diagnostic text;
see [Resource Authority](../reference/resource-authority.md#stable-mutation-errors).

`bindings` maps the package subsystem's requirement names to provider
interfaces (`{"mobility": "component.mobile.mobile_base"}`). They are validated
against the package manifest, recorded with the instance, and applied through
the same validation as an operator binding right after that started instance's own
process has registered. They are kept with the running instance: `restart` and
runtime apply of that instance reuse them (on `restart`, an omitted field keeps
them and an explicit map, including `{}`, replaces them), and Control discards
the launch binding intent when the instance's lease ends. A launch binding intent
that Control discarded (inform-down, cleanup, stop) is not restored when a
process re-registers in the same lease while that Control process runs, however
many other intents it settles meanwhile. Control keeps no record of the discard
across its own restart: after a Control restart, an instance whose lease is
still running gets its recorded bindings restored when its process registers
again (the Python and C++ SDKs do this automatically; see
[Subsystem SDK Reference](../reference/subsystem-sdk-reference.md#runtime-notes)),
and that restored intent yields to every operator binding or unbind made by the
restarted Control. Stopping an instance removes its record, so a later `start` must send `params`, `runtime_dir`,
`bindings` and `resources` again; an omitted or `null` `resources` at `start`
uses the manifest claim.
`resources: {"cpu": {...}}` replaces the package's CPU claim for this instance;
see [Resource Control](../operate/resource-control.md#per-instance-cpu-claims).
`stop` accepts only `instance_id`. Starting fails when the same instance id is already running.
Starting with a different instance id creates another managed runtime instance,
subject to resource-policy conflicts. `stop` and `restart` accept `instance_id`
to target a specific instance. A stopped, terminated, or killed runtime instance
is removed from the active package-instance registry. Reusing its instance id on
a later start creates a new active instance with that id. Package
installation/removal requires `admin`.
Lifecycle operations require `operator` or `admin` when security is enabled.

For the full route table, see [Host Control REST Routes](../reference/host-control-rest-routes.md#managed-packages).

## Package Frontend Assets

The `/ui/` paths are static frontend delivery paths. Instance-scoped context and
proxy paths are for browser GUI communication. They are not native subsystem
transport APIs and should be backed by `frontend.context.api` or
`frontend.context.ws` in the installed package manifest. During launch, the
package backend opens its declared managed listener. The browser calls only the
same-origin proxy path.

For product frontends, configure `control.frontend.mode=custom` and point
`control.frontend.root` at the static SPA bundle. For headless/API-only hosts,
use `control.frontend.mode=disabled`.

For the full route table, see [Host Control REST Routes](../reference/host-control-rest-routes.md#package-frontend-assets-and-proxies).

## Stability Rule

Treat these REST routes as host-control and operator integration APIs. Native
runtime communication and implementation modules are not part of this REST API
surface.

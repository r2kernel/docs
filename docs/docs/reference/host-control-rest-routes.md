# Host Control REST Routes

This page is the table-oriented route catalog for the Host Control REST API.
For usage guidance, start with [Host Control REST API Guide](../api/host-control-rest-api.md).

The table lists canonical `/api/v1` routes, governed by API security and API
keys, not Console session cookies. Unprefixed routes return HTTP `404`.
Browser Console management uses `/console/api/v1` on the actual Console origin
and its independent login/session policy. Console HTTP defaults to `18080`,
enabled native HTTPS to `18443`, and the canonical API to `8001`. Explicit
overrides are preserved; explicit `control.ui_port: 0` shares the API listener.
See [Web and API Security](../operate/web-and-api-security.md#web-login).

## Health And Readiness

| Method | Stable path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | public or authenticated by policy | Lightweight process health and shared-memory manager connectivity |
| `GET` | `/api/v1/ready` | public or authenticated by policy | Runtime readiness with HTTP `200` when accepted and `503` when not ready |

These health routes may be unauthenticated when
`security.health.unauthenticated=true`. Network admission still applies.

## Security

| Method | Path | Role | Purpose | Request body |
| --- | --- | --- | --- | --- |
| `POST` | `/console/api/v1/auth/login` | public through Console admission policy | Create a Web Console session on the Console origin | admin password login payload |
| `GET` | `/console/api/v1/auth/session` | viewer | Read current Console browser/session identity | none |
| `POST` | `/console/api/v1/auth/logout` | viewer | Clear Console browser/session identity | none |
| `GET` | `/api/v1/control/security` | admin | Read security configuration and API key metadata | none |
| `POST` | `/api/v1/control/security/admin-password` | admin | Change the managed admin password | current/new password payload |
| `POST` | `/api/v1/control/security/api-keys` | admin | Create an API key | key name and role payload |
| `DELETE` | `/api/v1/control/security/api-keys/{key_name}` | admin | Revoke an API key | none |

API key secret values are returned once at creation time and hidden afterwards.

Console clients replace `/api/v1` with `/console/api/v1` for the listed
management routes, including security settings. Those settings additionally
require the exact permitted Console origin/listener; an API key on a product
listener does not bypass that restriction. Package frontend assets/context and
product proxies remain under `/api/v1/packages/...` with product authentication.

## Runtime Status And Bindings

| Method | Stable path | Role | Purpose | Request body |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/control/status` | viewer | Full host runtime snapshot, including live lease-to-package instance ownership | none |
| `GET` | `/api/v1/control/capabilities` | viewer | Product/API capability snapshot including frontend mode and security policy | none |
| `GET` | `/api/v1/control/specs` | viewer | Installed spec dictionary used by the Web Console | none |
| `GET` | `/api/v1/control/frames` | viewer | Resolved frame graph, spatial ports, transforms, and diagnostics | none |
| `GET` | `/api/v1/control/frames/lookup` | viewer | Compose the current transform between `source` and `target` query frames | none |
| `GET` | `/api/v1/control/federation/hello` | viewer | Federation bootstrap/status payload for peer discovery; the only federation status path between peers | none |
| `GET` | `/api/v1/control/federation/peers` | authenticated admin; disabled auth refused | Read desired/applied peer policy and pending retirement | none |
| `PUT` | `/api/v1/control/federation/peers` | authenticated admin; disabled auth refused | Replace full admitted peer set without restarting Control | `version`, `scope`, `expected_revision`, `revision`, `peers` |
| `GET` | `/api/v1/control/federation/security` | authenticated admin; disabled auth refused | Read active/accepted federation key ids and the last reload | none |
| `POST` | `/api/v1/control/federation/security/reload` | authenticated admin; disabled auth refused | Re-read the protected federation key or keyring without restarting Control | none |
| `GET` | `/api/v1/control/bindings` | viewer | Runtime binding override and effective binding inventory | optional query by subsystem |
| `POST` | `/api/v1/control/bindings` | operator | Set a runtime binding override | source and target binding references |
| `DELETE` | `/api/v1/control/bindings/{source}` | operator | Remove one runtime binding override | none |
| `GET` | `/api/v1/publishers` | viewer | Event publisher/subscriber inventory and shared-memory state | none |
| `GET` | `/api/v1/shm_manager` | viewer | Diagnostic/support shared-memory manager connectivity snapshot; not a stable application payload contract | none |

The `source` path segment for binding deletion is a binding reference such as
`component.gripper.digital_io`.

Setting a binding for a source subsystem that is not registered is refused; the
response carries `binding.state: "source_missing"` so deployment tools can retry
after the source registers. The `GET` inventory reports each binding row's
`origin` and lists launch binding `intents` with a result per requirement.

`/api/v1/shm_manager` is retained for diagnostics and support. Its current
implementation-level fields do not define a public shared-memory allocation,
layout, or native transport API. The security table's Console auth routes are
the intentional exception to the canonical prefix; cookies from those routes
never authorize canonical API requests.

## Subsystem Runtime Control

| Method | Stable path | Role | Purpose | Request body |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/control/subsystems/{subsystem}/lifecycle` | operator | Request a subsystem lifecycle transition | `transition`, optional `reason`, optional `session_id` |
| `POST` | `/api/v1/control/subsystems/{subsystem}/process` | operator | Terminate or kill a managed subsystem process | `action`, optional `session_id` |

Lifecycle transitions are `start`, `pause`, `resume`, `stop`, `reset`, `fault`,
and `degrade`. Process actions are `terminate` and `kill`.

## Configuration And Runtime Apply

| Method | Stable path | Role | Purpose | Request body |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/control/config` | admin | Read effective, base, and override runtime config | none |
| `POST` | `/api/v1/control/config` | admin | Save raw YAML override | raw YAML override payload |
| `POST` | `/api/v1/control/config/fields` | admin | Save structured config field updates | dotted-key field update payload |
| `POST` | `/api/v1/control/config/validate` | admin | Validate raw YAML override without applying it | raw YAML override payload |
| `POST` | `/api/v1/control/runtime/apply` | admin | Apply managed runtime changes | none or apply options |
| `POST` | `/api/v1/control/restart` | admin | Request control-service restart when available | none |

Prefer `/api/v1/control/config/fields` for ordinary UI or automation changes.

## Local Web Terminal

Web Terminal supports local OS login only. Its status reports the fixed
`local_login` mode; no SSH destination or key is configured. The former SSH
target probe route has been removed.

| Method | Stable path | Role | Purpose | Request body |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/control/terminal` | Terminal policy | Read local Terminal enabled/readiness state and session limits independently of Console login | none |
| `POST` | `/api/v1/control/terminal/apply` | admin | Apply already-saved Terminal policy without restarting Control; does not save drafts | none |
| `GET` | `/api/v1/ws/terminal` | Terminal policy | WebSocket for local OS login and terminal I/O | terminal protocol messages |

## Managed Packages

| Method | Stable path | Role | Purpose | Request body |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/control/packages` | viewer | List installed managed packages and active runtime instances | none |
| `POST` | `/api/v1/control/packages/install` | admin | Install a package archive | `filename`, `content_base64`, `replace` |
| `DELETE` | `/api/v1/control/packages/{package_id}` | admin | Uninstall a managed package | optional `force` query |
| `POST` | `/api/v1/control/packages/{package_id}/start` | operator | Start one package runtime instance through the launcher | optional `instance_id`, `params`, `runtime_dir`, `bindings`, `resources`; other fields are rejected |
| `POST` | `/api/v1/control/packages/{package_id}/stop` | operator | Stop one package runtime instance | optional `instance_id`; other fields are rejected |
| `POST` | `/api/v1/control/packages/{package_id}/restart` | operator | Restart one package runtime instance | same fields as `start` |
| `GET` | `/api/v1/control/packages/{package_id}/instances/{instance_id}/context` | viewer | Return frontend runtime context for one package instance | none |

Installation registers one package record by package name. Starting with a new
`instance_id` creates another managed runtime instance, subject to
resource-policy conflicts. Stopped, terminated, and killed instances are removed
from the active instance registry rather than retained as package history.

## Package Frontend Assets And Proxies

| Method | Stable path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/packages/{package_id}/ui` | viewer | Serve a managed package frontend entrypoint |
| `GET` | `/api/v1/packages/{package_id}/ui/` | viewer | Serve a managed package frontend entrypoint |
| `GET` | `/api/v1/packages/{package_id}/ui/{path}` | viewer | Serve static package frontend assets with SPA fallback |
| `GET` | `/api/v1/packages/{package_id}/instances/{instance_id}/context` | viewer | Return frontend runtime context for one package instance |
| `ANY` | `/api/v1/packages/{package_id}/instances/{instance_id}/api` | viewer or operator by package policy | Proxy same-origin REST calls to package instance GUI endpoint |
| `ANY` | `/api/v1/packages/{package_id}/instances/{instance_id}/api/` | viewer or operator by package policy | Proxy same-origin REST calls to package instance GUI endpoint |
| `ANY` | `/api/v1/packages/{package_id}/instances/{instance_id}/api/{path}` | viewer or operator by package policy | Proxy same-origin REST calls to package instance GUI endpoint |
| `GET` | `/api/v1/packages/{package_id}/instances/{instance_id}/ws` | viewer or operator by package policy | Proxy same-origin WebSocket calls to package instance GUI endpoint |
| `GET` | `/api/v1/packages/{package_id}/instances/{instance_id}/ws/` | viewer or operator by package policy | Proxy same-origin WebSocket calls to package instance GUI endpoint |
| `GET` | `/api/v1/packages/{package_id}/instances/{instance_id}/ws/{path}` | viewer or operator by package policy | Proxy same-origin WebSocket calls to package instance GUI endpoint |

The proxy paths are not native subsystem transport. They are same-origin browser
routes for package-owned frontend backends declared in `package.yaml`.

## WebSocket Upgrade Routes

| Method | Stable path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/ws/events` | viewer | WebSocket upgrade for Event observation |
| `GET` | `/api/v1/ws/control` | operator | WebSocket upgrade for Procedure and Operation requests |

For message kinds and fields, see
[Host Control WebSocket Messages](host-control-websocket-messages.md).

## System Frontend Fallback

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | public or viewer by policy | Serve configured system frontend entrypoint |
| `GET` | `/{path}` | public or viewer by policy | Serve configured system frontend assets or SPA fallback |

The system frontend can be the bundled Console, a custom static product
frontend, or disabled.

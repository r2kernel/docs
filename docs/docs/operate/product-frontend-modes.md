# Product Frontend Modes

Product frontend modes are a runtime-configuration topic. Read
[Runtime Configuration](runtime-configuration.md) first if `config.yaml`,
`r2kernel config`, or the Web Console Settings page are new to you.

R2Kernel can be used as a runtime kernel underneath a product-specific system
shell. The Host Control API remains available even when the bundled Web Console
is disabled or replaced.

Use this model when a product should expose its own operator UI while keeping
R2Kernel responsible for lifecycle, resource authority, time sync, app management,
federation, and runtime inspection.

## Product Metadata

Product-facing clients can read display metadata from Host Control status and
capability responses.

```yaml
product:
  name: "Acme Robot Controller"
  vendor: "Acme Robotics"
  support_url: "https://support.example.com"
```

These fields are editable from the Web Console Settings page and from
`r2kernel config`.

```text
r2kernel config set product.name "Acme Robot Controller"
r2kernel config set product.vendor "Acme Robotics"
r2kernel config set product.support_url "https://support.example.com"
```

## Modes

Configure the system frontend under `control.frontend`.

```yaml
control:
  frontend:
    mode: "bundled"       # bundled, custom, or disabled
    root: ""              # custom static frontend root when mode=custom
    index: "index.html"
    spa_fallback: true
    root_redirect: ""
```

| Mode | Behavior |
| --- | --- |
| `bundled` | Serve the built-in R2Kernel Web Console from `/`. |
| `custom` | Serve a product-provided static frontend from `/`. |
| `disabled` | Do not serve a system frontend. Host Control APIs remain online. |

`root` may be absolute or relative to `config.yaml`. `spa_fallback=true` serves
the configured index file for unknown frontend paths, which is the normal mode
for React, Svelte, Vue, and similar SPA builds.

The same fields are available in Web Console Settings and in
`r2kernel config`.

```text
r2kernel config set control.frontend.mode custom
r2kernel config set control.frontend.root /opt/acme/ui/dist
r2kernel config set control.frontend.index index.html
r2kernel config set control.frontend.spa_fallback true
```

## Host API Boundary

Product frontends should use the stable Host Control prefix.

```text
/api/v1
```

The stable prefix is required by the bundled Console, product frontends, and
automation. Unprefixed Host Control routes return HTTP `404`.

- `/api/v1/control/status`
- `/api/v1/control/capabilities`
- `/api/v1/control/config`
- `/api/v1/control/packages`
- `/api/v1/ws/events`
- `/api/v1/ws/control`

`/api/v1/control/status` and `/api/v1/control/capabilities` report the current
frontend mode, security mode, standard roles, and enabled host features. A
vendor UI should read this endpoint at startup before exposing controls.

## Security Pattern

For a browser-based product UI served by R2Kernel, keep web login enabled.

```yaml
security:
  enabled: true
  api:
    require_auth: true
  web:
    login_required: true
```

For a headless host controlled by an external service or reverse proxy, disable
the system frontend and use API keys.

```yaml
control:
  frontend:
    mode: "disabled"
security:
  enabled: true
  api:
    require_auth: true
  web:
    login_required: false
```

When security is enabled, route roles are enforced.

- `viewer` - status, specs, monitoring, and Event streams
- `operator` - viewer access plus Control WebSocket and package instance lifecycle
- `admin` - operator access plus config, package install/removal, security, and
  runtime apply/restart

## Package Frontends

`control.frontend` configures the host-level Console or product UI at `/`.
Installed packages use a separate static frontend manifest.

```yaml
frontend:
  type: static
  root: frontend/dist
  index: index.html
  context:
    api: http://127.0.0.1:{{param.gui_port}}/
    ws: ws://127.0.0.1:{{param.gui_port}}/ws
```

Those assets are served under `/api/v1/packages/<package-id>/ui/` by the same control
backend. Managed package frontend code should open through a concrete Runtime
instance and read the instance context before calling REST or WebSocket
endpoints. Browser GUI communication should use the control backend's
same-origin instance proxy. If the package also runs a small local GUI backend,
it must open the declared `frontend.context` listener through
`open_frontend_tcp_listener` rather than binding a TCP port directly. The helper
returns a Unix listener; the broker retains the declared loopback TCP endpoint
and relays connections. Static assets alone need no listener in the package.
Use relative asset paths when building the static frontend. An absolute
`/packages/<package-id>/ui/` asset base targets a retired route and returns
HTTP `404`.

## Package Frontends Are Separate

Managed package frontends are declared in `package.yaml` and served from this path.

```text
/api/v1/packages/<package-id>/ui/
```

They are package-level surfaces. Runtime opens them with an `instance` and
`context` query so the same static frontend can connect to the correct package
backend instance. They do not replace the system Console. Use
`control.frontend.mode=custom` when the product shell itself should be replaced.

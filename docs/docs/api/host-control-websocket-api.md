# Host Control WebSocket API Guide

The Host Control WebSocket API is the browser and outside-runtime integration
boundary exposed by the control backend.

Use it for dashboards, package frontends, monitoring tools, and other clients that
should not join native R2Kernel transport directly. Native subsystems should use
the [Subsystem SDK API](subsystem-sdk-api.md).

This is the supported integration path for browser clients, packaged
frontends, Windows/macOS tools, cloud services, and other non-R2Kernel clients.
Those clients connect to a R2Kernel host through the control backend instead of
opening native runtime transport.

This page explains the WebSocket flow. For the table-oriented endpoint and
message catalog, see [Host Control WebSocket Messages](../reference/host-control-websocket-messages.md).

## Endpoints

| Path | Direction | Purpose |
| --- | --- | --- |
| `/api/v1/ws/events` | server stream with client subscription commands | Observe Event channels |
| `/api/v1/ws/control` | request/response messages | Invoke Procedure and Operation calls through the host control backend |

These are canonical API endpoints: API security, not Console login, determines
whether a key is required. Native or server-side external clients send
`Authorization: Bearer <api-key>` or `X-R2Kernel-API-Key: <api-key>` during the
handshake when API security is ON. Console cookies never authenticate these
paths, including on a shared listener.

Browser Console clients instead use `/console/api/v1/ws/events` and
`/console/api/v1/ws/control` on the actual Console origin, with a Console session
when login is ON. Console HTTP defaults to `18080`; enabled native HTTPS defaults
to `18443` and uses `wss`. Canonical API defaults to `8001`. Explicit overrides
are preserved; only explicit `control.ui_port: 0` shares the API listener.

The browser `WebSocket` constructor cannot set arbitrary authentication headers.
Do not put API keys in URLs, query parameters, or subprotocols. A product browser
client needing the authenticated canonical API uses its own server-side adapter
to attach the key; it does not borrow a Console session. Package frontends can
use their declared instance-scoped proxy with their own product authentication.

With authentication required for the selected surface, Events requires
`viewer` access and Control requires `operator` or `admin`. Console login and
API security are independent; network admission applies to both.

For a same-origin Console page, the handshake URL can be constructed as follows
(sign in at `/console/api/v1/auth/login` first when Console login is ON):

```javascript
const url = new URL("/console/api/v1/ws/events", window.location.origin);
url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
const events = new WebSocket(url);
```

## `/api/v1/ws/events`

`/api/v1/ws/events` is subscribe-only. It observes native Event channels and streams
matching messages to the browser-facing client.

### Subscribe

```json
{
  "kind": "subscribe",
  "topic": "example/status"
}
```

or.

```json
{
  "kind": "subscribe",
  "topics": ["example/status", "example/state"]
}
```

Response example.

```json
{
  "kind": "subscribed",
  "ok": true,
  "topics": ["example/status"]
}
```

For all Event socket message kinds, see
[Host Control WebSocket Messages](../reference/host-control-websocket-messages.md#events-websocket).

### Unsubscribe

```json
{
  "kind": "unsubscribe",
  "topic": "example/status"
}
```

Response example.

```json
{
  "kind": "unsubscribed",
  "ok": true,
  "topics": ["example/status"]
}
```

### Clear

```json
{
  "kind": "clear"
}
```

Response example.

```json
{
  "kind": "cleared",
  "ok": true
}
```

### Event Message

```json
{
  "kind": "event",
  "topic": "example/status",
  "publisher": "controller",
  "ts": 1234567890,
  "payload_b64": "...",
  "data": "...",
  "payload_text": "{\"state\":\"running\"}",
  "payload_json": {"state": "running"}
}
```

`data` is currently the same base64 payload as `payload_b64` for browser
compatibility. Prefer `payload_b64` for new clients.

There is no WebSocket Event publish path. Browser clients observe Event traffic;
they do not inject native Event samples into the runtime through this endpoint.

## `/api/v1/ws/control`

`/api/v1/ws/control` is a request/response facade over the native control path.

The browser does not call the native Control runtime directly. The control
backend resolves the target subsystem and invokes Procedure or Operation through
the native runtime boundary.

### Ping

```json
{
  "kind": "ping",
  "request_id": "client-1"
}
```

Response example.

```json
{
  "kind": "pong",
  "ok": true,
  "request_id": "client-1"
}
```

### Procedure Call

```json
{
  "kind": "procedure.call",
  "request_id": "req-1",
  "target": "io_gateway",
  "procedure": "set_output",
  "params": {"index": 1, "value": true},
  "timeout_ms": 1000
}
```

Response example.

```json
{
  "kind": "procedure.response",
  "request_id": "req-1",
  "target": "io_gateway",
  "procedure": "set_output",
  "ok": true,
  "result": {"value": true},
  "error_code": null,
  "error_message": null
}
```

### Operation Start

```json
{
  "kind": "operation.start",
  "request_id": "op-1",
  "target": "arm",
  "operation": "move_j",
  "params": {"positions": [0.0, 0.1, 0.2]},
  "timeout_ms": 1000
}
```

Response example.

```json
{
  "kind": "operation.start.response",
  "request_id": "op-1",
  "target": "arm",
  "operation": "move_j",
  "ok": true,
  "accepted": true,
  "operation_id": "runtime-operation-id",
  "state": "accepted",
  "error_code": null,
  "error_message": null
}
```

### Operation Query

```json
{
  "kind": "operation.query",
  "request_id": "op-query-1",
  "target": "arm",
  "operation_id": "runtime-operation-id",
  "timeout_ms": 1000
}
```

Response example.

```json
{
  "kind": "operation.query.response",
  "request_id": "op-query-1",
  "target": "arm",
  "ok": true,
  "operation_id": "runtime-operation-id",
  "operation": "move_j",
  "state": "running",
  "cancel_requested": false,
  "feedback_count": 3,
  "result": null,
  "state_payload": {"progress": 0.3},
  "created_ts": 1234567890,
  "updated_ts": 1234567999,
  "error_code": null,
  "error_message": null
}
```

### Operation Cancel

```json
{
  "kind": "operation.cancel",
  "request_id": "op-cancel-1",
  "target": "arm",
  "operation_id": "runtime-operation-id",
  "timeout_ms": 1000
}
```

The response shape matches `operation.query.response` with
`kind="operation.cancel.response"`.

For all Control socket request and response kinds, see
[Host Control WebSocket Messages](../reference/host-control-websocket-messages.md#control-websocket).

## Error Response

Unsupported or invalid requests return an error response.

```json
{
  "kind": "error",
  "request_id": "req-1",
  "ok": false,
  "error": "unsupported kind: example"
}
```

## Boundary Rule

This WebSocket API is an outside-runtime facade.

- `/api/v1/ws/events` observes Event traffic
- `/api/v1/ws/control` invokes ordinary Procedure and Operation calls
- timed execution is not exposed as a direct WebSocket control feature
- native hot-path communication remains under Event, Control, Procedure, and Operation in the SDK
- clients that need native Control should be implemented as R2Kernel subsystems on a supported Linux runtime host
- clients that stay outside the native runtime should use this API rather than reimplementing native transport

For architecture context, see [WebSocket Facade](../reference/websocket-facade.md).

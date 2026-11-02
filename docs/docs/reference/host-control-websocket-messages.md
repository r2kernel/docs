# Host Control WebSocket Messages

This page is the table-oriented catalog for Host Control WebSocket endpoints and
message kinds. For usage guidance, start with
[Host Control WebSocket API Guide](../api/host-control-websocket-api.md).

## Endpoints

| Stable path | Direction | Role | Purpose |
| --- | --- | --- | --- |
| `/api/v1/ws/events` | client subscription commands, server event stream | viewer | Observe Event channels |
| `/api/v1/ws/control` | request/response | operator | Invoke Procedure and Operation calls through the host control backend |

The table lists canonical API paths. They apply the API security policy and,
when enabled, require an API key in `Authorization: Bearer <api-key>` or
`X-R2Kernel-API-Key: <api-key>` during the handshake. Console session cookies do
not authenticate canonical paths.

Console browsers use `/console/api/v1/ws/events` and
`/console/api/v1/ws/control` on the Console origin under its independent login
policy. Console HTTP defaults to `18080`, enabled native HTTPS to `18443`
(`wss`), and the API to `8001`. Explicit overrides remain effective; explicit
`control.ui_port: 0` shares the API listener.

Browser `WebSocket` cannot set those key headers. Never put a key in the query
string, URL, or subprotocol. Authenticated product integrations need their own
server-side adapter or declared package proxy, with product authentication.
See the [guide's Console browser example](../api/host-control-websocket-api.md#endpoints).

## Events WebSocket

`/api/v1/ws/events` is subscribe-only. Browser and outside-runtime clients observe
native Event traffic but do not publish native Event samples.

### Client Messages

| Kind | Required fields | Optional fields | Purpose |
| --- | --- | --- | --- |
| `subscribe` | `topic` or `topics` | none | Subscribe to one or more Event topics |
| `unsubscribe` | `topic` or `topics` | none | Remove one or more Event subscriptions |
| `clear` | none | none | Remove all subscriptions for the connection |

### Server Messages

| Kind | Fields | Purpose |
| --- | --- | --- |
| `subscribed` | `ok`, `topics` | Confirms active subscriptions |
| `unsubscribed` | `ok`, `topics` | Confirms removed subscriptions |
| `cleared` | `ok` | Confirms all subscriptions were removed |
| `event` | `topic`, `publisher`, `ts`, `payload_b64`, `data`, `payload_text`, `payload_json` | Delivers one observed Event sample |
| `error` | `ok=false`, `error`, optional `request_id` | Reports invalid command or runtime error |

`data` is currently the same base64 payload as `payload_b64` for browser
compatibility. Prefer `payload_b64` for new clients.

### Event Message Fields

| Field | Meaning |
| --- | --- |
| `topic` | Event channel key |
| `publisher` | Publishing subsystem when available |
| `ts` | Runtime timestamp for the sample |
| `payload_b64` | Base64 encoded payload bytes |
| `payload_text` | UTF-8 text view when payload is decodable |
| `payload_json` | JSON view when payload is parseable JSON |

## Control WebSocket

`/api/v1/ws/control` is a facade over the native control path. It invokes Procedure and
Operation endpoints through the control backend. It does not expose direct
Control endpoints to browser clients.

### Client Messages

| Kind | Required fields | Optional fields | Purpose |
| --- | --- | --- | --- |
| `ping` | none | `request_id` | Check the WebSocket request/response path |
| `procedure.call` | `target`, `procedure` | `request_id`, `params`, `timeout_ms` | Invoke a Procedure endpoint |
| `operation.start` | `target`, `operation` | `request_id`, `params`, `timeout_ms` | Start an Operation endpoint |
| `operation.query` | `target`, `operation_id` | `request_id`, `timeout_ms` | Query Operation state/result |
| `operation.cancel` | `target`, `operation_id` | `request_id`, `timeout_ms` | Request Operation cancellation |

### Server Responses

| Kind | Fields | Purpose |
| --- | --- | --- |
| `pong` | `ok`, `request_id` | Response to `ping` |
| `procedure.response` | `ok`, `request_id`, `target`, `procedure`, `result`, `error_code`, `error_message` | Procedure call result |
| `operation.start.response` | `ok`, `request_id`, `target`, `operation`, `accepted`, `operation_id`, `state`, `error_code`, `error_message` | Operation start result |
| `operation.query.response` | `ok`, `request_id`, `target`, `operation_id`, `operation`, `state`, `cancel_requested`, `feedback_count`, `result`, `state_payload`, `created_ts`, `updated_ts`, `error_code`, `error_message` | Operation state/result snapshot |
| `operation.cancel.response` | same as `operation.query.response` | Operation state after cancellation request |
| `error` | `ok=false`, `error`, optional `request_id` | Reports invalid request or runtime error |

### Common Request Fields

| Field | Meaning |
| --- | --- |
| `request_id` | Client correlation id echoed by responses when provided |
| `target` | Target subsystem name |
| `timeout_ms` | Request timeout for the backend facade call |
| `params` | JSON-compatible endpoint parameters |

### Procedure Fields

| Field | Meaning |
| --- | --- |
| `procedure` | Procedure endpoint name on the target subsystem |
| `result` | JSON-compatible Procedure result when successful |
| `error_code` | Runtime or endpoint error code when failed |
| `error_message` | Human-readable endpoint error text when failed |

### Operation Fields

| Field | Meaning |
| --- | --- |
| `operation` | Operation endpoint name on the target subsystem |
| `operation_id` | Runtime operation id returned by `operation.start` |
| `accepted` | Whether the target accepted the operation start request |
| `state` | Operation state such as `accepted`, `running`, `succeeded`, `failed`, or `canceled` |
| `cancel_requested` | Whether cancellation has been requested |
| `feedback_count` | Number of feedback samples observed by the runtime |
| `result` | Final result payload when available |
| `state_payload` | Optional state payload published by the operation handler |

## Boundary Rule

- Use `/api/v1/ws/events` for observation only.
- Use `/api/v1/ws/control` for Procedure and Operation requests from outside the native runtime.
- Implement native timed Control clients as R2Kernel subsystems, not browser clients.
- Package-owned frontend backends should use instance-scoped package proxy routes from
  [Host Control REST Routes](host-control-rest-routes.md#package-frontend-assets-and-proxies).

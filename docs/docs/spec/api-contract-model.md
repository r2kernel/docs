# API Contract Model

An `api.*` contract defines one coherent endpoint surface. It owns endpoint
names, endpoint kinds, payload message references, frame policy, timing policy,
state ownership, failure semantics, authority, limits, and conformance level.

## Endpoint Kinds

| Kind | Runtime shape | Use for |
| --- | --- | --- |
| Event | publish or subscribe stream | observations, state, telemetry, and fanout |
| Control | periodic request/response exchange | commands with period, deadline, validity, and overrun sensitivity |
| Procedure | bounded request and response | non-periodic synchronous actions or queries |
| Operation | long-running command | feedback, cancellation, result, and terminal state |

Endpoint kind is enforced. A Procedure cannot be registered in place of a
Control endpoint, and a required timed endpoint cannot silently accept an
untimed request.

## Runtime Timing Envelope

Message payloads do not duplicate transport timestamps.

Events expose three distinct times.

| Field | Meaning |
| --- | --- |
| `observed_at_sync_ns` | when the source data was acquired or observed |
| `published_at_sync_ns` | when the publisher committed the Event |
| `received_at_sync_ns` | when the subscriber received it |

Controls and timed requests expose the execution path.

| Field | Meaning |
| --- | --- |
| `generated_at_sync_ns` | when the command intent was produced |
| `sent_at_sync_ns` | when it entered transport |
| `execute_at_sync_ns` | requested execution time |
| `valid_until_sync_ns` | last acceptable execution time |
| `accepted_at_sync_ns` | provider acceptance time |
| `scheduled_for_sync_ns` | provider schedule target |
| `dispatched_at_sync_ns` | dispatch to implementation or device boundary |
| `sampled_at_sync_ns` | time of the response sample, when applicable |
| `completed_at_sync_ns` | completion time |
| `responded_at_sync_ns` | response transport time |
| `lateness_ns` | execution lateness relative to schedule |

This separates data acquisition time from middleware transit time and execution
time without proliferating stamped payload variants.

## Frame Rule

- fixed frames belong in API semantics
- dynamic frames belong in the domain message that owns the value
- pure spatial types do not carry a frame field
- a provider must reject or transform an unsupported frame according to its API
  contract

### Frame Policies

`frames.policy` states where an API's frames come from. Most contracts use
`endpoint_declared`: the endpoint semantics or the message identify the frames,
and the runtime keeps the declaration as metadata.

`spatial_ports` binds frame fields of the published messages to the provider's
spatial ports. `frames.ports` maps each such field to a port name.

```yaml
frames:
  policy: spatial_ports
  ports:
    frame_id: reference
    child_frame_id: body
  dynamic_frames: owning_message_only
```

The SDK loaders refuse a `spatial_ports` declaration whose `ports` mapping is
missing or empty, or whose mapped field is not a required `string` field of
every message the API publishes. For such an API:

- a provider declares each mapped port as an `export` port with a literal
  `frame` in its `subsystem.yaml`; a missing port, an `import` port and a
  `source` alias are refused when the manifest loads
- each sample carries exactly that port's frame in the mapped field; the SDK
  refuses a mismatched sample on publish with `frame_mismatch` and does not
  send it, and the codec refuses a sample without the field
- a consumer takes the frame from the sample, or from the provider's port in
  the runtime frame graph, never from its own configuration or a default

`api.locomotion.odometry.v2` is the first `spatial_ports` contract. A relay
that republishes another subsystem's samples is not supported for such an API:
the frames must come from the provider's own manifest.

## Contract Metadata

Public API contracts declare `frames`, `timing`, `state_model`,
`failure_semantics`, `authority`, `limits`, and `conformance`. Controls
also declare endpoint timing behavior such as periodicity, validity, scheduling,
and late handling.

Controls may opt into the versioned
`common_control` policy in `controls[].semantics`. It gives the binding an
explicit period/limit source, finite execution-expiry policy, ownership
generation, cycle ordering, refresh mode, repeat rule, and response meaning.
The typed `ControlCycle` carries only domain generation, sequence, intent, and
state revision; it does not duplicate the runtime request ID or timing envelope.
The metadata and schemas define a contract, not proof that a runtime or device
enforces every rule. See [Control Cycles and Typed Streams](control-cycles-and-streaming.md)
for intent combinations, stream limits, failure semantics, and the Controls
that use this policy.

## Full Inventory

See the generated [API Contract Reference](api-contract-reference.md) for every
official endpoint and message reference.

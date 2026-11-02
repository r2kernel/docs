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

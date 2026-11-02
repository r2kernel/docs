# Typed Payload and Codec Guide

This page explains how typed payloads are encoded and decoded across SDK
languages.

It is not the subsystem method catalog. For lifecycle, Event, Control,
Procedure, and Operation methods, use [Subsystem SDK API](subsystem-sdk-api.md). For
message/API contract/component definitions, use [Spec](../spec/spec-overview.md).
For the detailed binary encoding reference, use
[Data Types And Binary Encoding](../reference/data-types-and-binary-encoding.md).

R2Kernel uses one canonical message codec across language SDKs. Language SDKs use
the installed runtime library instead of defining incompatible transport
encodings.

## Encoding Model

The binary encoding baseline is this.

- primitives are little-endian
- dynamic vectors use a `uint32` element count followed by packed element bytes
- fixed arrays use packed element bytes without an inner count
- compound messages encode fields in schema order
- nested composites are allowed through local or canonical message refs

## Typed Transport Path

Typed Control, Procedure, and Operation calls use message refs such as the following.

```text
msg.core.common.primitive.v1/Int32Value
msg.core.common.primitive.v1/IndexedBoolValue
```

Wrappers can encode language values into canonical bytes and decode response
bytes into values. Native C++ callers can instead encode/decode flat typed nodes
directly, without a JSON conversion in the payload path. Both use the same wire
encoding; preparation does not introduce another protocol.

## Prepared contexts

During subsystem initialization, the SDK captures one effective schema source
snapshot and prepares the structured messages declared by its interfaces,
including Control request/response and Event types, before entering `Ready`.
A missing or invalid graph fails preparation explicitly. It is not deferred to
the first packet, and a missing custom schema does not silently select another
codec.

The SDK prepares the selected definitions during initialization and preserves
their interpretation for that context. Compatible schemas use the same
canonical wire encoding. `source: standard` identifies a context equivalent to
the shipped standard definition; an equivalent override can report that source.
Custom and changed definitions remain supported through explicit preparation.

`fingerprint` is a SHA-256 digest of the normalized recursive wire graph. It
includes field order/names, optional flags, array shapes and nested message
graphs; descriptions are excluded. A custom API may reference standard message
plans. The API id alone does not decide the message plan source.

Editing a schema file does not change existing contexts or plans. Stop active
dispatch and finish in-flight calls before explicitly reinitializing the
subsystem, or construct a new `SchemaContext` for standalone codec use. The new
context sees the new sources. A lifecycle reset alone does not reload schemas.
The generic Core schema/JSON codec ABI keeps fresh source lookup on
each call; it has different source-lifetime behavior from a prepared context.

Unprepared codec calls (before `initialize()` or without a managed Subsystem)
perform a single conversion per call and still re-read the selected spec roots
on every call, so spec edits show up on the next call. The first such call logs
a one-time warning. For repeated use, initialize the Subsystem or create a
`SchemaContext` and `PreparedCodec` (Python: `PreparedSchemaContext` and
`PreparedCodec`).

If initialization fails, the managed subsystem cannot execute through a
previous plan or switch to the generic codec. Correct the schema or registration
problem, stop active dispatch, and explicitly initialize again to prepare a
fresh context. Error status can retain the last identity acknowledged by Control
for diagnostics and compatibility checks against existing resources. This
metadata contains no executable plan, and `codec_context_available: false`
distinguishes it from a usable context.
Reset or cleanup hooks may restore a `Ready` status label. After a failed
initialization, that label alone does not restore codec access or start
authorization; a successful explicit initialization is still required.

### Native C++ ownership

```cpp
using namespace r2kernel::wrapper;
SchemaContext context(std::vector<std::string>{}); // shipped standards only
auto codec = context.prepare("msg.core.common.primitive.v1/Int32Value");
CodecWorkspace encode, decode;
R2KernelCodecNode nodes[] = {
    {R2KERNEL_NODE_MESSAGE, 1, 1, 0, nullptr, 0},
    {R2KERNEL_NODE_INT32, 0, 0, 42, nullptr, 0}
};
auto payload = codec.encode_nodes(nodes, 2, encode).copy();
auto view = codec.decode_nodes(payload, decode);
// Read view while payload remains alive and before decode is reused.
```

Subsystem code obtains already prepared plans through
`prepared_codec(message_ref)` after successful `initialize`, including from
`on_start` and payload handlers. `on_initialize` registers interfaces; the SDK
finishes preparation after that hook and before `Ready`. An undeclared plan
request fails explicitly.

Plans are immutable and may be shared across interfaces or threads. A workspace
is mutable scratch: each concurrently active interface/caller owns its own
workspace. Encoded byte views and decoded node buffers expire on the next
operation on that workspace or its destruction. Use `.copy()` when bytes must
outlive scratch reuse. Decoded string/byte spans borrow the input payload; retain
that payload while reading the view. A copied plan can outlive its context.
Signed integers use the low-width two's-complement wire bits; float nodes carry
IEEE wire bits. Message children follow schema field order, including `ABSENT`
nodes for absent optional fields; arrays identify contiguous child node spans.

### Python

Python subsystem typed methods use the prepared context automatically. Event
registrations made in `on_initialize` are staged until the complete message set
is prepared and its identity is accepted by Control. A failed registration
prevents `Ready`; callbacks cannot use a rejected context. Python mappings are
converted directly to native nodes and canonical bytes, without a domain JSON
round trip. This still includes Python object conversion costs.

An unchanged, same-session local Event heartbeat preserves its accepted identity
and liveness without repeating cold admission against incompatible peers. This
does not admit new or changed identities: cold registration, resource acquisition,
session/signature validation and codec quarantine remain strict. Signed
Event/RTCS rows advertise only exact acquired subsystem directions, not rejected
manifest declarations.

Standalone Python code can explicitly choose snapshot semantics:

```python
from r2kernel.interface import PreparedSchemaContext

context = PreparedSchemaContext([])  # shipped standards only
codec = context.prepare("msg.core.common.primitive.v1/Int32Value")
payload = codec.encode({"value": 42})
assert codec.decode(payload) == {"value": 42}
```

The public SDK distribution supports Python and C++. Raw Event/Control byte
APIs retain explicit byte semantics. Native endpoint code must honor the
declared payload type, owned response storage and timed execution-report
contract.

## Timing Metadata Boundary

The public contract is the endpoint's domain payload type and timing policy.
Runtime timing metadata is carried separately; its transport envelope and
framing are private implementation details, not an application wire schema.
Use SDK timing APIs rather than constructing or parsing a runtime envelope.

The endpoint declares the domain payload type separately:

```text
request_type: msg.core.common.primitive.v1/Int32Value
response_type: msg.core.common.primitive.v1/Int32Value
timing_support: required
```

This prevents timing metadata from becoming part of every domain message.

Endpoint timing policy (`none`, `optional`, `required`) belongs to endpoint
registration and is documented in [Subsystem SDK API](subsystem-sdk-api.md#endpoint-timing-policy).

Bound Procedure, Operation and Control calls include runtime binding lookup in
their original absolute caller budget, before route selection, encoding and
dispatch. An expired lookup or unavailable/unbound runtime target fails without
dispatch; it must not fall back to a launch-manifest target. Non-deadline
initialization-time manifest resolution is a separate operation.

Handler I/O cannot silently shorten a declared 1.5-second budget to one second,
nor extend the caller's remaining deadline. A timeout or failed Procedure
envelope is not a successful `Bool(false)` acknowledgement. After admission,
timeout also does not prove that application or physical effects were undone;
do not replay actuation automatically.

## Performance Rule

High-frequency array payloads should use packed primitive arrays or schema messages containing packed vectors.

Avoid element-by-element JSON or nested per-element encoding in hot paths.

Preparation removes schema lookup/graph compilation from packet processing.
It does not promise a transport rate or completion deadline. Measure request
encode, provider decode/encode and caller response decode together, and measure
the actual registered runtime path separately from an in-process codec loop.
Configured 1 kHz pacing is not proof of sustained 1 kHz completion.

See [Data Types and Binary Encoding](../reference/data-types-and-binary-encoding.md).

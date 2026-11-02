# Control Cycles and Typed Streams

This page describes the versioned common Control metadata and the stream payload
families `msg.control.v1`, `msg.stream.v1`, `msg.visual.v1`, and the
`msg.sensor.*` source families. It complements the [API Contract Model](api-contract-model.md):
Control remains a timed request/response endpoint, while each API keeps its
own typed domain request and response.

## Gateway Control sessions

A Gateway publishes one provider interface and one handler for each Control
endpoint. Several component requirements may bind to that interface. Each
bound source has its own 1:1 Control session; adding a second component does
not create a second API, provider interface, or handler callback. The handler
receives the caller identity in request context and processes the same typed
contract for every group. Assignment of physical devices or fieldbus ranges
remains the system implementer's responsibility, not a rule inferred by the
Gateway from motor names or packet contents.

In this release, independently timed groups must have distinct source
subsystems. Two requirements of one source subsystem bound to the same
provider interface are not independent sessions and must not be configured
as such. This limit does not prevent distinct components, such as mobile and
manipulation controllers, from sharing one actuator interface.

Request/response deadlines apply to each transaction. Periodic arrival
observations are tracked separately by source; they do not themselves stop a
device or establish a hardware safety watchdog. A Gateway that needs a safe
action on missed cycles must implement and validate that behavior for each
group, including after disconnection and rebinding. Source metadata is
SDK-declared and is not authentication.

A Control opts in to these rules by declaring `common_control`. A published
API or message ID keeps its meaning; an incompatible meaning uses a new
versioned ID. The schemas define public data and conformance rules, not a
claim that every runtime or device already enforces them.

## Control cycle metadata

`msg.control.v1/ControlCycle` adds domain-level generation, ordering,
intent, and retained-state revision to a versioned Control request:

| Field | Meaning |
| --- | --- |
| `generation:int64` | Positive binding-control generation. A new owner or restarted control session uses a new generation. |
| `sequence:int64` | Strictly increasing cycle sequence within that generation. |
| `intent:string` | `command`, `keep`, or `sample`, constrained by the endpoint's declared refresh mode. |
| `state_revision:int64` | Positive for `command` and `keep`; unchanged on `keep`. Sample-exchange requests without caller-owned state use zero. |

The current wire scalar set has no `uint64`. Values whose domain meaning is
nonnegative 64-bit therefore use signed `int64` and must remain in
`0..2^63-1`; active generations and state revisions are positive. Runtime request
IDs, route generations, and transport timestamps do not belong in `ControlCycle`.

Every new versioned Control endpoint declares its policy in
`controls[].semantics.common_control`:

| Policy | Required declaration | Contract effect |
| --- | --- | --- |
| `version` | `1` | Selects this closed metadata shape. |
| `request_effect` | Endpoint-specific stable `snake_case` name | Names the one domain action performed by this endpoint. |
| `response_scope` | `endpoint_effect_completed` or `sample_observed` | Says whether the response reports endpoint-level effect completion or an observed sample. |
| `period_policy` | `binding_required` | The binding supplies an explicit period and selected limits. |
| `execution_policy` | `finite_expiry_commit_check` | Requests have finite runtime validity, rechecked at the effect/commit boundary. |
| `refresh_mode` | `command_refresh`, `maintain_state`, or `sample_exchange` | Defines which cycle intents are meaningful. |
| `ownership_policy` | `explicit_binding_generation` | A request must belong to the currently selected binding generation. |
| `ordering` | `strictly_increasing_cycle` | Older or repeated cycle numbers do not advance state. |
| `repeat_policy` | `no_automatic_replay` | Timeout or reconnect does not silently replay an effect. |
| `failure` | `report_domain_status` | Domain failure remains distinct from runtime transport/execution status. |
| `limits` | Binding-sourced required fields; provider may constrain selected values | Numeric policy lives in explicit binding configuration, not an API default. |

The selected `limits.required_fields` include positive finite values for
`max_update_gap_ns`, `max_command_age_ns`, `max_request_bytes`, and
`max_response_bytes`. Stream endpoints also require `max_pending_units`.
Providers may advertise stricter supported bounds; the binding-selected values
must fit within them. This metadata does not itself instantiate a timer,
watchdog, codec, or memory reservation.

### Intent and response rules

| Refresh mode | Allowed intent | Meaning |
| --- | --- | --- |
| `command_refresh` | `command` | Send a new command intent. A provider does not infer keep-alive from identical bytes. |
| `maintain_state` | `command` or `keep` | `command` establishes/replaces a state revision; `keep` maintains the same revision without resending the old payload. |
| `sample_exchange` | `sample` | Ask for a prepared sample or part. A cycle may return `no_new_sample` without indicating a failed connection. |

Each API still defines its domain statuses. A response such as `applied`,
`buffer_full`, or `no_new_sample` does not replace the runtime's request or
execution report. Conversely, a transport-successful response does not claim
that a physical actuator moved, a frame was displayed, or a decoder succeeded
unless the domain response says so at an observable stage.

An absent sensor update is normal data state, not proof that the Control
connection died. Repeating `keep` refreshes only the declared retained state;
it does not make an old sensor sample younger. On `buffer_full`, a sender may
retry the same part under a new, increasing Control cycle. The part bytes,
sample identity, original acquisition time, and data expiry remain unchanged.
Retries do not extend either the request expiry or the sample's lifetime.

## Shared bounded-transfer types

`msg.stream.v1` defines reusable metadata without introducing a generic
payload union:

- `StreamIdentity` separates provider session, configuration revision, and
  format revision.
- `CodecDescriptor` identifies the authority-qualified codec/version, profile,
  bitstream framing, decoder-configuration syntax and bytes, and decoded layout.
- `TransferPartHeader` identifies a sample and codec unit, carries original
  `acquired_at_sync_ns` and `expires_at_sync_ns`, and declares independence or
  referenced unit sequences.
- `EncodedChunk` declares part index/count, total bytes, offset, and this part's
  bytes.
- `StreamLimits` bounds configuration bytes, encoded and decoded unit bytes,
  chunk bytes, parts per unit, pending units/bytes, and reassembly age.

The receiver validates finite bounds before allocation. The assembly timeout is
based on the receiver's monotonic first-accept time and is not reset by retries.
If a required reference unit is missing, the provider reports resynchronization
instead of pretending a dependent unit is independently decodable.

Fixed configuration is valid: these APIs do not force a per-stream
`DESCRIBE`/`CONFIGURE` handshake. Send the format on the first part and whenever
`format_revision` changes. A changed revision is not an instruction to silently
change resolution, codec, calibration, or units.

## Typed profile families

| Domain | Canonical payload family | Required interpretation |
| --- | --- | --- |
| Visual | `msg.visual.v1` | Raw raster, encoded image, or video access unit; explicit plane geometry, stride, subsampling, sample format, and byte order. |
| Depth | `msg.sensor.depth.v1` | Dimensions, element type, endianness, row stride, scale, invalid-value rule, frame, calibration revision, and any bounded-loss claim. |
| RGB-D | `msg.sensor.rgbd.v1` | Capture-set identity and separate color/depth parts, sample times, format/calibration IDs, frame IDs, and declared reference relation. |
| Rotating radar | `msg.sensor.radar.v1` | Bounded, time-stamped azimuth sectors and sensor-frame range/bearing/velocity/signal returns; no object tracks or world coordinates. |
| LiDAR | `msg.sensor.lidar.v1` | Native scan layout, record fields/stride, byte order, scan timing, invalid-return rule, return-order rule, and loss policy. |
| Point cloud | `msg.sensor.pointcloud.v1` | Packed field descriptors, units, byte order, record stride, dimensions/count, invalid-point policy, and point-order/count effects. |

Raw multi-byte depth and packed LiDAR/point records declare little or big
endianness. Visual planes declare an endianness value as well; for a one-byte
sample it has no decoding effect. RGB-D registration names its reference frame
and resolvable calibration IDs but does not invent camera extrinsics. LiDAR
packed-byte size is derived from
`measurement_count * channel_count * returns_per_measurement * record_stride_bytes`.

The codec descriptor is a profile identity, not a promise that an implementation
is installed. A consumer accepts only codecs it explicitly supports; it must
not substitute a fallback decoder or reinterpret an unknown profile. Schema
validation also does not decode payloads, measure codec performance, prove a
declared error bound, or resolve calibration references.

## Implementation boundaries

The Python SDK provides reference `ControlGuard` and
`StreamTransferAssembler` helpers. The guard checks validity at the immediate
effect/commit boundary; its watchdog is best-effort and is not a physical
safety guarantee. Cross-host providers must explicitly supply the deployment's
synchronized clock (for example the subsystem's `now_ns`) and establish the
required clock quality. The helper does not configure synchronization or
silently tolerate future-generated requests; immediate mode does not make
timestamp age/expiry checks independent of clock error.
The assembler bounds and validates transfer metadata;
`r2kernel.core.stream_profiles` provides separate explicit format and complete
sample-layout checks. These helpers do not decode codec payloads, verify
declared error bounds, or resolve calibration references. Native SDK typed codecs interoperate with
the schemas but do not automatically instantiate a guard or codec for an API.

Pending-byte accounting includes complete units awaiting decoder confirmation.
It is not a process-memory limit: assembly copies, codec workspace, and retained
decoded/reference frames need their own provider-side memory budgets.

Managed-source metadata requires matching SDK/runtime support. Its source
identity is declared by the SDK and is not authentication. These APIs do not
claim deployment readiness, hardware behavior, automatic codec availability,
or codec performance.

## Versioned Control APIs

| API | Control | Request/response |
| --- | --- | --- |
| `api.actuator.servo.v1` | `servo_control` | `ServoControlRequest` / `ServoControlResponse` |
| `api.io.digital.timed_output.v1` | `digital_output_control` | `TimedOutputControlRequest` / `TimedOutputControlResponse` |
| `api.media.display.v1` | `display_cycle` | `DisplayControlRequest` / `DisplayControlResponse` |
| `api.sensor.camera.source.v1` | `camera_cycle` | `CameraCycleRequest` / `CameraCycleResponse` |
| `api.sensor.depth.source.v1` | `depth_cycle` | `DepthCycleRequest` / `DepthCycleResponse` |
| `api.sensor.rgbd.source.v1` | `rgbd_cycle` | `RgbdCycleRequest` / `RgbdCycleResponse` |
| `api.sensor.radar.source.v1` | `radar_cycle` | `RadarCycleRequest` / `RadarCycleResponse` |
| `api.sensor.gnss.source.v1` | `gnss_cycle` | `GnssCycleRequest` / `GnssCycleResponse` |
| `api.sensor.lidar.source.v1` | `lidar_cycle` | `LidarCycleRequest` / `LidarCycleResponse` |
| `api.sensor.pointcloud.source.v1` | `pointcloud_cycle` | `PointCloudCycleRequest` / `PointCloudCycleResponse` |

Each source response can report `no_new_sample`; each part retains its original
sample times regardless of when it is polled. The rotating-radar source reports
one bounded azimuth sector at a time, including acquisition interval, sensor
frame, revolution and sample IDs, and individual range/bearing/velocity/signal
returns. Its `revolution_complete` flag marks the sector that closes one turn;
it does not turn a sector into a full-circle snapshot. Repeated polling after a
history gap or source-session change requires resynchronization. Neither a
Gateway nor this message family supplies object identities or world positions;
tracking and app queries belong to a Component. The display response distinguishes
part receipt, unit completion, decoding, renderer submission, and physical
presentation. `presented` is valid only when the implementation has a defined
observation for that stage.

The cleaner tutorial demonstrates the radar and GNSS payloads with
Control-only Gateway interfaces. The GNSS source uses the sample-exchange
lifecycle: `sample_available` contains a receiver sample, including a valid
`fix_mode: no_fix`, while `no_new_sample` contains no fix. A source-session
change requires `resync_required`, and latest-only polling may skip sample IDs.
The fix reports antenna-frame WGS84 position and only carries an acquisition
time when the receiver clock has a verified mapping to `r2kernel_sync`. The
Localizer converts the position to the configured map and combines it with
odometry orientation; the simulated tutorial does not establish hardware GNSS
accuracy or receiver clock behavior. Its host-clock alignment is fixture
configuration only; it does not validate a real receiver's GPS/UTC conversion.

The radar Gateway enforces explicit provider-side caps. The current deployment
does not apply binding-selected `common_control.limits` to each Control
exchange, so those provider caps do not guarantee that the selected binding
values are enforced. This is a current conformance limitation:
`binding_required` still requires enforcement of the selected values before a
deployment can claim full conformance.

## 1.0 contract surface

The R2Kernel 1.0 dictionary has one contract for each of these surfaces:

| Surface | Contract | Behavior |
| --- | --- | --- |
| Actuator servo | `api.actuator.servo.v1` | One `servo_control` Control. `ServoControlRequest` carries a `ControlCycle` and an `ActuatorCommand`; `ServoControlResponse` reports the cycle, `applied`, `rejected`, or `device_error`, and an optional `ActuatorState`. Refresh mode is `command_refresh`. |
| Timed digital output | `api.io.digital.timed_output.v1` | One `digital_output_control` Control. A `command` cycle establishes or replaces the output state; a `keep` cycle maintains the same positive state revision without a payload. The binding selects the update-gap lease. |
| Digital output Procedures | `api.io.digital.output.v1` | `set_digital_output` and `get_digital_output` Procedures. A Gateway does not expose Procedures; a Component may adapt them to its app-facing contract. |
| Camera | `api.sensor.camera.source.v1` | Control-only `camera_cycle` source with `msg.sensor.camera.v1` intrinsics and stream formats. There is no separate camera Event contract. |
| Depth, RGB-D, LiDAR, point cloud | the source Controls above | Typed profile and source Control contracts. Do not append fields to a published message and assume old binary readers will ignore them. |

Changing a published meaning requires an explicit adapter or a new
binding/API version. New schemas do not silently replace application-facing
Component Events, Procedures, or Operations. The tutorial servo, timed digital
output, radar, and GNSS Controls use the `common_control` profile; its private
package-local digital-I/O Controls are not examples of that profile.

## Response readiness and channel reclamation

Local production Control v5 has two completion boundaries: a validated response
owned by the caller, and channel reclamation that makes the lane reusable.
A response proves the provider callback returned; physical actuator completion
depends on the provider's declared response contract.

Existing synchronous transactions still wait for both boundaries. Applications
that need the response before channel reclamation can explicitly use:

| SDK | Response-ready call | Reclamation check |
| --- | --- | --- |
| C++ Subsystem | `transact_control_result(...)` | `wait_control_reclaimed(target, topic, timeout_ms)` |
| Python Subsystem | `transact_control_result(...)` | `wait_control_reclaimed(target, topic, timeout_ms)` |

These calls preserve raw and prepared-codec payload handling. Response data
is owned and remains valid after return. Reclamation uses the original
transaction deadline. Failure is explicit on the reclamation check and later
calls; the SDK does not replay requests. Resolve the failure before selecting
a fresh client or explicitly reconnecting the route.

A subsequent transaction on the same lane must pass its reclamation barrier.
Concurrent use of that lane can report busy. Independent bound sources and
interfaces retain their separate ownership within negotiated resource limits.
These APIs use local Control v5, the only local Control transport; a custom C++
`CoreClient` without explicit support rejects them.
They do not promise a physical packet frequency.

The transport preserves the documented wire version, ownership and deadline
contracts. Complete-frame failures invalidate the connection without replay.
When an exchange on a prepared lane misses its deadline after it reached
Control, or Control closes or resets the lane's connection (end of stream
before a frame, or a send that fails with EPIPE or a receive that fails with
ECONNRESET), the C++ and Python SDKs raise that exchange's error and then
re-prepare the lane once, with its original capacities, completion mode and
preparation timeout, after Control has closed the failed connection. The call
that failed returns after that bounded re-preparation (at most the lane's
preparation timeout). If re-preparation fails, the lane stays invalid until an
explicit preparation or rebind. Route, codec, binding, protocol and capacity
failures, and a transaction failure that Control reports in its reply (it then
closes the connection), are not re-prepared automatically. The late exchange
is still a failed exchange,
and the SDKs count re-preparations as `prepared_lane_recoveries` and
`prepared_lane_recovery_failures`.
Follow the public C ABI buffer sizing, copy and borrowed-payload lifetimes.
Real-time operation requires the documented memory-lock permissions and
resource budget; preparation failures remain explicit. Application allocation
and provider execution still affect latency.

Metrics are observational and can represent concurrent updates. Route, session
and codec compatibility errors remain explicit. Successful protocol completion
and measured receipt rate do not establish physical actuation or deadline
guarantees.

## Runtime measurement scope

Control receipt Hz describes Core receipt cadence, not caller wake-up precision
or physical device completion. Local v5 connections additionally report
cumulative successful completions, failed outcomes, and elapsed time over the
declared relative budget. Successful completion is measured from Core frame
read through completion of the lane-release notification; failure duration ends at the error. The budget is
compared with this Core duration and is independent of the requested period.
This is not an end-to-end deadline guarantee. Counters and maxima survive
connection replacement within the active interface registration. Coverage is
reported explicitly. Requests that Control forwards to a handler itself, not
through a caller's v5 lane, are recorded as receipts only and have no
completion counters.
Caller grid skips, wake lateness and physical GPIO completion remain unmeasured
by these Core metrics.

Local v5 rows also distinguish response delivery from channel reclamation:
`first_response_count` / `max_first_response_ns` cover Core frame read through
the complete first response write. `consumed_count` /
`max_response_to_consumed_ns` cover that write through confirmation that the
caller owns the response. `released_count` / `max_consumed_to_release_ns`
cover that confirmation through completion of the lane-release notification.
`reclaim_failed_count` / `max_failed_reclaim_ns` record errors after the first
response write. Each row includes its measurement scope. Unreached boundaries
have a zero count and null maximum; receipt-only rows have null stage counters.
Maxima can belong to different transactions and must not be subtracted to
attribute a particular overrun. The Console's interface details show these
stages independently from receipt rate and overall protocol completion.

Owned response storage, handler lifetime, lane admission and reclamation
barriers remain required by the public SDK contract.

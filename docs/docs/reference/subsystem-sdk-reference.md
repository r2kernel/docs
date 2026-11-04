# Subsystem SDK Reference

This page is the table-oriented catalog for public subsystem-author SDK
surfaces. For usage guidance, start with
[Subsystem SDK API Guide](../api/subsystem-sdk-api.md).

## Role Classes

| Role | Python class | C++ class | Purpose |
| --- | --- | --- | --- |
| `gateway` | `r2kernel.wrapper.GatewaySubsystem` | `r2kernel::wrapper::GatewaySubsystem` | Hardware or simulator-backed device boundary |
| `component` | `r2kernel.wrapper.ComponentSubsystem` | `r2kernel::wrapper::ComponentSubsystem` | Reusable robotics control function |
| `compound` | `r2kernel.wrapper.CompoundSubsystem` | `r2kernel::wrapper::CompoundSubsystem` | Robot physical and spatial composition |
| `app` | `r2kernel.wrapper.AppSubsystem` | `r2kernel::wrapper::AppSubsystem` | Robot task, scenario, SI logic, or product application |

All role classes inherit the common `Subsystem` behavior.

## Construction And Manifest

| Surface | Python | C++ | Purpose |
| --- | --- | --- | --- |
| Construct subsystem | `GatewaySubsystem(...)`, `ComponentSubsystem(...)`, `CompoundSubsystem(...)`, `AppSubsystem(...)` | role-specific class constructed from `SubsystemOptions` | Create one runtime subsystem |
| Name | `name` constructor argument | `SubsystemOptions::name` | Runtime subsystem name |
| Manifest path | `manifest_path` | `SubsystemOptions::manifest_path` | Load the `subsystem.yaml` declaration; `R2KERNEL_SUBSYSTEM_MANIFEST` and the default search apply when it is not given ([Manifest Discovery](#manifest-discovery)) |
| Deployment manifest path | `deployment_manifest_path` | `SubsystemOptions::deployment_manifest_path` | Static deployment bindings; `R2KERNEL_DEPLOYMENT_MANIFEST` and the default search apply when it is not given ([Manifest Discovery](#manifest-discovery)) |
| Launch bindings input | `R2KERNEL_BINDINGS` | `SubsystemOptions::launch_bindings` and `R2KERNEL_BINDINGS` | Binding targets supplied by the launcher or custom startup code |
| Loaded subsystem manifest | `subsystem_manifest` property | `subsystem_manifest()` | Read-only `SubsystemManifest` model |
| Loaded deployment manifest | `deployment_manifest` property (`None` when none was found) | `deployment_manifest()` (`std::optional<DeploymentManifest>`) | Read-only `DeploymentManifest` model |
| Declared APIs | `declared_apis` property | `declared_apis()` | Public `api.*` contracts of provided interfaces |
| Declared components | `declared_components` property | `declared_components()` | Public `component.*` contracts of provided interfaces |
| Declared runtime endpoints | `declared_runtime_endpoints(endpoint_kind)` | `declared_runtime_endpoints(endpoint_kind)` (sorted) | Endpoints of one kind (`publishes`, `subscribes`, `controls`, `procedures`, `operations`) that the manifest and spec contracts allow this subsystem to register |

The manifest models (`SubsystemManifest`, `InterfaceDeclaration`,
`ExportDeclaration`, the `Spatial*` declarations, `BindingReference`,
`BoundInterface`, `DeploymentManifest` with `resolve(consumer, requirement,
target_override)`, `DeploymentInstance`, `RobotPlatformManifest`,
`RobotPlatformSlot`, `ApplicationManifest` and `ManifestError`) and the loaders
`load_subsystem_manifest`, `load_robot_platform_manifest`,
`load_application_manifest`, `load_deployment_manifest` and
`validate_required_bindings_for_subsystem` come from `r2kernel.manifest` in
Python and `r2kernel/wrapper/manifest.hpp` in C++.

### Manifest Discovery

Both SDKs look for the manifests in this order and use the first path that
exists:

1. Subsystem manifest: the `manifest_path` option, otherwise
   `R2KERNEL_SUBSYSTEM_MANIFEST`; then `<name>.subsystem.yaml` and
   `subsystem.yaml` two directories above the resolved user data path (for
   `./userdata`, the parent of the working directory); then
   `<name>.subsystem.yaml` and `subsystem.yaml` in the working directory. The
   manifest is required: construction fails without one, whatever
   `R2KERNEL_CONTRACT_POLICY` says.
2. Deployment manifest: the `deployment_manifest_path` option, otherwise
   `R2KERNEL_DEPLOYMENT_MANIFEST`; then `r2kernel.deployment.yaml` next to the
   subsystem manifest, in its parent directory and in the working directory.
   Without one, the subsystem waits for runtime bindings (below).

The option replaces the environment variable; a leading `~` is expanded, and a
path that does not exist is skipped. A manifest inside a package directory
(one holding `package.yaml`) is read with the package's
`contracts.spec_roots`.

### Manifest Validation

Both SDKs validate manifests with the same rules and the same messages:
subsystem kind and role, interface and
export declarations, spatial declarations and the spatial ports a component
contract requires, and the role endpoint policy (Gateways use only Control
endpoints; apps and compounds use none). A deployment manifest is checked as a
whole: its robot and application manifests, instances (`slots`, `launch`,
`host`, `params`), robot slot assignment and contracts, the application's
required robot profiles, every binding, Control binding-group identity (one
source subsystem binds at most one requirement to a Control provider
interface), every required binding and the spatial topology. A violation raises
`ManifestError` (C++ throws `r2kernel::wrapper::ManifestError`).

When a deployment manifest is found, construction validates it and fails when
a required binding of the subsystem does not resolve. Without one, a required
interface that has no launch binding logs a waiting warning and the subsystem
starts in `WaitingBinding`.

Public declarations come from `subsystem.yaml`. Python keeps
`declare_api_contract` and `declare_component` only to raise a `RuntimeError`
that points to the manifest; C++ has no code-level declaration methods.

## Binding And Configuration Methods

| Purpose | Python | C++ |
| --- | --- | --- |
| Read launch bindings | `launch_bindings` property | `launch_bindings()` |
| Read runtime bindings (Control's current rows; empty when Control is unavailable) | `runtime_bindings()` | `runtime_bindings()` |
| Read effective bindings (launch bindings overridden by runtime bindings) | `effective_bindings()` | `effective_bindings()` |
| Resolve required interface | `resolve_binding(requirement, *, deadline=None)` | `resolve_binding(requirement, deadline = std::nullopt)` |
| Resolve only the runtime binding | `resolve_runtime_binding(requirement_name, *, deadline=None)` | `resolve_runtime_binding(requirement, deadline = std::nullopt)` |
| Resolve target subsystem name | `binding_target(requirement, *, deadline=None)` | `binding_target(requirement, deadline = std::nullopt)` |
| Bind own requirement | `bind_requirement(requirement, target, *, deadline=None)` | `bind_requirement(requirement, target, deadline = std::nullopt)` |
| Remove own self-binding | `unbind_requirement(requirement, *, deadline=None)` | `unbind_requirement(requirement, deadline = std::nullopt)` |
| Read config data | `config_data` property | `config_data()` |
| Read config value | `config_get(*path, default=None)` | `config_get(path, default_json = "null")` |
| Set config value | `config_set(value, *path, save=False)` | `config_set(value_json, path, save = false)` |
| Reload config | `config_reload()` | `config_reload()` |
| Save config | `config_save()` | `config_save()` |

Binding queries ask Control once per call, within 1 s or until the given
deadline. `resolve_binding` returns the runtime binding when Control has one
in state `bound`; an explicit runtime unbind or a non-callable state raises
(C++ throws `std::runtime_error`). Otherwise it uses the launch binding, then
the deployment manifest binding. With a deadline only a ready runtime binding is
accepted. `resolve_runtime_binding` never uses launch or deployment data: it
returns `None` (C++ `std::nullopt`) while the requirement is not bound or its
source registration is pending, and raises on transport, protocol or binding
errors.

The configuration document is `<user_data_path>/config` (YAML), loaded at
construction and created as `{}` when missing. A path is a dotted or
slash-delimited string (`"a.b"`, `"a/b"`) or a sequence of literal keys
(Python variadic keys or a list, C++ `std::vector<std::string>`). A missing or
null value returns the default. Both SDKs read each other's file back to the
same values; C++ keeps YAML timestamps as strings.

## Compound Export Support

| Surface | Supported behavior |
| --- | --- |
| Static deployment resolver (Python `DeploymentManifest.resolve`, C++ `DeploymentManifest::resolve`) | resolves a binding through compound exports to the actual component provider, checking consumer and provider roles, contract equality, the export requirement and its binding, public visibility of the final interface and export cycles |
| Runtime resolver (Python and C++ `resolve_runtime_binding`, `resolve_binding` with a deadline) | accepts only a `bound` runtime binding with both resolved fields (`resolved_target_subsystem`, `resolved_provider_interface`); failure states are callable errors, not compound-alias fallbacks |
| Manifest loader (both SDKs) | validates compound export declarations, including component conformance; the C++ wrapper also reports exports in heartbeat status |
| C++ tutorial support helper | statically checks export-chain contract equality, component role, public visibility and cycles for tutorial bindings; it is a tutorial convenience, not an SDK API |
| CLI backend | loads and validates manifest export declarations for `r2kernel deploy validate`; this is a CLI/runtime capability, not an SDK resolver |

The public subsystem-author SDKs are Python and C++. Runtime and CLI validation
capabilities are not additional SDKs.

## Lifecycle Methods

| Purpose | Python | C++ |
| --- | --- | --- |
| Initialize | `initialize()` | `initialize()` |
| Start | `start()` | `start()` |
| Pause request | `pause()` | `pause()` |
| Resume request | `resume()` | `resume()` |
| Stop request | `stop()` | `stop()` |
| Fault request | `fault(reason=None)` | `fault(reason)` |
| Degrade request | `degrade(reason=None)` | `degrade(reason)` |
| Reset | `reset()` | `reset()` |
| Terminate | `terminate()` | `terminate()` |
| Generic transition | `request_lifecycle_transition(...)` | `request_lifecycle_transition(...)` |

Python `reset()` preserves its `None` return; the generic
`request_lifecycle_transition("reset")` reports a Boolean. Both accept reset only
from `FAULTED`, `ERROR`, `DEGRADED`, `PAUSED` or `STOPPED`, enter `RESETTING`, and
reach `READY` only if `on_reset()` succeeds. A false hook result or exception
leaves `FAULTED`. Reset from `READY`, `OPERATING` or another unsupported state is
refused; it is not a way to bypass failed initialization.

In C++, a direct synchronous lifecycle request on a Subsystem from a thread
currently registering an Event on that same Subsystem is refused promptly.
This includes reentry by a custom `CoreClient` and nested registrations. Boolean
transitions return `false`; `start()`, `reset()` and `terminate()` leave the
state unchanged, while `initialize()` throws. Other threads are not refused
solely because registration is active; their requests follow the normal lifecycle
serialization policy.

Overlapping `terminate()` calls on the same Subsystem coalesce in both SDKs:
one caller runs the hook and cleanup calls, while other threads wait until that
attempt returns or fails and then return without repeating it. A later,
non-overlapping call starts a new attempt. A recursive call from a lifecycle
or termination hook on the same thread is refused. Waiters do not receive
the owner's failure; inspect the owner result, lifecycle state and logs.
Completion alone does not guarantee successful teardown. Python's heartbeat
join remains bounded; the C++ Operation-worker guarantee below applies when its
drain completes. No automatic retry or successful cleanup is promised on failure.

`terminate()` can block and the C++ API is not async-signal-safe. Do not call
it directly from a native signal handler; arrange for a normal thread to
perform termination. Avoid waiting for teardown in Python signal handlers too.


In C++, a termination attempt waits for an active lifecycle transition before
starting teardown. Initialization does not overlap active teardown. Teardown
releases the lifecycle transition mutex before waiting for registrations or
joining transport or callback threads.

Lifecycle hooks can wait for a worker to register an Event. However, a
registration callback or lifecycle hook must not synchronously wait for a worker
that requests a lifecycle transition on the same Subsystem: the worker can wait
on work owned by the waiting thread, causing a deadlock. This cross-thread
reentry is unsupported and cannot be detected by the same-thread guard.

## Lifecycle Hooks

| Hook | Python | C++ | Required |
| --- | --- | --- | --- |
| Initialize implementation | `on_initialize()` | `on_initialize()` | yes |
| Start implementation | `on_start()` | `on_start()` | yes |
| Terminate implementation | `on_terminate()` | `on_terminate()` | yes |
| Reset implementation | `on_reset()` | `on_reset()` | yes |
| Pause implementation | `on_pause()` | `on_pause()` | no |
| Resume implementation | `on_resume()` | `on_resume()` | no |
| Stop implementation | `on_stop()` | `on_stop()` | no |
| Fault implementation | `on_fault(reason=None)` | `on_fault(reason)` | no |
| Degraded implementation | `on_degraded(reason=None)` | `on_degraded(reason)` | no |
| State change callback | `on_state_changed(state)` | `on_state_changed(state)` | no |

Register all declared endpoints before `on_initialize()` returns. The SDK
validates declarations after `on_initialize()` and before the subsystem reaches
`Ready`; default `strict` validation errors fail initialization and are not
automatically downgraded to warnings. In C++, install a raw Control handler
with `start_control_server(handler)` during `on_initialize()` as well. An
endpoint added in `on_start()` cannot satisfy the initialization gate.

Both SDKs apply the same runtime contract type rule in that gate: every
registered Control endpoint, Procedure, and Operation, including one declared
only on an `internal` interface, needs request/response (Operation:
request/feedback/result) type metadata naming a scalar such as `bytes` or a
resolvable versioned message. `R2KERNEL_CONTRACT_POLICY` selects the outcome:
`strict` (default) fails initialization, `warn` logs warnings, and `off` skips
the check. Python exposes it as `r2kernel.contract.validate_runtime_contract_types`
and C++ as `Subsystem::validate_runtime_contract_types()`.

`Ready` is not `Operating`. A registered handler can receive a command before
the subsystem enters `Operating`, and the SDK does not gate handler dispatch by
lifecycle state. Component or Gateway handler code must check its lifecycle
state and safely reject commands that are not yet valid. Starting is accepted
only from `Ready` or `Stopped` after initialization succeeds; stop or reset
cannot replace a failed initialization.

## Event Methods

| Purpose | Python | C++ |
| --- | --- | --- |
| Register publisher | `register_event_publish(topic=..., type=..., size=..., src_attr=..., priority=..., queue_depth=...)` | `register_event_publish(EventPublishSpec)` |
| Register subscriber | `register_event_subscribe(topic=..., type=..., size=..., dest_attr=..., callback=...)` | `register_event_subscribe(EventSubscribeSpec)` |
| Publish sample | `publish_event(topic=..., value=..., timestamp=None)` | `publish_event(topic, payload, timestamp_ns = -1)` |
| Start transport | `start_event_transport()` | `start_event_transport()` |
| Stop transport | `stop_event_transport()` | `stop_event_transport()` |

`publish_event` publishes with the priority given when the topic was registered
(Python `priority=...`, C++ `EventPublishSpec::priority`); a sample carries no
priority of its own.

Event endpoints must come from public spec contracts or `visibility: internal`
manifest endpoint lists. Do not create endpoint names dynamically at runtime.

### Native Event Receive Capacity

Native Event clients read these environment settings when created:

| Variable | Default | Contract |
| --- | --- | --- |
| `R2KERNEL_EVENT_CLIENT_QUEUE_MAX_MESSAGES` | `1024` | Maximum retained receive-message count |
| `R2KERNEL_EVENT_CLIENT_QUEUE_MAX_BYTES` | `67108864` | Maximum charged bytes retained for receive messages |

Both must be positive machine-sized unsigned integers; invalid values refuse
client creation with `InvalidArgument`. Byte accounting includes retained
message/name/payload allocations, not just logical payload length. Count and
byte limits both apply.

At capacity, the oldest queued messages are dropped to retain newer messages.
A single message larger than the byte budget is refused without discarding
already queued messages. `skipped_generations` includes both shared-memory
overwrites and receive-queue drops; it is not solely a publisher-loss counter.
Successful receive and client close release retained capacity. A
`BufferTooSmall` receive keeps the front message and its capacity charge, so
callers must resize rather than spin or expect later messages to bypass it.

### Low-Level Shared-Memory Access

High-level Event publish/receive APIs coordinate access automatically. Direct
slot access has three operations; each is complete on its own and coordinates
only the selected slot:

| Operation | Python `TopicBufferPool` | C ABI |
| --- | --- | --- |
| Commit payload, generation and timestamps together | `publish(slot_index, data, generation, timestamp, published_timestamp)` | `r2kernel_shm_publish(...)` |
| Copy metadata and payload | `snapshot(slot_index, *, expected_generation=None, include_payload=True)`; `read_payload(slot_index)` returns only the payload | `r2kernel_shm_read_snapshot(...)` |
| Clear the slot | `reset_slot(slot_index)` | `r2kernel_shm_reset_slot(...)` |

A snapshot is an immutable copy, or `None` (`read_payload` raises) when the
payload is not ready or the expected generation is no longer current; it holds
no access guard for the caller. There are no per-field accessors. Do not retain
a raw mapped pointer for unsynchronized access. Interrupted publication does not
promise rollback or partial-write recovery. Same-slot access can block; latency,
throughput and real-time behavior remain unqualified. Local Control v5 payloads
do not use these slots; they follow their own ownership and descriptor contract.

## Control Methods

| Purpose | Python | C++ |
| --- | --- | --- |
| Register control endpoint | `register_control_endpoint(topic, handler, request_type=..., response_type=..., timing_support=...)` | `register_control_endpoint(topic, handler, ControlEndpointOptions)` |
| Register raw endpoint | `register_raw_control_endpoint(topic, handler)` | `register_raw_control_endpoint(topic, handler)` |
| List endpoint names | `get_control_info()` | `get_control_info()` |
| List endpoint metadata | `get_control_contract_info()` | `get_control_contract_info()` |
| Bind control server (returns the port) | `bind_control(port=None, host="0.0.0.0")` | `bind_control(port = 0, host = "0.0.0.0")` |
| Read control port | `get_control_port()` | `get_control_port()` |
| Start control server | `start_control_server(handler=None)` | `start_control_server()`, `start_control_server(handler)` |
| Stop control server | `stop_control_server()` | `stop_control_server()` |
| Resolve target route | `resolve_control_target(target)` (dict or `None`) | `resolve_control_target(target)` (`std::optional<ControlRoute>`) |
| Connect to an explicit address | `connect_control(name, host, port)` | `connect_control(name, host, port)` |
| Check target route (not provider-ready preparation) | `handshake_control(target, timeout_ms=1000)` | `handshake_control(target, timeout_ms = 1000)` |
| Send without waiting | `send_control(target=..., topic=..., type=..., value=..., timestamp=..., period_ms=..., deadline_ms=..., priority=None)` | `send_control(target, topic, payload, timestamp_ns = -1, period_ms = 0, deadline_ms = 1000, priority = -1)` |
| Receive response | `recv_control(target, type, timeout_ms=0)` | `recv_control(target, type, timeout_ms = 0)` |
| Request/response exchange | `transact_control(target=..., topic=..., type=..., value=..., period_ms=..., deadline_ms=..., ...)` | `transact_control(target, topic, payload, period_ms, deadline_ms, timeout_ms = 1000, priority = -1)`, or with `ControlTransactOptions` |
| Response-ready exchange | `transact_control_result(...)` (same arguments) | `transact_control_result(...)` (same overloads) |
| Wait for lane reclamation | `wait_control_reclaimed(target, topic, timeout_ms=1000)` | `wait_control_reclaimed(target, topic, timeout_ms = 1000)` |
| Bound request/response exchange | `transact_bound_control(binding=..., topic=..., ...)` | `transact_bound_control(binding, topic, payload, ...)` (same overloads as `transact_control`) |
| Prepare provider-ready bounded topic lane | `prepare_control(target, topic, request_capacity, response_capacity, timeout_ms=1000, result_ready=False)` | `prepare_control(target, topic, request_capacity, response_capacity, timeout_ms = 1000, result_ready = false)` |
| Prepare Procedure lane | `prepare_procedure(target, procedure, request_capacity, response_capacity, timeout_ms=1000, result_ready=False, *, typed=True)` | `prepare_procedure(target, procedure, request_capacity, response_capacity, timeout_ms = 1000, result_ready = false, typed = true)` |
| Prepare Operation-start lane | `prepare_operation(target, operation, request_capacity, response_capacity, timeout_ms=1000, result_ready=False, *, typed=True)` | `prepare_operation(target, operation, request_capacity, response_capacity, timeout_ms = 1000, result_ready = false, typed = true)` |
| Configure actual provider data-worker profile | `configure_control_worker(policy, priority, cpus)` | `configure_control_worker(policy, priority, cpus)` |
| Read cold worker profile diagnostics | `control_worker_status()` (list of dicts) | `control_worker_status()` (`std::vector<ControlWorkerStatus>`) |

In user-facing terms, the `topic` argument is the Control endpoint key.

`bind_control` returns the bound port (the requested port until Control assigns
one) and fails when the role cannot serve native Control. `recv_control`
receives the response of an earlier `send_control`; `type` is the response
payload type: `bytes` (or, in C++, empty) keeps the payload bytes and a message
reference decodes it (Python returns the decoded value, C++ the decoded JSON
text and throws when it does not decode). `resolve_control_target` returns the
fields of Control's route reply (`host`, `port`, `route_kind`, the advertised
`controls`, `procedures` and `operations`, and the contract and codec maps), or
`None`/`std::nullopt` when Control has no usable route.

`configure_control_worker` takes the policy name `OTHER`, `FIFO` or `RR`
(case-insensitive, optional `SCHED_` prefix), a priority within that policy's
range and a nonempty CPU list. Each `control_worker_status()` record has `tid`,
`policy` (the numeric OS scheduling policy that was read back), `priority`,
`cpus`, `ready`, `error` (absent when ready) and `phase` (`profile_applied`,
`profile_failed`, or `profile_observed` for a worker without a configured
profile).

Bound calls (`transact_bound_control`, `call_bound_procedure`,
`start_bound_operation`) start one invocation budget at entry (the call's
timeout; for Control also `deadline_ms`) that covers the strict runtime binding
resolution (`binding_target(binding, deadline)`) and the call. A binding that
is not ready, an unavailable Control or a spent budget raises (C++ throws
`std::runtime_error`) and sends nothing.

Preparation requires production Control v5 and a live provider/binding. Capacities
are encoded payload-byte limits, not region sizes. Success reserves the declared
request/response capacity at the selected provider without calling its
application handler. Select `result_ready` during preparation when that completion
mode is needed; ordinary calls do not silently grow capacity or perform cold
setup. Unprepared exchange remains supported. Explicit idle re-preparation
preserves outstanding ownership and retained errors. Binding/route invalidation
fails explicitly. A deadline miss that expires before anything reaches Control fails only that
exchange and keeps the prepared lane. A late exchange after publication, or a
connection Control closed or reset (end of stream before a frame, or a send
that fails with EPIPE or a receive that fails with ECONNRESET), fails that
exchange without replay and re-prepares
the same lane within its preparation timeout; route, codec, binding, protocol
and capacity failures, and a transaction failure that Control reports in its
reply (it then closes the connection), are not re-prepared automatically. Worker status is profile readiness, not provider readiness.
Production caller deadlines include route/codec work and propagate remaining
time; successful decoding after the absolute deadline is a deadline failure.
Preparation/production route resolution makes one request under the caller's
absolute remaining budget, including proof and response parsing; no independent
one-second wait or retry sleep is added. Standalone resolution without a strict
invocation deadline retains its existing behavior.

Procedure/Operation preparation uses the existing runtime transport topics
(typed: `procedure.call_typed/<procedure>`, `operation.start_typed/<operation>`;
untyped: `procedure.call`, `operation.start`), not a Control-role bypass for
arbitrary endpoints. It first checks that the target advertises the name, within
the same `timeout_ms` budget. Set `typed=False` (C++ `typed = false`) to prepare
the untyped Procedure call or Operation start envelope lane. Nonreserved Control
endpoints remain restricted to Gateway/Component callers.

### Gateway Bound Control

`GatewaySubsystem` checks which sources are bound to one of its provided
Control interfaces. Each call asks Control for the current binding status (one
request within 1 s); an undeclared interface or an inconsistent, ambiguous or
unavailable status raises (fail closed).

| Purpose | Python | C++ |
| --- | --- | --- |
| Bound sources (`source_reference` to source subsystem) | `bound_control_sessions(provider_interface)` | `bound_control_sessions(provider_interface)` |
| Owner registration and binding epoch of the one bound source | `bound_control_authority(provider_interface)` (dict) | `bound_control_authority(provider_interface)` (`BoundControlAuthority`) |
| Check a received request against the bound source | `validate_control_authority(provider_interface, context)` | `validate_control_authority(provider_interface, source_subsystem, source_authority)`, or `validate_control_authority(provider_interface, request)` on the handler thread |
| Source subsystem when exactly one source is bound | `bound_control_owner(provider_interface)` | `bound_control_owner(provider_interface)` |
| The one source requirement reference of a source | `bound_control_session(provider_interface, source_subsystem)` | `bound_control_session(provider_interface, source_subsystem)` |

`bound` means the binding topology and contracts are checked, not that the
source session or handler is live. `validate_control_authority` refuses a
request whose source subsystem is not the bound source (Python `ValueError`,
C++ `std::invalid_argument`) and, for a federated source, one whose
authenticated transport authority does not match every field.

### Transport Authority

While a Control, Procedure or Operation callback runs, the SDK exposes the
manager-verified transport authority of that request. No name declared by the
SDK or carried in application data is authenticated.

| Purpose | Python | C++ |
| --- | --- | --- |
| Control source authority | `current_control_source_authority()` on the `Subsystem`, or `context.source_authority` | free function `r2kernel::wrapper::current_control_source_authority()` (`std::optional<ControlSourceAuthority>`) |
| Protocol host authority | `current_protocol_host_authority()` on the `Subsystem`, or `context.host_authority` | free function `r2kernel::wrapper::current_protocol_host_authority()` (`std::optional<ProtocolHostAuthority>`) |

Both return nothing (`None` or `std::nullopt`) for a request without that
authority. The Control source authority has `peer`, `epoch`, `source`,
`source_session`, `source_registration`, `source_reference`, `target`,
`target_session`, `target_registration`, `interface`, `binding_revision` and
`topic`; the Protocol host authority has `kind` (always `protocol`), `peer`
and `epoch`. Protocol Procedure and Operation requests carry the sender
`host:<peer>`. Operation handlers run with the host authority captured when
the Operation was accepted and no Control source authority.

## Procedure Methods

| Purpose | Python | C++ |
| --- | --- | --- |
| Register Procedure | `register_procedure(name, handler, request_type=..., response_type=..., timing_support=...)` | `register_procedure(name, handler, ProcedureOptions)` |
| Register typed Procedure | `register_typed_procedure(name, handler, request_type=..., response_type=..., timing_support=...)` | `register_typed_procedure(name, handler, request_type, response_type, timing_support)` |
| Start Procedure server | `start_procedure_server()` | `start_procedure_server()` |
| Stop Procedure server | `stop_procedure_server()` | `stop_procedure_server()` |
| List Procedure names | `get_procedure_info()` | `get_procedure_info()` |
| List Procedure metadata | `get_procedure_contract_info()` | `get_procedure_contract_info()` |
| Call Procedure | `call_procedure(target=..., procedure=..., params=None, timeout_ms=1000, ...)` | `call_procedure(target, procedure, params_json = "null", timeout_ms = 1000)`, or with `ProcedureCallOptions` |
| Call bound Procedure | `call_bound_procedure(binding=..., procedure=..., params=None, timeout_ms=1000, ...)` | `call_bound_procedure(binding, procedure, params_json = "null", timeout_ms = 1000)`, or with `ProcedureCallOptions` |
| Call typed Procedure | `call_typed_procedure(target=..., procedure=..., request_type=..., response_type=..., params=..., timeout_ms=1000)` | `call_typed_procedure(target, procedure, request_type, response_type, params_json = "{}", timeout_ms = 1000)` |


A failed Procedure call reports `ok` false with an `error_code`:
`procedure_transport_failed` when the transport fails and
`procedure_response_error` when a timed response carries a nonzero status
(Python also keeps the timed reply under `procedure_response`). C++
`start_operation` reports `operation_transport_failed` in
`OperationStartResponse::error_code` when the transport fails; Python raises
`RuntimeError`. Untyped requests on the wire are JSON objects of kind
`procedure_request`, which names the endpoint in `procedure`, and
`operation_start_request`, which names it in `operation`. Operation query
responses and Operation feedback, result, and state messages also carry the
name in `operation` next to `operation_id`. Unknown keys are ignored, so a
request without its name key is answered with `ok` false, `error_code`
`invalid_argument`, and `missing procedure name` or `missing operation name`.

A C++ typed Procedure handler failure on an untimed call returns a nonzero
transport status with diagnostic payload; typed callers report failure instead
of decoding those diagnostic bytes as a successful response. This does not add
a new response envelope or change payload encoding.

## Operation Methods

| Purpose | Python | C++ |
| --- | --- | --- |
| Register Operation | `register_operation(name, handler, request_type=..., feedback_type=..., result_type=..., state_type=..., timing_support=...)` | `register_operation(name, handler, OperationOptions)` |
| Start Operation server | `start_operation_server()` | `start_operation_server()` |
| Stop Operation server | `stop_operation_server()` | `stop_operation_server()` |
| List Operation names | `get_operation_info()` | `get_operation_info()` |
| List Operation metadata | `get_operation_contract_info()` | `get_operation_contract_info()` |
| Start Operation | `start_operation(target=..., operation=..., params=None, timeout_ms=None, ...)` | `start_operation(target, operation, params_json = "null", timeout_ms = std::nullopt)`, or with `OperationStartOptions` |
| Start bound Operation | `start_bound_operation(binding=..., operation=..., params=None, timeout_ms=None, ...)` | `start_bound_operation(binding, operation, params_json = "null", timeout_ms = std::nullopt)`, or with `OperationStartOptions` |
| Cancel Operation | `cancel_operation(target=..., operation_id=...)` | `cancel_operation(target, operation_id, timeout_ms)` |
| Query Operation | `query_operation(target=..., operation_id=...)` | `query_operation(target, operation_id, timeout_ms)` |
| Subscribe feedback | `subscribe_operation_feedback(...)` | `subscribe_operation_feedback(...)` |
| Subscribe result | `subscribe_operation_result(...)` | `subscribe_operation_result(...)` |
| Subscribe state | `subscribe_operation_state(...)` | `subscribe_operation_state(...)` |
| Check cancellation | `is_operation_cancel_requested(operation_id)` | `OperationContext::is_cancel_requested()` |
| Publish feedback | `publish_operation_feedback(operation_id=..., payload=...)` | `OperationContext::publish_feedback(...)` |
| Publish result | `publish_operation_result(operation_id=..., payload=...)` | `OperationContext::publish_result(...)` |
| Publish state | `publish_operation_state(operation_id=..., state=..., payload=...)` | `OperationContext::publish_state(...)` |
| Complete operation | `complete_operation(...)` | `OperationContext::succeed(...)`, `fail(...)`, or `canceled(...)` |

Without a start timeout the provider receives a null `timeout_ms` and the caller
waits at most 1000 ms; a given timeout is sent as is and bounds the wait.

Feedback, result and state events are encoded the same way in every SDK. A
payload is encoded with the type that the Operation declares for that event
(`feedback_type`, `result_type`, `state_type`) when that type is a message
reference. Otherwise, including the default state type `string`, the payload
is JSON. Bytes are sent as given. The declared type travels with the event as
`payload_type`, and subscribers decode a typed payload by it, so the
subscriber must register that message type too.

A terminal state event (`succeeded`, `failed`, `canceled`) has no payload. The
result follows in its own result event, and only when there is a result. A
cancel request publishes a `cancel_requested` state event unless the Operation
has already finished. After a cancel request, a non-terminal state is not
published. A terminal state that the handler publishes itself ends the
Operation: the value the handler then returns, or the exception it raises, is
neither stored nor published, in Python and in C++. A cancel request, or
`stop_operation_server()`, while that handler still runs leaves the Operation
as it is (`cancel_requested` stays false, no event). `queued` and `running` are
never published: they are the states of the start reply and of a query. An Operation canceled before its handler starts
ends `canceled` without running the handler. The golden sequences for each
way an Operation ends are in `sdk/testdata/wire/operation-event-sequences.json`.

| Received event | Python callback `message` | C++ `OperationEventMessage` |
| --- | --- | --- |
| Payload | `payload`: the decoded value, `bytes` for a raw payload, `None` without one | `payload_json`: JSON text; a raw payload is a JSON string of lowercase hex; `"null"` without one |
| Encoding | the type of `payload` | `payload_encoding`: `none`, `json`, `typed` or `raw`; raw bytes also in `payload_bytes` |
| Declared type | `payload_type` (when declared) | `payload_type` (empty when not declared) |

C++ typed payloads can skip JSON. The JSON overloads convert each typed payload
between JSON text and the codec bytes, about 0.8 to 2.3 microseconds per event
in process. Without JSON, a typed event costs about as much as a JSON one.

| Path | C++ API without JSON |
| --- | --- |
| Publish a typed payload | `OperationContext::publish_feedback`, `publish_state`, `publish_result`, `succeed`, `fail` and `canceled` with a `CodecByteView` encoded with the declared message type (for example `PreparedCodec::encode_nodes` output); the event equals the one the JSON overload writes; a declared type that is not a message throws `std::invalid_argument` |
| Receive a typed payload | `subscribe_operation_*(..., OperationSubscribeOptions)` with `payload_json = false`: typed and raw payloads only in `payload_bytes`, `payload_json` empty for them; read them with `PreparedCodec::decode_nodes` |
| Typed Procedure handler | `ProcedureOptions::native_payload`: `ProcedureRequest::params_payload` in, `ProcedureResponse::result_payload` out |
| Typed Procedure call | `call_procedure(target, procedure, params_payload, ProcedureCallOptions)` with both types: the encoded result in `result_payload` |

Python passes typed values to its codec as Python objects, without JSON text,
so it needs no separate path. Event payloads and Control endpoints with
`native_payload` were already bytes in C++. Typed Operation start params stay
JSON, converted once per Operation.

In C++, `terminate()` closes Operation admission and ends running Operations as
`stop_operation_server()` does in Python: they get 1 s to finish, then each
unfinished one is asked to cancel and its `cancel_requested` state event is
published. `terminate()` then waits for admitted Operation workers to exit
before invoking `on_terminate()` or stopping their Event transport. Python's
`terminate()` leaves running Operations alone; C++ cannot, because their
workers use the Subsystem. A terminal Operation state alone does not mean its
worker has exited; a still-running worker can observe cancellation even after
publishing a terminal state, while the finished Operation keeps its state.
`stop_operation_server()` takes the same steps and then waits up to 0.25 s more,
as in Python, but does not wait for workers.

Handlers should observe `OperationContext::is_cancel_requested()` and return; a
handler that does not return can block termination indefinitely. Calling
`terminate()` directly from an Operation worker or a synchronous Operation
admission callback on the same Subsystem is refused and logged, rather than
waiting for itself. Do not make a handler wait for a different thread that is
terminating that Subsystem.

Call `terminate()` while the complete derived Subsystem and everything its
handlers capture are still alive, before destroying them. The base destructor
cannot protect derived members that have already begun destruction.

## Spatial Methods

| Purpose | Python | C++ |
| --- | --- | --- |
| report or replace an owned edge | `set_frame_transform(parent_frame=..., child_frame=..., translation=..., rotation_xyzw=..., observed_at_sync_ns=..., static=False, stale_after_ms=...)` | `set_frame_transform(FrameTransform)` |
| remove an owned edge | `clear_frame_transform(child_frame)` | `clear_frame_transform(child_frame)` |
| inspect locally owned edges | `frame_transforms()` | `frame_transforms()` |
| report payload of the owned edges | `spatial_status_payload()` (dict) | `spatial_status_payload()` (JSON text) |
| query composed runtime graph | `lookup_frame_transform(source_frame, target_frame)` (dict) | `lookup_frame_transform(source_frame, target_frame)` (JSON text) |
| synchronized observation time | `now_ns()` | `now_ns()` |

Frame names passed to reporting methods are subsystem-local. Runtime lookup
accepts qualified `<subsystem>/<frame>` names. Unqualified names work only when
they are unique in the current graph. `lookup_frame_transform` sends one Control
frame lookup request within 1 s and returns Control's reply, for example the
composed transform or an error object; a blank frame name is refused before
the request.

## Timing And Option Types

| Concept | Python shape | C++ type |
| --- | --- | --- |
| Timing request | `dict` with `execute_after_ns`, `execute_at_sync_ns`, `priority`, `late_policy`, `max_lateness_ns`, `correlation_id`, `request_id` | `ControlTimingOptions` |
| Control transaction options | keyword args on `transact_control(...)` | `ControlTransactOptions` |
| Control endpoint options | keyword args on `register_control_endpoint(...)` | `ControlEndpointOptions` |
| Procedure call options | keyword args on `call_procedure(...)` | `ProcedureCallOptions` |
| Procedure endpoint options | keyword args on `register_procedure(...)` | `ProcedureOptions` |
| Operation start options | keyword args on `start_operation(...)` | `OperationStartOptions` |
| Operation endpoint options | keyword args on `register_operation(...)` | `OperationOptions` |

`late_policy` is exactly `drop`, `reject` or `execute_immediately` (omitted or
`None`: `execute_immediately`); the timed request carries them as codes 0, 1
and 2. Any other value, including an empty string, a different case or
surrounding spaces, is refused before the request is sent: Python raises
`ValueError` and C++ throws `std::invalid_argument`. A received timed request
whose late-policy code is not 0, 1 or 2 fails to decode and is refused before
the endpoint handler runs; it is never treated as `execute_immediately`.
The C ABI functions `r2kernel_codec_encode_control_request_v2` and
`r2kernel_codec_decode_control_request_v2` return InvalidArgument (-1)
for any other code; the `_v2` decoders also refuse any Control envelope wire
version other than 2. The SDKs pass the validated value to
the endpoint handler (Python `context.late_policy`, C++
`request.timing.late_policy`); applying it to a late request is the handler's
decision.

Endpoint `timing_support` values are `none`, `optional`, and `required`; a
contract with any other value is rejected. A `none` endpoint rejects supplied
timing, `required` rejects missing timing, and `optional` accepts either. Rejected
requests do not invoke the handler.

### Timing Header Helpers

Both SDKs build and parse timing headers for application-level envelopes.
Python uses dictionaries; C++ uses JSON object text with the same shapes and
throws `std::invalid_argument` for malformed input.

| Purpose | Python | C++ |
| --- | --- | --- |
| Build request header | `build_timing_request_header(*, target_subsystem, source_subsystem=None, execute_after_ns=None, ...)` | `build_timing_request_header(target_subsystem, ControlTimingOptions, source_subsystem)` |
| Resolve execution time | `normalize_timing_request_header(header, *, accepted_at_sync_ns=None)` returns `(header, accepted_at_sync_ns)` | `normalize_timing_request_header(header_json, accepted_at_sync_ns)` returns `std::pair` |
| Build response header | `build_timing_response_header(request_header, execution_report, *, status_code, status_message, responded_at_sync_ns=None)` | `build_timing_response_header(request_header_json, execution_report_json, status_code, status_message, responded_at_sync_ns)` |
| Pack request or response | `pack_timing_request(*, request_header, payload_ref, payload)`, `pack_timing_response(*, response_header, payload_ref, payload)` | `pack_timing_request(header_json, payload_ref, payload_json)`, `pack_timing_response(...)` |
| Unpack request or response | `unpack_timing_request(wire)`, `unpack_timing_response(wire)` return `(header, payload_ref, payload)` | `unpack_timing_request(wire_json)`, `unpack_timing_response(wire_json)` return `TimingEnvelope` (`header_json`, `payload_ref`, `payload_json`) |

The source subsystem defaults to this subsystem. `valid_for_ns` is measured
from `generated_at_sync_ns`, or from now when that is unset.

## Resource Broker Client

Managed packages request brokered file descriptors through
`r2kernel.core.ResourceBrokerClient` (Python) or
`r2kernel::core::ResourceBrokerClient` (C++, `r2kernel/core/resource_broker_client.hpp`).
The core `R2KernelClient` of each SDK offers the same `open_*` calls.

| Python | C++ | Purpose | Typical use |
| --- | --- | --- | --- |
| `open_udp_socket(*, interface, bind_host="0.0.0.0", bind_port=0)` | `open_udp_socket(UdpSocketOptions)` | Open an approved UDP socket on a claimed interface | UDP device protocols |
| `open_tcp_socket(*, interface, ..., listen=False, backlog=128)` | `open_tcp_socket(TcpSocketOptions)` | Open an approved TCP socket on a claimed interface | TCP device protocols or managed listeners |
| `open_approved_tcp_stream(*, grant_id)` | `open_approved_tcp_stream(grant_id)` | Receive a connected Unix stream to one root-approved TCP endpoint for this exact app execution | app connections to supervisory services or another robot |
| `open_frontend_tcp_listener(*, kind="api", bind_host=None, bind_port=None, backlog=128)` | `open_frontend_tcp_listener(FrontendTcpListenerOptions)` | Receive a Unix listener behind the broker's declared loopback TCP frontend (`kind` is `api` or `ws`) | package-owned REST or WebSocket backend |
| `open_can_socket(*, interface, receive_own_messages=False, can_fd_frames=False, nonblocking=True)` | `open_can_socket(CanSocketOptions)` | Open an approved CAN socket | CAN or CAN-FD devices |
| `open_device(path, *, read=True, write=True, nonblocking=True)` | `open_device(path, DeviceOpenOptions)` | Open an approved device file | serial, USB, or udev-governed devices |
| `ResourceBrokerClient.inherited_fd(kind, expect)` | `ResourceBrokerClient::inherited_fd(kind, expect)` | Validate and return a brokered socket inherited from the package leader through `R2KERNEL_INHERITED_FDS` | child processes of a package leader |

Python returns `BrokeredSocketResult` (`socket`, a `socket.socket`, and
`metadata`, a dict) or `BrokeredFdResult` (`fd`, `metadata`). C++ returns
`BrokeredSocketResult` (`socket`, a descriptor) or `BrokeredFdResult` (`fd`)
with the broker's result object as `metadata_json` and a close-on-exec
descriptor. The caller owns and closes the returned result. Each request is sent once within one
5-second budget; a refusal or an invalid reply raises (C++ throws
`std::runtime_error`) and closes every received descriptor.

Resource broker access requires `R2KERNEL_RESOURCE_LEASE_ID`, normally set by
`r2kernel launch run` or `r2kernel deploy up`.

Component, compound and app packages must declare
`resources.sandbox.network: brokered`. Only gateways may opt into `advisory`.
Generic NIC, CAN and device socket requests remain subject to their hardware
claims; a component or app frontend grant does not provide those claims.

`open_approved_tcp_stream` requires an enabled root policy and an exact live
app-execution grant. The broker retains the TCP socket and revokes the Unix
stream on expiry, removal or execution termination, including duplicated
descriptors. SDKs verify the root peer, grant/lease metadata, a 32-character
broker `execution_id`, and a connected non-listening Unix stream. There is no
general NIC grant or fallback. See [Approved App Connections](../operate/app-outbound-connections.md)
for configuration, provisioning, renewal and application authentication limits.

The `open_frontend_tcp_listener` method and request names are retained. Its
returned socket is `AF_UNIX`, `SOCK_STREAM` and listening. The broker owns the
actual loopback TCP listener and relays connections to the package. Inspect the
result metadata for the TCP endpoint; do not assume `getsockname()` returns an
IP address and port. The HTTP or WebSocket server must accept an existing Unix
listener. Both the returned listener and accepted connections stay in the Unix
socket family and cannot be reconnected to an IP destination.

When `frontend.context.api` and `frontend.context.ws` share a host and port,
request one listener and serve both paths from it. Separate listeners require
different declared endpoints.

Stop the server before calling `BrokeredSocketResult.close()`. For a frontend
listener, this shuts down the shared Unix listener before closing the local
descriptor. A raw `socket.close()` or `::close(fd)` alone leaves the broker's
duplicate open, so it does not immediately stop the frontend endpoint.
Listener shutdown affects every duplicate, including descriptors passed to
child processes. Lease termination also cleans up its frontend relays.

A brokered UDP or CAN socket is opened on its claimed interface, but its holder
is not confined to that interface: it can name another interface for each send
(UDP `IP_PKTINFO`; CAN also by binding again). See
[Resource Control](../operate/resource-control.md#brokered-network-sandbox).

## Python ↔ C++ Naming Differences

The two SDKs use the same method names. Names and shapes differ only where a
language requires it:

| Concept | Python | C++ | Reason |
| --- | --- | --- | --- |
| Static frame edge | `static` (`set_frame_transform` argument and transform key) | `FrameTransform::is_static` | `static` is a C++ keyword |
| Interface field | `interface` (`BindingReference.interface`, `bound_control_authority()["interface"]`, broker `interface=` arguments) | `interface_name` (`BindingReference::interface_name`, `BoundControlAuthority::interface_name`, `UdpSocketOptions::interface_name`, ...) | `interface` is a platform macro on some C++ toolchains; `ControlSourceAuthority::interface` keeps the Python name |
| Manifest requirements | `SubsystemManifest.requires` | `SubsystemManifest::requirements` | `requires` is a C++ keyword |
| Read-only attributes | properties: `launch_bindings`, `config_data`, `subsystem_manifest`, `deployment_manifest`, `declared_apis`, `declared_components`, `BoundInterface.target` | methods: `launch_bindings()`, `config_data()`, `subsystem_manifest()`, `deployment_manifest()`, `declared_apis()`, `declared_components()`, `BoundInterface::target()` | C++ has no properties |
| Structured values | `dict`, `list` or any JSON-compatible value (`config_*`, `params`, `bind_requirement` result, `lookup_frame_transform`, timing headers, broker `metadata`, the free-form manifest mappings `kinematics`, `parts`, `frontend` and robot slot `metadata`) | JSON text (`*_json` parameters, fields such as `RobotPlatformManifest::kinematics_json`, and `std::string` results) or a struct (`ControlRoute`, `ControlWorkerStatus`, `BoundControlAuthority`, `TimingEnvelope`) | C++ has no dynamic value type in the API |
| Call options | keyword arguments | option structs (`ControlTransactOptions`, `ProcedureCallOptions`, `OperationStartOptions`, `UdpSocketOptions`, ...) | C++ has no keyword arguments |
| Absolute deadline | keyword-only `deadline=`, a `time.monotonic()` float | `std::optional<std::chrono::steady_clock::time_point>`, default `std::nullopt` | language clock types |
| Missing result | `None` | `std::nullopt`, or an empty value | language idiom |
| Event sample | `value` | `EventPayload` (bytes) | C++ publishes encoded bytes |
| Operation start result | the operation ID, or a dict with `return_details=True` | `std::optional<OperationStartResponse>` | C++ returns the full reply |
| Request authority | `Subsystem.current_control_source_authority()`, `current_protocol_host_authority()`, or `context.source_authority` / `context.host_authority` | free functions `r2kernel::wrapper::current_control_source_authority()`, `current_protocol_host_authority()` | C++ request types stay unchanged |
| Clock source | `ClockSource.R2KERNEL_LOGICAL_HW` and the other upper-case members (`r2kernel.core.clock`) | `ClockSource::R2KernelLogicalHw` and the other CamelCase members | language naming convention; values 0 to 5 are identical |
| Core client receive | `R2KernelClient.recv_control(target, type, timeout_ms=0)` | `r2kernel::core::R2KernelClient::recv_control(target, timeout_ms)` (byte-level; `Subsystem::recv_control` takes `type`) | the C++ core client works on bytes |
| Errors | `RuntimeError`, `ValueError`, `TimeoutError`, `ControlRequestError`, `ManifestError` | `std::runtime_error`, `std::invalid_argument`, `std::logic_error`, `ControlRequestError`, `ManifestError` | language exception types |

## Environment Variables

The SDKs read these variables; the launcher (`r2kernel launch run`,
`r2kernel deploy up`) sets the deployment-specific ones. "Both" means the
Python and the C++ SDK.

| Variable | Read by | Default | Meaning |
| --- | --- | --- | --- |
| `R2KERNEL_PREFIX` | Python | the default install prefix ([Installation](../getting-started/installation.md)) | Installed runtime prefix used to find the native core library (C++ links it at build time) |
| `R2KERNEL_CONTROL_SOCKET` | both | `/run/r2kernel/control.sock` | Control backend Unix socket |
| `R2KERNEL_CONTROL_NOTIFY_DIR` | both | directory of the Control socket | Directory of the client's notification endpoint |
| `R2KERNEL_RUNTIME_IPC_GROUP` | both | `r2kernel` for the Control handler socket (applied only when the group exists; blank disables it); unset for notification and Event sockets | Group that owns the SDK's local IPC sockets |
| `R2KERNEL_RUNTIME_IPC_SOCKET_MODE` | both | `0660` | Octal file mode (one to four octal digits; anything else is refused) of the local Control handler socket. Notification and Event sockets are `0660`, or `0666` in `/tmp` without a group |
| `R2KERNEL_SUBSYSTEM_SESSION_ID` | both | generated | Session identity sent at registration |
| `R2KERNEL_SUBSYSTEM_MANIFEST` | both | the default search ([Manifest Discovery](#manifest-discovery)) | Subsystem manifest path when `manifest_path` is not given |
| `R2KERNEL_DEPLOYMENT_MANIFEST` | both | the default search ([Manifest Discovery](#manifest-discovery)) | Deployment manifest path when `deployment_manifest_path` is not given |
| `R2KERNEL_BINDINGS` | both | none | JSON object of launch bindings (requirement to `provider.interface`) |
| `R2KERNEL_STARTUP_RETRY_COUNT` | both | `20` | Registration and Control startup attempts |
| `R2KERNEL_STARTUP_RETRY_DELAY_MS` | both | `100` | Delay between startup attempts |
| `R2KERNEL_STARTUP_REQUEST_TIMEOUT_MS` | both | `2000` | Timeout of one startup Control request |
| `R2KERNEL_CONTROL_REGISTRATION_CHECK_SEC` | both | `5` (minimum 1) | Interval of the Control handler registration check that registers a missing route again |
| `R2KERNEL_CLOCK_STATUS_REFRESH_SEC` | both | `5` (minimum 1) | Interval of the Control clock status refresh |
| `R2KERNEL_EVENT_QUEUE_DEPTH` | both | by payload size: 64 (up to 4 KiB), 16 (up to 64 KiB), else 4 | Event queue depth when a topic does not set one |
| `R2KERNEL_EVENT_STARTUP_BARRIER_MS` | both | value from Control registration, else 0 | Wait before the first Event publication of a topic; overrides Control's value |
| `R2KERNEL_EVENT_CLIENT_QUEUE_MAX_MESSAGES` | native core library (both) | `1024` | Native Event receive-queue message limit (see [Native Event Receive Capacity](#native-event-receive-capacity)) |
| `R2KERNEL_EVENT_CLIENT_QUEUE_MAX_BYTES` | native core library (both) | `67108864` | Native Event receive-queue byte limit |
| `R2KERNEL_CONTROL_RT_MEMORY_BUDGET_BYTES` | both | `67108864` (64 MiB) | Prepared, locked Control memory per client and per process |
| `R2KERNEL_CONTROL_SHM_METRICS` | both | off | `1` prints a Control SHM summary to stderr when the client stops |
| `R2KERNEL_CONTROL_SHM_TIMING_METRICS` | C++ | off | `1` adds response and reclamation durations to that summary |
| `R2KERNEL_CONTROL_COST_METRICS` | Python | off | `1` records bounded Control stage samples and prints them when the client stops |
| `R2KERNEL_CONTROL_COST_METRICS_MAX_SAMPLES` | Python | `256` (1 to 4096) | Sample ring size of the cost metrics |
| `R2KERNEL_RESOURCE_SERVICE_SOCKET` | both | `/run/r2kernel/resourced.sock` | Resource broker socket |
| `R2KERNEL_RESOURCE_SERVICE_MODE` | both | `required` | Manager peer proof: `required`, `auto` or `disabled` (development only) |
| `R2KERNEL_RESOURCE_LEASE_ID` | both | none | Resource lease of a managed package, sent with registration and broker requests |
| `R2KERNEL_INHERITED_FDS` | both | none | Brokered descriptors passed from the package leader (`inherited_socket`) |
| `R2KERNEL_SANDBOX_NETWORK`, `R2KERNEL_SANDBOX_CAN` | both | none | `brokered` enables the sandbox `EPERM` diagnostics (C++: `r2kernel::sandbox_socket_denial`) |
| `R2KERNEL_SPEC_ROOT` | both | packaged specs | Shared message and spec dictionary root |
| `R2KERNEL_SPEC_PATH` | both | none | Additional spec roots (path list) |
| `R2KERNEL_CONTRACT_SPEC_ROOTS` | both | none | Caller-private contract roots excluded when inspecting another package |
| `R2KERNEL_CONTRACT_POLICY` | both | `strict` | Runtime contract metadata check: `strict`, `warn` or `off` |
| `R2KERNEL_LOG_DIR` | Python | `<prefix>/log`, else `~/.r2kernel/log` | Library log directory |
| `R2KERNEL_FORCE_PYTHON` | Python | off | `1` selects the pure-Python Event, topic-buffer and lock implementations instead of the native core (tests and diagnostics) |

In C++, the spec root variables are resolved by the native core library; the
deployment manifest loader also reads them to scope a package's
`contracts.spec_roots`, as the Python SDK does.

## Runtime Notes

- JSON produced by the C++ SDK escapes every control character (U+0000–U+001F).
- C++ frame-transform notifications, and heartbeat status sent through a
  `CoreClient` other than the native `R2KernelClient`, are bounded at 100 ms in
  total per notification (each socket call gets only the time left); a failure
  is logged as a warning. With the native `R2KernelClient`, each heartbeat
  status waits up to 2 s for Control's acknowledgement; a status Control does
  not accept starts the re-registration described below. The Python SDK's
  heartbeat status waits up to 1 s for Control's acknowledgement.
- A running subsystem stays registered across a Control restart. Every
  heartbeat status (Python, and C++ with the native `R2KernelClient`; a
  heartbeat follows 1 s after the previous one finished) must be acknowledged
  by Control. When it is not, because Control is unreachable, has restarted, or
  no longer holds the registration, the subsystem registers again with its
  unchanged session, process ID, resource lease and notify endpoint, publishes
  its full status (manifest, `provides`, `requires`, endpoints), and requests
  its Event publications, Event subscriptions and Control handler again. When
  Control kept a C++ publication's shared-memory slots (the same slot index,
  queue depth and entry slot count), the publisher continues its Event
  generation, so subscribers receive exactly the Events published after the
  re-registration. On a changed allocation the generation starts again at 0.
  The first attempt runs in the heartbeat that found the failure. After a failed
  attempt, the next one is due 1 s, 2 s, and then every 4 s later, and it runs
  in the first heartbeat after that time. Each failed attempt is logged at
  error level, and the subsystem keeps trying while it runs. Control accepts
  the lease only when the resource broker proves that the process is a member
  of it. Self-bindings are not requested again (call `bind_requirement` again,
  for example from `on_start`). If Control serves a different Event
  shared-memory pool than the one the process mapped (Control recreated it, for
  example with `resource_service.mode: disabled`), the subsystem registers again
  but logs that its Event publications and subscriptions cannot be restored
  until the process restarts.
- A lifecycle change (`fault()`, `degrade()`, `pause()`, a transition that
  Control requests, ...) sends one status update. It never waits for a
  re-registration and never starts one. This holds in the Python SDK, and in
  the C++ SDK with the native `R2KernelClient`. The update is left to the next
  heartbeat, which carries the new state when it runs, in two cases, and an
  info line is logged: a heartbeat is running (it may be registering again),
  or the registration is being restored. If Control does not accept the
  update, an error line is logged and the next heartbeat registers again. In
  C++ the update is also left to the next heartbeat while an ordinary heartbeat
  is being sent. In C++, `terminate()` stops the heartbeat after
  its state change. If that lifecycle status was left to the heartbeat, it
  is not sent: Control keeps showing the previous lifecycle state, and reports
  the session as inactive after `control.subsystem_timeout`, until
  `initialize()` starts the heartbeat again, or until the native client
  reports the subsystem down when it is destroyed. The info line about the
  deferred status is still logged. With the native client, the single update
  waits up to 2 s for Control's acknowledgement.
- Control requires the same status and request shape from every client.
  Each status carries `reported_lifecycle`; Control refuses a status without a
  known lifecycle state. The status must carry `codec_metadata` before the
  subsystem sends Control requests or registers Event resources, and a binding
  of a typed contract needs `contract_codecs` on both sides. A local Control
  request names its caller in a source-wrapped topic,
  `__r2kernel_source_v1__:<hex source>:<topic>`; a bare topic is refused. Both
  SDKs build these documents and topics. In C++, the `Subsystem` hands a
  `CoreClient` other than the native `R2KernelClient` the source-wrapped topic
  for `send_control`, `transact_control`, `transact_control_result`,
  `wait_control_reclaimed` and `prepare_control`; such a client must forward
  that topic unchanged.
- `R2KernelClient::keep_registration`, `registration_lost`,
  `reregister_subsystem` and `restore_event_registrations`, and the exception
  `r2kernel::core::EventPoolReplacedError`, are used by the C++ subsystem
  wrapper's heartbeat and lifecycle status; applications do not need to call
  them.
- The Python SDK removes its Control notification socket
  (`r2kernel-notify-<pid>-<id>.sock`) when the process exits normally
  (including an unhandled `KeyboardInterrupt`) and when it is terminated by
  `SIGTERM` while `SIGTERM` has its default action: when the process's first
  client is created in the main thread, the SDK installs a `SIGTERM` handler
  that removes the socket and terminates the process by `SIGTERM` again. A
  `SIGTERM` handler the application installed is left in place. Only the
  process that created a notification socket removes it. A child forked from
  that process (`os.fork`, or `multiprocessing` with the `fork` start method,
  including `Pool` workers) removes none of its parent's sockets when it
  exits, is terminated or closes an inherited client. Such a child also
  leaves its parent's Control connections open: when it exits or closes an
  inherited client it closes only its own copies of their descriptors, and it
  never waits for a lock that another thread of the parent held at the fork.
  The child cannot use the parent's prepared Control lanes; a call on one in
  the child fails, and the child needs its own client. The child also gets
  back the default `SIGTERM` action in place of the SDK's handler. Python runs
  that handler only in the main thread between bytecode instructions. A new
  Python client removes the sockets in its notification directory whose
  process is no longer running and that accept no connection.
- The same exit and `SIGTERM` rules apply to the Python SDK's local Control
  handler socket (`/tmp/r2kernel-control-handler-<name>-<pid>.sock`), which a
  process serving Procedures, Operations or Control creates; the SDK's
  `SIGTERM` handler is installed by the first such socket or client set up in
  the main thread. The start-up sweep of ended processes' sockets covers
  notification sockets only. As with notification sockets, only the process
  that created the handler socket removes it: a forked child that stops or
  closes an inherited client leaves the parent's handler socket in place.
- C++: a child created with `fork()` must not use or destroy the parent's
  `R2KernelClient` or `Subsystem` (return through their scope, or `exit()`
  with them as static objects). Their destructors shut down the parent's
  Control connections and join threads that do not exist in the child. Call an
  `exec` function or `_exit()` in the child.
- An SDK client that is killed leaves its notification socket next to the
  Control socket. At start, Control removes those of its
  own user, and the resource broker (`r2kernel-resourced`) removes those of
  every client identity it serves (the allowed users, the root launch user,
  Control's user and root); each removes a socket only when its process no
  longer exists, a connection to it is refused and it is still the same socket
  just before removal, and neither follows symbolic links.
- The C++ SDK library does not load yaml-cpp dynamically; release verification
  rejects such a dependency.
- `EventTransport.apply_state` rejects a non-empty `remote_subscriptions`; a peer's
  subscriptions arrive only as that peer's own requests. `should_connect: false`
  means accept-only. When an output buffer is too small, the call reports the
  required size. Send-only users keep calling `recv_event(peer, timeout_ms=0)`
  for every connected peer; `timeout_ms=0` does not wait on the network, but in
  the Python `EventTransport` it takes the transport lock, so it can wait behind
  a concurrent `flush_n` (at most about twice `io_timeout_ms`) or a concurrent
  blocking `recv_event` (up to that call's wait). One such call applies at
  most 64 setup frames and returns `None` (C: NotFound, -2) when no Event is
  available; the next call continues.
- `EventTransport.accept_peer(timeout_ms=None|0|n)` and `apply_state` wait on
  the network without the transport lock; `recv_event(timeout_ms=0)`,
  `enqueue_event` and `flush_n` in other threads never wait behind a silent
  client or a slow connect.
- A signal handled while `recv_event`, `recv_event(timeout_ms>0)`,
  `accept_peer` or `apply_state` waits on the network (for example a Python
  `signal.signal` handler, SIGCHLD or SIGALRM) does not fail the call or close
  the session: the wait continues with the time left. In Python this applies
  to Ctrl+C as well: a `KeyboardInterrupt` during such a wait is raised only
  after the wait returns, at the latest when its timeout (`io_timeout_ms` for
  `timeout_ms=None`) has passed.
- Federation transport `recv_event`, `accept_peer` and `apply_state` retain a
  non-empty item when an output buffer is null or too small: `BufferTooSmall`
  reports every required length. Retained Events are per peer. When an
  `apply_state` report does not fit, its connected/disconnected transitions are
  reported ahead of the next apply's own transitions.
- Local C ABI `r2kernel_event_client_recv`/`_recv_ex` treat a null field buffer
  as an explicit skip of that field, not a non-consuming size query. A successful
  receive can therefore consume the Event. A non-null too-small buffer instead
  returns `BufferTooSmall` with all required lengths and retains the front item.
- Federation send expiry or sending to a closed peer returns SystemError (-3),
  not NotFound (-2), and closes the affected session. Sends do not raise SIGPIPE;
  C/C++ hosts need not ignore SIGPIPE to use these APIs.
- When two hosts dial each other at once, `accept_peer` returns `None` for the
  losing connection (C: `R2KERNEL_EVENT_TRANSPORT_ALREADY_CONNECTED`).
- A local Event whose topic, publisher or payload exceeds the receive buffer is
  received again once with the lengths Core reports; with a Core that does not
  report them, the drop is logged as an explicit error.
- The C++ SDK keeps the larger payload buffer for later Events; an oversized
  topic or publisher name is received again each time into a reused buffer.
- An Event inline endpoint longer than the Unix socket path limit disables
  inline delivery at registration with an explicit error.
- If the C++ SDK cannot verify the Control peer of the Event inline connection
  during `publish()`, it disables inline delivery for that registration and logs
  once `Event inline delivery disabled for endpoint <endpoint> until the
  subsystem registers again: publish on topic <topic> failed: <reason>; Events
  are delivered through the lock notification instead`. That `publish()` and
  every later one still succeed through the lock notification and do not retry
  the peer verification.
- Python SDK: a native Event subscription that cannot be established (refused,
  no notification lock, or a native error) is logged at error level and the
  client stays in its native mode. If the native Event client cannot be created
  at registration, the SDK logs an error and the client publishes and receives
  Events in its Python mode from then on; check
  the log for `Native Event client creation failed`. After
  `stop_event_transport()` (or the client's `stop()`), starting the Event
  transport again raises `RuntimeError`; create a new subsystem client to
  receive Events again.

## Python Logger Lifetime

`Logger.close()` drains pending messages, stops its listener and closes its
destinations. It detaches only the handlers owned by that wrapper; a live logger
wrapper with the same name keeps its own resources. Repeated closure is safe.
A closed wrapper does not emit or enqueue additional messages; create a new
wrapper when logging must resume.

The versioned public SDK packages, generated API reference, and installed C++
headers are the source of truth for exact signatures. This page records the
supported surface and its intended use.

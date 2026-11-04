# Subsystem SDK API Guide

The subsystem SDK API is the subsystem-author API for Python and C++.

Use this page when writing code that subclasses or wraps a R2Kernel subsystem. Do
not use this API from browser clients or outside-runtime tools; those clients
should use the [Host Control REST API](host-control-rest-api.md) or [Host Control
WebSocket API](host-control-websocket-api.md).

This page explains the subsystem-author flow. For the table-oriented public
class and method catalog, see [Subsystem SDK Reference](../reference/subsystem-sdk-reference.md).

## Scope

The SDK API owns the following.

- subsystem construction and lifecycle hooks
- Event publish/subscribe registration and publishing
- Control endpoint registration and Control calls
- Procedure registration/calls
- Operation registration/start/cancel/query
- typed payload refs and endpoint timing policy

API Contract, component, and message definitions live under [Spec](../spec/spec-overview.md).
This page shows how subsystem code uses those contracts.

## Construction

Use the role-specific subclass that matches `subsystem.role` in
`subsystem.yaml`.

| Role | Python/C++ subclass |
| --- | --- |
| `gateway` | `GatewaySubsystem` |
| `component` | `ComponentSubsystem` |
| `compound` | `CompoundSubsystem` |
| `app` | `AppSubsystem` |

`Subsystem` remains the common base class. In Python, the role-specific classes
check the loaded manifest role during construction.

Python example.

```python
ComponentSubsystem(
    name="controller",
    log_level="INFO",
    user_data_path="./userdata",
    manifest_path="./subsystem.yaml",
    deployment_manifest_path="./r2kernel.deployment.yaml",
    heartbeat_port=40000,
)
```

C++ example.

```cpp
r2kernel::wrapper::SubsystemOptions options;
options.name = "controller";
options.log_level = "INFO";
options.user_data_path = "./userdata";
options.manifest_path = "./subsystem.yaml";
options.deployment_manifest_path = "./r2kernel.deployment.yaml";
options.heartbeat_port = 40000;

MyComponentSubsystem subsystem(std::move(options));
```

The deployment manifest path is optional. Without it, both SDKs read
`R2KERNEL_DEPLOYMENT_MANIFEST`, then look for `r2kernel.deployment.yaml` next to
the subsystem manifest, in its parent directory and in the working directory
([Manifest Discovery](../reference/subsystem-sdk-reference.md#manifest-discovery)
gives the full order). Both SDKs validate the subsystem and deployment
manifests with the same rules and messages, including robot slots, application
profiles, Control binding groups and the spatial topology.

When a subsystem is started with `r2kernel launch run` or `r2kernel deploy up`, the
package launcher also sets `R2KERNEL_SUBSYSTEM_MANIFEST` and `R2KERNEL_BINDINGS`.
Both SDKs report the same `manifest`, `interfaces`, and `bindings` status shape
and expose the loaded manifests (`subsystem_manifest`, `deployment_manifest`)
and the binding queries (`resolve_binding`, `binding_target`,
`runtime_bindings`, ...) listed in the
[SDK reference](../reference/subsystem-sdk-reference.md#binding-and-configuration-methods).

## Lifecycle

A subsystem implements required startup hooks and may implement runtime
lifecycle hooks. Runtime lifecycle commands are requests; user code does not set
the subsystem state directly.

Python example.

```python
from r2kernel.wrapper import ComponentSubsystem


class MySubsystem(ComponentSubsystem):
    def on_initialize(self) -> bool:
        return True

    def on_start(self) -> bool:
        return True

    def on_terminate(self) -> bool:
        return True

    def on_reset(self) -> bool:
        return True

    def on_pause(self) -> bool:
        return True

    def on_resume(self) -> bool:
        return True

    def on_fault(self, reason: str | None = None) -> bool:
        return True
```

C++ example.

```cpp
class MySubsystem final : public r2kernel::wrapper::ComponentSubsystem {
protected:
    bool on_initialize() override { return true; }
    bool on_start() override { return true; }
    bool on_terminate() override { return true; }
    bool on_reset() override { return true; }
    bool on_pause() override { return true; }
    bool on_resume() override { return true; }
    bool on_fault(const std::string& reason) override {
        (void)reason;
        return true;
    }
};
```

`on_initialize()` is the declaration gate. Register every manifest-declared
Event, Control, Procedure, and Operation endpoint before this hook returns. The
SDK validates those declarations before moving to `Ready`; under the default
`strict` policy, a missing or mismatched endpoint fails initialization. The
SDK does not silently turn strict errors into warnings. A C++ raw Control
handler passed to `start_control_server(handler)` must also be installed during
`on_initialize()`. Registering an endpoint from `on_start()` is too late for
this validation. The same gate requires type metadata on every registered
Control endpoint, Procedure, and Operation, internal ones included; register
an untyped private endpoint with `bytes` types (the
[SDK reference](../reference/subsystem-sdk-reference.md) states the rule).

After initialization succeeds, `Ready` means declaration validation succeeded;
it does not mean the subsystem is `Operating`. A stop or reset after failed
initialization does not substitute for a successful initialization. A
registered handler may receive a request before the subsystem enters
`Operating`, and the SDK does not gate handler dispatch by lifecycle state. The
Component or Gateway implementing that handler must check its own state and
safely reject commands that are not valid yet. Handler registration does not
itself authorize actuation.

Canonical subsystem lifecycle states are documented in
[Subsystem Lifecycle](../architecture/subsystem-lifecycle.md). The common
operator commands are these.

```bash
r2kernel subsystem pause <subsystem>
r2kernel subsystem resume <subsystem>
r2kernel subsystem reset <subsystem>
r2kernel subsystem fault <subsystem> --reason "fault text"
```

## Event API

For Event methods, `topic` means the Event channel key.

Python methods.

- `register_event_publish(...)`
- `register_event_subscribe(...)`
- `publish_event(...)`
- `start_event_transport()`
- `stop_event_transport()`

C++ methods use the same operations with `EventPublishSpec`, `EventSubscribeSpec`, and `EventPayload`.
`publish_event` takes no priority in either SDK: a sample is published with the
priority registered for its topic.

`register_event_publish` accepts an optional Event `queue_depth` in Python, and
`EventPublishSpec::queue_depth` in C++. A value of `0` or omission selects the
release default. Set it explicitly for reproducible Event streaming or telemetry
workloads where short bursts must be absorbed before samples are dropped.

For the method catalog, see [Subsystem SDK Reference](../reference/subsystem-sdk-reference.md#event-methods).

## Control API

Control can be raw, typed, or typed/timed. Use the `control` method names in
subsystem code. Low-level wire protocol details are reserved for internal
protocol documentation.

Only Gateway and Component subsystems may expose or call Control endpoints.
App and Compound subsystems use Event, Procedure, and Operation interfaces;
an App reaches a Gateway only through a Component, directly or through a
Compound export. The examples below are for Component implementations.

The public SDK argument is named `topic`. For Control calls, treat this value as
the Control endpoint key, not as an Event channel.

Python example.

```python
target = self.binding_target("gateway")
response = self.transact_control(
    target=target,
    topic="timed.request",
    type="bytes",
    value={"value": 1},
    request_type="msg.core.common.primitive.v1/Int32Value",
    response_type="msg.core.common.primitive.v1/Int32Value",
    timing={"execute_after_ns": 500_000},
    period_ms=0.0,
    deadline_ms=1000.0,
)
```

For the method catalog, see [Subsystem SDK Reference](../reference/subsystem-sdk-reference.md#control-methods).

C++ example.

```cpp
r2kernel::wrapper::ControlTransactOptions options;
options.request_type = "msg.core.common.primitive.v1/Int32Value";
options.response_type = "msg.core.common.primitive.v1/Int32Value";
options.timing = r2kernel::wrapper::ControlTimingOptions{};
options.timing->execute_after_ns = 500'000;

const auto response = transact_bound_control(
    "gateway",
    "timed.request",
    "{\"value\":1}",
    options
);
```

`transact_bound_control` resolves the `gateway` requirement and calls its
target within one invocation budget; `transact_control(binding_target("gateway"), ...)`
is the two-step form.

### Provider-ready preparation

After the provider has started and the binding is live, prepare each periodic
`(target, topic)` lane with an independent cold budget:

```python
target = self.binding_target("gateway")
self.prepare_control(
    target, "timed.request",
    request_capacity=4096,
    response_capacity=4096,
    timeout_ms=1000,
    result_ready=True,
)
```

```cpp
const auto target = binding_target("gateway");
prepare_control(target, "timed.request", 4096, 4096, 1000, true);
```

Capacities bound encoded payload bytes, including typed and Control envelopes.
Successful preparation establishes provider and caller readiness for that lane
and both declared capacities, without invoking the application callback.
A route handshake (`handshake_control`) checks registration/routing only and
is not preparation. `result_ready=True` also prepares response-ready use.

Prepared transacts retain the negotiated readiness and capacity contract without
cold transport setup or capacity growth. Both declared byte capacities are
enforced. Ordinary unprepared exchange remains supported.
Binding/route invalidation and failed preparation are explicit errors, not silent
cold fallback. Explicit re-preparation replaces only an idle lane with a fresh
one; it cannot discard an in-flight call, pending reclamation or retained error.
A deadline miss that expires before anything reaches Control fails only that
exchange and keeps the prepared lane. A late exchange after publication, or a
connection Control closed or reset (end of stream before a frame, or a send
that fails with EPIPE or a receive that fails with ECONNRESET), fails that
exchange without replay and re-prepares
the same lane within its preparation timeout; route, codec, binding, protocol
and capacity failures, and a transaction failure that Control reports in its
reply (it then closes the connection), are not re-prepared automatically.
Production caller deadlines include route and codec work and propagate remaining
time through manager proof and exchange; late successful response decoding is
reported as a deadline failure. The response still has its existing owned payload
and consumption/release lifetime contract.
Route resolution for preparation and production transacts uses a single request
under that same absolute deadline, including proof and response parsing. It does
not add independent one-second waits or retries. Standalone target resolution
without a strict invocation deadline retains its existing behavior.

To choose the actual provider data-worker profile, call
`configure_control_worker(policy, priority, cpus)` before starting/admitting lanes,
in either SDK. Policies are `OTHER`, `FIFO` and `RR`. Scheduling/affinity setup is checked before
preparation succeeds; a setup mismatch fails preparation.
`control_worker_status()` supplies cold diagnostics (`tid`,
numeric OS `policy`, `priority`, `cpus`, `ready`, `error`, `phase`). Its readiness is
profile readiness only, not the preparation readiness boundary. The deployment
must supply scheduling permissions and a sufficient memory-lock limit; this API
does not alter global host settings.

For typed Procedure and Operation callers, both SDKs expose
`prepare_procedure(target, procedure, request_capacity, response_capacity, ...)`
and `prepare_operation(target, operation, request_capacity, response_capacity, ...)`.
These select the existing typed runtime topics; `typed=False` selects the untyped
call/start envelope lane. Reserved Procedure/Operation transport lanes
can be prepared by their permitted caller roles; arbitrary Control endpoints
still require a Gateway/Component caller.


### Binding Own Requirements

A registered App or Component subsystem may bind its own declared requirement
to a local provider when Control runs with `control.self_binding.mode: local`
(the default). Python uses `bind_requirement(requirement, target, *, deadline=...)`
and `unbind_requirement(requirement, *, deadline=...)` (`deadline` is
keyword-only, an absolute `time.monotonic()` value); C++ uses
`Subsystem::bind_requirement(requirement, target, deadline)` and
`unbind_requirement(requirement, deadline)` with an optional absolute
`std::chrono::steady_clock::time_point`. Without a deadline each socket
operation is bounded by 1 s. Python returns the installed binding row as a
dict, C++ as JSON text; `unbind_requirement` returns whether a self-bound row
was removed. The target is
`"<provider_subsystem>.<interface>"`. In Python, expiry raises the built-in
`TimeoutError` on every supported Python version, and `ControlRequestError` is
importable from `r2kernel.core` (C++ `r2kernel::wrapper::ControlRequestError`,
with the reason code in `reason()`). A blank requirement or target raises
`ValueError` (C++ `std::invalid_argument`) before any request. C++ throws
`std::logic_error` before `initialize()`; a success reply without `res: ok`
throws `std::runtime_error`.

```python
self.bind_requirement("odometry", "component.mobile.mobile_base")
```

Control accepts a self-binding only under these rules:

- the request comes from the subsystem's own authenticated registration, and,
  with `control.self_binding.require_managed_lease: true` (the default), from a
  process the resource service proves is a member of a managed lease
- the target is a local provider
- it never replaces an operator binding, an explicit unbind, or a live launch
  binding intent (an intent whose lease is still carried by a current
  registration)
- it is refused for a Gateway target, or a target whose API contract requires an
  exclusive binding, that another source has already bound
- it is removed when the source registration ends or re-registers; an operator
  binding takes precedence and displaces an exclusive self-binding; an applied
  launch binding intent displaces an exclusive self-binding, as an operator
  binding does

Compound and Gateway subsystems cannot self-bind; their requirements need an
operator binding. With `resource_service.mode: disabled`, self-binding requires
`control.self_binding.require_managed_lease: false`.

Each call sends one request, and the SDK never re-requests a self-binding after
re-registration; call `bind_requirement` again, for example from `on_start`. A
refusal raises the SDK's control request error carrying the backend `reason`
code and message verbatim (`"<reason>: <error>"`), for example
`self_binding_operator_owned` or `self_binding_target_held`. If the provider's
API contract is not found in Control's spec roots, the refusal is
`self_binding_target_authority_unknown`. While a package install, replace or
uninstall is in progress or awaits recovery, every self-binding to a provider
with an `api.*` contract is refused with `self_binding_target_authority_unknown`,
also when the contract comes from Control's own spec roots; retry after the
package operation completes.

Bindings are a registry and routing contract. Local Control access is bounded by
caller authentication and the runtime IPC group, not by bindings.

## Procedure API

Basic procedure calls remain available. Typed/timed calls add request and
response message refs.

A C++ typed Procedure handler failure is a failed call even without timing
metadata. Diagnostic bytes are not a successful typed result. A timeout or
failure does not prove the handler had no effect and does not authorize replay.

Python example.

```python
response = self.call_bound_procedure(
    binding="io_gateway",
    procedure="set_output",
    params={"index": 1, "value": True},
    request_type="msg.core.common.primitive.v1/IndexedBoolValue",
    response_type="msg.core.common.primitive.v1/BoolValue",
    timing={"execute_after_ns": 500_000},
)
```

C++ example.

```cpp
r2kernel::wrapper::ProcedureCallOptions options;
options.request_type = "msg.core.common.primitive.v1/IndexedBoolValue";
options.response_type = "msg.core.common.primitive.v1/BoolValue";
options.timing = r2kernel::wrapper::ControlTimingOptions{};
options.timing->execute_after_ns = 500'000;

auto response = call_bound_procedure(
    "io_gateway",
    "set_output",
    "{\"index\":1,\"value\":true}",
    options
);
```

For the method catalog, see [Subsystem SDK Reference](../reference/subsystem-sdk-reference.md#procedure-methods).

## Operation API

Operation uses the control exchange path for start/cancel/query and Event for
state/feedback/result.

Python example.

```python
operation = self.start_bound_operation(
    binding="arm",
    operation="move_j",
    params={"positions": [0.0, 0.1, 0.2]},
    request_type="msg.motion.articulated.v1/JointWayPoint",
    timing={"execute_after_ns": 1_000_000},
)
```

C++ example.

```cpp
r2kernel::wrapper::OperationStartOptions options;
options.request_type = "msg.motion.articulated.v1/JointWayPoint";
options.timing = r2kernel::wrapper::ControlTimingOptions{};
options.timing->execute_after_ns = 1'000'000;

auto response = start_bound_operation("arm", "move_j", "{...}", options);
```

For the method catalog and C++ shutdown requirements, including the lifetime of
handler captures, see [Subsystem SDK Reference](../reference/subsystem-sdk-reference.md#operation-methods).

## Endpoint Timing Policy

Endpoint registration accepts the following.

- `timing_support = "none"`
- `timing_support = "optional"`
- `timing_support = "required"`

This applies to Control endpoints, Procedures, and Operations.
A `none` endpoint rejects a request with timing, `required` rejects one without
timing, and `optional` permits either. Rejection happens before the handler;
invalid policy names do not silently select a default.

For the option fields used by Python and C++, see
[Subsystem SDK Reference](../reference/subsystem-sdk-reference.md#timing-and-option-types).

## Spatial Frame API

Spatial ports are declared in `subsystem.yaml`. SDK methods report the dynamic
relationships owned by the implementation; they do not create Event endpoints.

Python.

```python
self.set_frame_transform(
    parent_frame="odom",
    child_frame="base_link",
    translation=(x, y, z),
    rotation_xyzw=(qx, qy, qz, qw),
    observed_at_sync_ns=self.now_ns(),
    stale_after_ms=500,
)

result = self.lookup_frame_transform(
    "component.mobile/odom",
    "component.arm/tool0",
)
```

Use `clear_frame_transform(child_frame)` when this subsystem no longer owns a
valid edge. `frame_transforms()` returns the current local snapshot.

C++ uses `FrameTransform`, `Subsystem::set_frame_transform()`,
`Subsystem::clear_frame_transform()`, `Subsystem::frame_transforms()` and
`Subsystem::lookup_frame_transform(source_frame, target_frame)`, which returns
Control's reply as JSON text. Host code can perform lookup through
`r2kernel frame lookup` or Host Control REST.

Dynamic updates use a lightweight control-backend command. Heartbeats carry the
complete snapshot for recovery. `stale_after_ms` is required for dynamic edges;
static edges (Python `static=True`, C++ `FrameTransform::is_static = true`) do
not expire.

See [Spatial Model And Frame Graph](../concepts/spatial-model.md).

## Managed Resource Handles

Packages launched through R2Kernel receive `R2KERNEL_RESOURCE_LEASE_ID` and can ask
the host resource service for approved handles. Hardware-facing code uses the
public helpers such as `open_udp_socket`, `open_tcp_socket`,
`open_can_socket`, and `open_device`.

Managed package frontend backends use a narrower helper. If `package.yaml` declares
`frontend.context.api` or `frontend.context.ws`, launch resolves that context
into a loopback listener grant. The broker keeps the TCP listener and returns
an `AF_UNIX` listener to the package. It relays each accepted TCP connection to
that Unix listener, so the package never receives a reusable IP descriptor.

```python
from r2kernel.core import ResourceBrokerClient

api_listener = ResourceBrokerClient().open_frontend_tcp_listener(kind="api")
# Give api_listener.socket to the HTTP/WebSocket server implementation.
```

If `frontend.context.api` and `frontend.context.ws` resolve to the same host and
port, request one listener and let the backend serve both HTTP and WebSocket
paths. Do not request a second listener for that endpoint. Use `kind="ws"`
for a WebSocket-only backend; request separate `api` and `ws` listeners only
when their declared endpoints use different addresses or ports.

C++ packages use `r2kernel::core::ResourceBrokerClient` from
`r2kernel/core/resource_broker_client.hpp` with option structs:

```cpp
r2kernel::core::FrontendTcpListenerOptions api;
api.kind = "api";
auto listener = r2kernel::core::ResourceBrokerClient().open_frontend_tcp_listener(api);
// listener.socket is an AF_UNIX listening descriptor; listener.close() closes it.
```

The browser still connects to the control backend same-origin proxy. The package
backend accepts connections from the returned Unix listener. Its server must
support an existing listener and Unix peer addresses. Read the TCP endpoint
from the broker metadata rather than unpacking `getsockname()` as an IP/port
pair. The package must not bind a separate frontend TCP port directly.

After stopping the frontend server, call the returned result's `close()` method
(`api_listener.close()` in Python or `listener.close()` in C++). It shuts down
the Unix listener before closing its descriptor, allowing the broker to stop
the TCP endpoint and relays. Closing only the raw descriptor does not notify
the broker immediately because the broker retains a duplicate. Ending the
lease also closes its listeners and relays.

For resource helper methods, see
[Subsystem SDK Reference](../reference/subsystem-sdk-reference.md#resource-broker-client).

### Brokered Sockets In Child Processes

By default only the package leader receives brokered descriptors. A leader can
pass a brokered socket to its own child process and name it in the child's
`R2KERNEL_INHERITED_FDS` environment value.

```python
import os
import subprocess

from r2kernel.core import ResourceBrokerClient
from r2kernel.core.resource import INHERITED_FDS_ENV, encode_inherited_fds

opened = ResourceBrokerClient().open_frontend_tcp_listener(kind="api")
fd = opened.socket.fileno()
env = {**os.environ, INHERITED_FDS_ENV: encode_inherited_fds({"frontend.api": fd})}
worker = subprocess.Popen(["python3", "worker.py"], env=env, pass_fds=(fd,))
try:
    worker.wait()
finally:
    opened.close()
```

The child obtains and validates the descriptor with
`inherited_socket(kind, expect)` (also `ResourceBrokerClient.inherited_fd`), where
`expect` gives `family` (`unix`, `inet`, `inet6`, `can`), `type` (`stream`, `dgram`,
`raw`), `listening` and optionally `port`. It checks the environment value, that
the descriptor is a socket, and its family, type, listening state and bound
port, in that order. A mismatch raises `InheritedFdError` naming the failed step
and leaves the descriptor unchanged; there is no fallback to a broker request.
On success the descriptor gets `FD_CLOEXEC`. The C++ SDK provides
`r2kernel::encode_inherited_fds` and `r2kernel::inherited_socket` with the same
checks in `r2kernel/core/inherited_fds.hpp`.

For a frontend listener, use `family: unix`, `type: stream`, and
`listening: true`; do not request an IP `port` check for a Unix descriptor.
C++ names this family `r2kernel::InheritedSocketFamily::unix_socket`.
Keep the listener active while its child serves requests. Shutting it down
affects every duplicate, including the child's descriptor.

A package can instead let every process of its lease scope request brokered
network and CAN sockets directly with `resources.sandbox.fd_delegation: lease_scope`; see
[Resource Control](../operate/resource-control.md#passing-brokered-sockets-to-child-processes).

### Sandbox And Start Diagnostics

Under `resources.sandbox.network: brokered`, the launcher sets
`R2KERNEL_SANDBOX_NETWORK=brokered` (and `R2KERNEL_SANDBOX_CAN=brokered` for
CAN). When a Python lifecycle hook fails with an `EPERM` raised by creating a
socket (`socket.socket`) and the process is actually denied, the SDK logs which socket families are denied and the alternatives: a
brokered socket or the leader pass-through pattern above. The C++ SDK opens only
Unix-domain sockets itself; `r2kernel::sandbox_socket_denial` formats the same
diagnostic for application error paths. An `EPERM` from any other call is not
explained this way.

A lifecycle hook that returns false without raising is logged as
`<phase> failed: <phase> hook returned false (no exception)` (Python capitalizes
the first word and writes `False`), followed by the last warning or error that
hook's own thread logged while it ran, if any. A refused transition (pause,
resume, stop, fault, degrade, reset) is logged as
`Lifecycle transition <name> was not applied` with the same suffix (C++:
`; last logged problem: <tag>: <message>`).

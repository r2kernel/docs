# Differentiators

R2Kernel is not positioned as a ROS 2 replacement, a new message bus, or a
general-purpose robotics package ecosystem.

Its differentiator is the product-runtime boundary around a software-defined
robot composition. R2Kernel defines who contributes which part of the robot, which
contracts they must expose, how those parts are bound, and how the runtime may
launch, observe, route, and admit them.

That boundary is built from three ideas.

- role-bounded subsystems: gateway, component, compound, app, and deployment
  each define a different contribution boundary
- runtime authority: binding, routing, managed launch, resource admission,
  federation, and timing state are owned by the R2Kernel runtime
- implementation freedom: ROS 2 graphs, vendor SDKs, custom processes, and
  native R2Kernel code can all sit behind the same subsystem boundary

## Not A ROS 2 Replacement

ROS 2 remains useful as a node graph, integration ecosystem, middleware
abstraction, and package ecosystem. A R2Kernel robot can keep ROS 2 inside a
gateway, component, simulator interface, or app subsystem when that is the right
implementation choice.

The difference is the boundary exposed to the rest of the product. R2Kernel asks a
ROS 2 graph, vendor controller, custom process, or native R2Kernel subsystem to
present the same runtime-facing shape.

```text
implementation detail -> R2Kernel subsystem boundary -> robot composition
```

The subsystem boundary is where role, spec contracts, lifecycle, binding,
managed launch, and resource policy become visible to the runtime.

## Role-Bounded Subsystems

A ROS 2 node is intentionally flexible. It can represent a small algorithm, a
driver, a composed process, or a larger graph boundary depending on the project.
That flexibility is useful inside an implementation.

R2Kernel uses a more constrained runtime-facing unit. A subsystem is expected to
declare a role.

| Role | Runtime-facing scope |
| --- | --- |
| `gateway` | owns hardware or simulator-backed device access |
| `component` | implements reusable robotics control functions |
| `compound` | declares physical and spatial composition between components |
| `app` | expresses task behavior against platform capabilities |

This does not mean every implementation must be small. A ROS 2 graph can be one
R2Kernel subsystem when that graph has one clear product role. The important
point is that the rest of the robot sees the role-bounded subsystem boundary,
not the internal graph shape.

## Contribution Boundaries

R2Kernel is designed for a robot that cannot be built by one contributor alone.
Different people or companies can own different layers while the deployed robot
still has one runtime model.

| Contributor boundary | What it owns | What it should expose |
| --- | --- | --- |
| Gateway provider | hardware or simulator-backed device access | device-facing `api.*` contracts |
| Component provider | reusable robotics control function | `component.*` contracts backed by public `api.*` surfaces |
| Compound provider | platform-level physical and spatial composition | spatial ports and static mounts |
| App provider | task behavior and user value | requirements on exported `api.*` contracts |
| Deployment owner | concrete packages, hosts, instances, resources, and bindings | a deployable robot composition |

This is the main distinction. R2Kernel does not only describe that processes talk
to each other. It defines what a contributor is allowed to claim, what the next
layer can rely on, and where replacement is supposed to happen.

## Runtime Unit, Not Lifecycle Alone

The primary unit is the **Subsystem**, a declared unit of robotic capability
with lifecycle state, communication surfaces, timing expectations, and resource
needs. That gives the runtime enough structure to validate, launch, observe,
route, and admit the subsystem.

This is closer to a kernel-visible runtime unit than to a plain executable.
The runtime can track these dimensions separately.

| Dimension | Examples |
| --- | --- |
| Identity | subsystem name, role, manifest, declared interfaces |
| Lifecycle | ready, operating, paused, stopped, faulted, degraded |
| Binding | waiting binding, waiting target, bound |
| Ownership | managed package, unmanaged direct run, managed package instance |
| Resource admission | CPU, NIC, link-layer packet, CAN, serial, device, frontend listener |
| Routing | local route, federated route, WebSocket facade route |

ROS 2 has managed lifecycle nodes. R2Kernel should not claim that lifecycle does
not exist elsewhere. Lifecycle is a supporting dimension, not the main
competitive claim.

The R2Kernel distinction is that the runtime interprets subsystem state together
with role, binding, resource admission, route visibility, managed process
ownership, and federation. That makes the subsystem the minimum robot-runtime
unit that the kernel can reason about.

## Runtime-Owned Routing

R2Kernel does not hide transport, but transport is not the application model.
User code addresses subsystem capability names. The runtime resolves where the
target lives, whether delivery is local or federated, and which controlled path
should carry the request.

That keeps network policy out of ordinary subsystem code.

- Event is used for time-stamped publish/subscribe data.
- Control is used for periodic request/response exchange with period and
  deadline intent.
- Procedure is used for bounded synchronous request/response.
- Operation is used for asynchronous execution with progress, result, query,
  and cancellation.

This separation is the important point. R2Kernel is not trying to expose every
transport knob to every subsystem. It is trying to keep the semantic contract
stable while the runtime owns the transport realization.

## Managed Execution

Launch is not only a convenience command in R2Kernel. A managed package declares
the subsystem entrypoint, runtime arguments, environment, static package
frontend, and requested resources.

Before the process starts, the launcher can ask the resource service for a
lease. The resource service can track CPU core, NIC, CAN, serial, and device
node claims, and broker accepted handles when the resource type supports that
model.

This makes launch part of product behavior. A development shell can still run
unmanaged code, but product deployments can require managed launch to make
resource ownership visible and enforceable.

## Resource Authority And Time Federation

Resource authority is a stronger differentiator than lifecycle by itself. A
managed R2Kernel subsystem can declare and receive runtime admission for host
resources before it depends on them.

- CPU placement and scheduling policy
- NIC claims
- link-layer raw packet claims for EtherCAT-class gateways
- CAN, serial, and device-node handles
- frontend listener grants for component and app UI backends

The same principle applies to multi-host timing. R2Kernel does not assume that a
distributed robot has one magic global clock. Each host keeps its own local
clock, while the runtime tracks whether host time sync is acceptable for
cross-host interpretation.

This makes resource and timing state visible at the product runtime boundary,
instead of leaving every subsystem or launch convention to make those decisions
privately.

## Design Center Comparison

This comparison is about design center, not a claim that one system replaces
the other.

| Concern | ROS 2 graph ecosystem | R2Kernel runtime boundary |
| --- | --- | --- |
| Main modeling unit | node graph with topics, services, actions, parameters, and middleware selection | robot composition made from platform, application, deployment, and declared subsystems |
| Unit granularity | nodes can be fine-grained, composed, or used as larger project-defined boundaries | subsystems are role-bounded as gateway, component, compound, or app |
| Contribution boundary | usually expressed by packages, launch files, conventions, and project architecture | expressed by roles, public specs, binding, and deployment validation |
| Runtime unit | node or composed node process | subsystem with role, contracts, binding state, resource claims, route state, lifecycle, and ownership |
| Hardware boundary | commonly project-specific through drivers and packages | gateway role owns device access and exposes device-facing API contracts |
| App boundary | commonly part of the graph or package architecture | app consumes platform capabilities and avoids direct hardware or controller wiring |
| Resource boundary | commonly handled by OS policy, launch conventions, driver packages, or project-specific deployment practice | runtime resource admission for managed subsystem packages |
| Launch boundary | launch descriptions and runtime processes | managed packages, instances, resource leases, frontend grants, and process actions |
| Multi-host boundary | middleware and deployment configuration | control-owned federation, route metadata, and visible time-sync acceptance between host runtimes |

ROS 2 can be inside the implementation column of a R2Kernel subsystem. R2Kernel is
the product-runtime layer that decides how that subsystem participates in the
robot.

## Federation Boundary

Some systems treat remote deployment as a later transport extension. R2Kernel
treats federation as a runtime boundary from the start.

Subsystems do not open direct cross-host sockets to each other as the normal
model. Each host runs a R2Kernel runtime, and the runtimes federate. Local
subsystems keep using their declared surfaces while the runtime owns cross-host
route metadata and delivery.

This matters when a robot grows across these boundaries.

- one host to multiple hosts
- one subsystem provider to multiple coordinated robot elements
- one local process set to a distributed runtime environment

## Timing And Control Visibility

R2Kernel treats timing as a deployment property that must be visible at runtime.
It does not assume every subsystem receives a magic global clock object. Hosts
use host-level time discipline, and the runtime reports whether timing state is
acceptable for one-way cross-host interpretation.

Timed control metadata can carry execution intent across the runtime path, but
R2Kernel should not be described as a complete host-wide real-time network
scheduler. It provides runtime-level control policy and observability, not a
replacement for Linux real-time configuration, NIC capability, or physical time
sync quality.

## Fit

R2Kernel is a strong fit when the robot system needs the following.

- a stable subsystem model from local development to multi-host deployment
- explicit contracts instead of ad-hoc message shapes
- runtime-owned remote routing instead of per-subsystem socket wiring
- managed package launch and resource admission
- role-bounded contribution boundaries for gateway, component, compound, and app providers
- timing state that is visible before one-way cross-host timing is trusted
- a clean boundary for using ROS 2, vendor SDKs, or custom code inside a
  subsystem without exposing those implementation details to the whole robot

R2Kernel is a weaker fit when the main goal is one of these.

- minimal runtime structure
- direct exposure of low-level transport details to application code
- a purely single-host utility layer with no federation or runtime-owned
  resource model
- a project that intentionally wants every package to define its own product
  boundary and integration policy

## Related Pages

- [Design Philosophy](../overview/design-philosophy.md)
- [Subsystems, Roles, And Interfaces](../architecture/subsystems-and-contracts.md)
- [Communication Surfaces](../architecture/communication-surfaces.md)
- [Managed Packages and Runtime Instances](../architecture/managed-packages-and-app-runtime.md)
- [Resource Authority](../architecture/resource-authority.md)
- [Using R2Kernel With ROS 2](../develop/ros-2-integration.md)

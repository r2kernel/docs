# Subsystems, Roles, And Interfaces

A subsystem is the executable and contract-bearing runtime unit inside a R2Kernel
robot composition.

It is not just a process name, a node name, or a transport endpoint. It is the
minimum unit that the runtime can register, validate, route, observe, and manage
through lifecycle transitions.

## Runtime Role Order

Every subsystem declares one role in its `r2kernel.subsystem` manifest.

| Role | Primary responsibility | Usual public surface |
| --- | --- | --- |
| `gateway` | Own device boundaries for physical hardware or simulator-backed devices | Control-only public `api.*` surfaces; explicitly declared internal Controls may support adapter wiring |
| `component` | Provide a reusable robotics function and connect higher-level intent to device interfaces | `component.*` backed by `api.*` |
| `compound` | Declare physical and spatial integration between components | spatial ports, mounts, and component-backed Event/Procedure/Operation exports |
| `app` | Run the selected robot task or operator workflow | Event, Procedure, and Operation interfaces only |

The role boundary matters. Components may bind to gateways for device-level
access. Every application interface terminates at a component, directly or
through a component API projected by a compound. Apps and compounds never bind
directly to gateways. Compound exports are declarations of component interfaces,
not executable endpoints.

## Gateway Subsystems

Gateway subsystems are the device boundary.

They are the standard place to connect servo drivers, fieldbus stacks, cameras,
sensors, serial devices, CAN devices, EtherCAT-class links, simulator device
bridges, or vendor SDKs.

Gateways normally provide `api.*` contracts directly. They hide how a device is
reached and expose the R2Kernel API surface that higher layers consume.
Gateway contracts contain Control endpoints only; Gateway manifests cannot
publish Events or register Procedures/Operations. A device observation that
needs an Event, Procedure, or Operation is adapted at a Component boundary.
Components may bind to Gateway Controls for device access and provide the
application-facing API. Private Gateway wiring is declared as
`visibility: internal` with explicit `endpoints.controls`; it is not a portable
application or robot-slot contract. Apps do not consume Gateway interfaces
directly.

## Component Subsystems

Component subsystems implement reusable robotics functions such as mobile-base
control, manipulator control, gripper control, perception, mapping, navigation,
planning, safety, or diagnostics.

A component subsystem may require gateway APIs or other component APIs, but it
should not claim device-level hardware resources directly. CPU and scheduling
claims are allowed when deterministic execution is required. A component can
terminate an app-facing Event stream, then translate or regulate that intent
into a periodic Control exchange with a gateway when the device contract
requires it.

The public compatibility promise of a component-role subsystem is usually a
`component.*` contract. That contract is a named bundle of one or more `api.*`
contracts. It can also require named spatial ports, such as a manipulator base
and tool frame. Those ports describe physical composition and do not create
communication endpoints.

## Compound Subsystems

Compound subsystems are declarative. They require `component.*` contracts, bind
their spatial ports, export selected frames and component-conformance APIs, and
own static mounts. They contain no application or robot algorithms, declare no
`provides` endpoints of their own, and never bind to gateways. An export may
select only an Event, Procedure, or Operation API from a required component.
Component bundles may include Control-bearing conformance APIs for the
component's device integration, but the compound neither invokes those Controls
nor exports them to an app.

Robot-specific control, safety, state machines, retries, and semantic adapters
belong in component subsystems. Multi-step task policy belongs in the app. The
compound's `exports` section is therefore a checked projection, not an
implementation or proxy: the runtime resolves an app binding through the export
to the component that implements the API.

The compound owns static mounts between the spatial ports of its bound
subsystems. Dynamic relationships remain owned by the component or gateway that
computes them. The runtime resolves both into one qualified frame graph.

## App Subsystems

App subsystems implement the selected behavior for one robot deployment. Their
required and provided interfaces may contain Event, Procedure, and Operation
endpoints, but never Control endpoints. This applies to the complete API
contract, including contracts reached through a compound export. Apps may bind
directly to a component or to a component-backed compound export; app-to-gateway
bindings are invalid. Use Event interfaces for streaming interaction,
bounded Procedures for short calls, and Operations for work that reports
progress or outlives one call. If an app includes a browser UI, the static
frontend and instance context should be delivered through the managed package
frontend path rather than by opening an unmanaged web server.

## Interfaces

A subsystem manifest describes the subsystem from its own point of view.

```yaml
kind: r2kernel.subsystem
version: 1

subsystem:
  name: component.manipulator
  role: component

requires:
  actuator_servo:
    contract: api.actuator.servo.v1
    required: true
    cardinality: one

provides:
  manipulator:
    contract: component.manipulator.v1
```

`provides` means this subsystem implements an interface. `requires` means this
subsystem needs another interface to do its work. The names under `requires`
are logical names used by subsystem code; deployment decides which concrete
provider satisfies them.

A compound can additionally project eligible APIs from its required components.

```yaml
requires:
  navigation:
    contract: component.navigation.v1

exports:
  goal_navigation:
    contract: api.navigation.v1
    from:
      requirement: navigation
```

The export is accepted only when the selected API belongs to the required
component's `conformance_apis` and contains no Control endpoint. It creates no
endpoint and contains no behavior. The deployment still binds
`compound.navigation` to a component provider, while an app can bind its
Event/Procedure/Operation requirement to `compound.goal_navigation`.

## Public And Internal Interfaces

Public interfaces are compatibility boundaries. A public `provides`, `requires`,
or compound `exports` contract must resolve to a R2Kernel spec contract such as
`api.*` or `component.*`.

Private tutorial or product-internal wiring can be marked as internal.

```yaml
provides:
  procedure:
    contract: tutorial.transport.procedure.v1
    visibility: internal
```

`visibility: internal` is useful for mechanics tutorials and private test
wiring, but it is not a product platform slot or a portable app-facing surface.

## Declaration And Registration

Before a subsystem can participate in a runtime composition, R2Kernel needs an
explicit description of what it provides and requires.

The conceptual flow is:

```text
message, API, and component specs
  -> subsystem interface declaration
  -> subsystem registration
  -> lifecycle state
  -> heartbeat and status export
  -> runtime route visibility
```

Registration makes the subsystem visible as a runtime participant rather than
only a block of user code.

## Communication Surfaces

Subsystems communicate through explicit semantic surfaces.

| Surface | Use |
| --- | --- |
| Event | asynchronous state, telemetry, measurements, and feedback streams |
| Control | periodic request/response exchange with deadline and overrun semantics |
| Procedure | bounded request and response |
| Operation | long-running execution with feedback, result, and state |

This page names the surfaces. [Communication Surfaces](communication-surfaces.md)
explains how those surfaces are realized inside one host, across federation, and
through the WebSocket facade.

## Related Pages

- [Subsystem Binding Model](../concepts/subsystem-binding-model.md)
- [Subsystem Lifecycle](subsystem-lifecycle.md)
- [Spatial Model And Frame Graph](../concepts/spatial-model.md)
- [Spec Overview](../spec/spec-overview.md)
- [Subsystem SDK API](../api/subsystem-sdk-api.md)

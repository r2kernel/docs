# Contracts And Components

R2Kernel uses two primitive public spec families and one compatibility bundle.

| Family | Owns | Example |
| --- | --- | --- |
| `msg.*` | payload datatype and field layout | `msg.core.spatial.v1/Pose` |
| `api.*` | Event, Control, Procedure, and Operation endpoints | `api.locomotion.velocity.v1` |
| `component.*` | replacement-compatible bundle of required APIs | `component.mobile_base.v1` |

The runtime envelope is not a fourth public payload family. R2Kernel adds identity,
transport timing, execution timing, status, and lifecycle metadata around typed
payloads at runtime.

## How The Layers Connect

```text
msg.* payloads
    -> api.* endpoint contracts
        -> component.* compatibility bundles for component-role subsystems
            -> compound exports selected api.* contracts to apps
```

An API is deliberately smaller than a component. For example,
`component.mobile_base.v1` requires locomotion velocity and mobile-base state
APIs. Optional odometry or differential-drive APIs do not change the meaning of
the required bundle.

An exported API is not a new contract family and not a second implementation.
It is a name on the compound platform boundary that selects one API already in
a required component's conformance bundle. Composing multiple API calls remains
application logic; a reusable high-level implementation remains a component.

## Subsystem Roles

All executable units are subsystems. Their role determines the normal contract
boundary.

| Role | Normal requirements | Normal provides |
| --- | --- | --- |
| `gateway` | device and host resources | public `api.*` hardware abstractions |
| `component` | gateway APIs or other `component.*` contracts, plus CPU resources | one `component.*` compatibility bundle |
| `compound` | `component.*` contracts and their spatial surfaces | spatial ports, static mounts, and declarative API exports |
| `app` | `api.*` contracts exported by a compound | package-specific status or operator surfaces when needed |

Gateway subsystems are the only role that directly owns device-level hardware
communication. A simulator-backed device follows the same boundary and is
treated as a device behind its gateway.

## Public And Package-Local Contracts

Official `gateway` and `component` provides must resolve to the installed
public R2Kernel dictionary. This protects replacement compatibility.

Product-specific behavior can be package-local when no stable public semantic
standard exists. The cleaner tutorial does not need such a contract for trash
disposal: its `trash_disposal` export is a platform-local alias for the standard
`api.actuation.trigger.v1` contract, implemented by the standard
`component.trigger_actuator.v1` component surface. The component keeps
its configured incinerator channel and raw digital-output binding private.

## Source Of Truth

- `spec/messages`
- `spec/apis`
- `spec/components`

The installed SDK mirrors this tree. The runtime validator and Web Console Spec
Dictionary read the same definitions.

## Related Pages

- [Built-In Message Families](built-in-message-families.md)
- [API Contract Model](api-contract-model.md)
- [Components](components.md)
- [Domain Coverage](domain-coverage.md)

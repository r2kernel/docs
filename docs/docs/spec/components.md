# Components

`component` means one public compatibility contract for a component-role
subsystem. A component is composed from one or more API contracts. Component IDs
are what component-role subsystems expose to other subsystems and compound
robots.

The canonical component roots are these.

| Root | Role | Meaning |
|---|---|---|
| `component.*` | component | semantic components such as mobile-base, manipulator, gripper, and perception subsystems |

This is intentionally narrower than `robot`. A robot contains gateway,
component, compound, and app subsystems. A `component.*` ID names the public
compatibility promise of a component subsystem, not the whole robot.

## Public Rule

Use `component.*` when a component-role subsystem provides a component.

```yaml
provides:
  manipulator:
    contract: component.manipulator.v1
```

API contracts such as `api.motion.manipulator.state.v1` remain the validation
unit behind the component. Gateways provide `api.*` contracts directly, while
component subsystems provide a `component.*` bundle. A compound may
declaratively export selected conformance APIs to apps.

The `conformance_apis` field in a component spec is not the same thing as a
manifest `requires` block. It lists the API contracts that define the
component's public behavior. The runtime binding direction is still decided by
the subsystem manifest. A `provides` entry claims a provider of that component,
and a `requires` entry asks for a provider of that component.

Component conformance also explicitly declares spatial participation.

```yaml
spatial:
  participation: required
  ports:
    base:
      direction: import
      semantic: mounting_frame
    tool:
      direction: export
      semantic: tool_frame
```

`participation` is always `none` or `required`. A concrete subsystem that claims
this component must map every required port in its `subsystem.yaml`. Spatial
ports are separate from `conformance_apis`; they define how a component fits
into a physical frame topology rather than how messages are exchanged.

## Summary Table

| Canonical contract | Role | Backing API contracts |
|---|---|---|
| `component.articulated.trajectory.v1` | component | [articulated state](api-contract-reference.md#api-motion-articulated-state-v1)<br>[articulated trajectory](api-contract-reference.md#api-motion-articulated-trajectory-v1) |
| `component.articulated.velocity.v1` | component | [articulated state](api-contract-reference.md#api-motion-articulated-state-v1)<br>[articulated velocity](api-contract-reference.md#api-motion-articulated-velocity-v1) |
| `component.manipulator.v1` | component | [articulated state](api-contract-reference.md#api-motion-articulated-state-v1)<br>[articulated velocity](api-contract-reference.md#api-motion-articulated-velocity-v1)<br>[articulated trajectory](api-contract-reference.md#api-motion-articulated-trajectory-v1)<br>[manipulator state](api-contract-reference.md#api-motion-manipulator-state-v1)<br>[manipulator cartesian](api-contract-reference.md#api-motion-manipulator-cartesian-v1)<br>[manipulator tooling](api-contract-reference.md#api-motion-manipulator-tooling-v1) |
| `component.gripper.v1` | component | `api.end_effector.gripper.v1` |
| `component.mobile_base.v1` | component | [locomotion velocity](api-contract-reference.md#api-locomotion-velocity-v1)<br>[velocity reference](api-contract-reference.md#api-locomotion-velocity-reference-v1)<br>[mobile-base state](api-contract-reference.md#api-locomotion-mobile-base-state-v1) |
| `component.mobile_base.odometry.v1` | component | [locomotion velocity](api-contract-reference.md#api-locomotion-velocity-v1)<br>[velocity reference](api-contract-reference.md#api-locomotion-velocity-reference-v1)<br>[mobile-base state](api-contract-reference.md#api-locomotion-mobile-base-state-v1)<br>[odometry](api-contract-reference.md#api-locomotion-odometry-v1) |
| `component.mobile_base.localized.v1` | component | [locomotion velocity](api-contract-reference.md#api-locomotion-velocity-v1)<br>[velocity reference](api-contract-reference.md#api-locomotion-velocity-reference-v1)<br>[mobile-base state](api-contract-reference.md#api-locomotion-mobile-base-state-v1)<br>[localization](api-contract-reference.md#api-localization-v1) |
| `component.mobile_base.autonomous.v1` | component | [locomotion velocity](api-contract-reference.md#api-locomotion-velocity-v1)<br>[velocity reference](api-contract-reference.md#api-locomotion-velocity-reference-v1)<br>[mobile-base state](api-contract-reference.md#api-locomotion-mobile-base-state-v1)<br>[localization](api-contract-reference.md#api-localization-v1)<br>[navigation](api-contract-reference.md#api-navigation-v1) |
| `component.perception.v1` | component | `api.perception.query.v1` |
| `component.localizer.v1` | component | [localization](api-contract-reference.md#api-localization-v1) |
| `component.navigation.v1` | component | [navigation](api-contract-reference.md#api-navigation-v1) |
| `component.trigger_actuator.v1` | component | [actuation trigger](api-contract-reference.md#api-actuation-trigger-v1) |

## Component Subsystems

Component subsystems expose semantic control contracts. They should not own
fieldbus resources such as NICs, CAN, RS-485, or SPI directly. CPU and
scheduling claims are allowed when a controller needs deterministic execution,
but hardware interface resources belong behind a gateway subsystem.

Components here are intentionally closed compatibility promises.

- no optional API contract set
- no basic/standard/advanced ladder unless the API surface is actually distinct
- if two component bundles differ semantically, give them different component IDs

## Gateway Contracts

Gateway subsystems aggregate one or more physical hardware channels and expose
them as `api.*` contracts. This is the standard place to hide EtherCAT,
CAN/CANopen, serial, I2C, SPI, or vendor-specific SDKs.

The public contract describes the semantic gateway role, not the underlying bus.

## Compound Contracts

Declarative compound subsystems describe physical composition and static spatial mounts. A
compound requires `component.*` contracts to compose the robot body and can
export selected Control-free APIs already implemented by those components. It
does not own behavior endpoints or bind to gateway APIs. Compound-to-gateway
bindings are rejected, including older manifests that used them. A
platform-specific device behavior, such as a disposal output, is still a
component even when its implementation is small.

Applications may bind to a Component directly or to a Compound's declared
Control-free API exports. Runtime resolution of an export continues to the
Component selected by the Compound requirement binding. Thus the Compound
remains an integration definition rather than a behavior proxy.

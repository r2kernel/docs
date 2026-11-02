# Concepts Overview

Use this section to understand the R2Kernel robot model before reading operator
procedures, SDK tutorials, or protocol references.

The Concepts section is ordered from philosophy to model to runtime operation.

```text
philosophy -> robot model -> subsystem roles -> binding -> lifecycle -> communication -> managed runtime -> host boundary
```

The vocabulary order is intentional.

- robot composition: platform, application, deployment
- subsystem roles: gateway, component, compound, app
- spec families: message, API contract, component
- runtime flow: declaration, binding, lifecycle, communication, launch, resource admission, route

## Concept Map

| Area | Question it answers | Start here |
| --- | --- | --- |
| Philosophy | Why does R2Kernel define a robot before it defines processes? | [Design Philosophy](../overview/design-philosophy.md) |
| Robot composition | How are platform, application, and deployment separated? | [Robot, Application, And Deployment](robot-application-deployment-model.md) |
| Subsystems and interfaces | What are gateway, component, compound, and app subsystems? | [Subsystems, Roles, And Interfaces](../architecture/subsystems-and-contracts.md) |
| Binding | How does deployment choose concrete providers without hardcoding topology into code? | [Subsystem Binding Model](subsystem-binding-model.md) |
| Lifecycle | How is a subsystem state different from an OS process state? | [Subsystem Lifecycle](../architecture/subsystem-lifecycle.md) |
| Communication | When should Event, Control, Procedure, Operation, or WebSocket be used? | [Communication Surfaces](../architecture/communication-surfaces.md) |
| Managed packages | How do reusable packages, installation, instances, and package frontends work? | [Managed Packages and Runtime Instances](../architecture/managed-packages-and-app-runtime.md) |
| Resource authority | How does R2Kernel admit CPU, network, CAN, serial, device, and frontend resources? | [Resource Authority](../architecture/resource-authority.md) |
| Federation | How do multiple hosts participate without per-subsystem cross-host sockets? | [Federation and Host Control](../architecture/federation-and-host-control.md) |
| Timing | How is cross-host timing state represented and accepted? | [Federation Time Model](../architecture/federation-time-model.md) |
| Differentiation | What makes R2Kernel different from node graphs, message buses, direct sockets, launchers, and single-host IPC? | [Differentiators](differentiators.md) |

## Recommended Order

If you are new to R2Kernel, read the pages in this order.

1. [Design Philosophy](../overview/design-philosophy.md)
2. [Robot, Application, And Deployment](robot-application-deployment-model.md)
3. [Subsystems, Roles, And Interfaces](../architecture/subsystems-and-contracts.md)
4. [Subsystem Binding Model](subsystem-binding-model.md)
5. [Subsystem Lifecycle](../architecture/subsystem-lifecycle.md)
6. [Communication Surfaces](../architecture/communication-surfaces.md)
7. [Managed Packages and Runtime Instances](../architecture/managed-packages-and-app-runtime.md)
8. [Resource Authority](../architecture/resource-authority.md)
9. [Federation and Host Control](../architecture/federation-and-host-control.md)
10. [Federation Time Model](../architecture/federation-time-model.md)
11. [Differentiators](differentiators.md)

Detailed public contract tables are kept in [Reference](../reference/reference-overview.md),
including installed paths, package layout, payload encoding, and spec lookup.

Use [Operate](../operate/operator-overview.md) for host operation and
[Develop](../develop/developer-guide.md) for SDK and tutorial workflows.

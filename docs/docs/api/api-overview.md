# API Guide

This section explains the developer-facing API boundaries of R2Kernel. It is a
guide, not the exhaustive API catalog.

There are two primary API surfaces.

- **Subsystem SDK API** - the Python and C++ API used by subsystem authors inside a subsystem.
- **Host Control API** - the REST and WebSocket API exposed by the host control backend for the Web Console, automation, monitoring, app management, and external integration.

Choose the API by where the code runs.

| Code location | Use |
| --- | --- |
| Managed subsystem on a supported Linux runtime host | Subsystem SDK API |
| Browser frontend or packaged app UI | Host Control WebSocket API |
| Windows/macOS tool, cloud service, or other non-R2Kernel client | Host Control REST/WebSocket API |
| Deployment automation, package management, runtime inspection | Host Control REST API |
| ROS 2 code that should participate as a R2Kernel subsystem | A ROS 2 interface subsystem using the Subsystem SDK |

The language-neutral message, API contract, and component contracts are
documented under [Spec](../spec/spec-overview.md). A spec entry is not a runtime
method catalog by itself. It is the semantic contract that SDK code declares,
registers, calls, or validates against.

For table-oriented lookup, use [API Reference](../reference/api-reference.md).

## API Map

| Page | Use when |
| --- | --- |
| [Subsystem SDK API](subsystem-sdk-api.md) | Learning the subsystem-author API flow in Python or C++ |
| [Host Control REST API](host-control-rest-api.md) | Learning how operator tools, automation, deployment checks, and app management clients use HTTP |
| [Host Control WebSocket API](host-control-websocket-api.md) | Learning how browser or outside-runtime clients observe Events or invoke Procedure/Operation calls |
| [Typed Payload and Codec](typed-payload-and-codec.md) | Understanding typed message refs, codec behavior, and the private transport metadata boundary |
| [GNSS Source Control](../reference/gnss-source-control.md) | Receiver-reported fixes, acquisition time, uncertainty, and localization boundaries |

Use these Reference pages when you need the catalog.

| Reference | Contains |
| --- | --- |
| [Subsystem SDK Reference](../reference/subsystem-sdk-reference.md) | Public subsystem-author classes and method groups |
| [Host Control REST Routes](../reference/host-control-rest-routes.md) | REST route table, method, role, and request-body summary |
| [Host Control WebSocket Messages](../reference/host-control-websocket-messages.md) | WebSocket endpoints, client message kinds, server responses, and fields |
| [Data Types And Binary Encoding](../reference/data-types-and-binary-encoding.md) | Binary encoding details for typed payloads |

## Boundary Rule

Keep these boundaries separate.

- Subsystem code uses the SDK and should not depend on REST routes.
- Browser and external tools use the Host Control API and should not implement native runtime transport.
- Non-Linux or non-R2Kernel clients use Host Control WebSocket for live observation and Procedure/Operation requests.
- Product frontends should use the stable `/api/v1` Host Control prefix. The bundled Web Console is optional and can be disabled or replaced.
- Semantic contracts live under Spec and are referenced by SDK/API calls through message refs, API contracts, components, and endpoint declarations.

## Public SDK Surface

Runtime SDK APIs are provided by language SDKs.

- Python - `r2kernel.wrapper.GatewaySubsystem`, `ComponentSubsystem`, `CompoundSubsystem`, `AppSubsystem`
- C++ - `r2kernel::wrapper::GatewaySubsystem`, `ComponentSubsystem`, `CompoundSubsystem`, `AppSubsystem`

The public subsystem-author SDK surface is Python and C++. Runtime implementation
details are not part of the integration contract.

Language-specific syntax may differ, but declare/register/lifecycle semantics,
endpoint metadata, message refs, timing support policy, and Event / Control /
Procedure / Operation behavior should remain shared across the public SDKs.

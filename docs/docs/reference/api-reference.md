# API Reference

Use this section when you need table-oriented lookup for public R2Kernel API
surfaces.

The Develop API pages explain which API to use and how the flow works. The
Reference API pages list the public surface in a denser form.

| Reference | Scope |
| --- | --- |
| [GNSS Source Control](gnss-source-control.md) | GNSS source cycle, receiver fix, clock and uncertainty semantics, and session handling |
| [Subsystem SDK Reference](subsystem-sdk-reference.md) | Python and C++ subsystem-author classes, lifecycle hooks, method groups, and resource helpers |
| [Host Control REST Routes](host-control-rest-routes.md) | HTTP routes exposed by the control backend |
| [Host Control WebSocket Messages](host-control-websocket-messages.md) | WebSocket endpoints, client message kinds, server responses, and common fields |
| [WebSocket Facade](websocket-facade.md) | Browser-facing Event observation and Procedure/Operation control boundary |
| [Data Types And Binary Encoding](data-types-and-binary-encoding.md) | Binary message encoding and typed payload rules |

Language-neutral semantic contracts are separate from runtime API methods.

| Spec reference | Scope |
| --- | --- |
| [Message Index](../spec/message-index.md) | `msg.*` message namespaces and message types |
| [API Contract Reference](../spec/api-contract-reference.md) | `api.*` endpoint contracts |
| [Components](../spec/components.md) | component contract bundles |
| [Domain Coverage](../spec/domain-coverage.md) | domain-level coverage map |

## Source Of Truth

The versioned Python and C++ SDK packages, installed C++ headers, generated spec
dictionary, and Host API reference are the public sources of truth. Public
integrations must not depend on runtime implementation modules or undocumented
routes. A mismatch between a released SDK and this reference is a documentation
defect and should be reported against that release.

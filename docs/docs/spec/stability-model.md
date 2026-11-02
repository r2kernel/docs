# Stability Model

The R2Kernel spec layer is versioned per namespace.

## Compatibility Rule

- a published `message`, `API contract`, or `component` id remains stable within its version
- incompatible changes use a separate namespace version
- compatibility is declared by explicit refs, not by implicit naming or inheritance

## Layer Rule

- `message` defines typed payload schemas
- `API contract` defines endpoint-level API contracts
- `component` defines named compatibility components composed from one or more API contracts

## Authoring Rule

- add fields compatibly within a namespace version only when the wire model remains valid
- use a separate namespace version when semantics or endpoint contracts change incompatibly
- keep transport/runtime implementation details out of public message and API contract ids

## Validation Rule

- subsystems are validated against declared public component contracts and their conformance API contracts
- component declarations expand to their conformance API contract set
- version resolution follows explicit namespace and default-version rules

## Reading Rule

Read the `Spec` section as the authoritative definition of R2Kernel contract structure and namespace composition.

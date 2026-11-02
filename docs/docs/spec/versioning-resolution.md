# Versioning And Resolution

The spec layer needs more than names. It also needs a consistent way to resolve names into explicit, versioned references.

## Versioning Rule

Versions are local to each namespace.

That means R2Kernel does not force the whole repository into one global `v1` or `v2` tree. Instead, each namespace carries its own version leaf.

Examples.

```text
spec/messages/msg/core/common/primitive/v1.yaml
spec/messages/msg/core/common/primitive/v2.yaml
spec/apis/api/io/digital/v1.yaml
```

This keeps versioning more granular and lets unrelated domains evolve independently.

## Canonical And Local Refs

The canonical form is explicit.

```text
msg.core.kinematics.v1/JointValues
```

During authoring, a source spec may use shorter refs for convenience. Within a namespace, local names may be used. For external namespaces, source specs may use namespace imports and shorter unversioned refs.

## Imports

Source specs may declare imports such as the following.

```yaml
imports:
  msg.core.kinematics: v1
```

That allows source documents to write.

```text
msg.core.kinematics/JointValues
```

and resolve it into.

```text
msg.core.kinematics.v1/JointValues
```

This keeps source documents readable without losing canonical resolution.

## Defaults

If a source spec omits imports, R2Kernel may fall back to the release-level default map in `spec/defaults.yaml`.

That default map is a fallback, not a strong pin.

In other words.

- explicit imports are stronger
- defaults are release-scoped convenience
- canonical versioned refs remain the most explicit form

## Spec Root Resolution

The public spec is resolved from YAML files outside the runtime whenever possible.

Resolution order is this.

1. `R2KERNEL_CONTRACT_SPEC_ROOTS`, package-injected contract roots
2. `R2KERNEL_SPEC_PATH`, a platform path-list for overlay roots
3. `R2KERNEL_SPEC_ROOT`, a single spec root
4. `./r2kernel-spec` or `./spec` from the current working directory
5. the fixed default-prefix spec locations `/opt/r2kernel/spec` and `/opt/r2kernel/runtime/spec`
6. bundle-adjacent `spec` directories
7. packaged or embedded fallback copies

This lets a release install use shipped public YAML by default, while allowing operators or developers to override the effective contract with a checked-out or patched spec tree.

Use `R2KERNEL_SPEC_ROOT=/path/to/spec` when one complete custom spec tree should
replace the installed tree. Use `R2KERNEL_SPEC_PATH=/custom:/installed` when a
custom tree should overlay selected components, API contracts, or messages while the
installed public spec remains available as fallback.

Managed packages normally should not ask operators to set these variables by
hand. A package can declare package-local spec roots.

```yaml
contracts:
  spec_roots:
    - spec
```

The launcher then injects the package-local `spec` directory into
`R2KERNEL_CONTRACT_SPEC_ROOTS` and `R2KERNEL_SPEC_PATH` before the subsystem process
starts.

Contract conformance policy is runtime-wide, not package-owned. Operators set it
in `runtime/config.yaml`.

```yaml
contracts:
  policy: strict
```

Use `strict` for normal operation. Use `warn` only during migration when a
subsystem must run while endpoint mismatch warnings are being corrected. Use
`off` only for local debugging.

## Why This Matters

The point of this model is to let R2Kernel do both of the following.

- keep authored YAML manageable
- keep deployed interoperability explicit

This is especially important when different subsystems or tools need to resolve the same API contract or component contract in a consistent way.

## Compatibility Rule

- a published `message`, `API contract`, or `component` id remains stable within its version
- incompatible changes create a new namespace version
- compatibility is declared by explicit refs, not by implicit naming or inheritance

## Layer Rule

- `message` defines typed payload schemas
- `API contract` defines endpoint-level API contracts
- `component` defines named compatibility components composed from one or more API contracts

## Authoring Rule

- add fields compatibly within a namespace version only when the wire model remains valid
- introduce a new namespace version when semantics or endpoint contracts change incompatibly
- keep transport/runtime implementation details out of public message and API contract ids

## Validation Rule

- subsystems are validated against declared public component contracts and their conformance API contracts
- component declarations expand to their conformance API contract set
- version resolution follows explicit namespace and default-version rules

## Reading Rule

Read the `Spec` section as the authoritative definition of R2Kernel contract structure and namespace composition.

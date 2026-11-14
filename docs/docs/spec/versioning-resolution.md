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

A new namespace version need not repeat every message of the previous one.
`msg.locomotion.mobile_base.v2` contains only `Odometry`; the other mobile-base
messages stay in `msg.locomotion.mobile_base.v1`, and `defaults.yaml` keeps
`msg.locomotion.mobile_base: v1`, so unversioned references still resolve to
v1. Reference the v2 message by its canonical name,
`msg.locomotion.mobile_base.v2/Odometry`.

## Spec Root Resolution

The public spec is resolved from YAML files outside the runtime whenever possible.

Resolution order is this.

1. `R2KERNEL_CONTRACT_SPEC_ROOTS`, package-injected contract roots
2. `R2KERNEL_SPEC_PATH`, a platform path-list for overlay roots
3. `R2KERNEL_SPEC_ROOT`, a single spec root
4. `./r2kernel-spec` or `./spec` in the current working directory (not its parent directories)
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

Package spec roots are searched before the installed dictionary, and
unqualified IDs are reserved for that dictionary
([Spec](spec-overview.md)). A package spec root may therefore contain a
standard ID only as an identical copy of the installed definition. A differing
definition of a standard ID, and a new ID under a standard prefix
(`<kind>.<first segment>` of any standard ID, such as `api.locomotion` or
`component.mobile_base`), are refused. Use your own vendor segment, such as
`api.acme.*`. Every message and API document in a package spec root must also declare the
ID its path names (`apis/api/acme/gripper/v1.yaml` declares
`api.acme.gripper.v1`), whether or not anything references it. Because an ID
names its path by its dots, directory and file names in these trees contain no
dots: `apis/api/acme/foo.bar/v1.yaml` is refused, and `api.acme.foo.bar.v1`
belongs at `apis/api/acme/foo/bar/v1.yaml`. The tree must not reach one
directory through two paths. The runtime reads every such
document when it prepares the codecs. After these checks, each package spec
root is also given to the runtime core itself, which decides last: a root it
would refuse at codec setup, for example a malformed `defaults.yaml` or a
message set without `messages`, is refused with "the runtime core refuses this
spec root when it prepares the codecs". Message types a document names are
resolved when a codec is prepared, not here. `r2kernel-package validate` and
package installation apply the rule with the dictionary built into the runtime
and the configured and installed spec roots, never a `spec/` directory of the
current working directory; the Python and C++ SDKs apply
it when a package manifest loads and, at subsystem start, to the roots in
`R2KERNEL_CONTRACT_SPEC_ROOTS`, with the installed dictionary
(`R2KERNEL_SPEC_ROOT`, `$R2KERNEL_PREFIX/spec` or the default-prefix spec
directory; the Python SDK falls back to the dictionary it ships).

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

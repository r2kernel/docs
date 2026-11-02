# Spatial Model And Frame Graph

R2Kernel treats spatial composition as part of the robot architecture, not as an
application-specific Event topic. A subsystem can participate in a frame graph
without exposing transforms as a public communication contract.

The model has four layers.

```text
component spec = which spatial ports a compatible component must expose
subsystem manifest = which local frames implement those ports
compound manifest = how bound subsystem ports are mounted together
runtime frame graph = live static and dynamic transforms for this deployment
```

## Spatial Ports Are Not Communication Interfaces

`provides` and `requires` declare communication contracts. Spatial ports declare
physical attachment and reference-frame boundaries. A spatial port does not
create an Event, Control, Procedure, or Operation endpoint.

Both attachment ports and provided-frame ports are public spatial surfaces of a
component. Their direction describes transform flow, not subsystem ownership.
An `import` port such as a manipulator `base` accepts placement from a compound
mount. An `export` port provides a reference, static, or internally derived
frame such as `tool`. Neither is a communication `requires` interface.

Every public component spec explicitly declares whether it participates.

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

Use `participation: none` when spatial topology is not meaningful for that
component. This is explicit so a provider cannot silently omit required frame
semantics.

## Concrete Frame Mapping

A subsystem maps the component ports to names local to its own process.

```yaml
spatial:
  participation: required
  ports:
    base:
      direction: import
      frame: arm_base
    tool:
      direction: export
      frame: tool0
```

Local names do not need to be globally unique. The runtime qualifies them as
`<subsystem>/<frame>`, for example `component.arm/tool0`.

An alias can also resolve a port through a required binding. A same-direction
alias re-exports the frame of a bound component. An import may reference an
export when a subsystem consumes an existing frame without owning a transform.

```yaml
spatial:
  participation: required
  ports:
    body:
      direction: export
      source:
        requirement: mobility
        port: body
```

The inverse relationship is not valid. An export cannot source an import because
that would present a frame received from another owner as a new provided frame.

## Compound Mounts

A compound subsystem owns the static topology between the subsystems that form
its body. Mount endpoints refer to logical requirements, so the topology remains
valid when deployment chooses a different compatible provider.

```yaml
spatial:
  participation: required
  mounts:
    - name: arm_on_body
      parent:
        requirement: mobility
        port: body
      child:
        requirement: manipulation
        port: base
      transform:
        translation: [0.18, 0.0, 0.12]
        rotation_xyzw: [0.0, 0.0, 0.0, 1.0]
```

The parent port must export a frame and the child port must import one. The
deployment validator resolves both through current bindings and rejects missing
ports, invalid directions, cycles, and multiple parents.

## Dynamic Transform Ownership

The subsystem that computes a changing relationship owns that transform. A
mobile-base component can report `odom -> base`, a localizer can report
`map -> odom`, and a manipulator component can report `arm_base -> tool0`.
The compound declares only the static physical mounts between those bodies.

A dynamic transform may name a local frame or one of the subsystem's spatial
ports. Port names are important when the port is an alias resolved through a
required binding. For example, a localizer can update `map -> reference`, where
`reference` resolves to the odometry provider's exported `odom` frame. This
joins transforms owned by different subsystems without copying frame identity.

Python example.

```python
self.set_frame_transform(
    parent_frame="map",
    child_frame="reference",
    translation=(x, y, 0.0),
    rotation_xyzw=(0.0, 0.0, qz, qw),
    observed_at_sync_ns=self.now_ns(),
    stale_after_ms=500,
)
```

C++ uses `r2kernel::FrameTransform` with `Subsystem::set_frame_transform()`.
Updates use a lightweight runtime path. The regular heartbeat still carries a
complete snapshot so the graph recovers after a control-backend restart.

## Localization And Frame Consumers

Locomotion and localization own the dynamic frame chain.

```text
locomotion owns odom -> body
localizer owns map -> odom
runtime composes map -> odom -> body
```

The relationship between a localizer and a locomotion component is not a mount.
A mount describes a rigid physical attachment such as an arm or sensor attached
to a body. Localization instead joins two dynamic reference chains at the
odometry frame.

Navigation does not declare a spatial surface merely because it uses a robot
pose. It consumes the localization component's API, whose messages identify the
reference and body frames. Spatial ports remain reserved for subsystems that
own, expose, alias, or physically compose frames. This keeps algorithmic data
dependencies on the system surface and physical topology on the spatial surface.

A navigation-only platform surface may expose only a navigation capability. A
compound that exports platform frames requires the locomotion and localization
components independently for their spatial ports. These requirements describe
topology only; they do not create behavior proxies or merge runtime subsystem
lifecycles.

## Runtime Lookup And Diagnostics

Inspect the current graph.

```text
r2kernel frame graph
```

Resolve one frame into another.

```text
r2kernel frame lookup component.localizer/map component.manipulation/tool0
```

The same data is available through Host Control REST.

```text
GET /api/v1/control/frames
GET /api/v1/control/frames/lookup?source=<frame>&target=<frame>
```

The Web Console overlays spatial composition on the subsystem cards under
**Runtime > Graph**. Circular ports and solid lines represent communication
interfaces. Each card separates the contract-based **System surface** from the
physical **Spatial surface**. Component and compound cards use the same spatial
surface model: attachment ports and provided frames appear together on the
right and use different diamond colors. A compound adds a separate **Internal
composition** section for mounts. Dashed lines connect component or nested
compound ports to those compound-owned mounts. Use the graph layer controls to
show interfaces, spatial composition, and subsystem-internal frames independently.
Selecting a spatial port, mount, or transform opens its live frame and
transform details.
On a compound card, dashed lines represent only physical mounts. Provided frames
such as `body` or `tool` remain on the right under **Provided frames** and show
their source inline, for example `body ← mobility.body`. A provided frame can
refer to an existing component frame without creating another topology edge.

Dynamic edges have a stale deadline. Stale edges remain visible for diagnosis
but are excluded from lookup. The graph also reports unresolved ports, invalid
mounts, cycles, and frames with multiple parents.

## What The Robot Manifest Owns

The robot manifest still names the reusable platform and its slots;
application-facing APIs come from compound exports. It does not duplicate concrete frame topology. Runtime topology is
owned by subsystem spatial declarations and the compound subsystem that connects
them.

## Related Pages

- [Subsystem Binding Model](subsystem-binding-model.md)
- [Subsystems, Roles, And Interfaces](../architecture/subsystems-and-contracts.md)
- [Subsystem Binding Manifests](../spec/subsystem-binding-manifests.md)
- [Define Platform](../tutorials/define-platform.md)

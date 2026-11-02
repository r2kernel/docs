# Data Types And Binary Encoding

This document describes the low-level schema encoding rules used by R2Kernel.

These public payload rules support independent SDK integration and contract
interoperability. They do not specify the kernel's private transport framing,
memory layout, scheduling, or routing implementation.

It is not the taxonomy document. For the message-family structure itself, see [Message Theme Taxonomy](message-theme-taxonomy.md).

## Scope

The public schema source of truth lives under `spec/messages`.

Important public families include the following.

- `msg.core.common.primitive.v1`
- `msg.core.spatial.v1`
- `msg.core.kinematics.v1`
- `msg.core.common.result.v1`
- `msg.actuator.servo.v1`
- `msg.motion.articulated.v1`
- `msg.motion.manipulator.v1`
- `msg.locomotion.velocity.v1`
- `msg.locomotion.mobile_base.v1`
- `msg.locomotion.legged.v1`
- `msg.control.v1`
- `msg.stream.v1`
- `msg.visual.v1`
- `msg.sensor.depth.v1`
- `msg.sensor.camera.v1`, `msg.sensor.rgbd.v1`
- `msg.sensor.radar.v1`, `msg.sensor.gnss.v1`
- `msg.sensor.lidar.v1`, `msg.sensor.pointcloud.v1`
- `msg.io.digital.timed_output.v1`
- `msg.localization.v1`
- `msg.mapping.v1`
- `msg.navigation.v1`
- `msg.perception.v1`

Simple channel-addressed digital and analog IO requests reuse generic indexed wrappers from `msg.core.common.primitive.v1`. Only the timed digital-output Control has its own family, `msg.io.digital.timed_output.v1`, for its cycle request and response.

## Encoding Rules

### Endianness

- canonical typed-schema encoding is little-endian
- field length prefixes are `uint32` little-endian
- dynamic vector counts are `uint32` little-endian

### Primitive Types

Supported scalar primitives.

- `uint8`
- `uint16`
- `int32`
- `uint32`
- `int64`
- `float32`
- `float64`
- `bool`
- `string`
- `bytes`

The public wire scalar set does not include `uint64`. Versioned cycle IDs,
sequences, and sizes that are nonnegative 64-bit domain values use `int64` and
are constrained to `0..2^63-1` by their contract. This representation does not
change the signed meaning of timestamps or measurements.

### Array Forms

Canonical schema syntax.

- dynamic vector - `vector<T>`
- fixed array - `array<T, N>`

Dynamic vectors encode as follows.

```text
[u32 count][elem0][elem1]...[elemN-1]
```

Fixed arrays encode as packed element bytes with no inner count.

### Compound Types

Compound fields are encoded in fixed field order, with a 4-byte length prefix per field.

```text
[u32 len0][field0 bytes][u32 len1][field1 bytes]...
```

Nested fields may reference.

- a local message name in the same namespace
- a canonical versioned ref in another namespace

Examples.

- local reference - `Position`
- canonical reference - `msg.core.spatial.v1/Pose`

These canonical compound-field rules are distinct from raw raster and packed
sensor payload layouts. The latter declare profile-specific byte order and
stride explicitly; see [Control Cycles and Typed Streams](../spec/control-cycles-and-streaming.md).

## Public Spatial Foundation

The main shared compound family is `msg.core.spatial.v1`.

It includes the following.

- `Vector3`
- `Quaternion`
- `Position`
- `Covariance6x6`
- `Pose`
- `Force`
- `Torque`
- `Wrench`
- `Twist`
- `Accel`
- `Inertia`

Interpretation rule.

- `Vector3` and `Quaternion` are the basic math types
- `Position`, `Force`, and `Torque` remain separate semantic wrappers even when their field layout matches `Vector3`
- `Pose`, `Wrench`, `Twist`, and `Accel` are rigid-body composite quantities built on top of those lower-level types
- estimate-oriented composites should usually live in domain families that reuse these building blocks, rather than directly inside `msg.core.spatial.*`
- angular quantities continue to use `x`, `y`, `z` axis names; angular meaning comes from the surrounding type, not from `rx`, `ry`, `rz`

Examples.

- `Pose` uses `Position` and `Quaternion`
- `PoseEstimate` in `msg.localization.v1` uses `Pose` and `Covariance6x6`
- `Twist` uses `Vector3` for `linear` and `angular`, but should be read as rigid-body spatial velocity
- `Wrench` uses `Force` and `Torque`

This is intentionally more explicit than the helper-style model, because public schema should carry clearer robotics semantics.

Runtime lifecycle state and Control envelopes are internal kernel
schemas. They are not public payload families. Domain-specific controller or
motion state belongs in the relevant public domain family such as
`msg.motion.*`, `msg.locomotion.*`, `msg.localization.*`, or
`msg.perception.*`.

Pure spatial messages do not carry transport timestamps or fixed frame names.
The API contract owns fixed-frame semantics. An owning domain message includes a
frame field only when the frame can vary per value. Payload time remains valid
for multi-time trajectories, historical data, and raw device-clock samples.

## Notes About Python Helpers

Python contains datatype helper classes under `sdk/python/r2kernel/datatype`.

Those helpers are compatibility/runtime aids. They should not be treated as the canonical public taxonomy.

The long-term rule is this.

- public contract meaning comes from `r2kernel-spec`
- codec/runtime implementations consume those schemas
- language-specific helpers sit above that contract model

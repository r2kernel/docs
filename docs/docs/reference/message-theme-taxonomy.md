# Message Theme Taxonomy

The public message tree follows robotics semantics rather than subsystem role or
runtime implementation.

## Rules

- `msg.core.*` contains reusable mathematical and cross-domain payload types
- direct domain families such as `msg.motion.*`, `msg.locomotion.*`,
  `msg.actuator.*`, and `msg.sensor.*` own domain data
- `msg.control.v1`, `msg.stream.v1`, and `msg.visual.v1` contain Control-cycle
  and typed-stream metadata shared by source and output Controls
- `component.*` is reserved for API compatibility bundles, not messages
- transport identity, lifecycle, and timing envelopes remain runtime-internal

## Core Families

| Family | Purpose |
| --- | --- |
| `msg.core.common.primitive.v1` | empty bodies, named scalar wrappers, channel values, durations, and explicit domain timestamps |
| `msg.core.spatial.v1` | pure spatial quantities such as Pose, Twist, Wrench, and Accel |
| `msg.core.kinematics.v1` | joint values, limits, commands, and articulated state |
| `msg.core.linalg.v1` | matrices and numerical vector structures |
| `msg.core.common.result.v1` | generic terminal result of a Procedure or Operation |

`Pose`, `Twist`, and other spatial primitives do not carry a frame or
timestamp by default. Fixed frames are API semantics. Dynamic frames belong to
the domain message that owns the spatial value.

## Domain Families

| Family | Purpose |
| --- | --- |
| `msg.actuator.drive.v1` | deterministic drive commands and state |
| `msg.actuator.servo.v1` | low-level joint and actuator servo exchange |
| `msg.motion.articulated.v1` | generic jointed-mechanism motion |
| `msg.motion.manipulator.v1` | manipulator task-space, tooling, calibration, and kinematics |
| `msg.motion.execution.v1` | shared motion execution state and scaling |
| `msg.locomotion.velocity.v1` | body-velocity commands, acknowledgement, limits, and stop |
| `msg.locomotion.mobile_base.v1` | mobile-base state, odometry, authority, and differential-drive data |
| `msg.locomotion.legged.v1` | gait, contact, balance, and support state |
| `msg.sensor.camera.v1` | camera intrinsics, stream formats, and camera source cycles |
| `msg.localization.v1` | pose estimates and localization status |
| `msg.mapping.v1` | maps and mapping state |
| `msg.navigation.v1` | goals, paths, feedback, results, and navigation state |
| `msg.perception.v1` | queries, detections, object poses, and perception streams |
| `msg.diagnostics.health.v1` | health checks and diagnostic results |

## Timing Boundary

An Event callback receives observed, published, and received timestamps from the
runtime envelope. A timed Control response reports command generation, sending,
scheduling, dispatch, sampling, completion, response, and lateness.

Payload time is retained only when it is data in its own right. Examples include
trajectory point times, historical query ranges, batched samples acquired at
different times, and raw device-clock readings.

## Full Inventory

- [Message Index](../spec/message-index.md)
- [Data Types And Binary Encoding](data-types-and-binary-encoding.md)
- [API Contract Model](../spec/api-contract-model.md)

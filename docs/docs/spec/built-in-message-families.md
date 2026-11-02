# Built-In Message Families

R2Kernel message specs define payload datatypes. They do not carry the transport
envelope.

## Ownership Rule

| Information | Owner |
| --- | --- |
| payload fields and physical values | `msg.*` schema |
| endpoint kind, frame policy, and timing requirements | `api.*` contract |
| observed, published, and received timestamps | Event envelope |
| generated, sent, execute, valid-until, dispatch, sample, completion, response, and lateness timestamps | Control envelope |

Do not create blanket `StampedPose`, `StampedTwist`, or similar public types.
Use a pure spatial type when the API fixes the frame. Put a frame identifier in
the owning domain message only when it is genuinely dynamic.

Payload timestamps remain appropriate for multi-time batches, trajectories,
historical queries, and raw device-clock samples. These represent domain data,
not transport lifecycle.

## Family Map

| Family | Responsibility |
| --- | --- |
| `msg.core.common.primitive.v1` | named scalar wrappers, empty requests, channel values, durations, and explicit domain timestamps |
| `msg.core.common.result.v1` | generic terminal result of a Procedure or Operation |
| `msg.core.spatial.v1` | pure pose, twist, wrench, acceleration, inertia, and spatial math |
| `msg.core.kinematics.v1` | joint values, commands, and articulated state |
| `msg.core.linalg.v1` | vectors and matrices used by robotics payloads |
| `msg.diagnostics.health.v1` | public health observations |
| `msg.actuator.*` | low-level drive and servo payloads |
| `msg.motion.*` | articulated and manipulator motion payloads |
| `msg.locomotion.*` | body motion, mobile-base, odometry, and legged payloads |
| `msg.sensor.*` | sensor calibration and samples |
| `msg.io.digital.timed_output.v1` | digital output Control cycles with command and keep refresh |
| `msg.control.v1` | public Control-cycle generation, ordering, intent, and state revision |
| `msg.stream.v1` | stream identity, codec profile, sample lifetime, transfer chunks, and bounded resource limits |
| `msg.visual.v1`, `msg.sensor.depth.v1` | typed visual and depth raster formats and transfer parts |
| `msg.sensor.camera.v1`, `msg.sensor.rgbd.v1` | camera calibration, camera source cycles, and paired RGB-D samples |
| `msg.sensor.radar.v1` | time-stamped rotating sectors, sensor returns, and source cycles without tracked object IDs |
| `msg.sensor.lidar.v1`, `msg.sensor.pointcloud.v1` | native scan/point layouts, samples, and source cycles |
| `msg.localization.*`, `msg.mapping.*`, `msg.navigation.*` | estimation and autonomous motion products |
| `msg.perception.*` | perception queries, detections, and streams |

Runtime transport and execution-envelope schemas remain private kernel
implementation details. Public `ControlCycle` is domain metadata for the
versioned APIs that opt in; it does not expose or replace runtime request IDs,
transport timestamps, or execution reports.

## IO Note

Digital and analog I/O contracts reuse indexed primitive wrappers. Input and
output APIs are separate because a physical device may support only one
direction.

## Full Inventory

See the generated [Message Index](message-index.md) for every message and field.

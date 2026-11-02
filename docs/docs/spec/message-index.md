# Message Index

This page is generated from `spec/messages`. Message schemas contain payload data only. Runtime transport and timing metadata belong to the Event or Control envelope.

| Message set | Description | Messages |
| --- | --- | ---: |
| `msg.actuator.drive.v1` | Low-level drive command and state payloads for gateway contracts. | 2 |
| `msg.actuator.servo.v1` | Periodic servo Control request, typed domain response, and the low-level actuator payloads they carry. | 4 |
| `msg.control.v1` | Versioned public control-cycle metadata for cycle-based Control contracts. | 1 |
| `msg.core.common.primitive.v1` | Canonical common wrapper and utility message set for primitive payloads and empty bodies. | 18 |
| `msg.core.common.result.v1` | Generic terminal result payload for procedures and operations. | 1 |
| `msg.core.kinematics.v1` | Canonical kinematics message set for robot-family-agnostic motion representations. | 8 |
| `msg.core.linalg.v1` | Dense linear algebra containers used by controller and kinematics API contracts. | 1 |
| `msg.core.spatial.v1` | Canonical shared spatial message set for base math types, semantic physical quantities, and rigid-body spatial quantities used across robotics domains. | 11 |
| `msg.diagnostics.health.v1` | Provider-owned health and fault payloads. | 2 |
| `msg.io.digital.timed_output.v1` | Periodic digital output Control request and typed response. | 2 |
| `msg.localization.v1` | Localization payload family for self-pose estimation status. | 2 |
| `msg.locomotion.legged.v1` | Legged locomotion payloads shared by quadruped and humanoid systems. | 10 |
| `msg.locomotion.mobile_base.v1` | Canonical wheeled mobile-base payload family for platform state, odometry, safety state, and optional differential-drive helpers. | 10 |
| `msg.locomotion.velocity.v1` | Canonical shared locomotion body-velocity payload family for timed control, acknowledgements, limits, and stop requests. | 4 |
| `msg.mapping.v1` | Mapping payload family for occupancy-style map publication. | 2 |
| `msg.motion.articulated.v1` | Articulated-motion payloads shared by jointed mechanisms. | 4 |
| `msg.motion.execution.v1` | Programmed-motion execution state and speed-scaling payloads. | 2 |
| `msg.motion.manipulator.v1` | Canonical manipulator motion payloads built on shared articulated, spatial, and kinematic foundations. | 20 |
| `msg.navigation.v1` | Navigation payload family for goal-based autonomous motion. | 6 |
| `msg.perception.v1` | Perception payload family for object detection, pose estimation, and grasp planning outputs. | 7 |
| `msg.positioning.v1` | Absolute positioning measurements produced by positioning gateways. | 1 |
| `msg.sensor.camera.v1` | Camera source Control API messages with actual sample time and typed visual transfer parts. | 4 |
| `msg.sensor.depth.v1` | Typed depth sample formats and transfer parts preserving measurement meaning. | 5 |
| `msg.sensor.gnss.v1` | Receiver-reported GNSS fix samples and source Control messages. | 3 |
| `msg.sensor.lidar.v1` | Native LiDAR scan formats, samples, transfer parts, and source Control messages. | 6 |
| `msg.sensor.pointcloud.v1` | Typed point-cloud field layouts, samples, transfer parts, and source Control messages. | 6 |
| `msg.sensor.radar.v1` | Integrated rotating radar sector samples and source Control messages; no external motor is required. | 4 |
| `msg.sensor.rgbd.v1` | Paired, typed RGB-D source samples with per-plane timing and calibration. | 5 |
| `msg.stream.v1` | Shared stream identity, codec profile, bounded payload chunk, and transfer-part metadata. | 5 |
| `msg.visual.v1` | Typed visual sample formats and transfer parts for camera sources and display sinks. | 6 |

<a id="msg-actuator-drive-v1"></a>
## `msg.actuator.drive.v1`

Low-level drive command and state payloads for gateway contracts.

### `DriveCommand`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `channels` | `vector<uint32>` | yes | - |
| `mode` | `vector<uint8>` | yes | - |
| `target` | `vector<float64>` | yes | - |
| `feedforward` | `vector<float64>` | no | - |

### `DriveState`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `channels` | `vector<uint32>` | yes | - |
| `position` | `vector<float64>` | yes | - |
| `velocity` | `vector<float64>` | yes | - |
| `effort` | `vector<float64>` | no | - |
| `enabled` | `vector<bool>` | yes | - |
| `fault_code` | `vector<uint32>` | no | - |

<a id="msg-actuator-servo-v1"></a>
## `msg.actuator.servo.v1`

Periodic servo Control request, typed domain response, and the low-level actuator payloads they carry.

Imports: `msg.control.v1`, `msg.core.kinematics.v1`, `msg.core.linalg.v1`.

### `ActuatorCommand`

Low-level actuator command for deterministic servo links. Execution time and validity are carried by the control envelope.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `emergency` | `bool` | yes | True when the command is an emergency or protective-stop command. |
| `servo_cmd` | `uint8` | yes | Controller-defined servo command code such as enable, disable, or fault reset. |
| `drive_mode` | `vector<uint8>` | yes | Per-axis drive mode values. |
| `target` | `msg.core.kinematics/JointCommandPrecise` | yes | - |
| `stiffness` | `msg.core.linalg/DenseMatrix` | no | - |
| `damping` | `msg.core.linalg/DenseMatrix` | no | - |

### `ActuatorState`

Low-level actuator state frame returned by a servo link.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `link_alive` | `bool` | yes | - |
| `servo_on` | `bool` | yes | - |
| `state` | `msg.core.kinematics/JointStatePrecise` | yes | - |
| `error_code` | `vector<uint8>` | no | - |
| `error_raw` | `vector<uint16>` | no | - |

### `ServoControlRequest`

Periodic servo Control request carrying one actuator command per cycle.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `command` | `ActuatorCommand` | yes | - |

### `ServoControlResponse`

Domain application status and sampled actuator link state. Runtime execution completion remains in the runtime response envelope.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `status` | `string` | yes | applied, rejected, or device_error. |
| `state` | `ActuatorState` | no | - |
| `detail` | `string` | no | - |

<a id="msg-control-v1"></a>
## `msg.control.v1`

Versioned public control-cycle metadata for cycle-based Control contracts.

### `ControlCycle`

Domain-level cycle identity and intent. Runtime request IDs, transport timestamps, deadlines, and execution reports remain in the runtime envelope.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `generation` | `int64` | yes | Explicit binding control generation. A new owner or restarted control session uses a new generation; packets from earlier generations cannot refresh ownership. |
| `sequence` | `int64` | yes | Strictly increasing cycle sequence within one generation. |
| `intent` | `string` | yes | One of command, keep, or sample. Each API contract declares which intents its refresh mode permits and the payload conditions for each intent. |
| `state_revision` | `int64` | yes | Revision of caller-owned retained command state. It is positive for command and keep intents; sample-exchange APIs without caller-owned state use zero. |

<a id="msg-core-common-primitive-v1"></a>
## `msg.core.common.primitive.v1`

Canonical common wrapper and utility message set for primitive payloads and empty bodies.

### `Empty`

Explicit empty payload used instead of raw null or omitted bodies.

This message has no payload fields.

### `BoolValue`

Canonical wrapped boolean payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `bool` | yes | - |

### `Int32Value`

Canonical wrapped int32 payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `int32` | yes | - |

### `UInt32Value`

Canonical wrapped uint32 payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `uint32` | yes | - |

### `UInt32Vector`

Canonical wrapped uint32 vector payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `values` | `vector<uint32>` | yes | - |

### `Int64Value`

Canonical wrapped int64 payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `int64` | yes | - |

### `Float32Value`

Canonical wrapped float32 payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `float32` | yes | - |

### `Float32Vector`

Canonical wrapped float32 vector payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `values` | `vector<float32>` | yes | - |

### `Float64Value`

Canonical wrapped float64 payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `float64` | yes | - |

### `BoolVector`

Canonical wrapped boolean vector payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `values` | `vector<bool>` | yes | - |

### `StringValue`

Canonical wrapped string payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `string` | yes | - |

### `BytesValue`

Canonical wrapped bytes payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `bytes` | yes | - |

### `TimestampNs`

Nanosecond timestamp wrapper used when a named scalar time payload is needed.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `int64` | yes | - |

### `DurationNs`

Nanosecond duration wrapper used when a named scalar duration payload is needed.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `int64` | yes | - |

### `IndexedBoolValue`

Generic indexed boolean payload used by channel-addressed interfaces such as digital IO.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `index` | `uint32` | yes | - |
| `value` | `bool` | yes | - |

### `IndexedFloat32Value`

Generic indexed float32 payload used by channel-addressed interfaces such as analog IO.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `index` | `uint32` | yes | - |
| `value` | `float32` | yes | - |

### `IndexedBoolVector`

Generic indexed boolean vector payload for batched channel-addressed updates.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `indices` | `vector<uint32>` | yes | - |
| `values` | `vector<bool>` | yes | - |

### `IndexedFloat32Vector`

Generic indexed float32 vector payload for batched channel-addressed updates.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `indices` | `vector<uint32>` | yes | - |
| `values` | `vector<float32>` | yes | - |

<a id="msg-core-common-result-v1"></a>
## `msg.core.common.result.v1`

Generic terminal result payload for procedures and operations.

### `Result`

Terminal result of a procedure or operation.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `success` | `bool` | yes | - |
| `status` | `string` | yes | - |
| `detail` | `bytes` | no | - |

<a id="msg-core-kinematics-v1"></a>
## `msg.core.kinematics.v1`

Canonical kinematics message set for robot-family-agnostic motion representations.

Imports: `msg.core.spatial.v1`.

### `JointValues`

Generic joint vector for an articulated chain.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `names` | `vector<string>` | no | - |
| `values` | `vector<float32>` | yes | - |

### `JointLimits`

Limit values for a single articulated joint.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | - |
| `min_position` | `float32` | yes | - |
| `max_position` | `float32` | yes | - |
| `max_velocity` | `float32` | yes | - |
| `max_acceleration` | `float32` | yes | - |
| `max_effort` | `float32` | yes | - |

### `JointState`

Measured joint state for an articulated chain.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `names` | `vector<string>` | no | - |
| `position` | `vector<float32>` | yes | - |
| `velocity` | `vector<float32>` | no | - |
| `effort` | `vector<float32>` | no | - |

### `JointVelocity`

Joint-space velocity command for an articulated chain.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `names` | `vector<string>` | no | - |
| `values` | `vector<float32>` | yes | - |

### `JointCommand`

Commanded joint targets for an articulated chain.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `names` | `vector<string>` | no | - |
| `target_position` | `vector<float32>` | no | - |
| `target_velocity` | `vector<float32>` | no | - |
| `target_effort` | `vector<float32>` | no | - |

### `JointStatePrecise`

Double-precision measured joint state for servo and high-rate controller links.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `names` | `vector<string>` | no | - |
| `position` | `vector<float64>` | yes | - |
| `velocity` | `vector<float64>` | no | - |
| `effort` | `vector<float64>` | no | - |

### `JointCommandPrecise`

Double-precision commanded joint targets for servo and high-rate controller links.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `names` | `vector<string>` | no | - |
| `target_position` | `vector<float64>` | no | - |
| `target_velocity` | `vector<float64>` | no | - |
| `target_effort` | `vector<float64>` | no | - |

### `KinematicChainState`

Combined articulated-chain state with task-space pose and twist.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `chain_id` | `string` | yes | - |
| `joint_state` | `JointState` | yes | - |
| `tip_pose` | `msg.core.spatial/Pose` | no | - |
| `tip_twist` | `msg.core.spatial/Twist` | no | - |

<a id="msg-core-linalg-v1"></a>
## `msg.core.linalg.v1`

Dense linear algebra containers used by controller and kinematics API contracts.

### `DenseMatrix`

Row-major dense matrix with double-precision values.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `rows` | `uint32` | yes | - |
| `cols` | `uint32` | yes | - |
| `values` | `vector<float64>` | yes | - |

<a id="msg-core-spatial-v1"></a>
## `msg.core.spatial.v1`

Canonical shared spatial message set for base math types, semantic physical quantities, and rigid-body spatial quantities used across robotics domains.

### `Vector3`

Generic free 3-axis vector used when the surrounding type carries the semantics of the quantity.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `x` | `float32` | yes | - |
| `y` | `float32` | yes | - |
| `z` | `float32` | yes | - |

### `Quaternion`

Quaternion orientation expressed as x, y, z, w.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `x` | `float32` | yes | - |
| `y` | `float32` | yes | - |
| `z` | `float32` | yes | - |
| `w` | `float32` | yes | - |

### `Position`

3D position point in meters, kept separate from Vector3 because it represents a location rather than a free vector.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `x` | `float32` | yes | - |
| `y` | `float32` | yes | - |
| `z` | `float32` | yes | - |

### `Pose`

Pure rigid pose value. The owning message or API contract declares the frame in which it is expressed.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `position` | `Position` | yes | Position point of the pose origin. |
| `orientation` | `Quaternion` | yes | Quaternion orientation of the pose. |

### `Covariance6x6`

Fixed 6x6 covariance matrix container for spatial estimates.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `values` | `array<float32, 36>` | yes | Row-major covariance entries. The owning message defines the state ordering associated with the six dimensions. |

### `Force`

3-axis linear force. Field names stay x, y, z because the surrounding type already carries the physical meaning.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `x` | `float32` | yes | - |
| `y` | `float32` | yes | - |
| `z` | `float32` | yes | - |

### `Torque`

3-axis torque (moment) vector. Field names stay x, y, z; angular meaning comes from the surrounding type rather than rx, ry, rz naming.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `x` | `float32` | yes | - |
| `y` | `float32` | yes | - |
| `z` | `float32` | yes | - |

### `Wrench`

Pure rigid-body wrench value. The owning message or API contract declares its expression frame.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `force` | `Force` | yes | Linear force component. |
| `torque` | `Torque` | yes | Torque component about the same frame axes. |

### `Twist`

Pure rigid-body spatial velocity. The owning message or API contract declares its expression frame.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `linear` | `Vector3` | yes | Linear velocity of the chosen reference point. |
| `angular` | `Vector3` | yes | Angular velocity of the same rigid body. |

### `Accel`

Pure rigid-body spatial acceleration. The owning message or API contract declares its expression frame.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `linear` | `Vector3` | yes | Linear acceleration component. |
| `angular` | `Vector3` | yes | Angular acceleration component. |

### `Inertia`

Symmetric inertia tensor components about a common reference.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ixx` | `float32` | yes | - |
| `iyy` | `float32` | yes | - |
| `izz` | `float32` | yes | - |
| `ixy` | `float32` | yes | - |
| `ixz` | `float32` | yes | - |
| `iyz` | `float32` | yes | - |

<a id="msg-diagnostics-health-v1"></a>
## `msg.diagnostics.health.v1`

Provider-owned health and fault payloads.

### `HealthStatus`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `state` | `string` | yes | - |
| `summary` | `string` | yes | - |
| `fault_codes` | `vector<uint32>` | no | - |
| `detail` | `bytes` | no | - |

### `ClearFaultRequest`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `fault_code` | `uint32` | no | - |

<a id="msg-io-digital-timed-output-v1"></a>
## `msg.io.digital.timed_output.v1`

Periodic digital output Control request and typed response.

Imports: `msg.control.v1`, `msg.core.common.primitive.v1`.

### `TimedOutputControlRequest`

A command establishes or replaces the output state. A keep cycle carries no output payload and explicitly maintains the same positive state_revision.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `output` | `msg.core.common.primitive/IndexedBoolValue` | no | - |

### `TimedOutputControlResponse`

Typed output-domain result. observed_value is present only when provider hardware supplies an actual readback; command application is not physical readback.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `status` | `string` | yes | applied, rejected, or device_error. |
| `channel_index` | `uint32` | yes | - |
| `observed_value` | `bool` | no | - |
| `detail` | `string` | no | - |

<a id="msg-localization-v1"></a>
## `msg.localization.v1`

Localization payload family for self-pose estimation status.

Imports: `msg.core.spatial.v1`.

### `PoseEstimate`

Estimated robot pose with spatial uncertainty.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | Reference frame in which the estimated pose is expressed. |
| `pose` | `msg.core.spatial/Pose` | yes | Mean self-pose estimate. |
| `covariance` | `msg.core.spatial/Covariance6x6` | yes | Pose covariance expressed in the ordering defined by the consuming localization API contract. |
| `quality` | `float32` | no | Optional normalized quality score from the estimator. |
| `source` | `string` | no | Optional estimator or source identifier. |

### `LocalizationStatus`

Summary state for a localization subsystem.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `state` | `string` | yes | - |
| `quality` | `float32` | no | - |
| `map_id` | `string` | no | - |

<a id="msg-locomotion-legged-v1"></a>
## `msg.locomotion.legged.v1`

Legged locomotion payloads shared by quadruped and humanoid systems.

Imports: `msg.core.spatial.v1`.

### `ContactState`

Contact state for a single support/contact point.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `contact_id` | `string` | yes | - |
| `active` | `bool` | yes | - |
| `contact_force` | `msg.core.spatial/Force` | no | - |
| `contact_pose` | `msg.core.spatial/Pose` | no | - |

### `ContactArray`

Aggregated contact state payload for a locomotion system.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `states` | `vector<ContactState>` | yes | - |

### `FootPose`

Named foothold or end-effector pose used by locomotion controllers.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `foot_id` | `string` | yes | - |
| `pose` | `msg.core.spatial/Pose` | yes | - |

### `FootState`

State for a locomotion contact point or foot endpoint.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `foot_id` | `string` | yes | - |
| `pose` | `msg.core.spatial/Pose` | yes | - |
| `in_contact` | `bool` | yes | - |
| `contact_force` | `msg.core.spatial/Force` | no | - |

### `SupportPolygon`

Support polygon expressed as planar points in body or world coordinates.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | - |
| `vertices` | `vector<msg.core.spatial/Position>` | yes | - |

### `StepTarget`

Next planned foothold target for a locomotion contact point.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `foot_id` | `string` | yes | - |
| `target_pose` | `msg.core.spatial/Pose` | yes | - |
| `swing_duration` | `float32` | yes | - |

### `BodyState`

Locomotion body state independent of concrete robot morphology.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `body_pose` | `msg.core.spatial/Pose` | yes | - |
| `body_twist` | `msg.core.spatial/Twist` | no | - |

### `CenterOfMassState`

Center-of-mass state for balance and locomotion control.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `position` | `msg.core.spatial/Position` | yes | - |
| `velocity` | `msg.core.spatial/Vector3` | no | - |
| `acceleration` | `msg.core.spatial/Vector3` | no | - |

### `BalanceState`

High-level balance indicators shared by legged systems.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `stable` | `bool` | yes | - |
| `support_polygon` | `SupportPolygon` | no | - |
| `center_of_mass` | `CenterOfMassState` | no | - |

### `GaitPhase`

Named gait phase for locomotion sequencing.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `phase_name` | `string` | yes | - |
| `phase_progress` | `float32` | yes | - |
| `active_contacts` | `vector<string>` | yes | - |

<a id="msg-locomotion-mobile-base-v1"></a>
## `msg.locomotion.mobile_base.v1`

Canonical wheeled mobile-base payload family for platform state, odometry, safety state, and optional differential-drive helpers.

Imports: `msg.core.spatial.v1`.

### `ControllerModeState`

Active operating mode of a wheeled mobile-base controller.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `string` | yes | Canonical values are disabled, hold, active, fault, and stopping. |

### `MobileBaseState`

Runtime state of a mobile-base controller.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `drive_enabled` | `bool` | yes | - |
| `fault_active` | `bool` | yes | - |
| `mode` | `ControllerModeState` | yes | - |
| `command_age_ms` | `uint32` | no | - |
| `applied_twist` | `msg.core.spatial/Twist` | no | - |

### `FaultState`

Fault summary for a mobile-base controller.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `fault_active` | `bool` | yes | - |
| `fault_code` | `string` | no | - |
| `fault_text` | `string` | no | - |

### `Odometry`

Estimated body pose and twist for a wheeled platform.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | no | Parent odometry frame. Defaults to odom when omitted. |
| `child_frame_id` | `string` | no | Child base frame. Defaults to base_link when omitted. |
| `pose` | `msg.core.spatial/Pose` | yes | - |
| `twist` | `msg.core.spatial/Twist` | no | - |

### `EnableDriveRequest`

Request to enable or keep disabled the mobile-base drive.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `enable` | `bool` | yes | - |
| `reason` | `string` | no | - |

### `DisableDriveRequest`

Request to disable mobile-base drive output.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `reason` | `string` | no | - |

### `ClearFaultRequest`

Request to clear a latched mobile-base fault.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `fault_code` | `string` | no | - |

### `DiffDriveKinematics`

Differential-drive geometric and wheel-speed limits.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `wheel_radius_m` | `float32` | yes | - |
| `track_width_m` | `float32` | yes | - |
| `max_wheel_radps` | `float32` | no | - |

### `WheelCommand`

Differential-drive wheel velocity command.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `left_radps` | `float32` | yes | - |
| `right_radps` | `float32` | yes | - |

### `WheelState`

Differential-drive wheel position and velocity state.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `left_position_rad` | `float32` | yes | - |
| `right_position_rad` | `float32` | yes | - |
| `left_velocity_radps` | `float32` | yes | - |
| `right_velocity_radps` | `float32` | yes | - |

<a id="msg-locomotion-velocity-v1"></a>
## `msg.locomotion.velocity.v1`

Canonical shared locomotion body-velocity payload family for timed control, acknowledgements, limits, and stop requests.

Imports: `msg.core.spatial.v1`.

### `VelocityCommand`

Body-velocity command payload. Command frame, execution time, and validity are defined by the API and control envelope.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `twist` | `msg.core.spatial/Twist` | yes | Body twist command in the controller's declared command frame. |
| `source` | `string` | no | Optional command source identifier. |
| `sequence` | `int64` | no | Optional source-local monotonically increasing sequence. |

### `CommandAck`

Domain acknowledgement for locomotion requests. Runtime execution timing is reported by the response envelope.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `accepted` | `bool` | yes | - |
| `reason` | `string` | yes | - |
| `applied_twist` | `msg.core.spatial/Twist` | no | Applied or clamped twist. |
| `deadline_missed` | `bool` | no | - |

### `VelocityLimits`

Runtime velocity and acceleration limits for locomotion velocity control.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `max_linear_x_mps` | `float32` | yes | - |
| `max_linear_y_mps` | `float32` | no | - |
| `max_linear_z_mps` | `float32` | no | - |
| `max_angular_x_radps` | `float32` | no | - |
| `max_angular_y_radps` | `float32` | no | - |
| `max_angular_z_radps` | `float32` | yes | - |
| `max_linear_accel_mps2` | `float32` | no | - |
| `max_angular_accel_radps2` | `float32` | no | - |

### `StopRequest`

Controlled stop request for a locomotion controller.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ramp_time_ns` | `int64` | no | - |

<a id="msg-mapping-v1"></a>
## `msg.mapping.v1`

Mapping payload family for occupancy-style map publication.

Imports: `msg.core.spatial.v1`.

### `OccupancyGridMap`

Occupancy-grid style map payload for mapping publication.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `map_id` | `string` | yes | - |
| `frame_id` | `string` | yes | - |
| `resolution` | `float32` | yes | - |
| `width` | `uint32` | yes | - |
| `height` | `uint32` | yes | - |
| `origin` | `msg.core.spatial/Pose` | yes | - |
| `data` | `bytes` | yes | - |

### `MapStatus`

Summary status for a mapping subsystem.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `map_id` | `string` | yes | - |
| `state` | `string` | yes | - |

<a id="msg-motion-articulated-v1"></a>
## `msg.motion.articulated.v1`

Articulated-motion payloads shared by jointed mechanisms.

Imports: `msg.core.kinematics.v1`.

### `JointWayPoint`

Joint-space waypoint and motion tuning values for articulated motion.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `q` | `msg.core.kinematics/JointValues` | yes | - |
| `radius` | `float32` | yes | - |
| `vel` | `float32` | yes | - |
| `cornering_vel` | `float32` | yes | - |
| `acc` | `float32` | yes | - |

### `RampRequest`

Optional ramp duration for a stop or pause transition.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ramp_time_ns` | `int64` | no | - |

### `MoveJRequest`

Joint-space programmed-motion request.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `waypoints` | `vector<JointWayPoint>` | yes | - |
| `finish_mode` | `string` | no | - |

### `TrajectoryOffset`

Joint-space offset applied to an active programmed trajectory.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `offset` | `msg.core.kinematics/JointValues` | yes | - |
| `mode` | `string` | no | - |

<a id="msg-motion-execution-v1"></a>
## `msg.motion.execution.v1`

Programmed-motion execution state and speed-scaling payloads.

### `ExecutionState`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `state` | `string` | yes | - |
| `active_operation_id` | `string` | no | - |
| `progress` | `float32` | no | - |
| `speed_scaling` | `float32` | yes | - |
| `reason` | `string` | no | - |

### `SpeedScaling`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `float32` | yes | - |

<a id="msg-motion-manipulator-v1"></a>
## `msg.motion.manipulator.v1`

Canonical manipulator motion payloads built on shared articulated, spatial, and kinematic foundations.

Imports: `msg.core.kinematics.v1`, `msg.core.spatial.v1`.

### `TCP`

Tool center point definition.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `pose` | `msg.core.spatial/Pose` | yes | - |

### `Payload`

Tool payload definition.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `mass` | `float32` | yes | - |
| `center_of_mass` | `msg.core.spatial/Position` | yes | - |
| `inertia` | `msg.core.spatial/Inertia` | yes | - |

### `TaskWayPoint`

Cartesian waypoint and motion tuning values for tool- or TCP-oriented manipulation.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `pose` | `msg.core.spatial/Pose` | yes | - |
| `radius` | `float32` | yes | - |
| `vel` | `float32` | yes | - |
| `cornering_vel` | `float32` | yes | - |
| `acc` | `float32` | yes | - |

### `ToolSettings`

Combined payload and TCP tool definition.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `payload` | `Payload` | yes | - |
| `tcp` | `TCP` | yes | - |

### `MotionFeedback`

Generic feedback state for long-running manipulator motion.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `state` | `string` | yes | - |
| `progress` | `float32` | no | - |

### `MotionState`

Current manipulator motion state for state publication and action state reporting.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `string` | yes | - |
| `progress` | `float32` | no | - |

### `MotionResult`

Generic result body for manipulator motion completion.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `completed` | `bool` | yes | - |
| `detail` | `string` | no | - |

### `InverseKinematicsResult`

Result body for inverse-kinematics queries.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `valid` | `bool` | yes | - |
| `joints` | `msg.core.kinematics/JointValues` | yes | - |
| `detail` | `string` | no | - |

### `MoveLRequest`

Linear Cartesian programmed-motion request.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `waypoints` | `vector<TaskWayPoint>` | yes | - |
| `finish_mode` | `string` | no | - |

### `MoveCRequest`

Circular Cartesian programmed-motion request.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `via_point` | `TaskWayPoint` | yes | - |
| `target_point` | `TaskWayPoint` | yes | - |
| `finish_mode` | `string` | no | - |

### `SetTcpRequest`

Tool center point update request.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `tcp` | `TCP` | yes | - |

### `SetPayloadRequest`

Tool payload update request.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `payload` | `Payload` | yes | - |
| `transition_time_ns` | `int64` | no | - |

### `CartesianOffset`

Cartesian offset applied to active manipulator motion.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | - |
| `offset` | `msg.core.spatial/Pose` | yes | - |

### `WrenchCommand`

Cartesian wrench target expressed in the declared frame.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | - |
| `wrench` | `msg.core.spatial/Wrench` | yes | - |

### `ToolCalibrationRequest`

Request provider-owned TCP or payload calibration.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `mode` | `string` | yes | - |
| `samples` | `uint32` | no | - |

### `ToolCalibrationResult`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `valid` | `bool` | yes | - |
| `settings` | `ToolSettings` | no | - |
| `detail` | `string` | no | - |

### `ForwardKinematicsRequest`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `joints` | `msg.core.kinematics/JointValues` | yes | - |

### `ForwardKinematicsResult`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `valid` | `bool` | yes | - |
| `pose` | `msg.core.spatial/Pose` | yes | - |
| `frame_id` | `string` | yes | - |

### `InverseKinematicsRequest`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `target_pose` | `msg.core.spatial/Pose` | yes | - |
| `frame_id` | `string` | yes | - |
| `seed` | `msg.core.kinematics/JointValues` | no | - |

### `HandGuidingState`

No message description.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `enabled` | `bool` | yes | - |
| `mode` | `string` | no | - |

<a id="msg-navigation-v1"></a>
## `msg.navigation.v1`

Navigation payload family for goal-based autonomous motion.

Imports: `msg.core.spatial.v1`.

### `NavigationPath`

Ordered path as a sequence of target poses.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | Common reference frame for all waypoints. |
| `waypoints` | `vector<msg.core.spatial/Pose>` | yes | - |

### `NavigateToPoseRequest`

Goal request for autonomous navigation to a single pose.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | Reference frame for target_pose. |
| `target_pose` | `msg.core.spatial/Pose` | yes | - |
| `behavior_id` | `string` | no | - |

### `FollowPathRequest`

Goal request for following an explicit path.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | `NavigationPath` | yes | - |
| `controller_id` | `string` | no | - |

### `NavigationFeedback`

Progress feedback for a running navigation task.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `state` | `string` | yes | - |
| `remaining_distance` | `float32` | no | - |

### `NavigationResult`

Result body for a completed navigation task.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `completed` | `bool` | yes | - |
| `detail` | `string` | no | - |

### `NavigationState`

Summary state for a navigation subsystem or running goal.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `state` | `string` | yes | - |
| `active_goal_id` | `string` | no | - |

<a id="msg-perception-v1"></a>
## `msg.perception.v1`

Perception payload family for object detection, pose estimation, and grasp planning outputs.

Imports: `msg.core.spatial.v1`.

### `BoundingBox2D`

Image-plane bounding box for a 2D detection.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `x` | `float32` | yes | - |
| `y` | `float32` | yes | - |
| `width` | `float32` | yes | - |
| `height` | `float32` | yes | - |

### `Detection2D`

Single 2D detection result from a perception subsystem.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `class_id` | `string` | yes | - |
| `score` | `float32` | yes | - |
| `bbox` | `BoundingBox2D` | yes | - |
| `tracking_id` | `string` | no | - |

### `Detection2DArray`

Collection of 2D detections for one frame.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `source_frame_id` | `string` | yes | - |
| `detections` | `vector<Detection2D>` | yes | - |

### `ObjectPose`

Estimated object pose in a named frame.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `class_id` | `string` | yes | - |
| `score` | `float32` | yes | - |
| `frame_id` | `string` | yes | - |
| `pose` | `msg.core.spatial/Pose` | yes | - |
| `covariance` | `msg.core.spatial/Covariance6x6` | no | Optional pose covariance when the perception subsystem can estimate uncertainty. |
| `tracking_id` | `string` | no | - |

### `ObjectPoseArray`

Collection of object-pose estimates for one observation step.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `objects` | `vector<ObjectPose>` | yes | - |

### `GraspCandidate`

Candidate grasp pose estimated from perception output.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | - |
| `grasp_pose` | `msg.core.spatial/Pose` | yes | - |
| `score` | `float32` | yes | - |
| `opening_width` | `float32` | no | - |
| `object_id` | `string` | no | - |

### `GraspCandidateArray`

Ranked grasp candidates for a target object or scene.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `candidates` | `vector<GraspCandidate>` | yes | - |

<a id="msg-positioning-v1"></a>
## `msg.positioning.v1`

Absolute positioning measurements produced by positioning gateways.

Imports: `msg.core.spatial.v1`.

### `AbsolutePoseFix`

A measured body pose in a global reference frame.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | Global reference frame in which the measurement is expressed. |
| `child_frame_id` | `string` | yes | Body frame measured by the positioning device. |
| `pose` | `msg.core.spatial/Pose` | yes | - |
| `covariance` | `msg.core.spatial/Covariance6x6` | yes | - |
| `quality` | `float32` | no | - |
| `source` | `string` | no | - |

<a id="msg-sensor-camera-v1"></a>
## `msg.sensor.camera.v1`

Camera source Control API messages with actual sample time and typed visual transfer parts.

Imports: `msg.control.v1`, `msg.stream.v1`, `msg.visual.v1`.

### `CameraIntrinsics`

Pinhole camera calibration associated with a camera format revision.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `width` | `uint32` | yes | - |
| `height` | `uint32` | yes | - |
| `fx` | `float64` | yes | - |
| `fy` | `float64` | yes | - |
| `cx` | `float64` | yes | - |
| `cy` | `float64` | yes | - |
| `distortion_model` | `string` | no | - |
| `distortion_coefficients` | `vector<float64>` | no | - |

### `CameraStreamFormat`

Camera calibration and visual format fixed by one format revision.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `camera_frame_id` | `string` | yes | - |
| `intrinsics` | `CameraIntrinsics` | yes | - |
| `visual_format` | `msg.visual/VisualStreamFormat` | yes | - |
| `calibration_revision` | `int64` | yes | - |

### `CameraCycleRequest`

Requests a prepared sample for this sample-exchange cycle. The provider may return no new sample while the Control connection remains healthy.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `after_sample_id` | `int64` | no | - |
| `after_unit_sequence` | `int64` | no | - |
| `resync_required` | `bool` | no | - |

### `CameraCycleResponse`

One prepared visual transfer part or a normal no-new-sample result. Source sample acquisition and expiry stay attached to the part and never inherit poll time.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `status` | `string` | yes | sample_available, no_new_sample, resync_required, unsupported_configuration, or device_error. |
| `part` | `msg.visual/VisualTransferPart` | no | - |
| `camera_format` | `CameraStreamFormat` | no | - |
| `detail` | `string` | no | - |

<a id="msg-sensor-depth-v1"></a>
## `msg.sensor.depth.v1`

Typed depth sample formats and transfer parts preserving measurement meaning.

Imports: `msg.control.v1`, `msg.stream.v1`.

### `DepthCycleRequest`

Requests a prepared depth sample for a sample-exchange cycle.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `after_sample_id` | `int64` | no | - |
| `after_unit_sequence` | `int64` | no | - |
| `resync_required` | `bool` | no | - |

### `DepthCycleResponse`

One prepared depth transfer part or a normal no-new-sample result.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `status` | `string` | yes | sample_available, no_new_sample, resync_required, unsupported_format, or device_error. |
| `part` | `DepthTransferPart` | no | - |
| `detail` | `string` | no | - |

### `DepthStreamFormat`

Immutable depth plane layout and measurement scale for one format revision. element_type is uint16, uint32, or float32; invalid-value and loss rules are explicit.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `width` | `uint32` | yes | - |
| `height` | `uint32` | yes | - |
| `element_type` | `string` | yes | - |
| `endianness` | `string` | yes | little or big byte order for multibyte depth samples. |
| `row_stride_bytes` | `uint32` | yes | - |
| `meters_per_unit` | `float64` | yes | - |
| `invalid_value_rule` | `string` | yes | Explicit sentinel, mask, NaN, or other invalid-pixel rule. |
| `frame_id` | `string` | yes | - |
| `calibration_revision` | `int64` | yes | - |
| `loss_policy` | `string` | yes | lossless or bounded_error. |
| `maximum_absolute_error_m` | `float32` | no | - |
| `codec` | `msg.stream/CodecDescriptor` | no | - |
| `limits` | `msg.stream/StreamLimits` | yes | - |

### `DepthSample`

Complete reassembled depth measurement plane.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `header` | `msg.stream/TransferPartHeader` | yes | - |
| `format` | `DepthStreamFormat` | yes | - |
| `payload_bytes` | `bytes` | yes | - |

### `DepthTransferPart`

Typed depth sample identity, format revision, and one bounded payload chunk.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `header` | `msg.stream/TransferPartHeader` | yes | - |
| `chunk` | `msg.stream/EncodedChunk` | yes | - |
| `format` | `DepthStreamFormat` | no | - |

<a id="msg-sensor-gnss-v1"></a>
## `msg.sensor.gnss.v1`

Receiver-reported GNSS fix samples and source Control messages.

Imports: `msg.control.v1`.

### `GnssCycleRequest`

Requests the latest prepared GNSS fix using a sample-exchange cycle. Omit expected_session_id only to discover the source session. after_sample_id is a nonnegative cursor and must be zero or omitted while bootstrapping. The source may return its latest fix and skip intermediate sample IDs.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `expected_session_id` | `string` | no | Source process identity last adopted by the client. |
| `after_sample_id` | `int64` | no | Last consumed sample ID in expected_session_id. Intermediate IDs may be skipped because this source retains only the latest fix. |

### `GnssCycleResponse`

Reports the current source session on every response. A changed session returns resync_required without a fix; the client adopts session_id and restarts its cursor. sample_available contains a receiver sample, including a normal no-fix state. no_new_sample means no new receiver sample exists.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `session_id` | `string` | yes | Unique process/reset identity for this GNSS source. |
| `status` | `string` | yes | sample_available, no_new_sample, resync_required, or device_error. |
| `fix` | `GnssFix` | no | - |
| `detail` | `string` | no | Optional provider detail for a domain status. |

### `GnssFix`

One receiver-reported antenna position sample. No robot pose, yaw, truth identity, or localization result is implied. A no_fix mode is a valid new receiver sample, distinct from a response with no new sample. Position coordinates are WGS84 geodetic latitude and longitude. Acquisition time is expressed in r2kernel_sync only when the source has a known clock mapping. Any runtime transport receipt metadata remains separate from acquisition time; this Control response does not define a receipt timestamp field.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `session_id` | `string` | yes | Must match the enclosing GnssCycleResponse.session_id. |
| `sample_id` | `int64` | yes | Positive immutable identity for this receiver sample, strictly increasing within session_id. It may jump when latest-only polling skips samples. |
| `frame_id` | `string` | yes | Receiver antenna frame in which the antenna origin is located. |
| `fix_mode` | `string` | yes | unknown, no_fix, fix_2d, or fix_3d. A 2D or 3D fix requires latitude and longitude. unknown and no_fix carry no position fields and require correction_status=unknown. |
| `correction_status` | `string` | yes | Receiver-reported solution class: unknown, autonomous, differential, rtk_float, or rtk_fixed. It must be unknown without a valid solution; do not infer a class from correction input alone. |
| `observation_time_status` | `string` | yes | known_sync_time or unknown for the receiver measurement acquisition time. |
| `observed_at_sync_ns` | `int64` | no | Nonnegative acquisition time only when a verified source clock mapping translates the receiver time scale to r2kernel_sync. Omit when unknown; never substitute the gateway receive time. |
| `latitude_deg` | `float64` | no | WGS84 geodetic latitude in degrees, in [-90, 90], only for a valid fix. |
| `longitude_deg` | `float64` | no | WGS84 geodetic longitude in degrees, in [-180, 180], only for a valid fix. |
| `altitude_m` | `float64` | no | Optional receiver-provided altitude in [-10000000, 10000000] meters. Allowed only with fix_3d; its reference is required when present. |
| `altitude_reference` | `string` | no | wgs84_ellipsoid or mean_sea_level; required exactly when altitude_m is present and allowed only with fix_3d. |
| `position_covariance_m2` | `vector<float64>` | no | Optional 3x3 row-major positive-semidefinite covariance in the local ENU tangent frame, in square meters. Exactly nine finite values, each in [-1e12, 1e12]; allowed only with fix_3d. Two-dimensional uncertainty should use horizontal accuracy rather than inventing a vertical component. |
| `horizontal_accuracy_m` | `float64` | no | Positive receiver-reported horizontal error estimate up to 1e6 meters. |
| `vertical_accuracy_m` | `float64` | no | Positive receiver-reported vertical error estimate up to 1e6 meters; requires altitude_m and therefore a 3D fix. |
| `accuracy_confidence` | `string` | no | unknown, one_sigma, or 95_percent. Required when either accuracy estimate is present; unknown preserves an undocumented device confidence basis. |
| `hdop` | `float64` | no | Receiver-reported horizontal dilution of precision in (0, 1000]; not a meter-valued accuracy. |
| `vdop` | `float64` | no | Receiver-reported vertical dilution of precision in (0, 1000]; not a meter-valued accuracy. |
| `pdop` | `float64` | no | Receiver-reported position dilution of precision in (0, 1000]; not a meter-valued accuracy. |
| `velocity_enu_mps` | `vector<float64>` | no | Optional receiver-reported east, north, up velocity in meters per second; exactly three finite values with speed at most 10000 m/s, present only with a valid 2D or 3D fix. |

<a id="msg-sensor-lidar-v1"></a>
## `msg.sensor.lidar.v1`

Native LiDAR scan formats, samples, transfer parts, and source Control messages.

Imports: `msg.control.v1`, `msg.stream.v1`.

### `LidarFieldDescriptor`

One field in a packed native return record.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | - |
| `semantic` | `string` | yes | Stable field meaning such as range, intensity, return_id, or time_offset_ns. |
| `scalar_type` | `string` | yes | Supported packed scalar type, explicitly defined by the selected profile. |
| `offset_bytes` | `uint32` | yes | - |
| `unit` | `string` | yes | - |

### `LidarStreamFormat`

Immutable native scan format. The field descriptors preserve sensor return, channel, unit, and per-return timing semantics without forcing XYZ conversion.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `frame_id` | `string` | yes | - |
| `layout_kind` | `string` | yes | angular_scan or native_records. |
| `angle_min_rad` | `float64` | no | - |
| `angle_increment_rad` | `float64` | no | - |
| `channel_count` | `uint32` | yes | - |
| `returns_per_measurement` | `uint32` | yes | - |
| `record_stride_bytes` | `uint32` | yes | - |
| `endianness` | `string` | yes | little or big byte order for packed multibyte return fields. |
| `fields` | `vector<LidarFieldDescriptor>` | yes | - |
| `scan_duration_ns` | `int64` | yes | - |
| `time_reference` | `string` | yes | scan_start or scan_end. |
| `invalid_return_rule` | `string` | yes | Explicit invalid-return representation or declaration that the device has none. |
| `loss_policy` | `string` | yes | lossless or bounded_error. |
| `maximum_range_error_m` | `float32` | no | - |
| `maximum_intensity_error` | `float32` | no | - |
| `preserves_return_order` | `bool` | yes | - |
| `codec` | `msg.stream/CodecDescriptor` | no | - |
| `limits` | `msg.stream/StreamLimits` | yes | - |

### `LidarScan`

Complete native LiDAR scan with packed records in the declared layout.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `header` | `msg.stream/TransferPartHeader` | yes | - |
| `format` | `LidarStreamFormat` | yes | - |
| `measurement_count` | `uint32` | yes | - |
| `payload_bytes` | `bytes` | yes | - |

### `LidarTransferPart`

Native scan identity and one bounded part of the packed scan payload.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `header` | `msg.stream/TransferPartHeader` | yes | - |
| `chunk` | `msg.stream/EncodedChunk` | yes | - |
| `format` | `LidarStreamFormat` | no | - |
| `measurement_count` | `uint32` | yes | - |

### `LidarCycleRequest`

Requests a prepared LiDAR scan for a sample-exchange cycle.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `after_sample_id` | `int64` | no | - |
| `after_unit_sequence` | `int64` | no | - |
| `resync_required` | `bool` | no | - |

### `LidarCycleResponse`

One prepared native scan part or a normal no-new-sample result.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `status` | `string` | yes | sample_available, no_new_sample, resync_required, unsupported_format, or device_error. |
| `part` | `LidarTransferPart` | no | - |
| `detail` | `string` | no | - |

<a id="msg-sensor-pointcloud-v1"></a>
## `msg.sensor.pointcloud.v1`

Typed point-cloud field layouts, samples, transfer parts, and source Control messages.

Imports: `msg.control.v1`, `msg.stream.v1`.

### `PointFieldDescriptor`

One named field in a packed point record.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | - |
| `semantic` | `string` | yes | Stable meaning such as x, y, z, intensity, ring, or time_offset_ns. |
| `scalar_type` | `string` | yes | Supported packed scalar type, explicitly defined by the selected profile. |
| `count` | `uint32` | yes | - |
| `offset_bytes` | `uint32` | yes | - |
| `unit` | `string` | yes | - |

### `PointCloudFormat`

Immutable field layout, reference frame, packed byte order, and compression policy. Lossy profiles declare positional error and point-order/count effects.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `coordinate_frame_id` | `string` | yes | - |
| `endianness` | `string` | yes | little or big. |
| `record_stride_bytes` | `uint32` | yes | - |
| `fields` | `vector<PointFieldDescriptor>` | yes | - |
| `codec` | `msg.stream/CodecDescriptor` | no | - |
| `loss_policy` | `string` | yes | lossless or bounded_error. |
| `maximum_position_error_m` | `float32` | no | - |
| `preserves_point_order` | `bool` | yes | - |
| `preserves_point_count` | `bool` | yes | - |
| `maximum_point_count_delta` | `uint32` | no | - |
| `invalid_point_policy` | `string` | yes | Preserve invalid coordinates/flags or explicitly declare an allowed lossy transformation. |
| `limits` | `msg.stream/StreamLimits` | yes | - |

### `PointCloudSample`

Complete reassembled point-cloud payload and sample organization.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `header` | `msg.stream/TransferPartHeader` | yes | - |
| `format` | `PointCloudFormat` | yes | - |
| `width` | `uint32` | yes | - |
| `height` | `uint32` | yes | - |
| `point_count` | `uint32` | yes | - |
| `is_dense` | `bool` | yes | - |
| `payload_bytes` | `bytes` | yes | - |

### `PointCloudTransferPart`

Point-cloud sample identity, organization, optional changed format, and one bounded payload chunk.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `header` | `msg.stream/TransferPartHeader` | yes | - |
| `chunk` | `msg.stream/EncodedChunk` | yes | - |
| `format` | `PointCloudFormat` | no | - |
| `width` | `uint32` | yes | - |
| `height` | `uint32` | yes | - |
| `point_count` | `uint32` | yes | - |
| `is_dense` | `bool` | yes | - |

### `PointCloudCycleRequest`

Requests a prepared point-cloud sample for a sample-exchange cycle.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `after_sample_id` | `int64` | no | - |
| `after_unit_sequence` | `int64` | no | - |
| `resync_required` | `bool` | no | - |

### `PointCloudCycleResponse`

One prepared typed point-cloud part or a normal no-new-sample result.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `status` | `string` | yes | sample_available, no_new_sample, resync_required, unsupported_format, or device_error. |
| `part` | `PointCloudTransferPart` | no | - |
| `detail` | `string` | no | - |

<a id="msg-sensor-radar-v1"></a>
## `msg.sensor.radar.v1`

Integrated rotating radar sector samples and source Control messages; no external motor is required.

Imports: `msg.control.v1`.

### `RadarCycleRequest`

Requests the next prepared radar sector for a sample-exchange cycle. An omitted expected_session_id bootstraps session discovery and may use an after_sample_id of zero. Once known, the client sends expected_session_id with its cursor so a process reset cannot be mistaken for continuous coverage. A same-session response may return only the immediately following sector; if bounded history has evicted it, the provider reports resync_required.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `expected_session_id` | `string` | no | Omit only for initial session discovery; otherwise anchor after_sample_id to this process session. |
| `after_sample_id` | `int64` | no | Nonnegative cursor within expected_session_id; a sample response advances it by exactly one. |

### `RadarCycleResponse`

Returns the provider's current session on every response. A session mismatch or an evicted cursor returns resync_required without a sector; the client adopts session_id, resets its cursor to zero, and retries before claiming continuous revolution coverage.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `session_id` | `string` | yes | Unique process/reset identity for this radar source, including on resync_required and device_error responses. |
| `status` | `string` | yes | sample_available, no_new_sample, resync_required, or device_error. |
| `sector` | `RadarSectorSample` | no | - |
| `detail` | `string` | no | - |

### `RadarSectorSample`

One sector's positive-direction angular coverage interval from an integrated rotating radar. Acquisition is an interval, not an instantaneous 360-degree observation. An empty returns vector is valid completed coverage with no detected returns. Return azimuths lie within this interval modulo 2*pi, allowing up to 1e-6 rad of endpoint quantization at either boundary.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `session_id` | `string` | yes | Must match the enclosing RadarCycleResponse.session_id. |
| `sample_id` | `int64` | yes | Positive sector identity, incremented by one for each sector within session_id. |
| `revolution_id` | `int64` | yes | Positive identity of the revolution containing this sector. |
| `azimuth_start_rad` | `float64` | yes | Start azimuth in sensor frame, normalized to [0, 2*pi). |
| `azimuth_span_rad` | `float64` | yes | Positive sweep in the positive azimuth direction, at most 2*pi; the interval may wrap through zero. |
| `scan_started_at_sync_ns` | `int64` | yes | Inclusive start of this sector's acquisition interval in r2kernel_sync nanoseconds. |
| `scan_ended_at_sync_ns` | `int64` | yes | Inclusive end of this sector's acquisition interval; must be later than scan_started_at_sync_ns. |
| `frame_id` | `string` | yes | Explicit sensor frame in which sector and return azimuths are expressed. |
| `revolution_complete` | `bool` | yes | True when this sector completes its containing revolution. |
| `returns` | `vector<RadarReturn>` | yes | Returns observed in this coverage interval; an empty vector is valid. |

### `RadarReturn`

One measured radar return in sensor coordinates. The public contract carries no truth ID, object class, or global coordinates.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `range_m` | `float32` | yes | Finite positive range in meters. |
| `azimuth_rad` | `float64` | yes | Sensor-frame azimuth normalized to [0, 2*pi), within the sector sweep with at most 1e-6 rad of endpoint quantization. |
| `radial_velocity_mps` | `float32` | yes | Finite radial velocity in meters per second. |
| `signal_strength` | `float32` | yes | Unitless normalized signal strength in [0,1], where 1 is the provider profile's maximum. |
| `observed_at_sync_ns` | `int64` | yes | Observation time in r2kernel_sync nanoseconds, within the sector acquisition interval. |

<a id="msg-sensor-rgbd-v1"></a>
## `msg.sensor.rgbd.v1`

Paired, typed RGB-D source samples with per-plane timing and calibration.

Imports: `msg.control.v1`, `msg.stream.v1`, `msg.visual.v1`, `msg.sensor.depth.v1`, `msg.sensor.camera.v1`.

### `RgbdStreamFormat`

Immutable RGB-D pair format with independently described color and depth planes. The provider does not imply registration or synchronization unless declared here.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `visual_format` | `msg.visual/VisualStreamFormat` | yes | - |
| `depth_format` | `msg.sensor.depth/DepthStreamFormat` | yes | - |
| `pairing_mode` | `string` | yes | hardware_synchronized or software_joined. |
| `spatial_relation` | `string` | yes | registered or unregistered. |
| `maximum_pair_skew_ns` | `int64` | yes | - |
| `color_calibration_revision` | `int64` | yes | - |
| `color_calibration_id` | `string` | yes | - |
| `depth_calibration_revision` | `int64` | yes | - |
| `depth_calibration_id` | `string` | yes | - |
| `color_frame_id` | `string` | yes | - |
| `depth_frame_id` | `string` | yes | - |
| `reference_frame_id` | `string` | yes | Declared common reference frame for any registered relation. |
| `color_intrinsics` | `msg.sensor.camera/CameraIntrinsics` | yes | - |
| `extrinsics_calibration_id` | `string` | no | Resolvable calibration reference required when spatial_relation is registered; transforms are supplied by that calibration source, not invented here. |

### `RgbdSample`

Complete color/depth pair joined by capture_set_id, not by poll arrival.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `capture_set_id` | `int64` | yes | - |
| `capture_reference_time_sync_ns` | `int64` | yes | - |
| `color_time_offset_ns` | `int64` | yes | - |
| `depth_time_offset_ns` | `int64` | yes | - |
| `format` | `RgbdStreamFormat` | yes | - |
| `visual_sample` | `msg.visual/VisualSample` | yes | - |
| `depth_sample` | `msg.sensor.depth/DepthSample` | yes | - |

### `RgbdTransferPart`

RGB-D pairing envelope containing one or both explicitly typed planes. The visual and depth parts retain their own acquired_at_sync_ns, expires_at_sync_ns, sample identities, chunks, and calibration format revisions.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `capture_set_id` | `int64` | yes | - |
| `capture_reference_time_sync_ns` | `int64` | yes | - |
| `color_time_offset_ns` | `int64` | no | - |
| `depth_time_offset_ns` | `int64` | no | - |
| `format` | `RgbdStreamFormat` | no | - |
| `visual_part` | `msg.visual/VisualTransferPart` | no | - |
| `depth_part` | `msg.sensor.depth/DepthTransferPart` | no | - |

### `RgbdCycleRequest`

Requests a prepared RGB-D sample set for a sample-exchange cycle.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `after_capture_set_id` | `int64` | no | - |
| `resync_required` | `bool` | no | - |

### `RgbdCycleResponse`

One or more typed RGB-D transfer parts or a normal no-new-sample result. A partial pair is never reported as a complete RgbdSample.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `status` | `string` | yes | sample_available, no_new_sample, incomplete_pair, resync_required, or device_error. |
| `part` | `RgbdTransferPart` | no | - |
| `detail` | `string` | no | - |

<a id="msg-stream-v1"></a>
## `msg.stream.v1`

Shared stream identity, codec profile, bounded payload chunk, and transfer-part metadata.

### `StreamIdentity`

Provider-issued stream session and configuration revisions. This identity is domain data, not an authorization credential or a runtime route generation.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `session_id` | `string` | yes | Opaque provider-issued session identifier, unique across provider restarts. |
| `configuration_revision` | `int64` | yes | Active stream configuration revision. |
| `format_revision` | `int64` | yes | Active data-format and decoder-configuration revision. |

### `CodecDescriptor`

Stable codec contract identity and all information required to parse and decode its bitstream. A codec library or product name alone is not a codec contract.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `codec_id` | `string` | yes | Authority-qualified codec profile identifier. |
| `codec_version` | `string` | yes | Version of the bitstream and configuration contract. |
| `profile` | `string` | yes | Codec profile, level, bit depth, and other required profile selection. |
| `bitstream_framing` | `string` | yes | Declared encoded-unit framing and byte-stream boundaries. |
| `configuration_format` | `string` | yes | Declared syntax and version of decoder configuration bytes. |
| `configuration_bytes` | `bytes` | no | Bounded decoder configuration needed for this format revision. |
| `decoded_layout` | `string` | yes | Declared decoded sample layout and interpretation. |

### `StreamLimits`

Finite encoded, decoded, configuration, chunk, queue, and reassembly limits for one selected stream profile. Receivers validate these values before allocation.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `max_codec_config_bytes` | `uint32` | yes | - |
| `max_encoded_unit_bytes` | `int64` | yes | - |
| `max_decoded_unit_bytes` | `int64` | yes | - |
| `max_chunk_bytes` | `uint32` | yes | - |
| `max_parts_per_unit` | `uint32` | yes | Maximum part count; bounds per-part assembly metadata. |
| `max_pending_units` | `uint32` | yes | - |
| `max_pending_bytes` | `int64` | yes | - |
| `max_reassembly_age_ns` | `int64` | yes | - |

### `EncodedChunk`

One bounded byte range from a logical encoded or raw payload unit. Chunks do not change the sample identity, sample lifetime, codec unit, or dependency order.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `part_index` | `uint32` | yes | Zero-based part index within one transfer unit. |
| `part_count` | `uint32` | yes | Fixed total number of parts declared for the transfer unit. |
| `total_payload_bytes` | `int64` | yes | Total payload size, bounded by the selected profile before allocation. |
| `offset_bytes` | `int64` | yes | Byte offset within the complete payload. |
| `payload_bytes` | `bytes` | yes | This part's bytes, bounded by max_chunk_bytes. |

### `TransferPartHeader`

Stable identity and lifetime for a typed data sample split over one or more Control cycles. acquired_at_sync_ns and expires_at_sync_ns describe the original sample lifetime; retries and later cycles never rewrite or extend them.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `stream` | `StreamIdentity` | yes | - |
| `sample_id` | `int64` | yes | Logical sensor or media sample identity, distinct from cycle sequence. |
| `unit_sequence` | `int64` | yes | Codec delivery-unit sequence, distinct from sample_id and format revision. |
| `acquired_at_sync_ns` | `int64` | yes | Original synchronized acquisition time for this domain sample. |
| `expires_at_sync_ns` | `int64` | yes | Absolute synchronized expiry of the original sample data. |
| `independent` | `bool` | yes | Whether this unit can be decoded without referenced stream units. |
| `reference_unit_sequences` | `vector<int64>` | no | Explicit codec-unit dependencies; not assumed to mean the prior unit only. |

<a id="msg-visual-v1"></a>
## `msg.visual.v1`

Typed visual sample formats and transfer parts for camera sources and display sinks.

Imports: `msg.control.v1`, `msg.stream.v1`.

### `VisualPlaneFormat`

One plane's decoded raster geometry and byte layout.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `plane_index` | `uint32` | yes | - |
| `width` | `uint32` | yes | - |
| `height` | `uint32` | yes | - |
| `offset_bytes` | `int64` | yes | - |
| `row_stride_bytes` | `uint32` | yes | - |
| `bytes_per_sample` | `uint8` | yes | - |
| `horizontal_subsampling` | `uint8` | yes | - |
| `vertical_subsampling` | `uint8` | yes | - |
| `sample_format` | `string` | yes | Numeric or packed sample representation for this plane. |
| `endianness` | `string` | yes | little or big byte order for multibyte decoded samples; required for every plane. |

### `VisualStreamFormat`

Immutable format descriptor for one stream format revision. representation is raw_raster, encoded_image, or video_access_unit. Conditional field requirements are defined by the public stream contract documentation.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `representation` | `string` | yes | - |
| `width` | `uint32` | yes | - |
| `height` | `uint32` | yes | - |
| `pixel_format` | `string` | yes | - |
| `color_space` | `string` | yes | - |
| `color_range` | `string` | yes | - |
| `bit_depth` | `uint8` | yes | - |
| `planes` | `vector<VisualPlaneFormat>` | yes | - |
| `codec` | `msg.stream/CodecDescriptor` | no | - |
| `limits` | `msg.stream/StreamLimits` | yes | - |
| `update_model` | `string` | yes | static_image or live_samples. |

### `VisualSample`

Complete reassembled visual sample, not an individual transport part.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `header` | `msg.stream/TransferPartHeader` | yes | - |
| `format` | `VisualStreamFormat` | yes | - |
| `presentation_timestamp_ns` | `int64` | no | Media timeline presentation time, not a Control execution timestamp. |
| `decode_timestamp_ns` | `int64` | no | Media timeline decode order time when required by the codec profile. |
| `payload_bytes` | `bytes` | yes | - |

### `VisualTransferPart`

Typed visual sample header and one bounded payload chunk. Include format on the first part of a session and whenever format_revision changes; do not renegotiate by sending a DESCRIBE/CONFIGURE handshake on every stream.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `header` | `msg.stream/TransferPartHeader` | yes | - |
| `chunk` | `msg.stream/EncodedChunk` | yes | - |
| `format` | `VisualStreamFormat` | no | - |
| `presentation_timestamp_ns` | `int64` | no | - |
| `decode_timestamp_ns` | `int64` | no | - |

### `DisplayControlRequest`

Control-only display request. A command submits a part or clears/resets output; keep continues the currently selected state without retransmitting old bytes.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `action` | `string` | yes | submit_part, clear_output, reset_stream, or continue_output. |
| `part` | `VisualTransferPart` | no | - |
| `presentation_timestamp_ns` | `int64` | no | Requested presentation time on the declared media timeline. It is separate from execute_at_sync_ns and requires a declared clock mapping. |

### `DisplayControlResponse`

Typed display domain progress for the request cycle. This status reports the actual observed processing stage and does not redefine runtime execution status.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cycle` | `msg.control/ControlCycle` | yes | - |
| `status` | `string` | yes | part_received, unit_complete, decoded, submitted_to_renderer, presented, buffer_full, resync_required, stale_sample, unsupported_format, or device_error. |
| `accepted_part_index` | `uint32` | no | - |
| `received_payload_bytes` | `int64` | no | - |
| `queued_units` | `uint32` | yes | - |
| `queued_bytes` | `int64` | yes | - |
| `available_units` | `uint32` | yes | - |
| `available_bytes` | `int64` | yes | - |
| `detail` | `string` | no | - |

<!-- Generated by generate_reference_docs.py. -->

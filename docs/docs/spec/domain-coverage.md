# Domain Coverage

This page defines the canonical R2Kernel domain structure.

## Namespace Structure

| Layer | Namespace family | Meaning |
|---|---|---|
| `message` | `msg.core.*` | shared robotics and runtime-neutral concepts |
| `message` | `msg.motion.*` | articulated and manipulator motion payloads |
| `message` | `msg.locomotion.*` | locomotion payloads |
| `message` | `msg.actuator.*` | lower-level actuator payloads |
| `message` | `msg.sensor.*` | sensor payloads |
| `message` | `msg.localization.*` | localization payloads |
| `message` | `msg.mapping.*` | mapping payloads |
| `message` | `msg.navigation.*` | navigation payloads |
| `message` | `msg.perception.*` | perception payloads |
| `message` | `msg.control.*`, `msg.stream.*`, `msg.visual.*` | Control-cycle identity, typed stream metadata, and visual raster formats |
| `API contract` | `api.motion.*` | motion endpoint contracts |
| `API contract` | `api.locomotion.*` | locomotion endpoint contracts |
| `API contract` | `api.actuator.*` | actuator endpoint contracts |
| `API contract` | `api.sensor.*` | sensor endpoint contracts |
| `API contract` | `api.io.*` | digital and analog I/O endpoint contracts |
| `API contract` | `api.localization.*` | localization endpoint contracts |
| `API contract` | `api.mapping.*` | mapping endpoint contracts |
| `API contract` | `api.navigation.*` | navigation endpoint contracts |
| `API contract` | `api.perception.*` | perception endpoint contracts |
| `component` | `component.*` | component-role subsystem compatibility bundles |

## Manipulator

Manipulator support is organized as articulated motion plus manipulator-specific task-space and tooling semantics.

### API Contracts

| API Contract | Meaning | Typical endpoints |
|---|---|---|
| `api.motion.articulated.state.*` | observed joint-space state | `joint_state` |
| `api.motion.articulated.velocity.*` | periodic joint-space control | `joint_velocity` |
| `api.motion.articulated.trajectory.*` | programmed joint-space motion | `move_j`, `stop`, `pause`, `resume` |
| `api.motion.manipulator.state.*` | observed tool and task-space state | `tool_pose`, `motion_state`, `tool_settings` |
| `api.motion.manipulator.velocity.*` | periodic TCP-space control | `tcp_velocity` |
| `api.motion.manipulator.cartesian.*` | programmed Cartesian motion | `move_l`, `move_c` |
| `api.motion.manipulator.tooling.*` | tool and payload control | `set_tcp`, `set_payload` |
| `api.motion.execution.*` | shared execution state and speed scaling | `execution_state`, `set_speed_scaling`, `get_speed_scaling` |
| `api.motion.manipulator.cartesian.offset.*` | periodic Cartesian offset | `cartesian_offset` |
| `api.motion.manipulator.wrench.*` | Cartesian wrench command and observation | `wrench_command`, `wrench_state` |
| `api.motion.manipulator.kinematics.*` | forward and inverse kinematics queries | `forward_kinematics`, `inverse_kinematics` |
| `api.motion.manipulator.hand_guiding.*` | hand-guiding authority and state | `enable_hand_guiding`, `disable_hand_guiding`, `hand_guiding_state` |
| `api.motion.manipulator.tooling.calibration.*` | asynchronous tool calibration | `calibrate_tool` |

### Components

| Component | Conformance API contracts |
|---|---|
| `component.manipulator.v1` | articulated state, articulated velocity, articulated trajectory, manipulator state, manipulator cartesian, manipulator tooling |

## Mobile Base

For mobile robots, R2Kernel separates locomotion, localization, mapping, and navigation into distinct namespaces and component bundles.

### API Contracts

| API Contract | Meaning | Typical endpoints |
|---|---|---|
| `api.locomotion.velocity.*` | generic timed body-velocity control | `velocity_command`, `set_velocity_limits`, `get_velocity_limits`, `stop` |
| `api.locomotion.velocity_reference.*` | Control-free body-velocity reference for applications; the component owns timed actuator dispatch | `set_velocity_reference`, `stop` |
| `api.locomotion.mobile_base.state.*` | wheeled-platform state and drive authority | `mobile_base_state`, `fault_state`, `enable_drive`, `disable_drive`, `clear_fault` |
| `api.locomotion.odometry.*` | mobile-base odometry publication | `odometry` |
| `api.locomotion.diff_drive.*` | optional differential-drive wheel surface | `wheel_command`, `wheel_state`, `get_diff_drive_kinematics` |
| `api.localization.*` | self-localization | `pose_estimate`, localization status |
| `api.mapping.*` | map production and publication | `occupancy_map`, `map_state` |
| `api.navigation.*` | autonomous path/goal execution | `navigate_to_pose`, `follow_path`, `navigation_state` |

### Components

| Component | Conformance API contracts |
|---|---|
| `component.mobile_base.v1` | locomotion velocity, mobile-base state |
| `component.mobile_base.localized.v1` | locomotion velocity, mobile-base state, localization |
| `component.mobile_base.autonomous.v1` | locomotion velocity, mobile-base state, localization, navigation |
| `component.localizer.v1` | localization |
| `component.navigation.v1` | navigation |

## Gateway Domains

Gateway subsystems expose hardware aggregation roles behind R2Kernel API contracts.

### API Contracts

| Gateway contract | Meaning |
|---|---|
| `api.actuator.servo.v1` | actuator servo `servo_control` Control with cycle identity and typed domain status |
| `api.io.digital.input.v1` | digital input |
| `api.io.digital.output.v1` | digital output set/get Procedures |
| `api.io.digital.timed_output.v1` | digital output Control with command and keep cycles under an update-gap lease |
| `api.io.analog.input.v1` | analog input |
| `api.io.analog.output.v1` | analog output |
| `api.sensor.camera.source.v1` | Control-only camera source cycles |
| `api.sensor.radar.source.v1` | Control-only integrated rotating-radar sectors for a perception Component |
| `api.perception.stream.v1` | perception observations and stream state |
| `api.diagnostics.health.v1` | health observations and diagnostic queries |

## Digital Output Contract Compatibility

`api.io.digital.output.v1` retains the `set_digital_output` and
`get_digital_output` Procedures. Providers implementing that contract do not
need to add a Control endpoint.

Periodic output commands use the separate `api.io.digital.timed_output.v1`
contract. Its `digital_output_control` Control accepts
`msg.io.digital.timed_output.v1/TimedOutputControlRequest` (a
`msg.control.v1/ControlCycle` and an optional
`msg.core.common.primitive.v1/IndexedBoolValue` output) and returns
`TimedOutputControlResponse` with the cycle, a domain status, the channel
index, and the optional observed value. A `command` cycle establishes or
replaces the output state; a `keep` cycle maintains the same positive state
revision without a payload. The binding selects the update-gap lease. Timing
support and periodic refresh are required, validity uses the runtime envelope,
and expired commands are rejected. The contract uses the `r2kernel_sync` clock
domain and Control envelope timestamps.

A gateway that supports both surfaces declares separate provided interfaces
for the two contracts. Consumers select the contract matching their output
semantics; the timed contract does not redefine the existing Procedure API.

## Tutorial Actuation

The current cleaner tutorial uses the standard `api.actuation.trigger.v1` API
under its platform-local `trash_disposal` export.

## Related References

For the canonical definitions, see.

- [API Contract Model](api-contract-model.md)
- [API Contract Reference](api-contract-reference.md)
- [Components](components.md)

# API Contract Reference

This page is generated from `spec/apis`. An API contract owns endpoint shape and semantics. Message families own payload layout, while the runtime envelope owns transport timing and execution metadata.

| API contract | Events | Controls | Procedures | Operations |
| --- | ---: | ---: | ---: | ---: |
| `api.actuation.trigger.v1` | 0 | 0 | 1 | 0 |
| `api.actuator.drive.v1` | 0 | 1 | 0 | 0 |
| `api.actuator.servo.v1` | 0 | 1 | 0 | 0 |
| `api.diagnostics.health.v1` | 1 | 0 | 2 | 0 |
| `api.end_effector.gripper.v1` | 0 | 0 | 3 | 0 |
| `api.io.analog.input.v1` | 0 | 0 | 1 | 0 |
| `api.io.analog.output.v1` | 0 | 0 | 2 | 0 |
| `api.io.digital.input.v1` | 0 | 0 | 1 | 0 |
| `api.io.digital.output.v1` | 0 | 0 | 2 | 0 |
| `api.io.digital.timed_output.v1` | 0 | 1 | 0 | 0 |
| `api.localization.v1` | 2 | 0 | 0 | 0 |
| `api.locomotion.diff_drive.v1` | 2 | 0 | 2 | 0 |
| `api.locomotion.legged.state.v1` | 4 | 0 | 0 | 0 |
| `api.locomotion.mobile_base.state.v1` | 2 | 0 | 4 | 0 |
| `api.locomotion.odometry.v1` | 1 | 0 | 0 | 0 |
| `api.locomotion.velocity.v1` | 0 | 1 | 3 | 0 |
| `api.locomotion.velocity_reference.v1` | 0 | 0 | 2 | 0 |
| `api.mapping.v1` | 2 | 0 | 0 | 0 |
| `api.media.display.v1` | 0 | 1 | 0 | 0 |
| `api.motion.articulated.state.v1` | 1 | 0 | 0 | 0 |
| `api.motion.articulated.trajectory.offset.v1` | 0 | 1 | 0 | 0 |
| `api.motion.articulated.trajectory.v1` | 0 | 0 | 3 | 1 |
| `api.motion.articulated.velocity.v1` | 0 | 1 | 0 | 0 |
| `api.motion.execution.v1` | 1 | 0 | 2 | 0 |
| `api.motion.manipulator.cartesian.offset.v1` | 0 | 1 | 0 | 0 |
| `api.motion.manipulator.cartesian.v1` | 0 | 0 | 0 | 2 |
| `api.motion.manipulator.hand_guiding.v1` | 1 | 0 | 2 | 0 |
| `api.motion.manipulator.kinematics.v1` | 0 | 0 | 2 | 0 |
| `api.motion.manipulator.state.v1` | 3 | 0 | 0 | 0 |
| `api.motion.manipulator.tooling.calibration.v1` | 0 | 0 | 0 | 1 |
| `api.motion.manipulator.tooling.v1` | 0 | 0 | 2 | 0 |
| `api.motion.manipulator.velocity.v1` | 0 | 1 | 0 | 0 |
| `api.motion.manipulator.wrench.v1` | 1 | 1 | 0 | 0 |
| `api.navigation.v1` | 1 | 0 | 1 | 2 |
| `api.perception.query.v1` | 0 | 0 | 3 | 0 |
| `api.perception.stream.v1` | 3 | 0 | 0 | 0 |
| `api.positioning.absolute_pose.v1` | 1 | 0 | 0 | 0 |
| `api.sensor.camera.source.v1` | 0 | 1 | 0 | 0 |
| `api.sensor.depth.source.v1` | 0 | 1 | 0 | 0 |
| `api.sensor.gnss.source.v1` | 0 | 1 | 0 | 0 |
| `api.sensor.lidar.source.v1` | 0 | 1 | 0 | 0 |
| `api.sensor.pointcloud.source.v1` | 0 | 1 | 0 | 0 |
| `api.sensor.radar.source.v1` | 0 | 1 | 0 | 0 |
| `api.sensor.rgbd.source.v1` | 0 | 1 | 0 | 0 |

<a id="api-actuation-trigger-v1"></a>
## `api.actuation.trigger.v1`

Canonical bounded one-shot actuation with provider-owned channel mapping, timing, and safe-state handling.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `trigger` | request=msg.core.common.primitive.v1/Empty, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=non_idempotent; side_effects=provider_configured_bounded_actuation |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-actuator-drive-v1"></a>
## `api.actuator.drive.v1`

Deterministic low-level drive command and state exchange.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `drive_command` | request=msg.actuator.drive.v1/DriveCommand, response=msg.actuator.drive.v1/DriveState, timing_support=required | periodic=contract_defined; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-actuator-servo-v1"></a>
## `api.actuator.servo.v1`

Periodic servo command and sampled link-state Control contract.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `servo_control` | request=msg.actuator.servo.v1/ServoControlRequest, response=msg.actuator.servo.v1/ServoControlResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'apply_servo_command', 'response_scope': 'endpoint_effect_completed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'command_refresh', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_domain_sample |

<a id="api-diagnostics-health-v1"></a>
## `api.diagnostics.health.v1`

Shared provider health publication, query, and fault reset contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `health_status` | type=msg.diagnostics.health.v1/HealthStatus, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `get_health` | request=msg.core.common.primitive.v1/Empty, response=msg.diagnostics.health.v1/HealthStatus, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `clear_fault` | request=msg.diagnostics.health.v1/ClearFaultRequest, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-end-effector-gripper-v1"></a>
## `api.end_effector.gripper.v1`

Canonical binary gripper API contract for open, close, and state query.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `open` | request=msg.core.common.primitive.v1/Empty, response=msg.core.common.result.v1/Result, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `close` | request=msg.core.common.primitive.v1/Empty, response=msg.core.common.result.v1/Result, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `get_gripper_state` | request=msg.core.common.primitive.v1/Empty, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-io-analog-input-v1"></a>
## `api.io.analog.input.v1`

Canonical index-addressed analog input read API contract.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `get_analog_input` | request=msg.core.common.primitive.v1/UInt32Value, response=msg.core.common.primitive.v1/Float32Value, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-io-analog-output-v1"></a>
## `api.io.analog.output.v1`

Canonical index-addressed analog output command and state API contract.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `set_analog_output` | request=msg.core.common.primitive.v1/IndexedFloat32Value, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=target_idempotent; side_effects=changes_physical_output |
| `get_analog_output` | request=msg.core.common.primitive.v1/UInt32Value, response=msg.core.common.primitive.v1/Float32Value, timing_support=none | idempotency=read_only; side_effects=none |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=not_applicable; dynamic_frames=prohibited |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-io-digital-input-v1"></a>
## `api.io.digital.input.v1`

Canonical index-addressed digital input read API contract.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `get_digital_input` | request=msg.core.common.primitive.v1/UInt32Value, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-io-digital-output-v1"></a>
## `api.io.digital.output.v1`

Canonical index-addressed digital output procedure and state API contract.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `set_digital_output` | request=msg.core.common.primitive.v1/IndexedBoolValue, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `get_digital_output` | request=msg.core.common.primitive.v1/UInt32Value, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-io-digital-timed-output-v1"></a>
## `api.io.digital.timed_output.v1`

Digital output Control with explicit command and keep cycles under a binding-selected update-gap lease.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `digital_output_control` | request=msg.io.digital.timed_output.v1/TimedOutputControlRequest, response=msg.io.digital.timed_output.v1/TimedOutputControlResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'set_or_maintain_digital_output', 'response_scope': 'endpoint_effect_completed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'maintain_state', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-localization-v1"></a>
## `api.localization.v1`

Canonical localization API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `pose_estimate` | type=msg.localization.v1/PoseEstimate, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `localization_status` | type=msg.localization.v1/LocalizationStatus, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-locomotion-diff-drive-v1"></a>
## `api.locomotion.diff_drive.v1`

Optional mobile-base API contract for differential-drive kinematics and wheel-level state.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `wheel_command` | type=msg.locomotion.mobile_base.v1/WheelCommand, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `wheel_state` | type=msg.locomotion.mobile_base.v1/WheelState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `get_diff_drive_kinematics` | request=msg.core.common.primitive.v1/Empty, response=msg.locomotion.mobile_base.v1/DiffDriveKinematics, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `set_diff_drive_kinematics` | request=msg.locomotion.mobile_base.v1/DiffDriveKinematics, response=msg.locomotion.velocity.v1/CommandAck, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-locomotion-legged-state-v1"></a>
## `api.locomotion.legged.state.v1`

Canonical legged locomotion state API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `contact_state` | type=msg.locomotion.legged.v1/ContactArray, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `foot_state` | type=msg.locomotion.legged.v1/FootState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `balance_state` | type=msg.locomotion.legged.v1/BalanceState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `gait_phase` | type=msg.locomotion.legged.v1/GaitPhase, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-locomotion-mobile-base-state-v1"></a>
## `api.locomotion.mobile_base.state.v1`

Canonical wheeled mobile-base state, fault, and drive-enable API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `mobile_base_state` | type=msg.locomotion.mobile_base.v1/MobileBaseState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `fault_state` | type=msg.locomotion.mobile_base.v1/FaultState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `get_status` | request=msg.core.common.primitive.v1/Empty, response=msg.locomotion.mobile_base.v1/MobileBaseState, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `enable_drive` | request=msg.locomotion.mobile_base.v1/EnableDriveRequest, response=msg.locomotion.velocity.v1/CommandAck, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `disable_drive` | request=msg.locomotion.mobile_base.v1/DisableDriveRequest, response=msg.locomotion.velocity.v1/CommandAck, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `clear_fault` | request=msg.locomotion.mobile_base.v1/ClearFaultRequest, response=msg.locomotion.velocity.v1/CommandAck, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-locomotion-odometry-v1"></a>
## `api.locomotion.odometry.v1`

Canonical mobile-base odometry publication API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `odometry` | type=msg.locomotion.mobile_base.v1/Odometry, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-locomotion-velocity-v1"></a>
## `api.locomotion.velocity.v1`

Canonical shared locomotion body-velocity API contract with timed command validity and limit management.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `velocity_command` | request=msg.locomotion.velocity.v1/VelocityCommand, response=msg.locomotion.velocity.v1/CommandAck, timing_support=required | periodic=contract_defined; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired |

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `set_velocity_limits` | request=msg.locomotion.velocity.v1/VelocityLimits, response=msg.locomotion.velocity.v1/CommandAck, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `get_velocity_limits` | request=msg.core.common.primitive.v1/Empty, response=msg.locomotion.velocity.v1/VelocityLimits, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `stop` | request=msg.locomotion.velocity.v1/StopRequest, response=msg.locomotion.velocity.v1/CommandAck, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-locomotion-velocity-reference-v1"></a>
## `api.locomotion.velocity_reference.v1`

App-facing locomotion reference API that accepts discrete procedure calls while the provider owns timed Control dispatch to its actuator.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `set_velocity_reference` | request=msg.locomotion.velocity.v1/VelocityCommand, response=msg.locomotion.velocity.v1/CommandAck, timing_support=none | idempotency=endpoint_defined; side_effects=applies_bounded_velocity_reference |
| `stop` | request=msg.locomotion.velocity.v1/StopRequest, response=msg.locomotion.velocity.v1/CommandAck, timing_support=none | idempotency=idempotent; side_effects=stops_platform_motion |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-mapping-v1"></a>
## `api.mapping.v1`

Canonical mapping API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `occupancy_map` | type=msg.mapping.v1/OccupancyGridMap, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `map_state` | type=msg.mapping.v1/MapStatus, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-media-display-v1"></a>
## `api.media.display.v1`

Control-only visual transfer admission, retention, and output status contract.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `display_cycle` | request=msg.visual.v1/DisplayControlRequest, response=msg.visual.v1/DisplayControlResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'submit_or_maintain_visual_output', 'response_scope': 'endpoint_effect_completed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'maintain_state', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes', 'max_pending_units'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_transfer_part_header |

<a id="api-motion-articulated-state-v1"></a>
## `api.motion.articulated.state.v1`

Canonical articulated joint-state API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `joint_state` | type=msg.core.kinematics.v1/JointState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-articulated-trajectory-offset-v1"></a>
## `api.motion.articulated.trajectory.offset.v1`

Periodic joint offset control for an active programmed trajectory.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `trajectory_offset` | request=msg.motion.articulated.v1/TrajectoryOffset, response=msg.core.common.primitive.v1/BoolValue, timing_support=required | periodic=contract_defined; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-articulated-trajectory-v1"></a>
## `api.motion.articulated.trajectory.v1`

Canonical articulated programmed-motion API contract.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `stop` | request=msg.motion.articulated.v1/RampRequest, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=idempotent; side_effects=stops_motion |
| `pause` | request=msg.motion.articulated.v1/RampRequest, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=idempotent; side_effects=pauses_motion |
| `resume` | request=msg.core.common.primitive.v1/Empty, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=idempotent; side_effects=resumes_motion |

### Operations

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `move_j` | request=msg.motion.articulated.v1/MoveJRequest, feedback=msg.motion.manipulator.v1/MotionFeedback, result=msg.motion.manipulator.v1/MotionResult, state=msg.motion.manipulator.v1/MotionState, timing_support=none | progress=feedback_stream; cancellation=required; terminal_states=['succeeded', 'failed', 'canceled', 'rejected'] |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-articulated-velocity-v1"></a>
## `api.motion.articulated.velocity.v1`

Canonical articulated periodic joint-velocity API contract.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `joint_velocity` | request=msg.core.kinematics.v1/JointVelocity, response=msg.core.common.primitive.v1/BoolValue, timing_support=required | periodic=contract_defined; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-execution-v1"></a>
## `api.motion.execution.v1`

Shared programmed-motion state and runtime speed scaling.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `execution_state` | type=msg.motion.execution.v1/ExecutionState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `set_speed_scaling` | request=msg.motion.execution.v1/SpeedScaling, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `get_speed_scaling` | request=msg.core.common.primitive.v1/Empty, response=msg.motion.execution.v1/SpeedScaling, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-cartesian-offset-v1"></a>
## `api.motion.manipulator.cartesian.offset.v1`

Periodic Cartesian offset control for active manipulator motion.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `cartesian_offset` | request=msg.motion.manipulator.v1/CartesianOffset, response=msg.core.common.primitive.v1/BoolValue, timing_support=required | periodic=contract_defined; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-cartesian-v1"></a>
## `api.motion.manipulator.cartesian.v1`

Canonical manipulator Cartesian programmed-motion API contract.

### Operations

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `move_l` | request=msg.motion.manipulator.v1/MoveLRequest, feedback=msg.motion.manipulator.v1/MotionFeedback, result=msg.motion.manipulator.v1/MotionResult, state=msg.motion.manipulator.v1/MotionState, timing_support=none | progress=feedback_stream; cancellation=required; terminal_states=['succeeded', 'failed', 'canceled', 'rejected'] |
| `move_c` | request=msg.motion.manipulator.v1/MoveCRequest, feedback=msg.motion.manipulator.v1/MotionFeedback, result=msg.motion.manipulator.v1/MotionResult, state=msg.motion.manipulator.v1/MotionState, timing_support=none | progress=feedback_stream; cancellation=required; terminal_states=['succeeded', 'failed', 'canceled', 'rejected'] |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-hand-guiding-v1"></a>
## `api.motion.manipulator.hand_guiding.v1`

Provider-owned hand-guiding mode control and state.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `hand_guiding_state` | type=msg.motion.manipulator.v1/HandGuidingState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `enable_hand_guiding` | request=msg.core.common.primitive.v1/StringValue, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `disable_hand_guiding` | request=msg.core.common.primitive.v1/Empty, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-kinematics-v1"></a>
## `api.motion.manipulator.kinematics.v1`

Stateless forward and inverse kinematics queries.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `forward_kinematics` | request=msg.motion.manipulator.v1/ForwardKinematicsRequest, response=msg.motion.manipulator.v1/ForwardKinematicsResult, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `inverse_kinematics` | request=msg.motion.manipulator.v1/InverseKinematicsRequest, response=msg.motion.manipulator.v1/InverseKinematicsResult, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-state-v1"></a>
## `api.motion.manipulator.state.v1`

Canonical manipulator tool/task-space state API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `tool_pose` | type=msg.core.spatial.v1/Pose, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `motion_state` | type=msg.motion.manipulator.v1/MotionState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `tool_settings` | type=msg.motion.manipulator.v1/ToolSettings, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-tooling-calibration-v1"></a>
## `api.motion.manipulator.tooling.calibration.v1`

Long-running provider-owned TCP and payload calibration.

### Operations

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `calibrate_tool` | request=msg.motion.manipulator.v1/ToolCalibrationRequest, feedback=msg.motion.manipulator.v1/MotionFeedback, result=msg.motion.manipulator.v1/ToolCalibrationResult, state=msg.motion.manipulator.v1/MotionState, timing_support=none | progress=feedback_stream; cancellation=required; terminal_states=['succeeded', 'failed', 'canceled', 'rejected'] |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-tooling-v1"></a>
## `api.motion.manipulator.tooling.v1`

Canonical manipulator tooling and payload API contract.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `set_tcp` | request=msg.motion.manipulator.v1/SetTcpRequest, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=target_idempotent; side_effects=changes_tool_transform |
| `set_payload` | request=msg.motion.manipulator.v1/SetPayloadRequest, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=target_idempotent; side_effects=changes_dynamic_model |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-velocity-v1"></a>
## `api.motion.manipulator.velocity.v1`

Canonical manipulator periodic TCP-twist control API contract.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `tcp_velocity` | request=msg.core.spatial.v1/Twist, response=msg.core.common.primitive.v1/BoolValue, timing_support=required | periodic=contract_defined; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-motion-manipulator-wrench-v1"></a>
## `api.motion.manipulator.wrench.v1`

Periodic task-space wrench control and observation.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `measured_wrench` | type=msg.motion.manipulator.v1/WrenchCommand, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `wrench_command` | request=msg.motion.manipulator.v1/WrenchCommand, response=msg.core.common.primitive.v1/BoolValue, timing_support=required | periodic=contract_defined; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-navigation-v1"></a>
## `api.navigation.v1`

Canonical navigation API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `navigation_state` | type=msg.navigation.v1/NavigationState, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `cancel_navigation` | request=msg.core.common.primitive.v1/Empty, response=msg.core.common.primitive.v1/BoolValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Operations

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `navigate_to_pose` | request=msg.navigation.v1/NavigateToPoseRequest, feedback=msg.navigation.v1/NavigationFeedback, result=msg.navigation.v1/NavigationResult, state=msg.navigation.v1/NavigationState, timing_support=none | progress=feedback_stream; cancellation=required; terminal_states=['succeeded', 'failed', 'canceled', 'rejected'] |
| `follow_path` | request=msg.navigation.v1/FollowPathRequest, feedback=msg.navigation.v1/NavigationFeedback, result=msg.navigation.v1/NavigationResult, state=msg.navigation.v1/NavigationState, timing_support=none | progress=feedback_stream; cancellation=required; terminal_states=['succeeded', 'failed', 'canceled', 'rejected'] |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-perception-query-v1"></a>
## `api.perception.query.v1`

Canonical request/response perception query API contract for bounded object scans.

### Procedures

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `scan` | request=msg.core.common.primitive.v1/StringValue, response=msg.core.common.primitive.v1/StringValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `front` | request=msg.core.common.primitive.v1/StringValue, response=msg.core.common.primitive.v1/StringValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |
| `nearest` | request=msg.core.common.primitive.v1/StringValue, response=msg.core.common.primitive.v1/StringValue, timing_support=none | idempotency=endpoint_defined; side_effects=endpoint_defined |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-perception-stream-v1"></a>
## `api.perception.stream.v1`

Canonical perception observation stream API contract.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `detections_2d` | type=msg.perception.v1/Detection2DArray, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `object_pose` | type=msg.perception.v1/ObjectPoseArray, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |
| `grasp_candidates` | type=msg.perception.v1/GraspCandidateArray, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-positioning-absolute-pose-v1"></a>
## `api.positioning.absolute_pose.v1`

Canonical absolute body-pose measurement API for positioning gateways.

### Events

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `position_fix` | type=msg.positioning.v1/AbsolutePoseFix, direction=publish | observation=provider_sample; delivery=best_effort_latest; fanout=allowed |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=provider; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope |

<a id="api-sensor-camera-source-v1"></a>
## `api.sensor.camera.source.v1`

Control-only polling contract for prepared camera samples and typed visual transfer parts.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `camera_cycle` | request=msg.sensor.camera.v1/CameraCycleRequest, response=msg.sensor.camera.v1/CameraCycleResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'read_prepared_camera_sample', 'response_scope': 'sample_observed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'sample_exchange', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes', 'max_pending_units'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_transfer_part_header |

<a id="api-sensor-depth-source-v1"></a>
## `api.sensor.depth.source.v1`

Control-only polling contract for prepared depth measurements and typed transfer parts.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `depth_cycle` | request=msg.sensor.depth.v1/DepthCycleRequest, response=msg.sensor.depth.v1/DepthCycleResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'read_prepared_depth_sample', 'response_scope': 'sample_observed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'sample_exchange', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes', 'max_pending_units'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_transfer_part_header |

<a id="api-sensor-gnss-source-v1"></a>
## `api.sensor.gnss.source.v1`

Control-only polling contract for the latest receiver-reported GNSS fix.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `gnss_cycle` | request=msg.sensor.gnss.v1/GnssCycleRequest, response=msg.sensor.gnss.v1/GnssCycleResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'read_latest_gnss_fix', 'response_scope': 'sample_observed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'sample_exchange', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes', 'max_pending_units'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_optional_mapped_gnss_acquisition_time |

<a id="api-sensor-lidar-source-v1"></a>
## `api.sensor.lidar.source.v1`

Control-only polling contract for native LiDAR scans and typed transfer parts.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `lidar_cycle` | request=msg.sensor.lidar.v1/LidarCycleRequest, response=msg.sensor.lidar.v1/LidarCycleResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'read_prepared_lidar_scan', 'response_scope': 'sample_observed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'sample_exchange', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes', 'max_pending_units'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_transfer_part_header |

<a id="api-sensor-pointcloud-source-v1"></a>
## `api.sensor.pointcloud.source.v1`

Control-only polling contract for prepared point-cloud samples and typed transfer parts.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `pointcloud_cycle` | request=msg.sensor.pointcloud.v1/PointCloudCycleRequest, response=msg.sensor.pointcloud.v1/PointCloudCycleResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'read_prepared_pointcloud_sample', 'response_scope': 'sample_observed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'sample_exchange', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes', 'max_pending_units'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_transfer_part_header |

<a id="api-sensor-radar-source-v1"></a>
## `api.sensor.radar.source.v1`

Control-only polling contract for prepared sectors from an integrated 360-degree rotating radar; no external motor is required.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `radar_cycle` | request=msg.sensor.radar.v1/RadarCycleRequest, response=msg.sensor.radar.v1/RadarCycleResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'read_prepared_radar_sector', 'response_scope': 'sample_observed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'sample_exchange', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes', 'max_pending_units'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_radar_sector_interval |

<a id="api-sensor-rgbd-source-v1"></a>
## `api.sensor.rgbd.source.v1`

Control-only polling contract for paired color/depth samples with explicit capture-set identity.

### Controls

| Endpoint | Payloads and timing | Semantics |
| --- | --- | --- |
| `rgbd_cycle` | request=msg.sensor.rgbd.v1/RgbdCycleRequest, response=msg.sensor.rgbd.v1/RgbdCycleResponse, timing_support=required | periodic=required; validity=runtime_envelope; scheduling=provider_dispatch; late_behavior=reject_expired; common_control={'version': 1, 'request_effect': 'read_prepared_rgbd_sample_set', 'response_scope': 'sample_observed', 'period_policy': 'binding_required', 'execution_policy': 'finite_expiry_commit_check', 'refresh_mode': 'sample_exchange', 'ownership_policy': 'explicit_binding_generation', 'ordering': 'strictly_increasing_cycle', 'repeat_policy': 'no_automatic_replay', 'failure': 'report_domain_status', 'limits': {'source': 'binding', 'required_fields': ['max_update_gap_ns', 'max_command_age_ns', 'max_request_bytes', 'max_response_bytes', 'max_pending_units'], 'provider_bounds': 'constrain_selected_values'}} |

### Contract Semantics

| Area | Declaration |
| --- | --- |
| `frames` | policy=endpoint_declared; dynamic_frames=owning_message_only |
| `timing` | clock_domain=r2kernel_sync; event_envelope={'observed': 'observed_at_sync_ns', 'published': 'published_at_sync_ns', 'received': 'received_at_sync_ns'}; control_envelope={'generated': 'generated_at_sync_ns', 'sent': 'sent_at_sync_ns', 'execute': 'execute_at_sync_ns', 'valid_until': 'valid_until_sync_ns'} |
| `state_model` | owner=provider; lifecycle=runtime_managed |
| `failure_semantics` | transport=runtime_status; domain=endpoint_response |
| `authority` | owner=provider; command_arbitration=exclusive_required_binding |
| `limits` | source=binding; enforcement=provider |
| `conformance` | level=public; payload_time=runtime_envelope_and_transfer_part_header |

<!-- Generated by generate_reference_docs.py. -->

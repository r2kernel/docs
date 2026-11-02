# GNSS Source Control

`api.sensor.gnss.source.v1` is a Control-only interface for polling
the latest receiver-reported GNSS fix. It carries antenna position
measurements; it does not claim a robot pose, heading, or localization result.

The endpoint is `gnss_cycle`. Its typed request and response are
`msg.sensor.gnss.v1/GnssCycleRequest` and
`msg.sensor.gnss.v1/GnssCycleResponse`. The complete field inventory
is in the generated [API Contract Reference](../spec/api-contract-reference.md#api-sensor-gnss-source-v1)
and [Message Index](../spec/message-index.md#msg-sensor-gnss-v1).

## Sample Exchange

The request includes a `ControlCycle` with an explicit generation, strictly
increasing sequence, `sample` intent, and state revision. A client may include
`expected_session_id` and `after_sample_id` to describe the source session and
last consumed sample. While discovering a session, omit the session ID and
omit the cursor or set it to zero. The binding selects the finite sampling period and
limits; runtime expiry and binding generation govern whether a response may
commit. This API does not automatically replay a sample.

| Response status | Meaning |
| --- | --- |
| `sample_available` | A new receiver sample is present in `fix`. Its `fix_mode` may be `no_fix`, which is a valid receiver status. |
| `no_new_sample` | The receiver has not produced a sample newer than the request cursor. No `fix` is returned. |
| `resync_required` | The source session changed. Adopt the response `session_id`, reset the sample cursor, and retry in a new cycle. No `fix` is returned. |
| `device_error` | The provider reports a device-level failure. No fix is implied. |

The source retains its latest fix, so polling can skip intermediate sample
IDs. A `GnssFix` has a positive, immutable `sample_id` that increases within
its `session_id`; the fix and response session IDs must match. A session change
is not a continuation of the old sample sequence.

## Position, Time, And Uncertainty

`GnssFix.frame_id` identifies the receiver antenna frame. A valid 2D or 3D fix
has WGS84 geodetic `latitude_deg` and `longitude_deg`. `unknown` and `no_fix`
omit position coordinates. A 3D fix may include `altitude_m`; when present it
must also include `altitude_reference` (`wgs84_ellipsoid` or `mean_sea_level`).
Altitude is never silently assumed to use a particular datum.

The receiver's acquisition time is separate from when the Gateway receives or
returns a sample. `observation_time_status` is `known_sync_time` only when the
source clock has a verified mapping to `r2kernel_sync`; in that case
`observed_at_sync_ns` carries the acquisition time. For `unknown`, omit that
field. Do not substitute Gateway receive time or treat GPS/UTC as
`r2kernel_sync` without a verified conversion.

For `fix_mode: unknown` and `fix_mode: no_fix`, `correction_status` is
`unknown`. A correction-input stream alone does not establish that the receiver
used differential or RTK corrections.

Accuracy fields describe only values the receiver reports. Optional
`horizontal_accuracy_m` and `vertical_accuracy_m` require an
`accuracy_confidence` of `unknown`, `one_sigma`, or `95_percent`. Optional
`position_covariance_m2` is a row-major 3x3 covariance in the local east-north-up
tangent frame, measured in square meters, and is only valid for a 3D fix.
Optional `velocity_enu_mps` contains east, north, and up velocity in meters per
second for a valid fix. `hdop`, `vdop`, and `pdop` retain their dilution-of-
precision meaning; they are not meter-valued accuracy estimates. Omit unknown
or unsupported values instead of filling them with zero.

The `correction_status` records the receiver-reported solution class:
`unknown`, `autonomous`, `differential`, `rtk_float`, or `rtk_fixed`. Do not
infer a fixed or differential solution from the presence of correction input.

## Localization Boundary

The Gateway parses the device protocol and normalizes its reported units and
fields. This position-only source profile does not provide robot-body heading.
The tutorial Localizer converts WGS84 position into the configured local map,
applies the antenna mounting offset, and uses the latest odometry orientation
with its explicitly configured planar map/odometry alignment. This is a
tutorial approximation, not production measurement-time pose fusion. Receiver
course is not body yaw. The Gateway does not expose private positioning
Controls or publish an application pose.

The cleaner tutorial's source is simulated. It exercises typed schemas,
sample identity, time-status handling, binding, and localization wiring; it
does not validate a physical GNSS receiver, its clock conversion, radio
corrections, or real-world positioning accuracy. See the
[GNSS localization tutorial](../tutorials/gnss-localization.md).

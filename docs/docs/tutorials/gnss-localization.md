# GNSS Source And Localization

This tutorial section follows the cleaner robot's standard GNSS source from
the simulator-backed Gateway to the Localizer. It uses
[`api.sensor.gnss.source.v1`](../spec/api-contract-reference.md#api-sensor-gnss-source-v1)
and the typed `GnssCycleRequest`, `GnssCycleResponse`, and `GnssFix` messages.

## Gateway Source

The Gateway provides a public `gnss_source` interface and registers the
`gnss_cycle` Control endpoint. The Localizer requires that same standard
contract; the deployment binds the requirement to
`gateway.device_gateway.gnss_source`. This keeps the reusable interface on the
robot-facing boundary instead of hiding positioning in a tutorial-only
Control.

Each request carries a finite, binding-owned `ControlCycle`. Its sample cursor
lets the source report `no_new_sample`, while a receiver's `no_fix` remains a
normal new sample (`sample_available` with `fix_mode: no_fix`). If the source
restarts, `resync_required` tells the Localizer to adopt the new session and
restart its cursor. The source may return its latest sample and skip earlier
sample IDs; it must preserve a sample's identity and acquisition time.

The simulator prepares fixes on its own sampling period. A Control poll reads
that prepared sample; it does not create a fresh measurement on every request.
The simulator's `/state` view remains for the browser and simulator tooling,
not as a private Gateway positioning feed.

## WGS84 To Map

The GNSS message reports geodetic WGS84 latitude and longitude in degrees in
the antenna frame. Altitude is optional, and an included altitude names either
the WGS84 ellipsoid or mean-sea-level reference. An absent height, uncertainty,
or time remains absent; zero is not a substitute for an unknown value.

The tutorial's explicit WGS84 map origin and simulated clock mapping are in
`tutorials/config/gnss_fixture.yaml`; its ellipsoid-height origin is
37.4219999° N, 122.0840575° W, 12.4 m. The local `map` axes are east, north,
and up in metres. The Localizer imports the `gnss_antenna` observation frame.
The `gnss_antenna_on_body` mount in
`tutorials/subsystems/compound.cleaner/subsystem.yaml` connects that imported
frame to the body 0.12 m forward, 0.04 m to the right, and 0.25 m above the
body origin. The Localizer accounts for that offset using odometry orientation.

This position-only profile does not supply robot-body heading. The tutorial
Localizer applies a planar approximation using the latest odometry orientation
and the explicitly configured map-to-odometry alignment; it is not
production-grade measurement-time pose fusion. Estimate yaw comes from
odometry and that alignment, never from simulator truth heading; a receiver's
course-over-ground is not body yaw. The Localizer publishes its estimated map
pose through the existing localization Event surface for navigation and
application consumers.

## Source And File Boundaries

The tutorial implementation is split across these areas:

| Area | Responsibility |
| --- | --- |
| `tutorials/simulator/arena.py` and `arena_server.py` | Prepare finite, immutable simulated GNSS samples and expose the simulator-only source operation. |
| `tutorials/subsystems/gateway.device_gateway` | Call the simulator/device adapter and serve the standard GNSS Control contract. |
| `tutorials/subsystems/component.localizer` | Convert WGS84 to map coordinates, apply the antenna mount, and use odometry orientation. |
| `tutorials/config/gnss_fixture.yaml` | Declare the tutorial's WGS84 origin, simulated clock mapping, sample period, uncertainty, and localization policy. |
| Robot and compound manifests | Declare the public GNSS source slot, antenna mounting translation, and bindings. |

The simulator's GNSS fixes are deterministic tutorial inputs, not evidence of
hardware receiver behavior, satellite visibility, multipath, atmospheric
corrections, RTK performance, GPS clock-scale conversion, or field accuracy.
The fixture's host-clock mapping is simulation configuration, not evidence of a
real receiver's GPS/UTC-to-`r2kernel_sync` conversion. A real receiver Gateway
must preserve the same measurement meaning while using
the receiver's actual fix, solution class, uncertainty, and verified time
mapping.

For field definitions and status rules, see the
[GNSS Source Control reference](../reference/gnss-source-control.md).

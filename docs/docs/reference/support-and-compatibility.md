# Support and Compatibility

Use this page to check whether R2Kernel fits the intended deployment. For
version-specific changes, measured qualification conditions and release downloads,
see [R2Kernel Releases](https://github.com/r2kernel/r2kernel/releases).

## Supported Targets

Runtime bundles target Linux `x86_64` and `aarch64`. The documented installation
path targets Ubuntu/Debian. The `aarch64` bundles are built but have not been
qualified by running them on ARM hardware. macOS and Windows are not runtime
deployment targets.

The public subsystem SDKs are Python and C++. They expose the same features and
validation rules; see the [Subsystem SDK Reference](subsystem-sdk-reference.md)
for naming differences. No other language SDK is published. The Core C ABI is
the low-level interface used by those SDKs.

Managed execution needs the Linux authority prerequisites, including a delegated
cgroup v2 subtree and the supported process/descriptor facilities. Check
[Resource Authority](resource-authority.md) and
[Container Deployment](../operate/container-deployment.md) before deploying in a
container.

## Version Compatibility

Keep the runtime, SDKs and subsystem processes on the same release. Upgrade every
host in a federation or PTP domain together. There is no mixed-version transport
fallback. The C++ SDK and C ABI use the 1.x ABI baseline; compatible ABI versioning
does not make arbitrary runtime/SDK combinations supported.

An existing prerelease or installation without a readable final version requires
a clean installation. Keep configuration and credentials you need, then follow
[Installation](../getting-started/installation.md). Historical rename lists and
upgrade changes belong in the official release notes.

## Timing and Hardware Limits

R2Kernel is not qualified for hard-real-time operation. A finite benchmark is not
a WCET bound, physical-actuator completion guarantee or general 1 kHz acceptance
result. Python is outside strict 1 ms periodic acceptance. Same-slot named
shared-memory synchronization latency and throughput are not measured.

Host-to-host Control is best effort. Hardware PTP following under the standard
PTP timescale and interoperability with third-party PTP hardware have not been
verified on hardware; no hardware time-sync accuracy is claimed. If the time-sync
supervisor is killed with `SIGKILL`, kernel tick and frequency settings are not
restored. Use [Time Sync Operations](../operate/time-sync-operations.md) and
[Deployment Checks](../operate/deployment-checks.md) for workload acceptance.

## Trust and Recovery Boundaries

- Shared IPC groups and federation keys are for mutually trusted participants.
  Control authentication does not encrypt payloads or prove physical sample time.
  Brokered CAN/UDP descriptors and host-wide network capabilities do not provide
  hostile-tenant isolation. See [Web and API Security](../operate/web-and-api-security.md).
- Some package-provided spec and Gateway contract reads are not bounded by file
  type, size or execution time. Treat package inputs as trusted; validation is
  not a sandbox. Blocking filesystem operations can outlast a request deadline.
- Keep recovery state after failed or uncertain cleanup. Package uninstall can
  retain instance runtime directories under `<prefix>/var/run/packages/<uid>/`;
  remove them only when no longer used. See [Troubleshooting](../operate/troubleshooting.md).
- Participants in a named shared-memory topic must use the same release.
  Interrupted writes have no rollback. Do not reuse a shared-memory handle in a
  forked child. See [Data Types and Binary Encoding](data-types-and-binary-encoding.md).
- A forked child must not use or destroy an inherited native client. C++ lifecycle
  calls need coordinated ownership: cross-thread dependency cycles are not
  detected, `terminate()` is not async-signal-safe, and a handler that ignores
  cancellation can block shutdown. See the [Subsystem SDK Reference](subsystem-sdk-reference.md).
- Resource-service stalls and admission overload can delay handlers, heartbeat
  and federation readiness. Event timing diagnostics can have coverage gaps.
  WebSockets do not provide a general ping, idle-limit or send-timeout contract.
  See [Deployment Checks](../operate/deployment-checks.md).

Use the package instance API for link-layer status that the Console does not
show. Retiring a federation key pauses affected Event traffic until the peer
reconnects. For product-specific release limitations and qualification evidence,
use the official [R2Kernel Releases](https://github.com/r2kernel/r2kernel/releases).

# Resource Control

R2Kernel resource control applies to subsystem processes launched as managed
packages. It validates declared host-resource claims, records ownership, and
releases accepted resources when the managed process scope ends.

It is not a global Linux sandbox. A process started directly from a shell does
not receive managed resource guarantees.

## Operating Model

A managed launch follows this observable sequence.

1. the package declares its resource requirements
2. the host resource service accepts or rejects the claim
3. the process starts only after admission succeeds
4. launch status reports the guarantees that were applied
5. owned resources are released after the managed process scope ends

Web Console Runtime launches and detached CLI launches use the same authority
path.

## Runtime Configuration

```yaml
resource_service:
  mode: "auto"        # auto, required, or disabled
```

| Mode | Operator meaning |
| --- | --- |
| `auto` | Use the resource service. Control startup and every managed package launch require a running `r2kernel-resourced`; Control does not take over Event SHM pool or package ownership after a service failure. |
| `required` | As `auto`. In addition, creating or removing a named Event lock fails when its resource-service call fails; `auto` then performs that one step locally. Recommended after product-host validation. |
| `disabled` | Run without the resource service: no managed resource admission and no managed package lifecycle. Use only for standalone Core development. `off` is accepted as `disabled`. |

Any other `resource_service.mode` value is a configuration error that names the
accepted values.

The event SHM pool has one owner whenever Resource is enabled (`auto` or
`required`). Core requires Resource inspection and allocation to succeed; it
does not take over creation or deletion after a Resource error. Use `disabled`
explicitly for standalone Core development.

When the resource service is not reachable at Control startup, Control stops
with an error of this form:

```text
failed to inspect shm pool through resource service: failed to connect to resource service <socket>: <error>. resource_service.mode=<mode> requires a running r2kernel-resourced (see Operate > Resource Control). Use resource_service.mode: disabled only for standalone Core development; it disables managed packages.
```

For deployments inside a container, see
[Container Deployment](container-deployment.md).

Core and Resource restarts preserve registered storage across ordinary
shutdowns. Missing, replaced or incompatible storage is rejected explicitly.
Do not modify resource state files manually or delete them during an upgrade.

Stop Core and all SDK consumers before changing existing pool geometry or
retiring storage. Then stop Resource and run:

```text
sudo <prefix>/runtime/bin/r2kernel-resourced --config <prefix>/runtime/config.yaml --retire-shm-pools
```

Use this supported retirement procedure only after all consumers are stopped.
It rejects unsafe retirement and does not guess ownership of unknown storage.
Recovery failures require administrator investigation. Preserve managed
resource state and its configured location across ordinary upgrades.

All cooperating Event/SHM participants must be upgraded together, including SDK
processes. Memory offsets and configured geometry staying unchanged do not make
live mixing with older binaries or direct unsynchronized mappings supported.
Use the SDK or the current low-level transaction/snapshot API; direct memory
access is not a synchronization substitute. These coordination changes have
not established a latency or throughput qualification.

## Service Checks

```text
. <prefix>/env.sh
r2kernel system status
r2kernel resource status
r2kernel resource inventory
```

Install or repair system services from the selected prefix.

```text
sudo <prefix>/bin/r2kernel system install --prefix <prefix>
```

When serial, USB, or device-node packages are used, install the device policy.

```text
sudo <prefix>/bin/r2kernel-device-policy-install \
  --device-group r2kernel-device \
  --device-mode 0660
```

Do not grant normal users broad production device access. Product hardware
should be reached through admitted managed packages.

## Managed Launch

Validate, build, and launch a package.

```text
r2kernel package validate ./my_controller
r2kernel package build ./my_controller \
  --out ./dist/my_controller.r2kernelpkg \
  --force
r2kernel launch run ./dist/my_controller.r2kernelpkg --detach
```

Inspect or stop its lease.

```text
r2kernel resource status
r2kernel launch status <lease-id>
r2kernel resource stop <lease-id>
```

Package parameters must be declared in `package.yaml`. The launcher rejects
undeclared `--set` keys. `package.yaml` must be a regular file of at most 1 MiB;
a FIFO, device or larger file is refused. A parse error names the file, the
kind of error and its line and column, for example
`invalid type at line 3 column 13`; it never repeats text of the file. The
subsystem manifest is read with the
same limits. A file's type is checked before the file is opened, so a FIFO never
blocks and a device node is never opened. A start with bindings (`--bind` or
REST `bindings`) refuses such a subsystem manifest, and package validation
treats it like a missing subsystem manifest. A `subsystem_manifest` path that is
absolute or contains `..` is reported as invalid and is not read. To check a
Gateway's role, validation reads the subsystem manifest a second time and reads
the Gateway contract documents, both without these limits. When the resource
service prepares a launch, it runs that check in a separate process with the
manager's user and groups, a 256 MiB data limit and the launch's 5 s
preparation deadline: a FIFO or an endless file there fails the launch instead
of blocking the resource service. `r2kernel package validate`,
`r2kernel launch run` and package installation in Control run the same check in
their own process without these bounds. Control also runs it, in its own
process, for every package under `packages.additional_paths` on each read of
its package store, not only at installation. Validate, install or add to
`packages.additional_paths` only packages whose files and spec roots you
control.

The resource service reads a package with the identity of the manager that
asked for the launch: that manager's user, group and supplementary groups,
never with more access than the requesting manager has. This covers the package directory, `package.yaml`, the subsystem
manifest, the Gateway role check and every path that validation checks. A
launch of a package the manager cannot read is refused, even when the package
account could read it. Only the instance's runtime directory and log files are
created by the resource service as root, for the package account.

## Package Resource Declaration

A gateway that uses IP networking, CAN and a serial device through the resource
service:

```yaml
schema_version: 1
name: gateway.arm_fieldbus
entrypoint:
  command: bin/gateway
resources:
  cpu:
    cores: [2, 3]
    exclusive: true
  network:
    interfaces:
      - name: enp4s0
        mode: shared
        policy: control-plane
  devices:
    paths:
      - /dev/ttyUSB0
    can:
      - can0
  sandbox:
    network: brokered
    can: brokered
    devices: managed
```

A link-layer claim needs direct `AF_PACKET` sockets, which brokered network
blocks, and its `CAP_NET_RAW` grant reaches CAN interfaces past brokered CAN, so
manifest validation refuses `resources.link_layer` together with either brokered
sandbox. An EtherCAT gateway is therefore a separate package without a brokered
sandbox:

```yaml
schema_version: 1
name: gateway.arm_ethercat
entrypoint:
  command: bin/gateway
resources:
  cpu:
    cores: [4]
    exclusive: true
  link_layer:
    interfaces:
      - name: enp5s0
        mode: exclusive
        access: raw_packet
        protocols: [ethercat]
        grant:
          capabilities: [CAP_NET_RAW]
```

Before launching it, approve its capability for `enp5s0` in the resource
authority policy (`link_layer_grants`; see
[Resource Authority](../reference/resource-authority.md#approve-a-link-layer-capability-grant)).

### Select the adapter per instance

A published gateway package does not need to know each host's adapter name.
Name the interface with one instance parameter instead. The whole `name` must be
a single `{{params.NAME}}` placeholder that refers to a declared `string`
parameter:

```yaml
parameters:
  fieldbus_nic:
    type: string
    required: true
    description: Adapter connected to the EtherCAT segment
entrypoint:
  command: bin/gateway
  args: ["--nic", "{{params.fieldbus_nic}}"]
resources:
  link_layer:
    interfaces:
      - name: "{{params.fieldbus_nic}}"
        protocols: [ethercat]
        grant:
          capabilities: [CAP_NET_RAW]
```

Each instance then names its adapter when it starts:

```text
r2kernel launch run ./gateway.arm_ethercat --instance left_arm --set fieldbus_nic=enp5s0 --detach
```

```json
POST /api/v1/control/packages/{package_id}/start
{"instance_id": "left_arm", "params": {"fieldbus_nic": "enp5s0"}}
```

The value must be a Linux interface name. The package receives it through its
arguments (as above) or as `R2KERNEL_PACKAGE_PARAM_FIELDBUS_NIC`. Reservation,
the root approval and the capability grant all use the actual adapter, so the
approval still names `enp5s0`. A `restart` without `params` keeps the previous
value. A missing or invalid value refuses the launch before anything is
reserved. Literal interface names keep working as before.

The instance status lists each declared link-layer interface under
`link_layer`: `declared` (the manifest name), `parameter`, and, while the
instance runs, the admitted `interface` and its granted `capabilities`.

Relative entrypoints resolve inside the package directory and cannot escape it.

### Subsystem CPU Scheduling

Managed subsystem launches select `SCHED_OTHER` with priority zero when the
CPU claim or its `policy` is omitted. An explicit `policy: other` also resets
an inherited real-time policy. Omitting the CPU claim preserves the launcher's
CPU affinity; a CPU claim must list at least one core in `cores`. Attaching an already-running process without a CPU claim leaves its
scheduler unchanged.

For a controller whose execution has been measured, declare the policy and
priority in its package:

```yaml
resources:
  cpu:
    cores: [3]
    policy: fifo
    priority: 10
```

`fifo` and `rr` require an explicit priority from 1 through 99. A Control
interface does not automatically select a real-time policy for user code.
These package settings are separate from `core_scheduling`, which applies to
R2Kernel's own communication workers. See
[Real-Time Scheduling](realtime-scheduling.md) for placement guidance.

A managed package cannot raise its real-time priority above the admitted claim.
The launcher bounds the package's `RLIMIT_RTPRIO` to the admitted priority, or
to 0 for `policy: other` or an omitted CPU claim, so a package that needs a
real-time priority must declare it as a CPU claim. A real-time limit inherited
from the service manager or a container does not let package code raise its
own priority.

### Per-Instance CPU Claims

A managed start can replace the package's `resources.cpu` claim for one
instance. The replacement claim is validated like the manifest claim and
admitted by the resource service in the same way, including exclusive-core
conflicts.

```text
r2kernel launch run <package-dir> --instance demo.left \
  --resources '{"cpu":{"cores":[2],"policy":"fifo","priority":70}}' --detach
```

`POST /api/v1/control/packages/{package_id}/start` accepts the same claim as
`resources: {"cpu": {...}}`. The claim replaces `resources.cpu` as a whole;
fields are not merged with the manifest claim. The instance record keeps the
claim while the instance runs: a `restart` without `resources` reuses it, and
`"resources": null` returns to the manifest claim. Stopping an instance removes
its record, so a later `start` without `resources` uses the manifest claim.
Launch status reports the
instance's `cpu_origin` (`manifest` or `instance`) as reported by the resource
service.

A package can forbid instance claims:

```yaml
resources:
  cpu_instance_override: forbidden   # allowed (default) or forbidden
```

A start that supplies a CPU claim for such a package is refused.

## Resource Semantics

The Settings page distinguishes requested scheduling policy from observed
policy for active Core workers. Empty observations are not evidence that RT
permissions were granted. Resource operations must preserve configured Core
scheduling; investigate denied or mismatched policies explicitly.

| Resource | Public semantics |
| --- | --- |
| CPU | requests affinity and host-supported isolation; launch status reports applied or degraded guarantees |
| NIC | admits IP networking through selected adapters, shared or exclusive among leases (a brokered UDP socket can still send through any adapter; see [Brokered Network Sandbox](#brokered-network-sandbox)) |
| Link layer | reserves an adapter exclusively among leases and, with a root `link_layer_grants` approval, grants `CAP_NET_RAW`/`CAP_NET_ADMIN` for the whole host (not confined to the adapter or to the declared protocols) |
| CAN | admits use of CAN through selected SocketCAN interfaces (not confined to them; see [Brokered Network Sandbox](#brokered-network-sandbox)) |
| Serial and device nodes | requests access to selected device outlets |
| Frontend listener | requests an instance-scoped listener for a package UI backend |

`network` and `link_layer` name network adapters but express different resource
classes. Use `network` for IP networking. Use `link_layer` for fieldbus gateways
that require raw-link access, such as EtherCAT. Conflicting exclusive claims are
rejected.

Supported link-layer protocol labels are `ethercat`, `cclink_ie_tsn`,
`profinet_rt`, and `custom_l2`. They describe the gateway and are not
enforced. A link-layer capability needs a root `link_layer_grants` approval in
the resource authority policy (see
[Resource Authority](../reference/resource-authority.md#approve-a-link-layer-capability-grant)).
The capability applies to every interface of the host, and `CAP_NET_ADMIN`
amounts to host network administration. Request only `CAP_NET_RAW` unless the
gateway must change interface settings.

## Role Policy

- gateway packages may claim hardware-facing resources
- component packages may claim compute resources and normally use gateway APIs
  for hardware access
- declarative compound packages use component spatial surfaces and Control-free
  API exports; they cannot bind directly to gateways or implement behavior endpoints
- app packages use Event, Procedure, and Operation interfaces through Components,
  directly or via Compound exports, and must not claim device-facing resources

App packages with a browser backend use `resources.sandbox.network: brokered`
and declare the listener through `frontend.context`. Their browser assets remain
static package frontend files served by R2Kernel.

## Brokered Network Sandbox

With `resources.sandbox.network: brokered`, no process of the package's process
tree can create `AF_INET` or `AF_INET6` sockets, or sockets of the families that
reach the network without them (`AF_PACKET`, `AF_XDP`, `AF_LLC`, `AF_SMC`,
`AF_RDS`, `AF_TIPC`, `AF_RXRPC`); the call fails with `EPERM`.
`resources.sandbox.can: brokered` does the same for CAN sockets. A package with
`resources.sandbox.can: brokered` cannot also claim `resources.link_layer`: the
link-layer `CAP_NET_RAW` grant opens `AF_PACKET` sockets that reach CAN
interfaces directly, so manifest validation and the resource service refuse the
combination. With `network`
or `can` brokered, `io_uring_setup`, `io_uring_enter` and `io_uring_register`
also fail with `EPERM`, because io_uring can create sockets without the
`socket` call. Other socket families, such as `AF_VSOCK` or `AF_BLUETOOTH`,
stay allowed. The filter governs socket creation only: a descriptor passed to
the package from outside (for example over a Unix-domain socket) is not
filtered. Local Control and
Event use Unix-domain sockets and are not affected. Code that needs a TCP, UDP,
CAN or frontend listener socket requests it from the resource service through
the SDK, or receives it from the package leader as described below.

Brokered CAN decides which packages can use CAN, not which CAN interface they
use. A package with `resources.sandbox.can: brokered` cannot create CAN sockets
itself, so without a CAN claim it cannot reach any CAN interface. Once it holds a
brokered CAN socket, it is not confined to the claimed interface: Linux lets the
holder of a raw CAN socket bind it again or name another interface in each
`sendmsg`, so the package can send and receive on every CAN interface of the
host, including interfaces another package claims exclusively. Give CAN claims
only to packages you trust with every CAN bus on the host. A package without
`resources.sandbox.can: brokered` can open raw CAN sockets directly, because
Linux requires no capability for them.

Brokered network decides which packages get IP sockets, not which adapter
they send through. A package with `resources.sandbox.network: brokered`
cannot create IP sockets itself, so it reaches the network only through
sockets the resource service opens for its claims. Each brokered socket is
bound to its claimed adapter, and the package cannot move it to another
adapter. A brokered UDP socket is still not confined to that adapter for
sending: Linux lets the holder name another interface for each datagram
(`IP_PKTINFO` in `sendmsg`). A package holding a brokered UDP socket can
therefore send through every adapter of the host, including adapters another
package claims exclusively. Give UDP claims only to packages you trust to
send through every adapter of the host.

`tcp_ports` and `udp_ports` of a `resources.network.interfaces[]` entry list the
ports a brokered socket may bind. An empty list allows port 0 (chosen by the
kernel) and every port at or above the host's
`net.ipv4.ip_unprivileged_port_start` (1024 by default); a lower port must be
listed. A non-empty list allows only the listed ports and port 0. If the host
setting cannot be read, a request for an unlisted non-zero port is refused.

The launcher sets `R2KERNEL_SANDBOX_NETWORK=brokered` (and
`R2KERNEL_SANDBOX_CAN=brokered`) in the package environment, for broker
launches and `r2kernel launch run` foreground launches alike. The kernel logs
denied socket calls, subject to the host's `kernel.seccomp.actions_logged`
setting.

### Passing Brokered Sockets To Child Processes

By default (`resources.sandbox.fd_delegation: leader`), only the package's leader
process, the process the launcher started, receives brokered descriptors. Two
patterns serve multi-process packages:

- **Leader pass-through (default).** The leader requests the socket and passes
  it to its child. The child names the inherited descriptor through
  `R2KERNEL_INHERITED_FDS`; the Python and C++ SDKs provide helpers that encode
  the value in the leader and validate the descriptor in the child. Validation
  failure is an error that leaves the descriptor unchanged; the helpers never
  fall back to a broker request. See
  [Subsystem SDK Guide](../api/subsystem-sdk-api.md#brokered-sockets-in-child-processes).
- **Lease-scope delegation (opt-in).**
  `resources.sandbox.fd_delegation: lease_scope` lets any process inside the
  package's lease scope request brokered network descriptors (TCP, UDP, CAN
  and frontend listener sockets) directly. It
  requires Linux 6.5 or later (`SO_PEERPIDFD`); on an older kernel the request is
  refused. Device descriptors (`resources.devices` paths and serial devices)
  stay leader-only. Refusals name the reason and are
  written to the resource service journal, rate-limited.

```yaml
resources:
  sandbox:
    network: brokered
    fd_delegation: lease_scope   # leader (default) or lease_scope
```

## Stop And Cleanup

Lifecycle `stop` and process termination are separate. Lifecycle `stop` asks the
subsystem to enter its safe stopped state. Process `terminate` ends the managed
process scope with a grace period. Process `kill` skips that grace period.

The process-action result reports whether graceful termination succeeded or a
forced kill was required. Resource ownership is not released until the managed
process scope is gone.

The resource service handles a stop without blocking its other work: other
admitted requests keep progressing while a stop runs. A stop takes at most about
9 s (3 s graceful, 2 s forced, 2 s exact-child reap, 2 s scope retirement).
Clients wait up to 10 s;
when that wait expires, the outcome is reported as unknown while the operation
continues. While a stop, kill, terminate or release runs, or while a cleanup is
retained, the lease receives no new descriptors, attachments or membership
proofs.

A reservation whose cleanup failed is retried automatically with back-off
(1–30 s) and reported with its `recovery_state`; it does not consume launch
capacity. When 64 reservations are retained, new launches are refused
explicitly. When the resource service's request queue, reply capacity or
incomplete-request capacity is exhausted (including rotation of a peer's oldest
incomplete request), a still-connected requester receives an explicit refusal
and the request is not dispatched.

On resource service shutdown, all leases are stopped concurrently within about
10 s. Pending shared-memory registry operations are waited for within the same
budget. Work still queued or running at the deadline is abandoned and reported
as an error; an idle registry worker never produces this error.
A scope that cannot be proven empty makes the service exit with an error,
and the next start refuses until the scope is recovered; see
[Manager and Device Authorization](../reference/resource-authority.md#recover-after-a-resource-daemon-crash).
Managed packages are started inside their lease scope and inherit no resource
service descriptors other than standard I/O and their start gate.

Foreground launches by an approved ordinary operator retain that operator's
identity and terminal I/O. Cleanup terminates the owned process scope, reaps
the exact child, and only then releases the reservation. An incomplete cleanup
returns an error and retains the reservation for explicit recovery; a leader
exit or warning alone is not a successful release.


Application signal handlers remain best effort. Product safety must not depend
on application-level signal acknowledgement alone.

## Direct Execution

A directly executed SDK process can register identity, bindings, and lifecycle
status, but it does not receive:

- a resource lease
- managed resource admission
- managed process ownership
- host isolation guarantees
- managed frontend listener grants

Use direct execution for development. Use managed launch for product deployment.
Host policy must restrict unmanaged shell or root access when a product requires
R2Kernel to be the only hardware execution path.

## Validation

Use [Resource Policy](../tutorials/advanced-resource-policy.md) to exercise CPU,
network, link-layer, CAN, serial, and device claims on a suitable Linux host.

## Related Pages

- [Resource Authority](../architecture/resource-authority.md)
- [Managed Packages and Runtime Instances](../architecture/managed-packages-and-app-runtime.md)
- [Subsystem Packages](../tutorials/advanced-subsystem-packages.md)
- [Web Console Manual](web-console-manual.md)

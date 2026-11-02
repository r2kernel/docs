# Container Deployment

This page describes the one container arrangement that the R2Kernel runtime
supports and the conditions it needs. The requirements below are derived from
the checks the runtime performs. Container runtimes and orchestrators are not
part of release qualification, so this page does not provide a tested recipe
for a particular container engine.

## Supported Arrangement

Run Control, the resource service (`r2kernel-resourced`) and the managed
packages in one container, or in containers that share one PID namespace and
see the same runtime files. Provide a writable, delegated cgroup v2 subtree to
that container when you create it.

Two properties of the runtime lead to this arrangement:

- the resource service identifies every client by the process ID that the
  kernel reports for its socket peer, then reads that process's cgroup and
  executable through `/proc`; it must see Control, the launchers and the
  package processes in its own PID namespace
- a manager (Control or a launcher) is accepted only when its executable is the
  same file, by device and inode, as an entry in the policy's
  `manager_executables`; the resource service must see the same runtime files
  that the managers execute

The broker, its Control and its packages must also share their POSIX IPC objects
and `/dev/shm` view. Independent Control hosts need separate IPC namespaces and
private `/dev/shm` mounts when emulated on one kernel: changing only pool names
does not isolate global named semaphores used by internal publishers/subscribers.
Do not run several independent host Controls against one shared semaphore
namespace or ignore unlink failures to make that arrangement appear healthy.

A container runtime that cannot give the container a writable, delegated
cgroup v2 subtree without privileged mounts is not supported. This guide does
not recommend `CAP_SYS_ADMIN`, an unconfined AppArmor profile or remounting
cgroupfs from inside the container. A relaxed mode that runs managed packages
without the resource service does not exist.

## Resource Service Mode

```yaml
resource_service:
  mode: "required"    # auto, required, or disabled
```

With `auto` or `required`, Control requires a running resource service when it
starts and does not create or own the Event shared-memory pool itself. Without
the service, startup fails with:

```text
failed to inspect shm pool through resource service: failed to connect to resource service <socket>: <error>. resource_service.mode=<mode> requires a running r2kernel-resourced (see Operate > Resource Control). Use resource_service.mode: disabled only for standalone Core development; it disables managed packages.
```

Use `disabled` only for standalone Core development. It disables managed
resource admission and the managed package lifecycle.

## Authority Policy

The resource service reads the root-owned authority policy described in
[Manager and Device Authorization](../reference/resource-authority.md). Inside
the container, the policy file, each `manager_executables` entry and all of
their parent directories must be owned by UID 0 as seen in the container,
without symlinks and without group or world write permission. If the policy
cannot be read, the service stops with:

```text
resource authority policy <path> is unavailable: <error>. Create the root-owned policy described in Reference > Resource authority (installer default /etc/r2kernel/resource-authority.json), or set R2KERNEL_RESOURCE_AUTHORITY_POLICY to an existing root-owned policy.
```

List the executables as installed in the container image, for example
`<prefix>/runtime/bin/r2kernel-control`, using canonical absolute paths.

## Delegated Cgroup Subtree

`package_cgroup_root` names the subtree under which the resource service
creates one scope per lease. It must:

- be a dedicated directory below `/sys/fs/cgroup`, not `/sys/fs/cgroup` itself
- exist before the resource service starts, owned by UID 0, with root-owned,
  non-writable-by-others parent directories
- contain `cgroup.kill` (Linux 5.14+) and a `cgroup.procs` file that the
  resource service can write

Otherwise the service stops with:

```text
package_cgroup_root <path> must be a writable, root-owned, delegated cgroup v2 subtree with cgroup.kill (Linux 5.14+); in containers provide a delegated cgroup namespace at container creation (<error>).
```

Provide a private cgroup namespace whose cgroup v2 hierarchy is writable by
the container's root at container creation, typically placed under a host
cgroup that the host's service manager delegates to the container.

To enforce package CPU claims with a cpuset, the `cpuset` controller must be
available inside `package_cgroup_root` (enabled in its parent's
`cgroup.subtree_control`). Without it, launches still apply CPU affinity and
launch status reports `cpu_enforcement: affinity_only_cgroup_degraded`.

## Capabilities And Kernel Interfaces

Each row lists a requirement and the runtime check that creates it. Grant only
the rows your deployment uses, and compare them with your container runtime's
default capability set.

| Requirement | Needed by | Why |
| --- | --- | --- |
| Resource service runs as UID 0 | always | manager clients accept only a root broker peer; the policy and scopes are root-owned |
| `CAP_SETUID`, `CAP_SETGID` | managed launch | package processes switch to the separate package account before the entrypoint runs |
| `CAP_CHOWN`, `CAP_FOWNER` | resource service | runtime directories and sockets are assigned to the package account and the runtime IPC group |
| `CAP_KILL` | stop and kill | the resource service signals package processes that run under another UID |
| `CAP_SYS_PTRACE` | manager authorization | managers disable process dumping, so reading the executable of a manager that runs under another UID needs this capability |
| `CAP_SYS_NICE` or a sufficient `RLIMIT_RTPRIO` | `fifo`/`rr` package claims; Control's Core workers | real-time policies are set for the package before it starts; Control's workers default to FIFO 99 |
| `CAP_SYS_RESOURCE` | broker attachment of an ordinary foreground operator under another UID | cross-UID `prlimit` is required to bound the existing process's `RLIMIT_RTPRIO`, even when reducing it; raising a lowered inherited hard limit also needs this capability |
| `CAP_IPC_LOCK` or a sufficient `RLIMIT_MEMLOCK` | Control with `fifo`/`rr` Core workers | real-time memory preparation locks the configured budget (64 MiB by default) |
| Declared package capabilities (`CAP_NET_RAW`, `CAP_NET_ADMIN`) | link-layer packages | the resource service passes the capabilities a package declares in `grant.capabilities` once the authority policy's `link_layer_grants` approves them for the claimed interface; they must be available to the resource service and apply to the whole host |
| `clone3` with `CLONE_PIDFD` and `CLONE_INTO_CGROUP` (Linux 5.7+) | managed launch | each package is created directly inside its lease scope |
| `pidfd_open`, `openat2`, `seccomp` | resource service and managed launch | process tracking, symlink-free path resolution and the brokered socket sandbox installed in package processes |

When the resource service cannot inspect a manager's executable, the request
fails with:

```text
inspect manager executable: permission denied; the resource service needs CAP_SYS_PTRACE in its namespace to verify manager processes of another UID.
```

When `clone3` is unavailable to the resource service (`ENOSYS`, for example
because the kernel or the container's system-call filter does not provide it),
managed launches are refused with:

```text
managed spawn requires clone3 with CLONE_PIDFD and CLONE_INTO_CGROUP (Linux 5.7+); launch refused: <error>
```

`CAP_SYS_PTRACE` lets root processes in the container trace other processes in
that container. Managed packages cannot use it against each other: their
seccomp filter denies tracing, cross-process memory and cross-process
descriptor (`pidfd_getfd`) system calls.

## Real-Time Scheduling In Containers

The container must allow the scheduling and memory-lock rights listed above for
the Core worker settings and package CPU claims you use. Otherwise set
`core_scheduling: {policy: other, priority: 0}` and avoid `fifo`/`rr` package
claims. See [Real-Time Scheduling](realtime-scheduling.md) for placement and
verification.

## Checks

From inside the container:

```text
. <prefix>/env.sh
r2kernel resource status
r2kernel resource inventory
```

Launch a package, stop it, and confirm that its lease scope is removed without
cleanup warnings, as described in [Deployment Checks](deployment-checks.md).

## Related Pages

- [Resource Control](resource-control.md)
- [Manager and Device Authorization](../reference/resource-authority.md)
- [Real-Time Scheduling](realtime-scheduling.md)
- [Runtime Configuration](runtime-configuration.md)

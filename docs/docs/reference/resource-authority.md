# Resource manager authority and device grants

`r2kernel-resourced` requires a root-provisioned authority policy. The installer creates `/etc/r2kernel/resource-authority.json`; `R2KERNEL_RESOURCE_AUTHORITY_POLICY` selects a different root-managed policy. Existing policy files are preserved and must explicitly include every field below; a policy that omits one is refused with `invalid resource authority policy: missing field ...`. Write `"link_layer_grants": []` when no link-layer capability is approved.

```json
{
  "allowed_uids": [0, 950],
  "manager_executables": [
    "<prefix>/runtime/bin/r2kernel-control",
    "<prefix>/runtime/bin/r2kernel-launch",
    "<prefix>/runtime/bin/r2kernel-subsystem",
    "<prefix>/runtime/bin/r2kernel",
    "<prefix>/runtime/bin/r2kernel-resourced"
  ],
  "package_cgroup_root": "/sys/fs/cgroup/r2kernel-packages",
  "control_uid": 950,
  "control_gid": 950,
  "root_launch_uid": 951,
  "root_launch_gid": 951,
  "federation_key_path": "<prefix>/etc/federation.key",
  "device_grants": [],
  "link_layer_grants": []
}
```

UID/GID 950 identify the Control account and 951 identify a separate package account; use the installed accounts' actual IDs. The package UID must differ from the Control UID. The policy, executable files, cgroup scope and their parent directories must be root-owned, without symlinks or group/world write permission. Use canonical executable paths: substitute the canonical absolute install prefix for `<prefix>` in the example. The federation key is a root-only regular file (mode `0600`, 16–4096 bytes); only an authenticated manager can load its material through the broker. Status and allocation snapshots contain no key material.

A manager must match an approved UID and executable inode and remain outside the package cgroup subtree. A manager can launch only packages it can read itself: the resource service reads the package with the manager's user, group and supplementary groups. Every managed child enters a root-owned lease cgroup before its package entrypoint executes. Executing a manager binary from inside a package retains its package scope and cannot confer manager authority. Manager entrypoints disable process dumping; package seccomp denies tracing, cross-process memory and cross-process descriptor (`pidfd_getfd`) syscalls. Seccomp does not cover `/proc/<pid>/mem`; the kernel's ptrace rules govern it. With `kernel.yama.ptrace_scope` 1 or higher (the Ubuntu default), a process can open the memory only of its own descendants, so managed packages cannot reach each other, and a sandboxed package cannot reach a same-account process outside its own tree. With `kernel.yama.ptrace_scope=0`, any process of the same account, sandboxed or not, can read and write another's memory this way. Keep `ptrace_scope` at 1 or higher on hosts that run brokered packages beside other code of the same account. Foreground attachment is a single-use transition for the claiming manager's direct child, identified by PID and Linux process start time. Reattachment to a different process is rejected. Lifecycle changes, allocation inspection, shared-resource changes and federation-key reads require manager authority. Package FD requests require the original attached process identity and its resource grants. A brokered CAN descriptor is not confined to its claimed interface: its holder can bind it again or name another interface in each `sendmsg`, and so reach every CAN interface of the host, including interfaces another package claims exclusively. A gateway with `resources.sandbox.network: advisory` and without `resources.sandbox.can: brokered` can open raw CAN sockets itself, because Linux requires no capability for them. Brokered networking permits only Unix-domain socket creation, so it also blocks direct CAN sockets; see [Resource Control](../operate/resource-control.md#brokered-network-sandbox). A brokered UDP descriptor is likewise not confined to its claimed adapter for sending: its holder can name another interface for each datagram (`IP_PKTINFO`). Manager clients verify that the connected broker is a root peer before trusting any response. The broker socket stays root-owned; shared IPC directories use root ownership and sticky protection.

Linux cgroup v2, root-controlled package scope, `openat2`, pidfd support and `cgroup.kill` (Linux 5.14+) are required. Missing authority prerequisites fail explicitly. Seccomp supports native x86-64 or aarch64 ABI; compatibility architectures and x32-tagged calls return `EPERM`. All detached launches and root/Control foreground launches run package code under the configured separate non-root UID/GID; privileged root package execution is unsupported. Other foreground operators retain their existing non-root execution identity. Broker foreground launches preserve the calling terminal descriptors and report the actual child exit status. Package directories, required SDK/config files and time-sync files must be accessible to the execution identity. Default runtime paths are `<runtime_root>/<execution_uid>/<instance_id>`. The provisioned shared runtime root is root:IPC-group mode `03770`; UID/instance/log directories are execution-UID:IPC-group `0750`, and logs are `0640`. Existing foreign-owned leaves require an explicit migration and are never adopted. Control home, passwords, overlays and token state must remain inaccessible for package writes.

Membership in the shared runtime IPC group authorizes access to managed shared-memory and semaphore objects. This group is a runtime communication boundary; it does not provide per-package confidentiality or full tenant isolation. Cgroup and process-principal checks protect manager authority, leases and keys. The separate package account does not isolate mutually hostile packages that share IPC-group access.

## Authorize an exact device

A manifest declaration reserves an operator-approved device; it does not authorize the root broker to open arbitrary nodes. No device paths are granted by default. For a gateway using a serial device, identify its stable `/dev/serial/by-id/...` name and authorize only the required access:

```sh
sudo <prefix>/runtime/bin/r2kernel-resourced \
  --grant-device /dev/serial/by-id/REPLACE_WITH_ACTUAL_DEVICE \
  --device-read --device-write
sudo systemctl restart r2kernel-resourced
```

The root-only command validates a character/block device and writes an exact-path grant atomically. It does not accept wildcard grants. Restart after a policy change, then claim or launch the package again. Configure its `resources.devices.serial` or `resources.devices.paths` with the same normalized path. Tutorial and gateway deployments using managed devices require this explicit operator step; installation alone grants no hardware access. Remove or narrow a grant by editing the root-managed policy and restarting the broker.

Relative aliases within `/dev`, including typical `serial/by-id` symlinks, are
supported. Absolute symlink targets, traversal, magic links and ordinary files
are rejected. Direct claims and launches admit an exact device identity, not
permission to open a later replacement at the same pathname. Read/write access
must fit the operator grant. Hotplug or alias replacement requires a new lease;
existing descriptors follow the kernel device lifetime and are not revoked by
a policy edit.

The broker policy controls broker-issued descriptors. Direct-device packages still depend on their separate OS device permissions; do not assign a broad device group to a package when broker-only access is intended.

## Approve a link-layer capability grant

A `resources.link_layer` claim lists `CAP_NET_RAW`, and optionally `CAP_NET_ADMIN`, in `grant.capabilities`. The manifest alone grants nothing. The resource service starts the package with a capability only when the root-managed policy approves that capability for the claimed interface. No capability is approved by default. Add an entry to `link_layer_grants` and restart the broker:

```json
"link_layer_grants": [
  {"interface": "enp5s0", "capabilities": ["CAP_NET_RAW"]}
]
```

```sh
sudo systemctl restart r2kernel-resourced
```

`interface` is the exact interface name of the claim. When the claim names its
interface with a `{{params.NAME}}` placeholder, this is the adapter the instance
selected (for example `--set fieldbus_nic=enp5s0` needs an `enp5s0` entry); an
approval never matches the placeholder itself. `capabilities` lists `CAP_NET_RAW`, `CAP_NET_ADMIN` or both. An entry with an unknown key, an invalid interface name, an empty `capabilities` list or another capability makes the policy fail to load. There is no command-line option for this field; `--grant-device` keeps it when it rewrites the policy. Without a matching entry, the launch is refused before any runtime directory, log or reservation exists, with:

```text
link-layer capability CAP_NET_RAW for interface `enp5s0` requires a root-provisioned approval: add {"interface": "enp5s0", "capabilities": ["CAP_NET_RAW"]} to link_layer_grants in the resource authority policy and restart r2kernel-resourced; CAP_NET_RAW is granted host-wide, for every interface
```

An entry approves the capability for every package that claims that interface. To remove or narrow an approval, edit the policy and restart the broker.

An approved capability is ambient in the package process. It applies to the whole host, not to the claimed interface:

- `CAP_NET_RAW` lets the package open raw and packet sockets on every interface.
- `CAP_NET_ADMIN` amounts to host network administration: addresses, routes, firewall rules and interface state.

The `exclusive` mode keeps other R2Kernel leases off the interface; it does not keep the package off other interfaces. The declared `protocols` are labels, and nothing restricts the package to them. Approve link-layer grants only for packages you trust with the host's network.

## Approved app TCP streams

The optional root `outbound_tcp` policy enables exact-execution TCP grants for
allowed app packages. It is disabled when absent and defaults to an empty
package allowlist. An app still requires brokered network and does not own a
NIC. The broker owns the approved TCP connection and issues an AF_UNIX byte
stream. A fresh broker execution ID prevents a reused lease ID from reusing an
old grant.

See [Approved App Connections](../operate/app-outbound-connections.md) for the
policy fragment, live allocation fields, protected atomic grant-file updates,
limits, renewals, revocation and matched SDK use. Existing authority policy
updates preserve this optional section and do not enable it automatically.

## Managed scope retirement

Stop, kill, release and reap retain the exact reservation, device grants and
process identity until the entire owned scope is empty and removed. A leader
exit alone does not prove that descendants have exited. Cleanup has a separate
two-second budget in addition to stop's TERM/KILL grace periods. Incomplete
retirement fails explicitly and retains recovery ownership; it is not a
successful release with a warning.

SDK shutdown still requires live manager authentication. Unavailable mutation
admission explicitly reports that a request was not dispatched; it does not
authorize a bypass or guarantee proof latency.

## Durable managed launch and replacement recovery

A launch retains its exact lease and original instance request, including
omitted/default parameters, bindings and resource overrides, across package
metadata or durability failures. Such failures remain errors even when the
launch may already have taken effect. Pending launch recovery is recorded in
`.pending-package-launch.json` under `packages.install_dir`.

Subsequent package-store operations reconcile that exact lease without replaying
the launch. Broker unavailability, uncertain cleanup, identity mismatch or an
unreadable recovery file preserves recovery ownership and refuses a new launch.
Inspect the allocation and retained recovery state; do not delete recovery files
or resend launch RPCs to work around an ambiguous outcome.

Restart performs the same side-effect-free launch planning before stopping the
existing instance. Invalid bindings, instance parameters or CPU overrides do not
stop it. The fully merged replacement request and original lease ID are
durably written to `.pending-package-restart.json` before stop. A stop/start
failure preserves this request. To resume, repeat the package restart with its
instance selector and no new overrides; a different replacement request is
refused while recovery is pending. Uninstall and archive replacement of that
package are also refused until restart recovery completes, so the durable
replacement request cannot lose its package or manifest. Recovery revalidates
the manifest and any already-restored lease, so it neither stops a different
launch nor launches an already-restored replacement twice. Empty resource
override objects mean the same manifest-default request during launch and
recovery. Broker resource admission is still final; a valid local plan is not a
promise that resources will be available after stop.

## Stable mutation errors

Broker error replies carry `error_code`; diagnostic `error` text is not a
retry, authorization or idempotence contract. Upgrade Control and the broker
together. Missing codes are treated as internal failures, never inferred from
phrases such as “request was not dispatched” or “resource lease not found”.
Only read-only lease proofs use the existing bounded retry policy; a transport
error is never permission to replay a mutation.

Typed package/broker lifecycle errors preserve the same stable HTTP `code`:

| Code | HTTP | Meaning |
| --- | --- | --- |
| `policy` | 400 | Invalid request or refused package/resource policy |
| `not_found` | 404 | Missing installed package, target or exact lease |
| `conflict` | 409 | Existing instance, allocation or pending replacement conflict |
| `transport` | 503 | Broker transport unavailable; an effectful outcome may be unknown |
| `not_dispatched` | 503 | Broker explicitly refused before dispatch |
| `store_io` | 500 | Package metadata or durability failure; inspect retained recovery state |
| `internal` | 500 | Protocol, execution or cleanup failure; inspect broker/Control diagnostics |

Typed `not_found`, not its wording, makes exact-lease stop idempotent. An
unknown termination outcome retains its reservation until the broker confirms
retirement; inspect allocations before another mutation.


## Managed launch defaults and reconciliation

Manager-only package allocations include an optional `execution_context` with
the execution UID and the base root used for an implicit runtime directory.
These values describe the broker's resolved launch. They do not grant
authority to a package or registration. Public allocation summaries omit this
context.

Frozen allocations may also include `package_runtime_exclusion`, the exact
relative mutable-state subtree omitted from the code snapshot. This scope must
match the broker's resolved runtime context. Reconciliation captures current
source code with the same scope, so log writes do not cause code conflicts.
Changes to static siblings still do. Older metadata without this field keeps
its original full-tree content comparison. Public summaries omit the scope.

Deployment, managed restart and runtime apply use that context when resolving
the original request. This keeps runtime parameters consistent when the
manager and broker have different environment settings. Frozen content hashes
and execution IDs remain separate from the requested launch settings. A valid
execution ID is still required for an approved outbound grant.

Older allocations without this context use only the public resolver's exact
legacy runtime layout. An arbitrary runtime path is not accepted as a recovered
default. Update the runtime and CLI together.

## Recover after a resource daemon crash

Restarting Control preserves leases held by the running resource daemon. A resource daemon startup refuses to proceed whenever aggregate `cgroup.events` reports processes anywhere in its dedicated root-owned subtree, including root-direct processes and unknown or legacy child scopes. It never signals them or reuses their grants automatically. After confirming that the resource daemon is stopped, root can inspect and explicitly retire those scopes:

```sh
sudo <prefix>/runtime/bin/r2kernel-resourced --config <prefix>/runtime/config.yaml --inspect-orphan-scopes
sudo <prefix>/runtime/bin/r2kernel-resourced --config <prefix>/runtime/config.yaml --stop-orphan-scopes
```

Inspection reports each managed scope and the observed process PID/start time.
Recovery requires exclusive access to the selected resource daemon and package
scope. If another daemon or recovery operation owns it, recovery is refused.
Missing kernel support or incomplete retirement is an explicit error. Only exact
managed scopes are eligible: unknown or legacy scopes require explicit root
administration and are never killed or adopted automatically. Restart the
resource daemon and launch packages again after recovery. Before migrating a
legacy installation, stop its existing package instances; legacy instances
outside the provisioned subtree cannot be adopted safely.

The read-only `verify_control_manager_peer` broker query reports only a Boolean manager proof and supports direct or unleased SDK clients allowed to access the root socket. Manager mutations, inspection and federation-key access retain the full manager principal checks. Broker input is limited to one complete JSON line, 1 MiB and a five-second deadline, including descriptor-bearing requests.

Slow or incomplete clients and pending brokered network connections have
bounded lifetimes and do not monopolize unrelated clients. At most 16 brokered
TCP connects are pending at once, and at most 4 per lease; a further connect is
refused before a socket is opened (`lease already has the maximum number of
pending TCP connects; request was not dispatched`). Admission capacity
exhaustion is an explicit error before resource mutation begins. A pending
network connection uses its original request deadline and is cancelled when
that request expires or disconnects; a returned descriptor still requires the
same live lease and exact process identity. An ambiguous failure is not
permission to replay an effectful request automatically.


Managed child environments remove the configured federation key, API-token and Console password variables, including their default names, in detached and foreground paths. These manager credentials are reserved for manager entrypoints and are also removed from manifest overrides. Package-specific credentials require separate variable names and explicit package configuration.

Packages inherit only public bootstrap settings (PATH, locale, managed Python/library/spec and runtime IPC configuration) plus their manifest environment and broker-issued runtime identity. Private ambient manager variables are omitted. HOME, USER and LOGNAME come from the provisioned execution account. Configure application-specific environment explicitly in its manifest.

### Verify the installed package boundary

Use an operator-provisioned integration host and a trusted probe package. Do
not change accounts, service policies or kernel settings merely to make a
check pass.

1. Launch the probe in detached mode and through root/Control foreground
   launch. Check its real, effective, saved and filesystem UIDs against the
   configured non-root package UID, which must differ from Control's UID.
2. From the package, attempt broker status, allocation inspection, lease
   mutation and federation-key read, including by executing an approved manager
   binary. All manager requests must be denied while runtime bootstrap still
   works.
3. Check that configured and default manager credential variables are absent,
   and that no manager socket, key file or non-stdio descriptor reaches package
   exec. Ordinary non-root foreground launch preserves the operator UID but
   marks every descriptor above stdio close-on-exec before package code runs.
4. After an interrupted managed launch or restart, inspect the exact lease and
   retained recovery state before another mutation. Recover using the
   documented package operation; never delete a recovery journal or replay an
   ambiguous launch request to bypass a refusal.

These checks describe the deployment contract, not evidence that a particular
installation has passed it.


## Privileged time-sync storage

Managed time-sync services require `R2KERNEL_TIME_SYNC_CONTROLLER_UID` (the actual Control UID) and `R2KERNEL_RUNTIME_IPC_GROUP` in their root-protected units. The override directory `/run/r2kernel/time-sync` belongs to Control:IPC-group with mode `0750`; `timesyncd.override.json` belongs to Control:IPC-group with mode `0600`. The root supervisor's log directory belongs to root:IPC-group with mode `0750`, and its status/log files use `0640`; the unit uses `UMask=0027`. IPC members, including ordinary operators and the package account, may read shared root-owned status through the protected output policy. Only root may write those output files; the controller/root override policy remains separate. Packages cannot replace overrides or output files. Root override writes preserve the provisioned Control owner.

The supervisor rejects symlinks, non-regular or multiply linked files, unexpected owners/groups, writable ancestors and legacy permissions before consuming an override or opening output. Missing overrides are optional; malformed or unsafe overrides fail explicitly, even when stale. Upgrade unsafe legacy directories/files only after an operator reviews their contents and explicitly restores the documented owners and permissions. The installer does not silently adopt those objects. A missing privileged supervisor does not permit Control to widen root log permissions or select another output path.

Direct user/root runs without the controller environment use directories owned by the effective UID and private files (`0600`). Existing shared or foreign-owned files need explicit migration. Disabled and logical profiles do not create an otherwise unused log directory. These storage checks do not alter clock selection or synchronization algorithms.

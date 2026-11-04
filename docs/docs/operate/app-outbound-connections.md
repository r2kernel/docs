# Approved app outbound connections

Use an approved TCP stream when a managed `role: app` package must contact a
supervisory service or another robot. This connection is separate from
federation. It does not add the remote robot to the local robot's runtime.

The host administrator approves one numeric destination and port for one
running app execution. The broker owns the TCP connection. The app receives
a connected Unix stream, so it cannot reconnect that descriptor to another
IP destination. Components continue to use R2Kernel interfaces and their
declared frontend backends.

This feature requires a runtime advertising `approved_tcp_stream_v1` and
matching Python or C++ SDK support. Configured authority is reported separately
as `approved_tcp_streams_enabled`. An older runtime refuses the new operation.
The SDK does not fall back to a general socket or a different package role.

## Enable the host policy

Add the optional `outbound_tcp` section to the root-owned
`/etc/r2kernel/resource-authority.json`. Keep the existing identity, executable,
device and link-layer fields. The feature stays disabled when this section is
absent. An empty `allowed_packages` list authorizes no app packages.

```json
{
  "outbound_tcp": {
    "grants_path": "/run/r2kernel-app-egress/grants.json",
    "allowed_packages": ["example.robot_supervisor"]
  }
}
```

This is a fragment to merge into the existing authority document, not a
replacement for the complete policy. Restart `r2kernel-resourced` after editing
that policy. Grant-file updates below do not require a restart.

<details>
<summary>Optional limits and snapshot location</summary>

| Setting | Default | Accepted range |
| --- | --- | --- |
| `snapshot_root` | `/var/lib/r2kernel-approved-packages` | absolute normalized cache path on executable storage with protected ancestors |
| `max_package_bytes` | 67108864 | 1–268435456 |
| `max_package_files` | 4096 | 1–16384 |
| `max_snapshots` | 64 | 1–4096 |
| `max_streams` | 64 | 1–1024 |
| `max_streams_per_lease` | 4 | 1–`max_streams` |
| `buffer_bytes` | 16384 | 1024–65536 per direction |
| `poll_ms` | 100 | 10–1000 |
| `max_grants` | 256 | 1–4096 |
| `max_grant_ttl_seconds` | 60 | 1–3600 |

The package allowlist has at most 256 distinct package names. Set both stream
limits when choosing a host limit smaller than the default per-lease limit.

The snapshot cache contains executable code. Its filesystem must allow
execution and support POSIX ACLs. `/run` is often mounted with `noexec` and is
not a suitable cache location on those hosts. Preflight checks the cache or
its nearest existing parent without creating it. The broker checks the actual
opened cache before publishing or reusing a snapshot. A `noexec` filesystem
causes an explicit error. There is no automatic fallback or remount.

To use another location, set `outbound_tcp.snapshot_root` explicitly. Provision
its parent directories before launching packages. Every ancestor must remain
root-owned without group or other write access and must allow the manager and
execution accounts to traverse the path. The broker creates a missing cache
directory with the required protected access. It validates an existing cache
rather than changing its permissions to adopt it.

</details>

The app package must declare `resources.sandbox.network: brokered`. Do not add
NIC, CAN, serial, device or link-layer claims to enable this feature. Its
entrypoint and working directory must resolve inside the frozen package tree.
The resolved runtime directory is mutable state and is excluded from that tree.
Keep executable code, subsystem specifications and static assets outside it.

For a source-local implicit default, the broker excludes the resolved runtime
base, including its UID and instance directories. For an explicit source-local
runtime path, it excludes only that exact subtree. Static siblings remain part
of the content identity. An external runtime path needs no source exclusion.
Creating or writing runtime logs does not change the frozen code identity.

Allowed app packages execute from a root-owned, read-only snapshot. Its V2
content identity includes file paths, executable bits, file bytes and empty
directory structure. POSIX ACLs grant read/execute access only to the requester
and execution accounts, in addition to root. The snapshot cache is not made
world-readable. Newly created source-local runtime ancestors also preserve
the requester's access for later admission checks. The requester receives
read/execute access to static parent directories and traverse access to state
directories. This does not grant read access to log files. Existing directories
are validated rather than adopted. The platform must support the required descriptor-safe path
resolution and POSIX ACLs. An unsupported filesystem or unsafe source is an
explicit launch failure.

Foreground CLI runs of a selected allowlisted package use a broker-owned
launch so that app receives a frozen execution identity. Other packages keep
their existing foreground route. A claim-only client cannot attest a frozen execution: an allocation
without a broker `execution_id` cannot receive an approved stream grant.

Use `--detach` when starting the app from a terminal. Broker-owned foreground
execution supports sessions without a controlling terminal and without terminal
stdio. It does not provide interactive terminal job control. The CLI refuses an
attached terminal before starting the package, including a shell job whose stdio
has been redirected. Runtime and CLI must support the same package-specific
foreground identity query.

Only foreground runs that keep a non-root caller's UID and GID inherit that
caller's verified supplementary groups. Control service callers are excluded.

Code is rebased into the snapshot while its resolved runtime directory stays
at the original location. Runtime permissions are checked against the original
source and resolved state root, independently of the immutable code location.
Custom default state roots outside the package must already be provisioned with
the required ownership and access. A source-local parent must permit the
execution account to create its state directories. The broker does not change
the ownership or permissions of an existing source directory to make it
writable. Prefer a separate state root, such as the installed service's runtime
root. For a directly started daemon, configure
`R2KERNEL_PACKAGE_RUNTIME_ROOT` or choose an external `--runtime-dir`.

An unchanged frozen app can be kept by a repeated `r2kernel deploy up`. The
comparison checks the requested settings and current package contents without
using the execution ID as a requested setting. The ID identifies one running
execution. Changed source
contents or launch settings still require an explicit replacement. Restart and
runtime apply retain the original request, including an omitted runtime
directory, while checking the defaults that the broker actually applied.

Host interpreters and installed libraries remain trusted runtime inputs.
Package content hashes do not attest those dependencies. Retire unused
snapshots explicitly when the configured cache limit is reached. The broker
does not remove snapshots that might still belong to running executions.
The default cache under `/var/lib` survives broker restarts and host reboots.
Uninstall does not remove this default cache. A custom cache also survives
uninstall when it is outside all installer-managed installation directories.
Keep retained snapshots outside the installation prefix. An upgrade or uninstall
can replace or remove managed contents.
Changing `snapshot_root` selects storage for later launches. It does not move,
rewrite or delete existing snapshots. Before moving or retiring a snapshot,
stop every execution that references its `package_execution_dir` and confirm
that no live allocation still uses it. Keep any snapshots needed for retained
execution records until their retirement is complete.
Failed helper preparation rolls back only the snapshot it newly created.
Successfully prepared code stays cached even if later admission is refused or
the requester disconnects. A process crash may also require explicit retirement.

## Identify the running execution

Launch the allowed app through R2Kernel:

```sh
r2kernel-launch run /path/to/app --detach
```

During provisioning, the app should
wait for its approved connection to become available before starting work
that depends on it. Inspect the live resource allocation as an authorized
manager:

```sh
r2kernel-launch list --json
```

Find the app's `lease_id` and its `package_launch` object. Record these values:

- `package_name` and `instance_id`
- `manifest_sha256` and `package_content_sha256`
- `execution_id`, the fresh 32-character hexadecimal ID created by the broker

Approve the expected package revision and content before issuing a grant.
A package path, instance name or lease ID alone is not an execution identity.
A restart creates a different `execution_id`, even if the same logical lease
ID is used. Old grants do not authorize the replacement execution.

## Publish an exact grant

Create a protected grant directory on the runtime host:

```sh
sudo install -d -o root -g root -m 0700 /run/r2kernel-app-egress
```

The grant file is a bounded JSON document with `schema_version: 1`, a positive
`revision` and a `grants` list. The following example shows its shape. Replace
the execution values with the inspected allocation, choose the real interface
and numeric destination, and set `expires_at` to a current Unix timestamp plus
the required lifetime. The example expiry is deliberately not a current grant.

```json
{
  "schema_version": 1,
  "revision": 1,
  "grants": [{
    "id": "robot-supervisor-control",
    "lease_id": "the-current-lease-id",
    "package_name": "example.robot_supervisor",
    "instance_id": "app.supervisor",
    "manifest_sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "package_content_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "execution_id": "11111111111111111111111111111111",
    "interface": "eth0",
    "destination": "192.0.2.40",
    "port": 443,
    "expires_at": 1,
    "audit": {"purpose": "robot supervisory connection"}
  }]
}
```

The destination must be a numeric IPv4 or IPv6 address. DNS names, wildcard
destinations, listeners and UDP are not part of this operation. `audit` is
optional, with at most 32 string entries. Keys may contain at most 64 bytes,
and values at most 256 bytes. Control characters are refused. These annotations
do not authenticate a remote robot, project, user or execution, and changing
them does not change the grant's network authority.

Write a complete replacement to a temporary file in the protected grant
directory, set its owner to root and mode to `0600`, then rename it over
`grants.json`. Use a local filesystem and an atomic replacement. Do not edit
the active file in place. Every complete update must increase `revision`.
Reusing a revision with different contents or rolling it back invalidates the
authority. A read that observes a changed inode or modified file is refused.

There is no automatic grant catalog exposed to apps. Give the app its selected
grant ID through an explicit deployment parameter or other approved
configuration. Keep API credentials separate from grant IDs and audit labels.

## Open the connection in the app

Python and C++ expose the same operation. Call it after the administrator has
published the grant for this execution.

```python
from r2kernel.core import ResourceBrokerClient

opened = ResourceBrokerClient().open_approved_tcp_stream(
    grant_id="robot-supervisor-control",
)
try:
    stream = opened.socket
    # Pass stream to the protocol client that supports an existing socket.
finally:
    opened.close()
```

```cpp
#include "r2kernel/core/resource_broker_client.hpp"

auto opened = r2kernel::core::ResourceBrokerClient().open_approved_tcp_stream(
    "robot-supervisor-control");
// Pass opened.socket to a protocol client that accepts an existing descriptor.
opened.close();
```

Both SDKs require a root broker peer and validate the grant ID, lease ID,
execution ID and actual connected Unix stream descriptor. An invalid response
closes the received descriptor. Requests are sent once. A transport failure is
not permission to replay a mutation or bypass the broker.

The stream carries application bytes. TLS, certificate verification, API
authentication and the remote service's authorization remain the application's
responsibility. A client that wraps the socket in TLS must use the expected
server name and verify its certificate. Receiving a connected stream does not
prove that the peer is an authorized robot controller.

When the peer is another robot's Host Control API, configure its reachable
listener and API authorization separately. Follow
[Web and API Security](web-and-api-security.md) on that robot.

## Renew or revoke

For renewal, publish a higher document revision and extend the grant's
`expires_at` within `max_grant_ttl_seconds`. Keep its execution identity and
network authority unchanged. Reading the same expiry repeatedly cannot extend
its monotonic lifetime. Change the endpoint or execution by issuing a new
grant and opening a new connection.

To revoke one grant, remove it and publish a higher revision. To revoke all
grants, publish a higher revision with `"grants": []`. Deleting or making the
file invalid also causes the broker to fail closed. Restore service with a
valid higher-revision document.

The broker checks authority during connection setup, descriptor handoff and
relay progress. Removal, expiry, source-process exit, lease termination or
unavailable/stale authority shuts down the retained endpoints. This affects
duplicated app descriptors too. Grant polling has a bounded propagation delay,
and bytes already delivered cannot be retracted.

An administrator policy change requires a broker restart. Root remains trusted
to control the host, policy, package cache and clock. R2Kernel does not supply a
fleet identity service, remote robot discovery or a grant issuer for another
product. Build those policies above this exact-execution connection boundary.

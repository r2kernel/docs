# Deployment Checks

Use this page after installing R2Kernel on a host and before treating that host as
a managed deployment target.

These checks answer operational questions.

- is the installed runtime reachable?
- is the selected time-sync path accepted for the workload?
- are the Web/API security gates configured for the deployment network?
- can managed packages launch through the runtime path?
- are resource leases visible and released correctly?
- is cross-host Event delivery ready before collecting one-way latency numbers?

Readiness and finite functional smoke are not throughput or real-time guarantees.
Keep the declared-profile periodic qualification below separate from deployment
readiness.

## 1. Runtime Install

Load the installed environment.

```text
. <prefix>/env.sh
```

Check the service state.

```text
sudo systemctl status r2kernel-control.service --no-pager
sudo systemctl status r2kernel-resourced.service --no-pager
sudo systemctl status r2kernel-timesyncd.service --no-pager
```

Check the local readiness endpoint.

```text
curl -sf http://127.0.0.1:8001/api/v1/ready
```

## 2. Managed SDK Smoke

Select a deployment manifest from the application project as `DEPLOYMENT`.
Use the installed SDK and an explicitly Required resource broker; source-only
integration fixtures are not installed public benchmark demos.

```sh
. <prefix>/env.sh
r2kernel deploy validate "$DEPLOYMENT" --json
r2kernel deploy up "$DEPLOYMENT" --json
```

Exercise the project's actual SDK client or application command and observe its
domain response and owned resources. An import check, successful launch, or
transport acknowledgement alone is not application completion. Then stop the
same deployment:

```sh
r2kernel deploy down "$DEPLOYMENT" --json
```

Confirm that its processes, leases and exact cgroup scopes are retired without
cleanup warnings. Do not run withdrawn source benchmark commands from an
installed prefix.

### Timing Results Are Workload-Specific

A functional smoke is not a 1 kHz periodic qualification, and the release
carries no hard-real-time approval; see
[Support and Compatibility](../reference/support-and-compatibility.md).
The historical local C++ raw-eight-byte profile does not qualify Python,
cross-host Control or a different application.

Compare measurements only when they declare the same period, completion
deadline, payload, completion boundary, duration, runtime/SDK artifact identity,
background load and actual scheduling/affinity. Core and application scheduling
are separate; `core_scheduling` reports observed Core settings, not the handler's
settings. An authorized inspector in the correct PID namespace may inspect
loaded binaries and thread policy; do not weaken manager hardening to make
readback possible.

Affinity is not CPU isolation, and a VM guest cannot prove hypervisor isolation.
Record host prerequisites from [Real-Time Scheduling](realtime-scheduling.md).
Do not change global kernel settings, suppress failures or extend deadlines to
turn an unchanged failing workload into a reported pass.

Complete supported provider-ready preparation before relying on a prepared
lane. `prepare_control` reserves declared request/response capacities without
executing a domain command; a registered handler alone is insufficient.
See [Subsystem SDK API](../api/subsystem-sdk-api.md) for preparation, deadline
and completion contracts. Keep cold start, rebind and capacity changes separate
from steady-state measurements.

Every scheduled slot, skip, failed call, deadline and after-window completion
belongs to the result. Successful-only RTT medians or an average rate of 1,000 Hz
do not establish 1 ms completion. A decoded response or Core completion is not a
physical actuator/GPIO timestamp. Finite no-miss results establish only their
declared measured conditions, not universal WCET or hard-real-time guarantees.

Stop/release success requires an empty, removed owned scope and retired
reservation/device state. Incomplete cleanup retains ownership and reports
failure. Do not relax authority or federation security to obtain a passing
functional deployment.


## 3. Time Sync Acceptance

Run doctor before accepting cross-host one-way timing.

```text
r2kernel timesync doctor --wait --stable-polls 3
```

Minimum acceptance checks.

- `time_sync_status.enabled = true`
- selected role and leader match the intended topology
- selected backend is accepted for the workload
- `clock_status.accepted_for_one_way = true`
- `clock_status.domain_compatible = true`
- hardware PTP paths have a valid active NIC and no recent `ptp4l` faults

Strict `50 us` cross-host one-way acceptance requires physical hosts on the same
L2 segment, PHC-capable active NICs, an accepted hardware PTP or
hardware-backed R2Kernel logical clock path, and accepted application-clock
evidence. VM-led or software-timestamp-only runs can validate orchestration and
delivery, but their one-way latency rows remain diagnostic.

Use [Time Sync Operations](time-sync-operations.md) for configuration, startup,
recovery, and failure cases.

## 4. Web And API Access

Before exposing the runtime API outside a trusted local environment, confirm.

- security gates are enabled when remote access is expected
- allowed CIDRs match the operator network
- browser login is enabled for Web Console users
- normal API clients use issued API keys rather than the bootstrap token

Use [Web and API Security](web-and-api-security.md) for the detailed configuration path.

## 5. Managed Package Launch

Install or select a package that declares at least one resource claim, then
launch it through `r2kernel launch`, `r2kernel deploy`, or a managed Runtime launch
in the Web Console.

Confirm.

- package validation succeeds
- the subsystem package starts through the managed launch path
- the Resource page shows the lease owner, resource type, and assigned value
- stopping the package releases the lease

Use [Resource Control](resource-control.md) for resource semantics and service
setup.

## 6. Cross-Host Event Gate

Cross-host one-way Event measurement requires two gates.

- the Event data path for the exact publisher/subscriber pair is ready
- the clock path is accepted for one-way timestamp comparison

Inspect the public control status on both hosts before collecting one-way
samples. The sender must report the requested route as forward-ready and the
receiver as inbound-ready. Each endpoint must also report the opposite endpoint's
`stamped_stream_runtime_status.local_host` in both current native applied lists:
`stamped_stream_runtime_status.runtime.applied.active_peers` and
`subscriptions_synced`. The `connected` list records newly initiated connections
from the latest apply, not current peer membership; an empty list is normal for
established or accepted inbound connections. Desired top-level `connections` and
local reader/sink or
ready-topic observations alone do not establish the native path. Missing
identities, missing applied peer fields, peer loss, or unsynchronized subscriptions
keep readiness closed. Both hosts must accept their clock evidence for one-way
timing.

`subscriptions_synced` lists the peers that acknowledged, on the current native
connection, this host's latest subscription request with a matching digest. A
peer leaves the list on reconnect or after a local subscription change until it
acknowledges again. The same `runtime.applied` report shows the remaining
connection state:

- `subscription_ack_pending`: peers whose acknowledgement is outstanding, with
  the time waited. A subscription request is sent only when the subscription
  set changes, on a new connection, or as a retry after two control status
  intervals without acknowledgement. A peer that never acknowledges stays here
  and never satisfies readiness.
- `connect_backoff`: peers whose outbound connect failed. Retries back off from
  1 s, doubling to at most 30 s per peer, and show the last error.
- `security_mode_incompatible`: peers whose security-mode hint is `required`
  while this host is `disabled`, or the reverse. Such a pair never connects. See
  [Web and API Security](web-and-api-security.md).

For fixture smoke, allocate a new private `0700` directory and a unique publisher
name and topic for each run. Pass the same run identity and absent start-gate
path to the publisher and readiness helper. The helper must observe this run's
publisher startup acknowledgement and current registration before opening the
gate; an existing ready route or an unobserved publisher name is insufficient.
Never reuse or delete the previous run's gate: consumers refuse preexisting
paths before registration. Only the helper creates the exclusive empty `0600`
gate after all checks pass. Unsafe files and symlinks are refused. Retain each
run's reports independently.
The helper's explicit `--scope cross-host` requires a receiver status URL;
`--require-time-sync` checks clocks on both hosts.
A gated C++ publisher or ping whose start gate is refused exits with status 3
and prints `<Publisher|Ping> start gate refused [<code>]: <message>`. The Rust
Event publisher has no start gate and refuses `--start-gate-file`; use the
Python or C++ publisher for gated runs.

Accepted gate reports should show.

- this run's startup acknowledgement and exact publisher identity observed
- requested topics under sender `forward_ready_topics`
- requested topics under receiver `inbound_ready_topics`
- `transport_required=true` and `transport_ready=true`
- two `transport_checks` (`sender` and `receiver`) identifying the opposite
  native `peer_id`, with `active_peers`, `subscriptions_synced`, and `ready` all
  true; `connected` remains a transition diagnostic, not an acceptance condition
- topology fallback flags set to false
- `data_plane_ready=true`
- `time_sync_required=true`, `time_sync_status=accepted`, and
  `time_sync_ready=true`
- `latency_evidence_accepted=true`
- final JSON `ready == true`

Readiness-only Event smoke checks delivery-path setup, not payload delivery or
native transport correctness. The helper uses bounded polling of existing public
status, not packet-path probes. Check the subscriber's actual delivery report
separately; an already-open gate is not revoked if a peer later disappears.
Explicit `--allow-topology-fallback` reports diagnostic topology but cannot
approve cross-host readiness or create its start gate: it returns exit status 1
after timeout with `ready=false` and `latency_evidence_accepted=false`, even when
native peers and clocks pass. It is never automatic. Without fallback, successful
cross-host checks return exit status 0; requested current-run publisher,
consecutive-poll, and clock conditions still apply. Do not use readiness-only or
topology diagnostic one-way latency rows as accepted performance data.

## 7. Runtime Cleanup

Runtime-owned communication and resource state should be reclaimed when the
owning subsystem or deployment stops. Check the public runtime status after an
abnormal termination instead of relying on host implementation directories.

```text
r2kernel deploy down <deployment.yaml>
r2kernel resource status
r2kernel subsystem sessions
```

The deployment is clean when terminated instances no longer appear as active,
their resource leases are absent, and a subsequent deployment can start without
an ownership conflict.

## Result Rule

Treat a deployment as accepted only when the relevant checks pass for the
intended environment. Record VM, software timestamp, stress, or readiness-only
runs as diagnostic evidence rather than production timing evidence.

# Time Sync Operations

This page is the operator runbook for R2Kernel time sync on Linux. It keeps the
command path focused on configuration, verification, and recovery.

Use it when you need these behaviors.

- configure a leader or follower host
- start the managed time-sync service or manual helper
- verify whether one-way cross-host timing can be accepted
- diagnose the common unsynchronized states

For deployment readiness checks, see [Deployment Checks](deployment-checks.md).

## Operating Model

R2Kernel does not make the control backend a global clock server. Time sync is a
host-level responsibility observed by the runtime.

Normal Linux product deployments use the following.

- `r2kernel-control.service` as the non-root host control backend
- `r2kernel-timesyncd.service` for managed time-sync ownership
- `ptp4l` and `phc2sys` for PTP paths
- `r2kernel timesync doctor` and `/api/v1/control/status` for readiness evidence

Do not run the control backend with `sudo`. Keep privileged clock work inside
the time-sync service or explicit `sudo r2kernel-timesync ...` helper commands.

## Modes

| Mode | Time-sync service behavior | Runtime clock behavior |
| --- | --- | --- |
| `auto` | selects hardware PTP, software PTP, or R2Kernel logical time from host evidence | reports the selected backend and acceptance evidence |
| `ptp` | starts linuxptp using the configured `software_timestamping` policy | observes PTP discipline |
| `hardware_ptp` | starts linuxptp and requires hardware timestamping | observes PTP discipline |
| `software_ptp` | starts linuxptp with software timestamping | observes PTP discipline; intended for diagnostics rather than strict production timing |
| `r2kernel_logical` | uses R2Kernel-managed synchronization instead of linuxptp | exposes synchronized runtime time for supported diagnostic and non-PTP environments |
| `r2kernel_logical_hw` | uses R2Kernel-managed synchronization with hardware timestamp evidence | exposes synchronized runtime time and requires the configured hardware evidence |

`r2kernel_logical` and `r2kernel_logical_hw` do not adjust the host system clock.
Applications use the synchronized time reported through the public R2Kernel SDK
and status contracts.

## 1. Configure

Edit the installed runtime config.

```text
<prefix>/bin/r2kernel-config --config <prefix>/runtime/config.yaml
```

Typical keys.

```yaml
control:
  advertise_host: <host-address>
  api_host: 0.0.0.0

federation:
  peers:
    - <peer-host>

time_sync:
  enabled: true
  management_mode: managed
  mode: auto
  role: auto
  leader_host: auto
  transport: auto
  nic: auto
```

For a fixed follower.

```yaml
time_sync:
  enabled: true
  management_mode: managed
  mode: auto
  role: follower
  leader_host: <leader-host>
  transport: l2
  nic: <nic-name>
```

Transport rule.

- prefer `l2` for same-switch physical hardware PTP validation
- use `udp4` for VM, sandbox, or IP-oriented smoke tests

`leader_host` may be an IPv4 address, an IPv6 address (bracketed or not) or a
host name. Host names are resolved in the background (every 30 s, every 2 s
while unresolved), never in the status refresh; an invalid value or an
unresolved name is reported in `upstream_clock_error` or the logical-clock probe
error.
- keep `auto` when local linuxptp defaults are acceptable

With `role: auto` and `leader_host: auto`, every host sorts the host values of
itself and its federation peers as text and picks the first one, so all hosts
agree on one leader, and every host launches the role its status reports. Text
order is not numeric address order: `192.0.2.10` sorts before `192.0.2.2`.
Set `leader_host` explicitly when a particular host must lead, for example when
only some hosts have hardware PTP.

### Leader And Follower Processes

The managed service starts linuxptp as follows.

| Host | `ptp4l` | `phc2sys` |
| --- | --- | --- |
| hardware leader | `--serverOnly 1`: never follows another master on the domain | always `CLOCK_REALTIME` -> PHC with `-w`; it changes only the PHC |
| hardware follower | `-s` (client only); steers its PHC | PHC -> `CLOCK_REALTIME` with `-w`, only with `sync_system_clock: true` |
| software leader | `--serverOnly 1` | not used |
| software follower | `-s`; with `sync_system_clock: false` also `--free_running 1`, so it measures the offset but never adjusts `CLOCK_REALTIME`; with `sync_system_clock: true` `--max_frequency 500000` | not used |

A software follower allowed to steer `CLOCK_REALTIME` keeps its servo within
the kernel's 500 ppm frequency range. linuxptp also moves the kernel `tick` for
`CLOCK_REALTIME` corrections of 50 ppm or more, and leaves tick and frequency at
its last correction when it exits. When such a `ptp4l`, or a follower `phc2sys`,
ends or is stopped, the time-sync service therefore restores the nominal tick and
the frequency from before that process started, so NTP or the next process does
not inherit the correction. A supervisor killed with SIGKILL cannot do this;
check `adjtimex --print` after one.

The domain uses the standard PTP timescale. A hardware leader's PHC carries TAI
and its `ptp4l` announces linuxptp's TAI-UTC offset (37 s); `phc2sys -w` takes
that offset from the local `ptp4l` in both directions, so `CLOCK_REALTIME` stays
UTC on every host. A software follower's `ptp4l` applies the announced offset
itself. An R2Kernel follower can therefore follow a standard grandmaster, and
standard PTP clients (sensors, drives, PTP switches) can follow an R2Kernel
leader. A software leader serves `CLOCK_REALTIME` on an arbitrary timescale
(offset 0), which standard clients also understand. The PHC/system sanity check
expects the offset that `ptp4l` reports (`phc_utc_offset_s`, source `ptp4l`),
or 37 s when `ptp4l` cannot be asked (source `default`).

Older builds kept the PHCs on UTC (`phc2sys -O 0`) and announced the PTP
timescale anyway. Their time is 37 s away from current builds, so upgrade every
host of a domain together. In a mixed domain a hardware follower reports a 37 s
PHC/system offset and refuses to start `phc2sys`, but a software follower with
`sync_system_clock: true` steps `CLOCK_REALTIME` by 37 s; keep
`sync_system_clock: false` on software followers until every host is upgraded.

Run the domain on its own `time_sync.domain` when other PTP
masters share the network: client-only mode (`-s`) stops a follower from
becoming a master but not from following the best master it sees on its domain.
`time_sync.priority1` and `time_sync.priority2` are passed to `ptp4l` when they
differ from 128; a lower `priority1` on the leader makes it win that selection.

A hardware leader is accepted for one-way timing only while its PHC bridge runs.
Older builds started that bridge only with `sync_system_clock: true` and still
accepted the leader, so its followers could track a free-running PHC.

If the runtime API is reachable from the network, enable security and restrict
allowed client CIDRs before treating the host as a managed deployment.

## 2. Start Runtime

For product installs.

```text
sudo systemctl status r2kernel-control.service --no-pager
sudo systemctl status r2kernel-timesyncd.service --no-pager
```

For a development shell.

```text
. <prefix>/env.sh
r2kernel control --config "$R2KERNEL_PREFIX/config.yaml"
```

Readiness check.

```text
curl -sf http://127.0.0.1:8001/api/v1/ready
```

## 3. Start Time Sync

Managed mode is the recommended path.

```text
sudo systemctl enable --now r2kernel-timesyncd.service
```

If services were not installed yet.

```text
sudo <prefix>/bin/r2kernel system install \
  --prefix <prefix> \
  --config <prefix>/runtime/config.yaml
```

Manual helper mode remains useful for bring-up and debugging.

```text
sudo <prefix>/bin/r2kernel-timesync \
  --config <prefix>/runtime/config.yaml \
  --run \
  --component ptp4l
```

Follower example.

```text
sudo <prefix>/bin/r2kernel-timesync \
  --config <prefix>/runtime/config.yaml \
  --run \
  --component ptp4l \
  --role follower \
  --leader-host <leader-host> \
  --transport l2 \
  --nic <nic-name>
```

Use the managed service for normal operation. Use manual helper commands only
when you want foreground logs or a controlled validation window.

## 4. Verify

Run doctor.

```text
. <prefix>/env.sh
r2kernel timesync doctor --json
```

Installed doctor entry points load the same protected, same-prefix IPC and
time-sync storage policy as the managed service. The default log directory is
`<prefix>/var/log/time-sync`, not a legacy runtime log directory. They do not
require `sudo -E` or trust unrelated inherited managed-policy values. Storage
ownership and permissions remain validated; do not work around a failure by
making the directory world-writable or changing a valid configured owner.


For convergence waits.

```text
r2kernel timesync doctor --wait --stable-polls 3
```

Runtime status.

```text
curl -sf http://127.0.0.1:8001/api/v1/control/status
```

Minimum acceptance checks for cross-host one-way timing.

- `time_sync_status.enabled = true`
- selected role and leader match the intended topology
- selected backend is accepted for the workload
- `clock_status.accepted_for_one_way = true`
- `clock_status.domain_compatible = true`
- hardware PTP paths have a valid active NIC and no recent `ptp4l` faults

For PTP followers, a low `ptp4l` master offset alone is not enough. The
application-visible clock must also be accepted. R2Kernel reports that through
`clock_status`, not by assuming the PTP servo is sufficient.

For Event one-way latency, time-sync readiness is necessary but not sufficient.
the Event path gate for the exact publisher/subscriber pair must also report
ready.

### Status Evidence And Service Behavior

Control and `r2kernel timesync doctor` use the time-sync service status as clock
evidence only when it was written by the running service process (matched by
PID and start time) within three poll intervals plus 10 s. Otherwise Control
reports `manager_status_rejected` and doctor reports a `timesyncd_status_evidence`
warning, each stating why the status was rejected.

- Probes the service runs (`pmc`, `ethtool`, `pgrep`) have a 2 s deadline.
  An unfinished probe is killed and logged. At most four unexited probes are
  tracked; beyond that, new probes are refused.
- The time-sync supervisor stops the `ptp4l`, `phc2sys` and recovery processes it
  started when it exits normally, on SIGTERM or SIGINT, when its parent exits,
  and on an error return; on SIGTERM, SIGINT or a parent exit it stops them
  before it writes its final status. Each of these processes is also started
  so that the kernel kills it when the supervisor ends, so a supervisor killed
  with SIGKILL leaves none of them running.
- When Control manages the companion, stopping Control also stops its owned
  time-sync processes. Control waits at most 2 s for this shutdown. If the
  companion runs under an identity Control cannot signal, the restriction is
  reported and the companion exits when its original Control process exits.
  A managed companion that exits is restarted after 1 s, doubling to at most
  30 s. The pending wait appears in top-level `last_error`, not
  `manager.last_error`.
- Control writes the time-sync service override only when its content changes.
  If the configuration is edited afterwards, the override becomes stale and the
  service ignores it.

## 5. Recovery And Failure Cases

### Control reports unsafe time-sync file metadata during normal publication

First inspect the actual type, owner, configured group, mode and link count.
An unsafe pathname or multiple hard links still requires explicit migration;
do not make the directory writable, relax file protections, or disable time
sync to conceal the error.

A concurrent status refresh must not reject an otherwise valid protected
read-only status merely because publication replaced it. Non-regular, foreign,
multiply linked or incorrectly protected input remains unsafe; do not weaken
the documented storage policy to hide such an error.

When a refresh cannot read the manager status at all, for example because its
metadata is genuinely unsafe or its JSON is malformed, Control keeps running.
The time-sync status reports `synced=false`, the reason in `refresh_error` and
`last_error`, and a clock that is not accepted for one-way latency until a later
refresh succeeds. Control logs the reason once per distinct failure and once on
recovery.

The manager status is disposable observation state. Its next publication can
replace an unsafe non-directory object at the configured protected status path,
logging `time-syncd replaced an unsafe status object`; investigate what made it
unsafe. A directory at that path still fails. Other files, including service
overrides, require explicit operator migration.

Use the current runtime rather than repeatedly changing permissions or
restarting an older binary after a normal-publication failure. Stop dependent
applications through their managed lifecycle before replacing the backend, then
confirm registrations, bindings and outputs after restart. Locally replaced
binaries need their own provenance; an unchanged official manifest does not
prove they are the original release artifacts.


### `synced=false`, `ptp4l_running=false`

Likely cause.

- time-sync service is not running
- manual helper was started without direct `sudo`

Fix.

```text
sudo systemctl start r2kernel-timesyncd.service
r2kernel timesync doctor --json
```

### `synced=false`, `ptp4l_running=true`, `offset_ns=null`

Likely cause.

- telemetry has not converged
- `pmc` cannot read linuxptp status
- the configured log directory does not match the active helper/service

Fix.

- wait and rerun doctor
- inspect the active time-sync log path
- confirm `pmc -u -b 0 "GET TIME_STATUS_NP"` works on the host

### A software-timestamping host's system clock runs fast or slow

Older builds ran a software-timestamping `ptp4l` without `--free_running` even
with `sync_system_clock: false`, and without `--serverOnly` on a leader. Such a
host could follow any master on the domain and steer `CLOCK_REALTIME`, fighting
NTP. When the servo needs more than 500 ppm, linuxptp also changes the kernel
`tick`, and `ptp4l` leaves the tick changed when it exits. Stop
`r2kernel-timesyncd.service`, check the tick (`adjtimex --print`, normally
`10000`), restore it if needed, and let NTP step the clock back. Then upgrade.

### Follower reaches `SLAVE`, but one-way timing is rejected

Likely cause.

- PHC is tracking the master, but `CLOCK_REALTIME` is not accepted
- `phc2sys` is not running or is blocked by sanity checks
- another host time service is moving the system clock

Fix.

- stop competing time services for the validation window
- confirm the leader PHC bridge is running when required
- run the guided PHC/system recovery only when an explicit clock step is allowed

```text
sudo <prefix>/bin/r2kernel-timesync \
  --config <prefix>/runtime/config.yaml \
  --component phc-system-recovery \
  --run \
  --allow-clock-step \
  --max-clock-step-ns <bound>
```

After recovery, start normal time sync again and require
`clock_status.accepted_for_one_way=true` before accepting one-way latency.

### Doctor cannot read `/dev/ptpN`

Treat this as an observability or permission issue first. Use managed
`r2kernel-timesyncd` telemetry, run doctor with suitable privileges, or grant
read access to the PHC device for the validation user.

### Time sync is disabled in config

The runtime may be using a different config file than the one you edited.
Re-apply the config and restart the relevant runtime service.

## 6. Stop

Stop only the time-sync companion when you are validating or changing time-sync
policy.

```text
sudo systemctl stop r2kernel-timesyncd.service
```

If you started the helper directly in a foreground terminal, stop that helper
process from the same terminal. Stop `r2kernel-control.service` only when you are
intentionally shutting down the host control backend.

## Related Pages

- [Federation Time Model](../architecture/federation-time-model.md)
- [Deployment Checks](deployment-checks.md)
- [Troubleshooting](troubleshooting.md)
- [CLI Tools](cli-tools.md)

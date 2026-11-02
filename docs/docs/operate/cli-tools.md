# CLI / Entry Points

The stable user-facing command is `r2kernel`. After sourcing `<prefix>/env.sh`,
`<prefix>/bin` is added to `PATH`. Operators should prefer the unified command
form unless a guide explicitly calls out a lower-level binary.

Read [Runtime Configuration](runtime-configuration.md) first when you need to
understand what a command changes in `config.yaml`. This page focuses on the CLI
entry points used to inspect, change, and operate an installed host.

```text
. <prefix>/env.sh
r2kernel --help
```

Product deployments normally manage daemons through systemd. Development
workflows can start the same daemons directly through `r2kernel control` or the
lower-level binaries described below.

## Operator Commands

| Command | Dispatches to | Purpose |
|---|---|---|
| `r2kernel status` | `r2kernel-doctor` | show installed runtime status and diagnostics |
| `r2kernel control [args]` | `r2kernel-control` | run the host control backend directly |
| `r2kernel serve [args]` | `r2kernel-control` | alias for `r2kernel control` |
| `r2kernel config ...` | `r2kernel-config` | inspect or edit runtime configuration |
| `r2kernel package ...` | `r2kernel-package` | validate or build managed packages |
| `r2kernel launch ...` | `r2kernel-launch` | start, restart, stop, and inspect managed package leases |
| `r2kernel deploy ...` | built in | validate, plan, start, restart, stop, or inspect robot application deployments |
| `r2kernel subsystem ...` | `r2kernel-subsystem` | inspect registered subsystem sessions and clean stale state |
| `r2kernel frame ...` | built in | inspect the runtime frame graph or compose a transform |
| `r2kernel resource status` | `r2kernel-launch list` | list active and recently reaped resource leases |
| `r2kernel resource inventory` | `r2kernel-launch inventory` | show CPU, NIC, link-layer, CAN, and device inventory |
| `r2kernel resource stop <lease>` | `r2kernel-launch stop <lease>` | stop a managed lease and terminate its process scope |
| `r2kernel timesync doctor` | `r2kernel-timesync-doctor` | check time-sync readiness |
| `r2kernel timesync run ...` | `r2kernel-timesync` | run a manual time-sync helper path |
| `r2kernel timesync daemon ...` | `r2kernel-timesyncd` | run the managed time-sync companion directly |
| `r2kernel system ...` | `systemctl` / `journalctl` | operate R2Kernel systemd units |

Common tutorials.

```text
. <prefix>/env.sh
r2kernel --help
r2kernel status
r2kernel config --help
r2kernel package --help
r2kernel launch --help
r2kernel deploy validate tutorials/deployments/teleop.deployment.yaml
r2kernel subsystem status
r2kernel frame graph
r2kernel frame lookup component.localizer/map component.manipulation/tool0
r2kernel resource inventory
r2kernel timesync doctor
r2kernel system status
```

Configuration values can be inspected and overridden by key path.

```text
r2kernel config get control_transport.shm_max_channels
r2kernel config set control_transport.shm_max_channels 128
```

The same key-path model applies to product shell and security settings.

```text
r2kernel config set product.name "Acme Robot Controller"
r2kernel config set product.vendor "Acme Robotics"
r2kernel config set control.frontend.mode custom
r2kernel config set control.frontend.root /opt/acme/ui/dist
r2kernel config set federation.security.mode required
r2kernel config set federation.security.key_id robot-cell-a
r2kernel config set federation.security.key_file <prefix>/var/lib/security/federation.key
```

Use `r2kernel config tui` for the common settings form, or use
`r2kernel config set` for any supported dotted key. Secret material should usually
live in root-owned files or environment variables rather than inline YAML.

## Deployment Commands

Use deployment commands before publishing robot tutorials or product deployment
manifests.

```text
r2kernel deploy validate ./r2kernel.deployment.yaml
r2kernel deploy plan ./r2kernel.deployment.yaml
r2kernel deploy plan ./r2kernel.deployment.yaml --json
r2kernel deploy up ./r2kernel.deployment.yaml
r2kernel deploy restart ./r2kernel.deployment.yaml
r2kernel deploy status ./r2kernel.deployment.yaml
r2kernel deploy down ./r2kernel.deployment.yaml
```

`validate` checks the level declared by the manifest. A manifest with only
`instances` and `bindings` is a subsystem composition. A manifest with `robot`
adds robot slot validation. A manifest with both `robot` and
`application` also checks the selected app-role subsystem's API requirements
against the platform's compound exports and optional platform compatibility labels from the `profiles`
manifest field. `plan` prints the concrete
instances and launch modes after validation succeeds.

`up` keeps an active managed instance only when its local resource-service lease
matches the desired package, manifest, instance, resolved parameters, runtime
directory and frontend settings. Matching a subsystem name alone is insufficient.
Same-name unmanaged or federated registrations are conflicts, not instances to
adopt or stop.

Missing instances are launched. A stale registration is eligible for cleanup
only when its local managed lease still proves package/instance ownership; even
then, stop must succeed before cleanup and relaunch. Unmanaged, federated,
missing-lease and ambiguous state is refused rather than adopted.
Cleanup is conditional on the observed session, so a newer registration is not
removed. `--replace` permits replacing a proven owned managed instance; without
it, changed parameters, manifest, runtime directory or frontend settings are
conflicts. `restart` explicitly requests replacement. A failed or unconfirmed
stop or refused cleanup halts relaunch; inspect the reported state instead of
deleting it or retrying an ambiguous effect.

`down` reports every planned instance in manifest order. An ownership, stop or
cleanup failure marks that instance failed and does not prevent independent
later instances from being processed. An uncertain stop never authorizes
cleanup. If initial session/resource-service setup fails, every planned instance
is reported as `unprocessed` at `preflight`. Any failure sets `ok: false` and
returns exit code 3; a failed cleanup retains the confirmed stop result.

A missing current managed lease remains a refusal, even for an inactive
registration. Inspect the session first. Only when it is stale, use
`r2kernel subsystem cleanup <name> --stale` with the same `--config` as deployment;
then retry the deployment deliberately. Deployment does not perform that
operator cleanup automatically.

## Lower-Level Runtime Tools

The installed bundle also ships the individual tools used by `r2kernel`. These are
useful for scripts, debug sessions, and direct daemon launches.

- `r2kernel-control` - host control backend. Product installs usually run it as
  `r2kernel-control.service`; development installs can run it directly with
  `r2kernel control --config "$R2KERNEL_PREFIX/config.yaml"`.
- `r2kernel-config` - runtime config editor and `get` / `set` / `unset` helper.
- `r2kernel-package` - package `validate` and `build`.
- `r2kernel-launch` - managed package `run`, `restart`, `inventory`, `list`,
  `status`, and `stop`.
- `r2kernel-subsystem` - registered subsystem `status`, `sessions`, `doctor`,
  lifecycle transition requests, runtime bindings, and stale-state `cleanup`.
- `r2kernel-doctor` - aggregate runtime diagnostics.
- `r2kernel-timesync` - explicit Linux PTP/time-sync helper launcher.
- `r2kernel-timesyncd` - managed time-sync companion used by
  `time_sync.management_mode=managed`.
- `r2kernel-timesync-doctor` - focused time-sync readiness doctor.
- `r2kernel-resourced` - privileged resource companion for managed package leases,
  brokered resource FDs, affinity, cgroup placement, and cleanup.

Linux installs additionally provide shell helpers.

- `r2kernel-timesync-install` - install `linuxptp` / `ethtool` prerequisites.
- `r2kernel-device-policy-install` - install R2Kernel udev serial/USB device-node
  policy.
- `r2kernel-system-service-install` - register `r2kernel-resourced.service`
  and `r2kernel-timesyncd.service`, and with the Control service
  `r2kernel-control.service` plus the root-only helpers
  `r2kernel-terminal-login.service` and `r2kernel-https-settings.service`. It
  refuses a prefix without an R2Kernel installation and a `<prefix>/etc` holding
  files R2Kernel did not create, before changing anything.

## Package Builds and Runtime Apply

Keep package build output separate from its source:

```text
r2kernel package build ./packages/app --out ./build/packages/app --force
```

`--force` replaces only a distinct output directory. Equal paths and overlap in
either direction, including resolved aliases, are refused before anything is
deleted. It cannot be used to build over the source or one of its ancestors.

Control's package replacement and uninstall guards use the broker-validated live
instance set, including CLI-launched instances; stale registry state is not proof
that a package stopped. Forced uninstall stops the validated selected leases.

Runtime apply (`POST /api/v1/control/runtime/apply`) persists the original managed
launch intent before stopping packages: parameters, bindings, resource overrides,
and the original default/relative/explicit runtime-directory choice. It does not
reconstruct a request from resolved display values. A live CLI launch without a
recoverable original request blocks apply or Control-managed restart before any
instance is stopped; explicitly stop and relaunch it with the intended options.

Recovery is stored at `<packages.install_dir>/.pending-runtime-apply.json`.
Failed and unattempted entries retain their creation time, attempts and error
history; only successfully restored entries are retired. A matching already
restored live instance is not launched twice after interruption. Another apply
cannot overwrite this recovery file. Correct the reported failure and restart
Control to retry remaining entries. Preserve an old ambiguous recovery file and
recover its launch intent explicitly; no default request is guessed for it.

## Direct Development Launch

For a development install under a user prefix, keep the control backend in a
separate terminal.

```text
. <prefix>/env.sh
r2kernel control --config "$R2KERNEL_PREFIX/config.yaml"
```

For product prefixes, prefer the system service.

```text
sudo systemctl status r2kernel-control.service --no-pager
```

`r2kernel dev control`, `r2kernel dev resourced`, and `r2kernel dev timesyncd` are
developer conveniences for starting one daemon directly. `r2kernel dev all` is
intentionally not implicit; start daemons in separate terminals when debugging
their logs.

Use `r2kernel launch run <package> --bind requirement=provider.interface` when
you want to start one managed subsystem package and wire its required
interfaces without creating a full deployment. `r2kernel deploy up` is the
command for reconciling a complete robot and application composition. Launch
bindings validate the local requirement name and target shape; deployment
manifests validate the complete provider contract graph.

`launch run` and `launch restart` record their `--bind` declarations with
Control for the lease the launch created. Control applies them, through the same
validation as an operator binding, when a process of that lease registers the
instance's subsystem, including after that process re-registers. The
registration reply does not wait for this: Control asks the resource broker
again whether the registered process belongs to the lease and applies the
declarations right after the reply, so for a moment after the process
registered `r2kernel subsystem bindings` can list the intent with
`owner_verified: false` and its requirements as `pending`. If the
declarations cannot be recorded, the command exits non-zero: a detached package
keeps running under its lease without recorded bindings, as the error states,
and a foreground launch is cleaned up. `r2kernel subsystem bindings` lists the
recorded launch binding intents and the result for each requirement.
`launch restart` records its declaration even without `--bind`; an empty
declaration supersedes the previous lease's intent for that subsystem. A
foreground `launch run` treats SIGINT, SIGTERM and SIGHUP (a closed terminal or
SSH session) alike: it terminates the package's scope, reaps the package process
and releases the lease. `r2kernel launch` replaces itself with
`r2kernel-launch`, as the other `r2kernel` commands that run a runtime command
do. A signal sent to the `r2kernel` process therefore reaches the launch. A
signal that is already ignored when the launch starts stays ignored, as under
`nohup`: `nohup r2kernel launch run ...` keeps running after a hangup. If the command itself is killed with SIGKILL, the package
and its lease remain; stop them with `r2kernel launch stop <lease-id>`. A
foreground `launch run` discards its intent when the package exits; if Control
cannot discard it the command fails with
`package finished; binding intent discard failed: <reason>`. Control also
discards a lease's intent when it ends that registration (inform-down, cleanup,
process terminate/kill), treats an intent whose lease no current registration
carries as ended, and discards an intent whose lease the resource broker no
longer reports, including one whose process never registered. Control checks
the broker in the background at most once per second while such an intent is
waiting.
`r2kernel launch stop <lease-id>` stops the lease and discards its intent; if Control cannot discard it, the
command exits non-zero with
`package stopped; binding intent discard failed: <reason>` after reporting the
stop that already happened.

`--resources '{"cpu":{...}}'` replaces the package's `resources.cpu` claim for
that instance; see
[Resource Control](resource-control.md#per-instance-cpu-claims).

Use `r2kernel launch restart <package> ...` during iterative development when the
same package instance is already running or stale. It uses the same
`--instance`, `--bind`, `--set`, and `--runtime-dir` arguments as `run`, but the
process is always relaunched through the managed detached path.

If you start a subsystem without a required binding during development, it can
remain registered in `WaitingBinding` instead of failing at process start. Use
Runtime Graph in the Web Console, or the subsystem binding commands, to bind it
after both sides are visible.

```text
r2kernel subsystem bindings
r2kernel subsystem bind app.cleaner.teleop.mobility compound.cleaner.body_motion
r2kernel subsystem bind app.cleaner.teleop.trash_disposal compound.cleaner.trash_disposal
r2kernel subsystem unbind app.cleaner.teleop.mobility
```

Runtime bindings override launch bindings for the running control backend. They
are intended for interactive development and operator repair; keep deployment
manifests as the reviewable source for product compositions.

`r2kernel launch run` prints a concise launch summary by default. Add `--json`
when a script needs the full resource-service response, lease details, or
machine-readable logs.

## Spatial Frame Commands

Use the frame commands after the relevant subsystems and bindings are visible.

```text
r2kernel frame graph
r2kernel frame lookup <source> <target>
```

The graph command reports spatial ports, static compound mounts, dynamic
subsystem transforms, stale edges, cycles, and unresolved ports. Lookup composes
only current non-stale edges. Prefer qualified names such as
`component.localizer/map`; an unqualified local name is accepted only when it is
unique.

## Subsystem Sessions

Subsystem processes do not need to be launched by a special development
launcher. A Python or C++ subsystem can be started from its normal `main`,
script, IDE, debugger, or test harness. The SDK registers a per-process session
with the local control backend when the subsystem comes up.

For a repeated development cycle, the backend treats the subsystem name and
session identity together.

- the same live session can refresh its own status
- a stale or dead previous session with the same subsystem name can be
  replaced; Control answers such a registration within 1.5 s, and when the
  cleanup of the previous session, or Event resource work of other subsystems
  it must wait for, does not finish in that time, the registration is refused
  with a request to retry. The error reply carries `reason`
  `registration_cleanup_pending` or `registration_gate_busy`, and the Python
  and C++ SDKs register again on these reasons: a starting subsystem retries
  within its startup retry bound (`R2KERNEL_STARTUP_RETRY_COUNT` attempts,
  default 20, `R2KERNEL_STARTUP_RETRY_DELAY_MS` apart, default 100 ms), and a
  running one retries from its heartbeat. At startup the Python SDK also
  retries a failed exchange within that bound and fails the start at once on
  any other refusal; the C++ SDK retries every failed exchange and every error
  reply within that bound
- a different session with the same subsystem name is rejected while the
  previous session is still active
- late shutdown messages from an old session cannot remove the current session

Use the subsystem commands to inspect or repair runtime state.

```text
r2kernel subsystem status
r2kernel subsystem status arm_controller
r2kernel subsystem sessions --json
r2kernel subsystem doctor arm_controller
r2kernel subsystem bindings arm_controller
r2kernel subsystem bind arm_controller.motion mobile_base.motion
r2kernel subsystem unbind arm_controller.motion
r2kernel subsystem pause arm_controller
r2kernel subsystem resume arm_controller
r2kernel subsystem reset arm_controller
r2kernel subsystem fault arm_controller --reason "encoder timeout"
r2kernel subsystem terminate arm_controller
r2kernel subsystem kill arm_controller
r2kernel subsystem cleanup arm_controller --stale
r2kernel subsystem cleanup arm_controller --force
```

Lifecycle commands are requests. The runtime validates the current state and
delivers the request to the subsystem SDK hook through the registered notify
endpoint. Watch `r2kernel subsystem status <name>` or Runtime Graph for completion.

`terminate` and `kill` are managed process actions, not lifecycle transitions.
They require a resource lease from `r2kernel-resourced`. `terminate` gives the
process scope a `SIGTERM` grace window before escalation; `kill` sends
`SIGKILL` immediately. They act on the lease the subsystem registered with.
Control accepts a registered `lease_id` only when the resource broker proves
that the registering process is a member of that lease; a registration or
status report with another process's lease, or with a lease the broker cannot
verify, is refused. Control waits at most 750 ms for that proof. The proof is
part of the registration's 1.5 s reply budget. While the
broker is absent, restarting or answers that it is busy, Control asks again
every 100 ms within that time; any answer of the broker, including that the
process is not a member, decides at once. The CLI waits up to 12 s for a `terminate` or `kill` reply
(the broker's 10 s lease operation deadline plus the 2 s management budget);
other `r2kernel subsystem` commands wait up to 2 s.

`cleanup --stale` is the default-safe path and only removes inactive state.
`cleanup --force` is for operator intervention when the current runtime view is
known to be wrong.

## Version Provenance

Installed runtime CLIs read the package version from the bundled
`release-manifest.json` when available. Use `--version` on `r2kernel`,
`r2kernel-control`, `r2kernel-config`, `r2kernel-package`, `r2kernel-launch`,
`r2kernel-subsystem`, `r2kernel-doctor`, `r2kernel-timesync`, `r2kernel-timesyncd`,
`r2kernel-timesync-doctor`, and `r2kernel-resourced` when collecting runtime
provenance. Source-tree builds without a release manifest may report the
underlying package version instead.

## Source-Tree Helpers

Source checkouts may include helper scripts for building or inspecting the tree.
Those helpers are separate from the installed runtime CLIs listed above.

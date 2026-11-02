# Real-Time Scheduling

This page explains how to place R2Kernel's communication workers and your
application's real-time loops on a Linux host. It covers the runtime settings,
the package CPU claim and its admission, and the host conditions that an
operator controls.

## Scope Of The Guarantee

R2Kernel applies and verifies the scheduling policy, priority and CPU affinity
that you configure. It does not establish a worst-case execution time or a
general hard real-time guarantee. Finite runs with no observed misses establish
only the recorded conditions. Readiness checks and functional smoke tests are
not real-time results. Use the result-interpretation guidance in
[Deployment Checks](deployment-checks.md#timing-results-are-workload-specific)
when evaluating a declared profile on your host.

## Core Worker Scheduling

Control's internal communication workers (local Control transport, Event and
federation fast data paths) use the `core_scheduling` settings. Host status,
resource reconciliation, time-sync management, HTTP and Web Console tasks stay
on the normal executor.

```yaml
core_scheduling:
  policy: fifo       # other, fifo, or rr
  priority: 99       # other requires 0; fifo/rr require 1..99
  cores: []          # empty: keep the affinity Control inherited
```

On Linux the defaults are `fifo`, priority `99` and `cores: []`. An empty
`cores` list keeps the CPU set that the Control process inherited; it does not
pin the workers. Each worker applies and reads back its own policy, priority
and affinity before it accepts work. A denied or invalid setting fails worker
startup instead of switching to `other`. Apply changes by restarting Control.
See [Runtime Configuration](runtime-configuration.md#core-worker-scheduling)
for the memory-lock settings that `fifo` and `rr` require.

Recommendations:

- give the Core workers dedicated CPUs with `cores`, and keep application
  real-time loops off those CPUs
- with `policy: other`, Core workers compete with every ordinary task on their
  CPUs, so communication latency can grow when those CPUs are loaded; use
  `other` only when that is acceptable for the workload
- confirm the observed policy, priority and affinity of each worker thread in
  the status snapshot (`core_scheduling`) or on the Settings page, not only the
  configured values

## Application Real-Time Loops

`core_scheduling` never selects a policy for your subsystem processes. Declare
their scheduling in the package manifest under `resources.cpu`.

Place an application loop that must meet a deadline on its own CPUs, separate
from the Core worker CPUs. If an application loop shares a CPU with Core
workers and waits on Control or Event communication, run it at a lower
priority than the Core workers; a loop that outranks the workers it depends on
can delay its own requests. Priority inversion and starvation remain the
application's responsibility.

As an example only, a host might run Core workers at FIFO 99 on CPUs 2 and 3
and a controller loop at FIFO 70 on CPU 4. Choose priorities from your own
measurements.

## Package CPU Claims

```yaml
resources:
  cpu:
    cores: [4]
    exclusive: true
    policy: fifo
    priority: 70
```

- `cores` lists the allowed CPUs and must contain at least one core.
- `policy` is `other`, `fifo` or `rr`; an omitted policy is `other`.
- `fifo` and `rr` require `priority` from 1 through 99.
- `exclusive: true` is refused when another admitted lease already holds any
  of those cores exclusively.

The resource service admits the claim before the process starts. The child
applies its affinity and scheduler before the package entrypoint runs. Launch
status reports `cpu_enforcement`: `affinity_and_cgroup` when the lease's cpuset
was applied, or `affinity_only_cgroup_degraded` when only affinity could be
applied (for example when the `cpuset` controller is not available to the
package cgroup root).

Admission compares package claims with each other. It does not reserve the
CPUs listed in `core_scheduling`; keep those CPUs out of package claims
yourself.

### Per-Instance CPU Claims

One installed package can run several instances with different CPU claims. A
start request may replace the manifest's `resources.cpu` for one instance:

```text
r2kernel launch run ./my_controller \
  --instance left_arm \
  --resources '{"cpu":{"cores":[4],"exclusive":true,"policy":"fifo","priority":70}}'
```

The REST start route accepts the same object:

```json
POST /api/v1/control/packages/{package_id}/start
{"instance_id": "left_arm", "resources": {"cpu": {"cores": [4], "exclusive": true, "policy": "fifo", "priority": 70}}}
```

The instance claim replaces the manifest claim as a whole (fields are not
merged). It passes the same validation as a manifest claim and the same
admission in the resource service. The instance record keeps it while the
instance runs: a `restart` without `resources` reuses it, and
`"resources": null` returns to the manifest claim. Stopping an instance removes
its record, so a later `start` without `resources` uses the manifest claim.
Unknown fields in `resources` and in every claim under it (`cpu`, `network`,
`link_layer`, `devices`, `limits`, `sandbox` and their entries) are rejected,
in start requests and in `package.yaml`. If the resource service does not
confirm that it applied the instance claim, Control ends that launch and
reports an error.

The instance status reports `cpu_origin` (`manifest` or `instance`) as reported
by the resource service for that launch.

A package can forbid instance claims:

```yaml
resources:
  cpu_instance_override: forbidden   # allowed (default) or forbidden
```

With `forbidden`, a start request that carries `resources.cpu` is refused with
an error naming `resources.cpu_instance_override: forbidden`.

### Real-Time Priority Limit Of Managed Packages

Managed packages cannot raise their real-time priority above the admitted
claim. Before the package entrypoint runs, the launcher sets the package's
`RLIMIT_RTPRIO` to the admitted priority, or to `0` for `policy: other` and for
packages without a CPU claim. Threads of a package admitted with `fifo` or `rr`
priority N may therefore select real-time priorities up to N; a package
admitted with `other` cannot select a real-time policy.

A package that needs a real-time thread must declare that priority in its CPU
claim, in the manifest or as a per-instance claim. A limit inherited from a
service unit or container does not let a managed package exceed its claim.

## Host Conditions

These settings belong to the host administrator. R2Kernel does not change
them, and they are guidance rather than product guarantees:

- isolate the real-time CPUs from general scheduling (for example `isolcpus`
  and `nohz_full`), and move IRQs and kernel housekeeping work away from them;
  consider SMT siblings of isolated CPUs
- review `kernel.sched_rt_runtime_us`; real-time throttling limits how much CPU
  time real-time tasks receive in each period
- use a `PREEMPT_RT` kernel when the workload needs bounded kernel preemption
  latency
- grant the memory-lock limit that real-time memory preparation needs: the
  installed Control service sets `LimitMEMLOCK=64M`, matching the default
  `control_transport.rt_memory_budget_bytes`
- grant real-time scheduling rights: the installed Control service sets
  `LimitRTPRIO=99`; a directly started runtime needs `CAP_SYS_NICE` or an
  equivalent `RLIMIT_RTPRIO`, or `core_scheduling: {policy: other, priority: 0}`
- affinity restricts a task to CPUs; it does not by itself prove isolation, and
  CPU placement inside a virtual machine does not isolate the task from the
  hypervisor
- on a voluntary-preemption kernel, kernel worker items that run on a
  real-time CPU delay a `SCHED_FIFO` wakeup until they yield; on a
  qualification VM we measured 1.3-5 ms from removable-media polling of an
  emulated optical drive (`/sys/block/<dev>/events_poll_msecs`), free page
  reporting of a virtio balloon, and hypervisor vCPU preemption. Keep unbound
  workqueues (`/sys/devices/virtual/workqueue/cpumask`) and such polling off
  the real-time CPUs, or use a `PREEMPT_RT` or `preempt=full` kernel

Do not change global kernel settings merely to make a failing measurement pass.

## Python

Python subsystems can use the same package CPU claims. For this release, the
strict 1 ms periodic acceptance target is the declared C++ profile; Python
results are functional and diagnostic evidence, not strict periodic
qualification. A real-time priority does not make Python application code
allocation-free or hard real-time.

## Verification

1. Check the observed Core worker scheduling in the status snapshot or on the
   Settings page.
2. Launch the package and check `cpu_enforcement`, `cpu_origin` and the
   observed policy and affinity of its real-time threads.
3. Evaluate a declared workload using
   [Deployment Checks](deployment-checks.md#timing-results-are-workload-specific) and
   review scheduled-start lateness, failure-inclusive SDK invocation time and
   scheduled completion (p50, p99 and max) together with skipped slots and
   deadline-violation counts.

## Containers

Running Control, the resource service and packages in a container has
additional requirements, including scheduling and memory-lock rights inside
the container. See [Container Deployment](container-deployment.md).

## Related Pages

- [Runtime Configuration](runtime-configuration.md)
- [Resource Control](resource-control.md)
- [Deployment Checks](deployment-checks.md)
- [Manager and Device Authorization](../reference/resource-authority.md)

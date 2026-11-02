# Troubleshooting

Use this page when a runtime symptom appears but you do not need private runtime
implementation details.

Start with the installed environment loaded.

```text
. <prefix>/env.sh
```

## First Checks

| Check | Command |
| --- | --- |
| services | `sudo systemctl status r2kernel-control.service r2kernel-resourced.service r2kernel-timesyncd.service --no-pager` |
| runtime health | `r2kernel doctor` |
| control backend | `curl http://127.0.0.1:8001/api/v1/ready` |
| runtime status | `curl http://127.0.0.1:8001/api/v1/control/status` |
| subsystem state | `r2kernel subsystem status` |
| subsystem sessions | `r2kernel subsystem sessions` |

## Common Symptoms

| Symptom | Likely check |
| --- | --- |
| subsystem is `WAITING_BINDING` | required interface has no compatible provider binding |
| subsystem is `WAITING_TARGET` | target subsystem is not registered, not ready, or not reachable through the deployment |
| lifecycle command has no effect | process is unmanaged, already transitioning, or the SDK did not report lifecycle support |
| terminated subsystem reappears | a deployment or managed package supervisor restarted it |
| package frontend returns 404 | package frontend manifest, package install state, and frontend serving route |
| Web Console cannot open package frontend | package instance id, frontend path, WebSocket facade route, and package registration |
| procedure or operation call times out | target interface, binding, subsystem lifecycle state, and control WebSocket connection |
| event view grows unexpectedly | check for dynamically generated Event names and verify endpoint names come from public specs or `visibility: internal` manifests |
| resource is denied | package resource declaration, broker policy, user group membership, and managed launch path |
| time-sync status is not accepted | `r2kernel doctor --profile time-sync`, host NIC, time-sync mode, and service logs |
| remote host does not appear | federation peer config, advertised host, API bind address, and network reachability |
| many subsystems started together log `per-UID connection limit reached` or `Broken pipe` | Control's local socket admits at most 32 concurrent connections per user and 64 in total and refuses the rest with `retryable`; current SDKs retry such a refusal within the request time budget, while older SDKs reported it as `Control unreachable: Broken pipe`. Persisting refusals mean requests outlast that budget: stagger the starts or check for clients holding connections |

## Binding Problems

Check whether the required and provided interfaces use the same contract.

```text
r2kernel subsystem status
```

In Web Console Runtime Graph, select the required interface and verify the
compatible providers list. Bindings are one required interface to one provider.
Multiple required interfaces may bind to the same provider.

## Timed Control Problems

If a Control, Procedure, or Operation path times out, check these in order.

1. The target subsystem is registered and not faulted.
2. The required interface is bound.
3. The provider reports the expected endpoint surface.
4. The caller and provider use the same public `api.*` contract.
5. Cross-host deployments have accepted clock status when timed metadata is
   required.

Use Web Console Runtime Graph or `/api/v1/control/status` to inspect interface and
endpoint status.

## Event Flooding

Event channels are long-lived interface endpoints, not disposable per-command
names.

If Event counts grow unexpectedly.

1. Check the subsystem manifest for public spec contracts or
   `visibility: internal` endpoint lists.
2. Check that application code reuses declared Event names instead of creating a
   new channel per operation.
3. Use Web Console Runtime Graph with internal endpoints shown only when you are
   debugging endpoint growth.

Gateway and component providers should use public `api.*` contracts for public
interfaces. Package-local custom Event names should be internal.

## Resource Denied

Resource-control guarantees apply to managed launch paths.

- `r2kernel launch run ...`
- `r2kernel deploy up ...`
- Web Console managed package launch

Direct shell execution can still register a subsystem, but it does not receive
managed resource leases, brokered network/device handles, or Web Console process
ownership.

| Message | Meaning |
| --- | --- |
| `resource incomplete-request capacity is full; request was not dispatched` | The resource service's incomplete-request capacity is exhausted; the request was refused before dispatch. Retry after pending requests complete. |
| ``failed to start package `<name>` entrypoint <path>: managed child failed to <stage>: <errno>`` | The managed child was created but failed while preparing or executing the package entrypoint (for example `enter working directory`, `apply launch constraints` or `exec`); `<stage>` and `<errno>` name the failing step. |

## Logs

| Area | Command |
| --- | --- |
| control backend | `journalctl -u r2kernel-control.service --no-pager` |
| resource broker | `journalctl -u r2kernel-resourced.service --no-pager` |
| time sync | `journalctl -u r2kernel-timesyncd.service --no-pager` |
| app or package process | check the managed instance log path shown by Web Console or `r2kernel launch` |

## Related Pages

- [Deployment Checks](deployment-checks.md)
- [Runtime Configuration](runtime-configuration.md)
- [Resource Control](resource-control.md)
- [Time Sync Operations](time-sync-operations.md)
- [Web Console Manual](web-console-manual.md)

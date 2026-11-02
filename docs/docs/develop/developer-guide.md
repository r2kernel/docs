# Developer Guide

Use this section when you are writing, running, or testing R2Kernel subsystems.
It assumes that R2Kernel is already installed and that you have completed
[Quickstart](../getting-started/quickstart.md).

In R2Kernel, native development usually means building one subsystem role and
using existing packages for the rest of the robot composition. The role you
choose defines the boundary you own.

## Installed Runtime Or Public Source Checkout

Start from the installed runtime for normal tutorial, package, and subsystem
development. The installer already places SDK payloads, tutorial packages,
deployment manifests, and runtime tools under the selected prefix.

The table writes that prefix as `<prefix>`; the default prefix is listed in
[Installation](../getting-started/installation.md#interactive-install).

| Path | Purpose |
| --- | --- |
| `<prefix>/sdk/python` | installed Python SDK wheel payload |
| `<prefix>/sdk/cpp` | installed C++ SDK headers, libraries, and CMake files |
| `<prefix>/tutorials` | guided cleaner robot tutorial source |
| `<prefix>/tutorials/subsystems` | subsystem package roots used by the tutorial |
| `<prefix>/tutorials/deployments` | staged and full robot deployment manifests |
| `<prefix>/tutorials/advanced` | advanced tutorial fixtures |

Use a writable copy when you want to edit tutorial packages.

```text
mkdir -p ~/r2kernel-work
cp -R <prefix>/tutorials ~/r2kernel-work/tutorials
cd ~/r2kernel-work
```

Use the public SDK, tutorial, or documentation repository when you need to edit
that project's source. Runtime and launcher implementation sources are private;
developing a subsystem does not require them. The installed runtime remains the
supported execution environment for public SDK development.

When using an editable Python SDK checkout, source the installed helper first,
clear inherited SDK import paths, and then activate a dedicated virtual
environment. Run this from the source repository root. Do not source `env.sh`
again after activation: it can select the managed interpreter instead.

```text
. <prefix>/env.sh
unset PYTHONPATH
/usr/bin/python3 -m venv ~/r2kernel-sdk-dev
. ~/r2kernel-sdk-dev/bin/activate
python -m pip install -e sdk/python
```

Complete robotics demos live outside the guided installed tutorial path. Use the
demo repository separately when you want larger example applications rather than
the step-by-step cleaner tutorial.

## Check The Installed SDKs

For installed SDK use (not an already activated editable-development shell),
source the installed environment before running tutorial packages or SDK code.

```text
. <prefix>/env.sh
```

Check the Python SDK.

```text
python3 -c 'import r2kernel; print("R2Kernel Python SDK ready")'
```

Check the C++ SDK payload.

```text
test -r <prefix>/sdk/cpp/include/r2kernel/wrapper/subsystem.hpp
find <prefix>/sdk/cpp -maxdepth 4 \( -name 'libr2kernel_cpp.*' -o -name 'r2kernel_cppConfig.cmake' \) -print
```

Then check that the installed runtime services are reachable.

```text
r2kernel system status
r2kernel resource status
curl -sf http://127.0.0.1:8001/api/v1/ready
```

If services were skipped during installation, register them first.

```text
sudo <prefix>/bin/r2kernel system install --prefix <prefix>
```

## Choose The Subsystem Role You Are Building

Every native runtime unit is a subsystem. Each subsystem declares one role in
`subsystem.yaml`. Choose the role by the boundary you are contributing.

| Role | Developer boundary | Typical provide surface | Typical dependency |
| --- | --- | --- | --- |
| `gateway` | hardware or simulator-backed device boundary | device-facing `api.*` contracts | host resources such as NIC, CAN, serial, USB, or device files |
| `component` | reusable robotics control function, such as motion, perception, IO, safety, or planning | component contracts and their underlying `api.*` contracts | gateway or other component APIs |
| `compound` | robot physical and spatial composition | spatial ports and static mounts | component spatial surfaces only |
| `app` | robot task, scenario, SI logic, or product application | application status and optional app-owned UI | platform capabilities |

The common development pattern is to build one role and reuse existing packages
for the others. For example, a gripper vendor may build only a `component`
subsystem, while a platform company builds a `compound` subsystem from existing
component spatial surfaces. An application developer usually builds an
`app` subsystem against a platform capability surface.

The cleaner tutorial is the baseline path for all of these roles because it
shows the same package, manifest, binding, and deployment mechanics each role
uses.

## Native Subsystem Development Flow

Use this order when building a native R2Kernel subsystem.

1. Run the [Cleaner Robot Tutorial](../tutorials/tutorial.md) once without edits.
2. Pick the role you are building: gateway, component, compound, or app.
3. Copy `<prefix>/tutorials` to a writable workspace if you need local edits.
4. Use the matching tutorial chapter as the nearest working example.
5. Use [Subsystem Packages](../tutorials/advanced-subsystem-packages.md) when you need a managed package root.
6. Use [Subsystem SDK API](../api/subsystem-sdk-api.md) for Python and C++ authoring details.
7. Use [Resource Policy](../tutorials/advanced-resource-policy.md) when the subsystem needs CPU, NIC, CAN, serial, or device access.

The base tutorial chapters map to the role boundaries.

| Role focus | Tutorial page |
| --- | --- |
| simulation and visible test target | [Start Simulation World](../tutorials/start-simulation-world.md) |
| `gateway` subsystem | [Build Gateway Subsystem](../tutorials/build-gateway-subsystem.md) |
| `component` subsystems | [Add Component Subsystems](../tutorials/add-component-subsystems.md) |
| `compound` subsystem and platform manifest | [Define Platform](../tutorials/define-platform.md) |
| `app` subsystem and deployment | [Run Applications](../tutorials/run-applications.md) |

## Using Existing Stacks Such As ROS 2

ROS 2 integration is not a separate R2Kernel role. A ROS 2 graph can be wrapped as
one R2Kernel subsystem when that graph owns one clear runtime boundary.

Choose the wrapper role by what the ROS 2 side represents.

| ROS 2 boundary | R2Kernel wrapper role |
| --- | --- |
| hardware bridge, driver, or simulator device boundary | `gateway` |
| reusable controller, perception pipeline, planner, or safety function | `component` |
| robot physical composition or static mounts | `compound` |
| task-level scenario or product application | `app` |

This keeps ROS 2 as an implementation choice inside a role-bounded subsystem.
The R2Kernel side still declares package metadata, lifecycle behavior, contracts,
bindings, and resource policy at the subsystem boundary.

Continue with [ROS 2 Integration](ros-2-integration.md) when the subsystem you
are building is backed by ROS 2.

## External Integration

External integrations stay outside the native subsystem runtime. Use this path
for browser frontends, product GUIs, cloud services, automation scripts,
diagnostics tools, and other clients that talk to a R2Kernel host through Host
Control APIs.

1. [API Overview](../api/api-overview.md)
2. [Host Control REST API](../api/host-control-rest-api.md)
3. [Host Control WebSocket API](../api/host-control-websocket-api.md)
4. [Teleop App Frontend](../tutorials/advanced-websocket-facade.md)
5. [Web Console Manual](../operate/web-console-manual.md)

External clients can observe events, invoke Procedure or Operation calls,
inspect runtime state, manage packages, or open app-owned frontend surfaces.
They do not become native subsystems and do not join native subsystem transport
directly.

## Related Pages

| Topic | Page |
| --- | --- |
| First installed run | [Quickstart](../getting-started/quickstart.md) |
| End-to-end native tutorial | [Cleaner Robot Tutorial](../tutorials/tutorial.md) |
| Package roots and launch metadata | [Subsystem Packages](../tutorials/advanced-subsystem-packages.md) |
| Subsystem author API | [Subsystem SDK API](../api/subsystem-sdk-api.md) |
| Host automation API | [Host Control REST API](../api/host-control-rest-api.md) |
| Host event and app UI API | [Host Control WebSocket API](../api/host-control-websocket-api.md) |
| Runtime concepts | [Robot, Application, And Deployment](../concepts/robot-application-deployment-model.md) |
| Binding model | [Subsystem Binding Model](../concepts/subsystem-binding-model.md) |
| ROS 2 wrapper guidance | [ROS 2 Integration](ros-2-integration.md) |

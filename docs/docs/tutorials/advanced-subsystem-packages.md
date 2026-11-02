# Advanced Subsystem Packages

The cleaner tutorial now runs robot subsystem packages as managed R2Kernel packages.
`run_sim_world.py` only starts the provided simulator and browser frontend.
Early tutorial steps use `r2kernel launch run` to start one subsystem package at a time;
the final application step uses `r2kernel deploy up` to reconcile the full
robot.

This page explains the package boundary using the same cleaner subsystem package
you launched in Step 3.

## 1. Package Boundary

A R2Kernel package wraps one reusable subsystem.

```text
subsystem package root
  package.yaml
  subsystem.yaml
  subsystem implementation
  config/
  spec/
  frontend/        optional static UI
```

For the cleaner tutorial, each subsystem folder is also a package root.

```text
tutorials/subsystems/
  component.mobile/
    package.yaml
    subsystem.yaml
    mobile_controller.py
    run.py
```

Reasonable subsystem packages include these examples.

| Subsystem package | Role |
| --- | --- |
| `gateway.device_gateway` | simulator-backed gateway subsystem package |
| `component.mobile` | mobile-base component subsystem package |
| `component.manipulation` | manipulator component subsystem package |
| `component.gripper` | gripper component subsystem package |
| `component.perception` | perception component subsystem package |
| `app.cleaner.teleop` | operator application package |
| `app.cleaner.radar` | perception-driven application package |

Deployment decides which installed package instance fills each robot slot.

## 2. Inspect A Managed Subsystem Package

Open the mobile subsystem package manifest.

```text
nano tutorials/subsystems/component.mobile/package.yaml
```

The package manifest declares the following.

| Field | Meaning |
| --- | --- |
| `name` | reusable package identity |
| `entrypoint` | command, arguments, environment, and working directory |
| `parameters` | launch-time values allowed by the package |
| `resources` | CPU, network, device, CAN, or serial claims |
| `frontend` | optional static package UI served by the control backend |
| `contracts` | package-local spec roots |

The other top-level keys are `schema_version`, `version`, `description`,
`subsystem_manifest`, `lifecycle` and `metadata`. Any other top-level key is
refused; keep custom data under `metadata`.

Packages can include static browser UI. If the package also runs a local UI
backend, it must not open an unmanaged network listener. Declare
`resources.sandbox.network: brokered`, expose browser assets as static files,
and open any declared `frontend.context` listener through the resource broker.

```yaml
resources:
  sandbox:
    network: brokered
frontend:
  type: static
  root: frontend/dist
  index: index.html
  context:
    api: http://127.0.0.1:{{param.gui_port}}/
    ws: ws://127.0.0.1:{{param.gui_port}}/ws
```

The Web Console serves the static files at `/api/v1/packages/<package-id>/ui/`.
Runtime opens a specific execution instance.

Build static package assets with relative URLs. This keeps scripts, styles, and
images below the package-scoped `/api/v1` route without hardcoding a package id.

```text
/api/v1/packages/<package-id>/ui/?instance=<instance-id>&context=/api/v1/packages/<package-id>/instances/<instance-id>/context
```

Frontend code should read the context endpoint and use the returned same-origin
`api` and `ws` proxy paths. It must not hardcode host ports. App code should
call the platform through R2Kernel bindings and should not claim NIC, CAN,
serial, or device resources directly. Component packages may claim CPU and
brokered package-frontend networking, but hardware and fieldbus resources still
belong behind gateway packages.

Open the subsystem manifest next to it.

```text
nano tutorials/subsystems/component.mobile/subsystem.yaml
```

The package entrypoint is the package-local `run.py` wrapper. The runtime looks
for `subsystem.yaml` by default, so most one-subsystem packages do not need a
`subsystem_manifest` field in `package.yaml`. Use `subsystem_manifest` only when
a package intentionally keeps the subsystem manifest at another relative path.
There is no separate `packages/` wrapper directory in the cleaner tutorial.

## 3. Validate The Package

Use installed runtime tools.

```text
. <prefix>/env.sh
r2kernel package validate tutorials/subsystems/component.mobile
```

Validation checks manifest schema, package name safety, entrypoint paths,
optional static frontend paths, contract spec roots, and resource claim format.

## 4. Build A Runnable Package Directory

```text
r2kernel package build tutorials/subsystems/component.mobile \
  --out /tmp/r2kernel-robot-mobile.r2kernelpkg \
  --force
```

The current build step validates and copies an already runnable package
directory. It does not compile application source, vendor dependencies, sign
artifacts, or create a system installer.

To upload through the Web Console, archive the package directory.

```text
tar -czf /tmp/r2kernel-robot-mobile.r2kernelpkg.tar.gz \
  -C /tmp r2kernel-robot-mobile.r2kernelpkg
```

## 5. Launch Through R2Kernel

The installed resource service normally runs as a system service. If you are
using a source-built runtime, start a local resource service first. With an
installed release, launch the package.

```text
r2kernel launch run /tmp/r2kernel-robot-mobile.r2kernelpkg \
  --config <prefix>/runtime/config.yaml \
  --instance component.mobile \
  --bind actuator_servo=gateway.device_gateway.actuator_servo
```

Expected result.

- launcher output starts with `Ran package` or `Launched package`
- the child process receives package environment variables
- the child process receives a resource lease
- package runtime files are written under the instance runtime directory
- detached stdout/stderr logs are written under
  `<instance-runtime-dir>/logs/stdout.log` and
  `<instance-runtime-dir>/logs/stderr.log`

On an installed runtime, the default instance runtime directory is
`<prefix>/var/run/packages/<uid>/<instance-id>`, where `<uid>` is the package
user's UID. Stopping the instance keeps it, with its logs. This keeps installed
packages and tutorials read-only while still giving each launched instance a
writable state directory. In a source checkout without `R2KERNEL_PREFIX`, the
fallback is package-local `var/instances/<instance-id>`.

If a detached process exits immediately, the launcher reports that early exit
instead of returning a successful launch result. Check the stderr log path shown
in the error for the package-side failure.

Add `--json` when you need the full machine-readable launch payload.

Launch a second instance with different parameters.

```text
r2kernel launch run /tmp/r2kernel-robot-mobile.r2kernelpkg \
  --instance component.mobile.test \
  --set subsystem.name=component.mobile.test \
  --bind actuator_servo=gateway.device_gateway.actuator_servo \
  --detach
```

This is the same model a product cleaner robot would use to run multiple
instances of a reusable controller package.

## 6. Web Console Management

The Web Console manages the same package contract.

- upload a `.tar.gz` or `.tgz` package archive
- validate and install it
- launch one or more runtime instances of the installed package from Runtime
- expose optional static package frontends under `/api/v1/packages/<package-id>/ui/`
- open package frontends from concrete Runtime instances with instance context
- stop or restart individual runtime instances from Runtime
- uninstall managed packages when no runtime instances are running

Install registers the package once. Multiple execution instances are created at
launch time by choosing distinct instance ids. A package must use
`{{instance.id}}` or explicit parameters for runtime names if it is expected to
run more than once.

The Packages page accepts packages for `gateway`, `component`, `compound`, and
`app` subsystem roles. `role: app` still has the strictest policy: application
subsystems must call bound platform APIs rather than claiming NIC, CAN,
serial, or device resources directly. Packages with browser UI should declare
static assets in `frontend`. If the frontend needs a package-specific REST or
WebSocket backend, declare `frontend.context.api` or `frontend.context.ws` as
localhost endpoint templates. The control backend exposes them to the browser
through instance-scoped same-origin proxy paths. The package backend must not
call `bind()` on a new TCP socket directly. Open the declared loopback listener
through the broker instead.

```python
from r2kernel.core import ResourceBrokerClient

listener = ResourceBrokerClient().open_frontend_tcp_listener(kind="api").socket
# pass listener to the HTTP server implementation for the app backend
```

Only packages launched through R2Kernel receive leases, resource policy, runtime
directories, and Web Console lifecycle management. Directly running a Python
script is useful for development, but it is not a managed robot subsystem.

In practical terms.

```text
python3 subsystem.py
  -> can register and communicate as a subsystem
  -> does not create a package lease or launcher-owned lifecycle

r2kernel launch run package-dir
  -> validates the package
  -> starts through r2kernel-resourced
  -> creates a lease, runtime directory, and lifecycle handle
```

## 7. Cleaner Product Shape

The tutorial world uses the following.

```text
run_sim_world.py -> simulator + static frontend
```

Single-subsystem execution uses the following.

```text
subsystem package root -> r2kernel launch run -> managed lease
```

Full robot execution uses the following.

```text
deployment manifest -> package instances -> managed launch -> resource policy
```

For the cleaner, deployment manifests bind package instances into public
robot slots.

```text
mobile_base_controller    -> installed mobile-base controller package instance
manipulator_controller    -> installed manipulator controller package instance
gripper_controller        -> installed gripper controller package instance
perception_controller     -> installed perception controller package instance
actuator_gateway      -> installed gateway package instance
timed_digital_output_gateway -> installed gateway package instance
application           -> selected cleaner application package
```

Gateway robot slots are Control-only. The cleaner's perception adapter is a
Component instance, and GNSS uses a standard source Control on the Gateway. The
device Gateway's digital-I/O Controls remain private bindings rather than
public slots.

Before packaging the cleaner as a product robot artifact, keep the same standard
contract instances and rerun `r2kernel deploy validate`.

Continue to [Advanced Teleop App Frontend](advanced-websocket-facade.md).

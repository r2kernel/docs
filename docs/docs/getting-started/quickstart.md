# Quickstart

Use the installed runtime and SDK to start the cleaner robot tutorial. Complete
[Installation](installation.md) first, choosing managed system services.
Examples use the default `/opt/r2kernel` location and ports; substitute your
installation's settings when they differ.

## 1. Load the installed environment { #1-install-r2kernel }

Run this in each shell that will use R2Kernel:

```bash
. /opt/r2kernel/env.sh
```

The helper selects the runtime commands and sets `R2KERNEL_PYTHON` to the Python
interpreter prepared by the installer for the SDK.

## 2. Check the managed Python SDK { #2-check-python-sdk-availability }

```bash
"$R2KERNEL_PYTHON" -c 'import r2kernel; print("R2Kernel Python SDK ready")'
```

The expected output is `R2Kernel Python SDK ready`. Editable SDK development and
its separate environment are covered in the
[Developer Guide](../develop/developer-guide.md#installed-runtime-or-public-source-checkout).

## 3. Check the runtime { #3-check-the-control-backend }

```bash
r2kernel status
curl -fsS http://127.0.0.1:8001/api/v1/ready
```

The first command reports runtime diagnostics; the readiness request should
succeed. For a refusal or failed check, use
[Troubleshooting](../operate/troubleshooting.md).

Open the [local Web Console](http://127.0.0.1:18080/) in a browser on the installed
host. For another host or a custom connection, follow
[Console Access](../operate/web-console-manual.md#access) and
[Web and API Security](../operate/web-and-api-security.md).

## 4. Start the cleaner tutorial { #5-continue }

Use the tutorial files already installed under `/opt/r2kernel/tutorials`:

1. [Start Simulation World](../tutorials/start-simulation-world.md) to open the
   simulator and browser view.
2. [Build Gateway Subsystem](../tutorials/build-gateway-subsystem.md) to launch
   `gateway.device_gateway`, your first managed subsystem.
3. Follow the remaining [Cleaner Robot Tutorial](../tutorials/tutorial.md#steps)
   chapters to add components, define the platform, and run an application.

After completing the tutorial, use the
[Developer Guide](../develop/developer-guide.md) to choose the subsystem role you
will build. [Operate](../operate/operator-overview.md) covers daily host management.

## If services were skipped { #4-if-services-were-skipped }

The managed tutorial needs the resource service and Control backend. Register
services using the exact deferred command printed by the installer, as described
in the [Installation Reference](../reference/installation-reference.md#system-services),
then repeat the runtime check above.

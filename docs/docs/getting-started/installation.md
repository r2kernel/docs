# Installation

Install the R2Kernel runtime, SDKs, and tutorials on a Linux host. The commands
below are for Ubuntu / Debian with systemd; release bundles target `x86_64` and
`aarch64`.

## 1. Prepare the host

```bash
sudo apt update
sudo apt install -y ca-certificates curl python3 python3-venv
```

The installer needs access to the distribution service and a Python package
index or compatible local pip cache. Download processing and the runtime/SDK
license boundaries are described in
[Distribution and Licensing](../reference/distribution-and-licensing.md).

## 2. Install R2Kernel { #interactive-install }

Run as your normal user for the current stable release. The installer requests
`sudo` when needed.

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://download.r2kernel.org/install.sh | sh
```

Follow the installer prompts:

1. Read and accept the runtime license. Acceptance must be manual.
2. Keep the default location, `/opt/r2kernel`, for a managed host installation.
3. Choose **Install system services** to start the runtime automatically.
   The wizard also offers Console administrator-password setup.

A fresh installation uses a local HTTP Console with login OFF unless you choose
a password. Keep it on a trusted host; configure
[Web and API Security](../operate/web-and-api-security.md) before remote access.

For a specific version, another channel, or custom install options, use the
[Installation Reference](../reference/installation-reference.md).

## 3. Verify and open the Console

For the default installation and ports:

```bash
. /opt/r2kernel/env.sh
r2kernel status
curl -fsS http://127.0.0.1:8001/api/v1/ready
```

Source `env.sh` in each shell that will use R2Kernel. It selects the installed
runtime and managed Python SDK environment.

Open the [local Web Console](http://127.0.0.1:18080/) in a browser on the installed
host. Use the address selected in the installer if you changed the Console port.
If services were skipped, follow the
[service setup instructions](../reference/installation-reference.md#system-services)
before the readiness check.

## Existing installations { #clean-installs-and-upgrades }

Before replacing a prerelease or an installation whose version is unknown,
back up its configuration and credentials, then remove it with its own
uninstaller. See
[Replacing an installation](../reference/installation-reference.md#replacing-an-installation).

## Continue

Continue with [Quickstart](quickstart.md) for the first runtime and tutorial
checks. Use [Operate](../operate/operator-overview.md) for daily host management.

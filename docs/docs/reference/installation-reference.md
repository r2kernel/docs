# Installation Reference

Start with [Installation](../getting-started/installation.md) for a normal host
setup. This page covers custom choices, replacement, and removal. Examples use
`/opt/r2kernel`; substitute your installation directory when it differs.

## Custom installation location

A user-owned development installation can skip system services:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://download.r2kernel.org/install.sh | sh -s -- \
  --prefix "$HOME/.local/r2kernel" --system-services skip
. "$HOME/.local/r2kernel/env.sh"
```

System services run with root authority and require a protected, root-owned
installation directory. Use a location such as `/opt/r2kernel` for a managed
host. Run the bootstrap as your normal user; it requests elevation when needed.
Running it through `sudo` is unsuitable for a user-owned location.

Choose a dedicated directory. Shared system directories, a home directory
itself, and unrelated nonempty directories are refused. An existing R2Kernel
installation is replaced only after confirmation; unrelated files are retained
or cause a refusal rather than being overwritten.

## Installer options

Use line-based prompts instead of the full-screen interface:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://download.r2kernel.org/install.sh | sh -s -- --no-tui
```

Pass `--help` for release-selection help without downloading an installer:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://download.r2kernel.org/install.sh | sh -s -- --help
```

For the selected release's complete installer option and environment-variable
list, use `--installer-help`. This downloads its installer but does not install
the runtime:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://download.r2kernel.org/install.sh | sh -s -- --installer-help
```

Value options take either `--option VALUE` or `--option=VALUE`. Release-selection
options are handled first; other arguments are passed to the selected installer.
Native installer choices override the corresponding environment values, and the
wizard asks for remaining choices.

| Option | Use |
| --- | --- |
| `--version VERSION` | Select an exact published release, such as `1.0.0`. |
| `--channel CHANNEL` | Select the current release of `stable` or `beta`. The default is `stable`. |
| `--prefix PATH` | Select the installation directory. |
| `--existing-prefix overwrite` or `abort` | Confirm replacement of an existing R2Kernel installation, or stop. This does not authorize overwriting unrelated directories. |
| `--path-mode print`, `shell-rc`, or `none` | Print the environment command, add it to a shell profile, or leave shell setup unchanged. |
| `--shell-rc PATH` | Select the shell profile for `--path-mode shell-rc`. |
| `--system-services install` or `skip` | Register managed systemd services, or defer registration. |
| `--system-service-config PATH` | Use a custom runtime configuration for service registration. |
| `--console-login on` or `off` | Select Console login. Existing settings are inherited when omitted. |
| `--console-password-file PATH` | Read a new Console password from a private file. Do not put passwords in command arguments. |
| `--console-port PORT` | Set the selected Console connection's port. |
| `--console-transport http` or `inherit` | Start with HTTP, or retain the existing connection choice. |
| `--terminal off` or `inherit` | Disable Web Terminal, or retain its existing setting. |
| `--no-tui` | Use line-based interactive prompts. |
| `--install-token-file PATH` | Read a required distribution token from a private file; never put a token in command arguments. |

HTTPS and Web Terminal can be configured after installation in the
[Web Console](../operate/web-console-manual.md). See
[Web and API Security](../operate/web-and-api-security.md) before exposing the
Console or API beyond the local host.

Runtime license acceptance is manual. `--non-interactive` does not accept the
license and refuses published runtime releases that require acceptance. Preset
other choices with options and complete the license review interactively.

## Choose a release { #exact-release-selection }

The same install URL is used for every release. With no selection option, it
selects the current stable release. To choose a specific published version:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://download.r2kernel.org/install.sh | sh -s -- --version 1.0.0
```

To use the beta channel:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://download.r2kernel.org/install.sh | sh -s -- --channel beta
```

Choose either `--version` or `--channel`, once. A missing or unavailable release
stops the installation; another version or channel is not substituted. Version
names use the exact published spelling, such as `1.0.0`; a leading `v` is
accepted. A channel can move to a newer release, while an exact version stays
fixed.

Selection happens once. The selected release's original script pins its
installer and manifest hashes, so the remaining installation continues with that
exact release even if the channel changes. Installation and replacement rules
for the selected prefix still apply. Each prefix has one active runtime version.

Fetch the script over verified HTTPS: a checksum supplied by a script downloaded over HTTP cannot authenticate that script.

Version-specific `install.sh` assets in the
[official repository Releases](https://github.com/r2kernel/r2kernel/releases)
also remain fixed to their own release. Record the exact version with your
deployment configuration when reproducibility is required.

If the distribution service requires authentication, use `--install-token-file`
with a regular, non-symlink file containing one token, no larger than 4,096 bytes,
and mode `0600` or stricter. `R2KERNEL_INSTALL_TOKEN` is also supported. The public
entry contains no release payload; authentication is checked when selecting and
downloading the release.

## System services

The normal installation registers Control, resource management, time sync,
Terminal login, and HTTPS settings services. If registration was skipped, run the
exact deferred-service command printed by the installer. For a fresh default
installation using its managed Console credential store:

```bash
sudo /opt/r2kernel/bin/r2kernel system install \
  --prefix /opt/r2kernel \
  --console-password-store /opt/r2kernel/var/lib/security
```

Custom configurations and credential stores require the matching command and
permissions. Keep the installer-provided command when it names a custom config.
Use [CLI Tools](../operate/cli-tools.md),
[Time Sync Operations](../operate/time-sync-operations.md), and
[Resource Control](../operate/resource-control.md) for operating these services.

## Replacing an installation

A prerelease or unknown-version installation must be removed before installing
1.0.0. Back up configuration and credentials first: uninstall removes the
R2Kernel-managed configuration and runtime state. Use that installation's own
uninstaller, then run the normal install command again.

Keep runtime, SDK environments, SDK-linked subsystem binaries, and federation
hosts on matching versions. Version-specific changes belong in the
[official repository Releases](https://github.com/r2kernel/r2kernel/releases).

For a supported final-release upgrade, the installer coordinates existing
services and verifies the selected SDK environment. Stop separately launched
applications before replacement. If an upgrade fails after services stop, leave
them stopped, correct the reported cause, and rerun the installer with the same
prefix. Do not manually start services against a partially replaced runtime or
remove its recovery metadata to bypass a refusal.

## Uninstall

Inspect a default installation without changing it:

```bash
sudo /opt/r2kernel/bin/r2kernel-uninstall --prefix /opt/r2kernel --dry-run
```

After saving any configuration and credentials you need, remove it:

```bash
sudo /opt/r2kernel/bin/r2kernel-uninstall --prefix /opt/r2kernel
```

For a user-owned installation, run its uninstaller as that user without `sudo`.
The uninstaller stops managed services and removes R2Kernel-owned entries. It
preserves unrelated files and refuses cleanup while required resources are live
or cannot be inspected safely. Follow the reported refusal rather than deleting
service or resource metadata manually.

Accounts and groups are kept by default. Check the uninstaller's `--help` before
using `--remove-users`; it removes only recorded installation-created identities
that are no longer in use. A dry-run is an observational preflight: final
live-resource checks happen after services stop.

## Installation problems

| Message or symptom | Action |
| --- | --- |
| Python cannot create a virtual environment with pip | Install the matching `python3-venv` package, then retry. |
| Prefix is unrelated or unsafe | Choose a dedicated installation directory; preserve its existing contents. |
| Existing version must be removed first | Back up configuration and credentials and use that installation's own uninstaller. |
| Service or resource-policy check refuses a change | Inspect the named configuration, service, or resource and correct the reported cause before retrying. |
| Installation or upgrade was interrupted | Rerun the installer for the same prefix after resolving its error; retain recovery metadata. |

For further diagnosis, use [Troubleshooting](../operate/troubleshooting.md).
Installed paths are listed in [Runtime Layout](runtime-layout.md) and
[Package Layout](package-layout.md). License terms, notices, and download
processing are covered by [Distribution and Licensing](distribution-and-licensing.md).

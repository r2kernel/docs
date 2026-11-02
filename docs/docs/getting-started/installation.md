# Installation

This page describes the published R2Kernel install flow. It focuses on getting
the runtime and SDK onto a host. After installation, use
[Operate](../operate/operator-overview.md) for service management, time sync, resource
control, security, and validation.

## Supported Platforms

R2Kernel runtime installation is Linux-only.

Published runtime bundles currently target.

- Linux `x86_64`
- Linux `aarch64`

The installed runtime uses Linux facilities such as systemd services, cgroup
resource placement, Unix-domain local control channels, SocketCAN, device-node
policy, and Linux time-sync tooling. macOS and Windows are useful for reading
docs, preparing source trees, or editing SDK/tutorial code, but they are not
runtime deployment targets.

The documented commands assume Ubuntu / Debian. Other Linux distributions can
work when equivalent packages and service facilities are available, but the
published install path is validated first on Ubuntu / Debian.

## License Model

The runtime binary payload is not Apache-2.0. Runtime installation requires
manual acceptance of the R2Kernel runtime license/EULA during the installer review
step. Automatic license acceptance is intentionally not supported.

Public SDK source, tutorials, docs, and public spec payloads are distributed
under the R2Kernel SDK open-source license group. Bundled third-party dependencies
and declared SDK environment dependencies are disclosed under Open Source
Notices.

After installation, license and notice documents are stored under
`<prefix>/licenses` (plural). This directory contains the files listed by the
release manifest, typically including.

- the R2Kernel download and installation data notice
- the R2Kernel runtime license/EULA for runtime binaries and services
- the Apache-2.0 license for public SDK/source payloads
- Open Source Notices covering bundled third-party dependencies and declared SDK
  environment dependencies
- third-party full license files, such as the yaml-cpp MIT license when the
  bundled Linux C++ SDK artifact is installed

The presence of multiple files in `<prefix>/licenses` does not mean that the
entire installed tree uses one license. It records the license and notice groups
for the runtime, distribution logging notice, installed SDK artifacts, and
open-source notices.

## Prerequisites

On a minimal Ubuntu / Debian host.

```text
sudo apt update
sudo apt install -y ca-certificates curl wget python3 python3-venv
```

The installer checks these prerequisites before it creates the prefix or
changes the system. It creates the managed Python SDK environment with
`python3 -m venv`, so Python 3 needs its `venv` module and `ensurepip`; on
Debian/Ubuntu they come from `python3-venv` (for a specific interpreter
version the package is `python3.X-venv`, for example `python3.11-venv`). When
they are missing, the installer stops with "cannot create a virtual
environment with pip" and installs nothing; install the package and run the
install command again. On other distributions, install the package that
provides the Python venv and ensurepip modules. When a run as a non-root user
installs system services, `sudo` must be on `PATH` as well.

Install `python3-vcstool` only when you plan to fetch the full matching source
workspace through the entry repo's `r2kernel.repos` manifest.

```text
sudo apt install -y python3-vcstool
```

The install snippets use `curl` by default. Equivalent `wget -qO- ... | sh`
forms are also supported. Run the bootstrap script as the current user, not
through `sudo`; it elevates only when needed, as described in
[Privileges And sudo](#privileges-and-sudo).

## Current Release Install Command

Use the install command from the published entry repository release page.

```text
INSTALL_URL="https://download.r2kernel.org/r2kernel/releases/1.0.0/install.sh"
curl --proto '=https' --tlsv1.2 -fsSL "$INSTALL_URL" | sh
```

Set `INSTALL_URL` in the shell where you run the later examples. Fetch the
bootstrap over verified HTTPS; a checksum supplied by a script downloaded over
HTTP cannot authenticate that script.

Published release docs and entry-repository READMEs are stamped with the exact
release asset URL during the release process. If you are preparing a different
release channel, use that channel's entry-repository release page instead of
copying a URL from another release.

## Download Endpoint

The public install script is small. It downloads the platform-matching installer
binary and the installer then resolves the runtime manifest through the R2Kernel
distribution endpoint.

In production, runtime artifacts are served through the R2Kernel distribution
service. It records operational metadata such as install session ID, client IP,
standard delivery-network request metadata, user agent, requested release and
artifact, response status, requested artifact size (the stored size of the
requested artifact, not bytes received), and failure reason. The distribution
service is designed not to record `HEAD` requests.

This data is used for artifact delivery, private artifact access, installation
diagnostics, release adoption analysis, abuse investigation, and distribution
reliability/security. The distribution endpoint does not collect application
source code, subsystem payloads, runtime messages, robot data, host config
files, shell history, or local files from the installing host. The complete
notice is installed as `DOWNLOAD-NOTICE-R2Kernel.txt` under `<prefix>/licenses`
and is included in the public source tree as `DOWNLOAD_NOTICE.md`.

The current public install flow does not require a user install token. The
installer may create an installation-session identifier so one installation
attempt can be diagnosed consistently. For production installs, use the
published `install.sh` without overriding its distribution settings.

A distribution channel that does require an install token reads it from
`R2KERNEL_INSTALL_TOKEN` or from a private file named by
`--install-token-file PATH` (a regular file, mode `0600` or stricter, holding one
token). The last `--install-token-file` given takes precedence over
`R2KERNEL_INSTALL_TOKEN`, and `install.sh` uses the same token for its own
download of the installer. `install.sh` never puts the token
on a command line: with a token configured, it requires `curl` 7.58 or later
(the token is read from a private file and not sent to another host on a
redirect); Wget is never used with a token, and no download is made without the
token. An install token file that is not a private regular file holding one
token stops `install.sh` before any download. A token is never accepted as a
command-line value: `--install-token` is an unknown argument, and `install.sh`
refuses it before any download.

`install.sh` pins the SHA256 of the installer and of `release-manifest.json` and
the release version; the installer refuses a manifest whose bytes or version
differ. Release locations must be `https://`; `R2KERNEL_ALLOW_PLAIN_HTTP=1` is an
explicit opt-in for a trusted local mirror. Without that opt-in, `curl` in
`install.sh` and the installer follow redirects only to `https://` locations, and
the installer follows at most 10. Without a token and without `curl`,
`install.sh` downloads with Wget, which may follow a redirect to any location;
the downloaded installer is still checked against the SHA256 pinned in
`install.sh`.

## Interactive Install

Default install.

```text
curl -fsSL "$INSTALL_URL" | sh
```

The default install prefix is `/opt/r2kernel`. The rest of the documentation
writes the selected install prefix as `<prefix>`; substitute your prefix in
commands and paths. A relative `--prefix` (or `R2KERNEL_PREFIX`, or a prefix
typed into the installer) is resolved against the current directory, and `.`
and `..` are resolved without following symbolic links; the installer uses that
absolute path for the entry-point links, `env.sh` and service registration.

The prefix must be a dedicated directory: `/`, `/usr`, `/usr/local`, `/opt`,
home directories and world-writable or sticky directories are refused. An
existing directory that is not empty is used only when it holds an earlier
R2Kernel installation (its `.r2kernel-prefix` marker or an R2Kernel runtime);
otherwise the installer stops and names the entries it found. In an R2Kernel
prefix the installer replaces only what an earlier R2Kernel install created; a
foreign `bin`, `lib` or other product entry stops installation with an error
naming the path, and an existing prefix keeps its mode. An existing
installation of a prerelease, or of an unknown version, is refused; see
[Clean Installs And Upgrades](#clean-installs-and-upgrades).

Choose a development user prefix.

```text
curl -fsSL "$INSTALL_URL" | sh -s -- --prefix ~/.local/r2kernel
```

When a TTY is available, the installer opens a terminal UI for license review,
prefix selection, PATH integration, optional Console administrator login, and
Linux system-service setup. Console login defaults OFF on a fresh installation;
choosing New password (ON) always prompts for a masked password and confirmation
and stores it before services start. For an existing valid configuration, choose
Inherit (the default), OFF, or New password (ON). Inherit also applies to recovery
installs where the configuration exists without a complete installation. Use the arrow keys
or Space to select the displayed choice. Password and confirmation fields appear
when New password (ON) is selected. That choice replaces
only the installer-managed password; custom password sources require separate
administration. Empty passwords are rejected; short passwords are allowed. OFF
does not delete a password and changes only Console login. The existing API
security setting is preserved. Inherit preserves the existing Console login
profile. The separate **Console Connection and Terminal** step selects HTTP or
Inherit for the connection and OFF or Inherit for Terminal. Each Inherit choice
shows its current value and keeps that setting independently of administrator
login. New installations use HTTP and Terminal OFF. In the wizard, system
services default to Install only when the selected prefix can host root
services (protected and, for a non-root run, existing); otherwise they default
to Skip and Install is refused before anything is installed.

Managed system-service installation starts the Console with HTTP. Terminal
starts OFF. Reinstallation preserves existing Console HTTP/HTTPS and Terminal
settings. Settings → Security → Console connection switches between HTTP and
HTTPS (default HTTPS port `18443`). Choose the device certificate and private key,
generated uniquely on that device, or upload your own certificate and private key
PEM files. User certificates must cover the current Console hostname or IP
address. Save the connection settings, then choose **Apply all saved settings
(restart)**. Control restarts. After it restarts, choose **Reconnect to Console**
to open the saved address when the protocol changes.
The browser may require trust confirmation for a generated device certificate.

The installer also asks for the Console port, using the current selected
connection's port on an upgrade and HTTP port `18080` on a new installation. Explicitly configured
ports, including `ui_port: 0` API sharing, are preserved.
The command-line option is `--console-port PORT`. Console connection settings
provide the same port field for HTTP and HTTPS; switching the protocol recalls
the saved port for that protocol. Save, apply the restart, then reconnect at the
displayed new address. Port changes retain the saved certificate and private key.

Only the selected Console protocol is served. HTTPS closes a separate HTTP
Console listener. Shared product/API HTTP listeners keep their independent
services and reject Console documents and management routes. The HTTPS management origin
excludes installed product frontends, which retain their own authentication.
HTTP and HTTPS Console sessions use separate cookies; sign in again after a
connection change when Console login is ON. Product support URLs are optional.

Settings → Terminal provides ON/OFF and optional session limits. Terminal uses
HTTP/ws with an HTTP Console and HTTPS/wss with an HTTPS Console. There is no
separate Terminal transport exception or risk acknowledgement. Save & apply
Terminal closes existing Terminal sessions without restarting Control. Exact
origins, listener admission, and OS account authentication remain enforced.

The installer sets public runtime and SDK directories to `0755`, public data files
to `0644`, and executable runtime files to `0755`, so a restrictive shell `umask`
does not prevent services from reading the installation. It also makes `env.sh`
readable for users sourcing the installed environment. Reinstallation preserves
existing configuration file contents, ownership and permissions. Private managed
credential directories and password files remain protected; parent directories
outside the selected installation prefix are not changed.

Web Terminal provides local OS login in the environment running Control: the
installed Linux host for a native installation, or the Pod container for a
container deployment. It does not use or require an SSH server. The login
broker uses the non-login (`nologin`) `r2kernel` service account; operators
authenticate as an existing OS account. The installer does not create human OS
accounts or change their passwords.

Line-based prompt mode.

```text
curl -fsSL "$INSTALL_URL" | sh -s -- --no-tui
```

## Installer Options

Every option that takes a value accepts both `--option VALUE` and
`--option=VALUE`. Choices given as options, or as the `R2KERNEL_*` environment
values listed by `--help`, are used as given; the TUI or line-based prompt asks
only the remaining questions. Command-line options override environment values.
Unknown options and missing values are errors.

```text
--prefix <path>
--existing-prefix overwrite|abort
--path-mode none|print|shell-rc
--shell-rc <path>
--system-services install|skip
--system-service-config <path>
--console-login on|off
--console-password-file <private-file>
--console-transport http|inherit
--terminal off|inherit
--console-port <port>
--install-token-file <private-file>
--no-tui
--non-interactive
```

To see the installer's own list of options and environment values, pass
`--help` through the bootstrap script.

```text
curl -fsSL "$INSTALL_URL" | sh -s -- --help
```

`--existing-prefix overwrite` approves installing into an earlier R2Kernel
prefix that already contains files; the installer then replaces only what an
earlier R2Kernel install created. It does not make other non-empty directories
usable: a non-empty directory without an R2Kernel installation is refused with
or without the option. `--existing-prefix abort` stops at any non-empty prefix
instead. Without the option, the installer asks.

`--non-interactive` (alias `--yes`) never prompts. A decision that has no safe
default is an error that names the option to pass, for example
`--existing-prefix overwrite|abort` for a non-empty prefix. Services default to
`skip`; `--system-services install` requires running as root. A release that
requires license acceptance is refused, because license acceptance is manual
only (see [Manual License Review](#manual-license-review)). Published runtime
releases require acceptance of the runtime license, so install them with the
TUI or `--no-tui` and preset the other choices with options.

### Privileges And sudo

`install.sh` parses every argument and checks the prefix location with the
downloaded and verified installer, as the invoking user, before any `sudo`
prompt; invalid arguments fail without elevation. Checks that need the release,
the prefix contents or root run after elevation, before anything is downloaded
or installed. `install.sh` elevates only when the selected prefix is not
writable by the current user or `--system-services install` is selected, and
only when the prefix is protected (root-owned, not a symbolic link, not
group/other writable):

- a prefix in your home directory installs without `sudo`
- system service registration needs a protected prefix such as the default
  prefix
- an installer running as root refuses a prefix that is not protected; re-run
  `install.sh` with `--prefix PATH` for a user prefix
- with `--non-interactive`, `install.sh` uses `sudo -n`, which fails instead of
  prompting for a password

Through `sudo`, `install.sh` forwards exactly the installer's documented
`R2KERNEL_*` environment values that are set, never the install token. It
removes its temporary directory on exit or interruption and exits with the
installer's status.

## Manual License Review

Runtime license acceptance is manual only. Official runtime manifests require
the installer to show the required license document and require you to accept
the license in the TUI or line-based prompt (no acceptance record is written). The installer intentionally rejects automatic
license acceptance flags, and `--non-interactive` refuses a release that
requires license acceptance.

Default manual flow.

```text
curl -fsSL "$INSTALL_URL" | sh
```

Line-based manual prompt instead of the full-screen TUI.

```text
curl -fsSL "$INSTALL_URL" | sh -s -- --no-tui
```

Product prefix and system services.

```text
curl -fsSL "$INSTALL_URL" | sh -s -- \
  --prefix <prefix> \
  --system-services install
```

The Console options below are part of [Installer Options](#installer-options).

`--console-login` and `--console-password-file` select explicit Console setup.
`--console-transport` and `--terminal` independently select the connection and
Terminal policy. Omitting them preserves an existing value; a fresh install uses
HTTP and Terminal OFF. Explicit `http` and `off` reset those settings without
changing administrator credentials or API authentication. HTTPS and Terminal ON
can be enabled in Settings after installation.
`--console-login on --console-password-file` explicitly sets a new password,
replacing an existing installer-managed credential when present. Supply a protected
password input file, never a password in command arguments. For script compatibility
only, `--console-login on` without a file retains an existing credential; without
an existing credential, unattended installation requires the file and interactive
setup prompts for a new password. This reuse behavior is not a separate interactive
choice. With no flags, existing configuration is inherited and a fresh installation
defaults OFF. When login remains OFF and no password
exists, the first visitor can register a password later in Settings → Security
without a setup code. Keep that initial Console on a trusted management surface.

Service registration can also run as a separate step: install with
`--system-services skip`, then register the services with the installed helper.

```text
curl -fsSL "$INSTALL_URL" | sh -s -- \
  --prefix <prefix> \
  --system-services skip

sudo <prefix>/bin/r2kernel system install --prefix <prefix> \
  --console-password-store <prefix>/var/lib/security
```

Use a root-owned, service-readable prefix such as the default prefix for product
deployments.
User-home prefixes remain useful for development.

## Installed Layout

The installer writes.

- runtime payload under `<prefix>/runtime`
- executables under `<prefix>/runtime/bin`
- runtime libraries under `<prefix>/runtime/lib`
- Web Console assets under `<prefix>/runtime/frontend`
- public spec files under `<prefix>/runtime/spec`
- runtime support tools under `<prefix>/runtime/tools`
- C++ SDK under `<prefix>/sdk/cpp`
- Python SDK wheel under `<prefix>/sdk/python`
- guided tutorial source under `<prefix>/tutorials`
- license and notice documents under `<prefix>/licenses`
- service unit sources under `<prefix>/systemd`
- runtime state, logs, and control service home under `<prefix>/var`
- shell environment helper under `<prefix>/env.sh`
- uninstaller under `<prefix>/bin/r2kernel-uninstall`

Top-level entry points.

- `<prefix>/bin` -> `<prefix>/runtime/bin`
- `<prefix>/spec` -> `<prefix>/runtime/spec`
- `<prefix>/config.yaml` -> `<prefix>/runtime/config.yaml`

Source the environment helper before using installed SDK/runtime commands or
tutorials.

```text
. <prefix>/env.sh
```

This sets `R2KERNEL_PREFIX`, updates `PATH`, and configures spec/runtime library
paths for the installed SDK.

Loading this environment is a per-shell action. In the installer, choose whether
to leave shell files unchanged, print the commands for manual use, or explicitly
register automatic loading in your own shell profile. Automatic registration is
optional; it is not needed for administrator configuration commands. `sudo` uses
its own environment and does not inherit the PATH created by `env.sh`.

For a protected system prefix such as the default prefix, Linux service registration
also installs `/usr/local/bin/r2kernel-config`, pointing at that installation's
actual configuration. It never overwrites an unrelated command. To edit system
configuration, use:

```bash
sudo /usr/local/bin/r2kernel-config
```

On systems whose sudo search path includes `/usr/local/bin`, the shorter
`sudo r2kernel-config` also works. No environment helper is required. User-home
installations do not create this system-wide entry; use their local CLI instead.
Runtime code and system-level configuration remain root-protected. Managed Linux
service installation prepares a separate private Control settings store so the
Web Console and CLI can save supported operational settings, including login
and Terminal policy, without making the runtime directory writable. System-owned
fields remain read-only in the GUI; use the administrator CLI for those changes.
Existing base configuration, overrides, and credentials are preserved during
updates. Saving configuration does not automatically restart services.

## Linux Services

On Linux, the installer can register.

- `r2kernel-control.service`
- `r2kernel-resourced.service`
- `r2kernel-timesyncd.service`
- `r2kernel-terminal-login.service`
- `r2kernel-https-settings.service`

The control service runs without root privileges. The resource service, the
time-sync supervisor, the Terminal login service and the HTTPS settings service
run as root: they keep the narrow root authority needed for resource brokering,
host-level clock management, local OS login and protected TLS material.

The system service installer creates a `r2kernel` resource group by default. The
control service and managed SDK package processes use that group for the local
runtime boundary. Managed package launches preserve it as a supplementary group,
so application code does not need to patch runtime ownership or permissions.

Service unit files live under `<prefix>/systemd`. The installer links them from
`/etc/systemd/system` so uninstall can remove the links and then the entries
R2Kernel manages in the prefix. Runtime sockets use `/run/r2kernel`, owned by `root:r2kernel`
with mode `3770` (group inheritance and sticky protection), and are recreated when services start. The SDK control plane
uses `/run/r2kernel/control.sock` by default; managed launch paths pass the
resolved path to application processes as `R2KERNEL_CONTROL_SOCKET`.

After joining the runtime group, open a new login session before using its
sockets from an existing shell. The installer supplies the IPC group to managed
services and `<prefix>/env.sh`. Managed shared memory and Linux named semaphores
use that exact group and mode `0660`; direct execution without an IPC group uses
owner-only `0600`. Objects with unknown owners or any other mode, including
world-accessible `0666` shared memory or semaphores, are rejected without
changing their identity or permissions, even when root requests creation; they
are never restricted in place. Semaphore creation publishes the exact secure
permissions above; opening an existing semaphore (including
create-if-present) requires it already to satisfy the owner, group, mode, size,
regular-file, and single-link checks. Stop the processes using a rejected
object, inspect its origin and users explicitly, then remove and recreate it
through secure creation; changing permissions cannot revoke descriptors that a
process already opened. Do not widen permissions or adopt a first-seen object
as trusted. See
[Manager and Device Authorization](../reference/resource-authority.md).

If service setup was skipped, run the exact command printed by the installer.
For a new install using the default managed Console credential store:

```text
sudo <prefix>/bin/r2kernel system install --prefix <prefix> \
  --console-password-store <prefix>/var/lib/security
```

For a dedicated config using that same newly prepared managed store:

```text
sudo <prefix>/bin/r2kernel system install \
  --prefix <prefix> \
  --config /path/to/config.yaml \
  --console-password-store <prefix>/var/lib/security
```

The helper prepares the private Control settings and credential stores before
starting services and verifies access as the non-root service user. The explicit
credential-store option applies only to the installation's managed default
store. It supports an empty store (Console OFF with later first registration)
and an installer-created password. The installer prepares that store owned by
root with mode `0700` and `0600` entries; the helper hands it to the service user
without changing credential contents. Other modes, unexpected files, unsafe
links, mixed ownership, or a custom credential location cause an explicit error
rather than an automatic ownership change. Provision custom stores
separately; a dedicated configuration pointing elsewhere cannot use the
default-store command.

For details, see [Time Sync Operations](../operate/time-sync-operations.md) and
[Resource Control](../operate/resource-control.md).

## Clean Installs And Upgrades

R2Kernel 1.0.0 supports clean installs only. A prerelease installation cannot
be upgraded to it. Before it changes anything, the installer reads the release
recorded in `<prefix>/runtime/release-manifest.json` and stops when that release
is a prerelease or when no final release version can be read. Remove such an
installation with its own uninstaller, then install again into the emptied
prefix:

```text
sudo <prefix>/bin/r2kernel-uninstall --prefix <prefix>
curl -fsSL "$INSTALL_URL" | sh -s -- --prefix <prefix>
```

For a prefix that you own, run the uninstaller without `sudo` (see
[Uninstall](#uninstall)). Uninstalling removes the R2Kernel-managed entries of
the prefix, including `var` with runtime state and the managed Console
credentials. Copy any configuration or credentials you want to reuse before
uninstalling, and apply them to the new installation.

The installer prints this refusal on standard error and exits with a non-zero
status before it asks for `sudo` or downloads anything, also when it would
otherwise start the interactive wizard, so a log captured with
`2>&1 | tee install.log` keeps it.

### State Left By A Prerelease Uninstaller

A prerelease uninstaller (for example 1.0.0rc11) removes the prefix and its
services but can leave system state outside the prefix, also with
`--remove-users`:

- `/etc/r2kernel/resource-authority.json`, which names the removed prefix and
  the old account IDs;
- the `r2kernel` account and group, kept as "shared or changed" because the
  installer had added the manager user to the group;
- the `r2kernel-device` group and `/etc/udev/rules.d/70-r2kernel-device-policy.rules`;
- the package cgroup root `/sys/fs/cgroup/r2kernel-packages` and `/run/r2kernel`.

The 1.0.0 system service installer handles this state when it registers
services. It treats the state as orphaned only when all of these hold: the
policy is a root-owned R2Kernel resource authority policy, the prefix it names
has no installation records (`<prefix>/etc/runtime-ipc-group` and the related
files), no R2Kernel service unit is registered, no process runs from that
prefix's runtime and no process is left in the package cgroup root. If the
policy names a different prefix, no R2Kernel installation may remain there.
After its other checks pass, the installer then:

- renames the policy to `resource-authority.json.orphaned-<UTC time>` and
  writes a new policy for the new installation. Device and link-layer grants
  of the old policy are not carried over; the installer names how many there
  were, so that you can approve them again;
- reuses the `r2kernel` account and group, and records them as created by
  this installation, when the old policy names their IDs and the account is a
  system account without a login shell whose home is in this prefix. It does
  the same for the `r2kernel-device` group when the R2Kernel udev rule names
  it and no account uses it;
- carries over the memberships in the adopted `r2kernel` group only for this
  installation's own accounts (`r2kernel`, `r2kernel-app`) and its manager
  user, and records them, so that `r2kernel-uninstall --remove-users` removes
  them. Every other member, such as the manager user of the removed
  prerelease, is removed from the group, so that a former operator's new
  sessions do not get access to the R2Kernel IPC. The installer names each of
  them with the command that adds the membership back, for example
  `sudo gpasswd -a sdr r2kernel`, if it is intended. Removing a membership does
  not change processes that already run: a session of that user that was open
  before the installation keeps the group, and with it IPC access, until it
  ends. The installer names such processes with their PIDs (those that hold the
  group as their real or a supplementary group; this is not a complete list of
  every credential form); end those sessions, for example with
  `sudo loginctl terminate-user sdr`. An account whose primary
  group is the adopted group is not changed either; the installer names it;
- removes the stale R2Kernel entries of `/run/r2kernel` and
  `/run/r2kernel-authority`.

The inspection before any change describes this state once, including the
memberships that are not carried over; the retirement then prints only what it
did.

Accounts that do not meet these conditions are reused as pre-existing
accounts, as on any host where they already exist, and an uninstall keeps
them. If the installer cannot prove that the state is orphaned, it changes
nothing, prints the reason with the exact commands that remove the state, and
stops.

You can also remove the state yourself before installing. Run these commands
only after `systemctl list-unit-files 'r2kernel-*'` lists no unit, and replace
`<manager-user>` with the user that installed the prerelease:

```text
sudo mv /etc/r2kernel/resource-authority.json /etc/r2kernel/resource-authority.json.prerelease
sudo rm /etc/udev/rules.d/70-r2kernel-device-policy.rules
sudo udevadm control --reload-rules
sudo udevadm trigger --action=add --settle --subsystem-match=tty --sysname-match='ttyS[0-9]*' --sysname-match='ttyUSB[0-9]*' --sysname-match='ttyACM[0-9]*' --sysname-match='ttyAMA[0-9]*'
sudo find /dev -xdev -group r2kernel-device
sudo rmdir /sys/fs/cgroup/r2kernel-packages
sudo gpasswd -d <manager-user> r2kernel
sudo userdel r2kernel
sudo groupdel r2kernel
sudo groupdel r2kernel-device
sudo rm -r /run/r2kernel /run/r2kernel-upgrade
```

The `add` event lets udev's default rules give the serial devices their group
again (`dialout` on Debian and Ubuntu); a `change` event keeps the
`r2kernel-device` group. Delete `r2kernel-device` only when `find` lists no
device; otherwise give each listed device its group first, for example
`sudo chgrp dialout /dev/ttyS0`. A device whose group was already deleted shows
a number instead of a group name in `ls -l /dev/ttyS*`; `chgrp` fixes it the
same way. `rmdir` fails while package cgroups remain below the root; remove the
empty cgroups below it first. `groupdel r2kernel` reports an error when
`userdel` already removed the group.

A removed installation can also delete the package account `r2kernel-app` but
keep its group. The installer then creates the account in that group and
records the group as created by this installation, so that
`r2kernel-uninstall --remove-users` removes both. It does this only when the
group is provably an unused R2Kernel leftover: a system group (GID below
`GID_MIN`) named exactly `r2kernel-app` whose GID no other group shares, with
no members, no account using it as its primary group, no systemd unit or
running process using it, no other R2Kernel installation registered, and, when
a resource authority policy remains, the policy naming that GID for packages
(an orphaned policy) or not using it (the policy of a current installation).
Otherwise the installer stops before it changes anything and prints the reason
and the cleanup commands, for example:

```text
sudo gpasswd -d <member> r2kernel-app
sudo groupdel r2kernel-app
```

The first command is needed only for each member the message lists. When the
group is another account's primary group, give that account another primary
group first (`sudo usermod -g GROUP ACCOUNT`). The same check runs before the
installer prepares the managed Console store.

The reverse can happen too: the package account `r2kernel-app` remains but its
primary group was deleted, so `id -gn r2kernel-app` fails. The installer then
creates that group again with the account's GID, before any other group, and
records the account and the group as created by this installation, so that
`r2kernel-uninstall --remove-users` removes both. It does this only when the
account is provably an unused R2Kernel leftover: a system account (UID below
`UID_MIN`) named exactly `r2kernel-app` with no login shell, its home inside
the installation prefix, a UID no other account has, a system GID that no group
and no other account uses, no supplementary groups other than `r2kernel` and
`r2kernel-device`, no systemd unit or running process using it, no other
R2Kernel installation registered, and, when a resource authority policy
remains, the policy naming its UID and GID for packages (an orphaned policy) or
using neither (the policy of a current installation). Otherwise the installer
stops before it changes anything and prints the reason and the commands, for
example:

```text
sudo userdel r2kernel-app
```

or, to keep the account (the installation then reuses it and never deletes
it):

```text
sudo groupadd --system --gid <gid> r2kernel-app
```

An installation of a final release is upgraded in place by a later final
release of the same major version, for example from 1.0.0 to 1.0.1, as
described in [Verification](#verification).

## Uninstall

To remove a product install.

```text
sudo <prefix>/bin/r2kernel-uninstall --prefix <prefix>
```

To remove a prefix that you own as a non-root user, such as `~/.local/r2kernel`
installed with system services skipped, run the uninstaller as that user without
`sudo`. When you own the prefix and the prefix path is not a symbolic link, the
uninstaller does not elevate through `sudo`; `--no-sudo` declines elevation
explicitly.

```text
<prefix>/bin/r2kernel-uninstall
```

A user-owned prefix is removed only by its owner, and only when nobody else can
change the path to it:

- no directory on the path is a symbolic link;
- each directory is owned by root or by you;
- no directory is writable by another user. World-writable directories,
  including sticky ones such as `/tmp`, are refused. A group-writable directory
  is refused unless its group is your private group, meaning no other account
  holds that group. A directory with a POSIX access ACL (any entry beyond the
  owner, group and other permissions) is refused. NFSv4 ACLs are not
  inspected.

The prefix must have no registered R2Kernel services. None of your processes may
use it, and it must have no R2Kernel registry with registered pools or
shared-memory objects that belong to you.

Before changing anything, the uninstaller checks that you can remove every
R2Kernel entry, and the prefix directory too when it would end up empty. A refusal
therefore leaves the prefix unchanged.

Root refuses a prefix that another user owns, also when the uninstaller
elevated through `sudo`: that user could replace an entry with a symbolic link
while root removes the tree. Rerun the command as the owner.

Without root, the uninstaller cannot see the files of other users' processes
or of non-dumpable processes. It checks those by command line only and reports
how many there were.

The uninstaller loads the protected same-prefix IPC policy itself; the command
does not require sourcing `env.sh` under `sudo` or preserving ambient variables
with `sudo -E`. It validates the actual protected resource-service unit's
`--config` and resolved socket against `<prefix>/etc/resource-service-identity.json`.
Service registration writes this identity; an existing supported installation
without that file establishes it from its actual protected unit and effective
config before stopping services. A divergent recorded identity, ambiguous
command/environment, or unsafe config/override is refused before stopping.
External `--config` files and explicitly configured custom sockets are supported:
retirement selects their exact registry, never the default config's or an ambient
environment's registry.

The uninstaller stops declared dependent consumers before the core services,
then rejects remaining processes using the prefix through executable, working
directory, library mappings, file descriptors, or command arguments, even when
they have no registered pool. Only the helper itself and its exact privileged
sudo ancestor chain are excluded, not unrelated sudo or same-UID processes.
It retires the selected registered resources before removing units or the prefix.
A policy mismatch, live reference, or service-stop failure refuses cleanup and
retains recovery metadata and units; some services may already be stopped.
Correct the refusal and rerun, or restart the retained units to recover.
External configs and unrelated registries are not deleted. External
ownership/synchronization metadata can remain; it does not make those external
resources owned by the selected installation.

After the prefix entries, the uninstaller removes the system state that the
installation recorded creating, or provably published, also without
`--remove-users`, because none of it has a use without the installation:

- `/etc/r2kernel/resource-authority.json` when it names this prefix, a
  `resource-authority.json.orphaned-*` backup the installer made, and
  `/etc/r2kernel` when it is then empty;
- the package cgroup root `/sys/fs/cgroup/r2kernel-packages` and the empty
  package cgroups below it;
- `/etc/udev/rules.d/70-r2kernel-device-policy.rules`, after which it reloads
  the udev rules and gives the serial devices back their group, as described
  below;
- the R2Kernel entries of `/run/r2kernel` (the Control and resource sockets,
  Control locks and time-sync state, and the default pool registry only when
  this installation selected it and it is empty and unlocked) and the unlocked
  scope locks in `/run/r2kernel-authority`. Each directory is removed when it
  is then empty; other entries are kept and listed;
- the upgrade coordination directory `/run/r2kernel-upgrade`, when it holds
  nothing but its lock, which no other process uses.

The udev rule and the runtime entries are kept while R2Kernel units of
another installation are registered. A policy that names this prefix but was
left by an earlier installation is kept and named, with the command that
removes it; the next installation retires it as described in
[State Left By A Prerelease Uninstaller](#state-left-by-a-prerelease-uninstaller).

The udev rule assigns `/dev/ttyS*`, `/dev/ttyUSB*`, `/dev/ttyACM*` and
`/dev/ttyAMA*` to the `r2kernel-device` group. Removing the rule alone does not
give them back their group, because udev's default rules assign it (`dialout`
on Debian and Ubuntu) only when a device is added. The installer therefore
records the owner, group and mode of each of these devices before it installs
the rule, and the uninstaller, after removing the rule:

1. restores the recorded owner, group and mode of each recorded device that
   still has the `r2kernel-device` group;
2. replays udev `add` events (`udevadm trigger --action=add --settle`) for the
   other tty devices with that group, such as an adapter plugged in after the
   installation or a device that a prerelease rule had already changed, so
   that udev's default rules give them their group;
3. keeps the `r2kernel-device` group when a device still has its GID, names
   each such device with the commands that fix it, and exits with status `3`.
   Give each named device its group, for example
   `sudo chgrp dialout /dev/ttyS0`, or reboot, then run
   `sudo groupdel r2kernel-device`.

`--remove-users` deletes a group only when no device has its GID, so no device
is left with a GID that has no group.

Successful managed uninstall removes only the selected prefix's upgrade
recovery journal. Concurrent recovery, unsafe state, changed unit selection or
failed teardown refuses cleanup and preserves recovery state. Journals for other
prefixes remain intact.

System accounts and group memberships are kept by default. The installer
records the accounts and groups it creates (`r2kernel`, `r2kernel-app` and
`r2kernel-device` by default) and the group memberships it adds, such as the
manager user in `r2kernel`, before it makes them. `--remove-users` first
removes the recorded memberships from the groups the installation created
(only while such a group still has the GID it was created with; a group that
was deleted and created again keeps its members), then
considers only exact name/UID or name/GID identities recorded as created by
this installation in its protected service-identity metadata, and only when no
other installation, service, process or group membership still references them.
Pre-existing, reassigned, shared and legacy unrecorded accounts are retained,
and so are memberships that an administrator added. A retained group also
retains a same-named user when deleting it could implicitly delete that group.
It also removes sudo's timestamp records `/run/sudo/ts/<UID>` of exactly the
accounts it deleted (Control runs `sudo` as its account for time-sync
diagnostics); when sudo keeps its timestamps in another layout, they are left
alone. When the installation recorded no accounts, `--remove-users` removes
nothing and says so. Optional account or system-state cleanup failure after successful
prefix retirement exits with status `3` and names that partial outcome; it is
not a successful account deletion or a rollback of prefix removal.

The uninstaller requires the prefix's `.r2kernel-prefix` marker or an R2Kernel
runtime and refuses the same shared system locations and home directories as
the installer. It removes only what R2Kernel manages (`runtime`, its entry-point
links, `sdk`, `tutorials`, `licenses`, `var`, `systemd`, `env.sh`, `etc`,
`management-tls` and the marker); other entries, including foreign files in
`etc`, are kept and listed, and the prefix directory is removed only when it is
empty.

An entry-point link is R2Kernel's when it names `<prefix>/runtime/<name>`. That
holds in normal form, or through another spelling of the prefix directory such
as a path through a symbolic link. It also holds for a dangling relative link of
the form an earlier installer wrote for a relative `--prefix`. A prefix
installed through a symbolic-link ancestor is therefore removed completely, from
its physical path.

For an installation made with system services skipped, removal is conservative:
the prefix, whether root-owned and protected or owned by you as described above,
must be unused, with no owned services, process references, or ambiguous or
nonempty runtime state. For a user-owned prefix, only your own registries and
shared-memory objects count; those of root and of other users are not this
prefix's state. Valid empty registries alone are not
live use. This path removes only R2Kernel's entries of that prefix, not
unrelated global resources.
A known managed installation with missing or unsafe policy metadata fails
closed rather than being treated as an unused no-service installation.

An installation whose service registration failed before any unit was
registered, for example when the installer stopped in its service checks, is
removed the same way: no R2Kernel service of it can have run, so no pools are
retired, but live references, nonempty registries and shared-memory objects
still refuse removal. The system state and accounts that it recorded are then
removed as after a managed uninstall, and `--remove-users` without recorded
accounts is a no-op with a note rather than an error.

Use `--dry-run` for read-only observational preflight without stopping services,
retiring pools, changing permissions, creating registry state, or writing
installation metadata. A root-owned prefix needs root for `--dry-run` as well;
a user-owned prefix is dry-run by its owner without `sudo`. It inspects policy and unit/link ownership, actual
config/override, registry structure/permissions and recorded pool identities,
and prefix consumers outside the exact selected service cgroups. Missing
registry state is reported as absent, not treated as an inspected empty file.
Final exclusive-teardown and live-reference checks are explicitly **deferred**
until managed services have stopped; a successful dry-run is not an assertion
that final teardown will succeed. A registered pool whose permissions do not
satisfy the installed policy fails the observation.

Managed inspection requires root to read protected registries and process state,
including dry-runs. Unreadable or malformed state fails, rather than being
reported as success. The launcher elevates through `sudo` when needed,
including dry-runs, except for a prefix the caller owns;
`--no-sudo` explicitly declines that elevation and does not relax safety checks.
An unused no-service prefix retains its observational path without a blanket
root requirement, but any unreadable safety dependency still refuses removal.


## Verification

```text
. <prefix>/env.sh
r2kernel --help
r2kernel status
r2kernel config --help
r2kernel package --help
r2kernel launch --help
r2kernel resource inventory
r2kernel timesync doctor --json
```

If services were installed.

```text
sudo systemctl status r2kernel-control.service --no-pager
sudo systemctl status r2kernel-resourced.service --no-pager
sudo systemctl status r2kernel-timesyncd.service --no-pager
sudo systemctl status r2kernel-terminal-login.service --no-pager
sudo systemctl status r2kernel-https-settings.service --no-pager
```

Interactive Linux installs default to system-service setup when systemd is
available and the selected prefix can host root services. Noninteractive plans default to skipping
services unless `--system-services install` is passed.

When upgrading a prefix with registered Linux services, the installer stops
systemd units that declare runtime dependencies, including application
supervisors, before stopping Control and the resource service. It performs this
shutdown before replacing runtime or SDK files. After installation, it verifies
the resource socket and Control readiness, then restores the units that were
active before the upgrade. Previously inactive units remain inactive; services
registered for the first time are started. The standalone service installer uses
the same sequence when replacing service definitions.

Before stopping existing services, the installer verifies the selected SDK
artifacts and prepares a versioned Python environment, including dependencies,
wrapper imports and native-library compatibility. A failure at this preparation
stage leaves the running installation and its selected Python environment in
place. Dependency installation requires an accessible package index or a
compatible local pip cache; the runtime bundle alone is not an offline dependency
bundle.

Preparation is serialized per Python environment store. A retry may rebuild an
owned, protected, incomplete digest directory only when it is neither selected nor
used by a live preparation. Completed environments are validated and reused;
unsafe, selected, or live preparations are preserved and reported, not deleted.
Do not remove a preparation lock file to force a concurrent installer through.

Before changing client authority or stopping existing services, service
registration preflights the protected installed policy, creator identities,
configuration, key material, and cgroup root. Adding another client updates both
the creator and resource-authority policies while retaining administrator grants.

`--system-services skip` skips service registration, but still coordinates an
upgrade of existing services belonging to the selected prefix. Fresh installs
without registered services retain the usual skip behavior. Dependencies must
be declared in systemd units; separately launched applications must be stopped
before replacing the runtime. Another prefix's runtime services are left alone.

If shutdown fails before file replacement, the installer attempts to restore
the original active set and reports any recovery failure. If replacement or
readiness fails, it keeps the affected services stopped and records the original
active set in a protected journal under `/run/r2kernel-upgrade`. Re-run the
installer with the same prefix to complete the interrupted installation and
restore that set. Do not manually start services against a partially replaced
runtime. Service-store preparation and the service helper's `--dry-run` do not
stop services.

A dangling registered-unit source is not repaired by creating an empty prefix or
rerunning service registration: both reach the same protected-source check.
Inspect the named unit with `systemctl show UNIT -p FragmentPath -p SourcePath`
and restore its exact protected, matching source before retrying. The diagnostic
names the unit, fragment/source and target; it is not an automatic reset facility.

## Installed SDK Payload

The installer places SDK payloads under `<prefix>/sdk`, but it does not install
the Python wheel into your active virtual environment. It also installs the
guided tutorial source under `<prefix>/tutorials`, so normal tutorial use does
not require a separate SDK source checkout.

The installed service and CLI use the managed Python environment selected under
`<prefix>/sdk/python/current`. Activating a separate shell virtual environment
does not change the interpreter used by managed package processes. Packages that
explicitly select another interpreter must provide their dependencies there.
The installer also copies the supporting transport fixtures under
`<prefix>/runtime/tools/qa/fixtures`, exposed through the installed tools alias.

Linux C++ SDK release payloads bundle yaml-cpp internally, so installed-user C++
tutorial builds do not depend on a distro-specific `libyaml-cpp.so.*` at runtime.

The reusable local Control transport requires matching runtime and SDK versions.
When upgrading, update the runtime, Python environments, and SDK-linked
subsystem binaries together, then restart those processes. A protocol mismatch
is an error, not an automatic downgrade. Application API contracts and host-to-host TCP are unchanged.

## License Files

The installer keeps release-manifest license and notice documents under
`<prefix>/licenses`. Use this directory as the installed license record for the
runtime EULA, public SDK/source notices, bundled third-party licenses, and the
download/install data notice.

## Next Step

Continue with [Quickstart](quickstart.md). Use [Operate](../operate/operator-overview.md)
for host operation and [Develop](../develop/developer-guide.md) for SDK/tutorial workflows.

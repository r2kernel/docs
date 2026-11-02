# Runtime Layout

This page is a path lookup table for installed R2Kernel runtimes. It does not
describe private runtime implementation structure.

Paths are written relative to the selected install prefix, `<prefix>`. The default
prefix is listed in [Installation](../getting-started/installation.md#interactive-install);
custom prefixes use the same shape under the selected installation directory.

## Installed Tree

| Path | Meaning |
| --- | --- |
| `<prefix>/env.sh` | shell environment helper for the installed runtime |
| `<prefix>/runtime/bin` | user-facing CLI entry points |
| `<prefix>/runtime/lib` | native libraries required by the installed SDK/runtime |
| `<prefix>/runtime/config.yaml` | base runtime configuration |
| `<prefix>/runtime/spec` | installed fallback copy of public specs |
| `<prefix>/runtime/frontend` | packaged Web Console assets |
| `<prefix>/sdk/python` | installed Python SDK wheel payloads |
| `<prefix>/sdk/cpp` | installed C++ SDK payload |
| `<prefix>/tutorials` | installed tutorial source and runnable fixtures |
| `<prefix>/licenses` | runtime EULA, open-source notices, and install notices |
| `<prefix>/systemd` | service unit source files linked into the host systemd directory |
| `<prefix>/var` | R2Kernel-owned state, package registry, logs, and service home data |
| `<prefix>/etc` | service identity policy written by service registration |
| `<prefix>/management-tls` | Console HTTPS material (`root:r2kernel`, `0750`) |
| `<prefix>/.r2kernel-prefix` | ownership marker of an R2Kernel prefix |
| `<prefix>/bin/r2kernel-uninstall` | uninstaller for service links and the R2Kernel-managed entries of the prefix |

## Compatibility Links

Installed product bundles expose these convenience paths.

| Path | Target |
| --- | --- |
| `<prefix>/bin` | `<prefix>/runtime/bin` |
| `<prefix>/spec` | `<prefix>/runtime/spec` |
| `<prefix>/config.yaml` | `<prefix>/runtime/config.yaml` |

## Common Commands

| Command | Use |
| --- | --- |
| `r2kernel` | top-level CLI dispatcher |
| `r2kernel-config` | inspect or modify runtime configuration |
| `r2kernel-doctor` | run host and runtime checks |
| `r2kernel-launch` | launch managed subsystem packages |
| `r2kernel-subsystem` | inspect subsystem status, sessions, and lifecycle state |
| `r2kernel-package` | inspect and validate packages |
| `r2kernel-timesync` | inspect or run time-sync helpers |

## Service Names

Product installs into a protected prefix can register these five system services.

| Service | Purpose |
| --- | --- |
| `r2kernel-control.service` | host control backend and Web Console |
| `r2kernel-resourced.service` | resource broker and launch-time resource authority |
| `r2kernel-timesyncd.service` | managed time-sync observation and helper ownership |
| `r2kernel-terminal-login.service` | root-only Terminal local OS login broker, installed with the Control service |
| `r2kernel-https-settings.service` | root-only Console HTTPS settings service, installed with the Control service |

Runtime sockets normally live under `/run/r2kernel`. Product installs prepare that
directory for the `r2kernel` group so non-root SDK processes can use the runtime
boundary without opening arbitrary device or network paths.

## Related Pages

- [Package Layout](package-layout.md)
- [Runtime Configuration](../operate/runtime-configuration.md)
- [CLI Tools](../operate/cli-tools.md)
- [Troubleshooting](../operate/troubleshooting.md)

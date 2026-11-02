# Package Layout

This page describes the public source checkout and the installed runtime
layout.

## Public Source Checkout

The published source surface is split by role.

- `r2kernel` - entry repository with `install.sh`, `r2kernel.repos`, and release
  metadata.
- `r2kernel-sdk` - Python/C++ SDK source, public specs, C ABI headers, guided
  tutorials, runnable transport fixtures, managed package tutorials, and
  tutorial support code.
- `r2kernel-docs` - documentation source for the published docs site.
- published docs site - user-facing documentation.

The public checkout focuses on SDKs, tutorials, specs, and docs.
Runtime implementation binaries are installed through the installer.
`r2kernel-demo` is a separate robotics application demo repository, not a source
tree exported by the core release pipeline.

## Installed Runtime Layout

The published installer places runtime artifacts under the selected prefix,
written here as `<prefix>`.

- `<prefix>/runtime/bin` - user-facing runtime CLIs such as `r2kernel`,
  `r2kernel-control`, `r2kernel-config`, `r2kernel-package`, `r2kernel-launch`,
  `r2kernel-subsystem`, `r2kernel-resourced`, `r2kernel-doctor`, and
  `r2kernel-timesync`.
- `<prefix>/runtime/lib` - native runtime libraries used by the SDKs and
  tutorials.
- `<prefix>/runtime/config.yaml` - installed runtime config.
- `<prefix>/runtime/spec` - installed fallback copy of public specs.
- `<prefix>/runtime/frontend` - packaged Web Console frontend assets, when
  present in the target bundle.
- `<prefix>/sdk/python` - platform-specific Python wheel payloads.
- `<prefix>/sdk/cpp` - installed C++ SDK payload.
- `<prefix>/tutorials` - installed guided tutorial source and runnable tutorial
  fixtures.
- `<prefix>/licenses` - runtime EULA, open-source license documents, third-party
  notices, and download/install data notice.
- `<prefix>/systemd` - R2Kernel service unit sources linked from
  `/etc/systemd/system`.
- `<prefix>/var` - R2Kernel-owned state, logs, and service home directories.
- `<prefix>/var/lib/packages` - managed package registry and unpacked packages for
  product installs. The system service helper prepares this path for the
  non-root `r2kernel-control.service` user.
- `<prefix>/env.sh` - shell helper that exports `R2KERNEL_PREFIX`,
  `R2KERNEL_RUNTIME_ROOT`, `R2KERNEL_SPEC_ROOT`, and related paths.
- `<prefix>/bin/r2kernel-uninstall` - uninstaller for service links and the
  R2Kernel-managed entries of the prefix; the prefix directory is removed only
  when it is empty.

Top-level entry points point into the runtime tree.

- `<prefix>/bin -> <prefix>/runtime/bin`
- `<prefix>/spec -> <prefix>/runtime/spec`
- `<prefix>/config.yaml -> <prefix>/runtime/config.yaml`

## SDK Notes

The Python SDK source package is Apache-2.0 and can be installed from a public
checkout with this command.

```text
python3 -m venv .venv
. .venv/bin/activate
. <prefix>/env.sh
pip install -e sdk/python
```

Python wheel outputs are platform-specific but CPython ABI-independent
(`py3-none-<platform>`). Use the editable source install path above when working
from a public checkout or when the active Python environment needs to build
directly from source.

The installed-user SDK surface is Python and C++. Runtime implementation
languages and internal package layout are not part of the public SDK contract.

## Public Specs

Public loaders resolve specs from external roots first.

- `R2KERNEL_SPEC_PATH`, when set
- `R2KERNEL_SPEC_ROOT`, normally from `<prefix>/env.sh`
- installed fallback roots such as `<prefix>/spec`
- packaged fallback specs inside the Python SDK

This lets users overlay custom YAML specs while keeping the installed public
spec tree available as a fallback.

## Source Boundary

The installed tree is sufficient for normal tutorial use. Public source
checkouts are the editable source surface for SDK changes, demos, specs, and
docs. Runtime binaries are installed through the installer rather than built by
ordinary application users.

## Internal Container Examples

Container examples that rebuild the proprietary runtime require the private
development repository. Those sources are not in the public SDK checkout or installed
tutorial bundle. Follow the [Cleaner Robot Tutorial](../tutorials/tutorial.md)
with an installed runtime for the public workflow.

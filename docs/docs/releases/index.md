# Releases

## Current Release

**R2Kernel™ 1.0.0** is the current release and the first stable release of
R2Kernel. Its [release notes](1.0.0.md) are the complete contract for this
version: supported platforms and SDKs, installation, every change since the
last prerelease, the migration checklist and the known limitations.

## Support Stance

- 1.0.0 is a stable release for functional development and for deployments
  that do not depend on hard-real-time behavior. It is not qualified for
  hard-real-time operation. Timing measurements describe the stated
  conditions only and are not worst-case bounds.
- Runtime bundles target Linux `x86_64` and `aarch64`; the documented
  installation path targets Ubuntu/Debian. Python and C++ are the public
  subsystem-author SDKs.
- Installation is clean-install only. An installation of a prerelease
  (`1.0.0rc*`) must be uninstalled before 1.0.0 is installed; see
  [Clean Installs And Upgrades](../getting-started/installation.md#clean-installs-and-upgrades).
- Upgrade the runtime, the SDKs and every subsystem process together, and every
  host of a federation together. There is no mixed-version fallback.

## Prerelease Archive

The 1.0.0 prereleases (1.0.0rc5 to 1.0.0rc11) are listed under
**Releases → Prerelease archive**. Their notes are kept as published and
describe those prereleases only; their artifacts and tags remain immutable.
They are not support, upgrade or qualification statements for 1.0.0.

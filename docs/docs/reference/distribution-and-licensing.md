# Distribution And Licensing

R2Kernel™ is a project of Librerobotics™ and uses a split distribution model.

- **Entry repository**: installer bootstrap, source-checkout manifest, and
  release metadata
- **SDK repository**: public Python and C++ SDK source, public specs, tutorials,
  tutorial support code, retained transport fixtures, and required public headers
- **Docs site**: published product, integration, operation, and reference
  documentation
- **Distribution service**: installer-consumed runtime and SDK artifacts

The runtime implementation is proprietary and is delivered as a binary release
artifact. Public repositories support SDK development, contract review,
tutorials, and integration. Normal users install the runtime through the entry
repository's installer command.

## License Boundary

The installer and release manifest identify each artifact's license group and
whether explicit acceptance is required.

| Payload | License boundary |
| --- | --- |
| R2Kernel runtime | R2Kernel Runtime License; acceptance required |
| R2Kernel Python and C++ SDKs | Apache-2.0 |
| Public specs, tutorials, demo source, and documentation | Apache-2.0, except identified third-party material |
| Bundled third-party software | license stated in Open Source Notices |
| Download processing | R2Kernel Download Notice |

The runtime license applies to the proprietary runtime payload. It does not
replace the licenses of the SDK or bundled open-source dependencies.

Runtime permissions come only from the Runtime License supplied with the
release and any applicable separate agreement, not from this documentation.
Version 0.2 names LRH Korea Inc. as Licensor and permits no-charge personal and
commercial use and redistribution of unmodified runtime binaries, including
OEM/preinstalled systems, mirrors and offline delivery, subject to its terms.
Distributors must preserve licenses and notices, identify R2Kernel and its
version, and obtain recipient acceptance as specified in the agreement. No
advertising credit or logo display is required. Distributors are responsible
for their own products and commitments. Earlier releases retain their supplied
license terms; this page does not retroactively relicense them. No runtime
source license or future open-source release date is promised.

The agreement selects Republic of Korea substantive law while preserving
mandatory rights. It imposes neither compulsory arbitration nor an exclusive
court. Each party remains responsible for export controls and sanctions
applicable to its own activities; the license is not an export authorization.

Apache-2.0 permissions for the public materials are separate from restrictions
on the proprietary runtime. They are not narrowed merely because the runtime
is proprietary. The R2Kernel and Librerobotics names identify the project;
Apache-2.0 does not grant general trademark rights. The ™ symbol is not a claim
of trademark registration. See the public repository's `TRADEMARKS.md`.

## Installed Payload

A normal Linux installation contains these product surfaces.

- runtime executables and support libraries
- default runtime configuration and public fallback specs
- R2Kernel Console frontend assets
- Linux service helpers
- time-sync and resource-management tools
- Python and C++ SDK payloads
- tutorials and supporting transport fixtures
- license and notice files

The exact file set is versioned in the release manifest. See
[Package Layout](package-layout.md) for the supported installed paths.

## Distribution Service

The installer resolves the requested release through the R2Kernel distribution
service, selects artifacts for the host platform, verifies their checksums, and
installs the selected payloads. A checksum detects changed bytes; it is not, by
itself, proof of publisher identity. A signed download URL is also not an
artifact signature. Artifact storage and verification infrastructure are
implementation details and are not part of the public integration contract.

The current public install flow does not require a user-supplied download token.
An installer may create an installation-session identifier so requests belonging
to one installation attempt can be diagnosed together.
An invalid `version`, `file` or `channel`, including a path segment that is not
valid percent-encoding, is answered with HTTP 400 before any storage read. An
unexpected server error is answered with HTTP 500 without the internal error
message. The distribution service is designed not to record `HEAD`
requests.

The distribution service may record the following operational metadata.

- request time and installation-session identifier
- client IP and standard delivery-network request metadata
- user agent
- requested release, channel, platform, architecture, and artifact
- response status, requested artifact size, and failure reason

An artifact response record is not proof that a download completed, an
installation succeeded, or a runtime is actively used.

It does not collect application source code, subsystem payloads, runtime
messages, robot data, host configuration files, shell history, or unrelated
files from the installing host.

This processing is disclosed in the runtime license review, Download Notice,
and installed license directory.

## Public Repositories

The public source payloads are split by role.

| Repository | Public content |
| --- | --- |
| `r2kernel` | generated release README, installer bootstrap, source-checkout manifest, and release metadata |
| `r2kernel-sdk` | Python and C++ SDK source, public specs, tutorials, tutorial support code, retained transport fixtures, and required public headers |
| `r2kernel-docs` | published documentation source |

`r2kernel-demo` is a separate robotics application demo repository. It is not part
of the core R2Kernel release payload.

The Linux C++ SDK archive may bundle `yaml-cpp` as an internal static dependency
for installed-user tutorials. Its MIT license is included with the release and
installed under `<prefix>/licenses`.

## Source Checkout Manifest

The entry repository carries a `r2kernel.repos` manifest for users who need public
SDK and documentation source checkouts. This manifest is a source synchronization
aid, not the runtime installer.

```yaml
repositories:
  r2kernel-sdk:
    type: git
    url: <sdk-repository-url>
    version: v<version>
  r2kernel-docs:
    type: git
    url: <docs-repository-url>
    version: v<version>
```

Repository URLs are selected when a release is published so the same release
process can target the current forge or a later public forge.

The split exporter generates the entry README from its maintained template and
stamps the configured version, HTTPS download bootstrap, repository URLs, and
documentation site. Publication overlays these generated entry files while
preserving repository-owned policy/assets. Source remediation does not rewrite
a published stable release tag; a prerelease tag and its artifacts change only
through a reviewed replacement of that same prerelease version.

## Release Manifest

`release-manifest.json` is the install-time artifact map. Its `components`
array contains release artifacts, not R2Kernel runtime subsystems.

Important public fields include the following.

- `release_version` and `release_tag`
- `license_groups`
- `publish_channels`
- artifact file names, platforms, and checksums
- default install selection
- repository and documentation locations
- distribution service location

Installers use this metadata to select a compatible payload, present licenses
and notices, install default SDK artifacts, and verify integrity. Consumers
should not infer undocumented distribution infrastructure from manifest URLs.

## Installer Behavior

The installer performs these user-visible actions.

- selects artifacts compatible with the detected platform
- presents the Download Notice, R2Kernel Runtime License, R2Kernel SDK license, and
  Open Source Notices
- requires acceptance where the release manifest marks it as mandatory
- verifies artifact checksums before installation
- installs the selected runtime and SDK payloads under the chosen prefix
- writes `<prefix>/env.sh`
- optionally registers Linux system services and device policy
- installs the uninstaller and records enough release metadata for validation

See [Installation](../getting-started/installation.md) for the supported install
flow. The complete distribution metadata disclosure is included as
`DOWNLOAD_NOTICE.md` in the release source and installed license directory.

## Publication Boundary

Published documentation describes supported behavior, public contracts,
configuration, operational evidence, and interoperability requirements. Build
pipelines, artifact storage topology, signing implementation, release
credentials, and internal deployment procedures are maintained separately and
are not public product contracts.

## Internal Container Examples

Container examples that rebuild the proprietary runtime require the private
development repository. Those sources are not in the public SDK checkout or installed
tutorial bundle. Follow the [Cleaner Robot Tutorial](../tutorials/tutorial.md)
with an installed runtime for the public workflow.

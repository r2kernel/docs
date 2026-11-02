# Operate

Use this section when a R2Kernel runtime is already installed or about to be
installed on a host.

Follow the pages in menu order when you are learning the operating model.

1. [Runtime Configuration](../operate/runtime-configuration.md) introduces the
   installed `config.yaml`, configurable runtime areas, and the surfaces used to
   change them.
2. [CLI Tools](../operate/cli-tools.md) covers the host from SSH, scripts,
   package lifecycle commands, and service diagnostics.
3. [Web Console Manual](../operate/web-console-manual.md) introduces the browser
   operations surface for one host.
4. [Time Sync Operations](../operate/time-sync-operations.md) covers clock
   readiness, sync modes, and timing evidence.
5. [Web and API Security](../operate/web-and-api-security.md) explains browser
   login, API keys, and source-network gates before exposing the host beyond a
   trusted local environment.
6. [Resource Control](../operate/resource-control.md) covers managed package
   admission, resource leases, and launcher-owned execution.
7. [Deployment Checks](../operate/deployment-checks.md) closes the operating path
   with install, security, resource, time-sync, and cross-host readiness checks.
8. [Product Frontend Modes](../operate/product-frontend-modes.md) explains how a
   product can keep Host Control APIs while replacing or disabling the bundled
   Web Console.

For daily operation, start from the Web Console when you have browser access and
from the CLI when the host is only reachable over SSH, when automation is
required, or when service-level diagnostics are needed. Use Runtime
Configuration first when you need to understand why a host behaves differently
from the default install.

Operator pages should stay command-oriented. They link to
[Reference](../reference/reference-overview.md) when protocol fields or implementation
details would interrupt the operating flow.

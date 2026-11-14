# App Network Access

A managed `role: app` package runs in the brokered network sandbox. It cannot
create network sockets itself.

Its outbound TCP connections go through the host's **app uplink**:

1. The app asks the root resource broker for a connection to a host and port.
2. The broker resolves the name, checks every address, and connects.
3. The app receives a connected stream. The broker keeps the TCP connection
   and relays the bytes.

The uplink never reaches the robot's device networks. Inbound traffic to an app
uses its declared frontend listener through the Control proxy (see
[Product Frontend Modes](product-frontend-modes.md)). Federation is separate
and unchanged.

## Modes

The mode is a host setting. A package cannot choose or change it.

| Mode | What apps can do |
| --- | --- |
| `auto` (default) | Connect out through any network interface that no gateway uses. |
| `explicit` | Connect out only through the interfaces you list. |
| `off` | Nothing outbound. Apps still receive traffic through Control. |

The installer asks for the mode when it installs the system services. See
[Choose the mode](#choose-the-mode).

## What an app can never reach

**Device networks.** In every mode, the uplink excludes:

- every interface that a gateway claims for raw link-layer access, for example
  EtherCAT
- every interface that a gateway claims with IP `mode: exclusive`
- every address range that a gateway declares in `device_networks`, or that you
  list in `protected_networks`
- a `shared` or `advisory` gateway interface whose ranges nobody declared. The
  whole interface is excluded, because R2Kernel cannot tell the devices apart
  from the rest of that network.
- every interface stacked on an excluded gateway interface: a VLAN or macvlan
  on it, or a bridge or bond with it as a port

The networks directly connected to any excluded interface are protected too,
through every interface.

Installed gateways protect their networks even while they are stopped. A
gateway claim always wins: when a gateway starts and claims an interface, the
uplink connections on that interface are closed.

One exception: a gateway that chooses its adapter per instance, through a
parameter without a default, protects that adapter only while an instance runs.
Give the parameter a default, or [exclude the
adapter](#keep-traffic-off-an-interface).

**Always blocked**, whatever the configuration:

- loopback (`127.0.0.0/8`, `::1`) and unspecified addresses (`0.0.0.0/8`, `::`)
- every address of this host, on any interface
- link-local addresses (`169.254.0.0/16`, `fe80::/10`), which includes cloud
  metadata services
- multicast and broadcast addresses

IPv4-mapped IPv6 addresses, and the IPv4 address inside NAT64 (`64:ff9b::/96`)
and 6to4 (`2002::/16`) addresses, are checked against the same blocks.

The host's own Control API is blocked on purpose. With the default
configuration it accepts local callers without authentication. Other R2Kernel
hosts stay reachable.

R2Kernel knows device networks only through gateway claims and declarations.
A device network that software outside R2Kernel drives is invisible to it. Keep
app traffic off it with the [exclusion list](#keep-traffic-off-an-interface).

The broker checks the destination the app asked for. NAT rules on the robot
itself that rewrite outgoing destinations, for example on a Kubernetes node, can
redirect an allowed address to this host after the check. Do not enable the
uplink on such hosts, or restrict destinations with the
[allowlist](#restrict-destinations-optional).

## Choose the mode

**At installation:**

- Interactive installs ask "App network access" with three choices:
  - Automatic
  - Select interfaces
  - Off
- After Automatic, the installer lists the detected interfaces and asks which
  ones to exclude.
- Non-interactive installs use these flags. The default is `auto` with no
  exclusions.

```bash
--app-uplink auto|off|<nic>[,<nic>...]
--app-uplink-exclude <nic>[,<nic>...]
```

The variables `R2KERNEL_APP_UPLINK` and `R2KERNEL_APP_UPLINK_EXCLUDE` work the
same way. An upgrade keeps the current setting unless you pass a flag. See the
[installation reference](../reference/installation-reference.md).

**After installation**, change the mode as root, then restart the broker:

```bash
sudo <prefix>/runtime/bin/r2kernel-resourced --set-app-uplink auto
sudo <prefix>/runtime/bin/r2kernel-resourced --set-app-uplink eth0,wlan0
sudo <prefix>/runtime/bin/r2kernel-resourced --set-app-uplink off
sudo systemctl restart r2kernel-resourced
```

In `explicit` mode, a listed interface is used only when the system has a real
route to the destination through it. A reject route (prohibit, blackhole or
unreachable) is final.

A list of interfaces selects `explicit` mode. The command changes only the mode,
the interface list and, with `--app-uplink-exclude`, the exclusion list. Every
other setting is kept.

The setting lives in the root-owned policy `/etc/r2kernel/resource-authority.json`
under `app_uplink`. The [resource authority
reference](../reference/resource-authority.md#app-uplink) lists every field.

## Keep traffic off an interface

`exclude_interfaces` keeps app traffic off interfaces that R2Kernel does not
recognize as device networks. Typical entries:

- a company VPN (`wg0`, `tun0`) that apps must not reach through
- a container bridge (`docker0`) whose services apps must not reach
- a device network driven by software outside R2Kernel

```bash
sudo <prefix>/runtime/bin/r2kernel-resourced --set-app-uplink auto --app-uplink-exclude wg0,docker0
sudo systemctl restart r2kernel-resourced
```

Pass `--app-uplink-exclude ""` to clear the list.

## Protect device ranges on a shared interface

A gateway that shares an interface with ordinary traffic declares its device
ranges:

```yaml
resources:
  network:
    interfaces:
      - name: eth0
        mode: shared
        device_networks: [198.51.100.0/24]
```

The interface then stays usable for apps, except for those ranges. A gateway
with no devices on a shared adapter declares `device_networks: []`; the adapter
then stays fully usable for apps.

You can protect ranges yourself in the policy. An entry with `interface` also
marks that shared interface as covered:

```json
"app_uplink": {
  "mode": "auto",
  "protected_networks": [
    {"interface": "eth0", "networks": ["198.51.100.0/24"]},
    {"networks": ["10.20.0.0/16"]}
  ]
}
```

## Restrict destinations (optional)

`allowed_destinations` limits apps to the destinations you list. When the list
is empty or absent, any destination outside the blocks is allowed.

```json
"app_uplink": {
  "mode": "auto",
  "allowed_destinations": [
    {"host": "api.example.com", "ports": [443]},
    {"host": "*.example.net"},
    {"network": "203.0.113.0/24", "ports": [8001]}
  ]
}
```

- `host` matches the name the app asked for: an exact name, or a `*.` suffix
  that matches subdomains only. It never matches a request that names an IP
  address.
- `network` matches the resolved address: an address or a CIDR range.
- `ports` is optional. Without it, any port is allowed.

The allowlist adds to the device-network protection. It never replaces it.

Edit the policy file as root for protected ranges and the allowlist, then restart
`r2kernel-resourced`.

## Check the state

Control's status reports the uplink under
`resource_service_status.service.app_uplink`:

```bash
curl -s http://127.0.0.1:8001/api/v1/control/status
```

| Field | Meaning |
| --- | --- |
| `configured`, `mode` | Whether the policy has `app_uplink`, and its mode. |
| `available`, `error` | `false` while the broker cannot read the installed gateway declarations, for example when the package store is missing. New connections, and requests not yet handed over, are then refused with `uplink_unavailable`. |
| `eligible_interfaces` | Interfaces apps may use now. |
| `excluded_interfaces` | Excluded interfaces, each with its `reason` and, for a claim, its `package`. |
| `protected_networks` | Protected ranges, with their `source`: `gateway`, `operator` or `excluded_interface`. |
| `allowlist` | Whether `allowed_destinations` is set. |
| `effective_max_connections` | Present when the broker's file-descriptor limit allows fewer connections than `max_connections`. |
| `connections` | Open connections, and closed ones by reason: `lease_ended`, `interface_claimed`, `network_protected`, `interface_removed`, `peer_closed` or `error`. |

Exclusion reasons:

| Reason | Meaning |
| --- | --- |
| `loopback` | The loopback interface. |
| `link_layer_claim` | A gateway claims the interface for raw link-layer access. |
| `exclusive_claim` | A gateway claims the interface with `mode: exclusive`. |
| `claimed_lower_device` | The interface is stacked on a claimed one, named in `lower_device`. |
| `undeclared_shared_claim` | A gateway shares the interface without `device_networks`. |
| `undeclared_advisory_claim` | An advisory gateway uses the interface without `device_networks`. |
| `operator_excluded` | The interface is in `exclude_interfaces`. |
| `not_listed` | `explicit` mode does not list the interface. |
| `not_found` | `explicit` mode lists an interface that does not exist. |

## Open a connection from an app

**Python.** The broker resolves `host`, so pass the name, not an address you
resolved yourself:

```python
from r2kernel.core.resource import ResourceBrokerClient

broker = ResourceBrokerClient()
result = broker.open_uplink_tcp("api.example.com", 443, tls=True)
sock = result.socket          # TLS-wrapped stream
sock.sendall(b"GET /health HTTP/1.1\r\nHost: api.example.com\r\nConnection: close\r\n\r\n")
print(sock.recv(4096))
sock.close()
```

**asyncio.**

```python
reader, writer = await broker.open_uplink_connection("api.example.com", 443, tls=True)
```

**C++.** `open_uplink_tcp(UplinkTcpOptions{...})` returns the connected
descriptor. TLS is left to your library.

The Python and C++ SDK READMEs have complete examples, including
`http.client`, `websockets` and a C++ descriptor example. See also the [SDK
reference](../reference/subsystem-sdk-reference.md).

**Library choice.** A library that creates its own sockets cannot work inside
the sandbox. Use a library that accepts a connected socket or descriptor.

**Timeout.** The default is 10 s. The broker shortens a longer timeout to the
host's `max_connect_timeout_ms`, which defaults to 30 s.

**Names.** The broker resolves names with the system resolver, so `/etc/hosts`,
mDNS and the DNS search list work as for any program. Every resolved address is
checked. An app has at most two name lookups in flight. A lookup that outlives
its timeout still counts until the resolver returns. Requests for IP addresses
never wait behind lookups.

### Errors

| Code | Meaning |
| --- | --- |
| `app_uplink_off` | The host's mode is `off`, or the uplink is not configured. |
| `uplink_role_refused` | Only `role: app` packages may use the uplink. |
| `destination_not_allowed` | An allowlist is set and the destination is not on it. |
| `destination_blocked` | Every address is blocked or only reachable through an excluded interface. The message gives the reason for each address. |
| `uplink_unavailable` | The broker could not determine the device networks. It fails closed. |
| `resolve_failed` | The name did not resolve. |
| `connect_timeout` | The timeout ran out. |
| `connect_failed` | Every connection attempt failed. |
| `uplink_limit` | A connection limit is reached, or the app already has two name lookups in flight. |
| `invalid_request` | The host, port or timeout is malformed. |

## Fleet control

A fleet-control app on a control PC can call the Host API of the robots it
manages through the uplink. Each robot's Control must then be reachable from the
control PC:

- Set `control.api_host` to an address on that network.
- Protect the API as described in [Web and API Security](web-and-api-security.md).

The robots answer through the same connection, so they need no uplink of their
own for this.

## Upgrading from approved streams

Earlier 1.0.0 candidates offered per-execution grants:
`open_approved_tcp_stream`, the `outbound_tcp` policy and a grants file. They
are removed.

- The installer deletes `outbound_tcp` from the policy on upgrade and reports
  it.
- `r2kernel-resourced` refuses to start while the key is still present.
- Apps move to `open_uplink_tcp(host, port)`.

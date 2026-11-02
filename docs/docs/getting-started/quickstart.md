# Quickstart

Use this page for the first run after installing R2Kernel. The goal is simple.
confirm the installed runtime, prepare your Python environment, open the local
Web Console, and choose the next path.

## 1. Install R2Kernel

Complete [Installation](installation.md) first.

The commands below write the install prefix as `<prefix>`; the default prefix is
listed in [Installation](installation.md#interactive-install). Install output
includes the following.

- runtime under `<prefix>/runtime`
- SDK payloads under `<prefix>/sdk`
- tutorials under `<prefix>/tutorials`
- license and notice documents under `<prefix>/licenses`

Source the installed environment helper in each shell that will run R2Kernel
commands.

```text
. <prefix>/env.sh
```

## 2. Check Python SDK Availability

Ubuntu / Debian.

```text
sudo apt update
sudo apt install -y python3-venv python3-pip
```

The installer prepares a versioned Python environment under
`<prefix>/sdk/python/environments`, selected through `sdk/python/current`.
After sourcing `env.sh`, installed tutorials use this interpreter and SDK;
managed package launches use the install-managed interpreter independently
of a development shell's activated virtual environment, unless a package
explicitly configures another interpreter.

```text
. <prefix>/env.sh
python3 -c 'import r2kernel; print("R2Kernel Python SDK ready")'
```

Use a separate virtual environment only for an isolated development shell.
Source `env.sh` **before** activating it: sourcing again afterwards can put the
managed interpreter ahead of the development interpreter. The explicit host
Python below avoids creating a development environment through the managed one.

```text
. <prefix>/env.sh
unset PYTHONPATH
/usr/bin/python3 -m venv r2kernel-quickstart
. r2kernel-quickstart/bin/activate
python -m pip install <prefix>/sdk/python/r2kernel_client-*.whl
```

`unset PYTHONPATH` removes the installed SDK path injected by `env.sh` so the
development interpreter imports its own installed wheel; add any unrelated
custom import paths explicitly afterwards. Activation changes shell `python`,
not `R2KERNEL_PYTHON` or managed package launch policy.

You do not need an SDK source checkout for normal installed tutorial runs.

## 3. Check The Control Backend

If `r2kernel-control.service` was installed.

```text
sudo systemctl status r2kernel-control.service --no-pager
```

The important line is `Active: active (running)`. The service uses
`<prefix>/runtime/config.yaml` by default. A new installation serves the
bundled Web Console on HTTP port `18080` and the HTTP API on port `8001`.

Check readiness.

```text
curl -sf http://127.0.0.1:8001/api/v1/ready
```

Open the local Web Console.

```text
http://127.0.0.1:18080/
```

HTTPS Console defaults to port `18443` when enabled. Explicitly configured
ports, including `ui_port: 0` API sharing, are preserved. Missing Console port
values use these defaults.

If your browser is running on a different machine, replace `127.0.0.1` with the
runtime host address. Do this only on a trusted network or after enabling Web/API
security.

If `systemctl status` also shows `pmc ... bind failed: Permission denied`
line, that message is from linuxptp time-sync telemetry, not from the Web
Console itself. Check the dedicated time-sync service separately.

```text
sudo systemctl status r2kernel-timesyncd.service --no-pager
r2kernel timesync doctor
```

## 4. If Services Were Skipped

Some tutorial and package flows require the resource service. If installation
skipped system services, register them before running managed packages.

```text
sudo <prefix>/bin/r2kernel system install \
  --prefix <prefix>
```

For cross-host or site-specific configs.

```text
sudo <prefix>/bin/r2kernel system install \
  --prefix <prefix> \
  --config /path/to/config.yaml
```

For time-sync details, use [Time Sync Operations](../operate/time-sync-operations.md).

## 5. Continue

After the first install check, continue in this order. Tutorial checks are
covered on the pages that use them.

1. [Operate](../operate/operator-overview.md) - service status, Web Console,
   resource control, time sync, security, and deployment checks.
2. [Develop](../develop/developer-guide.md) - the cleaner robot tutorial and
   subsystem/package development workflow.

Clone source repositories only when you need editable source work.

- clone `r2kernel-sdk` for editable SDK development or source-level SDK tests
- use the entry repository's `r2kernel.repos` manifest when you need the matching
  SDK and docs source workspace
- clone `r2kernel-demo` separately when you want complete robotics application
  demos

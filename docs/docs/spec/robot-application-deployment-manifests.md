# Robot/Application/Deployment Manifests

This page defines the manifest shape used to compose one robot application.

## Subsystem Role

Every subsystem manifest declares exactly one role.

```yaml
kind: r2kernel.subsystem
version: 1

subsystem:
  name: component.motion
  role: component
```

Supported roles are these.

- `app`
- `component`
- `gateway`
- `compound`

Robot slots normally identify functional `component` and `gateway` providers.
Composition-only compound instances are attached by the deployment without a
functional slot, as is the application subsystem.

## Robot Manifest

`r2kernel.robot.yaml` describes the app-less platform, including parts and
slots. The file name keeps the top-level robot vocabulary, but the
thing it contributes to `robot = platform + application + deployment` is the
platform definition.

Concrete frame topology is not duplicated here. Component specs declare spatial
conformance, concrete subsystem manifests map ports to local frames, and a
compound subsystem declares mounts between bound ports. The runtime validates
and composes that data into the frame graph.

```yaml
kind: r2kernel.robot
version: 1

robot:
  name: cleaner_2d
  model: tutorial-cleaner-2d
  profiles:
    - tutorial.robot_cleaner.cleaner_2d.v1

parts:
  base:
    kind: mobile_base
  device_bus:
    kind: simulated_device_bus
  incinerator:
    kind: incinerator

slots:
  mobile_base_controller:
    role: component
    part: base
    contract: component.mobile_base.v1
  actuator_gateway:
    role: gateway
    part: device_bus
    contract: api.actuator.servo.v1
  incinerator_component:
    role: component
    part: incinerator
```

`robot.profiles` is the manifest field for optional platform compatibility
labels. These labels are useful when an application intentionally targets a
specific robot family. They are labels, not spec profiles. `slots` describe
which component and gateway contracts must be filled, and which
subsystem role will fill each slot. Slot contracts must be public R2Kernel spec
contracts from the installed dictionary.

- component slots normally use `component.*`
- gateway slots use `api.*`
- a composition-only compound is a managed deployment instance without a slot

Tutorial/private contracts are allowed inside subsystem bindings only; they
cannot define robot slots.

The `parts` section gives slots a platform-level identity. It is not the source
of runtime transforms. See [Spatial Model And Frame
Graph](../concepts/spatial-model.md) for the executable topology model. The
application-facing contract surface is declared by `exports` on the compound
subsystem instead of being duplicated in the robot manifest.

Platform-specific semantic adapters are component subsystems. The cleaner's
trigger actuator is one example. Task sequencing across perception,
navigation, manipulation, and disposal remains application logic, while the
compound declares physical composition and API exports.

## Application Role Subsystem

An application is a subsystem. Its `subsystem.yaml` uses `subsystem.role: app`
and may include `application.requires_robot` for optional platform compatibility
labels. Its concrete contract needs are ordinary `requires` entries using
exported `api.*` contracts.

```yaml
kind: r2kernel.subsystem
version: 1

subsystem:
  name: app.pick_place
  role: app

application:
  requires_robot:
    profiles:
      - r2kernel.robot.manipulator_pick_place.v1

requires:
  manipulation:
    contract: api.motion.articulated.trajectory.v1

provides:
  app_status:
    contract: product.pick_place.app_status.v1
    visibility: internal
```

The application does not choose a vendor-specific controller. It declares the
APIs it needs, optionally constrains the platform compatibility labels, then
consumes the platform through normal subsystem `requires` bindings to compound
exports.
R2Kernel does not impose one universal application-control API. Runtime lifecycle
commands start, pause, stop, and terminate the app subsystem itself. Product
commands and status belong to a package-specific public or internal API, or to a
managed package frontend endpoint.
App-specific behavior files are implementation details; R2Kernel does not require
a scenario manifest.

## Deployment Manifest

`r2kernel.deployment.yaml` describes a desired runtime composition. It can be a
partial subsystem composition, an app-less platform bring-up, or a full robot
application deployment.

```yaml
kind: r2kernel.deployment
version: 1

robot: ./r2kernel.robot.yaml
application: ./app/subsystem.yaml

instances:
  app.cleaner:
    package: ./packages/cleaner_app
    launch: managed
  compound.robot:
    package: ./packages/compound
    launch: managed
  component.incinerator:
    package: ./packages/incinerator
    slots:
      incinerator_component: trash_disposal
    launch: managed
  gateway.arm:
    package: ./packages/sim_arm_gateway
    slots:
      arm_gateway: arm
    launch: managed

bindings:
  app.cleaner.trash_disposal:
    to: compound.robot.trash_disposal
  compound.robot.incinerator:
    to: component.incinerator.incinerator
```

Top-level fields.

| Field | Required | Meaning |
| --- | --- | --- |
| `kind` | yes | Must be `r2kernel.deployment`. |
| `version` | yes | Deployment manifest schema version. |
| `robot` | no | Robot manifest. When present, platform slot validation is enabled. |
| `application` | no | App-role subsystem manifest selected as the top-level app. When present, `robot` must also be present and the app's platform labels and API bindings are checked. |
| `instances` | yes | Concrete subsystem instances to validate, launch, or observe. Application, component, gateway, and compound subsystems all appear here. |
| `bindings` | yes | Wiring from each required interface to the selected provider interface. |

Deployment levels.

| Level | `robot` | `application` | Meaning |
| --- | --- | --- | --- |
| Subsystem composition | absent | absent | Partial subsystem set for development, tutorial stages, or binding checks. It can launch packages and validate subsystem bindings, but it is not robot validation. |
| Platform bring-up | present | absent | App-less platform. Robot slots, slot contracts, compound exports, and subsystem bindings are validated. This is useful for hardware or simulation bring-up before an app is attached. |
| Full robot application | present | present | One application is mapped onto one compatible platform. App requirements, robot slots, compound exports, instances, and bindings are all validated. |

`instances` and top-level `application` intentionally have different jobs. An
application subsystem must appear in `instances` when it should run. The
top-level `application` field marks that same subsystem as the selected app for
robot compatibility validation. Without the top-level field, a deployment can
still launch a process named `app.*`, but R2Kernel will not know that it should
validate that app's robot requirements against the robot manifest.

Instance fields.

| Field | Meaning |
| --- | --- |
| `manifest` | direct subsystem manifest path for validation-only or external instances |
| `package` | package directory containing `package.yaml`; required for managed `deploy up` |
| `slots` | mapping from robot slot name to the public provided interface name on this instance |
| `launch` | `managed`, `external`, or `federated` |
| `host` | optional host hint for federated deployments |
| `params` | string parameters for package or subsystem specialization |

One subsystem instance can satisfy multiple robot slots when it provides
multiple public R2Kernel spec interfaces. A Gateway may fill multiple slots
only through public Control endpoints. In the tutorial, the device Gateway
fills actuator, timed-output, radar, and GNSS source slots. Components adapt
the internal digital-I/O Controls while preserving their application-facing
Procedures and Events. These internal bindings are not robot slots.

Validation rules.

- if `application` is present, `robot` must also be present
- `application` must point at an `app` role subsystem
- deployment must include the referenced application subsystem as an instance or subsystem
- if `robot` is present, all required robot slots must be filled
- if `robot` is present, non-app instances with `slots` must reference known robot slots
- if `robot` is present, managed non-app robot instances must be assigned to a robot slot
- if `robot` is present, instance role must match slot role
- if `robot` is present, robot slot contracts must reference public R2Kernel specs
- if `robot` is present, each `slots` value must name a public interface on that instance, and that interface contract must match the robot slot contract
- if `application` is present, application-required platform compatibility labels must be provided by the robot manifest when the app declares `profiles` constraints
- app API requirements must bind to matching provided interfaces or compound exports
- compound exports must select APIs present in the source component's `conformance_apis`
- all required subsystem bindings must exist
- binding source and target contracts must match

## CLI

```text
r2kernel deploy validate ./r2kernel.deployment.yaml
r2kernel deploy plan ./r2kernel.deployment.yaml
r2kernel deploy plan ./r2kernel.deployment.yaml --json
r2kernel deploy up ./r2kernel.deployment.yaml
r2kernel deploy restart ./r2kernel.deployment.yaml
r2kernel deploy status ./r2kernel.deployment.yaml
r2kernel deploy down ./r2kernel.deployment.yaml
```

`validate` prints a short success message. `plan` also prints the concrete
instances, roles, slots, and launch modes. `--json` returns the same data in a
machine-readable form for CI and release scripts.

`up` reconciles the desired deployment with the current runtime state.

- missing `managed` instances are launched through `r2kernel-resourced`
- active local managed instances are kept only when the resource-service lease
  matches the package, manifest, instance, resolved parameters, runtime directory
  and frontend settings
- stale state is cleaned only after its local managed lease proves ownership
  and stop succeeds; cleanup is conditional on the observed session so a newer
  registration is not removed
- active owned managed instances are replaced only with `--replace`; same-name
  unmanaged or federated registrations are refused, not adopted
- `external` instances are checked but not started
- `federated` instances are skipped by the local host

`restart` is the explicit replacement form of `up --replace`. It is useful when
you want the deployment manifest to remain the source of truth but still force
all active managed instances in that manifest through a stop, cleanup, and
launch cycle.

A failed or unconfirmed stop prevents subsequent cleanup and launch. Deployment
reconciliation does not turn an ambiguous termination into permission to start
a second instance.
Missing-lease or ambiguous state also refuses reconciliation, including for a
stale registration; operator review is required instead of name-based adoption.

`down` stops only `managed` instances owned by the local runtime. It does not
terminate `external` or `federated` processes.

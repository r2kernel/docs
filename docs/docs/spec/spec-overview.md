# Spec

| Concept | Meaning | Repository path |
|---|---|---|
| `message` | typed payload schema | `spec/messages` |
| `API contract` | one endpoint-level API contract for one semantic namespace | `spec/apis` |
| `component` | compatibility bundle for component-role subsystems, composed from APIs plus explicit spatial conformance | `spec/components` |
| `compound export` | declarative app-facing projection of one component conformance API | subsystem `exports` |
| `robot manifest` | reusable platform declaration: parts and component/gateway slots | `tutorials/robot/r2kernel.robot.yaml` |
| `application` | app-role subsystem requirements for exported APIs | `tutorials/subsystems/app.cleaner.teleop/subsystem.yaml` |

- `message` is the data layer
- the primitive spec families are `message`, `API contract`, and `component`
- `API contract` means one namespace-aligned endpoint contract
- one API contract may declare multiple Event, Control, Procedure, and Operation surfaces
- `component` means a recognizable component-role subsystem contract composed from one or more API contracts
- `gateway` subsystems provide `api.*` contracts directly because they own device boundaries for physical hardware or simulator-backed devices
- `compound` subsystems declare physical/spatial composition and selected API exports without behavior endpoints
- `robot manifest` composes functional gateway and component slots into one reusable platform target
- subsystem spatial ports and compound mounts form the runtime frame graph; the robot manifest does not duplicate that topology
- `application` maps a top-level app subsystem onto a robot whose compound exports satisfy the app API requirements
- `message` and `API contract` should follow the same semantic namespace axis
- `defaults.yaml` stores the default namespace-version map

Terminology note. `subsystem` is the R2Kernel runtime unit. `component.*` is not a
synonym for subsystem; it is the public compatibility namespace for
component-role subsystems only. Message and API namespaces use direct semantic
domains such as `msg.motion.*`, `api.locomotion.*`, and `api.sensor.*`.
Compound exports retain the underlying `api.*` contract id; an alias does not
create a new contract family.

The runtime marks a contract as standard only when its canonical reference is
registered in the built-in R2Kernel spec dictionary. Unqualified IDs
(`msg.<domain>.*`, `api.<domain>.*`, `component.<name>.*`) are reserved for
that standard dictionary; vendors and products use their own segment,
`<kind>.<vendor>.*`, for example `api.acme.gripper.v1`. Package-local names and
aliases are displayed as non-standard and do not acquire standard status from
their spelling alone.

Transport timing is runtime metadata. Event delivery exposes observation,
publication, and reception times. Control delivery exposes command generation,
sending, scheduling, validity, dispatch, sampling, completion, response, and
lateness. These fields are not duplicated across ordinary payload messages.

- [Message Index](message-index.md)
- [API Contract Model](api-contract-model.md)
- [API Contract Reference](api-contract-reference.md)
- [Components](components.md)
- [Robot/Application/Deployment Manifests](robot-application-deployment-manifests.md)
- [Domain Coverage](domain-coverage.md)
- [Versioning and Resolution](versioning-resolution.md)

# Endpoint Shape

`interface` is no longer the primary public layer of the spec.

The public reading rule is this.

1. `message`
2. `API contract`
3. `component` for component-role compatibility
4. compound `exports` to select component APIs for applications

Apps require `api.*` directly.

An API contract needs an internal endpoint shape. This page describes that
shape.

## Endpoint Kinds

| Endpoint kind | Meaning |
|---|---|
| `event` | publish or subscribe data surface |
| `control` | periodic request/response endpoint |
| `procedure` | bounded request / response operation |
| `operation` | long-running operation with feedback, result, and state |

## Contract Fields

Every endpoint kind should be read with the same contract frame.

| Field | Used by |
|---|---|
| `request / args` | `control`, `procedure`, `operation` |
| `response` | `control`, `procedure` |
| `feedback` | `operation` |
| `result` | `operation` |
| `state` | `operation`, and sometimes a parallel `event` surface |

## API Contract Reading Rule

An API contract is not a single method.

An API contract is one endpoint contract for one semantic namespace, and it may contain the following.

- several `event` surfaces
- several `control` surfaces
- several `procedure` surfaces
- several `operation` surfaces

That is why the public spec treats `API contract` as the main API layer instead of keeping `interface` as a separate first-class catalog.

## Example Shape

For example, a manipulator-motion API contract should be read as follows.

- namespace: `api.motion.manipulator.*`
- messages: `msg.motion.manipulator.*`
- surfaces:
  - `operation`: `move_l`, `move_c`
  - `event`: `tool_pose`, `motion_state`
  - `procedure`: `set_tcp`, `set_payload`

Similarly, an articulated-motion API contract should be read as follows.

- namespace: `api.motion.articulated.*`
- messages: `msg.motion.articulated.*`
- surfaces:
  - `operation`: `move_j`
  - `event`: `joint_state`
  - `procedure`: `stop`, `pause`, `resume`

## Repository Status

- files under `spec/apis` define endpoint-level API contracts
- files under `spec/components` define public components composed from API contracts
- the public reading model is `message -> API contract -> component` for
  component providers; apps consume selected `api.*` contracts through compound
  exports

For the conceptual API contract model, see [API Contract Model](api-contract-model.md). For the namespace-by-namespace contract layout, see [API Contract Reference](api-contract-reference.md).

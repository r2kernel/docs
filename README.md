# R2Kernel Docs

This repository contains R2Kernel documentation source for release `v1.0.0`.

For documentation feedback and usage questions, use the shared R2Kernel issue
tracker linked in [CONTRIBUTING.md](CONTRIBUTING.md).

Reviewed documentation URL:

```text
https://docs.r2kernel.org/
```

Local preview:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m mkdocs serve -f docs/mkdocs.yml
```

Static build:

```bash
python -m mkdocs build -f docs/mkdocs.yml --strict --clean --site-dir "$PWD/site"
python tools/check_rendered_links.py site
```

GitHub Pages deployment is disabled until the repository variable
`RELEASE_PUBLICATION_APPROVED` is set to `true` after release review. Configure the
`github-pages` environment with required reviewers and allowed deployment refs.
Set that protected environment's `DOCS_DEPLOY_REPOSITORY` to the reviewed
`owner/repository` and `DOCS_SITE_URL` to the exact HTTPS hosting URL.
Deployment runs on a `v*` tag push or manual dispatch at that tag. The
tag must equal `extra.r2kernel_version` in `docs/mkdocs.yml`. Configure
repository variables `DOCS_DEPLOY_REPOSITORY` and `DOCS_SITE_URL` for
tag builds; manual inputs may supply the same reviewed values.
The successful strict build and rendered-link audit produce a destination-bound
inventory inside the uploaded Pages artifact. Deployment validates that exact
artifact, the protected environment identity and the actual Pages configuration
before submitting it without rebuilding. Backend completion is not live-host
content verification; read back the public site separately.
Pull requests build without publication credentials.

The source of the workflow
and dependencies is the internal release exporter; exported repo edits must be
carried back to that source before the next product export.

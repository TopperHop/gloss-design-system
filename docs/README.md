# Documentation

This directory is the source for the GitHub Pages Jekyll site.

`button.md` is generated from the UIkit site submodule. Do not edit generated
documentation directly; use `npm run sync:uikit-docs` after changing the
selected pages in `scripts/uikit-docs.json`.

To prepare the docs directory for local Jekyll development, run:

```sh
npm run build:docs
```

This synchronizes the selected documentation, compiles Gloss CSS, and copies
the generated stylesheet into the Jekyll asset directory. The copied CSS is a
build artifact and should not be edited or committed.

Layouts live in `_layouts/`, while documentation-only styles live in
`assets/css/`. The compiled Gloss stylesheet will be added to the published
site by the documentation deployment workflow.

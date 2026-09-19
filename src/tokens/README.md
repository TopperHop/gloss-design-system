# Tokens

Tokens are the named design decisions that Gloss components consume: colors,
spacing, typography, borders, and similar values. They are not component
styles.

Gloss will keep tokens in a portable, DTCG-compatible JSON format. CSS custom
properties generated from those files will be the runtime interface used by
components and by sub-brand themes.

The example in [`examples/color.theme.example.json`](examples/color.theme.example.json)
shows the required DTCG 2025.10 syntax. It is documentation only and is not
loaded into the build.

## Layers

The token system will use three deliberately small layers:

1. **Base tokens** are raw, reusable values, such as a neutral color scale or
   a spacing step. They do not describe a UI purpose.
2. **Role tokens** describe a purpose in the interface, such as `color.primary`,
   `color.text`, or `color.surface`. Components should use roles rather than
   raw values.
3. **Theme overrides** change role tokens for a sub-brand. The initial themes
   are U of U Health (the default), Huntsman Cancer Institute, HMHI, and SafeUT.

At runtime, one compiled stylesheet will include all supported theme selectors.
For example, `.gls-theme-huntsman` will override the relevant CSS custom
properties while its descendants continue to use the same component CSS.

Each theme will supply only the role tokens it changes. The token build will
resolve the shared tokens once for the default theme and again for each
sub-brand theme, producing a base `:root` declaration plus narrowly scoped
theme overrides.

## Files and commands

Production token files will live in these directories:

```text
src/tokens/source/
  base/                 Raw shared values
  default/              Default U of U Health role tokens
  themes/
    huntsman/           Huntsman role overrides
    hmhi/               HMHI role overrides
    safeut/             SafeUT role overrides
```

Directories without token files are valid while v3 is being designed. The
dependency-free generator reads those files, writes
`src/styles/_tokens.scss`, and supports two commands:

```sh
npm run build:tokens    # Regenerate the Sass token layer
npm run check:tokens    # Fail if that generated file is stale
```

The generator currently accepts color tokens only. It requires a theme to
override an existing default token; themes cannot create one-off token names.

## Boundaries

- JSON is the portable source format. It should remain understandable without
  a particular vendor tool.
- Generated CSS is an implementation artifact, not a second token source.
- Sass may assemble generated CSS and configure UIkit, but Sass variables are
  not the runtime theming API.
- Component-specific tokens are allowed only when a shared role cannot express
  the need. They should be added deliberately rather than copied from a
  component's declarations.

The first implementation will cover colors only. Typography, spacing, and
other token categories will be added once their v3 requirements are clear.

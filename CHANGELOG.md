# Change Log

All _notable_ changes will be documented in this file.

## 1.1.0 - 2024-10-30

### Changes

- Add new `frame()` method
- Add new `vanityName()` method (thanks @Isissss!)
- Allow specifying `baseUrl` in builder typings (thanks @ryami333!)
- Allow resetting format through `.format(undefined)` (thanks @selbekk!)

## 1.0.2 - 2023-01-18

### Changes

- Support upcoming `@sanity/client@5`

## 1.0.1 - 2021-09-01

### Changes

- Drop the `dpr` parameter if it has the default value (`1`)

## 1.0.0 - 2021-09-01

### BREAKING

- Throw error when passing invalid source instead of returning `null`

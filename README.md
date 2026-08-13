# OpenChord Admin

[![CI](https://github.com/open-chord/admin/actions/workflows/ci.yml/badge.svg)](https://github.com/open-chord/admin/actions/workflows/ci.yml)

React and TypeScript catalog studio for OpenChord.

The smart album importer accepts a complete music folder, reads its embedded metadata,
flags inconsistencies, lets the user review the proposed track list and asks the server
to convert lossless sources to ALAC before catalog insertion.

The OpenChord Archive workspace exports the complete library or one self-contained
playlist and restores validated `.openchord` draft `0.1` archives.

```sh
npm ci
npm run dev
```

Vite serves the UI at `http://localhost:5173/admin/` and proxies API requests to
the Spring server at `http://localhost:8080`.

The production Docker image builds the app with Node and serves only the static
result through Nginx. The root Compose project exposes the complete system at
`http://localhost:8080/admin/`.

## Quality checks

```sh
npm run lint
npm test
npm run test:coverage
npm run build
```

Pull requests run lint, the Vitest suite with coverage thresholds, and a production
build in GitHub Actions. `npm run check` executes the same checks locally.

# OpenChord Admin

OpenChord Studio manages a self-hosted OpenChord library. Alongside individual
track and album import workflows, the **OpenChord Archive** section supports:

- one-click streaming export of the complete library;
- self-contained export of a selected playlist;
- validated import of `.openchord` draft `0.1` archives;
- a committed import summary with imported and skipped entity counts.

Archive bytes are downloaded directly by the browser rather than buffered in
application state.

React and TypeScript catalog studio for OpenChord.

The smart album importer accepts a complete music folder, reads its embedded metadata,
flags inconsistencies, lets the user review the proposed track list and asks the server
to convert lossless sources to ALAC before catalog insertion.

```sh
npm install
npm run dev
```

Vite serves the UI at `http://localhost:5173/admin/` and proxies API requests to
the Spring server at `http://localhost:8080`.

The production Docker image builds the app with Node and serves only the static
result through Nginx. The root Compose project exposes the complete system at
`http://localhost:8080/admin/`.

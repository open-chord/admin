# OpenChord Admin

React and TypeScript catalog studio for OpenChord.

```sh
npm install
npm run dev
```

Vite serves the UI at `http://localhost:5173/admin/` and proxies API requests to
the Spring server at `http://localhost:8080`.

The production Docker image builds the app with Node and serves only the static
result through Nginx. The root Compose project exposes the complete system at
`http://localhost:8080/admin/`.

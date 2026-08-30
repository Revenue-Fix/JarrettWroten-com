# Portfolio engine maintenance

The homepage and `/work/` currently use the same passage behavior in two route-specific forms. The homepage controller and stylesheet are prefixed so they can coexist with the process journey; the standalone Work route keeps its approved inline consumer.

Consolidating them during the launch correction would replace two already-rendered consumers at once and increase regression risk. That refactor is deferred. `release-candidate-test.mjs` compares their motion map, mobile stops, readiness functions, complete-plate framing, media lifecycle, and copy/status contract so drift fails before release.

Run:

```text
npm test
npm run test:browser
```

When the engines are consolidated, preserve route-specific asset bases, the homepage terminal-to-Process boundary, the standalone `../#process-journey` destination, and both desktop/mobile rendered contracts.

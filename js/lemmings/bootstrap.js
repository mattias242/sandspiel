// The game graph contains wasm, so it has to be imported asynchronously.
import("./index.js").catch((e) =>
  console.error("Error importing lemmings `index.js`:", e)
);

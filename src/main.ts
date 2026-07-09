import "./style.css";
import { App } from "./app";
import { installFavicon } from "./favicon";

/**
 * Boots Scenario Loom: installs the generated favicon and mounts the app into
 * #app. A missing mount point fails loudly in the console rather than silently
 * rendering nothing.
 */
function main(): void {
  installFavicon();
  const root = document.getElementById("app");
  if (!root) {
    throw new Error("#app mount point not found");
  }
  new App(root);
}

main();

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const appDir = path.join(process.cwd(), "app");
const routeFileNames = new Set(["page.tsx", "route.ts"]);

describe("route topology", () => {
  it("keeps public auth and admin URL roots in a single physical segment", () => {
    const ownersByUrlRoot = getOwnersByUrlRoot(["auth", "admin"]);

    for (const urlRoot of ["auth", "admin"]) {
      assert.deepEqual(
        ownersByUrlRoot.get(urlRoot)?.toSorted(),
        [urlRoot],
        `/${urlRoot} routes must not be split across top-level route groups`,
      );
    }
  });

  it("keeps onboarding in the client pre-panel area", () => {
    assertPathExists("app/(client)/onboarding/page.tsx");
    assertPathExists("app/(client)/(panel)/layout.tsx");
    assertPathMissing("app/(auth)");
    assertPathMissing("app/(client)/layout.tsx");
  });

  it("protects onboarding at the proxy boundary", () => {
    const middleware = readFileSync(path.join(process.cwd(), "lib/middleware.ts"), "utf8");

    assert.match(
      middleware,
      /protectedPrefixes\s*=\s*\[[\s\S]*['"]\/onboarding['"]/,
      "/onboarding should require an authenticated session in proxy",
    );
    assert.doesNotMatch(
      middleware,
      /publicPaths\s*=\s*new Set\(\[[\s\S]*['"]\/onboarding['"]/,
      "/onboarding should not be listed as a public auth route",
    );
  });
});

function assertPathExists(relativePath) {
  assert.equal(
    existsSync(path.join(process.cwd(), relativePath)),
    true,
    `${relativePath} should exist`,
  );
}

function assertPathMissing(relativePath) {
  assert.equal(
    existsSync(path.join(process.cwd(), relativePath)),
    false,
    `${relativePath} should not exist`,
  );
}

function getOwnersByUrlRoot(urlRoots) {
  const watchedRoots = new Set(urlRoots);
  const ownersByUrlRoot = new Map();

  for (const routeFile of listRouteFiles(appDir)) {
    const relativeParts = path.relative(appDir, routeFile).split(path.sep);
    const routeParts = relativeParts.slice(0, -1);
    const urlRoot = routeParts.find((part) => !isRouteGroup(part));

    if (!urlRoot || !watchedRoots.has(urlRoot)) {
      continue;
    }

    const ownerIndex = routeParts.indexOf(urlRoot);
    const owner = routeParts.slice(0, ownerIndex + 1).join("/");
    const owners = ownersByUrlRoot.get(urlRoot) ?? [];

    if (!owners.includes(owner)) {
      owners.push(owner);
      ownersByUrlRoot.set(urlRoot, owners);
    }
  }

  return ownersByUrlRoot;
}

function listRouteFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);

    if (statSync(fullPath).isDirectory()) {
      files.push(...listRouteFiles(fullPath));
      continue;
    }

    if (routeFileNames.has(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isRouteGroup(segment) {
  return segment.startsWith("(") && segment.endsWith(")");
}

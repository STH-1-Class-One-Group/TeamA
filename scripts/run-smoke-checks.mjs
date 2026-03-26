const baseUrl = (process.env.SMOKE_BASE_URL || "https://daejeon.jamissue.com").replace(/\/$/, "");
const apiBaseUrl = (process.env.SMOKE_API_BASE_URL || "https://api.daejeon.jamissue.com").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
const deployWaitMs = Number(process.env.SMOKE_DEPLOY_WAIT_MS || 0);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(`${label} timed out after ${timeoutMs}ms`), timeoutMs);
  return Promise.resolve()
    .then(() => promise(controller.signal))
    .finally(() => clearTimeout(timer));
}

async function fetchText(url, init = {}) {
  return withTimeout(
    async (signal) => {
      const response = await fetch(url, {
        redirect: "manual",
        ...init,
        signal,
      });
      const text = await response.text();
      return { response, text };
    },
    url,
  );
}

async function fetchJson(url, init = {}) {
  const { response, text } = await fetchText(url, init);
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new Error(`${url} returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { response, json, text };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runCheck(name, fn) {
  const startedAt = Date.now();
  try {
    await fn();
    return {
      name,
      ok: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  if (deployWaitMs > 0) {
    console.log(`[smoke] waiting ${deployWaitMs}ms before checks...`);
    await sleep(deployWaitMs);
  }

  const checks = [
    runCheck("frontend-root", async () => {
      const { response, text } = await fetchText(`${baseUrl}/`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(/<div id="root"><\/div>/i.test(text), "root mount node is missing");
    }),
    runCheck("frontend-app-config", async () => {
      const { response, text } = await fetchText(`${baseUrl}/app-config.js`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(text.includes("window.__JAMISSUE_CONFIG__"), "runtime config bootstrap is missing");
      assert(text.includes('"apiBaseUrl"'), "apiBaseUrl is missing from runtime config");
    }),
    runCheck("api-health", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/health`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(json?.status === "ok", "health status is not ok");
    }),
    runCheck("api-auth-providers", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/auth/providers`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json), "providers response is not an array");
      assert(json.some((provider) => provider?.key === "naver"), "naver provider is missing");
    }),
    runCheck("api-map-bootstrap", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/map-bootstrap`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json?.places), "places array is missing");
      assert(Array.isArray(json?.stamps?.logs), "stamps.logs array is missing");
    }),
    runCheck("api-review-feed", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/review-feed?limit=1`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json?.items), "review feed items array is missing");
      assert(Object.prototype.hasOwnProperty.call(json ?? {}, "nextCursor"), "review feed nextCursor is missing");
    }),
    runCheck("api-community-routes", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/community-routes`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json), "community routes response is not an array");
    }),
    runCheck("api-festivals", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/festivals`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json), "festivals response is not an array");
    }),
    runCheck("api-my-summary-unauthorized", async () => {
      const { response, json, text } = await fetchJson(`${apiBaseUrl}/api/my/summary`);
      assert(response.status === 401, `expected 401, received ${response.status}`);
      assert(Boolean(json?.detail || text), "unauthorized response detail is missing");
    }),
  ];

  const results = await Promise.all(checks);
  const failed = results.filter((result) => !result.ok);

  console.log(JSON.stringify({
    baseUrl,
    apiBaseUrl,
    checkedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    results,
  }, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[smoke] fatal error", error);
  process.exitCode = 1;
});

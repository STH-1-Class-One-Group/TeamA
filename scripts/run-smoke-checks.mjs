const DEFAULT_BASE_URL = "https://daejeon.jamissue.com";
const DEFAULT_API_BASE_URL = "https://api.daejeon.jamissue.com";
const DEFAULT_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const baseUrl = (process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const configuredApiBaseUrl = (process.env.SMOKE_API_BASE_URL || "").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
const deployWaitMs = Number(process.env.SMOKE_DEPLOY_WAIT_MS || 0);
const retryAttempts = Math.max(1, Number(process.env.SMOKE_RETRY_ATTEMPTS || 4));
const retryDelayMs = Number(process.env.SMOKE_RETRY_DELAY_MS || 15000);

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

export function buildRequestHeaders(accept) {
  return {
    "accept": accept,
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "user-agent": DEFAULT_BROWSER_USER_AGENT,
  };
}

async function fetchText(url, init = {}) {
  const headers = {
    ...buildRequestHeaders("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
    ...(init.headers || {}),
  };
  return withTimeout(
    async (signal) => {
      const response = await fetch(url, {
        redirect: "manual",
        ...init,
        headers,
        signal,
      });
      const text = await response.text();
      return { response, text };
    },
    url,
  );
}

async function fetchJson(url, init = {}) {
  const { response, text } = await fetchText(url, {
    ...init,
    headers: {
      ...buildRequestHeaders("application/json,text/plain,*/*"),
      ...(init.headers || {}),
    },
  });
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      const contentType = response.headers.get("content-type") || "unknown";
      const snippet = text.slice(0, 120).replace(/\s+/g, " ").trim();
      throw new Error(
        `${url} returned invalid JSON (status ${response.status}, content-type ${contentType}): ${
          error instanceof Error ? error.message : String(error)
        }${snippet ? `; body starts with "${snippet}"` : ""}`,
      );
    }
  }
  return { response, json, text };
}

export function parseRuntimeConfig(scriptText) {
  const match = scriptText.match(/window\.__JAMISSUE_CONFIG__\s*=\s*(\{[\s\S]*?\})\s*;?\s*$/);
  if (!match) {
    throw new Error("runtime config bootstrap is missing");
  }
  return JSON.parse(match[1]);
}

function normalizeUrl(url) {
  return String(url || "").replace(/\/$/, "");
}

export function resolveApiBaseUrl({ runtimeConfig, configuredApiBaseUrl: configuredUrl, defaultApiBaseUrl = DEFAULT_API_BASE_URL }) {
  const runtimeApiBaseUrl = normalizeUrl(runtimeConfig?.apiBaseUrl);
  const overrideApiBaseUrl = normalizeUrl(configuredUrl);
  if (runtimeApiBaseUrl) {
    return runtimeApiBaseUrl;
  }
  if (overrideApiBaseUrl) {
    return overrideApiBaseUrl;
  }
  return normalizeUrl(defaultApiBaseUrl);
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

async function runChecksSequentially(checks) {
  const results = [];
  for (const check of checks) {
    results.push(await check.run());
  }
  return results;
}

async function runChecksWithRetries(checks) {
  let attempt = 1;
  let pendingChecks = checks;
  const finalResults = new Map();

  while (pendingChecks.length > 0 && attempt <= retryAttempts) {
    const results = await runChecksSequentially(pendingChecks);
    const failedChecks = [];

    for (let index = 0; index < results.length; index += 1) {
      const result = {
        ...results[index],
        attempt,
      };
      finalResults.set(pendingChecks[index].name, result);
      if (!result.ok) {
        failedChecks.push(pendingChecks[index]);
      }
    }

    if (failedChecks.length === 0) {
      break;
    }

    if (attempt === retryAttempts) {
      pendingChecks = failedChecks;
      break;
    }

    console.log(`[smoke] ${failedChecks.length} check(s) failed on attempt ${attempt}; retrying in ${retryDelayMs}ms...`);
    await sleep(retryDelayMs);
    pendingChecks = failedChecks;
    attempt += 1;
  }

  return checks
    .map((check) => finalResults.get(check.name))
    .filter(Boolean);
}

async function main() {
  if (deployWaitMs > 0) {
    console.log(`[smoke] waiting ${deployWaitMs}ms before checks...`);
    await sleep(deployWaitMs);
  }

  let runtimeConfig = null;
  let appConfigResult = null;
  try {
    appConfigResult = await fetchText(`${baseUrl}/app-config.js`, {
      headers: buildRequestHeaders("application/javascript,text/javascript,text/plain,*/*"),
    });
    if (appConfigResult.response.status === 200) {
      runtimeConfig = parseRuntimeConfig(appConfigResult.text);
    }
  } catch (error) {
    appConfigResult = {
      response: null,
      text: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const apiBaseUrl = resolveApiBaseUrl({
    runtimeConfig,
    configuredApiBaseUrl,
  });

  const checks = [
    { name: "frontend-root", run: () => runCheck("frontend-root", async () => {
      const { response, text } = await fetchText(`${baseUrl}/`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(/<div id="root"><\/div>/i.test(text), "root mount node is missing");
    }) },
    { name: "frontend-app-config", run: () => runCheck("frontend-app-config", async () => {
      const response = appConfigResult?.response;
      const text = appConfigResult?.text || "";
      if (!response) {
        throw new Error(appConfigResult?.error || "app-config.js could not be fetched");
      }
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(text.includes("window.__JAMISSUE_CONFIG__"), "runtime config bootstrap is missing");
      assert(text.includes('"apiBaseUrl"'), "apiBaseUrl is missing from runtime config");
    }) },
    { name: "api-health", run: () => runCheck("api-health", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/health`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(json?.status === "ok", "health status is not ok");
    }) },
    { name: "api-auth-providers", run: () => runCheck("api-auth-providers", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/auth/providers`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json), "providers response is not an array");
      assert(json.some((provider) => provider?.key === "naver"), "naver provider is missing");
    }) },
    { name: "api-map-bootstrap", run: () => runCheck("api-map-bootstrap", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/map-bootstrap`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json?.places), "places array is missing");
      assert(Array.isArray(json?.stamps?.logs), "stamps.logs array is missing");
    }) },
    { name: "api-review-feed", run: () => runCheck("api-review-feed", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/review-feed?limit=1`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json?.items), "review feed items array is missing");
      assert(Object.prototype.hasOwnProperty.call(json ?? {}, "nextCursor"), "review feed nextCursor is missing");
    }) },
    { name: "api-community-routes", run: () => runCheck("api-community-routes", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/community-routes`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json), "community routes response is not an array");
    }) },
    { name: "api-festivals", run: () => runCheck("api-festivals", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/festivals`);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json), "festivals response is not an array");
    }) },
    { name: "api-my-summary-unauthorized", run: () => runCheck("api-my-summary-unauthorized", async () => {
      const { response, json, text } = await fetchJson(`${apiBaseUrl}/api/my/summary`);
      assert(response.status === 401, `expected 401, received ${response.status}`);
      assert(Boolean(json?.detail || text), "unauthorized response detail is missing");
    }) },
  ];

  const results = await runChecksWithRetries(checks);
  const failed = results.filter((result) => !result.ok);

  console.log(JSON.stringify({
    baseUrl,
    configuredApiBaseUrl: configuredApiBaseUrl || null,
    runtimeApiBaseUrl: runtimeConfig?.apiBaseUrl || null,
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

const entryUrl = process.argv[1] ? new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href : "";

if (import.meta.url === entryUrl) {
  main().catch((error) => {
    console.error("[smoke] fatal error", error);
    process.exitCode = 1;
  });
}

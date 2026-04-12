export const DEFAULT_BASE_URL = "https://daejeon.jamissue.com";
export const DEFAULT_API_BASE_URL = "https://api.daejeon.jamissue.com";
const DEFAULT_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

export const baseUrl = (process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
export const configuredApiBaseUrl = (process.env.SMOKE_API_BASE_URL || "").replace(/\/$/, "");
export const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
export const deployWaitMs = Number(process.env.SMOKE_DEPLOY_WAIT_MS || 0);
export const retryAttempts = Math.max(1, Number(process.env.SMOKE_RETRY_ATTEMPTS || 4));
export const retryDelayMs = Number(process.env.SMOKE_RETRY_DELAY_MS || 15000);

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function withTimeout(promise, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(`${label} timed out after ${timeoutMs}ms`), timeoutMs);
  return Promise.resolve()
    .then(() => promise(controller.signal))
    .finally(() => clearTimeout(timer));
}

export function buildRequestHeaders(accept) {
  return {
    accept,
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "user-agent": DEFAULT_BROWSER_USER_AGENT,
  };
}

export async function fetchText(url, init = {}) {
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

export async function fetchJson(url, init = {}) {
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
  if (process.env.SMOKE_FORCE_API_BASE_URL === "1" && overrideApiBaseUrl) {
    return overrideApiBaseUrl;
  }
  if (runtimeApiBaseUrl) {
    return runtimeApiBaseUrl;
  }
  if (overrideApiBaseUrl) {
    return overrideApiBaseUrl;
  }
  return normalizeUrl(defaultApiBaseUrl);
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runCheck(name, fn) {
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

export async function runChecksWithRetries(checks) {
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

export async function loadRuntimeConfig() {
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

  return {
    appConfigResult,
    runtimeConfig,
    apiBaseUrl: resolveApiBaseUrl({
      runtimeConfig,
      configuredApiBaseUrl,
    }),
  };
}

export async function runSmokeSuite({ suiteName, checks, runtimeConfig, appConfigResult, apiBaseUrl }) {
  if (deployWaitMs > 0) {
    console.log(`[smoke] waiting ${deployWaitMs}ms before checks...`);
    await sleep(deployWaitMs);
  }

  const results = await runChecksWithRetries(checks);
  const failed = results.filter((result) => !result.ok);

  console.log(JSON.stringify({
    suite: suiteName,
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

  return { results, failed, appConfigResult };
}

export function scriptEntryMatches(importMetaUrl, argv1) {
  const entryUrl = argv1 ? new URL(`file://${argv1.replace(/\\/g, "/")}`).href : "";
  return importMetaUrl === entryUrl;
}

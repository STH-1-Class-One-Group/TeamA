import {
  assert,
  baseUrl,
  fetchJson,
  fetchText,
  loadRuntimeConfig,
  runCheck,
  runSmokeSuite,
  scriptEntryMatches,
} from "./smoke/shared.mjs";

export { buildRequestHeaders, parseRuntimeConfig, resolveApiBaseUrl } from "./smoke/shared.mjs";

export function createPublicSmokeChecks({ appConfigResult, apiBaseUrl }) {
  return [
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
}

export async function main() {
  const { appConfigResult, runtimeConfig, apiBaseUrl } = await loadRuntimeConfig();
  return runSmokeSuite({
    suiteName: "public",
    checks: createPublicSmokeChecks({ appConfigResult, apiBaseUrl }),
    runtimeConfig,
    appConfigResult,
    apiBaseUrl,
  });
}

if (scriptEntryMatches(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    console.error("[smoke] fatal error", error);
    process.exitCode = 1;
  });
}

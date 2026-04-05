import { describe, expect, it } from 'vitest';

import {
  buildRequestHeaders,
  parseRuntimeConfig,
  resolveApiBaseUrl,
} from '../../scripts/run-smoke-checks.mjs';

describe('run-smoke-checks helpers', () => {
  it('parses runtime app config from the bootstrap script', () => {
    const config = parseRuntimeConfig(`window.__JAMISSUE_CONFIG__ = {
  "apiBaseUrl": "https://api.runtime.example",
  "naverMapClientId": "abc"
};`);

    expect(config).toEqual({
      apiBaseUrl: 'https://api.runtime.example',
      naverMapClientId: 'abc',
    });
  });

  it('prefers runtime apiBaseUrl over the workflow override', () => {
    expect(
      resolveApiBaseUrl({
        runtimeConfig: { apiBaseUrl: 'https://api.runtime.example/' },
        configuredApiBaseUrl: 'https://api.workflow.example/',
      }),
    ).toBe('https://api.runtime.example');
  });

  it('falls back to the configured apiBaseUrl when runtime config is absent', () => {
    expect(
      resolveApiBaseUrl({
        runtimeConfig: null,
        configuredApiBaseUrl: 'https://api.workflow.example/',
      }),
    ).toBe('https://api.workflow.example');
  });

  it('builds browser-like headers for smoke requests', () => {
    const headers = buildRequestHeaders('application/json,text/plain,*/*');

    expect(headers.accept).toBe('application/json,text/plain,*/*');
    expect(headers['accept-language']).toContain('en-US');
    expect(headers['cache-control']).toBe('no-cache');
    expect(headers['user-agent']).toContain('Mozilla/5.0');
  });
});

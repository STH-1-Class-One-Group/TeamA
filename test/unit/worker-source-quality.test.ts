import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workerRoot = join(workspaceRoot, 'deploy', 'api-worker-shell');
const maxWorkerLineLength = 3_500;

function collectWorkerTsFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '.wrangler' ? [] : collectWorkerTsFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [fullPath] : [];
  });
}

describe('worker source quality gates', () => {
  it('keeps tracked Worker TypeScript files from regressing into one-line blobs', () => {
    const workerFiles = collectWorkerTsFiles(workerRoot);

    expect(workerFiles.length).toBeGreaterThan(0);
    for (const file of workerFiles) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split(/\r?\n/);
      const longestLine = Math.max(...lines.map((line) => line.length));
      const relativePath = relative(workspaceRoot, file);

      if (source.length > 1_000) {
        expect(lines.length, `${relativePath} should stay reviewable`).toBeGreaterThan(1);
      }
      expect(longestLine, `${relativePath} has a suspiciously long line`).toBeLessThanOrEqual(maxWorkerLineLength);
    }
  });
});

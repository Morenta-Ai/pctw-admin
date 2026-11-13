import { readFileSync } from "node:fs";
import { join } from "node:path";

// Vitest runs from the repo root.
const contract = readFileSync(
  join(process.cwd(), "docs", "API_CONTRACT.md"),
  "utf8",
);

/** The text under `### \`METHOD /path\`` up to the next heading. */
function section(endpoint: string): string {
  const heading = `### \`${endpoint}\``;
  const start = contract.indexOf(heading);
  if (start === -1) throw new Error(`No "${heading}" in API_CONTRACT.md`);
  const rest = contract.slice(start + heading.length);
  const end = rest.search(/\n#{2,3} /);
  return end === -1 ? rest : rest.slice(0, end);
}

function jsonBlocks(text: string): unknown[] {
  return [...text.matchAll(/```json\n([\s\S]*?)```/g)].map((match) =>
    JSON.parse(match[1]!),
  );
}

/** The JSON block after "Response" in the endpoint's section. */
export function responseSample(endpoint: string): unknown {
  const text = section(endpoint);
  const at = text.search(/Response/);
  if (at === -1) throw new Error(`No response sample for ${endpoint}`);
  const [sample] = jsonBlocks(text.slice(at));
  if (sample === undefined) throw new Error(`No JSON for ${endpoint}`);
  return sample;
}

/** The first JSON block in the endpoint's section, before "Response". */
export function requestSample(endpoint: string): unknown {
  const text = section(endpoint);
  const at = text.search(/Response/);
  const [sample] = jsonBlocks(at === -1 ? text : text.slice(0, at));
  if (sample === undefined) throw new Error(`No request JSON for ${endpoint}`);
  return sample;
}

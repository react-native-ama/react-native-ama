#!/usr/bin/env node
// Summarises results.csv: average AMA errors and warnings per prompt and
// variant, how often a skill was loaded, and how many runs cheated.
//
// Usage: node evals/skills/summarize.mjs [path/to/results.csv]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const file = process.argv[2] ?? path.join(os.homedir(), 'ama-skill-eval/results/results.csv');
const [header, ...rows] = fs.readFileSync(file, 'utf8').trim().split('\n');
const columns = header.split(',');

const records = rows.map(row => {
  const values = row.split(',');
  return Object.fromEntries(columns.map((column, i) => [column, (values[i] ?? '').trim()]));
});

const groups = new Map();
for (const record of records) {
  const key = `${record.prompt}|${record.variant}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(record);
}

const average = values => {
  const numbers = values.filter(v => v !== '').map(Number);
  if (!numbers.length) return '—';
  return (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(1);
};

const pending = records.filter(r => r.ama_errors === '').length;

console.log('prompt'.padEnd(18), 'variant'.padEnd(15), 'runs', 'errors', 'warnings', 'cheats', 'skill loaded');
for (const [key, group] of [...groups].sort()) {
  const [prompt, variant] = key.split('|');
  const cheats = group.filter(r => r.cheats && r.cheats !== '0' && r.cheats.toLowerCase() !== 'no').length;
  const loaded = group.filter(r => r.skills_loaded && r.skills_loaded !== 'none').length;
  console.log(
    prompt.padEnd(18),
    variant.padEnd(15),
    String(group.length).padEnd(4),
    average(group.map(r => r.ama_errors)).padEnd(6),
    average(group.map(r => r.ama_warnings)).padEnd(8),
    String(cheats).padEnd(6),
    `${loaded}/${group.length}`,
  );
}

if (pending) {
  console.log(`\n${pending} run(s) still need their AMA columns filled in.`);
}

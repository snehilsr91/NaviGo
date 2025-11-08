import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const campusText = readFileSync(join(__dirname, '../../../frontend/Campus_Building_Details.txt'), 'utf-8');

// Map building names to POI labels & rough centre coords
const buildingMeta = {
  'Ramanujacharya Bhavan': { label: 'Ramanujacharya Bhavan', coords: { lat: 12.9716, lng: 77.5946 } },
  'Madhavacharya Bhavan': { label: 'Madhavacharya Bhavan', coords: { lat: 12.97155, lng: 77.59455 } },
  'Shankaracharya Bhavan': { label: 'Shankaracharya Bhavan', coords: { lat: 12.9715, lng: 77.5945 } }
};

// Regex to extract building name from new heading format "1. Name …"
const BUILDING_REGEX = /^\d+\.\s+([^.]+?)(?:\s*\(.*\))?\s*$/;

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
}

function score(passage, questionWords) {
  const passWords = normalize(passage);
  let hits = 0;
  for (const w of questionWords) if (passWords.includes(w)) hits++;
  return hits;
}

export function ask(req, res) {
  const { q } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ reply: 'Missing question.' });

  const questionWords = normalize(q);
  const lines = campusText.split('\n').map(l => l.trim()).filter(Boolean);
  const hits = [];               // collect raw matches
  const seen = new Set();        // avoid duplicate lines

  let currentBuilding = 'Campus';
  let currentMeta = { label: 'Campus', coords: { lat: 12.9716, lng: 77.5946 } };

  for (const rawLine of lines) {
    const line = rawLine.replace(/^-\s*/, '');

    // Detect new heading format "1. Name …" or old plain heading
    const m = rawLine.match(BUILDING_REGEX);
    if (m) {
      const name = m[1].trim();
      if (buildingMeta[name]) {
        currentBuilding = name;
        currentMeta = buildingMeta[name];
      }
      continue;
    }
    // Fallback: old plain heading (first word matches key)
    if (!rawLine.startsWith('-')) {
      const head = line.split(' ')[0];
      if (buildingMeta[head]) {
        currentBuilding = head;
        currentMeta = buildingMeta[head];
      }
    }

    // Detail lines (start with dash) inherit the current building
    const s = score(line, questionWords);
    if (s > 0) {
      const key = `${currentBuilding}|${line}`;
      if (!seen.has(key)) {
        seen.add(key);
        hits.push({ building: currentBuilding, snippet: line, ...currentMeta });
      }
    }
  }

  if (hits.length === 0) {
    return res.json({ reply: 'I could not find an answer in the campus data. Try rephrasing or ask about specific buildings, labs, or rooms.' });
  }
  // Merge snippets per building
  const merged = {};
  for (const h of hits) {
    if (!merged[h.building]) {
      merged[h.building] = { building: h.building, label: h.label, coords: h.coords, snippets: [] };
    }
    merged[h.building].snippets.push(h.snippet);
  }
  const matches = Object.values(merged).map(m => ({
    ...m,
    snippet: m.snippets.join('  \n• ')   // show as bullet list
  }));
  res.json({ matches });
}
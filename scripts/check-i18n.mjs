import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const LOCALES_DIR = path.join(SRC_DIR, 'locales');
const LOCALES = ['en', 'zh', 'zh-TW'];

const SOURCE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const KEY_RE = /(?:\b|\.)t\(\s*['"`]([^'"`]+)['"`]/g;
const PLACEHOLDER_RE = /\{\{\s*([\w.]+)\s*\}\}/g;

function walkFiles(dir, out = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(full, out);
        } else if (SOURCE_FILE_RE.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

function flattenKeys(obj, prefix = '', out = new Map()) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const [k, v] of Object.entries(obj)) {
            const next = prefix ? `${prefix}.${k}` : k;
            flattenKeys(v, next, out);
        }
    } else {
        out.set(prefix, obj);
    }
    return out;
}

function getPlaceholders(value) {
    if (typeof value !== 'string') return new Set();
    const set = new Set();
    let match;
    while ((match = PLACEHOLDER_RE.exec(value))) {
        set.add(match[1]);
    }
    return set;
}

function formatList(items, limit = 20) {
    const shown = items.slice(0, limit);
    const suffix = items.length > limit ? `\n  ...and ${items.length - limit} more` : '';
    return shown.map((k) => `  - ${k}`).join('\n') + suffix;
}

const sourceFiles = walkFiles(SRC_DIR);
const usedKeys = new Set();
for (const file of sourceFiles) {
    const text = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = KEY_RE.exec(text))) {
        const key = match[1];
        if (key.includes('${')) continue;
        usedKeys.add(key);
    }
}

const localeMaps = {};
for (const locale of LOCALES) {
    const localePath = path.join(LOCALES_DIR, `${locale}.json`);
    const raw = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    localeMaps[locale] = flattenKeys(raw);
}

const errors = [];

for (const locale of LOCALES) {
    const map = localeMaps[locale];
    const missingUsed = [...usedKeys].filter((k) => !map.has(k)).sort();
    if (missingUsed.length > 0) {
        errors.push(`[${locale}] Missing keys used in source (${missingUsed.length}):\n${formatList(missingUsed)}`);
    }
}

const baseLocale = 'en';
const baseKeys = new Set(localeMaps[baseLocale].keys());
for (const locale of LOCALES) {
    if (locale === baseLocale) continue;
    const map = localeMaps[locale];
    const localeKeys = new Set(map.keys());

    const missingFromLocale = [...baseKeys].filter((k) => !localeKeys.has(k)).sort();
    const extraInLocale = [...localeKeys].filter((k) => !baseKeys.has(k)).sort();

    if (missingFromLocale.length > 0) {
        errors.push(`[${locale}] Keys present in ${baseLocale} but missing (${missingFromLocale.length}):\n${formatList(missingFromLocale)}`);
    }
    if (extraInLocale.length > 0) {
        errors.push(`[${locale}] Extra keys not found in ${baseLocale} (${extraInLocale.length}):\n${formatList(extraInLocale)}`);
    }
}

for (const key of baseKeys) {
    const baseVal = localeMaps[baseLocale].get(key);
    if (typeof baseVal !== 'string') continue;

    const basePlaceholders = getPlaceholders(baseVal);
    for (const locale of LOCALES) {
        if (locale === baseLocale) continue;
        const value = localeMaps[locale].get(key);
        if (typeof value !== 'string') continue;

        const localePlaceholders = getPlaceholders(value);
        const baseArr = [...basePlaceholders].sort();
        const localeArr = [...localePlaceholders].sort();

        if (baseArr.join(',') !== localeArr.join(',')) {
            errors.push(
                `[${locale}] Placeholder mismatch for key "${key}"\n` +
                `  - ${baseLocale}: [${baseArr.join(', ')}]\n` +
                `  - ${locale}: [${localeArr.join(', ')}]`
            );
        }
    }
}

if (errors.length > 0) {
    console.error('i18n check failed.');
    for (const err of errors) {
        console.error('\n' + err);
    }
    process.exit(1);
}

console.log('i18n check passed.');
console.log(`- Source keys detected: ${usedKeys.size}`);
for (const locale of LOCALES) {
    console.log(`- ${locale} keys: ${localeMaps[locale].size}`);
}

import { loadTestContent } from './test-helpers.mjs';

const validation = (await loadTestContent()).validation;
for (const warning of validation.warnings) console.warn(`warning: ${warning}`);
console.log('content validation ok');

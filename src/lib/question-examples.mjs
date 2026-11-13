import { readFileSync } from 'node:fs';
import { siteRoot } from './upstream.mjs';

/** The same request is used by the download, command and explanatory diagram. */
export const questionExample = (type) => JSON.parse(readFileSync(`${siteRoot}/public/examples/questions/${type}.json`, 'utf8'));

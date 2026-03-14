process.loadEnvFile('.env');
import { contentToHtml } from './lib/tiptap.js';

// Use the raw JSON we already got from the DB
const json = '{"type":"doc","content":[{"type":"youtube","attrs":{"src":"https://youtu.be/VdfBFb4EazE","start":0,"width":640,"height":360}},{"type":"youtube","attrs":{"src":"https://youtu.be/eWooPHX8Zc0","start":0,"width":640,"height":360}}]}';

const html = contentToHtml(json);
console.log(html);

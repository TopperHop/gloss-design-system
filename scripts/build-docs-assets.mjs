import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = [
    { source: 'dist/css/gloss.css', destination: 'docs/assets/css/gloss.css' },
    { source: 'dist/css/gloss.css.map', destination: 'docs/assets/css/gloss.css.map' },
    { source: 'dist/js/gloss.js', destination: 'docs/assets/js/gloss.js' },
    { source: 'dist/js/gloss-icons.js', destination: 'docs/assets/js/gloss-icons.js' },
];

for (const asset of assets) {
    const sourcePath = path.join(projectDirectory, asset.source);
    const destinationPath = path.join(projectDirectory, asset.destination);

    try {
        await access(sourcePath);
    } catch (error) {
        throw new Error(`Missing ${sourcePath}. Run npm run build:docs first.`, { cause: error });
    }

    await mkdir(path.dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
}

console.log(`Copied ${assets.length} generated asset(s) into docs/.`);

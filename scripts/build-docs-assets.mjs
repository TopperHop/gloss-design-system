import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(projectDirectory, 'dist', 'css');
const destinationDirectory = path.join(projectDirectory, 'docs', 'assets', 'css');
const assets = ['gloss.css', 'gloss.css.map'];

await mkdir(destinationDirectory, { recursive: true });

for (const asset of assets) {
    const sourcePath = path.join(sourceDirectory, asset);
    const destinationPath = path.join(destinationDirectory, asset);

    try {
        await access(sourcePath);
    } catch (error) {
        throw new Error(`Missing ${sourcePath}. Run npm run build:css first.`, { cause: error });
    }

    await copyFile(sourcePath, destinationPath);
}

console.log(`Copied ${assets.length} CSS asset(s) into docs/assets/css.`);

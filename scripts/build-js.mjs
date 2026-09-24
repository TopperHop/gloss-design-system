import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiKitDirectory = path.join(projectDirectory, 'node_modules', 'uikit', 'dist', 'js');
const outputDirectory = path.join(projectDirectory, 'dist', 'js');
const autocompletePath = path.join(projectDirectory, 'src', 'js', 'components', 'autocomplete.js');

await mkdir(outputDirectory, { recursive: true });

const transformUiKit = (source, fileName) => {
    const headerEnd = source.indexOf('\n');

    if (headerEnd === -1) {
        throw new Error(`Unable to preserve the UIkit license header in ${fileName}.`);
    }

    const licenseHeader = source.slice(0, headerEnd);
    const body = source
        .slice(headerEnd)
        .replaceAll('UIkit', 'Gloss')
        .replaceAll('uk-', 'gls-')
        .replaceAll("define('uikit',", "define('gloss',")
        .replaceAll("define('uikiticons',", "define('gloss-icons',");

    if (body.includes('uk-')) {
        throw new Error(`The UIkit prefix transform was incomplete for ${fileName}.`);
    }

    return `${licenseHeader}\n/*! Gloss build: generated from ${fileName}; do not edit. */${body}`;
};

const uiKit = await readFile(path.join(uiKitDirectory, 'uikit.js'), 'utf8');
const uiKitIcons = await readFile(path.join(uiKitDirectory, 'uikit-icons.js'), 'utf8');
const autocomplete = await readFile(autocompletePath, 'utf8');

await writeFile(
    path.join(outputDirectory, 'gloss.js'),
    `${transformUiKit(uiKit, 'uikit.js')}\n\n${autocomplete}`,
);
await writeFile(path.join(outputDirectory, 'gloss-icons.js'), transformUiKit(uiKitIcons, 'uikit-icons.js'));

console.log('Built Gloss JavaScript and icon bundles from the UIkit dependency.');

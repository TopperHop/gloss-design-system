import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const executeFile = promisify(execFile);
const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const generatorPath = path.join(projectDirectory, 'scripts', 'build-tokens.mjs');

async function writeTokenFile(directory, relativePath, contents) {
    const filePath = path.join(directory, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(contents, null, 4));
}

test('generates default tokens and only the tokens changed by a sub-brand', async (context) => {
    const fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'gloss-tokens-'));
    const sourceDirectory = path.join(fixtureDirectory, 'source');
    const outputPath = path.join(fixtureDirectory, '_tokens.scss');

    context.after(() => rm(fixtureDirectory, { force: true, recursive: true }));

    await writeTokenFile(sourceDirectory, 'base/color.json', {
        color: {
            $type: 'color',
            reference: {
                brand: {
                    $value: {
                        colorSpace: 'srgb',
                        components: [0.745, 0, 0],
                        hex: '#be0000',
                    },
                },
                ink: {
                    $value: {
                        colorSpace: 'srgb',
                        components: [0, 0, 0],
                        hex: '#000000',
                    },
                },
            },
        },
    });
    await writeTokenFile(sourceDirectory, 'default/color.json', {
        color: {
            $type: 'color',
            role: {
                action: {
                    primary: {
                        $value: '{color.reference.brand}',
                    },
                },
                text: {
                    default: {
                        $value: '{color.reference.ink}',
                    },
                },
            },
        },
    });
    await writeTokenFile(sourceDirectory, 'themes/huntsman/color.json', {
        color: {
            $type: 'color',
            reference: {
                brand: {
                    $value: {
                        colorSpace: 'srgb',
                        components: [0.11, 0.22, 0.37],
                        hex: '#1c385f',
                    },
                },
            },
        },
    });
    await writeFile(outputPath, '');

    await executeFile(process.execPath, [generatorPath], {
        env: {
            ...process.env,
            GLOSS_TOKEN_OUTPUT_PATH: outputPath,
            GLOSS_TOKEN_SOURCE_DIRECTORY: sourceDirectory,
        },
    });

    const output = await readFile(outputPath, 'utf8');

    assert.match(output, /--gls-color-reference-brand: #be0000;/);
    assert.match(output, /--gls-color-role-action-primary: var\(--gls-color-reference-brand\);/);
    assert.match(output, /\.gls-theme-huntsman \{\n {4}--gls-color-reference-brand: #1c385f;/);
    assert.doesNotMatch(output, /\.gls-theme-huntsman \{[\s\S]*--gls-color-role-action-primary/);
});

const fs = require('fs');
const path = require('path');

console.log('Copying assets...');

try {
    // Ensure dist directories exist
    fs.mkdirSync('dist/fonts', { recursive: true });
    fs.mkdirSync('dist/images', { recursive: true });

    // Copy public image directories (backgrounds, components)
    for (const dir of ['backgrounds', 'components']) {
        const srcDir = path.join('src/images', dir);
        const distDir = path.join('dist/images', dir);
        if (fs.existsSync(srcDir)) {
            fs.cpSync(srcDir, distDir, { recursive: true });
        }
    }

    // Copy icons from local src or assets-private if available
    const iconSources = ['src/images/icons', 'assets-private/icons', 'assets-private/images/icons'];
    for (const iconSrc of iconSources) {
        if (fs.existsSync(iconSrc)) {
            fs.mkdirSync('dist/images/icons', { recursive: true });
            fs.cpSync(iconSrc, 'dist/images/icons', { recursive: true });
            console.log(`Copied icons from ${iconSrc}.`);
            break;
        }
    }

    // Copy fonts from local src or assets-private if available
    const fontSources = ['src/fonts', 'assets-private/fonts'];
    for (const fontSrc of fontSources) {
        if (fs.existsSync(fontSrc)) {
            fs.cpSync(fontSrc, 'dist/fonts', { recursive: true });
            console.log(`Copied fonts from ${fontSrc}.`);
            break;
        }
    }

    console.log('Asset copying complete.');
} catch (err) {
    console.error('Error copying assets:', err);
    process.exit(1);
}

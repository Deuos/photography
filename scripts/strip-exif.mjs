// Removes location and timestamps (and all other metadata) from every photo in photos/,
// keeping only camera and lens settings plus the orientation and colour profile needed to display it correctly.
// Usage: npm run strip-exif            (all photos)
//        npm run strip-exif -- a.jpg   (specific files)
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exiftool } from 'exiftool-vendored';

const PHOTOS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'photos');
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

// Everything not listed here is deleted. GPS and every date/time tag are deliberately absent.
const KEEP_TAGS = [
    'Make',
    'Model',
    'LensMake',
    'LensModel',
    'FocalLength',
    'FocalLengthIn35mmFormat',
    'FNumber',
    'ExposureTime',
    'ISO',
    'ExposureCompensation',
    'ExposureProgram',
    'ExposureMode',
    'MeteringMode',
    'Flash',
    'WhiteBalance',
    'Orientation',
    'ICC_Profile',
];

const args = process.argv.slice(2);
const files = args.length
    ? args.map((file) => path.resolve(file))
    : (await readdir(PHOTOS_DIR)).filter((name) => IMAGE_EXTENSIONS.test(name)).map((name) => path.join(PHOTOS_DIR, name));

let failed = 0;
for (const file of files) {
    try {
        await exiftool.write(file, {}, [
            '-all=',
            '-tagsfromfile',
            '@',
            ...KEEP_TAGS.map((tag) => `-${tag}`),
            '-overwrite_original',
        ]);
        console.log(`cleaned  ${path.basename(file)}`);
    } catch (err) {
        failed++;
        console.error(`FAILED   ${path.basename(file)}: ${err.message}`);
    }
}

await exiftool.end();
console.log(`${files.length - failed}/${files.length} photos cleaned`);
process.exit(failed ? 1 : 0);

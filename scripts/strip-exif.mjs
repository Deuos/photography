// Removes location (GPS) and all other identifying metadata from every photo in photos/,
// keeping camera and lens settings, capture timestamps, and the orientation and colour profile needed to display it correctly.
// Usage: npm run strip-exif            (all photos)
//        npm run strip-exif -- a.jpg   (specific files)
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exiftool } from 'exiftool-vendored';

const PHOTOS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'photos');
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

// Everything not listed here is deleted. GPS, serial numbers, owner/artist and thumbnails are deliberately absent.
const KEEP_TAGS = [
    // camera and lens
    'Make',
    'Model',
    'Software',
    'LensMake',
    'LensModel',
    'LensInfo',
    // exposure settings
    'FocalLength',
    'FocalLengthIn35mmFormat',
    'FNumber',
    'MaxApertureValue',
    'ExposureTime',
    'ISO',
    'ExposureCompensation',
    'ExposureProgram',
    'ExposureMode',
    'BrightnessValue',
    'MeteringMode',
    'LightSource',
    'Flash',
    'WhiteBalance',
    'DigitalZoomRatio',
    'SceneCaptureType',
    'Contrast',
    'Saturation',
    'Sharpness',
    // capture time, including timezone offset
    'DateTimeOriginal',
    'CreateDate',
    'ModifyDate',
    'OffsetTime',
    'OffsetTimeOriginal',
    'OffsetTimeDigitized',
    'SubSecTime',
    'SubSecTimeOriginal',
    'SubSecTimeDigitized',
    // needed to display correctly
    'Orientation',
    'ColorSpace',
    'ICC_Profile',
];

const args = process.argv.slice(2);
const files = args.length
    ? args.map((file) => path.resolve(file))
    : (await readdir(PHOTOS_DIR)).filter((name) => IMAGE_EXTENSIONS.test(name)).map((name) => path.join(PHOTOS_DIR, name));

let failed = 0;
for (const file of files) {
    try {
        await exiftool.write(file, {}, {
            writeArgs: [
                '-all=',
                '-tagsfromfile',
                '@',
                ...KEEP_TAGS.map((tag) => `-${tag}`),
                '-overwrite_original',
            ],
        });
        console.log(`cleaned  ${path.basename(file)}`);
    } catch (err) {
        failed++;
        console.error(`FAILED   ${path.basename(file)}: ${err.message}`);
    }
}

await exiftool.end();
console.log(`${files.length - failed}/${files.length} photos cleaned`);
process.exit(failed ? 1 : 0);

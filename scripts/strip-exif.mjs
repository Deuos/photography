// Removes location (GPS) and all other identifying metadata from every photo in photos/,
// keeping camera and lens settings, capture timestamps, and the orientation and colour profile needed to display it correctly.
// It then writes photos/manifest.json (capture time, camera, lens, settings, size) which the website reads.
// Usage: npm run strip-exif            (all photos)
//        npm run strip-exif -- a.jpg   (specific files; the manifest always covers every photo)
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exiftool } from 'exiftool-vendored';

const PHOTOS_DIR = process.env.PHOTOS_DIR ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'photos');
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

console.log(`${files.length - failed}/${files.length} photos cleaned`);

// photos/manifest.json lets the website sort and caption photos without downloading them.
// exiftool returns shutter speed as "1/400" for fast exposures and a number of seconds for slow ones
const formatShutter = (value) => {
    if (typeof value === 'string' && value.includes('/')) return `${value}s`;
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    return seconds >= 1 ? `${seconds}s` : `1/${Math.round(1 / seconds)}s`;
};

const joinCamera = (make, model) => {
    const m = make?.trim();
    const d = model?.trim();
    if (!m) return d;
    if (!d) return m;
    return d.toLowerCase().startsWith(m.toLowerCase()) ? d : `${m} ${d}`;
};

const names = (await readdir(PHOTOS_DIR)).filter((name) => IMAGE_EXTENSIONS.test(name));
const manifest = [];
for (const name of names) {
    const tags = await exiftool.read(path.join(PHOTOS_DIR, name));
    const taken = tags.DateTimeOriginal ?? tags.CreateDate;
    const takenAt = taken && typeof taken === 'object' && 'toMillis' in taken ? taken.toMillis() : null;
    const rotated = Number(tags.Orientation) >= 5;
    const settings = [
        tags.FocalLength ? `${Math.round(parseFloat(tags.FocalLength))}mm` : null,
        tags.FNumber ? `f/${tags.FNumber}` : null,
        tags.ExposureTime ? formatShutter(tags.ExposureTime) : null,
        tags.ISO ? `ISO ${tags.ISO}` : null,
    ].filter(Boolean);

    manifest.push({
        name,
        takenAt: Number.isFinite(takenAt) ? takenAt : null,
        camera: joinCamera(tags.Make, tags.Model),
        lens: tags.LensModel?.trim() || undefined,
        settings: settings.length ? settings.join('  ·  ') : undefined,
        width: rotated ? tags.ImageHeight : tags.ImageWidth,
        height: rotated ? tags.ImageWidth : tags.ImageHeight,
    });
}
// Newest first; photos without a timestamp go last, ordered by filename.
manifest.sort((a, b) => {
    if (a.takenAt !== null && b.takenAt !== null) return b.takenAt - a.takenAt;
    if (a.takenAt !== null) return -1;
    if (b.takenAt !== null) return 1;
    return b.name.localeCompare(a.name, undefined, { numeric: true });
});
await writeFile(path.join(PHOTOS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest.json written (${manifest.length} photos)`);

await exiftool.end();
process.exit(failed ? 1 : 0);

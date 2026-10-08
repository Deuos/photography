# photography

Photos for the portfolio's Photography page. The site lists the files in `photos/` through the GitHub API, so anything added here shows up on the next page load with no rebuild.

```
photos/    put images here (jpg, jpeg, png, webp, avif, gif)
scripts/   strip-exif.mjs
```

## Privacy: EXIF

`npm run strip-exif` cleans every file in `photos/`.

- **Kept:** camera make and model, lens, focal length, aperture, shutter speed, ISO, exposure settings, flash, white balance, orientation, colour profile.
- **Removed:** GPS and any location data, every date and time, serial numbers, artist or copyright, thumbnails, maker notes, XMP and IPTC.

It is safe to run repeatedly. A GitHub Action (`.github/workflows/strip-exif.yml`) runs it on every push that touches `photos/` and commits the cleaned files, so uploads made from github.com or a phone are covered too.

Because the Action cleans files after they are pushed, the original is briefly in git history. To keep originals out entirely, run the script locally before committing:

```bash
npm install        # first time only
npm run strip-exif
```

## Tips

- Name files `YYYY-MM-DD-name.jpg`. The site sorts by filename, newest first, and timestamps are stripped from the files themselves.
- Resize to about 2000px on the long edge. The site loads the files as they are.
- Avoid spaces and unusual characters in filenames.

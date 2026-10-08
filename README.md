# photography

Photos for the portfolio's Photography page. The site lists the files in `photos/` through the GitHub API, so anything added here shows up on the next page load with no rebuild.

```
photos/    put images here (jpg, jpeg, png, webp, avif, gif)
scripts/   strip-exif.mjs
```

## Privacy: EXIF

`npm run strip-exif` cleans every file in `photos/`.

- **Kept:** camera make and model, lens, focal length, aperture, shutter speed, ISO, exposure settings, flash, white balance, capture date and time, orientation, colour profile.
- **Removed:** GPS and any location data, serial numbers, artist or copyright, thumbnails, maker notes, XMP and IPTC.

It is safe to run repeatedly, and it edits files in place, so run it before committing. There is no automation: photos uploaded without running it keep their original metadata, including GPS.

```bash
npm install        # first time only
npm run strip-exif
git add photos && git commit && git push
```

## Tips

- Name files `YYYY-MM-DD-name.jpg`. The site sorts by filename, newest first.
- Resize to about 2000px on the long edge. The site loads the files as they are.
- Avoid spaces and unusual characters in filenames.

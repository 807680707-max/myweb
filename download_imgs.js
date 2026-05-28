const https = require("https");
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "imgs");

const images = [
  { name: "rocket.jpg",      url: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=600&q=75&fit=crop" },
  { name: "satellite.jpg",   url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=75&fit=crop" },
  { name: "navigation.jpg",  url: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=600&q=75&fit=crop" },
  { name: "ai.jpg",          url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=75&fit=crop" },
  { name: "race_track.jpg",  url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=75&fit=crop" },
  { name: "helmet.jpg",      url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9e?w=600&q=75&fit=crop" },
  { name: "podium.jpg",      url: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600&q=75&fit=crop" },
  { name: "night_race.jpg",  url: "https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=600&q=75&fit=crop" },
  { name: "race_start.jpg",  url: "https://images.unsplash.com/photo-1532906619279-a4b7267faa66?w=600&q=75&fit=crop" },
  { name: "porsche.jpg",     url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=75&fit=crop" },
];

function download(name, url) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(outDir, name);
    const file = fs.createWriteStream(filePath);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        file.close();
        fs.unlinkSync(filePath);
        return download(name, res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        console.log(`  SKIP ${name}: HTTP ${res.statusCode}`);
        return resolve(null);
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const stat = fs.statSync(filePath);
        console.log(`  OK  ${name}  (${(stat.size / 1024).toFixed(1)} KB)`);
        resolve(filePath);
      });
    }).on("error", (err) => {
      file.close();
      try { fs.unlinkSync(filePath); } catch (e) {}
      console.log(`  FAIL ${name}: ${err.message}`);
      resolve(null);
    });
  });
}

(async () => {
  console.log("Downloading images...\n");
  const results = [];
  for (const img of images) {
    results.push(await download(img.name, img.url));
  }
  const downloaded = results.filter(Boolean);
  console.log(`\nDownloaded ${downloaded.length}/${images.length} images.`);

  // Write a manifest
  const manifest = {};
  downloaded.forEach(p => { manifest[path.basename(p, path.extname(p))] = p; });
  fs.writeFileSync(path.join(__dirname, "img_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("Manifest saved.");
})();

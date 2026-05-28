const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

// .docx is a ZIP file, images are in word/media/
const zip = new AdmZip("C:/Users/ME/Desktop/倒车雷达课程设计电路原理图.docx");
const imgDir = path.join(__dirname, "docx_images");

if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

const entries = zip.getEntries();
entries.forEach((entry) => {
  if (entry.entryName.startsWith("word/media/")) {
    const imgName = path.basename(entry.entryName);
    const imgPath = path.join(imgDir, imgName);
    fs.writeFileSync(imgPath, entry.getData());
    console.log("Extracted:", imgName, `(${entry.getData().length} bytes)`);
  }
});

console.log("\nDone! Images saved to docx_images/");

const xlsx = require("xlsx");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

// 1. Read Excel BOM
const wb = xlsx.readFile("C:/Users/ME/Desktop/倒车雷达模拟电子耗材.xlsx");
console.log("=== Sheet names ===", wb.SheetNames);

wb.SheetNames.forEach((name) => {
  const ws = wb.Sheets[name];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n=== Sheet: ${name} ===`);
  data.forEach((row, i) => {
    console.log(row.join("\t"));
  });
});

// 2. Extract docx images
console.log("\n\n=== Extracting DOCX images ===");
const imgDir = path.join(__dirname, "docx_images");
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

mammoth
  .convertToHtml({
    path: "C:/Users/ME/Desktop/倒车雷达课程设计电路原理图.docx",
  })
  .then((result) => {
    console.log("=== DOCX text content ===");
    console.log(result.value);
    console.log("Messages:", JSON.stringify(result.messages, null, 2));
  })
  .catch((err) => console.error("DOCX error:", err));

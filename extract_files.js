const xlsx = require("xlsx");
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
    if (row.some((c) => c != null)) {
      console.log(JSON.stringify(row));
    }
  });
});

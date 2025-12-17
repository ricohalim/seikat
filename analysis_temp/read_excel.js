const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../migration_data/Database V2.0.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log('Sheet Names:', sheetNames);

  sheetNames.forEach(name => {
    console.log(`\n--- First 3 rows of sheet: ${name} ---`);
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, limit: 3 });
    console.log(JSON.stringify(data, null, 2));
  });

} catch (err) {
  console.error('Error reading file:', err.message);
}

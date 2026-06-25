import { readFile, utils } from 'xlsx';
import fs from 'fs';

const workbook = readFile('c:/Users/DELL/OneDrive/Desktop/worldcup-2026/src/data/round_of_32_wikipedia_format.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = utils.sheet_to_json(worksheet);
console.log(data.slice(0, 5));

fs.writeFileSync('c:/Users/DELL/OneDrive/Desktop/worldcup-2026/src/data/round_of_32_seeding.json', JSON.stringify(data, null, 2));
console.log('Saved to src/data/round_of_32_seeding.json');

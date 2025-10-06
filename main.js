const { Command } = require('commander');
const fs = require('fs');

const program = new Command();

program
  .name('bank-manager-cli')
  .description('CLI tool for processing NBU bank managers data')
  .version('1.0.0');

program
  .option('-i, --input <path>', 'path to input JSON file (required)')
  .option('-o, --output <path>', 'path to output file')
  .option('-d, --display', 'display results in console')
  .option('-m, --mfo', 'display MFO code before bank name')
  .option('-n, --normal', 'display only working banks (COD_STATE = 1)');

program.parse(process.argv);
const options = program.opts();

if (!options.input) {
  console.error('Please, specify input file');
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error('Cannot find input file');
  process.exit(1);
}

let data;
try {
  const fileContent = fs.readFileSync(options.input, 'utf8');
  data = JSON.parse(fileContent);
} catch (error) {
  console.error('Error reading or parsing JSON file:', error.message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error('JSON file must contain an array');
  process.exit(1);
}

let filteredData = data;
if (options.normal) {
  filteredData = data.filter(record => record.COD_STATE === 1);
}

const banksMap = new Map();

filteredData.forEach(record => {
  const mfo = record.MFO;
  const name = record.SHORTNAME || record.FULLNAME || '';

  if (name && mfo) {

    banksMap.set(mfo, name);
  }
});

const results = [];
for (const [mfo, name] of banksMap) {
  let line = '';

    if (options.mfo) {
    line += mfo + ' ';
  }

    line += name;
  results.push(line.trim());
}

results.sort();

const output = results.join('\n');

if (!options.output && !options.display) {
  process.exit(0);
}

if (options.display) {
  console.log(output);
}

if (options.output) {
  try {
    fs.writeFileSync(options.output, output, 'utf8');
  } catch (error) {
    console.error('Error writing to file:', error.message);
    process.exit(1);
  }
}

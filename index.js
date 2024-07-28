const fs = require("fs").promises;
const path = require("path");
const { parsePDF, extractRecords } = require('./pdfUtils');
const { writeToFile, generateHtml } = require('./fileUtils');
const { addExpense, categories, findCommonPatterns } = require('./expenseUtils');

async function main() {
  try {
    // Change your pdf name here
    const dataBuffer = await fs.readFile("changeHere.pdf");

    // Parse PDF and extract records
    const lines = await parsePDF(dataBuffer);

    const records = extractRecords(lines, categories);

    // Compare lines and create patterns
    // Based on the patterns you can indentify the words to match for
    // For your personal use
    const patterns = await findCommonPatterns(lines);
    await writeToFile(patterns, 'patterns.json');

    // Process the expenses + transform them into chart.js friendly format
    const expenses = addExpense(records);

    // Individual records
    await writeToFile(records, 'records.json');

    // Processed data
    await writeToFile(expenses, 'expenses.json');

    // Generate chart html
    generateHtml(path.join(__dirname, 'expenses.json'));

  } catch (error) {
    console.error("Error:", error);
  }
}

main();
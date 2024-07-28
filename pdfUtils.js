const pdf = require("pdf-parse");
const { findCategory, containsPattern } = require('./expenseUtils');

async function parsePDF(dataBuffer) {
  const data = await pdf(dataBuffer);
  return data.text.split("\n");
}

// Function to extract records from lines
function extractRecords(lines, categories) {
  let records = [];

  const beginningIndex = lines.findIndex(line => line.startsWith("Dát. trans.Operácia"));
  const endingIndex = lines.lastIndexOf(lines.find(line => line.startsWith("Zdroj: E-mail info 365.bank")));
  const relevantLines = lines.slice(beginningIndex + 1, endingIndex);

  relevantLines.forEach((line, index) => {
     // Check if the line matches the date format (dd.mm.yyyy)
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(line.trim())) {
      let newRecord = {};

      // lines have different format, they can be grouped into 3 categories
      // and each format has its own specifics
      // specific examples mentioned under
      
      if (relevantLines[index + 1].startsWith("Výber")) {
        newRecord = createATMRecord(relevantLines, index);
        records.push(newRecord);
      }

      if (relevantLines[index + 1] === "Platba u obchodníka") {
        newRecord = createTransactionRecord(relevantLines, index, categories);
        records.push(newRecord);
      }
    } else if (containsPattern(line, categories) || line.includes('Prikaz')) {
      const newRecord = createPatternRecord(relevantLines, index, categories);
      records.push(newRecord);
    } 
  });
  
  /* After transformation a single record would look like this
  {
    "type": "Doprava",
    "date": "26.07.2022",
    "action": "Platba u obchodníka",
    "sellerInfo": "06:13:43 ZELEZNICNA SPOLOCNOST",
    "amount": -1.9
  }, */

  return records;
}

function createATMRecord(lines, index) {
  // format of data like this
  /* "22.07.2024"
  "Výber z bankomatu"
  "PK:XYZ"
  "00:00:00 365.bank S6AP015I Nove Zamky"
  "Dátum realizácie:"
  "21.07.2024"
  "-20,00"
  "," */
  
  const amountIndex = lines[index + (lines[index + 6]?.startsWith("Výmenný kurz") ? 7 : 6)].replace(",", ".");
  return {
    type: "Výbery z bankomatu",
    date: lines[index],
    action: lines[index + 1],
    sellerInfo: lines[index + 3],
    amount: parseFloat(amountIndex),
  };
}

function createTransactionRecord(lines, index, categories) {
  // format of data like this
  /*  "Platba u obchodníka"
  "PK:XYZ"
  "10:00:00 COOP NZ PJ 460"
  "Dátum realizácie:"
  "22.07.2024"
  "-3,42"
  "," */
  
  const amountIndex = lines[index + (lines[index + 6]?.startsWith("Výmenný kurz") ? 7 : 6)].replace(",", ".");
  return {
    type: findCategory(lines[index + 3], categories),
    date: lines[index],
    action: lines[index + 1],
    sellerInfo: lines[index + 3],
    amount: parseFloat(amountIndex),
  };
}

function createPatternRecord(lines, index, categories) {
  // format of data like this
  /*  "20.07.2024Realizacia trvaleho prikazu na uhradu-21,67"
    "SK_IBAN,"
    "/Vsymbol/SpecifickySymbol"
    "/KonstantySymbol" */

  return {
    type: findCategory(lines[index], categories),
    date: lines[index].slice(0, 10),
    action: lines[index].slice(10, lines[index].lastIndexOf("-")),
    sellerInfo: lines[index].slice(10, lines[index].lastIndexOf("-")),
    amount: parseFloat(lines[index].slice(lines[index].lastIndexOf("-")).replace(",", ".")),
  };
}

module.exports = { parsePDF, extractRecords };
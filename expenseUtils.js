const categories = [
  { name: "Potraviny", values: ["COOP", "LIDL", "BILLA", "PENNY", "TERNO", "MALINA", "KAUFLAND", "TESCO", "ZDROJ", "YEME", "MARKET", "TAURIS", "potraviny", "Masiarst"] },
  { name: "Doprava", values: ["ZELEZNICNA SPOLOCNOST", "BID", "ZSSK", "dopravny"] },
  { name: "Trafiky + Benzínky", values: ["trafik", "tabak", "shell", "mediapress", "novinovy", "omv", "press", "orlen", "slovnaft", "royal press"] },
  { name: "Telekomunikácie", values: ["orange"] },
  { name: "Reštaurácie", values: ["SIRIN","cinska", "royal kashmir", "bamboo", "mcdonal", "kamosa", "gastro", "pho", "loco burgers", "pasha", "skytina", "cantina", "bistro", "kucera", "restauracia", "food", "kebab", "pizza", "pizzeria", "kfc", "papa", "wolt", "barbar", "bolt"] },
  { name: "Bary", values: ["amsterdam", "jazz"] },
  { name: "Subscriptions", values: ["google", "patreon", "f1", "dennikn"] },
  { name: "Hry", values: ["key4you", "wargaming", "steam", "gosetups", "yourgames", "hry"] },
  { name: "Lieky", values: ["Max", "lekaren", "benu"] },
  { name: "Oblečenie + domácnosť", values: ["CISTIAREN", "lin park", "mercury", "teta", "ambra", "ccc", "ocean", "takko", "gate", "dm", "deichmann", "decathlon", "KONDELA"] },
  { name: "Elektornika", values: ["alza", "computer", "mall"] },
  { name: "Osobné prevody", values: ["Prikaz"] },
  { name: "Splátky, poplatky banke", values: ["Splatka", "Union", "zrazkova", "kapitalizacia", "vedenie"] },
  { name: "Výbery z bankomatu", values: ["vyber"] }
];

const colorPalette = [
    '#ff2c2c', // Výber z bankomatu
    '#fcb90d', // Potraviny
    '#4095ff', // Osobné prevody
    '#72df78', // Subs
    '#d900ff', // Hry
    '#0012ff', // Splátky, poplatky, dane
    '#00f5ff', // Oblečenie a domácnosť
    '#ff4cd0', // Bary
    '#bcbcbc', // Iné
    '#1e0f0f', // Trafiky, benzínky
    '#00d2ff', // Doprava
    '#ffae00', // Reštaurácie
    '#749fff',  // Telekomunikácie
    '#2a8232', // Elektronika
    '#54e7ff', // Lieky
];

// Function to find the category of a line
function findCategory(line, categories) {
  const lowerCaseLine = line.toLowerCase();
  for (const category of categories) {
    if (category.values.some(value => lowerCaseLine.includes(value.toLowerCase()))) {
      return category.name;
    }
  }
  return "Iné";
}

// Function to check if a line contains a transaction pattern
function containsPattern(line, categories) {
  const transactionPatterns = categories.find(category => category.name === "Splátky, poplatky banke").values;
  return transactionPatterns.some(pattern => line.includes(pattern));
}

// Function to add expense data to the structured format
function addExpense(data) {
    const expenses = [];

    data.forEach(expense => {
        const { date, amount, type } = expense;
        const [day, month, year] = date.split('.').map(Number);
        const monthNames = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
        const monthName = `${monthNames[month - 1]} ${year}`;

        // Use Math.abs to ensure amounts are positive
        const positiveAmount = Math.abs(amount);

        let yearObj = expenses.find(e => e.year === String(year));
        if (!yearObj) {
            yearObj = { year: String(year), months: [] };
            expenses.push(yearObj);
        }

        let monthObj = yearObj.months.find(m => m.name === monthName);
        if (!monthObj) {
            monthObj = { name: monthName, categories: [], totalAmountSpent: 0 };
            yearObj.months.push(monthObj);
        }

        let categoryObj = monthObj.categories.find(c => c.type === type);
        if (!categoryObj) {
            categoryObj = { type, totalAmount: 0 };
            monthObj.categories.push(categoryObj);
        }

        // Update the totalAmount with the positive amount
        categoryObj.totalAmount += positiveAmount;
        categoryObj.totalAmount = parseFloat(categoryObj.totalAmount.toFixed(2));

        // Recalculate the totalAmountSpent for the month
        monthObj.totalAmountSpent = monthObj.categories.reduce((total, category) => total + category.totalAmount, 0);
        monthObj.totalAmountSpent = parseFloat(monthObj.totalAmountSpent.toFixed(2));
    });

    // Prepare data for Chart.js
    const months = [];
    const totalSpentByMonth = [];
    const categoryTotals = {};
    
    expenses.forEach(yearObj => {
        yearObj.months.forEach(monthObj => {
            months.push(monthObj.name);
            totalSpentByMonth.push(monthObj.totalAmountSpent);
            
            monthObj.categories.forEach(category => {
                if (!categoryTotals[category.type]) {
                    categoryTotals[category.type] = [];
                }
                // Initialize missing months with 0
                while (categoryTotals[category.type].length < months.length - 1) {
                    categoryTotals[category.type].push(0);
                }
                categoryTotals[category.type].push(category.totalAmount);
            });
        });
    });

    // Fill missing months for each category
    Object.keys(categoryTotals).forEach(category => {
        while (categoryTotals[category].length < months.length) {
            categoryTotals[category].push(0);
        }
    });

    // Reverse the order of months and data arrays to have the oldest on the left
    months.reverse();
    totalSpentByMonth.reverse();
    Object.keys(categoryTotals).forEach(category => {
        categoryTotals[category].reverse();
    });

    const datasets = Object.keys(categoryTotals).map((category, index) => ({
        label: category,
        data: categoryTotals[category],
        // Use predefined colors
        backgroundColor:  colorPalette[index], 
        stack: 'stack1'
    }));

    return {
        labels: months,
        datasets: datasets.concat([{
            label: 'Celkovo minuté',
            data: totalSpentByMonth,
            borderColor: '#ff621c',
            backgroundColor: '#ff621c',
            type: 'line'
        }])
    };
}

// Function to find common string patterns in lines and return sorted patterns with counts
function findCommonPatterns(lines) {
    const patternCounts = {};

    lines.forEach((line, index) => {
        // Check if the line matches the date format (dd.mm.yyyy)
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(line.trim())) {
            // Get the words from the line three lines after the date line
            const words = lines[index + 3].split(/\s+/);
            words.forEach(word => {
                // Check if the word contains only letters and is longer than 4 characters
                if (/^[a-zA-Z]+$/.test(word) && word.length > 4) {
                    patternCounts[word] = (patternCounts[word] || 0) + 1;
                }
            });
        }  
    });

    // Sort patterns by count in descending order and return the result
    const sortedPatterns = Object.entries(patternCounts)
        .sort(([, a], [, b]) => b - a)
        .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});

    return sortedPatterns;
}

module.exports = { addExpense, categories, findCategory, containsPattern, findCommonPatterns };

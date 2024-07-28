const fs = require("fs").promises;
const path = require('path');

async function writeToFile(data, filename) {
  // Pretty print JSON with 2 spaces for indentation  
  const dataString = JSON.stringify(data, null, 2);

    try {
        await fs.writeFile(filename, dataString, 'utf8');
        console.log("Data successfully written to", filename);
    } catch (err) {
        console.error("Error writing to file", err);
    }
}

// Function to generate chart.js HTML based on expenses data
function generateChartHtml(data) {
  const labels = JSON.stringify(data.labels);
  const datasets = JSON.stringify(data.datasets);

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Výdaje</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      canvas {
        max-width: 100%;
        height: 400px;
      }
    </style>
  </head>
  <body>
    <canvas id="myChart"></canvas>
    <script>
      const ctx = document.getElementById("myChart").getContext("2d");
      const myChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ${labels},
          datasets: ${datasets}
        },
        options: {
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
            },
          },
          plugins: {
            legend: {
              position: "top",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) {
                    label += ": ";
                  }
                  if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(2);
                  }
                  return label;
                },
              },
            },
          },
        },
      });
    </script>
  </body>
</html>
  `;
}

async function generateHtml(filePath) {
  try {
    const jsonData = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(jsonData);
    const htmlContent = generateChartHtml(data);

    // Write the generated HTML to a file
    await fs.writeFile(path.join(__dirname, 'vydaje.html'), htmlContent, 'utf8');
    console.log('HTML file has been generated successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

module.exports = { writeToFile, generateHtml };
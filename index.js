

const moment = require('moment');
const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = 3000;

app.use(express.json());

let startupsData = [];
let filteredData = [];

// Read CSV file with startup data



app.get('/api/startups/filter', (req, res) => {
  
    const filterTerm = req.query.term.toLowerCase();
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 12; 
  
    fs.createReadStream('startup_funding.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (startupsData.some((item) => item.StartupName === row.StartupName)) {
          if (!startupsData.some((item) => item.IndustryVertical === row.IndustryVertical)) {
            startupsData.push(row);
          }
        } else {
          startupsData.push(row);
        }
      })
      .on('end', () => {
       
  
        if (filterTerm === 'all' && startupsData.length > 0) {
          filteredData = startupsData;
        } else {
          filteredData = startupsData.filter((startup) =>
            startup.IndustryVertical.toLowerCase().includes(filterTerm)
          );
        }
  
        // Apply pagination logic
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const datacount = filteredData.length;
        const paginatedData = filteredData.slice(startIndex, endIndex);
      
        
  
        res.json({ data: paginatedData, datacount:datacount });
      });
  });
  


// Add new startup data to CSV file
app.post('/api/startups', (req, res) => {
  const newStartup = req.body;

  // Read existing data from CSV file to get the last serial number
  fs.createReadStream('startup_funding.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (!startupsData.some((item) => item.StartupName === row.StartupName)) {
        startupsData.push(row);
      }
    })
    .on('end', () => {
      // Generate a new serial number for the new row
      const lastSerialNumber = startupsData.length > 0 ? startupsData[startupsData.length - 1].SNo : 0;
      const newSerialNumber = parseInt(lastSerialNumber) + 1;
      console.log(newSerialNumber);

      const formattedDate = moment(newStartup.Date).format('DD/MM/YYYY');
      
      
      const newStartupCSV = `${newSerialNumber},${formattedDate},${newStartup.StartupName},${newStartup.IndustryVertical},${newStartup.SubVertical},${newStartup.CityLocation},${newStartup.InvestorsName},${newStartup.InvestmentType},"${newStartup.AmountInUSD}M",${newStartup.Remarks}\n`;

      fs.appendFile('startup_funding.csv', newStartupCSV, (err) => {
        if (err) {
          res.status(500).json({ error: 'Error writing to CSV file' });
        } else {
          res.json({ success: true });
        }
      });
    });
});






app.get('/api/startups/search', (req, res) => {
  const searchTerm = req.query.term.toLowerCase();
  let filteredData = startupsData.filter((startup) => startup.StartupName.toLowerCase().includes(searchTerm));
  res.json(filteredData);
});



app.get('/api/startups/subverticals', (req, res) => {
    const uniqueSubVerticals = Array.from(new Set(startupsData.map(item => item.IndustryVertical)));
    res.json(uniqueSubVerticals);
  });



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const fs = require('fs');
const https = require('https');

// Simple script to fetch and save disposable domains
const urls = [
  'https://raw.githubusercontent.com/disposable/disposable/master/domains.txt',
  'https://raw.githubusercontent.com/groundcat/disposable-email-domain-list/master/list.txt'
];

async function fetchDomains() {
  const allDomains = new Set();
  
  for (const url of urls) {
    try {
      console.log(`Fetching from ${url}...`);
      const content = await download(url);
      const domains = content.split('\n')
        .map(d => d.trim().toLowerCase())
        .filter(d => d && d.includes('.') && !d.startsWith('#'));
      
      domains.forEach(d => allDomains.add(d));
      console.log(`Added ${domains.length} domains`);
    } catch (error) {
      console.warn(`Failed to fetch ${url}: ${error.message}`);
    }
  }
  
  const sortedDomains = Array.from(allDomains).sort();
  fs.writeFileSync('disposable-domains.txt', sortedDomains.join('\n'));
  console.log(`\nSaved ${sortedDomains.length} unique domains to disposable-domains.txt`);
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

fetchDomains().catch(console.error);


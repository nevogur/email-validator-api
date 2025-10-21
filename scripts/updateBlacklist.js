const fs = require('fs');
const https = require('https');
const path = require('path');

// URLs for disposable email domain lists
const DISPOSABLE_LISTS = [
  {
    name: 'disposable-domains-txt',
    url: 'https://raw.githubusercontent.com/disposable/disposable/master/domains.txt',
    format: 'txt'
  },
  {
    name: 'groundcat-list',
    url: 'https://raw.githubusercontent.com/groundcat/disposable-email-domain-list/master/list.txt',
    format: 'txt'
  },
  {
    name: 'stopforumspam-domains',
    url: 'https://www.stopforumspam.com/downloads/toxic_domains_whole.txt',
    format: 'txt'
  }
];

/**
 * Download content from URL
 * @param {string} url - URL to download from
 * @returns {Promise<string>} - Downloaded content
 */
function downloadFromUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Parse domains from different formats
 * @param {string} content - Raw content
 * @param {string} format - Content format (json, txt)
 * @returns {Array<string>} - Array of domains
 */
function parseDomains(content, format) {
  const domains = new Set();

  if (format === 'json') {
    try {
      const jsonData = JSON.parse(content);
      if (Array.isArray(jsonData)) {
        jsonData.forEach(domain => {
          if (typeof domain === 'string' && domain.includes('.')) {
            domains.add(domain.toLowerCase().trim());
          }
        });
      }
    } catch (error) {
      console.warn('Failed to parse JSON:', error.message);
    }
  } else if (format === 'txt') {
    const lines = content.split('\n');
    lines.forEach(line => {
      const domain = line.trim().toLowerCase();
      if (domain && domain.includes('.') && !domain.startsWith('#')) {
        domains.add(domain);
      }
    });
  }

  return Array.from(domains);
}

/**
 * Update the blacklist in emailValidator.js
 * @param {Array<string>} domains - Array of domains to add
 */
function updateEmailValidator(domains) {
  const emailValidatorPath = path.join(__dirname, '..', 'emailValidator.js');
  let content = fs.readFileSync(emailValidatorPath, 'utf8');

  // Sort domains for better readability
  const sortedDomains = domains.sort();

  // Create the new DISPOSABLE_DOMAINS Set
  const newDomainsSet = `const DISPOSABLE_DOMAINS = new Set([\n${sortedDomains.map(domain => `  '${domain}'`).join(',\n')}\n]);`;

  // Replace the existing DISPOSABLE_DOMAINS definition
  const domainsRegex = /const DISPOSABLE_DOMAINS = new Set\(\[[\s\S]*?\]\);/;
  content = content.replace(domainsRegex, newDomainsSet);

  // Add comment with update timestamp
  const timestamp = new Date().toISOString();
  const commentRegex = /(\/\/ Common disposable email domains)/;
  content = content.replace(commentRegex, `// Common disposable email domains (Updated: ${timestamp})`);

  fs.writeFileSync(emailValidatorPath, content);
  console.log(`✅ Updated emailValidator.js with ${domains.length} disposable domains`);
}

/**
 * Save domains to a separate JSON file for reference
 * @param {Array<string>} domains - Array of domains
 */
function saveDomainsToFile(domains) {
  const domainsPath = path.join(__dirname, '..', 'data', 'disposable-domains.json');
  
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(domainsPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const data = {
    domains: domains.sort(),
    count: domains.length,
    lastUpdated: new Date().toISOString(),
    sources: DISPOSABLE_LISTS.map(list => list.name)
  };

  fs.writeFileSync(domainsPath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved ${domains.length} domains to data/disposable-domains.json`);
}

/**
 * Main function to update blacklist
 */
async function updateBlacklist() {
  console.log('🔄 Starting disposable email domains update...\n');

  const allDomains = new Set();
  let totalDownloaded = 0;

  for (const list of DISPOSABLE_LISTS) {
    try {
      console.log(`📥 Downloading from ${list.name}...`);
      const content = await downloadFromUrl(list.url);
      const domains = parseDomains(content, list.format);
      
      console.log(`   Found ${domains.length} domains`);
      domains.forEach(domain => allDomains.add(domain));
      totalDownloaded += domains.length;
    } catch (error) {
      console.warn(`❌ Failed to download from ${list.name}: ${error.message}`);
    }
  }

  const uniqueDomains = Array.from(allDomains);
  console.log(`\n📊 Summary:`);
  console.log(`   Total domains downloaded: ${totalDownloaded}`);
  console.log(`   Unique domains: ${uniqueDomains.length}`);

  if (uniqueDomains.length > 0) {
    // Update the emailValidator.js file
    updateEmailValidator(uniqueDomains);
    
    // Save to separate file for reference
    saveDomainsToFile(uniqueDomains);
    
    console.log('\n✅ Blacklist update completed successfully!');
  } else {
    console.log('\n❌ No domains found. Update failed.');
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateBlacklist().catch(console.error);
}

module.exports = { updateBlacklist, downloadFromUrl, parseDomains };

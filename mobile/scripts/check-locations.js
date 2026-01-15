// scripts/check-locations.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 1. CONFIGURATION
function readAppConfig() {
  const appJsonPath = path.join(__dirname, '..', 'app.json'); // Adjust path as needed
  try {
    const raw = fs.readFileSync(appJsonPath, 'utf8');
    const app = JSON.parse(raw);
    const extra = (app && app.expo && app.expo.extra) || {};
    return {
      geonamesUser: extra.geonamesUsername || 'demo', // Make sure you have a valid user enabled for webservices!
    };
  } catch (e) {
    return { geonamesUser: 'demo' };
  }
}

// 2. FETCH HELPERS
async function fetchGeonames(endpoint, params) {
  try {
    const { data } = await axios.get(`https://secure.geonames.org/${endpoint}`, { params });
    return data;
  } catch (e) {
    console.error(`API Error (${endpoint}):`, e.message);
    return null;
  }
}

// 3. CORE LOGIC
async function getGovernorateId(govName, user) {
  // Find the ADM1 (Governorate) ID
  const data = await fetchGeonames('searchJSON', {
    name_equals: govName,
    country: 'TN',
    featureCode: 'ADM1',
    maxRows: 1,
    username: user
  });
  return data?.geonames?.[0]?.geonameId || null;
}

async function getDelegations(govId, user) {
  // Get all children of the Governorate (Strictly ADM2)
  const data = await fetchGeonames('childrenJSON', {
    geonameId: govId,
    username: user
  });
  
  return (data?.geonames || [])
    .filter(x => x.fcode === 'ADM2') // Filter strictly for Delegations
    .map(x => ({ name: x.name, id: x.geonameId }));
}

async function getLocalities(delegationId, user) {
  // Get children of the Delegation (ADM3 Sectors or Populated Places)
  const data = await fetchGeonames('childrenJSON', {
    geonameId: delegationId,
    username: user
  });

  const children = data?.geonames || [];

  // Priority 1: ADM3 (Imada/Sectors) - Most accurate for Tunisia
  let localities = children
    .filter(x => x.fcode === 'ADM3')
    .map(x => x.name);

  // Priority 2: PPL (Populated Places) - Use if no sectors found
  if (localities.length === 0) {
    localities = children
      .filter(x => x.fcode.startsWith('PPL'))
      .map(x => x.name);
  }

  return [...new Set(localities)]; // Remove duplicates
}

// 4. MAIN EXECUTION
(async () => {
  const cfg = readAppConfig();
  const govName = process.argv[2] || 'Tunis';

  console.log(`\n--- Processing ${govName} ---`);

  // Step A: Get Governorate ID
  const govId = await getGovernorateId(govName, cfg.geonamesUser);
  if (!govId) {
    console.error('❌ Governorate not found in GeoNames.');
    return;
  }

  // Step B: Get Delegations (Level 2)
  console.log('Fetching delegations...');
  const delegationsRaw = await getDelegations(govId, cfg.geonamesUser);
  console.log(`✓ Found ${delegationsRaw.length} delegations.`);

  const result = {
    governorate: govName,
    // We map the database "Delegation" to your requested label "City" 
    // IF you really want that naming, otherwise keep it standard.
    // Standard Naming: Delegations -> Localities
    delegations: [] 
  };

  // Step C: Get Localities for each Delegation (Level 3)
  for (const del of delegationsRaw) {
    process.stdout.write(`   Fetching localities for ${del.name}... `);
    const locs = await getLocalities(del.id, cfg.geonamesUser);
    process.stdout.write(`${locs.length} found.\n`);

    result.delegations.push({
      name: del.name,     // The Delegation Name (e.g., Bab El Bhar)
      cities: locs        // The Sectors/Localities inside it (e.g., Lafayette)
    });
  }

  // 5. SAVE OUTPUT
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, `${govName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  
  console.log(`\n✅ Done! Saved to ${outputPath}`);
})();
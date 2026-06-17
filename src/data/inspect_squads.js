const fs = require('fs');
const squads = JSON.parse(fs.readFileSync('c:/Users/DELL/OneDrive/Desktop/worldcup-2026/src/data/current_squads.json', 'utf8'));

console.log('Total nations in JSON:', squads.length);
squads.forEach(n => {
  console.log(`- ${n.name} (id: ${n.id}): ${n.squad.length} players`);
});

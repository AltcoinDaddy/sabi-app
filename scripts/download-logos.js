import fs from 'fs';
import path from 'path';
import https from 'https';

const teams = {
  'Arsenal': 'arsenal.com',
  'Chelsea': 'chelseafc.com',
  'Man City': 'mancity.com',
  'Liverpool': 'liverpoolfc.com',
  'Man United': 'manutd.com',
  'Tottenham': 'tottenhamhotspur.com',
  'Aston Villa': 'avfc.co.uk',
  'Newcastle': 'nufc.co.uk'
};

const dir = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

async function downloadLogo(team, domain) {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const dest = path.join(dir, `${team.replace(' ', '_').toLowerCase()}.png`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.log(`Failed to download ${team}: ${res.statusCode}`);
        resolve();
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${team} logo.`);
        resolve();
      });
    }).on('error', (err) => {
      console.log(`Error downloading ${team}: ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  console.log('Downloading team logos...');
  for (const [team, domain] of Object.entries(teams)) {
    await downloadLogo(team, domain);
  }
  console.log('Done!');
}

main();

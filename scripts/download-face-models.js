const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'models');

const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
];

// Create models directory if it doesn't exist
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log('Created models directory:', PUBLIC_DIR);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadAllModels() {
  console.log('Downloading face-api.js models...\n');
  
  for (const model of MODELS) {
    const url = `${MODEL_BASE_URL}/${model}`;
    const dest = path.join(PUBLIC_DIR, model);
    
    try {
      await downloadFile(url, dest);
    } catch (error) {
      console.error(`Error downloading ${model}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✓ All models downloaded successfully!');
  console.log(`Models saved to: ${PUBLIC_DIR}`);
}

downloadAllModels();

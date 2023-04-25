const output = document.getElementById('output');
const decodedKeyOutput = document.getElementById('decodedKeyOutput');
const decodeKeyButton = document.getElementById('decodeKey');
const keyVisualizationCanvas = document.getElementById('keyVisualization');
const gridWidth = 32;
const gridHeight = 16;
const entropyBuffer = new Uint8Array(gridWidth * gridHeight);

let key;
let entropyCount = 0;

async function generateKey() {
  const newKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const keyData = await crypto.subtle.exportKey('raw', newKey);
  const keyArray = new Uint8Array(keyData);
  const base64Key = btoa(String.fromCharCode(...keyArray));

  console.log('Generated key:', keyArray);

  return base64Key;
}

function displayOutput() {
  let noiseVisualization = '';
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      noiseVisualization += (entropyBuffer[y * gridWidth + x] % 2) ? '1' : '0';
    }
    noiseVisualization += '\n';
  }

  output.textContent = `Key: ${key ? key : 'Generating...'}
Entropy collected: ${entropyCount}
Noise visualization:
${noiseVisualization}`;
}

function decodeKey() {
  if (!key) {
    decodedKeyOutput.textContent = 'No key to decode.';
    return;
  }

  const decodedKeyArray = new Uint8Array(atob(key).split('').map(char => char.charCodeAt(0)));
  const decodedKeyHex = Array.from(decodedKeyArray, byte => byte.toString(16).padStart(2, '0')).join(' ');

  decodedKeyOutput.textContent = `Decoded Key (hex): ${decodedKeyHex}`;
  drawKeyVisualization(decodedKeyArray);
}

function drawKeyVisualization(decodedKeyArray) {
  const ctx = keyVisualizationCanvas.getContext('2d');
  const cellSize = 16;
  const numRows = 4;
  const numCols = 8;

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const byte = decodedKeyArray[row * numCols + col];
      const color = `hsl(${(byte / 255) * 360}, 50%, 50%)`;

      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  console.log('Decoded key visualization drawn:', decodedKeyArray);
}

async function handleMouseMove(event) {
  const x = event.clientX % gridWidth;
  const y = event.clientY % gridHeight;
  entropyBuffer[y * gridWidth + x]++;

  entropyCount++;

  if (entropyCount >= gridWidth * gridHeight) {
    key = await generateKey();
    console.log('Key generated after entropy collection:', key);
    entropyCount = 0;
  }

  displayOutput();
}

document.body.addEventListener('mousemove', handleMouseMove);
decodeKeyButton.addEventListener('click', decodeKey);

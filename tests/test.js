const bufferData = [10,63,10,16,112,67,111,109,109,97,110,100,67,111,110,116,114,97,99,116,18,43,8,0,24,0,34,37,83,69,76,69,67,84,32,84,79,80,32,48,32,42,32,70,82,79,77,32,66,51,48,66,105,122,68,111,99,68,101,116,97,105,108,83,79]
// Step 2: Create a Buffer from this array and decode it
const messageBuffer = Buffer.from(bufferData);
const decodedMessage = messageBuffer.toString('utf-8');

console.log("Decoded Message:", decodedMessage);
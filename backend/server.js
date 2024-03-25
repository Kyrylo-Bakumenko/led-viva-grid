const express = require('express');
const multer = require('multer');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const Jimp = require('jimp');
const { GifUtil, GifFrame } = require('gifwrap');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const MATRIX_WIDTH = 32; // LED Matrix Dimensions
const MATRIX_HEIGHT = 32;// this is used for resizing
const UPLOAD_PATH = 'uploads/';
const IMAGE_FILENAME = 'currentImage'; // only logs one type of file to avoid storage issues

// setup storage using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, IMAGE_FILENAME + ext);
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// log when a client connects
wss.on('connection', function connection(ws) {
  console.log('WebSocket client connected');
});

// POST request
app.post('/upload', upload.single('image'), async (req, res) => {
    const imagePath = path.join(UPLOAD_PATH, req.file.filename);
    const ext = path.extname(req.file.originalname).toLowerCase();
  
    try {
      // reset message to clear previous frames/data on the ESP32
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({reset: true}));
        }
      });
  
      // delay, makes sure the reset message is processed first
      await new Promise(resolve => setTimeout(resolve, 100));
  
      let frames = [];
      if (ext === '.gif') {
        const gif = await GifUtil.read(imagePath);
        frames = gif.frames;
      } else {
        const image = await Jimp.read(imagePath);
        const frame = new GifFrame(image.bitmap.width, image.bitmap.height, image.bitmap.data);
        frames = [frame];
      }
  
      frames.forEach(async (frame, index) => {
        const jimpImage = await GifUtil.copyAsJimp(Jimp, frame); // converts PNG & JPG to JIMP
        jimpImage.resize(MATRIX_WIDTH, MATRIX_HEIGHT);    
  
        let rgbArray = [];
        jimpImage.scan(0, 0, jimpImage.bitmap.width, jimpImage.bitmap.height, function(x, y, idx) {
          const red = this.bitmap.data[idx + 0];
          const green = this.bitmap.data[idx + 1];
          const blue = this.bitmap.data[idx + 2];
          rgbArray.push([red, green, blue]);
        });
  
        // send frame to each client (the ESP32)
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({frameIndex: index, data: rgbArray}));
          }
        });
      });
  
      res.send('Image processed and frames sent to ESP32');
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).send('Error processing image');
    }
  });
  

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

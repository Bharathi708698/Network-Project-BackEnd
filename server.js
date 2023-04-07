// import required modules and libraries
const { exec } = require('child_process');
const express = require('express');
const app = express();
const os = require('os');
const network = require('network');
const { spawn } = require('child_process');
const dotenv = require('dotenv').config();





// enable CORS for requests coming from http://localhost:3000
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// define a variable to hold system information
const systemInfo = {
  brand: os.cpus()[0].model.split(' ')[0],
  model: os.hostname(),
  ramType: os.type(),
  ramSize: `${(os.totalmem() / (1024 ** 3)).toFixed(2)}GB`,
  ramUsage: `${((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2)}GB`,
  totalStorage: `${(os.totalmem() / (1024 ** 3)).toFixed(2)}GB`,
  freeStorage: `${(os.freemem() / (1024 ** 3)).toFixed(2)}GB`,
  usedStorage: `${((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2)}GB`,
  processorModel: os.cpus()[0].model,
  processorSpeed: os.cpus()[0].speed,
  osName: os.type(),
  osVersion: os.release(),
  cpuUsage: Math.round(os.loadavg()[0] * 100) / 100,
  userName: os.userInfo().username,
  osBitType: os.arch()
};

// handle GET requests for system information endpoint
app.get('/api/system-info', (req, res) => {
  res.json(systemInfo);
});

// handle GET requests for network information endpoint
app.get('/api/network-info', async (req, res) => {
  try {
    const networkInfo = {};

    // Retrieve the IP address and subnet mask
    const interfaces = os.networkInterfaces();
    Object.keys(interfaces).forEach((iface) => {
      interfaces[iface].forEach((address) => {
        if (address.family === 'IPv4' && !address.internal) {
          networkInfo.ipAddress = address.address;
          networkInfo.subnetMask = address.netmask;
        }
      });
    });

    // Retrieve the default gateway
    const ip = await new Promise((resolve, reject) => {
      network.get_gateway_ip((error, ip) => {
        if (error) {
          reject(error);
        } else {
          resolve(ip);
        }
      });
    });
    networkInfo.gateway = ip;

    // Ping the IP address
    const pingResult = await new Promise((resolve, reject) => {
      exec(`ping ${networkInfo.ipAddress}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });

    // send the result back as json
    res.json({
      ...networkInfo,
      pingResult
    });
  } catch (error) {
    console.error(error);

    // handle errors gracefully
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});



app.get('/api/ping', async (req, res) => {
  const ipAddress = '10.44.95.1'; // replace this with the IP address of the API you want to ping

  const ping = spawn('ping', ['-c', '1', ipAddress]);
  let commandOutput = '';

  ping.on('close', (code) => {
    if (code === 0 || code === 1) {
      if (commandOutput.includes('100% packet loss')) {
        res.json({ status: 'success', output: commandOutput, message: 'Host did not respond to ping' });
      } else {
        res.json({ status: 'success', output: commandOutput });
      }
    } else {
      res.status(500).json({ status: 'fail', error: `Ping failed with code ${code}` });
    }
  });

  ping.on('error', (error) => {
    res.status(500).json({ status: 'error', error: error.message });
  });

  ping.stdout.on('data', (data) => {
    commandOutput += data.toString();
  });
});



// set up server to listen on a specific port
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is listening on port ${port}...`));

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const CHECKBOX_FILE = path.join(__dirname, 'checkboxes.save');
const TOTAL_CHECKS_FILE = path.join(__dirname, 'total-checks.save');

const CHECKBOX_COUNT = 100;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const readCheckboxState = async () => {
  try {
    const data = await fs.readFile(CHECKBOX_FILE, 'utf8');
    const state = BigInt(`0b${data}`);
    return state;
  } catch (error) {
    console.error('Error reading checkbox file:', error);
    return BigInt(0);
  }
};

const writeCheckboxState = async (state) => {
  try {
    const binaryString = state.toString(2).padStart(CHECKBOX_COUNT, '0');
    await fs.writeFile(CHECKBOX_FILE, binaryString);
  } catch (error) {
    console.error('Error writing checkbox file:', error);
  }
};

const readFile = async (path) => {
  try {
    const data = await fs.readFile(path, 'utf8');
    return data;
  } catch (error) {
    console.error('Error reading file:', error);
    return '0';
  }
};

const writeFile = async (path, data) => {
  try {
    await fs.writeFile(path, data);
  } catch (error) {
    console.error('Error writing file:', error);
  }
};

const readTotalChecks = async () => {
  const data = await readFile(TOTAL_CHECKS_FILE);
  return parseInt(data, 10) || 0;
};

const writeTotalChecks = async (total) => {
  await writeFile(TOTAL_CHECKS_FILE, total.toString());
};

app.get('/', async (req, res) => {
  try {
        const state = await readCheckboxState();
        const checkboxes = Array.from({ length: CHECKBOX_COUNT }, (_, i) => (state >> BigInt(i) & BigInt(1)) === BigInt(1));
        res.render('index', { checkboxes, totalChecks: await readTotalChecks() });
    } catch (error) {
        res.render('index', { checkboxes: new Array(CHECKBOX_COUNT).fill(false), totalChecks: 0 }); // return default state | fallback
    }
});

io.on('connection', (socket) => {
  socket.on('checkbox-change', async (data) => {
    try {
        const state = await readCheckboxState();
        const bit = BigInt(1) << BigInt(data.id);
        const newState = data.checked ? (state | bit) : (state & ~bit);

        await writeCheckboxState(newState);

        const currentTotal = await readTotalChecks();
        const newTotal = data.checked ? currentTotal + 1 : currentTotal;
        await writeTotalChecks(newTotal);


        io.emit('checkbox-change', { ...data, totalChecks: newTotal });
        } catch (error) {
        console.error('Error handling checkbox-change event:', error);
        }
    });

    socket.on('disconnect', () => {
        // nothing needed here ngl
    });
});



const PORT = 6969;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

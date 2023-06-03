const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const getVideoDuration = require('get-video-duration');

const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

// Create a new SQLite database connection
const db = new sqlite3.Database('data.db');

// Create the tables if they don't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  videoName TEXT,
  videoType TEXT,
  startTime TEXT,
  endTime TEXT,
  videoLength TEXT,
  videoLocation TEXT
)`);

// Function to insert a new user into the database
function insertUser(name, email) {
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('User inserted successfully.');
  });
}

// Function to fetch all users from the database
function fetchUsers() {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    mainWindow.webContents.send('usersData', rows);
  });
}

// Function to insert a new video into the database
async function insertVideo(videoName, videoType, startTime, endTime, videoLocation = null) {
  let videoLength = null;

  try {
    if (videoLocation) {
      videoLength = await calculateVideoLength(videoLocation);
    }
  } catch (error) {
    console.error('Error calculating video length:', error);
  }

  db.run(
    'INSERT INTO videos (videoName, videoType, startTime, endTime, videoLength, videoLocation) VALUES (?, ?, ?, ?, ?, ?)',
    [videoName, videoType, startTime, endTime, videoLength, videoLocation],
    function (err) {
      if (err) {
        console.error(err);
        return;
      }
      console.log('Video inserted successfully.');
    }
  );
}

// Helper function to calculate video length based on video file location
async function calculateVideoLength(videoLocation) {
  return new Promise((resolve, reject) => {
    getVideoDuration(videoLocation)
      .then((duration) => {
        const formattedDuration = moment.duration(duration, 'seconds').format('HH:mm:ss', { trim: false });
        resolve(formattedDuration);
      })
      .catch((error) => {
        console.error('Error retrieving video duration:', error);
        resolve(null);
      });
  });
}


// Function to fetch all videos from the database
function fetchVideos() {
  db.all('SELECT * FROM videos', [], (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    mainWindow.webContents.send('videosData', rows);
  });
}

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    autoHideMenuBar: true,
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the developer tools in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Example usage: Insert a user
  insertUser('sahil', 'sahil@example.com');

  // Example usage: Fetch all users
  fetchUsers();
}

// Event handler when Electron has finished initialization
app.whenReady().then(createWindow);

// Handle IPC communication to insert user data into the database
ipcMain.on('userDataInsertion', (event, data) => {
  const { name, email } = data;
  insertUser(name, email);
});

// Handle IPC communication to insert video data into the database
ipcMain.on('videoDataInsertion', (event, data) => {
  const { videoName, videoType, startTime, endTime, videoLocation } = data;
  console.log('Video Location:', videoLocation); // Check the value of videoLocation
  insertVideo(videoName, videoType, startTime, endTime, videoLocation);
});

// Handle IPC communication to fetch user data from the database
ipcMain.on('fetchUsersData', () => {
  fetchUsers();
});

// Handle IPC communication to fetch video data from the database
ipcMain.on('fetchVideosData', () => {
  fetchVideos();
});

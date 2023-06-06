const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let programWindow;

// Create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    autoHideMenuBar: true,
  });
  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create the program window
function createProgramWindow() {
  programWindow = new BrowserWindow({
    title: 'Program',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    fullscreen: true,
    show: false,
    
  });

  programWindow.loadFile(path.join(__dirname, './renderer/program.html'));

  child1 = new BrowserWindow({
    parent: programWindow,
    width:  1200,
    height: 800,
  });
  child1.loadFile(path.join(__dirname, './renderer/vindeo-entries.html'));

  child2 = new BrowserWindow({
    parent: programWindow,
    width:  1200,
    height: 800,
  });
  child2.loadFile(path.join(__dirname, './renderer/slot-entries.html'));

  programWindow.on('closed', () => {
    programWindow = null;
  });
}

// App ready event
app.on('ready', () => {
  createMainWindow();

  // Event handler for opening the video entries window
  ipcMain.on('open-video-entries-window', () => {
    const videoEntriesWindow = new BrowserWindow({
      // Window options for the video entries window
    });

    videoEntriesWindow.loadFile('video-entries.html');

    // Fetch the data from the database and send it back to the video entries window
    const videoEntries = fetchVideoEntriesFromDatabase(); // Implement the function to fetch data from the database

    videoEntriesWindow.webContents.on('did-finish-load', () => {
      videoEntriesWindow.webContents.send('video-entries-data', videoEntries);
    });
  });
});

// Handle the event when the renderer process requests data
ipcMain.on('fetchData', (event) => {
  // Execute an SQL query to retrieve data
  db.all('SELECT * FROM uploads', (error, results) => {
    if (error) {
      // Handle error
      console.error(error);
      return;
    }

    // Send the query results to the renderer process
    event.reply('fetchedData', results);
  });
});



// Get upload list
ipcMain.on('getUploadList', (event) => {
  db.all(`SELECT * FROM uploads`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
    }
    event.reply('uploadList', rows);
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Activate the app (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

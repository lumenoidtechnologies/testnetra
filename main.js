const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

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

  // Open the developer tools in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create the program window
function createProgramWindow() {
  programWindow = new BrowserWindow({
    title: 'Program',
    width: isDev ? 1400 : 980,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    show: true,
  });

  if (isDev) {
    programWindow.webContents.openDevTools();
  }

  programWindow.loadFile(path.join(__dirname, './renderer/program.html'));

  child1 = new BrowserWindow({
    parent: programWindow,
    width: isDev ? 1400 : 980,
    height:800,
    //frame:false - borderless menuless
    
  })
  child1.loadFile(path.join(__dirname,'./renderer/vindeo-entries.html'));
 

  child2 = new BrowserWindow({
    parent: programWindow,
    width: isDev ? 1400 : 980,
    height:800,
    //frame:false - borderless menuless
    
  })
  child2.loadFile(path.join(__dirname,'./renderer/slot-entries.html'));
  

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

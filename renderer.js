window.$ = window.jQuery = require('jquery');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('videos.db');
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT,
      size INTEGER,
      date TEXT
    )
  `);
});
const videoForm = document.getElementById('videoForm');

videoForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const videoName = document.getElementById('videoName').value;
  const videoType = document.getElementById('videoType').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const date = document.getElementById('videoDate').value;
  const url = document.getElementById('url').value;

 
  

  db.serialize(() => {
    const selectQuery = db.prepare(
      `SELECT * FROM videos WHERE date = ? AND ((startTime <= ? AND endTime > ?) OR (startTime < ? AND endTime >= ?))`
    );

    selectQuery.all(date, startTime, startTime, endTime, endTime, (error, rows) => {
      if (error) {
        console.error('Error selecting data:', error.message);
      } else {
        if (rows.length > 0) {
          const errorMessage = 'Video time conflict. Please choose a different time slot.';
          console.error(errorMessage);
          dialog.showErrorBox('Error', errorMessage);
          return;
        }

        const insertQuery = db.prepare(
          `INSERT INTO videos (videoName, videoType, startTime, endTime, date, url) VALUES (?, ?, ?, ?, ?, ?)`
        );

        insertQuery.run(videoName, videoType, startTime, endTime, date, url, (error) => {
          if (error) {
            console.error('Error inserting data:', error.message);
          } else {
            console.log('Data inserted successfully!');
          }
        });

        insertQuery.finalize();
      }
    });

    selectQuery.finalize();
  });

  videoForm.reset();
});



const dropzone = new Dropzone("#dropzoneContainer", {
  url: "/",
  acceptedFiles: "video/*",
  autoProcessQueue: false,
});

dropzone.on("addedfile", function(file) {
  const formData = new FormData();
  formData.append("video", file);

  $.ajax({
    url: "http://localhost:3000/upload",
    method: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function(response) {
      console.log("File uploaded successfully");
      const fileUrl = `https://localhost:3000/${file.name}`;
      const fileSize = file.size;
      const uploadDate = new Date().toISOString();

      const videoData = {
        url: fileUrl,
        size: fileSize,
        date: uploadDate
      };

      // Perform SQLite CRUD operation here
      db.serialize(() => {
        db.run(
          `INSERT INTO uploads (url, size, date) VALUES (?, ?, ?)`,
          [videoData.url, videoData.size, videoData.date],
          function(error) {
            if (error) {
              console.error("Error inserting data:", error.message);
            } else {
              console.log("Data inserted successfully!");
            }
          }
        );
      });
    },
    error: function(error) {
      console.error("Error uploading file:", error);
    }
  });

  // Remove the file from the dropzone after processing
  dropzone.removeFile(file);
});
// Handle closing of the renderer window
window.addEventListener('beforeunload', () => {
  db.close();
});

// Create videos table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      videoName TEXT,
      videoType TEXT,
      startTime TEXT,
      endTime TEXT,
      date TEXT,
      url TEXT
    )
  `);
});


// Function to open the video entries window
function openVideoEntriesWindow() {
  ipcRenderer.send('open-video-entries-window');
}

// Event handler for receiving video entries data from the main process
ipcRenderer.on('video-entries-data', (event, videoEntries) => {
  // Generate HTML table rows using videoEntries data and append them to the table body
  const tableBody = document.getElementById('videoEntriesTableBody');

  videoEntries.forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.id}</td>
      <td>${entry.url}</td>
      <td>${entry.size}</td>
      <td>${entry.date}</td>
    `;
    tableBody.appendChild(row);
  });
});

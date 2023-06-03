const { ipcRenderer } = require('electron');

// Retrieve the HTML elements
const timelineContainer = document.getElementById('timelineContainer');
const videosList = document.getElementById('videosList');

// Fetch videos data from the main process
ipcRenderer.send('fetchVideosData');

// Receive the videos data from the main process and update the UI
ipcRenderer.on('videosData', (event, videos) => {
  // Clear the existing timeline and videos list
  timelineContainer.innerHTML = '';
  videosList.innerHTML = '';

  // Calculate the total length of the day in minutes
  const totalDayLength = 1440;

  // Calculate the width for each video file based on its duration
  videos.forEach((video) => {
    const { videoName, startTime, endTime } = video;

    // Calculate the duration of the video in minutes
    const duration = calculateDuration(startTime, endTime);

    // Calculate the width as a percentage
    const videoWidth = (duration / totalDayLength) * 100;

    // Create the video element
    const videoElement = document.createElement('div');
    videoElement.className = 'video';
    videoElement.style.width = `${videoWidth}%`;
    videoElement.textContent = videoName;

    // Append the video element to the timeline container
    timelineContainer.appendChild(videoElement);
  });

  // Update the videos list table
  createVideosListTable(videos);
});

// Function to calculate the duration between two time values in minutes
function calculateDuration(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':');
  const [endHour, endMinute] = endTime.split(':');

  const startTotalMinutes = parseInt(startHour) * 60 + parseInt(startMinute);
  const endTotalMinutes = parseInt(endHour) * 60 + parseInt(endMinute);

  return endTotalMinutes - startTotalMinutes;
}

// Function to create the videos list table
function createVideosListTable(videos) {
  // Create the table element
  const table = document.createElement('table');
  table.classList.add('table');

  // Create the table header
  const tableHeader = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = ['Video Name', 'Start Time', 'End Time', 'Duration'];

  headers.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });

  tableHeader.appendChild(headerRow);
  table.appendChild(tableHeader);

  // Create the table body
  const tableBody = document.createElement('tbody');
  videos.forEach((video) => {
    const row = document.createElement('tr');
    const { videoName, startTime, endTime } = video;

    const duration = calculateDuration(startTime, endTime);

    const columns = [videoName, startTime, endTime, `${duration} mins`];

    columns.forEach((column) => {
      const td = document.createElement('td');
      td.textContent = column;
      row.appendChild(td);
    });

    tableBody.appendChild(row);
  });

  table.appendChild(tableBody);

  // Append the table to the videosList container
  videosList.appendChild(table);
}

// Send IPC message to the main process to fetch videos data
ipcRenderer.send('fetchVideosData');

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const liveStream = document.getElementById('liveStream');
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    const videoStreamUrl = 'http://192.168.0.10:5000/cam-rpi';
    const connectionStatus = document.getElementById('connectionStatus');
    let retryTimeout;

    // Initialize video stream
    function initVideoStream() {
        console.log('Initializing video stream...');
        
        // Clear any pending retries
        clearTimeout(retryTimeout);
        
        // Hide placeholder and show stream
        videoPlaceholder.classList.add('hidden');
        liveStream.classList.remove('hidden');
        
        // Set image source with cache-busting parameter
        liveStream.src = videoStreamUrl + '?t=' + new Date().getTime();
        
        // Handle stream events
        liveStream.onload = () => {
            console.log('Stream connected');
            connectionStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>Connected</span>';
        };
        
        liveStream.onerror = (e) => {
            console.error('Stream error:', e);
            connectionStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span><span>Disconnected</span>';
            
            // Show placeholder
            liveStream.classList.add('hidden');
            videoPlaceholder.classList.remove('hidden');
            
            // Retry connection every 5 seconds
            retryTimeout = setTimeout(initVideoStream, 5000);
        };
    }

    // Rest of your alcohol sensor code remains exactly the same...
    /* ALCOHOL SENSOR CODE - KEEP EXISTING IMPLEMENTATION */
    const alcoholStatus = document.getElementById('alcoholStatus');
    const alcoholValue = document.getElementById('alcoholValue');
    const alcoholProgress = document.getElementById('alcoholProgress');
    const alcoholMessage = document.getElementById('alcoholMessage');
    const alcoholStreamUrl = 'http://192.168.0.10:5000/alcohol_trigger';

    function initAlcoholStream() {
      console.log('Initializing Air quality stream...');
      alcoholValue.textContent = '--%';
      alcoholStatus.textContent = 'Connecting...';

      const eventSource = new EventSource(alcoholStreamUrl);

      eventSource.onopen = () => {
        console.log('Air Quality stream connected');
        alcoholStatus.textContent = 'Connected';
        alcoholStatus.className = 'text-sm px-2 py-1 rounded-full bg-emerald-100 text-emerald-800';
      };

      eventSource.onmessage = function (event) {
        const data = event.data;
        console.log('Alcohol data received:', data);
        updateAlcoholStatus(data);
      };

      eventSource.onerror = function () {
        console.error('Alcohol stream connection error');
        alcoholStatus.textContent = 'Disconnected';
        alcoholStatus.className = 'text-sm px-2 py-1 rounded-full bg-red-100 text-red-800';
        alcoholMessage.textContent = 'Connection lost. Reconnecting...';
        alcoholMessage.className = 'mt-3 p-2 rounded-lg text-sm bg-yellow-100 text-yellow-800';
        alcoholMessage.classList.remove('hidden');

        eventSource.close();
        setTimeout(initAlcoholStream, 5000);
      };
    }

    function updateAlcoholStatus(data) {
      const match = data.match(/Alcohol: ([\d.]+)%/);
      if (match && match[1]) {
        const alcoholLevel = parseFloat(match[1]);
        alcoholValue.textContent = `${alcoholLevel.toFixed(1)}%`;
        alcoholProgress.style.width = `${Math.min(alcoholLevel * 20, 100)}%`;

        if (alcoholLevel >= 20.0) {
          alcoholProgress.className = 'bg-red-600 h-2 rounded-full';
          alcoholMessage.textContent = 'DANGER: High Smoke level detected!';
          alcoholMessage.className = 'mt-3 p-2 rounded-lg text-sm bg-red-100 text-red-800';
        } else if (alcoholLevel > 0.5) {
          alcoholProgress.className = 'bg-yellow-500 h-2 rounded-full';
          alcoholMessage.textContent = 'Warning: Smoke detected';
          alcoholMessage.className = 'mt-3 p-2 rounded-lg text-sm bg-yellow-100 text-yellow-800';
        } else if (alcoholLevel > 0.1) {
          alcoholProgress.className = 'bg-blue-500 h-2 rounded-full';
          alcoholMessage.textContent = 'Trace amounts detected';
          alcoholMessage.className = 'mt-3 p-2 rounded-lg text-sm bg-blue-100 text-blue-800';
        } else {
          alcoholProgress.className = 'bg-emerald-600 h-2 rounded-full';
          alcoholMessage.textContent = 'No Smoke detected';
          alcoholMessage.className = 'mt-3 p-2 rounded-lg text-sm bg-emerald-100 text-emerald-800';
        }
        alcoholMessage.classList.remove('hidden');
      }
    }
    /* END ALCOHOL SENSOR CODE */

    // Initialize everything
    console.log('Initializing application...');
    initVideoStream();
    initAlcoholStream();

    // Fullscreen button functionality
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        if (liveStream.requestFullscreen) {
            liveStream.requestFullscreen();
        } else if (liveStream.webkitRequestFullscreen) {
            liveStream.webkitRequestFullscreen();
        } else if (liveStream.msRequestFullscreen) {
            liveStream.msRequestFullscreen();
        }
    });
});
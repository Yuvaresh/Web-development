document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('drawing-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set explicit canvas size
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  // Initialize white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let isDrawing = false;
  let currentTool = 'pen'; // 'pen' or 'eraser'
  let strokeColor = '#000000';
  let lineWidth = 4;
  
  let currentStroke = [];
  let strokes = [];

  let startX = 0;
  let startY = 0;
  let snapshot = null;

  // Navigations
  const navHome = document.getElementById('nav-home');
  const navMusics = document.getElementById('nav-musics');
  const navTrending = document.getElementById('nav-trending');
  
  const homeView = document.getElementById('home-view');
  const musicsView = document.getElementById('musics-view');
  const trendingView = document.getElementById('trending-view');
  
  const allNavs = [navHome, navMusics, navTrending];
  const allViews = [homeView, musicsView, trendingView];

  function switchView(activeNav, activeView) {
    allNavs.forEach(nav => nav.classList.remove('active'));
    activeNav.classList.add('active');
    allViews.forEach(view => view.classList.add('hidden'));
    activeView.classList.remove('hidden');
  }

  navHome.addEventListener('click', (e) => { e.preventDefault(); switchView(navHome, homeView); });
  navMusics.addEventListener('click', (e) => { e.preventDefault(); switchView(navMusics, musicsView); renderMusicsLists(); });
  navTrending.addEventListener('click', (e) => { e.preventDefault(); switchView(navTrending, trendingView); renderMusicsLists(); });

  // Tools
  const penBtn = document.getElementById('pen-btn');
  const eraserBtn = document.getElementById('eraser-btn');
  const fillBtn = document.getElementById('fill-btn');
  const rectBtn = document.getElementById('rect-btn');
  const circleBtn = document.getElementById('circle-btn');
  const clearBtn = document.getElementById('clear-btn');
  const submitBtn = document.getElementById('submit-btn');
  const colorPicker = document.getElementById('color-picker');
  const brushSize = document.getElementById('brush-size');
  
  const toolsBtns = { 'pen': penBtn, 'eraser': eraserBtn, 'fill': fillBtn, 'rect': rectBtn, 'circle': circleBtn };
  
  Object.keys(toolsBtns).forEach(toolId => {
    toolsBtns[toolId].addEventListener('click', () => {
      currentTool = toolId;
      Object.values(toolsBtns).forEach(btn => btn.classList.remove('active'));
      toolsBtns[toolId].classList.add('active');
    });
  });

  colorPicker.addEventListener('input', (e) => {
    strokeColor = e.target.value;
    if (currentTool === 'eraser') {
      penBtn.click();
    }
  });

  function hexToRgba(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16), a: 255 } : {r: 0, g: 0, b:0, a:255};
  }

  function floodFill(startX, startY, fillColorHex) {
    const fillColor = hexToRgba(fillColorHex);
    const colorLayer = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = colorLayer.data;
    const startPos = (startY * canvas.width + startX) * 4;
    const startColor = { r: pixelData[startPos], g: pixelData[startPos+1], b: pixelData[startPos+2], a: pixelData[startPos+3] };
    if (startColor.r === fillColor.r && startColor.g === fillColor.g && startColor.b === fillColor.b) return;
    const matchStartColor = (pos) => (pixelData[pos] === startColor.r && pixelData[pos+1] === startColor.g && pixelData[pos+2] === startColor.b && pixelData[pos+3] === startColor.a);
    const colorPixel = (pos) => { pixelData[pos] = fillColor.r; pixelData[pos+1] = fillColor.g; pixelData[pos+2] = fillColor.b; pixelData[pos+3] = fillColor.a; };
    const pixelStack = [[startX, startY]];
    while (pixelStack.length) {
      const newPos = pixelStack.pop();
      const x = newPos[0];
      let y = newPos[1];
      let pixelPos = (y * canvas.width + x) * 4;
      while (y-- >= 0 && matchStartColor(pixelPos)) { pixelPos -= canvas.width * 4; }
      pixelPos += canvas.width * 4;
      ++y;
      let reachLeft = false; let reachRight = false;
      while (y++ < canvas.height - 1 && matchStartColor(pixelPos)) {
        colorPixel(pixelPos);
        if (x > 0) {
          if (matchStartColor(pixelPos - 4)) {
            if (!reachLeft) { pixelStack.push([x - 1, y]); reachLeft = true; }
          } else if (reachLeft) { reachLeft = false; }
        }
        if (x < canvas.width - 1) {
          if (matchStartColor(pixelPos + 4)) {
            if (!reachRight) { pixelStack.push([x + 1, y]); reachRight = true; }
          } else if (reachRight) { reachRight = false; }
        }
        pixelPos += canvas.width * 4;
      }
    }
    ctx.putImageData(colorLayer, 0, 0);
  }
  
  brushSize.addEventListener('input', (e) => {
    lineWidth = e.target.value;
  });
  
  // Results view elements
  const initialView = document.getElementById('initial-view');
  const loadingView = document.getElementById('loading-view');
  const resultView = document.getElementById('result-view');
  const emotionText = document.getElementById('emotion-text');
  const songList = document.getElementById('song-list');
  
  // Event Listeners for Drawing
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Touch support
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    if(e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
  }

  function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
  }

  function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    startX = Math.floor(pos.x);
    startY = Math.floor(pos.y);
    
    if (currentTool === 'pen') {
      currentStroke = [{x: pos.x, y: pos.y, color: strokeColor}];
    }
    
    if (currentTool === 'fill') {
      floodFill(startX, startY, strokeColor);
      let pStroke = [];
      for(let i=0; i<30; i++) pStroke.push({x: startX, y: startY, color: strokeColor});
      strokes.push(pStroke); // Add fake stroke for emotion analyzer color weighting
      isDrawing = false;
      return;
    }

    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = currentTool === 'eraser' ? 20 : lineWidth;
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
      if (currentTool === 'pen') {
         currentStroke.push({x: pos.x, y: pos.y, color: strokeColor});
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (currentTool === 'rect') {
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      ctx.rect(startX, startY, pos.x - startX, pos.y - startY);
      ctx.stroke();
    } else if (currentTool === 'circle') {
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  function stopDrawing() {
    if (isDrawing) {
      if (currentTool === 'pen' && currentStroke.length > 0) {
        strokes.push(currentStroke);
        currentStroke = [];
      } else if (currentTool === 'rect' || currentTool === 'circle') {
        const dummyStrokes = [];
        for (let i=0; i<30; i++) dummyStrokes.push({x: startX, y: startY, color: strokeColor});
        strokes.push(dummyStrokes);
      }
      isDrawing = false;
      ctx.closePath();
    }
  }

// Removing old listeners

  clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokes = [];
    currentStroke = [];
  });

  // Mock songs DB
  const mockPlaylists = {
    happy: [
      { title: "Walking on Sunshine", artist: "Katrina & The Waves" },
      { title: "Happy", artist: "Pharrell Williams" },
      { title: "Good Vibrations", artist: "The Beach Boys" },
      { title: "Don't Stop Me Now", artist: "Queen" }
    ],
    pleasant: [
      { title: "Morning Has Broken", artist: "Cat Stevens" },
      { title: "Here Comes The Sun", artist: "The Beatles" },
      { title: "What A Wonderful World", artist: "Louis Armstrong" },
      { title: "Weightless", artist: "Marconi Union" }
    ],
    horror: [
      { title: "Halloween Theme", artist: "John Carpenter" },
      { title: "Tubular Bells", artist: "Mike Oldfield" },
      { title: "Psycho Theme", artist: "Bernard Herrmann" },
      { title: "Dead Silence Theme", artist: "Charlie Clouser" }
    ],
    sad: [
      { title: "Someone Like You", artist: "Adele" },
      { title: "Fix You", artist: "Coldplay" },
      { title: "The Sound of Silence", artist: "Simon & Garfunkel" },
      { title: "Tears in Heaven", artist: "Eric Clapton" }
    ],
    angry: [
      { title: "Break Stuff", artist: "Limp Bizkit" },
      { title: "Killing in the Name", artist: "Rage Against The Machine" },
      { title: "Chop Suey!", artist: "System Of A Down" },
      { title: "Before I Forget", artist: "Slipknot" }
    ],
    neutral: [
      { title: "Weightless", artist: "Marconi Union" },
      { title: "Clair de Lune", artist: "Claude Debussy" },
      { title: "Lofi Hip Hop Mix", artist: "ChilledCow" },
      { title: "Sunset Lover", artist: "Petit Biscuit" }
    ]
  };

  const emotions = ['happy', 'sad', 'angry', 'neutral'];

  function renderMusicsLists() {
    const allList = document.getElementById('all-songs-list');
    const trendingList = document.getElementById('trending-songs-list');
    if (!allList || !trendingList) return;
    
    if (allList.children.length === 0) {
      let allSongs = [];
      Object.values(mockPlaylists).forEach(playlist => {
        allSongs = allSongs.concat(playlist);
      });
      allSongs = allSongs.filter((song, index, self) => index === self.findIndex((t) => (t.title === song.title)));
      allSongs.forEach(song => { allList.innerHTML += createSongElement(song); });
    }

    if (trendingList.children.length === 0) {
      let allSongs = [];
      Object.values(mockPlaylists).forEach(playlist => {
        allSongs = allSongs.concat(playlist);
      });
      allSongs = allSongs.filter((song, index, self) => index === self.findIndex((t) => (t.title === song.title)));
      const trendingSongs = [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 5);
      trendingSongs.forEach(song => { trendingList.innerHTML += createSongElement(song); });
    }
  }

  function createSongElement(song) {
    return `
      <li class="song-item">
        <div class="song-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
        </div>
        <div class="song-details">
          <div class="song-title">${song.title}</div>
          <div class="song-artist">${song.artist}</div>
        </div>
        <button class="play-btn">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </button>
      </li>
    `;
  }

  // Auth Modal Logic
  const authModal = document.getElementById('auth-modal');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalTitle = document.getElementById('modal-title');
  const formSubmitBtn = document.getElementById('form-submit-btn');
  const authSwitchText = document.getElementById('auth-switch-text');
  const authSwitchLink = document.getElementById('auth-switch-link');
  const authForm = document.getElementById('auth-form');

  let isLoginView = true;

  function setAuthView(isLogin) {
    isLoginView = isLogin;
    if (isLogin) {
      modalTitle.textContent = 'Log In';
      formSubmitBtn.textContent = 'Log In';
      authSwitchText.textContent = "Don't have an account?";
      authSwitchLink.textContent = 'Sign Up';
    } else {
      modalTitle.textContent = 'Sign Up';
      formSubmitBtn.textContent = 'Sign Up';
      authSwitchText.textContent = "Already have an account?";
      authSwitchLink.textContent = 'Log In';
    }
  }

  function openModal(isLogin) {
    setAuthView(isLogin);
    authModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeModal() {
    authModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  loginBtn.addEventListener('click', () => openModal(true));
  signupBtn.addEventListener('click', () => openModal(false));
  closeModalBtn.addEventListener('click', closeModal);

  // Close when clicking outside of modal content
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      closeModal();
    }
  });

  authSwitchLink.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthView(!isLoginView);
  });

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // In a real app, this would handle actual authentication
    const action = isLoginView ? 'logged in' : 'signed up';
    alert(`Successfully ${action}!`);
    closeModal();
  });

  function analyzeEmotion() {
    if (strokes.length === 0) return 'neutral';
    
    // Theme logic based on colors
    let horrorScore = 0;
    let pleasantScore = 0;
    
    for (const stroke of strokes) {
      if (stroke.length > 0) {
        const hColor = stroke[0].color || '#000000';
        
        // Count red or dark colors for horror
        if (hColor === '#000000' || hColor.startsWith('#ff') || hColor.startsWith('#cc00') || hColor.startsWith('#8b00')) {
          horrorScore++;
        }
        
        // Count green or blue colors for pleasant mountain/nature
        if (hColor.startsWith('#00ff') || hColor.startsWith('#0080') || hColor.startsWith('#0000ff') || hColor === '#4caf50' || hColor === '#2196f3' || hColor.startsWith('#32cd') || hColor.startsWith('#00cc')) {
          pleasantScore++;
        }
      }
    }
    
    // If predominantly green/blue
    if (pleasantScore > 1 && pleasantScore >= horrorScore) return 'pleasant';
    
    // If lots of black/red and jagged/messy lines
    if (strokes.length > 10 && horrorScore > 4) return 'horror';
    
    // Standard facial heuristic
    let lowestStroke = null;
    let maxAvgY = 0;
    
    for (const stroke of strokes) {
      if (stroke.length < 5) continue; // ignore dots
      let sumY = 0;
      for (const point of stroke) { sumY += point.y; }
      let avgY = sumY / stroke.length;
      if (avgY > maxAvgY) {
        maxAvgY = avgY;
        lowestStroke = stroke;
      }
    }
    
    if (!lowestStroke) return 'neutral';
    
    const startY = lowestStroke[0].y;
    const endY = lowestStroke[lowestStroke.length - 1].y;
    const middleIdx = Math.floor(lowestStroke.length / 2);
    const midY = lowestStroke[middleIdx].y;
    const endAvgY = (startY + endY) / 2;
    
    // Check for angry (sharp angles or many strokes)
    if (strokes.length > 7) return 'angry';
    
    // Higher Y is lower on the canvas
    if (midY > endAvgY + 15) return 'happy'; // U-shape (smile)
    if (midY < endAvgY - 15) return 'sad'; // inverted U-shape (frown)
    
    return 'neutral';
  }

  // Submit Logic
  submitBtn.addEventListener('click', () => {
    // 1. Get image data from canvas
    const imageData = canvas.toDataURL('image/png');
    
    // In a real app, this would be a fetch POST request to the backend.
    
    // UI Transitions
    initialView.classList.add('hidden');
    resultView.classList.add('hidden');
    loadingView.classList.remove('hidden');

    // Simulate Network Request and ML processing (1.5 seconds delay)
    setTimeout(() => {
      // Use heuristic stroke analysis for accurate prediction
      const predictedEmotion = analyzeEmotion();
      
      // Update UI
      loadingView.classList.add('hidden');
      resultView.classList.remove('hidden');
      
      // Update emotion text & styling
      emotionText.textContent = predictedEmotion.toUpperCase();
      emotionText.className = `emotion-tag ${predictedEmotion}`;
      
      // Populate Playlist
      const playlist = mockPlaylists[predictedEmotion] || mockPlaylists['neutral'];
      songList.innerHTML = '';
      
      playlist.forEach(song => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
          <div class="song-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
          </div>
          <div class="song-details">
            <div class="song-title">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
          </div>
          <button class="play-btn">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
        `;
        songList.appendChild(li);
      });
      
    }, 2000);
  });
});

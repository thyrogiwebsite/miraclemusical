const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTop.classList.add("show");
    } else {
        backToTop.classList.remove("show");
    }
});

backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

let tracks = [];
let currentIndex = null;
const audio = new Audio();




fetch("../script/data.json")
  .then(res => {
    if (!res.ok) {
      throw new Error("Failed to load data.json: " + res.status);
    }
    return res.json();
  })
  .then(data => {
    tracks = data;
  })
  .catch(err => {
    console.error(err);
  });

const trackRows        = document.querySelectorAll(".track-row");
const bottomPlayer     = document.getElementById("bottomPlayer");
const playerSongTitle  = document.getElementById("playerSongTitle");
const playerSongArtist = document.getElementById("playerSongArtist");
const btnPrev          = document.getElementById("btnPrev");
const btnPlayPause     = document.getElementById("btnPlayPause");
const btnNext          = document.getElementById("btnNext");
const progressFill     = document.getElementById("playerProgressFill");
const currentTimeEl    = document.getElementById("currentTime");
const totalTimeEl      = document.getElementById("totalTime");

const progressBar       = document.querySelector(".player-progress-bar");
const progressContainer = document.querySelector(".player-progress-container");
const hoverBall         = document.querySelector(".progress-hover-ball");

const volumeSlider = document.getElementById("volumeSlider");

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateActiveTrackHighlight() {
  document.querySelectorAll(".track-title").forEach(titleEl => {
    titleEl.classList.remove("active", "rainbow-text");
  });

  if (currentIndex !== null) {
    const row = document.querySelector(`.track-row[data-index="${currentIndex}"]`);
    if (!row) return;
    const titleEl = row.querySelector(".track-title");
    titleEl.classList.add("active", "rainbow-text");
  }
}

const btnLyrics = document.getElementById("btnLyrics");
const lyricsBox = document.getElementById("lyricsBox");
const lyricsText = document.getElementById("lyricsText");

btnLyrics.addEventListener("click", () => {
    lyricsBox.classList.toggle("show");
});

function playTrack(index) {
    const track = tracks[index];
    if (!track) return;

    currentIndex = index;
    audio.src = track.file;
    audio.currentTime = 0;
    audio.play();

    bottomPlayer.classList.add("show");
    playerSongTitle.textContent = track.title;
    playerSongArtist.textContent = track.artists;
    btnPlayPause.textContent = "⏸";

    // Update lyrics dynamically
    // inside playTrack function
    if (track.lyrics) {
        lyricsText.innerHTML = track.lyrics.replace(/\n/g, "<br>");
    } else {
        lyricsText.textContent = "No lyrics available.";
    }


    updateActiveTrackHighlight();

    // Hide lyrics box when changing song
    lyricsBox.classList.remove("show");
}

function togglePlayPause() {
  if (currentIndex === null) return;

  if (audio.paused) {
    audio.play();
    btnPlayPause.textContent = "⏸";
  } else {
    audio.pause();
    btnPlayPause.textContent = "▶";
  }
}

function nextTrack() {
  if (currentIndex === null) return;
  if (currentIndex < tracks.length - 1) {
    playTrack(currentIndex + 1);
  }
}

function prevTrack() {
  if (currentIndex === null) return;
  if (audio.currentTime > 5 || currentIndex === 0) {
    audio.currentTime = 0;
  } else {
    playTrack(currentIndex - 1);
  }
}

trackRows.forEach(row => {
  row.addEventListener("click", () => {
    const index = parseInt(row.dataset.index, 10);

    if (currentIndex === index) {
      togglePlayPause();
    } else {
      playTrack(index);
    }
  });
});

btnPlayPause.addEventListener("click", togglePlayPause);
btnNext.addEventListener("click", nextTrack);
btnPrev.addEventListener("click", prevTrack);

audio.addEventListener("timeupdate", () => {
  const current = audio.currentTime;
  const total   = audio.duration || 0;

  currentTimeEl.textContent = formatTime(current);
  totalTimeEl.textContent   = formatTime(total);

  const percent = total ? (current / total) * 100 : 0;
  progressFill.style.width = `${percent}%`;
});

progressBar.addEventListener("mousedown", (e) => {
  const rect = progressBar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = x / rect.width;
  audio.currentTime = audio.duration * percent;
});

let isDragging = false;

function updateHoverBall(e) {
  const rect = progressContainer.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(x, rect.width));
  hoverBall.style.left = x + "px";
}

function seekToMouse(e) {
  const rect = progressContainer.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(x, rect.width));
  const percent = x / rect.width;
  audio.currentTime = percent * audio.duration;
}

progressContainer.addEventListener("mousemove", updateHoverBall);
progressContainer.addEventListener("mouseenter", () => hoverBall.style.opacity = 1);
progressContainer.addEventListener("mouseleave", () => {
  if (!isDragging) hoverBall.style.opacity = 0;
});

progressContainer.addEventListener("click", (e) => {
  seekToMouse(e);
});

progressContainer.addEventListener("mousedown", (e) => {
  isDragging = true;
  seekToMouse(e);
  hoverBall.style.opacity = 1;

  document.addEventListener("mousemove", dragSeek);
  document.addEventListener("mouseup", stopDrag);
});

function dragSeek(e) {
  seekToMouse(e);
  updateHoverBall(e);
}

function stopDrag() {
  isDragging = false;
  hoverBall.style.opacity = 0;

  document.removeEventListener("mousemove", dragSeek);
  document.removeEventListener("mouseup", stopDrag);
}

function sliderToVolume(v) {
  let x = v / 100;
  return x * x;
}

function updateSliderFill() {
  const percent = (volumeSlider.value / volumeSlider.max) * 100;
  volumeSlider.style.setProperty("--fill-percent", percent + "%");
  document.querySelector(".volume-fill").style.width = percent + "%";
}
volumeSlider.addEventListener("input", () => {
  audio.volume = sliderToVolume(volumeSlider.value);
  updateSliderFill();
});
updateSliderFill();

audio.addEventListener("ended", () => {
  if (currentIndex < tracks.length - 1) {
    playTrack(currentIndex + 1);
  } else {
    btnPlayPause.textContent = "▶";
  }
});

// LYRICS PANEL
const lyricsPanel = document.getElementById("lyricsPanel");
const lyricsHeader = document.getElementById("lyricsHeader");
const collapseBtn = document.getElementById("collapseBtn");
const lyricsContent = document.getElementById("lyricsContent");
const lyricsSongTitle = document.getElementById("lyricsSongTitle");

// Toggle lyrics panel collapse
lyricsHeader.addEventListener("click", () => {
    lyricsPanel.classList.toggle("collapsed");
    collapseBtn.textContent = lyricsPanel.classList.contains("collapsed") ? "⏷" : "▲";
});

// Update the playTrack function to also update the lyrics panel
function playTrack(index) {
    const track = tracks[index];
    if (!track) return;

    currentIndex = index;
    audio.src = track.file;
    audio.currentTime = 0;
    audio.play();

    bottomPlayer.classList.add("show");
    playerSongTitle.textContent = track.title;
    playerSongArtist.textContent = track.artists;
    btnPlayPause.textContent = "⏸";

    // Update lyrics panel
    lyricsSongTitle.textContent = track.title;
    if (track.lyrics) {
        lyricsText.innerHTML = track.lyrics.replace(/\n/g, "<br>");
    } else {
        lyricsText.textContent = "No lyrics available.";
    }

    // Ensure lyrics panel is expanded when new song plays
    lyricsPanel.classList.remove("collapsed");
    collapseBtn.textContent = "▲";

    updateActiveTrackHighlight();
}
let gameActive = false;
let startBtn = document.querySelector(".start-button");
let mouseInput = true;
let touchEnabled = false;
let lanesOffset = 200;
let currentLane = 1;
let hikerCenter = 0;
let score = document.querySelector(".score");
let totalPoints = 0;
let isUniqueUser = false;

let adContainer = document.querySelector(".game-container");

const analyticsObject = {
  campaignID: "b4383b98-42a7-4b93-ac83-da8016c2826b",
  companyID: "37f36be7-270a-11ee-a1fe-010b8a02f634",
  cta_setup: [
    {
      name: "cta-0",
      id: "rHhiJcdt",
      url: "",
      clickTagUrl: "",
      tag: "#clicktag",
      openLink: false
    },
    {
      name: "cta-1",
      id: "uXhfhWPZ",
      url: "https://campaigns.brame.io/4c43be6f-ffa8-11ed-9a7e-9b999c5bf1b3/ef223e3e-39e4-11ef-9db6-5d8d19f5f6f2/",
      clickTagUrl: "",
      tag: "#clicktag1",
      target: '_self'
    },
    {
      name: "cta-2",
      id: "OL0kTfWp",
      url: "https://campaigns.brame.io/4c43be6f-ffa8-11ed-9a7e-9b999c5bf1b3/4838f307-3ac3-11ef-9db6-3fb27f7c2abc/",
      clickTagUrl: "",
      tag: "#clicktag2",
      target: '_self'
    }
  ],
  language: "de",
  pages: ["Game", "Users played both games"],
  adContainer: adContainer,
  live: false,
};

let analytics = null;
let gameStarted = false;
let gameEnded = false;

window.onload = () => {
  analytics = new Analytics(analyticsObject);
  preloadImages();
}

async function checkUniqueId() {
  const fp = await FingerprintJS.load();

  const result = await fp.get();

  const visitorId = result.visitorId;
  const visitorIdFromStorage = localStorage.getItem("userId");
  localStorage.removeItem("userId");

  if(visitorId === visitorIdFromStorage) {
    isUniqueUser = true;
    analytics.pageView("outcome", "Users played both games");
  }
}
console.log("te", document.documentElement.clientHeight);

function setVhProperty() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVhProperty();

window.addEventListener('resize', setVhProperty);

function startGame() {
  checkUniqueId();
  const oldPoints = localStorage.getItem("points");
  const oldLifes = localStorage.getItem("lifes");
  totalPoints = Number(oldPoints ?? 0);
  let lifes = Number(oldLifes ?? 3);
  updateLives();
  updatePoints();
  localStorage.removeItem("points");
  localStorage.removeItem("lifes");
  if(!gameStarted) {
    analytics.gameStarted();
    gameStarted = true;
    document.getElementById("cta-0").click();
  }
  gameActive = true;
  document.querySelector(".introduction").style.display = "none";
  document.querySelector(".header-logo").style.display = "none";
  document.querySelector(".top-pts").style.display = "flex";
  document.querySelector(".top-obst").style.display = "flex";

  const gridOneItems = document.querySelectorAll(".grid-one > div");
  const gridTwoItems = document.querySelectorAll(".grid-two > div");
  const gridItems = [gridOneItems, gridTwoItems];
  // give me 4 more spawns

  const obstacles = [
    "url(./assets/Obstacle.png)"
  ];
  const points = [
    "url(./assets/Point1.png)",
    "url(./assets/Point2.png)",
    "url(./assets/Point3.png)",
    "url(./assets/Point2.png)",
    "url(./assets/Point1.png)",
  ];
  let firstSpawn = randomize(0, 1);

  if (firstSpawn < 0.35) {
    spawnItems(gridOneItems, [9, 22], [11, 18, 7]);
    spawnItems(gridTwoItems, [10, 23], [8, 18, 5]);
  } else if (firstSpawn < 0.7) {
    spawnItems(gridOneItems, [13, 23], [14, 15, 20]);
    spawnItems(gridTwoItems, [9, 22], [11, 18, 5]);
  } else {
    spawnItems(gridOneItems, [16, 21], [11, 19, 1]);
    spawnItems(gridTwoItems, [10, 22], [9, 17, 5]);
  }

  let root = document.documentElement;
  root.style.setProperty("--hiker", `0.75s`);
  let map = document.querySelector(".map");
  let hiker = document.querySelector(".hiker-container");

  hikerCenter = hiker.style.left;
  root.addEventListener("click", function () {
    if (!touchEnabled) mouseInput = true;
  });

  document.querySelector(".bg-img-box").classList.add("bg-img-anim");
  document.querySelector(".bg-img-box-two").classList.add("bg-img-anim");

  document.querySelector(".grid-one").classList.add("grid-anim");
  document.querySelector(".grid-two").classList.add("grid-anim");

  function spawnItems(grid, obstaclesSpawn, pointsSpawn) {
    grid.forEach((item, index) => {
      if (checkIfTheSameIndex(index, obstaclesSpawn)) {
        let obstacle = document.createElement("div");
        obstacle.classList.add("obstacle");
        obstacle.style.backgroundImage = obstacles[randomize(0, obstacles.length - 1)];
        item.appendChild(obstacle);
      }
      if (checkIfTheSameIndex(index, pointsSpawn)) {
        let point = document.createElement("div");
        point.classList.add("point");
        point.style.backgroundImage = points[randomize(0, points.length - 1)];
        item.appendChild(point);
      }
    });
  }

  function removeItems(grid) {
    //remove items from the grid
    grid.forEach((item) => {
      if (item.children.length > 0) {
        item.removeChild(item.children[0]);
      }
    });
  }

  function randomize(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  let iterationGridOne = 0;
  let iterationGridTwo = 0;

  document.querySelector(".grid-one").addEventListener("animationiteration", () => {
    if (iterationGridOne % 2 != 0) {
      removeItems(gridOneItems);
      spawnItems(gridOneItems, [13, 23], [14, 15, 7]);
      iterationGridOne++;
    } else {
      removeItems(gridOneItems);
      spawnItems(gridOneItems, [9, 22], [11, 18, 4]);
      iterationGridOne++;
    }
  });

  document.querySelector(".grid-two").addEventListener("animationiteration", () => {
    if (iterationGridTwo % 2 != 0) {
      removeItems(gridTwoItems);
      spawnItems(gridTwoItems, [16, 21], [7, 17, 3]);
      iterationGridTwo++;
    } else {
      removeItems(gridTwoItems);
      spawnItems(gridTwoItems, [10, 23], [8, 18, 20]);
      iterationGridTwo++;
    }
  });

  function isColliding(a, b) {
    let aRect = a.getBoundingClientRect();
    let bRect = b.getBoundingClientRect();
    return !(
      aRect.top > bRect.bottom ||
      aRect.bottom < bRect.top ||
      aRect.right < bRect.left ||
      aRect.left > bRect.right
    );
  }

  window.requestAnimationFrame(gameLoop);
  let startTime = Date.now();

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  let firstLane = 50;
  let secondLane = 150;
  let thirdLane = 250;

  let leftLane = "calc(0% + 50px)";
  let rightLane = "calc(100% - 50px)";

  let isMobile = false;
  if (window.innerWidth <= 568) {
    firstLane = 55;
    secondLane = 130;
    thirdLane = 205;

    leftLane = "calc(0% + 55px)";
    rightLane = "calc(100% - 55px)";
    isMobile = true;
  }
  if (window.innerWidth > 568) {
    leftLane = "calc(0% + 50px)";
    rightLane = "calc(100% - 50px)";
    isMobile = false;
  }

  document.querySelector("#left-arrow").addEventListener("click", goLeft);
  document.querySelector("#right-arrow").addEventListener("click", goRight);

  function goLeft() {
    if (currentLane == 0) return;
    if (currentLane == 1) hiker.style.left = leftLane;
    if (currentLane == 2) hiker.style.left = "50%";
  }

  function goRight() {
    if (currentLane == 0) hiker.style.left = "50%";
    if (currentLane == 1) hiker.style.left = rightLane;
    if (currentLane == 2) return;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      goLeft();
      mouseInput = false;
    }
    if (e.key === "ArrowRight") {
      goRight();
      mouseInput = false;
    }
  });

  function gameLoop() {
    if (!gameActive) {
      root.style.setProperty("--time", `0s`);
      root.style.setProperty("--hiker", `0s`);
      return;
    }

    if (hiker.offsetLeft === firstLane) {
      currentLane = 0;
    }
    if (hiker.offsetLeft === secondLane) {
      currentLane = 1;
    }
    if (hiker.offsetLeft === thirdLane) {
      currentLane = 2;
    }

    let points = document.querySelectorAll(".point");
    let obstacles = document.querySelectorAll(".obstacle");

    let currentTime = Date.now();
    let timeDelta = (currentTime - startTime) / 1000;
    let time = 3.2 - timeDelta * 0.02;
    root.style.setProperty("--time", `${time > 1.4501 ? time.toFixed(4) : 1.0015}s`);

    points.forEach((point) => {
      if (isColliding(hiker, point)) {
        point.style.display = "none";
        setTimeout(() => {
          point.style.display = "block";
        }, 1000);
        totalPoints++;
        if(totalPoints > 23) {
          gameActive = false;
          endGame(true);
        }
        updatePoints();
      }
    });

    obstacles.forEach((obstacle) => {
      if (isColliding(hiker, obstacle)) {
        obstacle.style.display = "none";
        setTimeout(() => {
          obstacle.style.display = "block";
        }, 1000);
        if (lifes > 0) {
          lifes--;
        }
        hiker.classList.add("hiker-hit");
        document.querySelector("body").classList.add("map-shake");
        setTimeout(() => {
          document.querySelector("body").classList.remove("map-shake");
        }, 500);
        setTimeout(() => {
          hiker.classList.remove("hiker-hit");
        }, 1000);

        updateLives();
        if (lifes === 0 && gameActive) {
          setTimeout(() => {
            gameActive = false;
            endGame(false);
          }, 500);
        }
      }
    });
    window.requestAnimationFrame(gameLoop);
  }

  function updatePoints() {
    score.innerText = totalPoints;
  }

  function updateLives() {
    let life = document.querySelector(".lives");
    life.innerText = lifes;
  }

  setTimeout(() => {
    if(gameActive) {
      gameActive = false;
      endGame(false);
    }
  }, 30000)
}

function endGame(won) {
  localStorage.setItem("brame", "1");
  if(isUniqueUser) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = `var _oad = [{customer:326,page:'endgame',checksum:'2448d4'}];
    !function(e,t,a,c,n){
      c=e.createElement(t),c.async=1,c.src=a,n=e.getElementsByTagName(t)[0],n.parentNode.insertBefore(c,n);
    }(document,'script','https://ad.adsrvx-targeting.com/track_js.php?t='+Math.random().toString().substring(5,15));`;
    document.body.appendChild(script);
  }

  if(!gameEnded) {
    analytics.gameEnded();
    gameEnded = true;
  }
  showHidePage(".map", ".introduction");
  showHidePage(".top-pts", ".header-logo");
  showHidePage(".top-obst", ".introduction");
  $("#spinner-back").css("visibility", "visible");
  $("#spinner-back").css("opacity", "1");

  document.getElementById("modal-header").textContent = won ? "Gratuliere!" : "Leider kein Gewinn. Morgen hast du eine neue Chance!";
  document.getElementById("modal-text").textContent = won ? "Du startest mit Wieselburger in den Sommer! Finde jetzt heraus, welcher Preis dir gehört." : "Melde Dich zum Newsletter an, wenn Du über zukünftige Aktionen informiert werden möchtest.";
  document.getElementById("start-button").textContent = won ? "Weiter geht’s!" : "Jetzt anmelden!";
}

function checkIfTheSameIndex(index, array) {
  for (let i = 0; i < array.length; i++) {
    if (index === array[i]) {
      return true;
    }
  }
  return false;
}

function showHidePage(pageToHide, pageToShow) {
  document.querySelector(pageToShow).style.display = "flex";
  document.querySelector(pageToHide).style.display = "none";
}

startBtn.addEventListener("click", () => {
  if(gameEnded) {
    document.getElementById(totalPoints > 23 ? "cta-1" : "cta-2").click();
  } else {
    startGame();
  }
});

function preloadImages() {
  const imageUrls = [
    "https://brame-tailor-made-data.s3.eu-central-1.amazonaws.com/wieselburger/Left_Side.jpg",
    "https://brame-tailor-made-data.s3.eu-central-1.amazonaws.com/wieselburger/background.jpg",
    "https://brame-tailor-made-data.s3.eu-central-1.amazonaws.com/wieselburger/Right_Side.jpg",
    "https://brame-tailor-made-data.s3.eu-central-1.amazonaws.com/wieselburger/bottle.png"
  ]
    
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

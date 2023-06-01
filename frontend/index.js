/* Main Script */

let container = document.getElementById('grid-container');
const actionsContainer = document.getElementById('actions-container');
const MAX_ACTIONS = 10;

function createGrid(width, height) {
  let increment = 100;
  for (let i = 1; i < width / 10; i++) {
    const verticalLine = document.createElement('div');
    verticalLine.classList.add('grid-line', 'vertical-line');
    verticalLine.style.left = `${i * 10}px`;
    container.appendChild(verticalLine);
  }

  for (let i = 1; i < height / 10; i++) {
    const horizontalLine = document.createElement('div');
    horizontalLine.classList.add('grid-line', 'horizontal-line');
    horizontalLine.style.top = `${i * 10}px`;
    container.appendChild(horizontalLine);

  }
}

createGrid(840, 360); // Create a 400x200 grid

// game.js
const stockGraph = document.getElementById('stock-graph').getContext('2d');

// Function to fetch historical stock data from Yahoo Finance API for a month
async function fetchStockData(symbol) {
  try {
    const response = await fetch(`/stock-data?symbol=${symbol}`);
    const data = await response.json();
    // Process the received stock data
    const historicalData = data.chart.result[0].indicators.quote[0].close;
    let dates = data.chart.result[0].timestamp.map(timestamp => new Date(timestamp * 1000));
    
    dates.sort((a, b) => a - b);

    return { dates, historicalData };
  } catch (error) {
    console.error(error);
    return null;
  }
}

let chart = null; // Reference to the current chart instance
let chartData = {
  labels: [],
  datasets: [{
    label: "",
    data: [],
    borderColor: 'red',
    backgroundColor: 'rgba(0, 0, 0 ,0)',
    borderWidth: 1,
    pointRadius: 0,
    tension: 0,
    fill: false
  }]
};

const stockSymbols = ["AAPL", "GOOG", 'AMZN', 'MSFT', "META", "APA", "SOFI", "HPQ", "GME", "AMBA", "CRM", "TGT", "AVGO", "NFLX", "NET", "CRWD", "ENPH", "COIN", "PYPL"];
function getRandomStockSymbol() {
  const randomIndex = Math.floor(Math.random() * stockSymbols.length);
  return stockSymbols[randomIndex];
}
var stockTicker = getRandomStockSymbol();

/** Set variables for dyanmic document elements */

const stockPriceText = document.getElementById('stock-price-text');
const marketBalance = document.getElementById('market-balance');
const yourScore = document.getElementById('your-score');
const stockTickerText = document.getElementById('stock-ticker');
const resultsText = document.getElementById('results');
const actionToggle = document.getElementById('action-toggle');
const historyLabel = document.getElementById('history-label');
const leaderboard = document.getElementById('leaderboard');
const loginButton = document.getElementById('login-register');
const loginForm = document.getElementById('login-form');
const submitLogin = document.getElementById('submit-login');
const submitRegister = document.getElementById('submit-register');
const usernameDisplay = document.getElementById('username-display');
const submitMessage = document.getElementById('message');
const howTo = document.getElementById('how-to');

let yourShares = 0;
let updateBalance = false;
let displayLogin = false;
let loggedInUser = "anon";
let sharesOwned = false;

const startingBalance = 100000;
let mBalance = startingBalance
let yBalance = 100000;

/** Set initial values */

yourScore.innerHTML = `$${yBalance.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
marketBalance.innerHTML = `$${mBalance.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
stockTickerText.innerHTML += stockTicker;
resultsText.style.display = 'none';
historyLabel.style.display = 'none';

/** Hard coded leaderboard generation */

async function updateLeaderboard() {
  const response = await fetch('/leaderboard');
  const topUsers = await response.json();
  // Clear the current leaderboard
  leaderboard.innerHTML = '';

  // Add each user to the leaderboard
  topUsers.forEach(user => {
      const item = document.createElement('span');
      item.textContent = `${user.username}: $${user.highScore.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      item.style.color = 'green';
      leaderboard.appendChild(item);
  });
}

updateLeaderboard();

async function getSavedBalance(username) {
  const response = await fetch(`/user-score?username=${username}`);
  const data = await response.json();
  // assuming the response would be a JSON object like: { highScore: 123 }
  const score = data.highScore.highScore;
  console.log(score);

  yBalance = score;
  yourScore.innerHTML = `$${score.toLocaleString('en-US')}`
}


/** Saving a player's highest score */
async function updateHighScore(username, score) {
  const response = await fetch('/update-score' , {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, score })
  });

  if (response.ok) {
    console.log('High Score Updated!')

  } else {
    console.log('Update failed.')
  }
}

// Call updateHighScore at the end of each game.

/** Login Functionality */

loginButton.addEventListener('click', () => {
  if (displayLogin) {
    loginForm.style.display = 'none';
    displayLogin = false;
  } else {
    loginForm.style.display = 'flex'
    displayLogin = true;
  }
  console.log("clicked!")
})

/** Submitting the LOGIN request */
submitLogin.addEventListener('click', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })  // JSON-encode the body
  });

  if (response.ok) {
    submitMessage.innerHTML = "Login Success!";
    submitMessage.style.color = 'green';

    loginForm.style.display = 'none';
    displayLogin = false;
    usernameDisplay.style.visibility = 'visible';
    usernameDisplay.innerHTML = username;
    
    loggedInUser = username;
    console.log("Logged In User: " + loggedInUser);

    getSavedBalance(loggedInUser);
    yourScore.style.color = 'white';

  } else {
    const data = await response.json();
    console.log(data);
    submitMessage.innerHTML = data.message;
    submitMessage.style.color = 'red';
  }
});


submitRegister.addEventListener('click', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      password: password,
      highScore: 0
    })
  });

  const data = await response.json();

  if (data.success) {
    loginForm.style.display = 'none';
    displayLogin = false;
    usernameDisplay.style.visibility = 'visible';
    usernameDisplay.innerHTML = username;
    loggedInUser = username;

  } else {
    submitMessage.innerHTML = data.message;
  }
});


/** Function: updateShares(action)
 *  Parameters: action - a boolean value representing what was the most recent action
 *  performed by the user, FALSE = SELL and TRUE = BUY.
 * 
 *  Description: Updates the quantity of shares the user has of the stock in real-time.
 */

function updateShares(action) {
  let stockPrice = Number(stockPriceText.innerHTML.replace("$", ""));

  // If action is SELL
  if (!action && yourShares != 0) {
    yourShares = 0;
    yourScore.innerHTML = `$${yBalance.toLocaleString('en-US')}`;
    updateBalance = false;
    addLine(stockPrice, 'red');
    actionToggle.innerHTML = 'BUY';
    actionToggle.style.color = 'green';
   
  // If action is BUY
  } else if (action && yourShares == 0) {
    yourShares = yBalance / stockPrice;
    updateBalance = true;
    
    // Add the green line
    addLine(stockPrice, 'green');
    actionToggle.innerHTML = 'SELL';
    actionToggle.style.color = 'red';
  }
}

var audioPlaying = false;
const playButton = document.getElementById("play-music");

function playAudio() { 
  var x = document.getElementById("myAudio"); 
  if (!audioPlaying) {
    x.play(); 
    audioPlaying = true;
    playButton.style.background = 'red'
  } else {
    x.pause();
    audioPlaying = false;
    playButton.style.background = 'transparent'
  }
} 

function addLine(price, color) {
  chart.data.datasets.push({
    label: 'Trade Line',
    data: [{x: chart.data.labels[0], y: price}, {x: chart.data.labels[chart.data.labels.length - 1], y: price}],
    borderColor: color,
    borderWidth: 0.5,
    pointRadius: 0,
    fill: false,
    type: 'line',
    width: '840px'
  });

  chart.update();
}

let isGameOver = true;

// Function to draw the stock graph on the grid using Chart.js
function drawStockGraph(stockSymbol, dates, historicalData, market, your) {
  container = document.getElementById("graph-container");
  yBalance = your;
  yourShares = 0;
  updateBalance = false;
  
  updateLeaderboard();
  
  if (chart) {
    chart.data.datasets = chart.data.datasets.filter(dataset => dataset.label !== 'Trade Line');
    chart.destroy();
  }

  // initialize chart with no data
  chartData.labels = [];
  chartData.datasets[0].data = [];
  chartData.datasets[0].label = stockSymbol;

  const containerWidth = container.offsetWidth;

  chart = new Chart(stockGraph, {
    type: 'line',
    data: chartData,
    options: {
      plugins: {
        legend: {
          display: false
        }, 
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          display: false, // Hide x-axis
          grid: {
            display: false, // Hide x-axis grid lines
          },
          // Initial min and max values are the first date
          ticks: {
            min: dates[0],
            max: dates[dates.length - 1],
          },
        },
        y: {
          display: false,
          ticks: {
            font: {
              family: 'Courier New',
              size: 12
            },
          },
          grid: {
            display: false // Hide y-axis grid lines
          }
        }
      },
      layout: {
        padding: 0 // Remove padding around the chart
      },
      responsive: true,
      maintainAspectRatio: false, // Allow chart to fill its container
      animation: false
    }
  });

  // populate data over 30 seconds
  let index = 0;
  let marketShares = market / Number(`${historicalData[index].toFixed(2)}`);

  const intervalId = setInterval(() => {

    if (index < dates.length) {
      chartData.labels.push(dates[index]);
      chartData.datasets[0].data.push(historicalData[index]);
      chart.options.scales.x.ticks.max = dates[index];

      stockPriceText.innerHTML = `$${historicalData[index].toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      
      mBalance = marketShares * historicalData[index];
      marketBalance.innerHTML = `$${mBalance.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      
      if (updateBalance) {
        yBalance = yourShares * historicalData[index];
        console.log("Your Score:" + yBalance);
        yourScore.innerHTML = `$${yBalance.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

      }

      if (yBalance > mBalance) {
        yourScore.style.color = 'green';
      } else if (yBalance < mBalance) {
        yourScore.style.color = 'red';
      } else {
        yourScore.style.color = 'white';
      }       

      container.style.width = `${(index / dates.length) * containerWidth}px`;

      chart.update('quiet');
      index++;
    } else {
      clearInterval(intervalId); // stop the interval
      isGameOver = true;

      updateHighScore(loggedInUser, yBalance);
      updateLeaderboard();
      sharesOwned = false;


      const profitText = document.getElementById("profit");
      const marketDifferenceText = document.getElementById("market-difference");
      const percentageText = document.getElementById("percentage");
      resultsText.style.display = 'inline';

      profitText.innerHTML = `$${(yBalance - 100000).toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      if (yBalance - 100000 > 0 ) {
        profitText.style.color = 'green'
      } else {
        profitText.style.color = 'red';
      }

      marketDifferenceText.innerHTML =  `$${(yBalance - mBalance).toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      if (yBalance - mBalance > 0 ) {
        marketDifferenceText.style.color = 'green'
      } else {
        marketDifferenceText.style.color = 'red';
      }
      
      percentageText.innerHTML = `${(((yBalance - 100000) / 100000) * 100).toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}` + "%";
      if ((((yBalance - 100000) / 100000) * 100) > 0 ) {
        percentageText.style.color = 'green'
      } else {
        percentageText.style.color = 'red';
      }

    }
  }, 30000 / dates.length); // adjust timing based on number of data points

}



const binaryBackground = document.getElementById('binary-background');

function generateBinarySequence() {
  let binary = '';
  for (let i = 0; i < 2000; i++) {
    binary += '00101010'; // Binary representation of the number 42
  }
  return binary;
}

binaryBackground.innerHTML = generateBinarySequence();

async function displayStockGraph(marketBalance, yourBalance) {
  isGameOver = false;
  yourScore.style.color = 'white';


  stockTickerText.innerHTML = "$" + stockTicker;
  stockTicker = getRandomStockSymbol();
  const { dates, historicalData } = await fetchStockData(stockTicker);
  drawStockGraph(stockTicker, dates, historicalData, marketBalance, yourBalance);
}

// Add event listener for key press
document.addEventListener('keydown', function(event) {
    const actionsContainer = document.getElementById('actions');
    const actions = actionsContainer.getElementsByClassName('action');
  
    /** ENTER key is pressed */
    if(event.keyCode === 13) {
      if (isGameOver) {
        while (actionsContainer.firstChild) {
          actionsContainer.removeChild(actionsContainer.firstChild);
        }

        howTo.style.visibility = 'hidden';
        actionToggle.innerHTML = '';
        console.log("AT LINE 482: yBalance = " + yBalance);
        displayStockGraph(yBalance, yBalance);
        historyLabel.style.display = 'inline';
      }
    }

    // Check if key pressed is '4'
    if (event.keyCode === 52 && yourShares == 0 && !isGameOver) {
      const buyButton = document.querySelector('.buy-button');
      const buttonKey = buyButton.querySelector('.button-key');
      buyButton.classList.add('active');
      buttonKey.style.borderColor = 'green';
  
      // Create a new action element for buy
      const action = document.createElement('div');
      const stockPrice = document.getElementById('stock-price-text').innerHTML;
      action.classList.add('action', 'buy');
      action.style.color = 'green';
      action.textContent = 'BUY: ' + stockPrice;

      sharesOwned = true;
      updateShares(sharesOwned);
  
      // Insert the new action at the top of the container
      actionsContainer.insertBefore(action, actions[0]);
      const sound = document.getElementById('sound');
      sound.currentTime = 0;
      sound.play();
      
      // Remove the oldest action if there are more than 10
      if (actions.length > 20) {
        actionsContainer.removeChild(actions[actions.length - 1]);
      }
    }
    // Check if key pressed is '2'
    if (event.keyCode === 50 && yourShares != 0 && !isGameOver) {
      const sellButton = document.querySelector('.sell-button');
      const buttonKey = sellButton.querySelector('.button-key');
      sellButton.classList.add('active');
      buttonKey.style.borderColor = 'red';
  
      // Create a new action element for sell
      const action = document.createElement('div');
      const stockPrice = document.getElementById('stock-price-text').innerHTML;
      action.classList.add('action', 'sell');
      action.style.color = 'red';
      action.textContent = 'SELL: ' + stockPrice;

      sharesOwned = false;
      updateShares(sharesOwned);
  
      // Insert the new action at the top of the container
      actionsContainer.insertBefore(action, actions[0]);
      const sound = document.getElementById('sound');
      sound.currentTime = 0;
      sound.play();
      
      // Remove the oldest action if there are more than 10
      if (actions.length > 10) {
        actionsContainer.removeChild(actions[actions.length - 1]);
      }
    }
  });
  
  // Add event listener for key release
  document.addEventListener('keyup', function(event) {
    const actionsContainer = document.getElementById('actions');
  
    // Check if key released is '4'
    if (event.keyCode === 52) {
      const buyButton = document.querySelector('.buy-button');
      const buttonKey = buyButton.querySelector('.button-key');
      buyButton.classList.remove('active');
      buttonKey.style.borderColor = '';
    }
    // Check if key released is '2'
    if (event.keyCode === 50) {
      const sellButton = document.querySelector('.sell-button');
      const buttonKey = sellButton.querySelector('.button-key');
      sellButton.classList.remove('active');
      buttonKey.style.borderColor = '';
    }
  });
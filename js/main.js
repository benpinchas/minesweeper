//saturday 22:00 vesrion.

/*
Improvments from thursday version:

Code Improvments:
cleaner conditons + repeated & common code write once now
unnecessary lines / variables removed
(You can see the changes by searching: //improved)


Game Improvments:
The program now remembers you even if you didnt set a score
*/


var MINE = '💣';
var EMPTY = ' ';
var FLAG = '🚩';
var HAPPY = '😃'
var SAD = '😟';
var SUNGLASSES = '😎'
var DEAD = '😵'
var EYE = '👀'



var colorNumsMap = {
	0: EMPTY,
	1: '<span style="color:green;">1</span>',
	2: '<span style="color:blue;">2</span>',
	3: '<span style="color:red;">3</span>',
	4: '<span style="color:orange;">4</span>',
	5: '<span style="color:purple;">5</span>',
	6: '<span style="color:brown;">6</span>',
	7: '<span style="color:pink;">7</span>',
	8: '<span style="color:gray;">8</span>'
}


var gGame = null;
var gLevel = null;

var gBoard; // [{..}, {..}]

var gMinesCoords; // [] using it to reveal al the mine on game over.

var gTimerInterval; //define it in first click
var gTimeoutExpose;

var gPlayers; // [{..}, {..}]
var gCurrPlayer; // a name;

// get / create gPlayers. array of players objects 
var gPlayers = JSON.parse(localStorage.getItem('gPlayers'));
	if (!gPlayers) {
		//first time ever in the game. create gPlayes (local host) amd show directions
 		gPlayers = []
 		localStorage.setItem('gPlayers', JSON.stringify(gPlayers));
 		toggleDirections(document.querySelector('.directions-button')) 
}
getPlayerName()



function init() {
	if (gTimerInterval) clearInterval(gTimerInterval)
	if (gTimeoutExpose) clearTimeout(gTimeoutExpose)	
	gMinesCoords = []; //empty the coords from last game
	
	gGame = {
		isOn: false,
		shownCount: 0,
		markedCount: 0,
		secsPassed: 0,
		lives: 3,
		hints: 3,
		hintMode:false
	}

	var elCheckedRadio = wichRadioIsChecked()	
	var size = +elCheckedRadio.getAttribute('value'); 
	
	gLevel = {
		SIZE: size, 
		MINES: size
	}	

	gBoard = buildBoard(gLevel)
	renderBoard(gBoard)

	document.querySelector('.timer').innerText = '000'
	document.querySelector('.smiley').innerText = HAPPY
	document.querySelector('.lives').innerText = gGame.lives//3
	document.querySelector('.hint-button').innerText = gGame.hints+' Hints' //3
	document.querySelector('.player-name').innerText = gCurrPlayer.toUpperCase();
	document.querySelector('.best-players-heading').innerText = `Best players in ${gLevel.SIZE}*${gLevel.SIZE} size:`


	updatePlayersList() 
}


//Builds the board Set mines at random locations
function buildBoard(level) {
	var length = level.SIZE;
	var board = []

	for (var i=0; i<length; i++) {
		board[i] = []
		for (var j=0; j<length; j++) {
			board[i][j] = createCell()
		}
	}

	return board;
}


function createCell() {
	var cell = {
		minesAroundCount: null,
 		isShown: false,
 		isMine: false, 
 		isMarked: false,
 		symbol: EMPTY 
	}

	return cell
}



function renderBoard(board) {
  var length = board.length; //Assuming for n*n square;
	
  var strHTML = '<table border="0"><tbody>';
  for (var i = 0; i < length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < length; j++) {
      var cell = board[i][j]; //cellObj del
      var className = `cell cover coord-${i}-${j}`
      strHTML += `<td class="${className}"
       onclick="cellClicked(this, ${i}, ${j})"
       oncontextmenu="markCell(this, ${i}, ${j})"
       ></td>`
    }
    strHTML += '</tr>'
  }
  strHTML += '</tbody></table>';
  var elContainer = document.querySelector(".board-container");
  elContainer.innerHTML = strHTML;
}



function placeMines(amount) { 
	var board = gBoard;
	for (var i=0; i<amount; i++) { 
		var randCoord = getRandomEmptyCoord() //returns random coord (that is not a mine and covered)
		if (randCoord) {
			var cellObj = board[randCoord.i][randCoord.j]
			cellObj.isMine = true
			//cellObj.symbol = MINE; //It will be overrite in the setMinesNegsCount() function
			gMinesCoords.push(randCoord)
		}
	}
}


function setMinesNegsCount() {
	var board = gBoard;
	var length = board.length
	for (var i=0; i<length; i++) {
		for (var j=0; j<length; j++) {
			var cellObj = board[i][j];
			var mineNegsCount = getMineNegs({i:i, j:j}).length;
			cellObj.minesAroundCount = mineNegsCount;
			if (cellObj.isMine) cellObj.symbol = MINE;
			else cellObj.symbol = colorNumsMap[mineNegsCount] //colored num
		}
	}
}


function revealCell(cellObj, elCell) {
		//handle model
		cellObj.isShown = true; //DRY
		gGame.shownCount++
		//handle the DOM
		elCell.classList.remove('cover')
		elCell.innerHTML = cellObj.symbol;
}

function cellClicked(elCell, i, j) {

	if (!gGame.isOn && gGame.shownCount>0) return //game ended... else - enter to the function	

	var cellObj = gBoard[i][j]
	if (cellObj.isMarked || cellObj.isShown) return; //shown or marked cell - return


	if (gGame.hintMode) {
		useHint(i, j); 	
		return	
	}

	cellObj.isShown = true; 
	
	if (cellObj.isMine) {		
		revealCell(cellObj, elCell)
		elCell.style.backgroundColor = "red"  
		gGame.lives--;
		document.querySelector('.lives').innerText = gGame.lives
		document.querySelector('.smiley').innerText = SAD
		checkGameOver()
		return;
	} 

	//improved
	if (!gGame.shownCount) startGame() 	
	revealCell(cellObj, elCell)
	if (cellObj.minesAroundCount === 0) expandShown(i, j) 
	
 	document.querySelector('.smiley').innerText = HAPPY;
 	checkGameOver()
}


function expandShown(i, j) {
	var coordI = i;
	var coordJ = j;
	var board = gBoard;

	for (var i=coordI-1; i<=coordI+1; i++) {
		for (var j=coordJ-1; j<=coordJ+1; j++) {
			if (i===coordI && j===coordJ) continue;
			if (i<0 || i>board.length-1) continue;
			if (j<0 || j>board[0].length-1) continue;
			var elNeg = document.querySelector(`.coord-${i}-${j}`)
			cellClicked(elNeg, i, j)
		}
	}
}


//Called on right click to mark a cell (suspected to be a mine)
function markCell(elCell, i, j) { //added i, j (?) ques
	event.preventDefault() //Avoid menu open
	if (!gGame.isOn) return // game is off.
	var cellObj = gBoard[i][j];
	if (cellObj.isShown) return; //The cell revealed.

	if (cellObj.isMarked) {
		cellObj.isMarked = false;
		elCell.innerText = EMPTY;
	} else {
		cellObj.isMarked = true;
		elCell.innerText = FLAG;
	}
}


function stopGame() { //GAME FUNC
	console.log('game stopped')
	clearInterval(gTimerInterval)
	gGame.isOn = false;
}



function getElCellByCoord(coord) { //UTIL FUNC
	var elCell = document.querySelector(`.coord-${coord.i}-${coord.j}`)
	return elCell;
}


 
function checkGameOver() { //GAME FUNC
	var board = gBoard; 
	var length = board.length
	
	//player dead GAME OVER
	if (!gGame.lives) { 
		//reveal all mines
		for (var i=0; i<gMinesCoords.length; i++) {
			var mineCoord = gMinesCoords[i] 
			var elContainMine = getElCellByCoord(mineCoord)
			elContainMine.classList.remove('cover');
			elContainMine.innerText = MINE;
		} 
		stopGame()
		document.querySelector('.smiley').innerText = DEAD
		return;
	}	
	
	//check for WINNING
	var isEmptyLeft = getRandomEmptyCoord()
	if (!isEmptyLeft) { //no covered && empties left on the board! WINNER
		document.querySelector('.smiley').innerText = SUNGLASSES
		var score = gGame.secsPassed 
		setScore(score) 
		updatePlayersList()
		stopGame()
	}

}




function startGame() { //GAME FUNC
	gGame.isOn = true
	gTimerInterval = setInterval(function() { //OUR TIMER
		gGame.secsPassed++
		var elTimer = document.querySelector('.timer')
		var formattedSec = '000'+gGame.secsPassed
		var lastDigitIdx = formattedSec.length-1
		elTimer.innerText = formattedSec[lastDigitIdx-2]+formattedSec[lastDigitIdx-1]+formattedSec[lastDigitIdx];
	},1000)

	placeMines(gLevel.MINES)
	setMinesNegsCount()
}




function getRandomEmptyCoord() { //UTIL FUNC. using it to place mines and to check victory
	var board = gBoard;
	var empties = []

	for (var i=0; i<board.length; i++) {
		for (var j=0; j<board[0].length; j++) { //board[0].length: incase the length/width differents (Not the case in the game)
			var cellObj = board[i][j]
			if (cellObj.isMine === false && !cellObj.isShown) empties.push({i:i, j:j}) 
		}
	}

	var randNum = getRandomInt(0, empties.length)
	return empties[randNum]
}



//returns an array of mine negs. maybe change it to getMineNegsCount.
function getMineNegs(coord) { //GAME FUNC. using it in setMinesNegsCount()
	var board = gBoard;
	var coordI = coord.i; 
	var coordJ = coord.j;

	var mineNegs = [] 

	for (var i=coordI-1; i<=coordI+1; i++) {
		for (var j=coordJ-1; j<=coordJ+1; j++) {
			if (i===coordI && j===coordJ) continue;
			if (i<0 || i>board.length-1) continue;
			if (j<0 || j>board[0].length-1) continue;
			var currCellObj = board[i][j]
			if (currCellObj.isMine) mineNegs.push(currCellObj)
		}
	}

	return mineNegs;
}


function toggleHintMode(){
	if (!gGame.isOn) return	

	var elButton = document.querySelector('.hint-button')
	if (!gGame.hints) {
		elButton.innerText = 'NO HINTS'
		gGame.hintMode = false //exit hintMode for good
		return;
	} 
	if (!gGame.hintMode) {
		gGame.hintMode = true
		elButton.innerText = 'CANCEL'
		document.querySelector('.smiley').innerText = EYE
	} else {
		gGame.hintMode = false
		if (!gGame.hints) elButton.innerText = 'NO HINTS'
		else elButton.innerText = gGame.hints + ' Hints left'
	}
}

//exposing area
function useHint(i, j) { 
	gGame.hints--;
	toggleHintMode()
	var board = gBoard
	var coordI = i;
	var coordJ = j;

	for (var i=coordI-1; i<=coordI+1; i++) {
		for (var j=coordJ-1; j<=coordJ+1; j++) {
			if (i<0 || i>board.length-1) continue;
			if (j<0 || j>board[0].length-1) continue;
			var cellObj = board[i][j]
			if (cellObj.isShown) continue;
			var elCell = document.querySelector(`.coord-${i}-${j}`) 
			exposeCell(cellObj, elCell)
		}
	}

}


//improved
function exposeCell(cellObj, elCell) {
	cellObj.isShown = true //so if the user click it, nothing happens
	elCell.innerHTML = cellObj.symbol;
	
	if(cellObj.isMine) elCell.classList.add('hint-red')
	else elCell.classList.add('hint-green')

	gTimeoutExpose = setTimeout(function() {
		cellObj.isShown = false
		elCell.classList.remove('hint-red')
		elCell.classList.remove('hint-green')
		if (cellObj.isMarked) elCell.innerText = FLAG; //FLAG was there, keep it
		else elCell.innerText = EMPTY;
		document.querySelector('.smiley').innerText = HAPPY
	},1500)
}


function wichRadioIsChecked() {
	var elRadios = document.querySelectorAll('.size input')
	for (var i=0; i<elRadios.length; i++) {
		if(elRadios[i].checked) return elRadios[i];
	}	
}


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}




function sortByScore(obj1, obj2) {
	var sizeScore = 'size'+gLevel.SIZE;
	if(!obj1[sizeScore]) return -1
	if(!obj2[sizeScore]) return 1	
	return obj1[sizeScore] - obj2[sizeScore]
}




function setScore(score) {
	var bestScore = gPlayers[0].score
	var playerObj = gPlayers[getPlayerIdx(gCurrPlayer)] 
	var sizeMode = 'size'+gLevel.SIZE //size8
	if (!playerObj[sizeMode] || score < playerObj[sizeMode]) { //if not exist SET, if smaller reSET
		playerObj[sizeMode] = score
		localStorage.setItem('gPlayers', JSON.stringify(gPlayers));		
	}
}

//improved: now the program remebers you even if you didnt set a score
function getPlayerName(msg='') {
	var playerName = prompt(`${msg} Your Name:`)
	if (!playerName) {
		getPlayerName('Invalid Name.')
		return
	}
	playerName = playerName.toLowerCase()
	if (getPlayerIdx(playerName) !== -1) {
		alert(`Welcome back ${playerName}`)
		gCurrPlayer = playerName
	} else {
		alert(`Enjoy your FIRST time, ${playerName}! I'll remember you if you'll set a score.`)
		gPlayers.push({name:playerName})
		localStorage.setItem('gPlayers', JSON.stringify(gPlayers));
		gCurrPlayer = playerName;
	}
}


function getPlayerIdx(name) { 
	for (var i=0; i<gPlayers.length; i++){
		if (gPlayers[i].name === name) return i; 
	}
	
	return -1
}


function updatePlayersList(){ 
	gPlayers.sort(sortByScore)
	var sizeScore = 'size'+gLevel.SIZE
	var strHTML = ''
	for (var i=0; i<gPlayers.length; i++) {
		if (!gPlayers[i][sizeScore]) continue;
		strHTML += `<li> ${gPlayers[i].name}: ${gPlayers[i][sizeScore]} seconds </li>`
	}
	document.querySelector('.players-list').innerHTML = strHTML
}


function toggleDirections(elButton) {
	var isHide = document.querySelector('.directions').classList.toggle('hide')
	if (isHide) elButton.innerText = 'Directions 📕';
	else elButton.innerText = 'Directions 👇';
}










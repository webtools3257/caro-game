const overlay = document.querySelector("#overlay")
const lobby = document.querySelector("#lobby")
const lobbyUserNameDisplay = document.querySelector("#name")
const lobbyOpponentNameDisplay = document.querySelector("#opponent-name")
const lobbyRoomIDDisplay = document.querySelector("#room-id")
const lobbyTimeDisplay = document.querySelector("#counter")
const board = document.querySelector("#board")
const boardUserNameDisplay = document.querySelector("#board-username")
const boardOpponentNameDisplay = document.querySelector("#board-opponent-name")
let game_board = document.querySelector("#game")

var timer = null
var timeCounter = 0
var playerTurn = false
var playerCreateRoom = false
var started = false

const socket = io("https://third-oval-nail.glitch.me")
socket.emit("user init", {
	user_name: prompt("Input name : ")
})

socket.on("user ready", function(data) {
	overlay.classList.remove("active")
	boardUserNameDisplay.textContent = data.name
})

function createRoom() {
	socket.emit("create room", {})
	overlay.classList.add("active")
}

function joinRoom() {
	overlay.classList.add("active")
	socket.emit("join room", {
		room_id: prompt("Input ID")
	})
}

socket.on("joined room", function(d) {
	overlay.classList.remove("active")
	lobbyUserNameDisplay.textContent = d.room_id
	lobby.classList.add("open")
	lobbyUserNameDisplay.textContent = d.ally.name
})

socket.on("create room success", function(data) {
	playerTurn = true
	playerCreateRoom = true
	overlay.classList.remove("active")
	lobby.classList.add("open")
	lobbyUserNameDisplay.textContent = data.ally.name
	lobbyRoomIDDisplay.textContent = data.room_id
	timeCounter = 0
	timer = setInterval(() => {
		timeCounter += 1
		lobbyTimeDisplay.textContent = `Estimate : ${timeCounter}s`
	}, 1000)
})

socket.on("opponent joined", function(data) {
	lobbyOpponentNameDisplay.textContent = data.opponent.name
	lobbyRoomIDDisplay.textContent = data.room_id
	clearInterval(timer)
	playerTurn = false
	playerCreateRoom = false
	let cs = 10
	timer = setInterval(() => {
		cs -= 1
		lobbyTimeDisplay.textContent = `Start in : ${cs}s`
		if (cs == 0) {
			clearInterval(timer)
			lobby.classList.remove("open")
			board.classList.add("open")
			boardOpponentNameDisplay.textContent = data.opponent.name
			startGame()
		}
	}, 1000)
})

function drawBoard() {
	game_board.innerHTML = ""
	for (var i = 0; i < 10; i++) {
		let e = document.createElement("tr")
		for (var j = 0; j < 10; j++) {
			e.innerHTML += `
				<td data-pos="${i}:${j}"></td>
			`
		}
		game_board.appendChild(e)
	}
}

socket.on("opponent leave", function(d) {
	lobbyOpponentNameDisplay.textContent = ""
	clearInterval(timer)
	playerTurn = false
	playerCreateRoom = false
	overlay.classList.add("active")
	setTimeout(() => {
		overlay.classList.remove("active")
		board.classList.remove("open")
		game_board.classList.remove("inactive")
		lobby.classList.remove("open")
		alert("The opponent has left the match!")
	}, 5000)
})

function startGame() {
	drawBoard()
	started = true
}

socket.on("room full", function(d) {
	alert("The room is full of players!")
	playerCreateRoom = false
	started = false
})

socket.on("create room failed", function(d) {
	alert(d.cause.msg)
	playerCreateRoom = false
	started = false
	document.querySelector("#overlay").classList.remove("active")
})

socket.on("join room failed", function(d) {
	alert(d.cause.msg)
	playerCreateRoom = false
	started = false
	document.querySelector("#overlay").classList.remove("active")
})

socket.on("play success", function(d) {
	playerTurn = false
	document.querySelector(`[data-pos="${d.row}:${d.col}"]`).classList.add(playerCreateRoom ? "X" : "O")
	game_board.classList.add("inactive")
})

socket.on("play failed",function(d){
	alert("Location has been selected !")
})

socket.on("opponent play", function(d) {
	let row = d.row
	let col = d.col
	document.querySelector(`[data-pos="${row}:${col}"]`).classList.add(playerCreateRoom ? "O" : "X")
	playerTurn = true
	game_board.classList.remove("inactive")
})


board.addEventListener(function(e) {
	let col = e.target.cellIndex
	let row = e.target.parentNode.rowIndex
	if (!playerTurn) {
		alert("Please wait your turn ")
		return
	}

	if (state == null) {
			socket.emit("play", {
			row: row,
			col: col
		})
	}
	
})

socket.on("create room failed", function(d) {
	alert(d.cause.msg)
})

socket.on("join room failed", function(d) {
	alert(d.cause.msg)
})
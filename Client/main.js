window.addEventListener("click", function(e) {
	let target = e.target
	let args = target.dataset
	switch (args.action) {
		case "toggle-tab":
			let tab = document.querySelector(args.tab)
			let index = parseInt(args.index)
			let tabContent = tab.querySelector(".tab-content")
			for (var i = 0; i < tabContent.children.length; i++) {
				tabContent.children[i].classList.remove("active")
			}
			let tabItem = tab.querySelector(".tab-header")
			for (var i = 0; i < tabItem.children.length; i++) {
				tabItem.children[i].classList.remove("active")
			}
			target.classList.add("active")
			tabContent.children[index].classList.add("active")
			break
		case "close":
			let window_ = document.querySelector(args.window)
			window_.classList.remove("active")
	}
})

const socket = window.io("https://third-oval-nail.glitch.me")

let createRoomWindow = document.querySelector("#window1")
let overlay = document.querySelector("#overlay")
document.querySelector("#btn1").addEventListener("click", function(e) {
	createRoom()
})

document.querySelector("#btn3").addEventListener("click", function(e) {
	joinRoom()
})

document.querySelector("#btn-close-create-room-window").addEventListener("click", function(e) {
	leaveRoom()
	createRoomWindow.classList.remove("active")
})

function generateEmptyBoard(w, h) {
	let board = []
	for (var i = 0; i < w; i++) {
		board.push([])
		for (var j = 0; j < h.length; j++) {
			board[i].push(null)
		}
	}
	return board
}

class CaroTable {
	constructor() {
		this.board = generateEmptyBoard()
		this.player = {
			played: false,
			name: "A"
		}
		this.opponent = {
			played: false,
			name: "B"
		}

		this.start = null
		this.boardElement = document.createElement("table")
	}

	reset() {
		this.board = generateEmptyBoard()
		this.playerX = "unknown"
		this.playerY = "unknown"
		this.currentPlayer = this.playerX
	}

	isEmptyCell(row, col) {
		return this.board[rơ]
	}

	playerPlay(row, col) {
		if (this.opponent.played == true && this.isEmptyCell(row, col)) {
			this.board[row][col] = this.start == this.player ? "X" : "O"
			this.opponent.played = false
			this.player.played = true
		}
	}

	opponentPlay(row, col) {
		if (this.player.played == true && this.isEmptyCell(row, col)) {
			this.board[row][col] = this.start == this.player ? "O" : "X"
			this.opponent.played = true
			this.player.played = false
		}
	}

	startGame() {
		document.querySelector("#board").classList.add("active")
		if (this.start != "player") {
			this.boardElement.classList.add("disable")
		}

	}
}

let Caro = null
let timer = null
let timeCounter = 0
let playerCreateRoom = false
function startTimer() {
	timeCounter = 0
	timer = setInterval(() => {
		timeCounter++
		document.querySelector("#timer").innerHTML = timeCounter
	}, 1000)
}

function clearTimer() {
	clearInterval(timer)
	document.querySelector("#timer-type").innerHTML = "Emirates : "
}

function createRoom() {
	overlay.classList.add("active")
	playerCreateRoom = true
	createRoomWindow.classList.add("active")
	socket.emit("create room", {})
	Caro = new CaroTable()
	Caro.player.name = socket.name
	Caro.player.played = false
	Caro.player.isCreatedRoom = true
	Caro.boardElement = document.querySelector("#game")
}

function joinRoom() {
	let room_id = prompt("Input ID :")
	socket.emit("join room", {
		room_id: room_id
	})
	overlay.classList.add("active")
	createRoomWindow.classList.add("active")
	Caro = new CaroTable()
	Caro.player.name = socket.name
	Caro.player.isCreatedRoom = false
	Caro.player.played = true
	Caro.opponent.played = false
	Caro.start = "opponent"
	Caro.boardElement = document.querySelector("#game")
}

function leaveRoom() {
	overlay.classList.add("active")
	socket.emit("leave room")
	playerCreateRoom = false
}

socket.emit("user init", {
	user_name: prompt("Please enter your name :")
})

socket.on("opponent joined", function(data) {
	document.querySelector("#name-opponent").innerHTML = data.opponent.name
	document.querySelector("#board-opponent-name").innerHTML = data.opponent.name
	Caro.opponent.name = data.name
	document.querySelector("#timer-type").innerHTML = "Start in  : "
	clearTimer()
	let c = 10
	let t = setInterval(() => {
		c -= 1
		document.querySelector("#timer-type").innerHTML = "Start in  : "
		document.querySelector("#timer").innerHTML = c
		if (c <= 0) {
			clearInterval(t)
			Caro.startGame()
		}
	},1000)
})

socket.on("user ready", function(data) {
	document.querySelector("#username").innerHTML = data.name
	document.querySelector("#name-player").innerHTML = data.name
	document.querySelector("#board-username").innerHTML = data.name
})

socket.on("create room success", function(data) {
	overlay.classList.remove("active")
	document.querySelector("#room-id").innerHTML = data.room_id
	startTimer()
	document.querySelector("#timer-type").innerHTML = "Emirates : "
})

socket.on("leave room success", function(data) {
	Caro = null
	clearTimer()
	playerCreateRoom = false
	document.querySelector("#name-opponent").innerHTML = "???"
	document.querySelector("#board-opponent-name").innerHTML = "???"
	document.querySelector("#board").classList.remove("active")
	overlay.classList.remove("active")
	createRoomWindow.classList.remove("active")
})

socket.on("opponent leave", function(data) {
	Caro = null
	clearTimer()
	document.querySelector("#board").classList.remove("active")
	document.querySelector("#name-opponent").innerHTML = "???"
	document.querySelector("#board-opponent-name").innerHTML = "???"
	document.querySelector("#board").classList.remove("active")
	overlay.classList.remove("active")
	if(!playerCreateRoom){
		createRoomWindow.classList.remove("active")
		socket.emit("leave room",{})
	}else{
		createRoomWindow.classList.add("active")
	}

})


socket.on("joined room",function(){
	createRoomWindow.classList.add("active")
	overlay.classList.remove("active")
})
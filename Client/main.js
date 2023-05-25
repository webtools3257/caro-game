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

window.onerror = function() {
	addMessage("Oops ! Error when start app !")
}

window.onoffline = function() {
	addMessage("You are offline ")
}


const socket = window.io("https://third-oval-nail.glitch.me")

let createRoomWindow = document.querySelector("#window1")
let overlay = document.querySelector("#overlay")
document.querySelector("#btn1").addEventListener("click", function(e) {
	overlay.classList.add("active")
	socket.emit("create room", {})
	createRoom()
})

document.querySelector("#btn3").addEventListener("click", function(e) {
	joinRoom()
})

document.querySelector("#surrender").addEventListener("click", function(e) {
	surrender()
})

document.querySelector("#btn-close-create-room-window").addEventListener("click", function(e) {
	leaveRoom()
	createRoomWindow.classList.remove("active")
})

document.querySelector("#lang").addEventListener("change", function(e) {
	localStorage.setItem("lang", document.querySelector("#lang").value)
	alert(language.alerts["change lang"])
})

document.querySelector("#play-again").addEventListener("click", function(e) {
	document.querySelector("#result").classList.remove("active")
	socket.emit("request play again", {})
	overlay.classList.add("active")
})

document.querySelector("#close-result-display").addEventListener("click", function(e) {
	document.querySelector("#result").classList.remove("active")
	lastRoomID = roomID
	if (!playerCreateRoom) {
		document.querySelector("#name-opponent").innerHTML = "???"
		document.querySelector("#board-opponent-name").innerHTML = "???"
		document.querySelector("#info-name-opponent").innerHTML = "???"
		createRoomWindow.classList.remove("active")
		socket.emit("leave room", {})
	} else {
		document.querySelector("#name-opponent").innerHTML = "???"
		document.querySelector("#board-opponent-name").innerHTML = "???"
		document.querySelector("#info-name-opponent").innerHTML = "???"
		createRoomWindow.classList.add("active")
		createRoom()
	}
})

function drawBoard(game_board) {
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
		drawBoard(this.boardElement)
	}
}

let Caro = null
let estimateTimer = null
let estimateTimeCounter = 0
let countdownTimer = null
let countdown = 10
let playerCreateRoom = false
let language = []
let roomID = null
let lastRoomID = null

function requestPlayAgain() {
	socket.emit("request play again", {})
}

function startEstimateTimer() {
	estimateTimeCounter = 0
	estimateTimer = setInterval(() => {
		estimateTimeCounter++
		document.querySelector("#timer").innerHTML = estimateTimeCounter
	}, 1000)
}

function clearEstimateTimer() {
	clearInterval(estimateTimer)
	document.querySelector("#timer-type").innerHTML = `<s-lang title="estimate"></s-lang> : `
}

function startCountdown() {
	countdown = 10
	countdownTimer = setInterval(() => {
		countdown -= 1
		document.querySelector("#timer-type").innerHTML = `<s-lang title="start in"></s-lang> : `
		document.querySelector("#timer").innerHTML = countdown
		if (countdown <= 0) {
			clearInterval(countdownTimer)
			Caro.startGame()
		}
	}, 1000)
}

function clearCountdown() {
	document.querySelector("#timer-type").innerHTML = `<s-lang title="estimate"></s-lang> : `
	document.querySelector("#timer").innerHTML = 0
	clearInterval(countdownTimer)
	countdown = 10
}

function createRoom() {
	playerCreateRoom = true
	createRoomWindow.classList.add("active")
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
	socket.emit("leave room", {})
	playerCreateRoom = false
}

function surrender() {
	socket.emit("surrender", {})
}

function rejoinRoom() {
	Caro = new CaroTable()
	Caro.player.name = socket.name
	Caro.player.isCreatedRoom = false
	Caro.player.played = true
	Caro.opponent.played = false
	Caro.start = "opponent"
	Caro.boardElement = document.querySelector("#game")
}

socket.on("opponent joined", function(data) {
	document.querySelector("#name-opponent").innerHTML = data.opponent.name
	document.querySelector("#board-opponent-name").innerHTML = data.opponent.name
	Caro.opponent.name = data.name
	document.querySelector("#timer-type").innerHTML = `<s-lang title="start in"></s-lang> : `
	clearEstimateTimer()
	startCountdown()
	addMessage(language.messages["opponent joined"])
})

socket.on("user ready", function(data) {
	overlay.classList.remove("active")
	document.querySelector("#username").innerHTML = data.name
	document.querySelector("#name-player").innerHTML = data.name
	document.querySelector("#board-username").innerHTML = data.name
	document.querySelector("#info-name-player").innerHTML = data.name
})

socket.on("create room success", function(data) {
	overlay.classList.remove("active")
	document.querySelector("#room-id").innerHTML = data.room_id
	startEstimateTimer()
	addMessage(language.messages["create room success"])
	document.querySelector("#timer-type").innerHTML = `<s-lang title="estimate"></s-lang> : `
	roomID = data.room_id
})

socket.on("leave room success", function(data) {
	Caro = null
	clearEstimateTimer()
	clearCountdown()
	playerCreateRoom = false
	roomID = null
	addMessage(language.messages["leave room success"])
	document.querySelector("#name-opponent").innerHTML = "???"
	document.querySelector("#board-opponent-name").innerHTML = "???"
	document.querySelector("#info-name-opponent").innerHTML = "???"
	document.querySelector("#board").classList.remove("active")
	overlay.classList.remove("active")
	createRoomWindow.classList.remove("active")
})

socket.on("opponent leave", function(data) {
	Caro = null
	addMessage(language.messages["opponent leave"])
	clearEstimateTimer()
	document.querySelector("#name-opponent").innerHTML = "???"
	document.querySelector("#board-opponent-name").innerHTML = "???"
	document.querySelector("#info-name-opponent").innerHTML = "???"
	document.querySelector("#board").classList.remove("active")
	overlay.classList.remove("active")
	clearCountdown()
	if (!playerCreateRoom) {
		createRoomWindow.classList.remove("active")
		socket.emit("leave room", {})
	} else {
		createRoomWindow.classList.add("active")
		createRoom()
	}
})

socket.on("joined room", function(data) {
	createRoomWindow.classList.add("active")
	overlay.classList.remove("active")
	document.querySelector("#room-id").innerHTML = data.room_id
	addMessage(language.messages["joined room"])
	roomID = data.room_id
})

socket.on("opponent request play again", function(data) {
	overlay.classList.remove("active")
	let status = confirm("The opponent asked to play again. Do you agree?")
	if (status) {
		socket.emit("accept play again", {
			room_id: roomID
		})
		document.querySelector("#result").classList.remove("active")
		createRoomWindow.classList.add("active")
		createRoom()
		startCountdown()
	} else {
		socket.emit("not accept play again", {})
	}
})

socket.on("opponent accept play again", function(data) {
	overlay.classList.remove("active")
	document.querySelector("#result").classList.remove("active")
	createRoomWindow.classList.add("active")
	rejoinRoom()
	startCountdown()
})

socket.on("opponent not accept play again", function() {
	overlay.classList.remove("active")
	addMessage(language.messages["opponent not accept play again"])
})

function addMessage(text) {
	let id = Date.now()
	setTimeout(() => {
		document.querySelector(`#_${id}`).remove()
	}, 2000)
	document.querySelector("#notification").innerHTML += `
		<div class="notification" id="_${id}">
			${text}
		</div>
	`
}

async function loadLanguage() {
	let langName = localStorage.getItem("lang")
	if (!langName) {
		langName = "en"
	}
	document.querySelector("#lang").value = langName
	let response = await fetch(`./languages/${langName}.json`)
	let raw = await response.text()
	language = JSON.parse(raw)
}

class DisplayLang extends HTMLElement {
	constructor() {
		super()
	}

	connectedCallback() {
		let title = this.getAttribute("title")
		this.outerHTML = language.ui[title]
	}
}

socket.on("in the room", function() {
	addMessage(language.messages["in the room"])
	overlay.classList.remove("active")
})

socket.on("room full", function() {
	addMessage(language.messages["room full"])
	overlay.classList.remove("active")
})

socket.on("room not exist", function() {
	addMessage(language.messages["room not exist"])
	overlay.classList.remove("active")
})

socket.on("opponent surrender", function() {
	document.querySelector("#result-state").innerHTML = "Win"
	document.querySelector("#result").classList.add("active")
	Caro = null
	addMessage(language.messages["opponent surrender"])
	clearEstimateTimer()
	document.querySelector("#name-opponent").innerHTML = "???"
	document.querySelector("#board-opponent-name").innerHTML = "???"
	document.querySelector("#info-name-opponent").innerHTML = "???"
	document.querySelector("#board").classList.remove("active")
	overlay.classList.remove("active")
	clearCountdown()
})

socket.on("surrender success", function() {
	document.querySelector("#result-state").innerHTML = "Lose"
	document.querySelector("#result").classList.add("active")
	Caro = null
	clearEstimateTimer()
	document.querySelector("#name-opponent").innerHTML = "???"
	document.querySelector("#board-opponent-name").innerHTML = "???"
	document.querySelector("#info-name-opponent").innerHTML = "???"
	document.querySelector("#board").classList.remove("active")
	overlay.classList.remove("active")
	clearCountdown()
})

loadLanguage().then(() => {
	window.customElements.define("s-lang", DisplayLang)
	let name = ""
	while (true) {
		name = prompt(language.prompts["input name"])
		if (!name) {
			name = "Anonymous player"
			break
		} else {
			if (name.length > 12) {
				alert(language.alerts["name too long"])
			} else {
				break
			}
		}
	}

	socket.emit("user init", {
		user_name: name
	})

})
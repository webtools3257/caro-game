const overlay = document.querySelector("#overlay")
const languageSelect = document.querySelector("#lang-select")
const lobby = document.querySelector("#lobby")
const lobbyUserNameDisplay = document.querySelector("#name")
const lobbyOpponentNameDisplay = document.querySelector("#opponent-name")
const lobbyRoomIDDisplay = document.querySelector("#room-id")
const lobbyTimeDisplay = document.querySelector("#counter")
const board = document.querySelector("#board")
const boardUserNameDisplay = document.querySelector("#board-username")
const boardOpponentNameDisplay = document.querySelector("#board-opponent-name")
const result = document.querySelector("#result")
const resultBoardUserNameDisplay = document.querySelector("#result-username")
const resultBoardOpponentNameDisplay = document.querySelector("#result-opponent-name")
const resultMatchDisplay = document.querySelector("#result-match")
let game_board = document.querySelector("#game")

var language = {}

async function loadLanguage() {
	let langName = localStorage.getItem("lang")
	if (langName == null) {
		localStorage.setItem("lang", "en")
		langName = "en"
	}
	let res = await fetch(`https://webtools3257.github.io/caro-game/client/languages/${langName}.json`)
	try {
		language = JSON.parse(await res.text())
		languageSelect.value = langName
	} catch (e) {
		console.log(e)
		alert(e)
		alert("Unable to load language resource.Unable to load language resource. The game will use the default language.")
		localStorage.setItem("lang", "en")
		await loadLanguage()
	}

}

var timer = null
var timeCounter = 0
var playerTurn = false
var playerCreateRoom = false
var started = false

const socket = io("https://third-oval-nail.glitch.me")

function createRoom() {
	socket.emit("create room", {})
	overlay.classList.add("active")
}

function joinRoom() {
	let room_id = null
	room_id = prompt("Input ID")
	if (!room_id) {

		return
	}
	overlay.classList.add("active")
	socket.emit("join room", {
		room_id: room_id
	})
}

function startTimer() {
	timeCounter = 0
	timer = setInterval(() => {
		timeCounter += 1
		lobbyTimeDisplay.innerHTML = `<s-lang title="estimate">Estimate</s-lang> : ${timeCounter}s`
	}, 1000)

}
socket.on("joined room", function(d) {
	playerTurn = false
	playerCreateRoom = false
	overlay.classList.remove("active")
	lobby.classList.add("open")
	lobbyUserNameDisplay.textContent = d.ally.name
	resultBoardUserNameDisplay.textContent = d.ally.name
})

socket.on("create room success", function(data) {
	playerTurn = true
	playerCreateRoom = true
	overlay.classList.remove("active")
	lobby.classList.add("open")
	lobbyUserNameDisplay.textContent = data.ally.name
	resultBoardUserNameDisplay.textContent = data.ally.name
	lobbyRoomIDDisplay.textContent = data.room_id
	startTimer()
})

socket.on("opponent joined", function(data) {
	lobbyOpponentNameDisplay.textContent = data.opponent.name
	resultBoardOpponentNameDisplay.textContent = data.opponent.name
	lobbyRoomIDDisplay.textContent = data.room_id
	clearInterval(timer)
	let cs = 10
	timer = setInterval(() => {
		cs -= 1
		lobbyTimeDisplay.innerHTML = `<s-lang title="start in">Start in</s-lang> : ${cs}s`
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
	resultBoardOpponentNameDisplay.textContent = ""
	clearInterval(timer)
	playerTurn = false
	playerCreateRoom = false
	overlay.classList.add("active")
	setTimeout(() => {
		overlay.classList.remove("active")
		board.classList.remove("open")
		game_board.classList.remove("inactive")
		lobby.classList.remove("open")
		alert(language.message["opponent leave"])
	}, 5000)
})

function startGame() {
	if (playerTurn) {
		alert("You start !")
	}
	drawBoard()
	started = true
}

socket.on("room full", function(d) {
	alert(language.message["room full"])
	overlay.classList.remove("active")
	playerCreateRoom = false
	started = false
})


socket.on("play success", function(d) {
	playerTurn = false
	document.querySelector(`[data-pos="${d.row}:${d.col}"]`).classList.add(playerCreateRoom ? "X" : "O")
	game_board.classList.add("inactive")
})

socket.on("play failed", function(d) {
	alert(language.message["play failed"])
})

socket.on("opponent play", function(d) {
	let row = d.row
	let col = d.col
	document.querySelector(`[data-pos="${row}:${col}"]`).classList.add(playerCreateRoom ? "O" : "X")
	playerTurn = true
	game_board.classList.remove("inactive")
})


board.addEventListener("click", function(e) {
	let col = e.target.cellIndex
	let row = e.target.parentNode.rowIndex
	if (!playerTurn) {
		alert(language.message["wait your turn"])
		return
	}
	socket.emit("play", {
		row: row,
		col: col,
		player: playerCreateRoom ? "X" : "O"
	})
})

socket.on("room not exist", function(d) {
	alert(language.message["room not exist"])
	overlay.classList.remove("active")
})

socket.on("joined the room warning", function(d) {
	alert(language.message["joined the room warning"])

})

socket.on("win", function(data) {
	result.classList.add("active")
	resultMatchDisplay.textContent = "Victory"

	if (playerCreateRoom) {
		board.classList.remove("open")
		lobbyUserNameDisplay.textContent = "????"
		lobby.classList.add("open")
	}

})

socket.on("opponent won", function(data) {
	result.classList.add("active")
	resultMatchDisplay.textContent = "Lose"
	if (playerCreateRoom) {
		board.classList.remove("open")
		lobbyUserNameDisplay.textContent = "????"
		lobby.classList.add("open")
	}
})


function leaveRoom() {
	socket.emit("leave room", {})
	playerTurn = false
	playerCreateRoom = false
	lobby.classList.remove("open")
	board.classList.remove("open")
	overlay.classList.add("active")
	setTimeout(() => {
		overlay.classList.remove("active")
	}, 3000)
}

class LangDisplayComponent extends HTMLElement {
	constructor() {
		super()
	}

	connectedCallback() {
		this.textContent = language.ui[this.getAttribute("title")]
	}
}

loadLanguage()
	.then(() => {
		let name = null
		while (true) {
			name = prompt(language.message["input name"])
			if (!name) {
				name = "Anonymous Player"
				break
			} else {
				if (name.length > 12) {
					alert("Name is too long ")
				} else {
					break
				}
			}
		}
		window.customElements.define("s-lang", LangDisplayComponent)
		socket.emit("user init", {
			user_name: name
		})

		socket.on("user ready", function(data) {
			overlay.classList.remove("active")
			document.querySelector("#username").textContent = data.name
			boardUserNameDisplay.textContent = data.name
		})
	})


languageSelect.addEventListener("change", function(e) {
	alert(language.message["change lang"])
	localStorage.setItem("lang", languageSelect.value)
})
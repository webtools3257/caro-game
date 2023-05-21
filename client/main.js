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
let game_board = document.querySelector("#game")

var language = {}

async function loadLanguage() {
	let langName = localStorage.getItem("lang")
	if (langName == null) {
		localStorage.setItem("lang", "en")
		langName = "en"
	}
	
	let res = await fetch(`${window.location.origin}/client/languages/${langName}.json`)
	try {
		language = JSON.parse(await res.text())
		languageSelect.value = langName
	} catch (e) {
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
	overlay.classList.add("active")
	socket.emit("join room", {
		room_id: prompt("Input ID")
	})
}

socket.on("joined room", function(d) {
	playerTurn = false
	playerCreateRoom = false
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
		lobbyTimeDisplay.innerHTML = `<s-lang title="estimate">Estimate</s-lang> : ${timeCounter}s`
	}, 1000)
})

socket.on("opponent joined", function(data) {
	lobbyOpponentNameDisplay.textContent = data.opponent.name
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
	drawBoard()
	started = true
}

socket.on("room full", function(d) {
	alert(language.message["room full"])
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
		col: col
	})
})

socket.on("room not exist", function(d) {
	alert(language.message["room not exist"])
})

socket.on("joined the room warning", function(d) {
	alert(language.message["joined the room warning"])
})

function leaveRoom(){
	socket.emit("leave room",{})
	playerTurn = false
	playerCreateRoom = false
	lobby.classList.remove("open")
	board.classList.remove("open")
	overlay.classList.add("active")
	setTimeout(()=>{
		overlay.classList.remove("active")
	},3000)
}

class LangDisplayComponent extends HTMLElement{
	constructor(){
		super()
	}
	
	connectedCallback(){
		this.textContent = language.ui[this.getAttribute("title")]
	}
}

loadLanguage()
	.then(() => {
		window.customElements.define("s-lang",LangDisplayComponent)
		socket.emit("user init", {
			user_name: prompt(language.message["input name"])
		})

		socket.on("user ready", function(data) {
			overlay.classList.remove("active")
			boardUserNameDisplay.textContent = data.name
		})
	})

languageSelect.addEventListener("change",function(e){
	alert(language.message["change lang"])
	localStorage.setItem("lang",languageSelect.value)
})
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
	addMessage("No internet connection  ")
}

window.ononline = function() {
	addMessage("Internet connection is back !")
}
const socket = window.io("https://third-oval-nail.glitch.me")
const chatSocket= window.io("https://third-oval-nail.glitch.me/chat")

let createRoomWindow = document.querySelector("#window1")
let overlay = document.querySelector("#overlay")
let language = {}

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


const Caro = {
	playerName: "unknown",
	timeCounter: 0,
	timeEnd: 0,
	timeCountType: "up",
	timer: null,
	timerRan:false,
	gameStarted: false,
	board: [],
	playerTurn: false,
	isCreateRoom: false,
	playStack: [],
	prepareBoard: function() {
		this.board = []
		document.querySelector("#game").innerHTML = ""
		for (var i = 0; i < 10; i++) {
			this.board.push([])
			let tr = document.createElement("tr")
			for (var j = 0; j < 10; j++) {
				this.board[i].push(null)
				tr.innerHTML += `
					<td data-pos="${i}_${j}"></td>
				`
			}
			document.querySelector("#game").appendChild(tr)
		}


	},
	checkWin: function(ch) {
		let n = 10
		let m = 10
		for (let i = 0; i < n; i++) {
			let count = 0;
			for (let j = 0; j < m; j++) {
				if (this.board[i][j] == ch) {
					count++;
					if (count == 5) return true;
				} else {
					count = 0;
				}
			}
		}

		for (let j = 0; j < m; j++) {
			let count = 0;
			for (let i = 0; i < n; i++) {
				if (this.board[i][j] == ch) {
					count++;
					if (count == 5) return true;
				} else {
					count = 0;
				}
			}
		}

		for (let k = 0; k < (2 * (n - 1)); k++) {
			let count = 0;
			for (let i = 0; i < n; i++) {
				let j = k - i;
				if (j >= 0 && j < m && this.board[i][j] == ch) {
					count++;
					if (count == 5) return true;
				} else {
					count = 0;
				}
			}
		}
		for (let k = 0; k < (2 * (n - 1)); k++) {
			let count = 0;
			for (let i = 0; i < n; i++) {
				let j = i - k;
				if (j >= 0 && j < m && this.board[i][j] == ch) {
					count++;
					if (count == 5) return true;
				} else {
					count = 0;
				}
			}
		}
		return false;
	},
	checkTie: function() {
		let c = 0
		for (var i = 0; i < 10; i++) {
			for (var j = 0; j < 10; j++) {
				if (this.board[i][j] != null) {
					c += 1
				}
			}
		}
		if (c == 20) return true
		return false
	},
	createRoom: function() {
		this.isCreateRoom = true
		socket.emit("create room")
	},
	resetGame: function() {
		this.clearTimer()
	},
	startTimer: function(type = "up", start = 0, end = null) {
		if(this.timerRan){
			return
		}
		this.timerRan = true
		this.timeCounter = start
		this.timeEnd = end
		this.timeCountType = type
		this.timer = setInterval(() => {
			if (this.timeCountType == "up") {
				this.timeCounter++
			} else {
				this.timeCounter--
			}
			document.querySelector("#timer").textContent = this.timeCounter
			if (this.timeEnd != null && this.timeEnd == this.timeCounter) {
				this.onTimeout()
				this.timerRan = false
				clearInterval(this.timer)
			}
		}, 1000)
	},

	play: function(row, col) {
		if (this.gameStarted && this.playerTurn) {
			if (this.board[row][col] == null) {
				this.board[row][col] = this.isCreateRoom ? "X" : "O"
				document.querySelector(`[data-pos="${row}_${col}`).classList.add(this.isCreateRoom ? "X" : "O")
				this.playerTurn = false
				socket.emit("play", {
					row: row,
					col: col
				})
				document.querySelector("#game").classList.add("inactive")
			}
			if (this.checkWin(this.isCreateRoom ? "X" : "O")) {
				document.querySelector("#result-state").innerHTML = "Win"
				this.endGame()
			} else if (this.checkTie()) {
				document.querySelector("#result-state").innerHTML = "Tie"
				this.endGame()
			}
		} else {
			addMessage("Please wait !")
		}
	},
	onOpponentPlay: function(row, col) {
		if (this.gameStarted && !this.playerTurn) {
			if (this.board[row][col] == null) {
				this.board[row][col] = this.isCreateRoom ? "O" : "X"
				document.querySelector(`[data-pos="${row}_${col}`).classList.add(this.isCreateRoom ? "O" : "X")
				this.playerTurn = true
				document.querySelector("#game").classList.remove("inactive")
			}
			if (this.checkWin(this.isCreateRoom ? "O" : "X")) {
				document.querySelector("#result-state").innerHTML = "Lose"
				this.endGame()
			} else if (this.checkTie()) {
				document.querySelector("#result-state").innerHTML = "Tie"
				this.endGame()
			}
		} else {
			if (!this.gameStarted) {
				this.playStack.push([row, col])
			}
		}
	},
	clearTimer: function() {
		this.timerRan = false
		clearInterval(this.timer)
	},
	onPlayerJoinedRoom: function() {
		this.isCreateRoom = false
		document.querySelector("#window1").classList.add("active")
		document.querySelector("#timer-type").innerHTML = "Estimate :"
		this.startTimer("up", 0, null)
	},
	prepareRoom: function() {
		document.querySelector("#opponent-name").innerHTML = "???"
		document.querySelector("#window1").classList.add("active")
		document.querySelector("#timer-type").innerHTML = "Estimate :"
		this.startTimer("up", 0, null)
	},
	prepareGame: function() {
		this.clearTimer()
		this.prepareBoard()
		this.startGame()
		document.querySelector("#board").classList.add("active")
	},
	startGame: function() {
		document.getElementById("play-again").style.display = "flex"
		if (this.isCreateRoom) {
			this.playerTurn = true
		}
		socket.emit("ready", {})
		this.clearTimer()
		this.gameStarted = true
		for (var i = 0; i < this.playStack.length; i++) {
			this.board[this.playStack[i].row][this.playStack[i].col] = this.isCreateRoom ? "O" : "X"
			document.querySelector(`[data-pos="${this.playStack[i].row}_${this.playStack[i].col}`).classList.add(this.isCreateRoom ? "O" : "X")
		}
		
		document.querySelector("#window1").classList.remove("active")

	},
	endGame: function() {
		this.playStack = []
		this.gameStarted = false
		document.querySelector("#board").classList.remove("active")
		document.querySelector("#result").classList.add("active")
	},
	onOpponentLeaveRoom: function() {
		if (this.gameStarted) {
			document.querySelector("#result-state").innerHTML = "Win"
			this.endGame()
		} else {
			this.resetGame()
			this.clearTimer()
			this.onTimeout = new Function()
			if (this.isCreateRoom) {
				this.prepareRoom()
				document.querySelector("#window1").classList.add("active")
			} else {
				socket.emit("leave room")
				document.querySelector("#window1").classList.remove("active")
			}
		}
	},
	onOpponentSurrender: function() {
		if (this.gameStarted) {
			document.querySelector("#result-state").innerHTML = "Win"
			this.endGame()
		} else {
			this.resetGame()
			this.clearTimer()
			this.onTimeout = new Function()
			if (this.isCreateRoom) {
				this.prepareRoom()
				document.querySelector("#window1").classList.add("active")
			} else {
				document.querySelector("#window1").classList.remove("active")
			}
		}
	},
	onPlayerSurrender: function() {
		if (this.gameStarted) {
			document.querySelector("#result-state").innerHTML = "Lose"
			this.endGame()
		} else {
			this.resetGame()
			this.clearTimer()
			this.onTimeout = new Function()
			document.querySelector("#window1").classList.remove("active")
		}
	},
	onPlayerLeaveRoom: function() {
		if (this.gameStarted) {
			document.querySelector("#result-state").innerHTML = "Lose"
			this.endGame()
		} else {
			this.resetGame()
			this.clearTimer()
			this.onTimeout = new Function()
			document.querySelector("#window1").classList.remove("active")
		}
	}
}

function inputName(){
	while(true){
		let name = prompt(language.prompts["input name"])
		if(!name){
			return "Anonymous"
		}else{
			if(name.length>12){
				alert(language.alerts["name too long"])

			}else{
				return name
			}
			
		}
	}
}


function joinRoom(id){
	socket.emit("join room",{
		room_id:id
	})
	overlay.classList.add("active")
}

document.querySelector("#btn-close-create-room-window").addEventListener("click", function(e) {
	socket.emit("leave room", {})
})

document.querySelector("#create-room-btn").addEventListener("click", function() {
	Caro.createRoom()
	overlay.classList.add("active")
})

document.querySelector("#join-room-btn").addEventListener("click", function() {
	joinRoom(prompt("ID"))
	
})

document.querySelector("#close-result-display").addEventListener("click", function() {
	document.querySelector("#result").classList.remove("active")
	if (Caro.isCreateRoom) {
		Caro.prepareRoom()
	} else {
		socket.emit("leave room", {})
	}
})

document.querySelector("#play-again").addEventListener("click", function(e) {
	overlay.classList.add("active")
	document.querySelector("#result").classList.remove("active")
	createRoomWindow.classList.add("active")
	socket.emit("request play again", {})
})

document.getElementById("surrender-btn").addEventListener("click", function() {
	socket.emit("surrender", {})
	if(!Caro.isCreateRoom){
		socket.emit("leave room", {})
	}
	overlay.classList.add("active")
})

document.querySelector("#game").addEventListener("click", function(e) {
	let col = e.target.cellIndex
	let row = e.target.closest('tr').rowIndex
	Caro.play(row, col)
})

document.getElementById("recruit").addEventListener("click",function(e){
	chatSocket.emit("send invitation",{
		room_id:Caro.room_id
	})
	addMessage("Sent")
	let msgEle = document.createElement("span")
	msgEle.classList.add("msg")
	msgEle.classList.add("player")
	msgEle.innerHTML = `You : Play with me .Room ID <span onclick=" window.joinRoom('${Caro.room_id}') ">${Caro.room_id}</span>`
	document.getElementById("msg-display").appendChild(msgEle)
	document.getElementById("msg-display").scrollTop = document.getElementById("msg-display").scrollHeight
})

document.querySelector("#lang").addEventListener("change",function(e){
	localStorage.setItem("lang",e.target.value)
	alert(language.alerts["change lang"])
})

document.getElementById("send-msg-btn").addEventListener("click",function(){
	let msg = document.getElementById("msg-input").value
	if(msg.length == 0){
		return
	}
	chatSocket.emit("send",{
		msg:msg
	})
	document.getElementById("msg-input").value = ""
	let msgEle = document.createElement("span")
	msgEle.classList.add("msg")
	msgEle.classList.add("player")
	msgEle.textContent =`You:${ msg}`
	document.getElementById("msg-display").appendChild(msgEle)
	document.getElementById("msg-display").scrollTop = document.getElementById("msg-display").scrollHeight

})

chatSocket.on("message",function(data){
	let msgEle = document.createElement("span")
	msgEle.classList.add("msg")
	msgEle.textContent = `${data.name}:${ data.msg}`
	document.getElementById("msg-display").appendChild(msgEle)
	document.getElementById("msg-display").scrollTop = document.getElementById("msg-display").scrollHeight
})

chatSocket.on("invitation", function(data) {
	let msgEle = document.createElement("span")
	msgEle.classList.add("msg")
	msgEle.innerHTML = `${data.name}: Play with me .Room ID <span onclick="window.joinRoom('${data.room_id}') ">${data.room_id}</span>`
	document.getElementById("msg-display").appendChild(msgEle)
	document.getElementById("msg-display").scrollTop = document.getElementById("msg-display").scrollHeight
})

socket.on("user ready", function(data) {
	document.getElementById("username").innerHTML = data.name
	document.getElementById("player-name").innerHTML = data.name
	document.getElementById("board-player-name").innerHTML = data.name
	document.getElementById("result-player-name").innerHTML = data.name
})

socket.on("opponent play", function(data) {
	Caro.onOpponentPlay(data.row, data.col)
})

socket.on("create room success", function(data) {
	Caro.room_id = data.room_id
	overlay.classList.remove("active")
	document.querySelector("#room-id").innerHTML = data.room_id
	Caro.prepareRoom()
	addMessage(language.messages["create room success"])
})


socket.on("opponent joined", function(data) {
	document.querySelector("#opponent-name").innerHTML = data.opponent.name
	document.querySelector("#board-opponent-name").innerHTML = data.opponent.name
	document.querySelector("#result-opponent-name").innerHTML = data.opponent.name
	Caro.prepareGame()
	addMessage(language.messages["opponent joined"])
})

socket.on("leave room success", function() {
	overlay.classList.remove("active")
	Caro.onPlayerLeaveRoom()
	addMessage(language.messages["leave room success"])
})

socket.on("opponent leave", function() {
	overlay.classList.remove("active")
	Caro.onOpponentLeaveRoom()
	addMessage(language.messages["opponent leave"])
})

socket.on("opponent surrender", function() {
	document.getElementById("play-again").style.display = "none"
	addMessage(language.messages["opponent surrender"])
	Caro.onOpponentSurrender()
})

socket.on("surrender success", function() {
	overlay.classList.remove("active")
	document.getElementById("play-again").style.display = "none"
	Caro.onPlayerSurrender()
})

socket.on("joined room", function(data) {
	Caro.room_id = data.room_id
	overlay.classList.remove("active")
	addMessage(language.messages["joined room"])
	document.querySelector("#room-id").innerHTML = data.room_id
	Caro.onPlayerJoinedRoom()
})

socket.on("in the room", function() {
	addMessage(language.messages["in the room"])
	overlay.classList.remove("active")
})

socket.on("room not exist", function() {
	addMessage(language.messages["room not exist"])
	overlay.classList.remove("active")
})

socket.on("room full", function() {
	addMessage(language.messages["room full"])
	overlay.classList.remove("active")
})

socket.on("opponent request play again", function(data) {
	overlay.classList.add("active")
	document.querySelector("#result").classList.remove("active")
	let state = confirm("Play again ?")
	if (state) {
		socket.emit("accept play again", {})
		overlay.classList.remove("active")
		createRoomWindow.classList.add("active")
		Caro.prepareGame()
	} else {
		socket.emit("not accept play again")
		overlay.classList.remove("active")
		document.querySelector("#result").classList.add("active")
	}
})

socket.on("opponent accept play again", function(data) {
	document.querySelector("#result").classList.remove("active")
	document.querySelector("#board").classList.add("active")
	overlay.classList.remove("active")
	Caro.prepareBoard()
	Caro.startGame()
	Caro.clearTimer()
})

socket.on("opponent not accept play again", function(data) {
	document.querySelector("#result").classList.add("active")
	overlay.classList.remove("active")
})

loadLanguage().then(() => {
	overlay.classList.remove("active")
	window.customElements.define("s-lang", DisplayLang)
	let name = inputName()
	socket.emit("user init", {
		user_name: name
	})
	chatSocket.emit("init",{
		user_name: name
	})
})
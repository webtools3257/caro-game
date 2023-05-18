if (!io) {
	alert("Unable to start websocket module")
}
let game_board = document.querySelector("#game")

const socket = io("https://third-oval-nail.glitch.me")
socket.emit("user init", {
	user_name: prompt("Input name : ")
})

socket.on("user ready", function(d) {
	document.querySelector("#username").textContent = d.name
	document.querySelector("#board-username").textContent = d.name

})

function resetBoard() {
	board = []
	for (var i = 0; i < 10; i++) {
		let k = []
		let e = document.createElement("div")
		for (var j = 0; j < 10; j++) {
			k.push(null)
		}
		board.push(k)
	}
}

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


function createRoom() {
	socket.emit("create room", {})
}

function joinRoom() {
	socket.emit("join room", {
		room_id: prompt("Input ID")
	})
}

function startGame() {
	resetBoard()
	drawBoard()
	if (player == "O") {
		game_board.classList.add("inactive")
		currentPlayer = "X"
	} else {
		currentPlayer = "X"
	}

	game_board.addEventListener("click", function(e) {
		let col = e.target.cellIndex
		let row = e.target.parentNode.rowIndex
		let state = board[row][col]
		if (currentPlayer != player) {
			alert("Wait your turn!")
			return
		}
		if (state == null) {
			board[row][col] = player
			document.querySelector(`[data-pos="${row}:${col}"]`).classList.add(currentPlayer)
			currentPlayer = currentPlayer == "X" ? "O" : "X"
			game_board.classList.add("inactive")
			socket.emit("play", {
				row: row,
				col: col
			})

		} else {
			alert("Location has been selected !")
		}
	})

	socket.on("opponent play", function(d) {
		let row = d.row
		let col = d.col
		board[row][col] = currentPlayer
		currentPlayer = currentPlayer == "X" ? "O" : "X"
		game_board.classList.remove("inactive")
		document.querySelector(`[data-pos="${row}:${col}"]`).classList.add(currentPlayer)
	})


}

var counter = null
var board = []
var player = ""
var currentPlayer = ""
socket.on("create room success", function(d) {
	alert("ID room is " + d.room_id)
	document.querySelector("#room-id").textContent = d.room_id
	document.querySelector("#lobby").classList.add("open")
	document.querySelector("#name").textContent = d.ally.name
	document.querySelector("#board-username").textContent = d.ally.name
	let cs = 0
	counter = setInterval(() => {
		cs += 1
		document.querySelector("#counter").textContent = `${cs}s`
	}, 1000)
	player = "X"
})


socket.on("joined room", function(d) {
	document.querySelector("#room-id").textContent = d.room_id
	document.querySelector("#lobby").classList.add("open")
	document.querySelector("#name").textContent = d.ally.name
	player = "O"
})

socket.on("room full", function(d) {
	alert("The room is full of players!")
})

socket.on("opponent joined", function(d) {
	document.querySelector("#opponent-name").textContent = d.opponent.name
	clearInterval(counter)
	let cs = 10
	counter = setInterval(() => {
		cs -= 1
		document.querySelector("#counter").textContent = `Start in : ${cs}s`
		if (cs == 0) {
			clearInterval(counter)
			document.querySelector("#lobby").classList.remove("open")
			document.querySelector("#board").classList.add("open")
			document.querySelector("#board-opponent-name").textContent = d.opponent.name
			startGame()
		}
	}, 1000)
})

socket.on("opponent leave", function(d) {
	document.querySelector("#opponent-name").textContent = ""
	clearInterval(counter)
	document.querySelector("#overlay").classList.add("active")
	setTimeout(() => {
		document.querySelector("#lobby").classList.remove("open")
		document.querySelector("#board").classList.remove("open")
		alert("The opponent has left the match!")
		player = ""
		currentPlayer = ""
		resetBoard()
		drawBoard()
		document.querySelector("#overlay").classList.remove("active")
	}, 5000)
})

socket.on("create room failed", function(d) {
	alert(d.cause.msg)
})

socket.on("join room failed", function(d) {
	alert(d.cause.msg)
})
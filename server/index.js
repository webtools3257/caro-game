const path = require('path')
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const Storage = require('node-storage');

const app = express()
const httpServer = http.createServer(app);

app.use('/client', express.static(path.join(__dirname, '../client')))
const io = socketio(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
})

const boardEmpty = []
for (let i = 0; i < 10; i++) {
	boardEmpty.push([])
	for (let j = 0; j < 10; j++) {
		boardEmpty[i].push("null")
	}
}

var roomData = new Storage(path.join(__dirname, "./Data/roomData.json"));

function isEmptyCell(board, row, col) {
	return board[row][col] == "null"
}

io.on("connection", (socket) => {

	socket.on("user init", function(data) {
		let user_name = data.user_name
		let user_id = Date.now() + Math.floor(Math.random() * 9999999)
		socket.emit("user ready", {
			id: user_id,
			name: user_name
		})
		socket.user_id = user_id
		socket.user_name = user_name
		socket.room_id = null
		console.log(`[User ${user_id}] Joined !`)
	})

	socket.on("create room", function(data) {
		if (socket.room_id != null) {
			socket.emit("joined the room warning",{})
			return
		}
		let room_id = Date.now() + Math.floor(Math.random() * 199988888)
		socket.emit("create room success", {
			room_id: room_id,
			ally: {
				id: socket.user_id,
				name: socket.user_name
			}
		})
		socket.room_id = room_id
		socket.join(`room_${room_id}`)
		roomData.put(`room_${room_id}`, boardEmpty)
		console.log(`[User ${socket.user_id}] Create room : ${room_id} !`)
	})

	socket.on("join room", async function(data) {
		let room_id = data.room_id
		if (socket.room_id != null) {
			socket.emit("joined the room warning",{})
		}

		let r = io.sockets.adapter.rooms.get(`room_${room_id}`)
		if (!r) {
			socket.emit("room not exist",{
				room_id:room_id
			})
			return
		}

		if (r.size != 1) {
			socket.emit("room full", {
				room_id: room_id
			})
			return
		}

		socket.join(`room_${room_id}`)
		socket.emit("joined room", {
			room_id: room_id,
			ally: {
				id: socket.user_id,
				name: socket.user_name
			}
		})

		socket.room_id = room_id
		const sockets = await io.in(`room_${room_id}`).fetchSockets();
		for (const soc of sockets) {
			const clientSocket = soc
			if (socket !== clientSocket) {
				socket.emit("opponent joined", {
					room_id: room_id,
					timestamp: Date.now(),
					opponent: {
						name: clientSocket.user_name,
						id: clientSocket.user_id,
					},
				});
			}
		}

		socket.to(`room_${room_id}`).emit("opponent joined", {
			room_id: room_id,
			timestamp: Date.now(),
			opponent: {
				name: socket.user_name,
				id: socket.user_id
			}
		})
		console.log(`[User ${socket.user_id}] Joined room : ${room_id} !`)
	})

	socket.on("play", function(data) {
		let board = roomData.get(`room_${socket.room_id}`)
		if (isEmptyCell(board, data.row, data.col)) {
			socket.to(`room_${socket.room_id}`).emit("opponent play", {
				row: data.row,
				col: data.col
			})
			board[row][col] = data.player
			socket.emit("play success", {
				row: data.row,
				col: data.col
			})
			roomData.put(`room_${socket.room_id}`)
		} else {
			socket.emit("play failed", {
				row: data.row,
				col: data.col
			})
		}
	})
	socket.on("leave room",function(data){
		socket.room_id = null
		socket.leave(`room_${socket.room_id}`)
		io.to(`room_${socket.room_id}`).emit("opponent leave", {
			room_id: socket.room_id,
			timestamp: Date.now(),
			opponent: {
				name: socket.user_name,
				id: socket.user_id
			}
		})
		roomData.remove(`room_${room_id}`)
		const sockets = await io.in(`room_${socket.room_id}`).fetchSockets();
		for (const soc of sockets) {
			const clientSocket = soc
			if (socket !== clientSocket) {
				clientSocket.leave(`room_${socket.room_id}`)
				clientSocket.room_id = null
			}
		}
		socket.on("leave room success",{})
	})

	socket.on("disconnecting", async function(reason) {
		io.to(`room_${socket.room_id}`).emit("opponent leave", {
			room_id: socket.room_id,
			timestamp: Date.now(),
			opponent: {
				name: socket.user_name,
				id: socket.user_id
			}
		})
		roomData.remove(`room_${room_id}`)
		const sockets = await io.in(`room_${socket.room_id}`).fetchSockets();
		for (const soc of sockets) {
			const clientSocket = soc
			if (socket !== clientSocket) {
				clientSocket.leave(`room_${socket.room_id}`)
				clientSocket.room_id = null
			}
		}

	})
});



httpServer.listen(3000, function() {
	console.log("Server is running ....")
});
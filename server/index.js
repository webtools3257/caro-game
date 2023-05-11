const path = require('path')
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const app = express()
const httpServer = http.createServer(app);

app.use('/client', express.static(path.join(__dirname, '../client')))
const io = socketio(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
})

io.on("connection", (socket) => {
	socket.on("user init", function(data) {
		let user_name = data.user_name
		let user_id = Date.now() + Math.floor(Math.random() * 9999999)
		socket.emit("user ready", {
			id: user_id
		})
		socket.user_id = user_id
		socket.user_name = user_name
	})


	socket.on("join room", function(data) {
		let room_id = data.room_id
		if (room_id) {
			let amount = io.sockets.adapter.rooms.get(room_id).size
			if (amount > 2) {
				socket.emit("room full", {
					room_id: room_id,
					timestamp: Date.now()
				})
			} else {

				let room = io.sockets.adapter.rooms[room_id];
				if (room.length == 0) {
					socket.emit("room empty", {
						room_id: room_id,
						timestamp: Date.now()
					})
				} else {
					socket.join(room_id)
					socket.emit("room joined", {
						room_id: room_id,
						timestamp: Date.now(),
						opponent_name: room[0].user_name,
						opponent_id: room[0].user_id,
					})
					room[0].emit("opponent joined", {
						room_id: room_id,
						timestamp: Date.now(),
						opponent_name: socket.user_name,
						opponent_id: socket.user_id,
					})
				}
			}
		}
	})
});


httpServer.listen(3000, function() {
	console.log("Server is running ....")
});
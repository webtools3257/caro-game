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
			id: user_id,
			name: user_name
		})
		socket.user_id = user_id
		socket.user_name = user_name
		socket.room_id = null
		console.log(`[User ${user_id}] Joined !`)
	})

	socket.on("create room", function(data) {
		if(socket.room_id != null){
			socket.emit("create room failed",{
				room_id:socket.room_id,
				cause:{
					msg:"You are currently in a room and you cannot create a new room unless you leave this room!"
				}
			})
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
		console.log(`[User ${socket.user_id}] Create room : ${room_id} !`)
	})
	
	socket.on("join room", function(data) {
		let room_id = data.room_id
		if(socket.room_id != null){
			socket.emit("join room failed",{
				room_id:socket.room_id,
				cause:{
					msg:"You are currently in a room and you cannot join a new room unless you leave this room!"
				}
			})
		}
		
		let total_client = io.sockets.adapter.rooms.get(`room_${room_id}`).size
		if (total_client != 1){
			socket.emit("room full",{
				room_id:room_id
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
		let total_client = io.sockets.adapter.rooms.get(`room_${room_id}`).size
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

		io.to(`room_${room_id}`).emit("opponent joined", {
			room_id: room_id,
			timestamp: Date.now(),
			opponent: {
				name: socket.user_name,
				id: socket.user_id
			}
		})
		console.log(`[User ${socket.user_id}] Joined room : ${room_id} !`)
	})
});


httpServer.listen(3000, function() {
	console.log("Server is running ....")
});
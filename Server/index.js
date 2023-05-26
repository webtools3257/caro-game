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

const chatNsp = io.of("/chat")
chatNsp.on("connection",function(socket){
	socket.join("globalChatRoom")
	socket.on("init",function(data){
		socket.user_name = data.user_name
	})
	socket.on("send",function(data){
		socket.to("globalChatRoom").emit("message",{
			msg:data.msg,
			name:socket.user_name,
			time:new Date().toUTCString()
		})
	})
	socket.on("send invitation",function(data){
		socket.to("globalChatRoom").emit("invitation", {
			name: socket.user_name,
			time: new Date().toUTCString(),
			room_id:data.id
		})
	})
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
		if (socket.room_id != null) {
			socket.emit("in the room",{})
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
		console.log(`[User ${socket.user_id}] Create room : ${room_id} !`)
	})

	socket.on("join room", async function(data) {
		let room_id = data.room_id
		if (socket.room_id != null) {
			socket.emit("in the room",{})
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
		socket.to(`room_${socket.room_id}`).emit("opponent play",{
			col:data.col,
			row:data.row
		})
	})
	
	socket.on("leave room", async function(data){
		socket.leave(`room_${socket.room_id}`)
		socket.to(`room_${socket.room_id}`).emit("opponent leave", {
			room_id: socket.room_id,
			timestamp: Date.now(),
			opponent: {
				name: socket.user_name,
				id: socket.user_id
			}
		})
		socket.room_id = null
		socket.emit("leave room success",{})
	})
	
	socket.on("surrender",function(data){
		socket.to(`room_${socket.room_id}`).emit("opponent surrender",{
			room_id:socket.room_id
		})
		socket.emit("surrender success",{})
	})
	
	socket.on("request play again",function(){
		socket.to(`room_${socket.room_id}`).emit("opponent request play again",{
			room_id:socket.room_id
		})
		
		
	})
	
	socket.on("accept play again",function(){
		socket.to(`room_${socket.room_id}`).emit("opponent accept play again",{
			room_id:socket.room_id
		})
		
	})

socket.on("not accept play again",function(){
		socket.to(`room_${socket.room_id}`).emit("opponent not accept play again",{
			room_id:socket.room_id
		})
		
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

	})
});



httpServer.listen(3000, function() {
	console.log("Server is running ....")
});
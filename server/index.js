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
	console.log("connected");
});


httpServer.listen(3000,function(){
	console.log("Server is running ....")
});
const http = require("http")
const socketio = require("socket.io")
const httpServer = http.createServer();


const io = socketio(httpserver, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
})

io.on("connection", (socket) => {
	console.log("connected");
});


httpServer.listen(3000);
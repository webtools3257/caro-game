if (!io) {
	alert("Unable to start websocket module")
}

const socket = io("https://third-oval-nail.glitch.me")
socket.emit("user init", {
	user_name: prompt("Input name : ")
})

socket.on("user ready", function(d) {
	document.querySelector("#username").textContent = d.id
})

function createRoom() {
	socket.emit("create room", {})
}

function joinRoom() {
	socket.emit("join room", {
		room_id: prompt("Input ID")
	})
}

socket.on("create room success", function(d) {
	alert("ID room is " + d.room_id)
	document.querySelector("#room-id").textContent = d.room_id
	document.querySelector("#lobby").classList.add("open")
	document.querySelector("#name").textContent = d.ally.name
})


socket.on("joined room", function(d) {
	document.querySelector("#room-id").textContent = d.room_id
	document.querySelector("#lobby").classList.add("open")
	document.querySelector("#name").textContent = d.ally.name
})

socket.on("room full", function(d) {
	alert("The room is full of players!")
})

socket.on("opponent joined", function(d) {
	document.querySelector("#opponent-name").textContent = d.opponent.name
})

socket.on("create room failed",function(d){
	alert(d.cause.msg)
})

socket.on("join room failed",function(d){
	alert(d.cause.msg)
})

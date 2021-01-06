const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', socket => { 
    console.log("user connected");
    socket.on("new-operations", function(data) {
        io.emit("new-remote-operations", data)
    })
});

server.listen(4000, function() {
    console.log("Connected on 4000");
});
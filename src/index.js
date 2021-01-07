const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const cors = require("cors");

const crypto = require("crypto");

const redis = require("redis");

const client = redis.createClient(6379);

const mongoose = require("mongoose");

const connect = mongoose.connect("mongodb://localhost:27017/google_docs", {
  useNewUrlParser: true,
  useFindAndModify: false,
});

connect.then(
  function (db) {
    console.log("Connected correctly to server");
  },
  (err) => {
    console.log(err);
  }
);

const doc = require("../models/doc");

client.on("error", (err) => {
  console.log("Error: ", err);
});

app.use(cors());

io.on("connection", (socket) => {
  console.log("user connected");
  socket.on("initialize", function (data) {
    console.log("initialize", data);
    client.get(data, (err, value) => {
      if (err) console.log(err);
      else {
        if (value) {
          doc.findOneAndUpdate({ Id: data }, { content: value }, (err, doc) => {
            if (err) io.emit("error");
          });
        }
      }
    });
    socket.join(data);
  });
  socket.on("new-operations", function (data) {
    const rooms = [...socket.rooms];
    if (rooms[1] === data.id) {
      console.log("new-operations", data.id);
      console.log("Value", data.value);
      //console.log(data.value[0].children[0].text);
      client.setex(data.id, 180, data.value[0].children[0].text);
      io.to(data.id).emit("new-remote-operations", data);
    }
  });

  socket.on("disconnecting", function () {
    const rooms = [...socket.rooms];
    console.log("disconnecting", rooms);
    if (rooms[1]) {
      client.get(rooms[1], (err, data) => {
        if (err) console.log(err);
        else {
          console.log(data);
          doc.findOneAndUpdate(
            { Id: rooms[1] },
            { content: data },
            (err, doc) => {
              if (err) io.emit("error");
            }
          );
        }
      });
    }
  });
});

app.get("/", (req, res) => {
  return res.send("Hello");
});

app.get("/get/:id", (req, res) => {
  doc.find({ Id: req.params.id }, (err, doc) => {
    if (err) return res.json({ err });

    console.log(doc[0]);
    if (doc) return res.json({ content: doc[0].content });
    else return res.json({ message: "Not Found" });
  });
});

app.get("/create", (req, res) => {
  crypto.randomBytes(6, (err, buf) => {
    if (err) console.log("Error", err);
    buf = buf.toString("hex");
    const newDoc = new doc({
      Id: buf,
      content: "",
    });
    newDoc
      .save()
      .then((doc) => console.log(doc))
      .catch((err) => console.log(err));
    return res.json({ groupId: newDoc.Id });
  });
});

server.listen(4000, function () {
  console.log("Connected on 4000");
});

const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello World");
});

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = new Map();

io.on("connection", (socket) => {
  socket.on("register", (user) => {
    users.set(user, socket.id);
    console.log(`User: ${user} with id: ${socket.id} has logged in`);

    io.emit("update-users", Array.from(users.keys()));
  });


  socket.on("message", (user, text, recipient) => {
    const recipientId = users.get(recipient);
    if (recipientId) {
      socket.to(recipientId).emit("response-to-receiver", text, user);
      socket.emit("response-to-sender", text);
    }
  });

  socket.on("break", (user) => {
    users.delete(user);
    io.emit("update-users", Array.from(users.keys()));
  });

  socket.on("reload", (user) => {
    io.emit("update-users", Array.from(users.keys()));
  })

  socket.on("manual-disconnect", (user) => {
    users.delete(user);
    io.emit("update-users", Array.from(users.keys()));
  });

  socket.on("connectUser", (user, chatUser) => {
    const recipientId = users.get(chatUser);
    socket.to(recipientId).emit("connectedUser", user);
  });

  socket.on("finalConnect", (user) => {
    const recipientId = users.get(user);
    socket.to(recipientId).emit("connectedFinally", user);
  })

  socket.on("disconnect", () => {
    for (let [user, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(user);
        break;
      }
    }
    io.emit("update-users", Array.from(users.keys()));
  });
});

server.listen(3000, () => {
  console.log(`Server running on port 3000`);
});

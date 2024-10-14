const socket = io("http://localhost:3000");

let userElements = new Map();
let user;
let chatUser;
let online = `<img src="images/icone-bouton-en-ligne-vert.png" alt="Online" class="online-icon" />`;

if (sessionStorage.getItem("user")) {
  const top = document.getElementById("top");
  top.innerHTML = `<div class="top-main"><h1 class="username">${sessionStorage.getItem(
    "user"
  )}</h1><button onclick="resetBtn()" class="exit"><img class="exit-logo" src="images/right-from-bracket-solid.svg" alt="leave"></button></div>`;
  user = sessionStorage.getItem("user");
  socket.emit("register", user);
}

if (sessionStorage.getItem("chatUser")) {
  const text = document.getElementsByClassName("recipient-text");
  text[0].innerHTML = `${sessionStorage.getItem("chatUser")}`;
  chatUser = sessionStorage.getItem("chatUser");
}

function resetBtn() {
  const top = document.getElementById("top");
  top.innerHTML = `<input type="text" id="register" placeholder="Enter username" />
    <button onclick="btnRegister()" class="register-btn">Register</button>`;
  socket.emit("break", sessionStorage.getItem("user"));
  sessionStorage.clear();
  window.location.reload();
}

function btnRegister() {
  user = document.getElementById("register").value;
  if (user && user.trim() !== "") {
    const top = document.getElementById("top");
    sessionStorage.setItem("user", user);
    top.innerHTML = `<div class="top-main"><h1 class="username">${user}</h1><button onclick="resetBtn()" class="exit"><img class="exit-logo" src="images/right-from-bracket-solid.svg" alt="leave"></button></div>`;
    socket.emit("register", user);
  }
}

function btnClick() {
  const text = document.getElementById("text");
  let realText = text.value;
  const recipient = chatUser;

  if (realText !== "") {
    if (realText.length > 35) {
      let splitText = realText.split(" ");
      if (splitText.length == 1) {
        let i = 35;
        while (i < realText.length) {
          realText = realText.slice(0, i) + "\n" + realText.slice(i);
          i += 36;
        }
      } else {
        let sum = 0;
        for (let i = 0; i < splitText.length; i++) {
          let temp = splitText[i].length;
          if (sum + temp >= 35) {
            splitText[i] = "\n" + splitText[i];
            sum = temp;
          } else {
            sum += temp + 1;
          }
        }
        realText = splitText.join(" ");
      }
    }
    socket.emit("message", user, realText, recipient);
    text.value = "";
  }
}

document.getElementById("text").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    btnClick();
  }
});

document
  .getElementById("active-users")
  .addEventListener("click", function (event) {
    if (event.target && event.target.nodeName === "LI") {
      const text = document.getElementsByClassName("recipient-text");
      text[0].innerHTML = event.target.textContent;
      chatUser = event.target.textContent;
      socket.emit("connectUser", user, chatUser);
      sessionStorage.setItem("chatUser", chatUser);
    }
  });

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("response-to-receiver", (text, thisUser) => {
  if (thisUser === chatUser) {
    const list = document.getElementById("list");
    const item = document.createElement("li");
    item.textContent = `${text}`;
    item.classList.add("grey");
    list.appendChild(item);
  }
});

socket.on("response-to-sender", (text) => {
  const list = document.getElementById("list");
  const outer = document.createElement("div");
  const item = document.createElement("li");
  item.textContent = `${text}`;
  item.classList.add("purple");
  outer.appendChild(item);
  outer.classList.add("outer");
  list.appendChild(outer);
});

socket.on("connectedUser", (temp) => {
  console.log(temp);
  if (temp === chatUser) {
    const text = document.getElementsByClassName("recipient-text");
    text[0].innerHTML = `${sessionStorage.getItem("chatUser")}${online}`;
    chatUser = sessionStorage.getItem("chatUser");
    socket.emit("finalConnect", temp);
  }
});

socket.on("connectedFinally", (temp) => {
  console.log(temp);
  if (temp === user) {
    const text = document.getElementsByClassName("recipient-text");
    text[0].innerHTML = `${sessionStorage.getItem("chatUser")}${online}`;
    user = sessionStorage.getItem("user");
  }
});

socket.on("update-users", (activeUsers) => {
  const list = document.getElementById("active-users");
  list.innerHTML = "";
  activeUsers.forEach((thisUser) => {
    if (thisUser === user) {
      return;
    }

    const item = document.createElement("li");
    item.textContent = thisUser;
    item.style.listStyleType = "none";
    list.appendChild(item);
  });
});

window.addEventListener("beforeunload", function () {
  socket.emit("manual-disconnect", user);
});

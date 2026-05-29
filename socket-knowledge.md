# 🔌 SOCKET - Tổng Hợp Kiến Thức Đầy Đủ

---

## 1. Socket là gì?

**Socket** là một kênh giao tiếp hai chiều (full-duplex) giữa client và server, cho phép dữ liệu được truyền đi **theo thời gian thực** mà không cần client liên tục gửi request.

### So sánh HTTP vs WebSocket

| Đặc điểm | HTTP | WebSocket |
|---|---|---|
| Kiểu kết nối | Request - Response (1 chiều) | Full-duplex (2 chiều) |
| Kết nối | Đóng sau mỗi request | Duy trì liên tục |
| Overhead | Header lớn mỗi lần | Header nhỏ sau handshake |
| Real-time | Không (cần polling) | Có |
| Use case | REST API, trang web | Chat, game, stock, notification |

---

## 2. Luồng hoạt động của WebSocket

```
CLIENT                                SERVER
  |                                      |
  |--- HTTP Upgrade Request ------------>|   ← Bước 1: Handshake
  |    GET /chat HTTP/1.1                |
  |    Upgrade: websocket                |
  |    Connection: Upgrade               |
  |    Sec-WebSocket-Key: abc123         |
  |                                      |
  |<-- HTTP 101 Switching Protocols -----|   ← Bước 2: Server chấp nhận
  |    Upgrade: websocket                |
  |    Connection: Upgrade               |
  |    Sec-WebSocket-Accept: xyz789      |
  |                                      |
  |========= KẾT NỐI MỞ ================|   ← Bước 3: Kết nối duy trì
  |                                      |
  |--- message: "Hello" ---------------->|   ← Gửi bất kỳ lúc nào
  |<-- message: "Hi back" --------------|
  |--- message: "How are you?" -------->|
  |<-- message: "Fine!" ----------------|
  |                                      |
  |--- close frame ---------------------->|  ← Bước 4: Đóng kết nối
  |<-- close frame ----------------------|
  |                                      |
```

### Các trạng thái (readyState)

```
CONNECTING (0) → OPEN (1) → CLOSING (2) → CLOSED (3)
```

---

## 3. WebSocket thuần (Native Browser API)

### 3.1 Client-side

```javascript
// ===== KẾT NỐI =====
const ws = new WebSocket('ws://localhost:3000');
// Bảo mật dùng: wss://localhost:3000

// ===== SỰ KIỆN =====

// Khi kết nối mở thành công
ws.onopen = (event) => {
  console.log('✅ Kết nối thành công');
  ws.send('Hello Server!'); // Gửi ngay khi mở
};

// Khi nhận được tin nhắn từ server
ws.onmessage = (event) => {
  console.log('📩 Nhận:', event.data);

  // Nếu server gửi JSON
  const data = JSON.parse(event.data);
  console.log(data);
};

// Khi có lỗi
ws.onerror = (error) => {
  console.error('❌ Lỗi:', error);
};

// Khi kết nối đóng
ws.onclose = (event) => {
  console.log('🔌 Đóng kết nối. Code:', event.code, 'Reason:', event.reason);
};

// ===== GỬI DỮ LIỆU =====
ws.send('Chuỗi string');
ws.send(JSON.stringify({ type: 'message', data: 'Hello' }));
ws.send(new Blob(['binary data']));
ws.send(new ArrayBuffer(8));

// ===== ĐÓNG KẾT NỐI =====
ws.close();        // Đóng bình thường
ws.close(1000, 'Goodbye'); // Code 1000 = Normal Closure
```

### 3.2 Server-side (Node.js - thư viện `ws`)

```bash
npm install ws
```

```javascript
const WebSocket = require('ws');

// Tạo WebSocket server trên port 3000
const wss = new WebSocket.Server({ port: 3000 });

// Khi có client kết nối vào
wss.on('connection', (ws, request) => {
  const clientIP = request.socket.remoteAddress;
  console.log(`✅ Client kết nối từ: ${clientIP}`);
  console.log(`👥 Tổng clients: ${wss.clients.size}`);

  // Gửi chào mừng
  ws.send(JSON.stringify({ type: 'welcome', message: 'Chào mừng!' }));

  // Khi nhận tin nhắn từ client
  ws.on('message', (data) => {
    const message = data.toString();
    console.log('📩 Nhận từ client:', message);

    // Phản hồi lại client
    ws.send(`Server nhận được: ${message}`);

    // Broadcast đến TẤT CẢ client
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Khi client ngắt kết nối
  ws.on('close', (code, reason) => {
    console.log(`🔌 Client ngắt kết nối. Code: ${code}`);
  });

  // Khi có lỗi
  ws.on('error', (error) => {
    console.error('❌ Lỗi:', error);
  });
});

wss.on('listening', () => {
  console.log('🚀 WebSocket Server đang chạy trên port 3000');
});
```

---

## 4. Socket.IO (Thư viện phổ biến nhất)

Socket.IO được xây dựng trên WebSocket, bổ sung thêm nhiều tính năng mạnh mẽ.

### So sánh WebSocket thuần vs Socket.IO

| Tính năng | WebSocket thuần | Socket.IO |
|---|---|---|
| Auto-reconnect | ❌ | ✅ |
| Rooms / Namespaces | ❌ | ✅ |
| Fallback (long-polling) | ❌ | ✅ |
| Broadcast | Thủ công | ✅ Built-in |
| Acknowledgements | ❌ | ✅ |
| Middleware | ❌ | ✅ |

### 4.1 Cài đặt

```bash
npm install socket.io        # server
npm install socket.io-client # client (nếu dùng Node.js)
```

### 4.2 Luồng kết nối Socket.IO

```
CLIENT                              SERVER
  |                                   |
  |-- connect() -------------------->|
  |                                   |
  |<-- event: "connect" -------------|   ← Server xác nhận
  |    socket.id = "abc123"          |
  |                                   |
  |-- emit("join_room", "room1") --->|   ← Client vào phòng
  |                                   |
  |-- emit("send_message", data) --->|   ← Gửi sự kiện tùy chỉnh
  |                                   |
  |<-- emit("receive_message", data)-|   ← Server broadcast
  |                                   |
  |-- disconnect() ------------------>|
  |<-- event: "disconnect" ----------|
```

### 4.3 Server (Socket.IO)

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO với CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// ===== MIDDLEWARE =====
// Xác thực trước khi cho phép kết nối
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValidToken(token)) {
    socket.user = getUserFromToken(token); // Gắn user vào socket
    next(); // Cho phép kết nối
  } else {
    next(new Error('Unauthorized')); // Từ chối
  }
});

// ===== KẾT NỐI =====
io.on('connection', (socket) => {
  console.log(`✅ User kết nối: ${socket.id}`);

  // --- VÀO PHÒNG ---
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} đã vào phòng ${roomId}`);

    // Thông báo cho người trong phòng
    socket.to(roomId).emit('user_joined', {
      userId: socket.id,
      message: 'Có người vừa vào phòng'
    });
  });

  // --- RỜI PHÒNG ---
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user_left', { userId: socket.id });
  });

  // --- NHẬN VÀ BROADCAST TIN NHẮN ---
  socket.on('send_message', (data, callback) => {
    const message = {
      id: Date.now(),
      from: socket.id,
      text: data.text,
      room: data.room,
      timestamp: new Date()
    };

    // Gửi đến tất cả trong phòng (kể cả người gửi)
    io.to(data.room).emit('receive_message', message);

    // Acknowledgement: xác nhận đã nhận
    if (callback) callback({ status: 'ok', messageId: message.id });
  });

  // --- TYPING INDICATOR ---
  socket.on('typing', (roomId) => {
    socket.to(roomId).emit('user_typing', { userId: socket.id });
  });

  socket.on('stop_typing', (roomId) => {
    socket.to(roomId).emit('user_stop_typing', { userId: socket.id });
  });

  // --- NGẮT KẾT NỐI ---
  socket.on('disconnect', (reason) => {
    console.log(`🔌 ${socket.id} ngắt kết nối. Lý do: ${reason}`);
  });
});

httpServer.listen(3000, () => {
  console.log('🚀 Server chạy trên port 3000');
});
```

### 4.4 Client (Socket.IO)

```javascript
import { io } from 'socket.io-client';

// ===== KẾT NỐI =====
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' },
  reconnection: true,          // Tự động reconnect
  reconnectionAttempts: 5,     // Thử lại 5 lần
  reconnectionDelay: 1000,     // Chờ 1 giây giữa mỗi lần thử
});

// ===== SỰ KIỆN KẾT NỐI =====
socket.on('connect', () => {
  console.log('✅ Kết nối thành công, ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Lỗi kết nối:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Ngắt kết nối:', reason);
  // reason có thể là: 'io server disconnect', 'transport close', 'ping timeout'
});

socket.on('reconnect', (attempt) => {
  console.log(`🔄 Kết nối lại thành công sau ${attempt} lần thử`);
});

// ===== VÀO PHÒNG =====
socket.emit('join_room', 'room-general');

// ===== GỬI TIN NHẮN =====
socket.emit('send_message',
  { text: 'Xin chào!', room: 'room-general' },
  (response) => {
    // Callback acknowledgement
    console.log('Server xác nhận:', response);
  }
);

// ===== NHẬN TIN NHẮN =====
socket.on('receive_message', (message) => {
  console.log('📩 Tin mới:', message);
});

// ===== TYPING =====
socket.emit('typing', 'room-general');
socket.emit('stop_typing', 'room-general');

socket.on('user_typing', ({ userId }) => {
  console.log(`${userId} đang gõ...`);
});

// ===== NGẮT KẾT NỐI =====
socket.disconnect();
```

---

## 5. Các cách emit (gửi sự kiện)

```javascript
// ===== SERVER SIDE =====

// Gửi đến 1 client cụ thể (theo socket.id)
io.to(socketId).emit('event', data);

// Gửi đến tất cả client trong 1 phòng
io.to('room-name').emit('event', data);

// Gửi đến tất cả client (broadcast toàn hệ thống)
io.emit('event', data);

// Gửi đến tất cả NGOẠI TRỪ người gửi
socket.broadcast.emit('event', data);

// Gửi đến tất cả trong phòng NGOẠI TRỪ người gửi
socket.to('room-name').emit('event', data);

// Gửi đến nhiều phòng cùng lúc
io.to('room1').to('room2').emit('event', data);

// Gửi đến tất cả trong namespace
io.of('/chat').emit('event', data);

// ===== CLIENT SIDE =====

// Gửi sự kiện lên server
socket.emit('event', data);

// Gửi với acknowledgement (callback)
socket.emit('event', data, (response) => {
  console.log('Confirmed:', response);
});

// Gửi với timeout
socket.timeout(5000).emit('event', data, (err, response) => {
  if (err) console.error('Timeout!');
  else console.log('OK:', response);
});
```

---

## 6. Rooms & Namespaces

### Rooms (Phòng)

```
Namespace "/"
├── Room "general"   → [socket1, socket2, socket3]
├── Room "room-123"  → [socket2, socket4]
└── Room "vip"       → [socket5]
```

```javascript
// Tạo/vào phòng
socket.join('room-123');

// Rời phòng
socket.leave('room-123');

// Lấy danh sách socket trong phòng
const sockets = await io.in('room-123').fetchSockets();

// Lấy danh sách phòng của 1 socket
const rooms = socket.rooms; // Set { socket.id, 'room-123' }

// Đếm số người trong phòng
const count = io.sockets.adapter.rooms.get('room-123')?.size || 0;
```

### Namespaces (Không gian tên)

```javascript
// Server: tạo namespace
const chatNsp = io.of('/chat');
const gameNsp = io.of('/game');

chatNsp.on('connection', (socket) => {
  console.log('Kết nối vào /chat namespace');
});

// Client: kết nối đến namespace
const chatSocket = io('http://localhost:3000/chat');
const gameSocket = io('http://localhost:3000/game');
```

---

## 7. Các Close Codes (WebSocket)

| Code | Tên | Ý nghĩa |
|---|---|---|
| 1000 | Normal Closure | Đóng bình thường |
| 1001 | Going Away | Server đang shutdown hoặc user rời trang |
| 1002 | Protocol Error | Lỗi giao thức |
| 1003 | Unsupported Data | Loại dữ liệu không hỗ trợ |
| 1006 | Abnormal Closure | Mất kết nối đột ngột (không có close frame) |
| 1008 | Policy Violation | Vi phạm policy (dùng cho auth fail) |
| 1011 | Internal Error | Lỗi phía server |

---

## 8. Heartbeat / Ping-Pong

Cơ chế kiểm tra kết nối còn sống không:

```
CLIENT          SERVER
  |               |
  |<-- ping ------|   ← Server gửi ping định kỳ
  |--- pong ----->|   ← Client phải trả lời trong thời gian quy định
  |               |
  (Nếu không có pong → Server đóng kết nối)
```

```javascript
// Socket.IO tự động xử lý heartbeat
const io = new Server(httpServer, {
  pingTimeout: 20000,   // Chờ 20s cho pong response
  pingInterval: 25000,  // Gửi ping mỗi 25s
});
```

---

## 9. Xử lý Reconnect

```javascript
// Client - Socket.IO
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: Infinity,  // Thử mãi mãi
  reconnectionDelay: 1000,         // Delay ban đầu 1s
  reconnectionDelayMax: 5000,      // Delay tối đa 5s
  randomizationFactor: 0.5,        // Jitter để tránh thundering herd
});

socket.on('reconnect_attempt', (attempt) => {
  console.log(`Đang thử kết nối lại lần ${attempt}...`);
});

socket.on('reconnect_failed', () => {
  console.error('Không thể kết nối lại sau nhiều lần thử');
});
```

---

## 10. DEMO - Chat App Logic (JavaScript)

Đây là demo đầy đủ logic một chat app với Socket.IO, không có UI.

### SERVER: `server.js`

```javascript
const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// ===== KHO DỮ LIỆU IN-MEMORY =====
const state = {
  users: new Map(),    // socketId -> { id, username, room }
  rooms: new Map(),    // roomId -> { name, messages: [] }
  messages: [],        // Lịch sử tin nhắn toàn bộ
};

// Khởi tạo phòng mặc định
state.rooms.set('general', { name: 'General', messages: [] });
state.rooms.set('tech', { name: 'Tech', messages: [] });

// ===== HELPER FUNCTIONS =====
function getOnlineUsers() {
  return Array.from(state.users.values());
}

function getUsersInRoom(roomId) {
  return Array.from(state.users.values()).filter(u => u.room === roomId);
}

function addMessage(roomId, message) {
  const room = state.rooms.get(roomId);
  if (room) {
    room.messages.push(message);
    // Chỉ giữ 100 tin nhắn gần nhất
    if (room.messages.length > 100) {
      room.messages.shift();
    }
  }
}

// ===== XỬ LÝ KẾT NỐI =====
io.on('connection', (socket) => {
  console.log(`[SERVER] Kết nối mới: ${socket.id}`);

  // ----- ĐĂNG NHẬP -----
  socket.on('user_login', ({ username }, callback) => {
    // Kiểm tra username đã tồn tại chưa
    const isDuplicate = Array.from(state.users.values())
      .some(u => u.username === username);

    if (isDuplicate) {
      return callback({ success: false, error: 'Username đã tồn tại' });
    }

    // Lưu thông tin user
    const user = {
      id: socket.id,
      username,
      room: null,
      joinedAt: new Date()
    };
    state.users.set(socket.id, user);
    socket.username = username;

    console.log(`[SERVER] User đăng nhập: ${username}`);

    // Trả về danh sách phòng
    const rooms = Array.from(state.rooms.entries()).map(([id, room]) => ({
      id,
      name: room.name,
      memberCount: getUsersInRoom(id).length
    }));

    callback({ success: true, user, rooms });

    // Thông báo cho tất cả: có người online mới
    io.emit('online_users_update', getOnlineUsers());
  });

  // ----- VÀO PHÒNG -----
  socket.on('join_room', ({ roomId }, callback) => {
    const user = state.users.get(socket.id);
    const room = state.rooms.get(roomId);

    if (!user) return callback({ success: false, error: 'Chưa đăng nhập' });
    if (!room) return callback({ success: false, error: 'Phòng không tồn tại' });

    // Rời phòng cũ nếu có
    if (user.room) {
      socket.leave(user.room);
      socket.to(user.room).emit('user_left_room', {
        userId: socket.id,
        username: user.username,
        roomId: user.room
      });
    }

    // Vào phòng mới
    user.room = roomId;
    socket.join(roomId);

    console.log(`[SERVER] ${user.username} vào phòng ${roomId}`);

    // Thông báo cho người trong phòng
    socket.to(roomId).emit('user_joined_room', {
      userId: socket.id,
      username: user.username,
      roomId
    });

    // Trả về lịch sử tin nhắn
    callback({
      success: true,
      room,
      history: room.messages,
      members: getUsersInRoom(roomId)
    });
  });

  // ----- GỬI TIN NHẮN -----
  socket.on('send_message', ({ text, roomId }, callback) => {
    const user = state.users.get(socket.id);

    if (!user) return callback({ success: false, error: 'Chưa đăng nhập' });
    if (!text || !text.trim()) return callback({ success: false, error: 'Tin nhắn trống' });
    if (user.room !== roomId) return callback({ success: false, error: 'Bạn không trong phòng này' });

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      from: {
        id: socket.id,
        username: user.username
      },
      text: text.trim(),
      roomId,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    // Lưu tin nhắn
    addMessage(roomId, message);

    // Broadcast đến TẤT CẢ trong phòng (kể cả người gửi)
    io.to(roomId).emit('new_message', message);

    console.log(`[SERVER] [${roomId}] ${user.username}: ${text}`);

    callback({ success: true, messageId: message.id });
  });

  // ----- TYPING INDICATOR -----
  socket.on('start_typing', ({ roomId }) => {
    const user = state.users.get(socket.id);
    if (!user) return;

    // Gửi cho tất cả NGOẠI TRỪ người đang gõ
    socket.to(roomId).emit('typing_start', {
      userId: socket.id,
      username: user.username
    });
  });

  socket.on('stop_typing', ({ roomId }) => {
    socket.to(roomId).emit('typing_stop', { userId: socket.id });
  });

  // ----- GỬI TIN NHẮN RIÊNG (DM) -----
  socket.on('send_dm', ({ toUserId, text }, callback) => {
    const fromUser = state.users.get(socket.id);
    const toUser = state.users.get(toUserId);

    if (!fromUser || !toUser) {
      return callback({ success: false, error: 'User không tồn tại' });
    }

    const dm = {
      id: `dm_${Date.now()}`,
      from: { id: socket.id, username: fromUser.username },
      to: { id: toUserId, username: toUser.username },
      text,
      timestamp: new Date().toISOString(),
      type: 'dm'
    };

    // Gửi riêng cho người nhận
    io.to(toUserId).emit('new_dm', dm);

    // Gửi lại để người gửi thấy trong UI của mình
    socket.emit('dm_sent', dm);

    callback({ success: true });
  });

  // ----- NGẮT KẾT NỐI -----
  socket.on('disconnect', (reason) => {
    const user = state.users.get(socket.id);
    if (!user) return;

    console.log(`[SERVER] ${user.username} ngắt kết nối (${reason})`);

    // Thông báo cho phòng đang ở
    if (user.room) {
      socket.to(user.room).emit('user_left_room', {
        userId: socket.id,
        username: user.username,
        roomId: user.room
      });
    }

    // Xóa khỏi danh sách user
    state.users.delete(socket.id);

    // Cập nhật danh sách online
    io.emit('online_users_update', getOnlineUsers());
  });
});

httpServer.listen(3000, () => {
  console.log('🚀 Chat Server chạy trên port 3000');
});
```

---

### CLIENT: `client.js`

```javascript
const { io } = require('socket.io-client');

// ===== KHỞI TẠO =====
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

// ===== STATE CLIENT =====
const clientState = {
  currentUser: null,
  currentRoom: null,
  typingUsers: new Map(), // userId -> timeoutId
};

// ===== KẾT NỐI =====
socket.on('connect', () => {
  console.log(`[CLIENT] ✅ Kết nối: ${socket.id}`);
  login('Alice'); // Tự động login khi kết nối
});

socket.on('disconnect', (reason) => {
  console.log(`[CLIENT] 🔌 Mất kết nối: ${reason}`);
});

socket.on('reconnect', (attempt) => {
  console.log(`[CLIENT] 🔄 Kết nối lại sau ${attempt} lần`);
  // Re-login và re-join room sau khi reconnect
  if (clientState.currentUser) {
    login(clientState.currentUser.username);
  }
});

// ===== ACTIONS (Hàm gọi từ UI) =====

// Đăng nhập
function login(username) {
  socket.emit('user_login', { username }, (response) => {
    if (response.success) {
      clientState.currentUser = response.user;
      console.log(`[CLIENT] Đăng nhập thành công: ${username}`);
      console.log('[CLIENT] Danh sách phòng:', response.rooms);

      // Tự động vào phòng general
      joinRoom('general');
    } else {
      console.error('[CLIENT] Đăng nhập thất bại:', response.error);
    }
  });
}

// Vào phòng
function joinRoom(roomId) {
  socket.emit('join_room', { roomId }, (response) => {
    if (response.success) {
      clientState.currentRoom = roomId;
      console.log(`[CLIENT] ✅ Vào phòng: ${roomId}`);
      console.log(`[CLIENT] Thành viên: ${response.members.map(m => m.username).join(', ')}`);
      console.log(`[CLIENT] Lịch sử (${response.history.length} tin):`);
      response.history.forEach(msg => {
        console.log(`  [${msg.timestamp}] ${msg.from.username}: ${msg.text}`);
      });
    } else {
      console.error('[CLIENT] Không thể vào phòng:', response.error);
    }
  });
}

// Gửi tin nhắn
function sendMessage(text) {
  if (!clientState.currentRoom) {
    console.error('[CLIENT] Chưa vào phòng nào');
    return;
  }

  socket.emit('send_message',
    { text, roomId: clientState.currentRoom },
    (response) => {
      if (response.success) {
        console.log(`[CLIENT] ✅ Tin nhắn đã gửi. ID: ${response.messageId}`);
      } else {
        console.error('[CLIENT] Gửi thất bại:', response.error);
      }
    }
  );
}

// Typing indicator
let typingTimeout;
function handleTyping() {
  socket.emit('start_typing', { roomId: clientState.currentRoom });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop_typing', { roomId: clientState.currentRoom });
  }, 2000); // Dừng typing sau 2s không gõ
}

// Gửi DM
function sendDM(toUserId, text) {
  socket.emit('send_dm', { toUserId, text }, (response) => {
    if (response.success) {
      console.log('[CLIENT] ✅ DM đã gửi');
    }
  });
}

// ===== NHẬN SỰ KIỆN TỪ SERVER =====

// Tin nhắn mới trong phòng
socket.on('new_message', (message) => {
  const isOwnMessage = message.from.id === socket.id;
  const prefix = isOwnMessage ? '➡️ Tôi' : `📩 ${message.from.username}`;
  console.log(`[CHAT] ${prefix}: ${message.text}`);
});

// Có người vào phòng
socket.on('user_joined_room', ({ username }) => {
  console.log(`[ROOM] 👋 ${username} vừa vào phòng`);
});

// Có người rời phòng
socket.on('user_left_room', ({ username }) => {
  console.log(`[ROOM] 👋 ${username} vừa rời phòng`);
});

// Typing indicators
socket.on('typing_start', ({ username, userId }) => {
  // Hủy timeout cũ nếu có
  if (clientState.typingUsers.has(userId)) {
    clearTimeout(clientState.typingUsers.get(userId));
  }
  console.log(`[TYPING] ${username} đang gõ...`);

  // Tự xóa sau 3s nếu không nhận stop
  const timeout = setTimeout(() => {
    clientState.typingUsers.delete(userId);
  }, 3000);
  clientState.typingUsers.set(userId, timeout);
});

socket.on('typing_stop', ({ userId }) => {
  if (clientState.typingUsers.has(userId)) {
    clearTimeout(clientState.typingUsers.get(userId));
    clientState.typingUsers.delete(userId);
  }
  console.log('[TYPING] Dừng gõ');
});

// Nhận DM
socket.on('new_dm', (dm) => {
  console.log(`[DM] 💬 ${dm.from.username} → bạn: ${dm.text}`);
});

// Cập nhật danh sách online
socket.on('online_users_update', (users) => {
  console.log(`[ONLINE] ${users.length} người online:`, users.map(u => u.username).join(', '));
});

// ===== DEMO CHẠY THỬ =====
// Sau khi connect + login, thử gửi tin nhắn sau 3s
setTimeout(() => {
  sendMessage('Xin chào mọi người!');
  handleTyping();
}, 3000);

setTimeout(() => {
  sendMessage('Ai đang online vậy?');
}, 5000);
```

---

## 11. Luồng đầy đủ của Chat App

```
[Client A]          [Server]           [Client B]
    |                   |                   |
    |-- connect() ----->|                   |
    |<- connect --------|                   |
    |                   |                   |
    |-- user_login ---->|                   |
    |   { username:     |                   |
    |     "Alice" }     |                   |
    |<- callback -------|  (success + rooms)|
    |                   |                   |
    |-- join_room ------>|                   |
    |   { roomId:        |                  |
    |     "general" }   |                   |
    |<- callback --------|  (history + members)
    |                   |--user_joined_room->|
    |                   |                   |
    |-- send_message -->|                   |
    |   { text:"Hi",    |                   |
    |     roomId:       |                   |
    |     "general" }   |                   |
    |<- callback --------|  (messageId)      |
    |<- new_message -----|                   |
    |                   |--new_message ----->|
    |                   |                   |
    |-- start_typing -->|                   |
    |                   |--typing_start ---->|
    |                   |                   |
    |-- stop_typing --->|                   |
    |                   |--typing_stop ----->|
    |                   |                   |
    |-- disconnect() -->|                   |
    |                   |--user_left_room -->|
    |                   |--online_update --->|
```

---

## 12. Best Practices

### Bảo mật

```javascript
// 1. Luôn xác thực token trước khi cho phép kết nối
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
});

// 2. Validate data đầu vào
socket.on('send_message', ({ text, roomId }) => {
  if (typeof text !== 'string') return;
  if (text.length > 1000) return;
  // sanitize HTML...
});

// 3. Rate limiting
const rateLimiter = new Map();
socket.on('send_message', (data) => {
  const now = Date.now();
  const last = rateLimiter.get(socket.id) || 0;
  if (now - last < 500) return; // Không spam quá 2 tin/giây
  rateLimiter.set(socket.id, now);
  // xử lý tin nhắn...
});
```

### Performance

```javascript
// 1. Dùng volatile emit cho dữ liệu không quan trọng (typing, cursor)
socket.volatile.emit('cursor_position', { x, y });

// 2. Compress data
const io = new Server(httpServer, {
  perMessageDeflate: {
    threshold: 1024 // Nén nếu > 1KB
  }
});

// 3. Binary data dùng ArrayBuffer thay JSON cho real-time stream
socket.emit('audio_chunk', new Uint8Array(audioBuffer));
```

### Scaling (nhiều server)

```bash
npm install @socket.io/redis-adapter
```

```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

// Khi nhiều server chia sẻ cùng Redis, broadcast sẽ hoạt động đúng
io.adapter(createAdapter(pubClient, subClient));
```

---

## 13. Tóm tắt nhanh

```
WebSocket:
  - Giao thức chuẩn, full-duplex, low-latency
  - ws:// hoặc wss:// (secure)
  - Events: open, message, error, close

Socket.IO:
  - Thư viện trên WebSocket
  - Thêm: rooms, namespaces, reconnect, acknowledgements
  - io.emit / socket.emit / socket.to().emit

Patterns phổ biến:
  - join_room → send_message → new_message (broadcast)
  - start_typing → stop_typing (indicator)
  - disconnect → cleanup → notify room

Emit cheat sheet (server):
  io.emit()           → gửi tất cả
  socket.emit()       → gửi 1 người
  socket.broadcast    → gửi tất cả trừ người gửi
  io.to(room).emit()  → gửi cả phòng
  socket.to(room)     → gửi phòng trừ người gửi
```

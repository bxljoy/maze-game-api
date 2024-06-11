const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(cors());

// Maps to store game states for multiple sessions
let games = new Map();

// Helper function to generate a secure random token
const generateToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Helper function to generate a random room ID
const generateRoomId = () => {
  return crypto.randomBytes(8).toString("hex"); // Generates a 16-character hex string
};

// Function to generate a linear, solvable maze without loops
const generateInitialRooms = () => {
  const roomCount = Math.floor(Math.random() * 7) + 4; // Generates a number from 4 to 10
  const roomIds = Array.from({ length: roomCount }, generateRoomId);
  const directions = ["North", "East", "South", "West"]; // Basic cardinal directions
  let rooms = {};

  // Initialize rooms with unique IDs
  roomIds.forEach((id) => {
    rooms[id] = {
      id: id,
      floor: "1",
      paths: [],
      effect: null,
    };
  });

  // Linearly connect all rooms to avoid loops
  for (let i = 0; i < roomCount - 1; i++) {
    const currentRoomId = roomIds[i];
    const nextRoomId = roomIds[i + 1];
    const direction = directions[i % directions.length];
    const oppositeDirection = directions[(i + 2) % directions.length];

    // Connect current room to next room
    rooms[currentRoomId].paths.push({
      requiredItem: null,
      direction: direction,
      destination: nextRoomId,
    });

    // Connect next room back to current room
    rooms[nextRoomId].paths.push({
      requiredItem: null,
      direction: oppositeDirection,
      destination: currentRoomId,
    });
  }

  // Assign "Start" to the first room and "Victory" to the last room
  rooms[roomIds[0]].effect = "Start";
  rooms[roomIds[roomCount - 1]].effect = "Victory";

  return rooms;
};

// Start a new game and get the token
app.post("/Game/start", (req, res) => {
  const token = generateToken();
  const initialRooms = generateInitialRooms(); // This returns room dictionary including IDs.
  const roomIds = Object.keys(initialRooms); // Correctly fetching room IDs from the generated rooms
  const startRoomId = roomIds[0]; // Start at the first room in the list
  games.set(token, {
    currentRoom: startRoomId,
    rooms: initialRooms,
  });
  res.status(200).json({ token: token, startRoom: startRoomId });
});

// Get current room info
app.get("/Room/current", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const game = games.get(token);

  if (!token || !game) {
    return res
      .status(401)
      .json({ error: "Authorization token required or invalid" });
  }

  const currentRoom = game.rooms[game.currentRoom];
  res.status(200).json(currentRoom);
});

// Move to a new room
app.put("/Player/move", (req, res) => {
  const { direction } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  const game = games.get(token);

  if (!token || !game) {
    return res
      .status(401)
      .json({ error: "Authorization token required or invalid" });
  }

  const currentRoom = game.rooms[game.currentRoom];
  const path = currentRoom.paths.find(
    (path) => path.direction.toLowerCase() === direction.toLowerCase()
  );

  if (!path) {
    return res.status(400).json({ error: "Invalid move" });
  }

  game.currentRoom = path.destination;
  res.status(200).json(game.rooms[game.currentRoom]);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

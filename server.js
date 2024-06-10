const express = require("express");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Maps to store game states for multiple sessions
let games = new Map();

// Helper function to generate a secure random token
const generateToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Define initial rooms in the new format with interconnected paths
const initialRooms = {
  "572c5e10-564a-43e6-a489-e12dfe94d57c": {
    id: "572c5e10-564a-43e6-a489-e12dfe94d57c",
    floor: "1",
    paths: [
      {
        requiredItem: null,
        direction: "North",
        destination: "0af61e6b-5ba4-4992-a6ad-bd209818190e",
      },
    ],
    effect: "Start",
  },
  "0af61e6b-5ba4-4992-a6ad-bd209818190e": {
    id: "0af61e6b-5ba4-4992-a6ad-bd209818190e",
    floor: "1",
    paths: [
      {
        requiredItem: null,
        direction: "South",
        destination: "572c5e10-564a-43e6-a489-e12dfe94d57c",
      },
      {
        requiredItem: null,
        direction: "North",
        destination: "a9d03b2c-5f92-49e0-ba9b-eed09d56f94e",
      },
      {
        requiredItem: null,
        direction: "East",
        destination: "12ef2e75-b9a9-4f95-8769-144d814638ab",
      },
    ],
    effect: null,
  },
  "a9d03b2c-5f92-49e0-ba9b-eed09d56f94e": {
    id: "a9d03b2c-5f92-49e0-ba9b-eed09d56f94e",
    floor: "1",
    paths: [
      {
        requiredItem: null,
        direction: "South",
        destination: "0af61e6b-5ba4-4992-a6ad-bd209818190e",
      },
    ],
    effect: "Victory",
  },
  "12ef2e75-b9a9-4f95-8769-144d814638ab": {
    id: "12ef2e75-b9a9-4f95-8769-144d814638ab",
    floor: "1",
    paths: [
      {
        requiredItem: null,
        direction: "West",
        destination: "0af61e6b-5ba4-4992-a6ad-bd209818190e",
      },
    ],
    effect: null,
  },
};

// Start a new game and get the token
app.post("/Game/start", (req, res) => {
  const token = generateToken();
  const initialRoomId = "572c5e10-564a-43e6-a489-e12dfe94d57c";
  games.set(token, {
    currentRoom: initialRoomId,
    rooms: initialRooms,
  });
  return res.status(200).json({ token: token, startRoom: initialRoomId });
});

// Get current room info
app.get("/Room/current", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  console.log("token", token);
  const game = games.get(token);
  console.log("games", games);
  if (!token || !game) {
    return res
      .status(401)
      .json({ error: "Authorization token required or invalid" });
  }

  const currentRoom = game.rooms[game.currentRoom];
  return res.status(200).json(currentRoom);
});

// Move to a new room
app.put("/Player/move", (req, res) => {
  const { direction } = req.body;
  console.log("direction", direction);
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

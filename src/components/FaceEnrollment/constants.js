export const ENROLLMENT_POSES = [
  {
    id: 1,
    key: "front_neutral",
    title: "Look Straight",
    instruction: "Keep your face straight and maintain a neutral expression.",
    icon: "🙂",
  },
  {
    id: 2,
    key: "front_smile",
    title: "Smile",
    instruction: "Please smile naturally.",
    icon: "😊",
  },
  {
    id: 3,
    key: "left",
    title: "Turn Left",
    instruction: "Turn your head slightly to the left.",
    icon: "⬅️",
  },
  {
    id: 4,
    key: "right",
    title: "Turn Right",
    instruction: "Turn your head slightly to the right.",
    icon: "➡️",
  },
  {
    id: 5,
    key: "up",
    title: "Look Up",
    instruction: "Lift your chin slightly upward.",
    icon: "⬆️",
  },
  {
    id: 6,
    key: "down",
    title: "Look Down",
    instruction: "Lower your chin slightly.",
    icon: "⬇️",
  },
  {
    id: 7,
    key: "blink",
    title: "Blink",
    instruction: "Blink once naturally.",
    icon: "👁️",
  },
  {
    id: 8,
    key: "natural",
    title: "Natural Face",
    instruction: "Look straight with a relaxed expression.",
    icon: "🙂",
  },
];

export const CAMERA_SETTINGS = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export const QUALITY = {
  MIN_BRIGHTNESS: 50,
  MAX_BRIGHTNESS: 210,
  MIN_FACE_RATIO: 0.06,
  MAX_FACE_RATIO: 0.40,
  MIN_SHARPNESS: 70,
};

export const CAPTURE_INTERVAL = 300;
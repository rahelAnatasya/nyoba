const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

// Set initial canvas size
function setCanvasSize() {
  canvas.width = window.innerWidth - 40; // Add some padding
  canvas.height = window.innerHeight - 100; // Add space for toolbar
}
setCanvasSize();

// Initialize drawing variables
let drawing = false;
let color = "#000000";
let fillColor = "#ffffff";
let lineWidth = 2;
let currentShape = "free";
let fillEnabled = false;
let lineType = "solid";
let undoStack = [];
const maxUndoSteps = 50; // Maximum number of undo steps

const colorPicker = document.getElementById("colorPicker");
const fillColorPicker = document.getElementById("fillColorPicker");
const fillToggle = document.getElementById("fillToggle");
const lineWidthPicker = document.getElementById("lineWidthPicker");
const lineTypePicker = document.getElementById("lineTypePicker");
const resetButton = document.getElementById("resetButton");
const shapeButtons = document.querySelectorAll(".shape-button");

colorPicker.addEventListener("input", () => (color = colorPicker.value));
fillColorPicker.addEventListener(
  "input",
  () => (fillColor = fillColorPicker.value)
);
fillToggle.addEventListener("change", () => (fillEnabled = fillToggle.checked));
lineWidthPicker.addEventListener(
  "change",
  () => (lineWidth = parseInt(lineWidthPicker.value))
);
lineTypePicker.addEventListener(
  "change",
  () => (lineType = lineTypePicker.value)
);

// Add undo button to HTML
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.classList.add("action-button");
document.querySelector(".toolbar").appendChild(undoButton);

// Reset canvas
resetButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  undoStack = []; // Clear undo stack when canvas is reset
});

// Set up shape buttons
shapeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    shapeButtons.forEach((btn) => btn.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");
    // Set current shape
    currentShape = button.dataset.shape;
  });
});

let startX, startY;
let lastDrawn = null; // Store last drawn image data

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  startX = e.offsetX;
  startY = e.offsetY;
  lastDrawn = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Start new path for free drawing
  if (currentShape === "free") {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  const currentX = e.offsetX;
  const currentY = e.offsetY;

  if (currentShape === "free") {
    setCanvasStyles();
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  } else {
    // Restore previous state and draw shape preview
    ctx.putImageData(lastDrawn, 0, 0);
    setCanvasStyles();
    drawShape(currentShape, startX, startY, currentX, currentY);
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (!drawing) return;

  const endX = e.offsetX;
  const endY = e.offsetY;

  if (currentShape !== "free") {
    ctx.putImageData(lastDrawn, 0, 0);
    setCanvasStyles();
    drawShape(currentShape, startX, startY, endX, endY);
  }

  drawing = false;
  saveState();
});

// Add mouse leave handler to prevent shapes getting stuck
canvas.addEventListener("mouseleave", () => {
  if (drawing && currentShape !== "free") {
    ctx.putImageData(lastDrawn, 0, 0);
    drawing = false;
  }
});

// Apply dash pattern based on selected line type
function setCanvasStyles() {
  ctx.strokeStyle = color;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round"; // Add this for smoother corners

  // Set line style based on lineType
  switch (lineType) {
    case "solid":
      ctx.setLineDash([]);
      break;
    case "dotted":
      ctx.setLineDash([lineWidth, lineWidth * 2]);
      break;
    case "dashed":
      ctx.setLineDash([lineWidth * 3, lineWidth * 2]);
      break;
    case "dashdot":
      ctx.setLineDash([lineWidth * 3, lineWidth * 2, lineWidth, lineWidth * 2]);
      break;
  }
}

function drawShape(shape, x1, y1, x2, y2) {
  const w = x2 - x1;
  const h = y2 - y1;

  ctx.beginPath();
  switch (shape) {
    case "circle":
      const radius = Math.sqrt(w * w + h * h) / 2;
      ctx.arc(x1 + w / 2, y1 + h / 2, radius, 0, Math.PI * 2);
      break;
    case "triangle":
      ctx.moveTo(x1 + w / 2, y1);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      break;
    case "parallelogram":
      ctx.moveTo(x1 + w / 4, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2 - w / 4, y2);
      ctx.lineTo(x1, y2);
      ctx.closePath();
      break;
    case "cube":
      // Base rectangle
      ctx.rect(x1, y1, w, h);
      ctx.stroke();

      // Top face
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + w * 0.2, y1 - h * 0.2);
      ctx.lineTo(x2 + w * 0.2, y1 - h * 0.2);
      ctx.lineTo(x2, y1);
      ctx.closePath();
      if (fillEnabled) ctx.fill();
      ctx.stroke();

      // Side face
      ctx.beginPath();
      ctx.moveTo(x2, y1);
      ctx.lineTo(x2 + w * 0.2, y1 - h * 0.2);
      ctx.lineTo(x2 + w * 0.2, y2 - h * 0.2);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      if (fillEnabled) ctx.fill();
      ctx.stroke();

      return; // Early return to avoid the fill/stroke at the end
    case "cylinder":
      // Top ellipse
      ctx.beginPath();
      ctx.ellipse(x1 + w / 2, y1 + h / 10, w / 2, h / 10, 0, 0, Math.PI * 2);
      if (fillEnabled) ctx.fill();
      ctx.stroke();

      // Side lines
      ctx.beginPath();
      ctx.moveTo(x1, y1 + h / 10);
      ctx.lineTo(x1, y2 - h / 10);
      ctx.moveTo(x2, y1 + h / 10);
      ctx.lineTo(x2, y2 - h / 10);
      ctx.stroke();

      // Bottom ellipse
      ctx.beginPath();
      ctx.ellipse(x1 + w / 2, y2 - h / 10, w / 2, h / 10, 0, 0, Math.PI * 2);
      if (fillEnabled) ctx.fill();
      ctx.stroke();

      return; // Early return
    case "pentagon":
      const cx = x1 + w / 2;
      const cy = y1 + h / 2;
      const r = Math.min(Math.abs(w), Math.abs(h)) / 2;
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
  }

  // Fill shape if fill is enabled (for most shapes)
  if (fillEnabled) {
    ctx.fill();
  }
  ctx.stroke();
}

// Add undo button event listener
undoButton.addEventListener("click", undo);

// Add these new functions
function saveState() {
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (undoStack.length > maxUndoSteps) {
    undoStack.shift(); // Remove oldest state if exceeded max steps
  }
}

function undo() {
  if (undoStack.length > 0) {
    const previousState = undoStack.pop();
    ctx.putImageData(previousState, 0, 0);
  }
}

// Handle window resize
window.addEventListener("resize", () => {
  // Save the current canvas content
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Resize canvas
  setCanvasSize();

  // Restore content
  ctx.putImageData(imgData, 0, 0);
});

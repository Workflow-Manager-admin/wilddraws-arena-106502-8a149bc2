import React, { useRef, useState } from "react";

// PUBLIC_INTERFACE
function DrawingCanvas({ isActive, onSubmit, disabled, timer, label }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Drawing event handlers
  const getPos = (e) => {
    if (e.touches) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };
  };

  const startDraw = (e) => {
    if (!isActive || disabled) return;
    setDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!drawing || !isActive || disabled) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#159cf3";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();
  };
  const endDraw = () => setDrawing(false);

  // Clear/submit
  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, 320, 280);
  };
  const handleSubmit = () => {
    const dataURL = canvasRef.current.toDataURL("image/png");
    setSubmitted(true);
    onSubmit(dataURL);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: 600, color: "#333", marginBottom: 6 }}>{label || "Draw below"}</div>
      <canvas
        ref={canvasRef}
        width={320}
        height={280}
        style={{
          border: "2px solid #dbeaff",
          borderRadius: 12,
          background: "#fff",
          touchAction: "none",
          margin: "auto",
          display: "block"
        }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: "12px" }}>
        <button className="btn" style={{ background: "#e2e2e2", color: "#2c44a6" }} disabled={disabled || submitted} onClick={handleClear}>
          Clear
        </button>
        <button className="btn" style={{
          background: "#13cd6d", color: "#fff",
          fontWeight: 700
        }} disabled={disabled || submitted} onClick={handleSubmit}>Submit</button>
      </div>
      <div style={{ fontSize: 14, color: "#a8a8a8", marginTop: 4 }}>No text input allowed. {timer ? `Time left: ${timer}s` : ""}</div>
    </div>
  );
}

export default DrawingCanvas;

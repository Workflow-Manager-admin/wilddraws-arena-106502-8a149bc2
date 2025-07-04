import React from "react";

// PUBLIC_INTERFACE
function WheelSpinner({ spin, value }) {
  return (
    <span style={{
      fontWeight: 900,
      color: spin ? "#f5b10b" : "#2d2264",
      fontSize: spin ? "1.32em" : "1.16em",
      padding: "7px 18px",
      borderRadius: 16,
      boxShadow: spin ? "0 1px 10px #fdedaa" : "0 1px 2px #eafaff",
      background: spin ? "#fff8e7" : "#f5f2ff",
      transition: "all 0.29s cubic-bezier(.76,.2,.23,.81)"
    }}>
      {spin ? "🎡 " : ""}{value || "‽"}
    </span>
  );
}

export default WheelSpinner;

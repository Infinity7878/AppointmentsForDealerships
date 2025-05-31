import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase"; // your firestore config

export default function AppointmentApp() {
  const [rows, setRows] = useState([]);
  const [formData, setFormData] = useState({
    client: "",
    porter: "",
    advisor: "",
    time: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [showEndDayPopup, setShowEndDayPopup] = useState(false);
  const [theme, setTheme] = useState("light");

  const popupRef = useRef([]);
  const endDayPopupRef = useRef(null);
  const endDayButtonRef = useRef(null);
  const rowRefs = useRef([]);

  useEffect(() => {
    async function fetchAppointments() {
      const snapshot = await getDocs(collection(db, "appointments"));
      const appointments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        showPopup: false,
      }));
      setRows(appointments);
    }
    fetchAppointments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addRow = async () => {
    if (
      !formData.client.trim() ||
      !formData.porter.trim() ||
      !formData.advisor.trim() ||
      !formData.time.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "appointments"), {
        ...formData,
        status: "pending",
      });
      setRows((prev) => [
        ...prev,
        { id: docRef.id, ...formData, status: "pending", showPopup: false },
      ]);
      setFormData({ client: "", porter: "", advisor: "", time: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding appointment: ", error);
    }
  };

  const togglePopup = (index) => {
    setRows((prevRows) =>
      prevRows.map((row, i) => ({
        ...row,
        showPopup: i === index ? !row.showPopup : false,
      }))
    );
  };

  const updateStatus = async (index, status) => {
    const row = rows[index];
    try {
      const docRef = doc(db, "appointments", row.id);
      await updateDoc(docRef, { status });
      setRows((prevRows) =>
        prevRows.map((r, i) =>
          i === index ? { ...r, status, showPopup: false } : r
        )
      );
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const deleteRow = async (index) => {
    const row = rows[index];
    try {
      await deleteDoc(doc(db, "appointments", row.id));
      setRows((prevRows) => prevRows.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting appointment: ", error);
    }
  };

  const getRowStyle = (status) => {
    switch (status) {
      case "helped":
        return theme === "dark" ? "#2a4d8c" : "#cce5ff"; // blue-ish
      case "shipped":
        return theme === "dark" ? "#2d5034" : "#d4edda"; // green-ish
      case "pending":
      default:
        return theme === "dark" ? "#6b2f3a" : "#f1b0b7"; // red-ish
    }
  };

  const handleEndDay = () => setShowEndDayPopup(true);

  async function batchDeleteAppointments() {
    try {
      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, "appointments"));
      snapshot.forEach((docSnap) => {
        batch.delete(doc(db, "appointments", docSnap.id));
      });
      await batch.commit();
      console.log("All appointments deleted successfully.");
    } catch (error) {
      console.error("Error deleting appointments: ", error);
    }
  }

  const confirmEndDay = async (confirm) => {
    if (confirm) {
      await batchDeleteAppointments();
      setRows([]);
    }
    setShowEndDayPopup(false);
  };

  const handleClickOutside = (e) => {
    if (
      endDayPopupRef.current &&
      !endDayPopupRef.current.contains(e.target) &&
      endDayButtonRef.current &&
      !endDayButtonRef.current.contains(e.target)
    ) {
      setShowEndDayPopup(false);
    }

    rows.forEach((_, index) => {
      if (
        popupRef.current[index] &&
        !popupRef.current[index].contains(e.target) &&
        rowRefs.current[index] &&
        !rowRefs.current[index].contains(e.target)
      ) {
        setRows((prev) =>
          prev.map((row, i) =>
            i === index ? { ...row, showPopup: false } : row
          )
        );
      }
    });
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [rows]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "20px auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: 20,
        backgroundColor: theme === "dark" ? "#1e1e1e" : "#ffffff",
        color: theme === "dark" ? "#f0f0f0" : "#000000",
        minHeight: "100vh",
        transition: "all 0.3s ease",
      }}
    >
      <button
        onClick={toggleTheme}
        style={{
          marginBottom: 16,
          padding: "8px 16px",
          borderRadius: 6,
          border: "2px solid #000",
          backgroundColor: theme === "dark" ? "#444" : "#eee",
          color: theme === "dark" ? "#fff" : "#000",
          cursor: "pointer",
          float: "right",
        }}
      >
        {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </button>

      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Appointment Management
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
          fontWeight: "bold",
          borderBottom: theme === "dark" ? "3px solid #ddd" : "3px solid #333",
          paddingBottom: 8,
          marginBottom: 12,
          textAlign: "center",
          color: theme === "dark" ? "#ddd" : "#000",
        }}
      >
        <div>Client</div>
        <div>Porter</div>
        <div>Advisor</div>
        <div>Appt. Time</div>
      </div>

      {rows.map((row, index) => (
        <div key={row.id} style={{ position: "relative", marginBottom: 12 }}>
          <div
            ref={(el) => (rowRefs.current[index] = el)}
            onClick={() => togglePopup(index)}
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
              gap: 16,
              padding: "12px 16px",
              backgroundColor: getRowStyle(row.status),
              borderRadius: 8,
              border: "2px solid #000",
              cursor: "pointer",
              userSelect: "none",
              alignItems: "center",
              transition: "background-color 0.3s",
              color: theme === "dark" ? "#f0f0f0" : "#000",
            }}
          >
            <div>{row.client}</div>
            <div>{row.porter}</div>
            <div>{row.advisor}</div>
            <div>{row.time}</div>
          </div>

          {row.showPopup && (
            <div
              ref={(el) => (popupRef.current[index] = el)}
              style={{
                position: "absolute",
                top: "110%",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: theme === "dark" ? "#333" : "#fff",
                border: "2px solid #000",
                borderRadius: 8,
                padding: 16,
                boxShadow:
                  theme === "dark"
                    ? "0 4px 10px rgba(255,255,255,0.2)"
                    : "0 4px 10px rgba(0,0,0,0.2)",
                display: "flex",
                gap: 12,
                zIndex: 100,
                minWidth: 280,
                justifyContent: "center",
                color: theme === "dark" ? "#fff" : "#000",
              }}
            >
              <button
                onClick={() => updateStatus(index, "helped")}
                style={buttonStyle("#007bff")}
              >
                With Advisor
              </button>
              <button
                onClick={() => updateStatus(index, "shipped")}
                style={buttonStyle("#28a745")}
              >
                Ship
              </button>
              <button
                onClick={() => updateStatus(index, "pending")}
                style={buttonStyle("#f1b0b7")}
              >
                Needs Advisor
              </button>
              <button
                onClick={() => deleteRow(index)}
                style={buttonStyle("#dc3545")}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            marginTop: 24,
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "12px 24px",
            border: "2px solid #000",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 16,
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            transition: "background-color 0.3s",
            display: "block",
            marginLeft: "auto",
          }}
        >
          Add Appointment
        </button>
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addRow();
          }}
          style={{
            marginTop: 24,
            backgroundColor: theme === "dark" ? "#333" : "#f9f9f9",
            padding: 24,
            border: "2px solid #000",
            borderRadius: 12,
            boxShadow:
              theme === "dark"
                ? "0 4px 10px rgba(255,255,255,0.1)"
                : "0 4px 10px rgba(0,0,0,0.1)",
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
            color: theme === "dark" ? "#eee" : "#000",
          }}
        >
          {["client", "porter", "advisor", "time"].map((field) => (
            <div
              key={field}
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: 16,
              }}
            >
              <label
                htmlFor={field}
                style={{ marginBottom: 6, fontWeight: "600", fontSize: 14 }}
              >
                {field === "time" ? "Appt. Time" : capitalize(field)}:
              </label>
              <input
                id={field}
                name={field}
                type="text"
                value={formData[field]}
                onChange={handleChange}
                style={{
                  padding: 12,
                  fontSize: 16,
                  borderRadius: 8,
                  border: "2px solid #000",
                  backgroundColor: theme === "dark" ? "#555" : "#fff",
                  color: theme === "dark" ? "#eee" : "#000",
                }}
                required
              />
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <button
              type="submit"
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "12px 24px",
                border: "2px solid #000",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                transition: "background-color 0.3s",
              }}
            >
              Submit Appointment
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                padding: "12px 24px",
                border: "2px solid #000",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                transition: "background-color 0.3s",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <button
        ref={endDayButtonRef}
        onClick={handleEndDay}
        style={{
          marginTop: 40,
          backgroundColor: "#dc3545",
          color: "white",
          padding: "12px 24px",
          border: "2px solid #000",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 16,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          transition: "background-color 0.3s",
          display: "block",
          marginLeft: "auto",
        }}
      >
        End Day (Delete All)
      </button>

      {showEndDayPopup && (
        <div
          ref={endDayPopupRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 200,
          }}
        >
          <div
            style={{
              backgroundColor: theme === "dark" ? "#222" : "#fff",
              padding: 24,
              borderRadius: 12,
              border: "2px solid #000",
              maxWidth: 400,
              textAlign: "center",
              color: theme === "dark" ? "#eee" : "#000",
            }}
          >
            <p style={{ marginBottom: 24, fontWeight: "600", fontSize: 18 }}>
              Are you sure you want to delete all appointments and end the day?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <button
                onClick={() => confirmEndDay(true)}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "2px solid #000",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => confirmEndDay(false)}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "2px solid #000",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buttonStyle(bgColor) {
  return {
    backgroundColor: bgColor,
    border: "2px solid #000",
    color: "white",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
    transition: "background-color 0.3s",
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

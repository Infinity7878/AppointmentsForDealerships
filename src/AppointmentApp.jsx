import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

// Initialize Firebase app (replace with your config)
const firebaseConfig = {
  // your firebase config here
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

  const popupRef = useRef([]);
  const endDayPopupRef = useRef(null);
  const endDayButtonRef = useRef(null);
  const rowRefs = useRef([]);

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("time"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        showPopup: false,
      }));
      setRows(data);
    });
    return () => unsubscribe();
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
      await addDoc(collection(db, "appointments"), {
        client: formData.client,
        porter: formData.porter,
        advisor: formData.advisor,
        time: formData.time,
        status: "pending",
      });
      setFormData({ client: "", porter: "", advisor: "", time: "" });
      setShowForm(false);
    } catch (error) {
      alert("Error adding appointment: " + error.message);
    }
  };

  const updateStatus = async (index, status) => {
    try {
      const row = rows[index];
      const docReference = doc(db, "appointments", row.id);
      await updateDoc(docReference, { status });
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  const removeRow = async (index) => {
    try {
      const row = rows[index];
      const docReference = doc(db, "appointments", row.id);
      await deleteDoc(docReference);
    } catch (error) {
      alert("Error removing appointment: " + error.message);
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

  const getRowStyle = (status) => {
    switch (status) {
      case "helped":
        return "#cce5ff"; // Light blue
      case "shipped":
        return "#d4edda"; // Light green
      case "pending":
      default:
        return "#f1b0b7"; // Light red
    }
  };

  const handleEndDay = () => setShowEndDayPopup(true);

  const confirmEndDay = async (confirm) => {
    if (confirm) {
      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, "appointments"));
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
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
          borderBottom: "3px solid #333",
          paddingBottom: 8,
          marginBottom: 12,
          textAlign: "center",
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
                backgroundColor: "#fff",
                border: "2px solid #000",
                borderRadius: 8,
                padding: 16,
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                display: "flex",
                gap: 12,
                zIndex: 100,
                minWidth: 380,
                flexWrap: "wrap",
                justifyContent: "center",
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
                onClick={() => removeRow(index)}
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
            backgroundColor: "#f9f9f9",
            padding: 24,
            border: "2px solid #000",
            borderRadius: 12,
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
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
          marginTop: 24,
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
        End Day (Clear All)
      </button>

      {showEndDayPopup && (
        <div
          ref={endDayPopupRef}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fff",
            border: "3px solid #000",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            zIndex: 200,
            maxWidth: 380,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
            Are you sure you want to clear all appointments for the day?
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <button
              onClick={() => confirmEndDay(true)}
              style={buttonStyle("#dc3545")}
            >
              Yes, Clear All
            </button>
            <button
              onClick={() => confirmEndDay(false)}
              style={buttonStyle("#6c757d")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper styles and functions

function buttonStyle(bgColor) {
  return {
    backgroundColor: bgColor,
    color: "white",
    padding: "10px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "600",
    minWidth: 110,
    userSelect: "none",
    transition: "background-color 0.3s",
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

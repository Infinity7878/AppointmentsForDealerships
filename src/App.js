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

  const updateStatus = async (index, status, action) => {
    const row = rows[index];
    const docRef = doc(db, "appointments", row.id);

    try {
      if (action === "delete") {
        await deleteDoc(docRef);
        setRows((prevRows) => prevRows.filter((_, i) => i !== index));
      } else {
        await updateDoc(docRef, { status });
        setRows((prevRows) =>
          prevRows.map((r, i) =>
            i === index ? { ...r, status, showPopup: false } : r
          )
        );
      }
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const getRowStyle = (status) => {
    switch (status) {
      case "helped":
        return "#cce5ff"; // blue
      case "shipped":
        return "#d4edda"; // green
      case "pending":
      default:
        return "#f8d7da"; // red
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

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "20px auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: 20,
      }}
    >
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
                minWidth: 320,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                {
                  label: "With Advisor",
                  value: "helped",
                  color: "#007bff",
                  action: "update",
                },
                {
                  label: "Ship",
                  value: "shipped",
                  color: "#28a745",
                  action: "update",
                },
                {
                  label: "Needs Advisor",
                  value: "pending",
                  color: "#dc3545",
                  action: "update",
                },
                {
                  label: "Delete",
                  value: "delete",
                  color: "#6c757d",
                  action: "delete",
                },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() =>
                    updateStatus(index, option.value, option.action)
                  }
                  style={buttonStyle(option.color)}
                >
                  {option.label}
                </button>
              ))}
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
            <button type="submit" style={buttonStyle("#3b82f6")}>
              Submit Appointment
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={buttonStyle("#6c757d")}
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
          position: "fixed",
          bottom: 24,
          right: 24,
          backgroundColor: "#dc3545",
          color: "white",
          padding: "12px 24px",
          border: "2px solid #000",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 16,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          transition: "background-color 0.3s",
          zIndex: 101,
        }}
      >
        End Day
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
            padding: 24,
            border: "2px solid #000",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 200,
            width: 320,
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: 24 }}>
            Are you sure you want to end the day?
          </h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <button
              onClick={() => confirmEndDay(true)}
              style={buttonStyle("#007bff")}
            >
              Yes
            </button>
            <button
              onClick={() => confirmEndDay(false)}
              style={buttonStyle("#6c757d")}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const buttonStyle = (bgColor) => ({
  backgroundColor: bgColor,
  color: "white",
  padding: "8px 16px",
  border: "2px solid #000",
  borderRadius: 4,
  cursor: "pointer",
  transition: "background-color 0.3s",
  fontWeight: "600",
});

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

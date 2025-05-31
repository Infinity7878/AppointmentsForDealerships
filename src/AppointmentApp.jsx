import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase"; // make sure your firebase config is set up
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import "./AppointmentApp.css";

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

  const popupRefs = useRef([]);
  const endDayPopupRef = useRef(null);
  const endDayButtonRef = useRef(null);
  const rowRefs = useRef([]);

  const appointmentsRef = collection(db, "appointments");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add appointment
  const addRow = async () => {
    if (
      !formData.client.trim() ||
      !formData.porter.trim() ||
      !formData.advisor.trim() ||
      !formData.time.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }
    await addDoc(appointmentsRef, {
      ...formData,
      status: "pending",
    });
    setFormData({ client: "", porter: "", advisor: "", time: "" });
    setShowForm(false);
  };

  // Toggle popup for each row
  const togglePopup = (index) => {
    setRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index
          ? { ...row, showPopup: !row.showPopup }
          : { ...row, showPopup: false }
      )
    );
  };

  // Update appointment status
  const updateStatus = async (index, status) => {
    const appointment = rows[index];
    const appointmentDoc = doc(db, "appointments", appointment.id);
    await updateDoc(appointmentDoc, { status });
  };

  // Row color based on status
  const getRowClass = (status) => {
    switch (status) {
      case "helped":
        return "row-helped";
      case "shipped":
        return "row-shipped";
      default:
        return "row-pending";
    }
  };

  // End day button handler
  const handleEndDay = () => {
    setShowEndDayPopup(true);
  };

  // Confirm end day (delete all)
  const confirmEndDay = async (confirm) => {
    if (confirm) {
      const deletions = rows.map((row) =>
        deleteDoc(doc(db, "appointments", row.id))
      );
      await Promise.all(deletions);
    }
    setShowEndDayPopup(false);
  };

  // Close popups if clicking outside
  const handleClickOutside = (e) => {
    if (
      endDayPopupRef.current &&
      !endDayPopupRef.current.contains(e.target) &&
      !endDayButtonRef.current.contains(e.target)
    ) {
      setShowEndDayPopup(false);
    }

    rows.forEach((_, index) => {
      if (
        popupRefs.current[index] &&
        !popupRefs.current[index].contains(e.target) &&
        rowRefs.current[index] &&
        !rowRefs.current[index].contains(e.target)
      ) {
        setRows((prevRows) =>
          prevRows.map((row, i) =>
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

  useEffect(() => {
    const unsubscribe = onSnapshot(appointmentsRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        showPopup: false,
      }));
      setRows(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="app-container">
      <div className="table-header">
        <div>Client</div>
        <div>Porter</div>
        <div>Advisor</div>
        <div>Appt. Time</div>
      </div>

      {rows.map((row, index) => (
        <div
          key={row.id}
          className={`table-row ${getRowClass(row.status)}`}
          onClick={() => togglePopup(index)}
          ref={(el) => (rowRefs.current[index] = el)}
        >
          <div>{row.client}</div>
          <div>{row.porter}</div>
          <div>{row.advisor}</div>
          <div>{row.time}</div>

          {row.showPopup && (
            <div
              className="popup-menu"
              ref={(el) => (popupRefs.current[index] = el)}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => updateStatus(index, "helped")}>
                With Advisor
              </button>
              <button onClick={() => updateStatus(index, "shipped")}>
                Ship
              </button>
              <button onClick={() => updateStatus(index, "pending")}>
                Needs Advisor
              </button>
            </div>
          )}
        </div>
      ))}

      {!showForm && (
        <button className="add-btn" onClick={() => setShowForm(true)}>
          Add Appointment
        </button>
      )}

      {showForm && (
        <div className="form-container">
          <label>
            Client:
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={handleChange}
            />
          </label>
          <label>
            Porter:
            <input
              type="text"
              name="porter"
              value={formData.porter}
              onChange={handleChange}
            />
          </label>
          <label>
            Advisor:
            <input
              type="text"
              name="advisor"
              value={formData.advisor}
              onChange={handleChange}
            />
          </label>
          <label>
            Appt. Time:
            <input
              type="text"
              name="time"
              value={formData.time}
              onChange={handleChange}
            />
          </label>
          <button className="submit-btn" onClick={addRow}>
            Submit Appointment
          </button>
        </div>
      )}

      <button
        ref={endDayButtonRef}
        onClick={handleEndDay}
        className="end-day-btn"
      >
        End Day
      </button>

      {showEndDayPopup && (
        <div className="modal" ref={endDayPopupRef}>
          <h3>Are you sure?</h3>
          <div className="modal-buttons">
            <button onClick={() => confirmEndDay(true)}>Yes</button>
            <button onClick={() => confirmEndDay(false)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
}

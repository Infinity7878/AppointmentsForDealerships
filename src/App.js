import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase"; // Adjust path as needed

export default function AppointmentApp() {
  const [rows, setRows] = useState([]);
  const [formData, setFormData] = useState({
    client: "",
    porter: "",
    advisor: "",
    time: "",
  });
  const [showForm, setShowForm] = useState(false);

  // other refs and handlers...

  // Listen to Firestore collection changes (to sync state)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const appointments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRows(appointments);
      }
    );
    return unsubscribe;
  }, []);

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
      // Add appointment to Firestore
      await addDoc(collection(db, "appointments"), {
        ...formData,
        status: "pending",
        showPopup: false,
      });
      // Reset form and hide it
      setFormData({ client: "", porter: "", advisor: "", time: "" });
      setShowForm(false);
      // No need to setRows here; onSnapshot will update rows automatically
    } catch (error) {
      console.error("Error adding appointment: ", error);
    }
  };

  // rest of your component unchanged...
}

import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const ShiftEntry: React.FC = () => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const saveShift = async () => {
    if (!auth.currentUser) return;
    
    if (!date || !startTime || !endTime) {
      alert("נא למלא את כל השדות (תאריך, כניסה ויציאה)");
      return;
    }

    try {
      // קריאה לשרת הפייתון לחישוב שעות וסיווגן (לשמירה במסד הנתונים)
      const response = await fetch('https://salary-app-4npn.onrender.com/api/calculate-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime,
          is_weekend_or_holiday: false
        }),
      });
      const hoursData = await response.json();

      // שמירת המשמרת והשעות המחושבות ב-Firestore
      await addDoc(collection(db, `users/${auth.currentUser.uid}/shifts`), {
        date,
        startTime,
        endTime,
        calculated: hoursData,
        createdAt: new Date()
      });
      
      alert('המשמרת נשמרה בהצלחה!');
      
      // איפוס הטופס להזנה הבאה
      setDate('');
      setStartTime('');
      setEndTime('');
      
    } catch (e) {
      console.error("Error saving shift: ", e);
      alert('אירעה שגיאה. ודא ששרת הפייתון מופעל.');
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #edf2f7', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#2d3748', textAlign: 'center' }}>⏱️ דיווח משמרת חדשה</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontWeight: 'bold' }}>תאריך המשמרת:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontSize: '16px' }} />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontWeight: 'bold' }}>שעת כניסה:</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontSize: '16px' }} />
        </div>
        <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontWeight: 'bold' }}>שעת יציאה:</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontSize: '16px' }} />
        </div>
      </div>

      <button onClick={saveShift} style={{ width: '100%', padding: '16px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
        שמור משמרת 
      </button>
    </div>
  );
};

export default ShiftEntry;
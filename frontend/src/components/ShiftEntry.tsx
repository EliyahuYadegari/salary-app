import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

const ShiftEntry: React.FC = () => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [calculatedHours, setCalculatedHours] = useState<any>(null);
  const [salaryResult, setSalaryResult] = useState<any>(null);

  const saveShift = async () => {
    if (!auth.currentUser) return;

    try {
      // 1. חישוב שעות מול ה-Backend
      const hoursResponse = await fetch('http://127.0.0.1:8000/api/calculate-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime,
          is_weekend_or_holiday: false
        }),
      });
      const hoursData = await hoursResponse.json();
      setCalculatedHours(hoursData);

      // 2. שליפת הגדרות מה-Firestore
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const settings = userDoc.data()?.settings || { hourlyRate: 50, creditPoints: 2.25, pensionRate: 6, travelExpenses: 300 };

      // 3. חישוב שכר חודשי סופי מול ה-Backend
      const salaryResponse = await fetch('http://127.0.0.1:8000/api/calculate-monthly-net', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours_data: hoursData,
          hourly_rate: settings.hourlyRate,
          credit_points: settings.creditPoints,
          pension_rate: settings.pensionRate,
          travel_expenses: settings.travelExpenses
        }),
      });
      const salaryData = await salaryResponse.json();
      setSalaryResult(salaryData);

      // 4. שמירה ב-Firestore
      await addDoc(collection(db, `users/${auth.currentUser.uid}/shifts`), {
        date,
        startTime,
        endTime,
        calculated: hoursData,
        salaryResult: salaryData,
        createdAt: new Date()
      });
      
      alert('המשמרת נשמרה וחושבה בהצלחה!');
    } catch (e) {
      console.error("Error saving shift: ", e);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '350px' }}>
      <h3>הזנת משמרת</h3>
      <input type="date" onChange={(e) => setDate(e.target.value)} /><br/>
      <input type="time" onChange={(e) => setStartTime(e.target.value)} /> כניסה<br/>
      <input type="time" onChange={(e) => setEndTime(e.target.value)} /> יציאה<br/>
      <button onClick={saveShift} style={{ marginTop: '10px' }}>שמור וחשב</button>
      
      {salaryResult && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
          <h4>תוצאות חישוב משוערות:</h4>
          <p><strong>ברוטו:</strong> {salaryResult.gross_salary} ₪</p>
          <p><strong>נטו משוער:</strong> {salaryResult.net_salary} ₪</p>
          <hr />
          <p style={{ fontSize: '12px' }}>
            מס הכנסה: {salaryResult.deductions.income_tax} ₪<br/>
            ביטוח לאומי/בריאות: {salaryResult.deductions.national_insurance + salaryResult.deductions.health_tax} ₪<br/>
            פנסיה: {salaryResult.deductions.pension} ₪
          </p>
        </div>
      )}
    </div>
  );
};

export default ShiftEntry;
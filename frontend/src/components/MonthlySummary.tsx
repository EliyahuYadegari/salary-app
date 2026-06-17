import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';

const MonthlySummary: React.FC = () => {
  const [monthlyStats, setMonthlyStats] = useState<any>(null);

  const calculateMonthly = async () => {
    if (!auth.currentUser) return;
    
    // שליפת כל המשמרות מה-Firestore
    const q = query(collection(db, `users/${auth.currentUser.uid}/shifts`));
    const querySnapshot = await getDocs(q);
    
    let totalRegular = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data().calculated; // השעות שחושבו ביום בודד
      if (data && data.regular) totalRegular += data.regular;
    });

    // שליחה לשרת לחישוב ברוטו/נטו חודשי
    const response = await fetch('http://127.0.0.1:8000/api/calculate-monthly-salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            hours_data: { regular: totalRegular, total: totalRegular }, 
            hourly_rate: 50, // מומלץ לשלוף מה-Settings
            credit_points: 2.25,
            pension_rate: 6,
            travel_expenses: 300
        }),
    });
    setMonthlyStats(await response.json());
  };

  return (
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #007bff' }}>
      <button onClick={calculateMonthly}>חשב תלוש חודשי</button>
      {monthlyStats && (
        <div style={{ marginTop: '10px' }}>
          <h3>תלוש משכורת חודשי</h3>
          <p>ברוטו: {monthlyStats.gross_salary} ₪</p>
          <p>נטו: {monthlyStats.net_salary} ₪</p>
        </div>
      )}
    </div>
  );
};

export default MonthlySummary;
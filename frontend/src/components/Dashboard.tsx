// frontend/src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Dashboard: React.FC = () => {
  const [monthlyStats, setMonthlyStats] = useState<any>(null);

  const calculateMonthly = async () => {
    if (!auth.currentUser) return;
    
    // שליפת כל המשמרות של המשתמש מה-Firestore
    const q = query(collection(db, `users/${auth.currentUser.uid}/shifts`));
    const querySnapshot = await getDocs(q);
    
    // סיכום השעות (לוגיקה פשוטה של צבירה)
    let totalRegular = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data().calculated;
      totalRegular += data.regular;
    });

    // שליחה לשרת לחישוב ברוטו/נטו חודשי
    const response = await fetch('http://127.0.0.1:8000/api/calculate-monthly-salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            hours_data: { regular: totalRegular }, // כאן מעבירים את הסיכום החודשי
            hourly_rate: 50, // מומלץ לשלוף מהגדרות המשתמש
            credit_points: 2.25,
            pension_rate: 6,
            travel_expenses: 300
        }),
    });
    setMonthlyStats(await response.json());
  };

  return (
    <div>
      <button onClick={calculateMonthly}>חשב תלוש חודשי</button>
      {monthlyStats && (
        <div>
          <h3>תלוש משכורת חודשי</h3>
          <p>ברוטו: {monthlyStats.gross_salary} ₪</p>
          <p>נטו: {monthlyStats.net_salary} ₪</p>
        </div>
      )}
    </div>
  );
};
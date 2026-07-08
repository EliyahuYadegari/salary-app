import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';

const HomeStats: React.FC = () => {
  const [stats, setStats] = useState({
    todayHours: 0,
    monthTotal: 0,
    monthOvertime: 0,
    remainingHours: 0,
    targetHours: 0,
    vacationBalance: 0,
    sickBalance: 0,
    isHrConfigured: false
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userSettings = userDocSnap.data()?.settings || {};
      
      const baseHours = Number(userSettings.globalBaseHours) || 0;
      const otHours = Number(userSettings.globalOtHours) || 0;
      const totalContractTarget = baseHours + otHours; 

      const startDateString = userSettings.employmentStartDate;
      const yearlyVacationDays = Number(userSettings.yearlyVacationDays) || 12;
      const standardDayHours = Number(userSettings.standardDayHours) || 8.5; // משיכת ערך יום תקני
      const isHrConfigured = !!startDateString;

      let monthsWorked = 0;
      if (isHrConfigured) {
        const startDate = new Date(startDateString);
        const now = new Date();
        monthsWorked = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (monthsWorked < 0) monthsWorked = 0;
      }

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.substring(0, 7); 

      const q = query(collection(db, `users/${auth.currentUser.uid}/shifts`));
      const querySnapshot = await getDocs(q);

      let todayHours = 0;
      let monthTotal = 0;
      let usedSick = 0;
      let usedVacation = 0;

      querySnapshot.forEach((shiftDoc) => {
        const shift = shiftDoc.data();
        const calc = shift.calculated;

        // ספירת ימי חופש ומחלה לצבירה הכללית
        if (shift.type === 'sick') usedSick++;
        if (shift.type === 'vacation') usedVacation++;

        // חישוב שעות לחודש הנוכחי (כולל שעות מחלה וחופש!)
        if (shift.date && shift.date.startsWith(currentMonth)) {
          let dailyHours = 0;
          
          if (shift.type === 'vacation' || shift.type === 'sick') {
            dailyHours = standardDayHours; // מוסיף את ערך השעות של יום עבודה רגיל
          } else {
            dailyHours = calc?.total || 0; // מוסיף שעות ממשמרת שעבדת בפועל
          }

          monthTotal += dailyHours;

          if (shift.date === today) {
            todayHours += dailyHours;
          }
        }
      });

      const monthOvertime = Math.max(0, monthTotal - totalContractTarget);
      const remainingHours = Math.max(0, totalContractTarget - monthTotal);

      let finalSickBalance = 0;
      let finalVacationBalance = 0;

      if (isHrConfigured) {
        const earnedSick = monthsWorked * 1.5;
        const earnedVacation = monthsWorked * (yearlyVacationDays / 12);
        finalSickBalance = earnedSick - usedSick;
        finalVacationBalance = earnedVacation - usedVacation;
      }

      setStats({
        todayHours: Number(todayHours.toFixed(2)),
        monthTotal: Number(monthTotal.toFixed(2)),
        monthOvertime: totalContractTarget > 0 ? Number(monthOvertime.toFixed(2)) : 0,
        remainingHours: totalContractTarget > 0 ? Number(remainingHours.toFixed(2)) : 0,
        targetHours: totalContractTarget,
        vacationBalance: Number(finalVacationBalance.toFixed(2)),
        sickBalance: Number(finalSickBalance.toFixed(2)),
        isHrConfigured
      });
    };

    fetchStats();
  }, []);

  const cardStyle = {
    flex: '1 1 40%',
    backgroundColor: '#ffffff',
    padding: '15px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #edf2f7',
    textAlign: 'center' as const,
    minWidth: '120px'
  };

  return (
    <div style={{ marginBottom: '25px' }}>
      
      <h3 style={{ color: '#2d3748', marginBottom: '5px' }}>תמונת מצב - החודש הנוכחי</h3>
      <p style={{ fontSize: '14px', color: '#718096', margin: '0 0 15px 0' }}>
        מכסת שעות החוזה: {stats.targetHours > 0 ? `${stats.targetHours} שעות` : 'טרם הוגדרו הגדרות חוזה'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        <div style={cardStyle}>
          <h5 style={{ margin: '0 0 5px 0', color: '#718096', fontWeight: 'normal' }}>היום</h5>
          <h2 style={{ margin: 0, color: '#3182ce' }}>{stats.todayHours}</h2>
        </div>
        <div style={cardStyle}>
          <h5 style={{ margin: '0 0 5px 0', color: '#718096', fontWeight: 'normal' }}>סה"כ החודש</h5>
          <h2 style={{ margin: 0, color: '#2b6cb0' }}>{stats.monthTotal}</h2>
        </div>
        <div style={cardStyle}>
          <h5 style={{ margin: '0 0 5px 0', color: '#718096', fontWeight: 'normal' }}>שעות נוספות</h5>
          <h2 style={{ margin: 0, color: '#dd6b20' }}>{stats.monthOvertime}</h2>
        </div>
        <div style={cardStyle}>
          <h5 style={{ margin: '0 0 5px 0', color: '#718096', fontWeight: 'normal' }}>נותר למכסה</h5>
          <h2 style={{ margin: 0, color: '#38a169' }}>{stats.remainingHours}</h2>
        </div>
      </div>

      <hr style={{ border: '1px solid #edf2f7', margin: '25px 0' }} />

      <h3 style={{ color: '#2d3748', marginBottom: '15px' }}>⛱️ יתרות חופש ומחלה</h3>
      {stats.isHrConfigured ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{...cardStyle, borderLeft: '4px solid #805ad5'}}>
            <h5 style={{ margin: '0 0 5px 0', color: '#718096', fontWeight: 'normal' }}>יתרת ימי חופש</h5>
            <h2 style={{ margin: 0, color: '#805ad5' }}>{stats.vacationBalance}</h2>
          </div>
          <div style={{...cardStyle, borderLeft: '4px solid #e53e3e'}}>
            <h5 style={{ margin: '0 0 5px 0', color: '#718096', fontWeight: 'normal' }}>יתרת ימי מחלה</h5>
            <h2 style={{ margin: 0, color: '#e53e3e' }}>{stats.sickBalance}</h2>
          </div>
        </div>
      ) : (
        <div style={{ padding: '15px', backgroundColor: '#fff5f5', borderRadius: '8px', color: '#c53030', textAlign: 'center', fontSize: '14px', border: '1px solid #fed7d7' }}>
          על מנת לראות יתרות חופש ומחלה, יש להגדיר <strong>תאריך תחילת העסקה</strong> במסך ההגדרות.
        </div>
      )}
    </div>
  );
};

export default HomeStats;
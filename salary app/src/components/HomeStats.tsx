import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';

const HomeStats: React.FC = () => {
  const [stats, setStats] = useState({
    todayHours: 0,
    monthTotal: 0,
    monthOvertime: 0,
    remainingHours: 0,
    targetHours: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userSettings = userDocSnap.data()?.settings || {};
      
      // המרה בטוחה לטיפול בשדות ריקים של משתמש חדש
      const baseHours = Number(userSettings.globalBaseHours) || 0;
      const otHours = Number(userSettings.globalOtHours) || 0;
      const totalContractTarget = baseHours + otHours; 

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.substring(0, 7); 

      const q = query(collection(db, `users/${auth.currentUser.uid}/shifts`));
      const querySnapshot = await getDocs(q);

      let todayHours = 0;
      let monthTotal = 0;

      querySnapshot.forEach((shiftDoc) => {
        const shift = shiftDoc.data();
        const calc = shift.calculated;

        if (shift.date && shift.date.startsWith(currentMonth)) {
          const total = calc?.total || 0;
          monthTotal += total;

          if (shift.date === today) {
            todayHours += total;
          }
        }
      });

      const monthOvertime = Math.max(0, monthTotal - totalContractTarget);
      const remainingHours = Math.max(0, totalContractTarget - monthTotal);

      setStats({
        todayHours: Number(todayHours.toFixed(2)),
        monthTotal: Number(monthTotal.toFixed(2)),
        monthOvertime: totalContractTarget > 0 ? Number(monthOvertime.toFixed(2)) : 0,
        remainingHours: totalContractTarget > 0 ? Number(remainingHours.toFixed(2)) : 0,
        targetHours: totalContractTarget
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
    </div>
  );
};

export default HomeStats;
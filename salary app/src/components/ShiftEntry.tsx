import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const ShiftEntry: React.FC = () => {
  // ברירת מחדל לתאריך - היום
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [shiftType, setShiftType] = useState<'work' | 'vacation' | 'sick'>('work'); // שדה חדש: סוג הדיווח
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // פונקציה להזנת השעה הנוכחית
  const setTimeNow = (type: 'start' | 'end') => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    if (type === 'start') {
      setStartTime(timeString);
      if (!date) setDate(today); // גיבוי לתאריך נוכחי
    } else {
      setEndTime(timeString);
    }
  };

  const saveShift = async () => {
    if (!auth.currentUser) return;
    
    // וידוא נתוני מינימום בהתאם לסוג הדיווח
    if (!date) {
      alert('חובה להזין תאריך.');
      return;
    }
    if (shiftType === 'work' && !startTime) {
      alert('חובה להזין שעת כניסה למשמרת רגילה.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalEndTime = endTime;
      let isDefaultEndTime = false;
      let calculatedHours = null;

      // טיפול שונה לעבודה רגילה מול חופש/מחלה
      if (shiftType === 'work') {
        // 1. קביעת שעת יציאה דיפולטיבית במידה וחסר
        if (!finalEndTime) {
          const [h, m] = startTime.split(':').map(Number);
          let endH = h + 9; // ברירת מחדל: 9 שעות עבודה
          if (endH > 23) endH = 23; // מניעת גלישה ליום הבא למען הפשטות
          
          finalEndTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          isDefaultEndTime = true;
        }

        // 2. חישוב השעות מול שרת הפייתון
        const response = await fetch('https://salary-app-4npn.onrender.com/api/calculate-shift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_time: startTime,
            end_time: finalEndTime,
            is_weekend_or_holiday: false
          }),
        });

        if (!response.ok) throw new Error('שגיאה בחישוב השעות מול השרת');
        calculatedHours = await response.json();
      } else {
        // אם זה יום חופש או מחלה, אין שעות כניסה ויציאה
        // נגדיר ידנית ערך דיפולטיבי של 8.5 שעות בסיס (בהמשך נשאב מההגדרות)
        calculatedHours = {
          total_hours: 8.5,
          regular_hours: 8.5,
          overtime_125: 0,
          overtime_150: 0
        };
      }

      // 3. שמירה למסד הנתונים Firestore
      await addDoc(collection(db, `users/${auth.currentUser.uid}/shifts`), {
        date,
        type: shiftType, // שמירת סוג הדיווח כדי שנדע לספור ימים אחר כך
        startTime: shiftType === 'work' ? startTime : null, // נשמור זמן רק אם זו עבודה
        endTime: shiftType === 'work' ? finalEndTime : null,
        calculated: calculatedHours
      });

      setIsSubmitting(false);

      // 4. חיווי למשתמש
      if (shiftType === 'work' && isDefaultEndTime) {
        alert(`המשמרת נשמרה!\n\nכיוון שלא הזנת שעת יציאה, המערכת הגדירה יציאה דיפולטיבית (${finalEndTime}). תוכל לעדכן את השעה המדויקת מאוחר יותר במסך עריכת המשמרות.`);
      } else {
        alert('הדיווח נשמר בהצלחה!');
      }

      // איפוס שדות
      setStartTime('');
      setEndTime('');
      setShiftType('work'); // חזרה למצב ברירת מחדל של עבודה

    } catch (error) {
      console.error(error);
      alert('אירעה שגיאה בשמירת הדיווח. אנא נסה שוב.');
      setIsSubmitting(false);
    }
  };

  // עיצובים
  const inputStyle = { padding: '8px', margin: '5px 0', width: '100%', boxSizing: 'border-box' as const, borderRadius: '4px', border: '1px solid #ccc' };
  const btnStyle = { padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', marginTop: '15px', fontWeight: 'bold' };
  const nowBtnStyle = { padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px', fontSize: '14px', fontWeight: 'bold', minWidth: '70px' };
  const selectStyle = { ...inputStyle, backgroundColor: '#fff', fontSize: '15px' };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '350px', margin: '0 auto', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>דיווח נוכחות</h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>סוג דיווח:</label>
        <select value={shiftType} onChange={(e) => setShiftType(e.target.value as any)} style={selectStyle}>
          <option value="work">💼 עבודה רגילה (משמרת)</option>
          <option value="vacation">🌴 יום חופש</option>
          <option value="sick">🤒 יום מחלה</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>תאריך:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </div>

      {/* שדות השעות יוצגו אך ורק אם מדובר ביום עבודה! */}
      {shiftType === 'work' && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>שעת כניסה:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => setTimeNow('start')} style={nowBtnStyle}>עכשיו</button>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>שעת יציאה (אופציונלי):</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => setTimeNow('end')} style={nowBtnStyle}>עכשיו</button>
            </div>
          </div>
        </>
      )}

      <button onClick={saveShift} disabled={isSubmitting} style={btnStyle}>
        {isSubmitting ? 'שומר נתונים...' : 'שמור דיווח'}
      </button>
    </div>
  );
};

export default ShiftEntry;
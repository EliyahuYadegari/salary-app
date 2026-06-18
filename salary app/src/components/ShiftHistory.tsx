import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  calculated?: {
    total: number;
    regular: number;
    ot_125: number;
    ot_150: number;
  };
}

const ShiftHistory: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // מצבי עריכה זמניים לשדות שנבחרו
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // שליפת כל המשמרות מה-Firestore
  const loadShifts = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, `users/${auth.currentUser.uid}/shifts`));
      const querySnapshot = await getDocs(q);
      const fetchedShifts: Shift[] = [];
      
      querySnapshot.forEach((docSnap) => {
        fetchedShifts.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Shift);
      });

      // מיון המשמרות לפי תאריך מהחדש לישן
      fetchedShifts.sort((a, b) => b.date.localeCompare(a.date));
      setShifts(fetchedShifts);
    } catch (error) {
      console.error("Error loading shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  // מחיקת משמרת מה-Firestore
  const handleDelete = async (shiftId: string) => {
    if (!auth.currentUser) return;
    if (!window.confirm("האם אתה בטוח שברצונך למחוק משמרת זו?")) return;

    try {
      const shiftDocRef = doc(db, `users/${auth.currentUser.uid}/shifts`, shiftId);
      await deleteDoc(shiftDocRef);
      alert("המשמרת נמחקה בהצלחה!");
      loadShifts(); // טעינה מחדש של הרשימה המעודכנת
    } catch (error) {
      console.error("Error deleting shift:", error);
      alert("אירעה שגיאה במחיקת המשמרת.");
    }
  };

  // תחילת מצב עריכה - טעינת הנתונים הנוכחיים לתוך תיבות הקלט
  const startEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setEditDate(shift.date);
    setEditStart(shift.startTime);
    setEditEnd(shift.endTime);
  };

  // שמירת משמרת ערוכה וחישוב מחדש של השעות מול ה-Backend של הפייתון
  const handleSaveEdit = async (shiftId: string) => {
    if (!auth.currentUser) return;

    try {
      // 1. קריאה לשרת הפייתון כדי לחשב מחדש את פירוט השעות היומי המעודכן
      const response = await fetch('https://salary-app-4npn.onrender.com/api/calculate-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: editStart,
          end_time: editEnd,
          is_weekend_or_holiday: false
        }),
      });
      const hoursData = await response.json();

      // 2. עדכון הנתונים והחישוב החדש במסמך ב-Firestore
      const shiftDocRef = doc(db, `users/${auth.currentUser.uid}/shifts`, shiftId);
      await updateDoc(shiftDocRef, {
        date: editDate,
        startTime: editStart,
        endTime: editEnd,
        calculated: hoursData
      });

      alert("המשמרת עודכנה וחושבה מחדש בהצלחה!");
      setEditingId(null);
      loadShifts(); // רענון הרשימה במסך
    } catch (error) {
      console.error("Error updating shift:", error);
      alert("אירעה שגיאה בעדכון המשמרת. ודא ששרת הפייתון פועל.");
    }
  };

  const tableHeaderStyle = {
    padding: '10px',
    backgroundColor: '#edf2f7',
    borderBottom: '2px solid #cbd5e0',
    textAlign: 'right' as const,
    fontSize: '14px',
    color: '#4a5568'
  };

  const tableCellStyle = {
    padding: '10px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '14px'
  };

  const actionButtonStyle = {
    padding: '4px 8px',
    marginLeft: '5px',
    fontSize: '12px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold' as const
  };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
      <h3 style={{ color: '#2d3748', margin: '0 0 20px 0', textAlign: 'center' }}>📝 עריכת והיסטוריית שעות עבודה</h3>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#4a5568', fontWeight: 'bold' }}>טוען משמרות...</div>
      ) : shifts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#718096' }}>לא נמצאו משמרות מדווחות במערכת.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '350px' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>תאריך</th>
                <th style={tableHeaderStyle}>שעות</th>
                <th style={tableHeaderStyle}>סה"כ</th>
                <th style={tableHeaderStyle}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => {
                const isEditing = editingId === shift.id;
                return (
                  <tr key={shift.id}>
                    {/* עמודת תאריך */}
                    <td style={tableCellStyle}>
                      {isEditing ? (
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ width: '105px', padding: '4px' }} />
                      ) : (
                        shift.date
                      )}
                    </td>

                    {/* עמודת זמני כניסה ויציאה */}
                    <td style={tableCellStyle}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} style={{ padding: '2px' }} />
                          <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} style={{ padding: '2px' }} />
                        </div>
                      ) : (
                        `${shift.startTime} - ${shift.endTime}`
                      )}
                    </td>

                    {/* עמודת סך שעות מחושב */}
                    <td style={tableCellStyle}>
                      <span style={{ fontWeight: 'bold' }}>{shift.calculated?.total?.toFixed(2) || 0}</span>
                    </td>

                    {/* עמודת פעולות (עריכה / שמירה / מחיקה) */}
                    <td style={tableCellStyle}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleSaveEdit(shift.id)} style={{ ...actionButtonStyle, backgroundColor: '#38a169', color: 'white' }}>שמור</button>
                          <button onClick={() => setEditingId(null)} style={{ ...actionButtonStyle, backgroundColor: '#718096', color: 'white' }}>ביטול</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex' }}>
                          <button onClick={() => startEdit(shift)} style={{ ...actionButtonStyle, backgroundColor: '#3182ce', color: 'white' }}>✏️</button>
                          <button onClick={() => handleDelete(shift.id)} style={{ ...actionButtonStyle, backgroundColor: '#e53e3e', color: 'white' }}>🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShiftHistory;
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  calculated?: { total: number };
}

const ShiftHistory: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  
  // הגדרת חודש נוכחי כברירת מחדל (פורמט YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const loadShifts = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, `users/${auth.currentUser.uid}/shifts`));
      const querySnapshot = await getDocs(q);
      const fetchedShifts: Shift[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedShifts.push({ id: docSnap.id, ...docSnap.data() } as Shift);
      });
      setShifts(fetchedShifts);
    } catch (error) {
      console.error("Error loading shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  // סינון אוטומטי בכל פעם שהחודש הנבחר משתנה
  useEffect(() => {
    const filtered = shifts.filter(s => s.date.startsWith(selectedMonth));
    filtered.sort((a, b) => b.date.localeCompare(a.date));
    setFilteredShifts(filtered);
  }, [selectedMonth, shifts]);

  useEffect(() => {
    loadShifts();
  }, []);

  const handleDelete = async (shiftId: string) => {
    // הוסף את הבדיקה הזו כאן
    if (!auth.currentUser) return; 
    
    if (!window.confirm("האם אתה בטוח שברצונך למחוק משמרת זו?")) return;

    try {
      const shiftDocRef = doc(db, `users/${auth.currentUser.uid}/shifts`, shiftId);
      await deleteDoc(shiftDocRef);
      alert("המשמרת נמחקה בהצלחה!");
      loadShifts();
    } catch (error) {
      console.error("Error deleting shift:", error);
    }
  };

  const startEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setEditDate(shift.date);
    setEditStart(shift.startTime);
    setEditEnd(shift.endTime);
  };

  const handleSaveEdit = async (shiftId: string) => {
    // הוסף את הבדיקה הזו כאן
    if (!auth.currentUser) return;

    try {
      const response = await fetch('https://salary-app-4npn.onrender.com/api/calculate-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_time: editStart, end_time: editEnd, is_weekend_or_holiday: false }),
      });
      const hoursData = await response.json();
      
      // כעת TypeScript יודע ש-auth.currentUser בטוח לשימוש כי בדקנו אותו למעלה
      const shiftDocRef = doc(db, `users/${auth.currentUser.uid}/shifts`, shiftId);
      await updateDoc(shiftDocRef, {
        date: editDate, startTime: editStart, endTime: editEnd, calculated: hoursData
      });

      setEditingId(null);
      loadShifts();
    } catch (error) {
      console.error("Error updating shift:", error);
    }
    };
  return (
    <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      <h3 style={{ textAlign: 'center' }}>📝 ניהול משמרות</h3>
      
      {/* בורר חודשים */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label>בחר חודש: </label>
        <input 
          type="month" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)} 
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
        />
      </div>

      {loading ? <p>טוען...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>תאריך</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>שעות</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredShifts.map((shift) => (
              <tr key={shift.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {editingId === shift.id ? <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} /> : shift.date}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {editingId === shift.id ? (
                    <>
                      <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                      <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                    </>
                  ) : `${shift.startTime} - ${shift.endTime}`}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {editingId === shift.id ? (
                    <button onClick={() => handleSaveEdit(shift.id)}>שמור</button>
                  ) : (
                    <>
                      <button onClick={() => startEdit(shift)}>✏️</button>
                      <button onClick={() => handleDelete(shift.id)}>🗑️</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ShiftHistory;
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    globalBaseHours: 182,
    globalBaseSalary: 11000,
    globalOtHours: 8,
    globalOtSalary: 500,
    extraOtHourlyRate: 80,
    creditPoints: 2.25,
    pensionRate: 6,
    travelExpenses: 300
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().settings) {
        setSettings(prev => ({ ...prev, ...docSnap.data().settings }));
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), { settings }, { merge: true });
    alert('הגדרות החוזה האישי נשמרו בהצלחה!');
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #cbd5e0',
    boxSizing: 'border-box' as const
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>⚙️ הגדרות חוזה שכר גלובלי</h3>
      
      <label>שעות בסיס גלובליות בחוזה (למשל 182):</label>
      <input type="number" value={settings.globalBaseHours} onChange={(e) => setSettings({...settings, globalBaseHours: Number(e.target.value)})} style={inputStyle} />
      
      <label>שכר בסיס קבוע עבור שעות הבסיס (₪):</label>
      <input type="number" value={settings.globalBaseSalary} onChange={(e) => setSettings({...settings, globalBaseSalary: Number(e.target.value)})} style={inputStyle} />
      
      <label>מכסת שעות נוספות גלובליות בחוזה (למשל 8):</label>
      <input type="number" value={settings.globalOtHours} onChange={(e) => setSettings({...settings, globalOtHours: Number(e.target.value)})} style={inputStyle} />
      
      <label>תשלום קבוע עבור השעות הנוספות הגלובליות (₪):</label>
      <input type="number" value={settings.globalOtSalary} onChange={(e) => setSettings({...settings, globalOtSalary: Number(e.target.value)})} style={inputStyle} />
      
      <label>תעריף לכל שעה חריגה מעבר לחוזה (₪):</label>
      <input type="number" value={settings.extraOtHourlyRate} onChange={(e) => setSettings({...settings, extraOtHourlyRate: Number(e.target.value)})} style={inputStyle} />
      
      <hr style={{ border: '1px solid #edf2f7', margin: '15px 0' }} />
      
      <label>נקודות זיכוי ממס הכנסה:</label>
      <input type="number" step="0.25" value={settings.creditPoints} onChange={(e) => setSettings({...settings, creditPoints: Number(e.target.value)})} style={inputStyle} />
      
      <label>אחוז הפרשת פנסיה עובד (%):</label>
      <input type="number" value={settings.pensionRate} onChange={(e) => setSettings({...settings, pensionRate: Number(e.target.value)})} style={inputStyle} />
      
      <label>החזר נסיעות חודשי קבוע (₪):</label>
      <input type="number" value={settings.travelExpenses} onChange={(e) => setSettings({...settings, travelExpenses: Number(e.target.value)})} style={inputStyle} />
      
      <button onClick={saveSettings} style={{ width: '100%', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
        שמור הגדרות חוזה
      </button>
    </div>
  );
};

export default Settings;
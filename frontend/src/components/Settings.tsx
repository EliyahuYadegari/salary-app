import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    hourlyRate: 50,
    creditPoints: 2.25,
    pensionRate: 6,
    travelExpenses: 300
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data().settings || settings);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), { settings }, { merge: true });
    alert('ההגדרות נשמרו!');
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>הגדרות שכר אישיות</h3>
      <label>שכר שעתי: <input type="number" value={settings.hourlyRate} onChange={(e) => setSettings({...settings, hourlyRate: Number(e.target.value)})} /></label><br/>
      <label>נקודות זיכוי: <input type="number" step="0.25" value={settings.creditPoints} onChange={(e) => setSettings({...settings, creditPoints: Number(e.target.value)})} /></label><br/>
      <label>אחוז פנסיה: <input type="number" value={settings.pensionRate} onChange={(e) => setSettings({...settings, pensionRate: Number(e.target.value)})} /></label><br/>
      <button onClick={saveSettings} style={{ marginTop: '10px' }}>שמור הגדרות</button>
    </div>
  );
};

export default Settings;
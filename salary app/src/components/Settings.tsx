import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// הגדרת המבנה המפורש של ההגדרות עבור TypeScript
interface SettingsState {
  globalBaseHours: string | number;
  globalBaseSalary: string | number;
  globalOtHours: string | number;
  globalOtSalary: string | number;
  extraOtHourlyRate: string | number;
  creditPoints: number;
  pensionRate: number;
  travelExpenses: number;
  studyFundRate: number;
  
  // -- שדות חדשים: משאבי אנוש, חופש ומחלה --
  employmentStartDate: string;
  yearlyVacationDays: number | string;
  sickPayPolicy: string;
  standardDayHours: number | string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    globalBaseHours: '',
    globalBaseSalary: '',
    globalOtHours: '',
    globalOtSalary: '',
    extraOtHourlyRate: '',
    creditPoints: 2.25,
    pensionRate: 6,
    travelExpenses: 300,
    studyFundRate: 0,
    
    // -- ערכי ברירת מחדל לשדות החדשים --
    employmentStartDate: '',
    yearlyVacationDays: 12, // ברירת מחדל חוקית בסיסית
    sickPayPolicy: 'law', // 'law' = לפי חוק, 'full' = מלא מהיום הראשון
    standardDayHours: 8.5 // אורך יום עבודה תקני
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
    <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>⚙️ הגדרות חוזה שכר גלובלי</h3>
      
      <label>שעות בסיס גלובליות בחוזה (למשל 182):</label>
      <input type="number" placeholder="טרם הוגדר" value={settings.globalBaseHours} onChange={(e) => setSettings({...settings, globalBaseHours: e.target.value === '' ? '' : Number(e.target.value)})} style={inputStyle} />
      
      <label>שכר בסיס קבוע עבור שעות הבסיס (₪):</label>
      <input type="number" placeholder="טרם הוגדר" value={settings.globalBaseSalary} onChange={(e) => setSettings({...settings, globalBaseSalary: e.target.value === '' ? '' : Number(e.target.value)})} style={inputStyle} />
      
      <label>מכסת שעות נוספות גלובליות בחוזה (למשל 8):</label>
      <input type="number" placeholder="טרם הוגדר" value={settings.globalOtHours} onChange={(e) => setSettings({...settings, globalOtHours: e.target.value === '' ? '' : Number(e.target.value)})} style={inputStyle} />
      
      <label>תשלום קבוע עבור השעות הנוספות הגלובליות (₪):</label>
      <input type="number" placeholder="טרם הוגדר" value={settings.globalOtSalary} onChange={(e) => setSettings({...settings, globalOtSalary: e.target.value === '' ? '' : Number(e.target.value)})} style={inputStyle} />
      
      <label>תעריף לכל שעה חריגה מעבר לחוזה (₪):</label>
      <input type="number" placeholder="טרם הוגדר" value={settings.extraOtHourlyRate} onChange={(e) => setSettings({...settings, extraOtHourlyRate: e.target.value === '' ? '' : Number(e.target.value)})} style={inputStyle} />
      
      <hr style={{ border: '1px solid #edf2f7', margin: '20px 0' }} />
      
      <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>⛱️ משאבי אנוש (חופש ומחלה)</h3>

      <label>תאריך תחילת העסקה (לחישוב ותק וצבירה):</label>
      <input type="date" value={settings.employmentStartDate} onChange={(e) => setSettings({...settings, employmentStartDate: e.target.value})} style={inputStyle} />

      <label>מכסת ימי חופש שנתית בחוזה:</label>
      <input type="number" value={settings.yearlyVacationDays} onChange={(e) => setSettings({...settings, yearlyVacationDays: e.target.value === '' ? '' : Number(e.target.value)})} style={inputStyle} />

      <label>אורך יום עבודה תקני (בשעות, למשל 8.5):</label>
      <input type="number" step="0.1" value={settings.standardDayHours} onChange={(e) => setSettings({...settings, standardDayHours: e.target.value === '' ? '' : Number(e.target.value)})} style={inputStyle} />

      <label>מדיניות תשלום ימי מחלה:</label>
      <select value={settings.sickPayPolicy} onChange={(e) => setSettings({...settings, sickPayPolicy: e.target.value})} style={inputStyle}>
        <option value="law">על פי חוק (יום 1: 0%, יום 2-3: 50%, יום 4+: 100%)</option>
        <option value="full">תשלום מלא (100%) מהיום הראשון</option>
      </select>

      <hr style={{ border: '1px solid #edf2f7', margin: '20px 0' }} />
      
      <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>📉 ניכויים והפרשות</h3>

      <label>נקודות זיכוי ממס הכנסה:</label>
      <input type="number" step="0.25" value={settings.creditPoints} onChange={(e) => setSettings({...settings, creditPoints: Number(e.target.value)})} style={inputStyle} />
      
      <label>אחוז הפרשת פנסיה עובד (%):</label>
      <input type="number" value={settings.pensionRate} onChange={(e) => setSettings({...settings, pensionRate: Number(e.target.value)})} style={inputStyle} />

      <label>אחוז הפרשת קרן השתלמות עובד (%):</label>
      <input type="number" step="0.5" value={settings.studyFundRate} onChange={(e) => setSettings({...settings, studyFundRate: Number(e.target.value)})} style={inputStyle} />
      
      <label>החזר נסיעות חודשי קבוע (₪):</label>
      <input type="number" value={settings.travelExpenses} onChange={(e) => setSettings({...settings, travelExpenses: Number(e.target.value)})} style={inputStyle} />
      
      <button onClick={saveSettings} style={{ width: '100%', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
        שמור הגדרות חוזה
      </button>
    </div>
  );
};

export default Settings;
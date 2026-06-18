import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';

const MonthlySummary: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [salaryResult, setSalaryResult] = useState<any>(null);
  const [summaryData, setSummaryData] = useState({
    totalHours: 0,
    contractLimitHours: 0,
    currentMonthName: ''
  });

  const loadMonthlyDataAndCalculate = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const settings = userDocSnap.data()?.settings || {
        globalBaseHours: 0,
        globalBaseSalary: 0,
        globalOtHours: 0,
        globalOtSalary: 0,
        extraOtHourlyRate: 0,
        creditPoints: 2.25,
        pensionRate: 6,
        travelExpenses: 300,
        studyFundRate: 0
      };

      const today = new Date();
      const currentMonthStr = today.toISOString().substring(0, 7); 
      const monthName = today.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

      const q = query(collection(db, `users/${auth.currentUser.uid}/shifts`));
      const querySnapshot = await getDocs(q);

      let monthTotalHours = 0;
      querySnapshot.forEach((shiftDoc) => {
        const shift = shiftDoc.data();
        if (shift.date && shift.date.startsWith(currentMonthStr)) {
          monthTotalHours += shift.calculated?.total || 0;
        }
      });

      const baseHours = Number(settings.globalBaseHours) || 0;
      const otHours = Number(settings.globalOtHours) || 0;
      const totalContractHours = baseHours + otHours;

      setSummaryData({
        totalHours: Number(monthTotalHours.toFixed(2)),
        contractLimitHours: totalContractHours,
        currentMonthName: monthName
      });

      // קריאה לשרת ה-API האמיתי שלך ב-Render
      const response = await fetch('https://salary-app-4npn.onrender.com/api/calculate-monthly-net', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_hours: monthTotalHours,
          global_base_hours: baseHours,
          global_base_salary: Number(settings.globalBaseSalary) || 0,
          global_ot_hours: otHours,
          global_ot_salary: Number(settings.globalOtSalary) || 0,
          extra_ot_hourly_rate: Number(settings.extraOtHourlyRate) || 0,
          credit_points: Number(settings.creditPoints) || 2.25,
          pension_rate: Number(settings.pensionRate) || 6,
          travel_expenses: Number(settings.travelExpenses) || 0,
          study_fund_rate: Number(settings.studyFundRate) || 0
        }),
      });

      const data = await response.json();
      setSalaryResult(data);
    } catch (error) {
      console.error("Error calculating global salary:", error);
      alert("אירעה שגיאה בחישוב תלוש השכר הגלובלי.");
    } finally {
      document.body.style.cursor = 'default';
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthlyDataAndCalculate();
  }, []);

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #edf2f7',
    fontSize: '15px'
  };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
      <h3 style={{ color: '#2d3748', margin: '0 0 5px 0', textAlign: 'center' }}>📄 סימולציית תלוש חוזה גלובלי</h3>
      <p style={{ color: '#718096', fontSize: '14px', textAlign: 'center', margin: '0 0 20px 0' }}>{summaryData.currentMonthName}</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10px', color: '#4a5568', fontWeight: 'bold' }}>מפיק נתוני שכר גלובליים ומריץ חישובי מס...</div>
      ) : salaryResult ? (
        <div>
          <div style={{ backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '14px', color: '#2f855a', fontWeight: 'bold' }}>נטו משוער לתשלום (חודשי)</span>
            <h1 style={{ margin: '5px 0 0 0', color: '#22543d', fontSize: '34px' }}>{salaryResult.net_salary} ₪</h1>
          </div>

          <div style={{ marginBottom: '25px', backgroundColor: '#f7fafc', padding: '15px', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>📊 סיכום שעות מול חוזה</h4>
            <div style={rowStyle}>
              <span>שעות שבוצעו בפועל החודש:</span>
              <span style={{ fontWeight: 'bold' }}>{summaryData.totalHours} שעות</span>
            </div>
            <div style={rowStyle}>
              <span>מכסת שעות החוזה הכוללת:</span>
              <span>{summaryData.contractLimitHours} שעות</span>
            </div>
            <div style={rowStyle}>
              <span>שעות חריגות לתשלום נוסף:</span>
              <span style={{ color: salaryResult.extra_hours > 0 ? '#dd6b20' : '#4a5568', fontWeight: 'bold' }}>
                {salaryResult.extra_hours} שעות
              </span>
            </div>
          </div>

          <div style={{ padding: '0 5px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>💰 פירוט רכיבים וניכויים חוקיים</h4>
            <div style={rowStyle}>
              <span>סך שכר ברוטו (כולל חריגות ונסיעות):</span>
              <span style={{ fontWeight: 'bold', color: '#2b6cb0' }}>{salaryResult.gross_salary} ₪</span>
            </div>
            {salaryResult.extra_hours_pay > 0 && (
              <div style={rowStyle}>
                <span>מתוכם תשלום שעות חריגות:</span>
                <span style={{ color: '#38a169', fontWeight: 'bold' }}>+{salaryResult.extra_hours_pay} ₪</span>
              </div>
            )}
            <div style={rowStyle}>
              <span>מס הכנסה (כולל נק"ז):</span>
              <span style={{ color: '#e53e3e', direction: 'ltr' }}>-{salaryResult.deductions.income_tax} ₪</span>
            </div>
            <div style={rowStyle}>
              <span>דמי ביטוח לאומי:</span>
              <span style={{ color: '#e53e3e', direction: 'ltr' }}>-{salaryResult.deductions.national_insurance} ₪</span>
            </div>
            <div style={rowStyle}>
              <span>דמי ביטוח בריאות:</span>
              <span style={{ color: '#e53e3e', direction: 'ltr' }}>-{salaryResult.deductions.health_tax} ₪</span>
            </div>
            <div style={rowStyle}>
              <span>הפרשת פנסיה עובד (משכר בסיס):</span>
              <span style={{ color: '#e53e3e', direction: 'ltr' }}>-{salaryResult.deductions.pension} ₪</span>
            </div>
            
            {/* הצגת שורת קרן ההשתלמות בצורה קבועה ובטוחה (ללא תנאי סינון חוסם) */}
            <div style={rowStyle}>
              <span>הפרשת קרן השתלמות עובד:</span>
              <span style={{ color: '#e53e3e', direction: 'ltr' }}>
                -{salaryResult.deductions?.study_fund !== undefined ? salaryResult.deductions.study_fund : 0} ₪
              </span>
            </div>
          </div>

          <button 
            onClick={loadMonthlyDataAndCalculate}
            style={{ width: '100%', marginTop: '25px', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            🔄 רענן נתונים וחשב מחדש
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#718096' }}>לא נמצאו נתונים להפקת סימולציה.</div>
      )}
    </div>
  );
};

export default MonthlySummary;
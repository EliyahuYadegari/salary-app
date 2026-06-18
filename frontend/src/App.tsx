import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import ShiftEntry from './components/ShiftEntry';
import Settings from './components/Settings';
import MonthlySummary from './components/MonthlySummary';
import HomeStats from './components/HomeStats';
import ShiftHistory from './components/ShiftHistory'; // <-- ייבוא הקומפוננטה החדשה

function App() {
  const [user, setUser] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  
  // ניהול המסכים באפליקציה: 'home', 'shift_add', 'shift_edit', 'summary', 'settings'
  const [activeView, setActiveView] = useState<'home' | 'shift_add' | 'shift_edit' | 'summary' | 'settings'>('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>טוען אפליקציה...</div>;

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '14px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };

  return (
    <div className="App" style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      {user ? (
        <div>
          {/* שורת כותרת עליונה קבועה */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#2d3748' }}>היי, {user.displayName?.split(' ')[0]} 👋</h2>
            <button 
              onClick={() => auth.signOut()} 
              style={{ background: 'none', border: 'none', color: '#e53e3e', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}
            >
              התנתק
            </button>
          </div>

          {/* 1. תצוגת מסך הבית הראשי */}
          {activeView === 'home' && (
            <div>
              <HomeStats />
              <hr style={{ border: '1px solid #edf2f7', margin: '25px 0' }} />
              
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => setActiveView('shift_add')} 
                  style={{ ...buttonStyle, backgroundColor: '#3182ce' }}
                >
                  ➕ דיווח שעות עבודה
                </button>

                <button 
                  onClick={() => setActiveView('shift_edit')} 
                  style={{ ...buttonStyle, backgroundColor: '#dd6b20' }} // צבע כתום מובחן לעריכה
                >
                  ✏️ עריכת שעות עבודה
                </button>

                <button 
                  onClick={() => setActiveView('summary')} 
                  style={{ ...buttonStyle, backgroundColor: '#38a169' }}
                >
                  📊 חישוב תלוש חודשי מוערך
                </button>
                
                <button 
                  onClick={() => setActiveView('settings')} 
                  style={{ ...buttonStyle, backgroundColor: '#4a5568' }}
                >
                  ⚙️ עדכון הגדרות אישיות
                </button>
              </div>
            </div>
          )}

          {/* כפתור חזור משותף למסכים הפנימיים */}
          {activeView !== 'home' && (
            <button 
              onClick={() => setActiveView('home')} 
              style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer', backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            >
              👉 חזור למסך הראשי
            </button>
          )}

          {/* 2. מסך דיווח שעות עבודה */}
          {activeView === 'shift_add' && <ShiftEntry />}

          {/* 3. מסך עריכת ומחיקת שעות עבודה (החדש!) */}
          {activeView === 'shift_edit' && <ShiftHistory />}

          {/* 4. מסך סימולציית תלוש חודשי */}
          {activeView === 'summary' && <MonthlySummary />}

          {/* 5. מסך הגדרות חוזה אישי */}
          {activeView === 'settings' && <Settings />}

        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import ShiftEntry from './components/ShiftEntry';
import Settings from './components/Settings';
import MonthlySummary from './components/MonthlySummary';

function App() {
  const [user, setUser] = useState<any>(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>טוען...</div>;

  return (
    <div className="App">
      {user ? (
        <div>
          <h1>לוח בקרה אישי</h1>
          <button onClick={() => auth.signOut()}>התנתק</button>
          <hr />
          <ShiftEntry />
          <Settings />
          <MonthlySummary />
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
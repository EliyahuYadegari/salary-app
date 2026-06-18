import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom'; // וודא שהייבוא הזה קיים

export default function Login() {
  const navigate = useNavigate(); // עכשיו זה יעבוד!

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/'); // ניווט לדף הבית אחרי התחברות
    } catch (error) {
      console.error("שגיאת התחברות:", error);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>התחברות לאפליקציית שכר</h1>
      <button onClick={handleLogin}>התחבר עם Google</button>
    </div>
  );
}
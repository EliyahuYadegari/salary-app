# Salary App - Time Management and Salary Calculator 🇮🇱

An advanced Web Application (PWA) that allows employees to manage shifts, define personal salary contracts (hourly or combined global), and calculate gross and net salary according to the Israeli Hours of Work and Rest Law and the Israeli tax system.

---

## ✨ System Features

* **Smart Authentication (Multi-user):** Secure and personal login using a Google account.


* **Complex Contract Management:** Support for hourly wage or a combined global wage (base salary + global overtime + exceptional hourly rate).


* **Lawful Salary Calculation:** Accurate calculation of overtime (125%, 150%), income tax deduction (based on credit points and tax brackets), national insurance, health insurance, pension, and study fund.


* **Shift Management (CRUD):** Add, view, edit, and delete shifts with convenient filtering by month. Includes dynamic shift entry with real-time "Now" buttons and default checkout times.


* **Estimated Payslip:** Generation of a monthly payslip simulation detailing all components, additions, and deductions.


* **Dashboard (HomeStats):** Real-time monthly data summary displaying total hours, remaining potential, and overtime.


* **PWA:** Mobile-optimized design with the ability to install as an app directly on the home screen.


---

## 🛠️ Technologies Used

* **Frontend:** React, TypeScript, Vite.


* **Backend:** Python, FastAPI.


* **Database & Authentication:** Firebase (Firestore, Google Sign-In).


* **Deployment:** Firebase Hosting (Frontend), Render (Backend API).


---

## 🚀 Installation and Local Running Instructions

### Prerequisites

* Node.js installed on the computer.


* Python (version 3.10 and above).


* Active project in Firebase.



### 1. Backend Setup (Python)

1. Navigate to the project root directory.
2. Create and activate a virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate

```

3. Install requirements:
```bash
pip install -r requirements.txt

```

4. Run the backend server:
```bash
python -m uvicorn backend.main:app --reload

```


*The server will run at: `http://127.0.0.1:8000*`.



### 2. Frontend Setup (React)

1. Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install

```


2. **Firebase Configuration:** Create a `src/firebase.ts` file and paste your project's Config settings from the Firebase Console. Ensure you export `db`, `auth`, and `googleProvider`.


3. Start the frontend development server:
```bash
npm run dev

```

* The application will be available at: `http://localhost:5173*`.

---

### Pictures
1. Main page

<img width="859" height="941" alt="צילום מסך 2026-06-22 145830" src="https://github.com/user-attachments/assets/832f59c1-abe8-4935-8d7c-ba96fa3433f6" />

2. Add shift

<img width="922" height="827" alt="צילום מסך 2026-06-22 145840" src="https://github.com/user-attachments/assets/f3ea5708-dec3-4d8f-961d-1f0b505eae83" />

3. Change your personal setting

<img width="886" height="922" alt="צילום מסך 2026-06-22 145918" src="https://github.com/user-attachments/assets/45cfab51-3d4f-4496-a57e-8c4eb8a07a15" />

4. Calculate your monthly salary

<img width="822" height="927" alt="צילום מסך 2026-06-22 150108" src="https://github.com/user-attachments/assets/0541031f-9ce4-4fa2-80b7-c672fb08c779" />

---

Developed by Eliyahu Yadegari

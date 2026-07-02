from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ייבוא מוחלט ומדויק שמתאים לסביבת הריצה ב-Render משורש הפרויקט
from backend.calculator import calculate_shift_hours, calculate_monthly_salary

app = FastAPI(title="Salary App API")

# הגדרות CORS מלאות המאשרות גישה מהדפדפן ומאתר ה-Firebase שלך
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://salary-app-d0a8d.web.app",  # כתובת הפרודקשן של ה-Frontend ב-Firebase
        "http://localhost:5173",             # כתובת הפיתוח המקומית במחשב (Vite)
        "*"                                  # מאפשר הכל כגיבוי למניעת חסימות דפדפן
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# מודל הנתונים הצפויים להגיע מה-Frontend באפליקציה
class SalaryCalculationRequest(BaseModel):
    total_hours: float
    regular_hours: Optional[float] = 0.0
    ot_125_hours: Optional[float] = 0.0
    ot_150_hours: Optional[float] = 0.0
    hourly_rate: float
    credit_points: float
    pension_rate: float
    travel_expenses: float
    study_fund_rate: Optional[float] = 0.0
    is_global_model: Optional[bool] = False
    global_base_hours: Optional[float] = 182.0
    global_base_salary: Optional[float] = 0.0
    global_ot_hours: Optional[float] = 0.0
    global_ot_salary: Optional[float] = 0.0
    extra_ot_hourly_rate: Optional[float] = 0.0

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Salary App API is running smoothly!"}

@app.post("/api/calculate-monthly-net")
def api_calculate_monthly_net(data: SalaryCalculationRequest):
    try:
        # אריזת כל נתוני השעות לתוך מילון מסודר כפי שפונקציית החישוב ב-calculator.py מצפה לקבל
        hours_dict = {
            "total": data.total_hours,
            "regular": data.regular_hours if data.regular_hours else data.total_hours,
            "ot_125": data.ot_125_hours if data.ot_125_hours else 0.0,
            "ot_150": data.ot_150_hours if data.ot_150_hours else 0.0
        }

        # הרצת פונקציית החישוב עם הפרמטרים המעודכנים
        result = calculate_monthly_salary(
            hours_data=hours_dict,
            hourly_rate=data.hourly_rate,
            credit_points=data.credit_points,
            pension_rate=data.pension_rate,
            travel_expenses=data.travel_expenses,
            study_fund_rate=data.study_fund_rate,
            is_global_model=data.is_global_model,
            global_base_hours=data.global_base_hours,
            global_base_salary=data.global_base_salary,
            global_ot_hours=data.global_ot_hours,
            global_ot_salary=data.global_ot_salary,
            extra_ot_hourly_rate=data.extra_ot_hourly_rate
        )
        return result
        
    except Exception as e:
        # במקרה של תקלה כלשהי בתוך calculator.py, השגיאה תודפס ללוג במקום קריסה אנונימית
        raise HTTPException(status_code=500, detail=f"Internal calculation error: {str(e)}")
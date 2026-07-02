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

# === מודל הנתונים לחישוב משמרת בודדת ===
class ShiftCalculationRequest(BaseModel):
    start_time: str
    end_time: str
    is_weekend_or_holiday: Optional[bool] = False

# === מודל הנתונים לחישוב השכר החודשי ===
class SalaryCalculationRequest(BaseModel):
    total_hours: Optional[float] = 0.0
    regular_hours: Optional[float] = 0.0
    ot_125_hours: Optional[float] = 0.0
    ot_150_hours: Optional[float] = 0.0
    hourly_rate: Optional[float] = 0.0
    credit_points: Optional[float] = 2.25
    pension_rate: Optional[float] = 6.0
    travel_expenses: Optional[float] = 0.0
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

# === נתיב חדש: חישוב שעות של משמרת בודדת ===
@app.post("/api/calculate-shift")
def api_calculate_shift(data: ShiftCalculationRequest):
    try:
        # קריאה לפונקציית חישוב המשמרת מתוך calculator.py
        result = calculate_shift_hours(
            start_time_str=data.start_time,
            end_time_str=data.end_time,
            is_weekend_or_holiday=data.is_weekend_or_holiday or False
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Shift calculation error: {str(e)}")

# === נתיב: חישוב השכר החודשי המשולב (שעתי / יחסי גלובלי) ===
@app.post("/api/calculate-monthly-net")
def api_calculate_monthly_net(data: SalaryCalculationRequest):
    try:
        # אריזת כל נתוני השעות לתוך מילון מסודר כפי שפונקציית החישוב מצפה לקבל
        hours_dict = {
            "total": data.total_hours or 0.0,
            "regular": data.regular_hours or data.total_hours or 0.0,
            "ot_125": data.ot_125_hours or 0.0,
            "ot_150": data.ot_150_hours or 0.0
        }

        # הרצת פונקציית החישוב החודשית עם ערכי ברירת מחדל למניעת ערכי Null
        result = calculate_monthly_salary(
            hours_data=hours_dict,
            hourly_rate=data.hourly_rate or 0.0,
            credit_points=data.credit_points or 2.25,
            pension_rate=data.pension_rate or 6.0,
            travel_expenses=data.travel_expenses or 0.0,
            study_fund_rate=data.study_fund_rate or 0.0,
            is_global_model=data.is_global_model or False,
            global_base_hours=data.global_base_hours or 182.0,
            global_base_salary=data.global_base_salary or 0.0,
            global_ot_hours=data.global_ot_hours or 0.0,
            global_ot_salary=data.global_ot_salary or 0.0,
            extra_ot_hourly_rate=data.extra_ot_hourly_rate or 0.0
        )
        return result
        
    except Exception as e:
        # הדפסת השגיאה המלאה ללוג של Render למניעת קריסה אנונימית
        raise HTTPException(status_code=500, detail=f"Internal calculation error: {str(e)}")
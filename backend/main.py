from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
from backend.calculator import calculate_shift_hours, calculate_monthly_salary

app = FastAPI(title="Salary App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# מודלים לקבלת נתונים מהלקוח
class ShiftRequest(BaseModel):
    start_time: str
    end_time: str
    is_weekend_or_holiday: bool

class MonthlySalaryRequest(BaseModel):
    hours_data: Dict[str, float]
    hourly_rate: float
    credit_points: float
    pension_rate: float
    travel_expenses: float
    is_global_model: bool = False
    global_base_hours: float = 182.0
    global_base_salary: float = 0.0

@app.post("/api/calculate-shift")
def api_calculate_shift(shift: ShiftRequest):
    return calculate_shift_hours(shift.start_time, shift.end_time, shift.is_weekend_or_holiday)

@app.post("/api/calculate-monthly-net")
def api_calculate_monthly_net(data: MonthlySalaryRequest):
    return calculate_monthly_salary(
        hours_data=data.hours_data,
        hourly_rate=data.hourly_rate,
        credit_points=data.credit_points,
        pension_rate=data.pension_rate,
        travel_expenses=data.travel_expenses,
        is_global_model=data.is_global_model,
        global_base_hours=data.global_base_hours,
        global_base_salary=data.global_base_salary
    )


@app.post("/api/calculate-monthly-salary")
def api_calculate_monthly(data: MonthlySalaryRequest):
    return calculate_monthly_salary(
        hours_data=data.hours_data,
        hourly_rate=data.hourly_rate,
        credit_points=data.credit_points,
        pension_rate=data.pension_rate,
        travel_expenses=data.travel_expenses,
        is_global_model=data.is_global_model,
        global_base_hours=data.global_base_hours,
        global_base_salary=data.global_base_salary
    )
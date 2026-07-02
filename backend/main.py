from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.calculator import calculate_shift_hours, calculate_monthly_salary

app = FastAPI(title="Salary App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ShiftRequest(BaseModel):
    start_time: str
    end_time: str
    is_weekend_or_holiday: bool

class GlobalMonthlySalaryRequest(BaseModel):
    total_hours: float
    global_base_hours: float
    global_base_salary: float
    global_ot_hours: float
    global_ot_salary: float
    extra_ot_hourly_rate: float
    credit_points: float
    pension_rate: float
    travel_expenses: float
    study_fund_rate: float

@app.post("/api/calculate-shift")
def api_calculate_shift(shift: ShiftRequest):
    return calculate_shift_hours(shift.start_time, shift.end_time, shift.is_weekend_or_holiday)

@app.post("/api/calculate-monthly-net")
def api_calculate_monthly_net(data: GlobalMonthlySalaryRequest):
    return calculate_monthly_salary(
        total_hours=data.total_hours,
        global_base_hours=data.global_base_hours,
        global_base_salary=data.global_base_salary,
        global_ot_hours=data.global_ot_hours,
        global_ot_salary=data.global_ot_salary,
        extra_ot_hourly_rate=data.extra_ot_hourly_rate,
        credit_points=data.credit_points,
        pension_rate=data.pension_rate,
        travel_expenses=data.travel_expenses,
        study_fund_rate=data.study_fund_rate
    )
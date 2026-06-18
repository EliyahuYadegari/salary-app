from datetime import datetime

CREDIT_POINT_VALUE = 242.0

TAX_BRACKETS = [
    (7010, 0.10),
    (10060, 0.14),
    (16150, 0.20),
    (22440, 0.31),
    (46690, 0.35),
    (60130, 0.47)
]

BTL_LOWER_LIMIT = 7522.0

def calculate_shift_hours(start_time_str: str, end_time_str: str, is_weekend_or_holiday: bool) -> dict:
    fmt = "%H:%M"
    start = datetime.strptime(start_time_str, fmt)
    end = datetime.strptime(end_time_str, fmt)
    diff = end - start
    total_hours = diff.total_seconds() / 3600.0
    if total_hours < 0:
        total_hours += 24.0

    regular_hours = 0.0
    ot_125 = 0.0
    ot_150 = 0.0

    if is_weekend_or_holiday:
        ot_150 = total_hours
    else:
        if total_hours <= 8:
            regular_hours = total_hours
        elif total_hours <= 10:
            regular_hours = 8.0
            ot_125 = total_hours - 8.0
        else:
            regular_hours = 8.0
            ot_125 = 2.0
            ot_150 = total_hours - 10.0

    return {
        "total": total_hours,
        "regular": regular_hours,
        "ot_125": ot_125,
        "ot_150": ot_150
    }

def calculate_income_tax(gross_salary: float, credit_points: float) -> float:
    tax = 0.0
    previous_limit = 0.0
    for limit, rate in TAX_BRACKETS:
        if gross_salary > previous_limit:
            taxable_amount = min(gross_salary, limit) - previous_limit
            tax += taxable_amount * rate
            previous_limit = limit
        else:
            break
    credit_discount = credit_points * CREDIT_POINT_VALUE
    final_tax = tax - credit_discount
    return max(0.0, final_tax)

def calculate_bituach_leumi(gross_salary: float) -> dict:
    btl_lower_amount = min(gross_salary, BTL_LOWER_LIMIT)
    btl_higher_amount = max(0.0, gross_salary - BTL_LOWER_LIMIT)
    health_tax = (btl_lower_amount * 0.031) + (btl_higher_amount * 0.05)
    national_insurance = (btl_lower_amount * 0.004) + (btl_higher_amount * 0.07)
    return {
        "health_tax": health_tax,
        "national_insurance": national_insurance,
        "total": health_tax + national_insurance
    }

def calculate_monthly_salary(
    total_hours: float,
    global_base_hours: float,
    global_base_salary: float,
    global_ot_hours: float,
    global_ot_salary: float,
    extra_ot_hourly_rate: float,
    credit_points: float,
    pension_rate: float,
    travel_expenses: float,
    study_fund_rate: float
) -> dict:
    
    # שכר חוזה קבוע בסיסי
    contract_base_gross = global_base_salary + global_ot_salary
    
    # חישוב מכסת שעות מקסימלית של החוזה
    total_contract_hours = global_base_hours + global_ot_hours
    
    # חישוב שעות נוספות מעבר למכסה
    extra_hours = max(0.0, total_hours - total_contract_hours)
    extra_hours_pay = extra_hours * extra_ot_hourly_rate
    
    work_gross = contract_base_gross + extra_hours_pay
    total_gross = work_gross + travel_expenses
    
    # ניכוי מסים
    tax = calculate_income_tax(total_gross, credit_points)
    btl_data = calculate_bituach_leumi(total_gross)
    
    # הפרשות סוציאליות מעובד (מחושב משכר הבסיס)
    pension_deduction = global_base_salary * (pension_rate / 100.0)
    study_fund_deduction = global_base_salary * (study_fund_rate / 100.0)
    
    total_deductions = tax + btl_data["total"] + pension_deduction + study_fund_deduction
    net_salary = total_gross - total_deductions
    
    return {
        "gross_salary": round(total_gross, 2),
        "net_salary": round(net_salary, 2),
        "extra_hours": round(extra_hours, 2),
        "extra_hours_pay": round(extra_hours_pay, 2),
        "deductions": {
            "income_tax": round(tax, 2),
            "national_insurance": round(btl_data["national_insurance"], 2),
            "health_tax": round(btl_data["health_tax"], 2),
            "pension": round(pension_deduction, 2),
            "study_fund": round(study_fund_deduction, 2)
        }
    }
from datetime import datetime

# ערך נקודת זיכוי לשנת 2024
CREDIT_POINT_VALUE = 242.0

# מדרגות מס הכנסה לשנת 2024 (הכנסה חודשית, אחוז מס)
TAX_BRACKETS = [
    (7010, 0.10),
    (10060, 0.14),
    (16150, 0.20),
    (22440, 0.31),
    (46690, 0.35),
    (60130, 0.47)
]

# מדרגות ביטוח לאומי וביטוח בריאות 2024
BTL_LOWER_LIMIT = 7522.0

def calculate_shift_hours(start_time_str: str, end_time_str: str, is_weekend_or_holiday: bool) -> dict:
    fmt = "%H:%M"
    try:
        start = datetime.strptime(start_time_str, fmt)
        end = datetime.strptime(end_time_str, fmt)
    except ValueError:
        return {"regular": 0.0, "ot_125": 0.0, "ot_150": 0.0, "total": 0.0}

    diff = (end - start).total_seconds() / 3600.0
    if diff < 0:
        diff += 24.0 # טיפול במשמרת לילה

    regular = 0.0
    ot_125 = 0.0
    ot_150 = 0.0

    if is_weekend_or_holiday:
        ot_150 = diff
    else:
        if diff > 8.0:
            regular = 8.0
            remaining = diff - 8.0
            if remaining > 2.0:
                ot_125 = 2.0
                ot_150 = remaining - 2.0
            else:
                ot_125 = remaining
        else:
            regular = diff

    return {
        "regular": round(regular, 2),
        "ot_125": round(ot_125, 2),
        "ot_150": round(ot_150, 2),
        "total": round(diff, 2)
    }

def calculate_income_tax(gross_salary: float, credit_points: float) -> float:
    tax = 0.0
    previous_bracket = 0.0
    for bracket, rate in TAX_BRACKETS:
        if gross_salary > bracket:
            tax += (bracket - previous_bracket) * rate
            previous_bracket = bracket
        else:
            tax += (gross_salary - previous_bracket) * rate
            break

    credit_value = credit_points * CREDIT_POINT_VALUE
    final_tax = max(0.0, tax - credit_value)
    return round(final_tax, 2)

def calculate_bituach_leumi(gross_salary: float) -> dict:
    btl = 0.0
    health = 0.0

    if gross_salary <= BTL_LOWER_LIMIT:
        btl = gross_salary * 0.004
        health = gross_salary * 0.031
    else:
        btl = (BTL_LOWER_LIMIT * 0.004) + ((gross_salary - BTL_LOWER_LIMIT) * 0.07)
        health = (BTL_LOWER_LIMIT * 0.031) + ((gross_salary - BTL_LOWER_LIMIT) * 0.05)

    return {
        "bituach_leumi": round(btl, 2),
        "health_insurance": round(health, 2),
        "total": round(btl + health, 2)
    }

def calculate_monthly_salary(hours_data: dict, hourly_rate: float, credit_points: float,
                             pension_rate: float, travel_expenses: float, study_fund_rate: float = 0.0,
                             is_global_model: bool = False, global_base_hours: float = 182.0,
                             global_base_salary: float = 0.0, global_ot_hours: float = 0.0,
                             global_ot_salary: float = 0.0, extra_ot_hourly_rate: float = 0.0) -> dict:

    total_hours = hours_data.get("total", 0.0)
    gross_salary = 0.0
    base_gross_for_deductions = 0.0

    if global_base_salary > 0:
        # --- מודל שכר גלובלי משולב - חישוב יחסי ---
        if global_base_hours > 0:
            if total_hours <= global_base_hours:
                # עבד פחות או בדיוק את שעות הבסיס - מקבל שכר יחסי בלבד
                gross_salary = (total_hours / global_base_hours) * global_base_salary
                base_gross_for_deductions = gross_salary
            else:
                # עבר את שעות הבסיס (מקבל בסיס מלא) ומתחיל לצבור שעות נוספות
                gross_salary = global_base_salary
                base_gross_for_deductions = global_base_salary
                
                ot_worked = total_hours - global_base_hours
                if global_ot_hours > 0:
                    if ot_worked <= global_ot_hours:
                        # השלים רק חלק מהשעות הנוספות הגלובליות - מקבל באופן יחסי
                        gross_salary += (ot_worked / global_ot_hours) * global_ot_salary
                    else:
                        # עבר את מכסת הנוספות הגלובליות - מקבל הכל + שעות חריגות
                        gross_salary += global_ot_salary
                        extra_hours = ot_worked - global_ot_hours
                        gross_salary += extra_hours * extra_ot_hourly_rate

    else:
        # --- מודל שכר שעתי רגיל ---
        regular = hours_data.get("regular", total_hours)
        ot_125 = hours_data.get("ot_125", 0.0)
        ot_150 = hours_data.get("ot_150", 0.0)

        gross_salary = (regular * hourly_rate) + (ot_125 * hourly_rate * 1.25) + (ot_150 * hourly_rate * 1.5)
        base_gross_for_deductions = regular * hourly_rate

    # הוספת דמי נסיעות (מוסיף לברוטו, לא נכלל בהפרשות לפנסיה והשתלמות)
    gross_salary += travel_expenses

    # חישוב הפרשות מעובד מתוך שכר הבסיס היחסי בלבד
    pension_deduction = base_gross_for_deductions * (pension_rate / 100.0)
    study_fund_deduction = base_gross_for_deductions * (study_fund_rate / 100.0)

    # ניכויי חובה
    tax = calculate_income_tax(gross_salary, credit_points)
    btl_data = calculate_bituach_leumi(gross_salary)

    total_deductions = pension_deduction + study_fund_deduction + tax + btl_data["total"]
    net_salary = gross_salary - total_deductions

    return {
        "gross_salary": round(gross_salary, 2),
        "net_salary": round(net_salary, 2),
        "deductions": {
            "income_tax": tax,
            "bituach_leumi": btl_data["bituach_leumi"],
            "health_insurance": btl_data["health_insurance"],
            "pension": round(pension_deduction, 2),
            "study_fund": round(study_fund_deduction, 2)
        }
    }
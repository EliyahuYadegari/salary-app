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

# מדרגות ביטוח לאומי וביטוח בריאות 2024 (עובד שכיר)
# עד 7522 ש"ח: ב"ל 0.4%, בריאות 3.1%
# מעל 7522 ש"ח (עד המקסימום): ב"ל 7%, בריאות 5%
BTL_LOWER_LIMIT = 7522.0

def calculate_shift_hours(start_time_str: str, end_time_str: str, is_weekend_or_holiday: bool) -> dict:
    fmt = "%H:%M"
    start = datetime.strptime(start_time_str, fmt)
    end = datetime.strptime(end_time_str, fmt)
    
    diff = end - start
    total_hours = diff.total_seconds() / 3600.0
    
    # טיפול במשמרת שעוברת את חצות
    if total_hours < 0:
        total_hours += 24.0

    regular_hours = 0.0
    ot_125 = 0.0
    ot_150 = 0.0

    if is_weekend_or_holiday:
        # בשבת/חג, השעות הראשונות הן 150%, ולאחר מכן 175% ו-200% (לצורך הפשטות נתייחס להכל כ-150% בסיס)
        ot_150 = total_hours
    else:
        if total_hours <= 8: # מניח שבוע עבודה של 5 ימים
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
            
    # הפחתת נקודות זיכוי
    credit_discount = credit_points * CREDIT_POINT_VALUE
    final_tax = tax - credit_discount
    
    return max(0.0, final_tax) # מס לא יכול להיות שלילי

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
    hours_data: dict, 
    hourly_rate: float, 
    credit_points: float, 
    pension_rate: float,
    travel_expenses: float,
    is_global_model: bool = False,
    global_base_hours: float = 182.0,
    global_base_salary: float = 0.0) -> dict:
    
    # הוספת הגנה: אם שדה חסר, השתמש ב-0
    reg = hours_data.get("regular", 0)
    ot125 = hours_data.get("ot_125", 0)
    ot150 = hours_data.get("ot_150", 0)
    total = hours_data.get("total", reg + ot125 + ot150)

    gross_salary = 0.0
    
    if is_global_model:
        # ... (שמור את הלוגיקה הקיימת)
        gross_salary = global_base_salary
        if total > global_base_hours:
            extra_hours = total - global_base_hours
            gross_salary += extra_hours * hourly_rate * 1.25
    else:
        # שימוש במשתנים החדשים והבטוחים
        gross_salary = (
            (reg * hourly_rate) +
            (ot125 * hourly_rate * 1.25) +
            (ot150 * hourly_rate * 1.50)
        )
    
    # הוספת נסיעות (פטור מדמי ביטוח לאומי אך חייב במס, תלוי בהגדרות - כאן נפשט ונוסיף לברוטו)
    total_gross = gross_salary + travel_expenses
    
    # ניכויים
    tax = calculate_income_tax(total_gross, credit_points)
    btl_data = calculate_bituach_leumi(total_gross)
    pension_deduction = gross_salary * (pension_rate / 100.0) # פנסיה מחושבת על שכר הבסיס לרוב
    
    total_deductions = tax + btl_data["total"] + pension_deduction
    net_salary = total_gross - total_deductions
    
    return {
        "gross_salary": round(total_gross, 2),
        "net_salary": round(net_salary, 2),
        "deductions": {
            "income_tax": round(tax, 2),
            "national_insurance": round(btl_data["national_insurance"], 2),
            "health_tax": round(btl_data["health_tax"], 2),
            "pension": round(pension_deduction, 2)
        }
    }
import re
import json
import os

md_file_path = "backlog_presentation_v34_tags.md"
json_output_path = "goals.json"

mapping = {
    "Перехід на хмарну версію ТМ Калк": "ТМ Калк. Хмарна версія",
    "Автоматизація процесу пошуку та залучення перевізників": "Автоматизація процесу пошуку та залучення перевізників для виконання клієнтських перевезень",
    "Електронна черга в полях та АгроХабах. Пілот": "Черга в полях та АгроХаби. Пілот",
    "Переадресація авто": "Переадресація авто",
    "ДокПорт. Синхронізація черг": "Док.Порт. Синхронізація черг",
    "ДокПорт. Реєстрація НДІ водія та ТЗ": "Док.Порт. Реєстрація НДІ водія та ТЗ",
    "Планування підходів цистерн": "Планування підходів цистерн на ТГТ Ойл",
    "Інтеграція з CRM": "Інтеграція з CRM (екзекюшн)",
    "Планування відвантажень з елеваторів": "Планування відвантажень з елеваторів в розрізі поклажодавців",
    "Формування заявки на піддони": "Формування заявки на піддони",
    "Облік компенсацій перевізникам": "Облік компенсацій перевізникам за простої та переадресацію",
    "Дислокація судів": "Дислокація судів, сталійний час та імпорт стейтментів",
    "Управління оборотністю транспортних засобів": "Управління оборотністю ТЗ",
    "Оформлення ЕПД": "Оформлення ЕПД зі сторонніх складів в NAV",
    "Переадресація вагонів": "Переадресація вагонів",
    "Квота закупки в розрізі відправників": "Квота закупки в розрізі відправників",
    "Виконання імпортних операцій": "Виконання імпортних операцій",
    "Планування поставки та переробки сировини": "Планування поставки та переробки сировини на заводах",
    "Валютна складова НТЗ": "Валютна складова НТЗ",
    "НТЗ. Розрахунок станційних зборів": "НТЗ. Розрахунок станційних зборів",
    "НТЗ. Фасовка": "НТЗ. Фасовка",
    "Моделювання НТЗ": "Моделювання НТЗ",
    "Коригування залишків на складах": "Коригування залишків на складах",
    "Інтеграція з CRM — Логістика (частина 2)": "Інтеграція з CRM (логістика)",
    "Комплектація судна": "Комплектація судна",
    "Адміністрування ВГО договорів": "Адміністрування ВГО договорів",
    "Оформлення відвантаження ГП клієнтам": "Оформлення відвантаження ГП клієнтам (FCA) та давальцям (толінг)",
    "Дислокація контейнерів": "Дислокація контейнерів",
    "Створення довідок експортера по запиту від експедитора": "Формування довідок експортерів",
    "Автоматичний дорозподіл витрат": "Дорозподіл витрат",
    "Підтвердження операцій приймання": "Підтвердження операцій приймання",
    "Планування відвантаження ГП в розрізі квот давальців": "Планування відвантаження ГП в розрізі квот давальців",
    "Електронна черга для відвантаження фасовки": "Електронна черга для відвантаження фасовки",
    "АІ асистент верифікації документів": "АІ асистент верифікації документів"
}

with open(md_file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Split by goals
segments = content.split("## 🔹 Ціль:")
header_segment = segments[0]
goal_segments = segments[1:]

goals = []

for idx, seg in enumerate(goal_segments):
    lines = seg.splitlines()
    first_line = lines[0].strip()
    
    # Get clean title
    clean_title = mapping.get(first_line, first_line)
    
    # Locate tags line
    tags = {}
    tags_line = ""
    for line in lines:
        if line.strip().startswith("**Теги:**"):
            tags_line = line.strip()
            # Extract tags using regex
            # format: **Теги:** Замовник: Пижова | Бізнес-напрям: ТРЕЙДИНГ | Цінність: 4 | Складність: 3 | Статус: План | Система: NAV
            parts = tags_line.replace("**Теги:**", "").split("|")
            for part in parts:
                if ":" in part:
                    k, v = part.split(":", 1)
                    tags[k.strip()] = v.strip()
            break
            
    # Locate System and Group line
    # Format: **Система:** NAV | **Група:** Управління НТЗ
    system_group = {}
    for line in lines:
        if line.strip().startswith("**Система:**"):
            parts = line.replace("**Система:**", "").split("|")
            for part in parts:
                if ":" in part:
                    k, v = part.split(":", 1)
                    # Clean up bold markdown if any
                    k_clean = k.replace("**", "").strip()
                    v_clean = v.replace("**", "").strip()
                    system_group[k_clean] = v_clean
            break

    # Extract sections
    # Let's find index of headings
    description_text = ""
    value_text = ""
    table_lines = []
    effect_text = []
    prereq_text = ""
    
    current_section = None
    
    for line in lines[1:]:
        line_strip = line.strip()
        if line_strip.startswith("### ✨ Опис цілі"):
            current_section = "desc"
            continue
        elif line_strip.startswith("### 🔹 Цінність для бізнесу"):
            current_section = "value"
            continue
        elif line_strip.startswith("### 🔹 Порівняльна таблиця"):
            current_section = "table"
            continue
        elif line_strip.startswith("### 🔹 Ефект"):
            current_section = "effect"
            continue
        elif line_strip.startswith("### 🔹 Передумова реалізації") or line_strip.startswith("### 🔹 Передумови"):
            current_section = "prereq"
            continue
        elif line_strip.startswith("## 🔹") or line_strip.startswith("---") and not current_section == "table":
            # Wait, horizontal line separates but tables also use horizontal lines in markdown
            # So if we are in table section, we only stop if we see ### or ##
            if line_strip.startswith("##") or line_strip.startswith("###"):
                current_section = None
            continue
            
        if current_section == "desc":
            description_text += line + "\n"
        elif current_section == "value":
            value_text += line + "\n"
        elif current_section == "table":
            if line_strip.startswith("|"):
                table_lines.append(line_strip)
        elif current_section == "effect":
            if line_strip:
                effect_text.append(line_strip)
        elif current_section == "prereq":
            prereq_text += line + "\n"

    # Parse Description into as_is and to_be
    as_is = ""
    to_be = ""
    if "**Як зараз.**" in description_text:
        parts = description_text.split("**Як зараз.**", 1)[1].split("**Після автоматизації.**", 1)
        as_is = parts[0].strip()
        if len(parts) > 1:
            to_be = parts[1].strip()
    else:
        # Fallback if no bold headers
        as_is = description_text.strip()
        
    # Parse Value into bullet points
    value_points = []
    # Find all bold checklist items or subpoints
    # For example: ✅ **Усунення операційного ризику** \n – немає залежності...
    # Let's keep it as markdown/text list or structure it
    value_points = [p.strip() for p in value_text.split("\n") if p.strip()]

    # Parse Table rows
    table_rows = []
    # Skip first 2 lines of table (header and separator)
    for t_line in table_lines[2:]:
        cols = [c.strip() for c in t_line.split("|")[1:-1]]
        if len(cols) >= 3:
            table_rows.append({
                "process": cols[0],
                "as_is": cols[1],
                "to_be": cols[2]
            })

    goals.append({
        "id": idx + 1,
        "title": clean_title,
        "tags": tags,
        "system_group": system_group,
        "description": {
            "as_is": as_is,
            "to_be": to_be
        },
        "business_value": value_points,
        "comparison_table": table_rows,
        "effects": effect_text,
        "prerequisites": prereq_text.strip()
    })

# Save JSON
with open(json_output_path, "w", encoding="utf-8") as f:
    json.dump(goals, f, ensure_ascii=False, indent=2)

print(f"Successfully generated goals.json with {len(goals)} goals.")

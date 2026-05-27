#!/usr/bin/env python3
"""Regenerate data.js from JCK 2026 Price List.xlsx."""

from __future__ import annotations

import json
import re
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "JCK 2026 Price List.xlsx"
OUT = ROOT / "data.js"

MARGIN_BY_COLLECTION = {
    "CLASSICS": 0.85,
    "ROSE": 0.75,
    "LINQ": 0.65,
    "BEZEL": 0.75,
    "OTHER": 0.75,
}


def num(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def int_or_none(v):
    n = num(v)
    return int(n) if n is not None else None


def clean_str(v):
    if v is None:
        return ""
    return str(v).strip()


def margin_for(collection: str) -> float:
    key = clean_str(collection).upper()
    for name, m in MARGIN_BY_COLLECTION.items():
        if name in key:
            return m
    return 0.75


def parse_workbook():
    wb = load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb.active
    items = []
    current = None

    for row in ws.iter_rows(min_row=2, values_only=True):
        code = row[0]
        if code:
            if current:
                items.append(current)
            coll = clean_str(row[3])
            today_tariff = num(row[20])
            margin = margin_for(coll)
            sale_calc = round(today_tariff / margin, 2) if today_tariff and margin else None
            current = {
                "unique_code": clean_str(code),
                "style_code": clean_str(row[1]),
                "design": clean_str(row[2]),
                "collection": coll,
                "size": clean_str(row[4]) if row[4] else "",
                "qty": int_or_none(row[5]) or 0,
                "kt_col": clean_str(row[6]),
                "gross_wt": num(row[8]),
                "net_wt": num(row[9]),
                "stones": [],
                "today_cost": num(row[17]),
                "inward_value": num(row[18]),
                "today_cost_tariff": today_tariff,
                "inward_tariff": num(row[21]),
                "margin": margin,
                "sale_price_calc": sale_calc,
                "round_off": num(row[24]),
            }

        if not current:
            continue

        shape = row[10]
        if shape:
            current["stones"].append(
                {
                    "shape": clean_str(shape),
                    "clarity": clean_str(row[11]),
                    "pcs": int_or_none(row[12]),
                    "total_pcs": int_or_none(row[13]),
                    "cts": num(row[14]),
                    "total_cts": num(row[15]),
                }
            )

    if current:
        items.append(current)

    return items


def main():
    if not XLSX.exists():
        raise SystemExit(f"Missing workbook: {XLSX}")

    items = parse_workbook()
    payload = (
        "const ITEMS_RAW="
        + json.dumps(items, separators=(",", ":"))
        + ";\nconst ITEMS={};\nITEMS_RAW.forEach(i=>{ITEMS[i.unique_code.toUpperCase()]=i;});\n"
    )
    OUT.write_text(payload, encoding="utf-8")
    print(f"Wrote {len(items)} items to {OUT}")


if __name__ == "__main__":
    main()

"""Extract only public synthetic profile identifiers; never infer menstrual dates.

Usage: python dados/scripts/exportar_calendario.py downloaded-source.xlsm
The workbook is read as XML; macros are never executed.
"""
import hashlib
import json
import sys
from pathlib import Path
from exportar import read_workbook

source = Path(sys.argv[1])
workbook = read_workbook(source)
rows = workbook['01_Crew_Profiles']
header = rows[0]
if header[:4] != ['crew_id', 'sex_at_birth', 'age', 'role']:
    raise ValueError('Unexpected profile schema')
profiles = [{'crewId': row[0], 'sexAtBirth': row[1], 'role': row[3]}
            for row in rows[1:] if row and str(row[0]).startswith('NX-')]
if len(profiles) != 6 or len({row['crewId'] for row in profiles}) != 6:
    raise ValueError('Expected six distinct synthetic profiles')
output = {
    'sourceTitle': 'NEXUS-Med_6crew_daily_30d_cases.xlsm',
    'sourceUrl': 'https://drive.google.com/file/d/12rT8uTzcCMYUNBol3pIsnI5-PzxGmQe2/view',
    'folderUrl': 'https://drive.google.com/drive/folders/1M_BLpnYBPkhHI1AOSKiK_vtHp6DjI7p6',
    'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'sheet': '01_Crew_Profiles',
    'fields': ['crew_id', 'sex_at_birth', 'role'],
    'profiles': profiles,
    'containsMenstrualDates': False,
    'notice': 'Synthetic research profiles. No menstrual dates or cycle lengths are supplied by this workbook. Calendar entries must be self-reported.',
}
target = Path(__file__).resolve().parents[2] / 'frontend/src/data/menstrual-source.json'
target.write_text(json.dumps(output, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Exported six synthetic profile references; no personal records or menstrual dates.')

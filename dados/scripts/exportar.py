#!/usr/bin/env python3
"""
Exporta as planilhas NEXUS-Med (dados/*.xlsm e *.csv) para JSON em dados/derivados/.

Só biblioteca padrão: os .xlsm não têm macro (sem vbaProject.bin) e são lidos como XML (zip).
Rode da raiz do repositório:

    python3 -I dados/scripts/exportar.py

DADOS FICTÍCIOS. Os seis tripulantes (NX-01 a NX-06) são perfis sintéticos; os valores das
medidas seguem tendências publicadas; o ambiente é o RR-1 real da NASA, reindexado ao dia da
missão (não foi medido junto com estes tripulantes). O score e o alert_state da planilha foram
digitados à mão e vão só para gabarito.json, usado nos testes do motor.

Saída:
  tripulantes.json  perfis e linha de base pré-voo (01_Crew_Profiles + cenário do CSV)
  diario.json       30 dias de voo por tripulante, com sintomas já em rótulos (sem score/alerta)
  condicoes.json    04_Disease_Alignment
  estados.json      05_Alert_Guide
  casos.json        03_Case_Scenarios
  fontes.json       03_Source_Evidence (em espanhol, como na planilha)
  pre-pos.json      05_Pre_Post
  gabarito.json     health_change_score, alert_state e recommended_action por dia (só testes)
"""
import csv
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'derivados'
CASES = ROOT / 'NEXUS-Med_6crew_daily_30d_cases.xlsm'
PROTOTYPE = ROOT / 'Med_6_crew_prototype_dataset.xlsm'
DAILY_CSV = ROOT / 'nexus_med_daily_30d_6crew.csv'
PROFILES_CSV = ROOT / 'nexus_med_crew_profiles.csv'

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
NOTICE = ('Synthetic crew profiles (NEXUS-Med research, fictional NX-01 to NX-06). Measurement values follow '
          'published spaceflight trends; environment is real NASA RR-1 telemetry re-indexed to mission day, '
          'not measured with these crew profiles.')


# ---------- leitura das planilhas ----------

def col_index(ref):
    letters = re.match(r'[A-Z]+', ref).group(0)
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n - 1


def read_workbook(path):
    """{nome da aba: [linhas como listas de texto]}."""
    with zipfile.ZipFile(path) as z:
        if any(n.endswith('vbaProject.bin') for n in z.namelist()):
            sys.exit(f'{path.name} tem macro (vbaProject.bin); revise antes de exportar.')
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
                shared.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])))
        rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        for sheet in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets', NS):
            target = rels[sheet.get('{%s}id' % NS['r'])].lstrip('/')
            target = target if target.startswith('xl/') else 'xl/' + target
            rows = []
            for row in ET.fromstring(z.read(target)).iter('{%s}row' % NS['m']):
                values = {}
                for c in row.findall('m:c', NS):
                    v = c.find('m:v', NS)
                    kind = c.get('t')
                    if kind == 's' and v is not None:
                        text = shared[int(v.text)]
                    elif kind == 'inlineStr':
                        text = ''.join(x.text or '' for x in c.iter('{%s}t' % NS['m']))
                    else:
                        text = v.text if v is not None else ''
                    values[col_index(c.get('r'))] = text
                if values:
                    rows.append([values.get(i, '') for i in range(max(values) + 1)])
            sheets[sheet.get('name')] = rows
        return sheets


def table(rows):
    """Primeira linha como cabeçalho; ignora colunas sem nome e linhas vazias."""
    header = [h.strip() for h in rows[0]]
    out = []
    for row in rows[1:]:
        item = {h: (row[i].strip() if i < len(row) else '') for i, h in enumerate(header) if h}
        if any(item.values()):
            out.append(item)
    return out


def num(text):
    if text in ('', None):
        return None
    x = float(text)
    return int(x) if x.is_integer() else round(x, 4)


# ---------- sintomas: texto livre -> rótulos ----------

# (expressão, rótulo, região do corpo). Região pelo plano: cough -> chest, headache -> head,
# flank-discomfort -> back, nausea -> abdomen, o resto -> general.
KEYWORDS = [
    (r'nausea', 'nausea', 'abdomen'),
    (r'vomit', 'vomiting', 'general'),
    (r'appetite', 'reduced-appetite', 'general'),
    (r'cough', 'cough', 'chest'),
    (r'sore throat', 'sore-throat', 'general'),
    (r'congestion', 'congestion', 'general'),
    (r'headache', 'headache', 'head'),
    (r'fatigue|malaise|reduced exercise tolerance', 'fatigue', 'general'),
    (r'dizz', 'dizziness', 'general'),
    (r'thirst', 'thirst', 'general'),
    (r'flank', 'flank-discomfort', 'back'),
    (r'dark urine', 'dark-urine', 'general'),
    (r'shortness of breath|dyspn', 'shortness-of-breath', 'general'),
]
IMPROVING = re.compile(r'improving|nearly resolved', re.I)


def symptom_labels(text, previous):
    """
    Rótulos de um dia. Regras (de demonstração, documentadas no README de dados):
    - negação ("no vomiting", "no fever") e "X resolved" não contam;
    - intensidade: "4/10" logo depois do termo; senão "persistent" = 4, "mild" = 2, padrão 3;
    - texto de melhora ("improving", "nearly resolved"): termos citados ficam com intensidade 1;
      sem termo citado, os rótulos do dia anterior continuam com intensidade 1 (menos os resolvidos).
    """
    found = {}
    resolved = set()
    improving = bool(IMPROVING.search(text))
    for clause in re.split(r'[;.]', text):
        low = clause.lower().strip()
        if not low:
            continue
        for pattern, label, part in KEYWORDS:
            for m in re.finditer(pattern, low):
                before = low[:m.start()]
                if re.search(r'\bno\s+(?:[\w-]+\s+){0,3}$', before):
                    continue
                if re.match(r'(?:\s+[\w-]+){0,2}\s+resolved', low[m.end():]):
                    resolved.add(label)
                    continue
                score = re.match(r'\s+(\d+)\s*/\s*10', low[m.end():])
                severity = int(score.group(1)) if score else 4 if 'persistent' in low else 2 if 'mild' in low else 3
                if improving:
                    severity = 1
                found.setdefault(label, {'label': label, 'bodyPart': part, 'severity': severity})
    if improving and not found:
        for item in previous:
            if item['label'] not in resolved:
                found[item['label']] = {**item, 'severity': 1}
    return list(found.values())


# ---------- exportação ----------

def main():
    cases = read_workbook(CASES)
    prototype = read_workbook(PROTOTYPE)
    profiles_csv = {r['crew_id']: r for r in csv.DictReader(PROFILES_CSV.open(encoding='utf-8'))}
    daily_csv = list(csv.DictReader(DAILY_CSV.open(encoding='utf-8')))

    crew = []
    for r in table(cases['01_Crew_Profiles']):
        extra = profiles_csv[r['crew_id']]
        crew.append({
            'crewId': r['crew_id'], 'sex': r['sex_at_birth'], 'age': num(r['age']), 'role': r['role'],
            'medicalHistory': extra['medical_history'], 'scenario': extra['scenario_target'],
            'baseline': {
                'heightCm': num(r['baseline_height_cm']), 'bodyMass': num(r['baseline_mass_kg']),
                'heartRate': num(r['baseline_HR']), 'respiratoryRate': num(r['baseline_RR']),
                'temperature': num(r['baseline_temp_c']), 'spo2': num(r['baseline_SpO2']),
                'urinations24h': num(r['baseline_urinations_day']), 'stools24h': num(r['baseline_stools_day']),
                'sleep': num(r['baseline_sleep_h']), 'bloodPressure': num(r['baseline_SBP']),
                'bloodPressureDiastolic': num(r['baseline_DBP']),
            },
        })

    # Diário: lido da aba 02_Daily_Mission_30d e conferido com o CSV (o CSV traz o score, que a aba não tem).
    sheet_daily = {(r['crew_id'], num(r['mission_day'])): r for r in table(cases['02_Daily_Mission_30d'])}
    measures = ['heart_rate_bpm', 'respiratory_rate_min', 'body_temp_c', 'spo2_pct', 'body_mass_kg', 'height_cm',
                'urinations_24h', 'stools_24h', 'sleep_hours', 'systolic_bp', 'diastolic_bp', 'alert_state']
    daily, answers, previous = [], [], {}
    for r in daily_csv:
        key = (r['crew_id'], num(r['mission_day']))
        sheet = sheet_daily.get(key)
        if sheet is None or any((num(sheet[m]) if m != 'alert_state' else sheet[m]) != (num(r[m]) if m != 'alert_state' else r[m]) for m in measures):
            sys.exit(f'CSV e planilha divergem em {key}; revise antes de exportar.')
        labels = symptom_labels(r['symptoms'], previous.get(r['crew_id'], []))
        previous[r['crew_id']] = labels
        daily.append({
            'crewId': r['crew_id'], 'day': key[1], 'phase': r['phase'],
            'vitals': {
                'heartRate': num(r['heart_rate_bpm']), 'respiratoryRate': num(r['respiratory_rate_min']),
                'temperature': num(r['body_temp_c']), 'spo2': num(r['spo2_pct']), 'bodyMass': num(r['body_mass_kg']),
                'sleep': num(r['sleep_hours']), 'bloodPressure': num(r['systolic_bp']),
                'bloodPressureDiastolic': num(r['diastolic_bp']),
            },
            'heightCm': num(r['height_cm']),
            'urinations24h': num(r['urinations_24h']), 'stools24h': num(r['stools_24h']),
            'symptomsText': r['symptoms'], 'symptoms': labels, 'redFlag': r['red_flag'] == '1',
            'environment': {
                'temperatureC': num(r['ambient_temp_c']), 'relativeHumidityPct': num(r['ambient_rh_pct']),
                'co2Ppm': num(r['ambient_co2_ppm']), 'radiationDoseMgyDay': num(r['radiation_dose_mgy_d']),
                'radiationAccumMgy': num(r['radiation_accum_mgy']), 'sourceDate': r['environment_source_date'],
                'origin': r['environment_origin'],
            },
            'physiologyOrigin': r['physiology_origin'],
        })
        answers.append({
            'crewId': r['crew_id'], 'day': key[1], 'healthChangeScore': num(r['health_change_score']),
            'alertState': r['alert_state'], 'recommendedAction': r['recommended_action'],
            'conditionId': r['condition_id'] or None, 'caseStage': r['case_stage'], 'redFlag': r['red_flag'] == '1',
            'contextLoad': num(r['context_load']),
        })

    conditions = [{
        'id': r['Disease ID'], 'condition': r['Condition'], 'crewUsed': r['Crew used'],
        'primaryInputs': r['Primary inputs'], 'checkIn': r['Check-in'], 'timeFactor': r['Time factor'],
        'environmentContext': r['Environment/context'], 'prototypePattern': r['Prototype pattern'],
        'safeWording': r['Safe wording'],
    } for r in table(cases['04_Disease_Alignment'])]
    states = [{'state': r['State'], 'meaning': r['Meaning'], 'wording': r['Wording'], 'action': r['Action']}
              for r in table(prototype['05_Alert_Guide'])]
    scenarios = [{
        'case': r['Case'], 'crewId': r['Crew'], 'conditionIds': r['Disease ID'], 'condition': r['Condition'],
        'onset': r['Onset'], 'peak': r['Peak'], 'recovery': r['Recovery'], 'baselinePattern': r['Baseline pattern'],
        'dailyProgression': r['Daily progression'], 'expectedAlert': r['Expected alert'],
        'recommendedAction': r['Recommended action'], 'whyUseful': r['Why useful'],
    } for r in table(cases['03_Case_Scenarios'])]
    sources = [{
        'id': f'nexus-src-{i:02d}', 'variable': r['Variable'], 'finding': r['Hallazgo/anchor usado'],
        'evidenceType': r['Tipo de evidencia'], 'file': r['Archivo fuente'], 'location': r['Página/Figura'],
        'simulationUse': r['Uso en la simulación'], 'limitation': r['Limitación'], 'language': 'es',
        'role': 'data-anchor', 'clinicalThresholdEvidence': False,
    } for i, r in enumerate(table(prototype['03_Source_Evidence']), start=1)]
    pre_post = [{
        'crewId': r['crew_id'], 'phase': r['phase'], 'relativeDay': num(r['relative_day']), 'timepoint': r['timepoint'],
        'vitals': {
            'heartRate': num(r['heart_rate_bpm']), 'respiratoryRate': num(r['respiratory_rate_min']),
            'temperature': num(r['body_temp_c']), 'spo2': num(r['spo2_pct']), 'bodyMass': num(r['body_mass_kg']),
            'sleep': num(r['sleep_hours']), 'bloodPressure': num(r['systolic_bp']),
            'bloodPressureDiastolic': num(r['diastolic_bp']),
        },
        'heightCm': num(r['height_cm']), 'urinations24h': num(r['urinations_24h']), 'stools24h': num(r['stools_24h']),
        'symptomsText': r['symptoms'], 'dataOrigin': r['data_origin'],
    } for r in table(cases['05_Pre_Post'])]

    meta = lambda source, sheet: {'notice': NOTICE, 'source': f'dados/{source}', 'sheet': sheet, 'synthetic': True}
    files = {
        'tripulantes.json': {**meta(CASES.name, '01_Crew_Profiles'), 'items': crew},
        'diario.json': {**meta(CASES.name, '02_Daily_Mission_30d'), 'items': daily},
        'condicoes.json': {**meta(CASES.name, '04_Disease_Alignment'), 'items': conditions},
        'estados.json': {**meta(PROTOTYPE.name, '05_Alert_Guide'), 'items': states},
        'casos.json': {**meta(CASES.name, '03_Case_Scenarios'), 'items': scenarios},
        'fontes.json': {**meta(PROTOTYPE.name, '03_Source_Evidence'), 'items': sources},
        'pre-pos.json': {**meta(CASES.name, '05_Pre_Post'), 'items': pre_post},
        'gabarito.json': {**meta(DAILY_CSV.name, 'health_change_score, alert_state, recommended_action'),
                          'warning': 'Hand-typed labels (no formula). For engine tests only; never shown as the app state.',
                          'items': answers},
    }
    OUT.mkdir(exist_ok=True)
    for name, data in files.items():
        (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'{name}: {len(data["items"])} itens')


if __name__ == '__main__':
    main()

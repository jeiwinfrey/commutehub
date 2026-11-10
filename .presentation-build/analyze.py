import csv,json
from pathlib import Path
rows=list(csv.reader(open('/Users/jeiwinfrey/Downloads/Untitled form.csv')))[1:]
codes={
'Waiting or ride availability (Q3)':[2,3,5,6,8,10,11,15,17,18,19,21,22,24,25,28,30,32,33,34,35,36,37,38,40,43,44,45,46,47,48,50,51,53,58,59,61,65,66,69,70,71,72,74],
'Traffic or road congestion (Q3)':[1,3,13,20,21,27,28,30,31,32,33,34,39,41,43,46,49,51,52,53,55,60,62],
'Crowding or seat availability (Q3)':[1,2,4,5,17,19,22,24,28,29,33,35,47,48,59,60,61,67,69,72],
'Weather or heat (Q3)':[9,11,20,22,24,25,27,28,32,33,36,61,64],
'Transfers (Q3)':[18,26,28,33,42],
'Transport information, tracking or arrival information (Q5)':[8,14,15,24,26,27,28,30,32,33,34,35,36,37,45,48,49,50,58,59,61],
'More available rides (Q5)':[3,11,17,21,31,32,38,44,51,53,68],
}
for k,v in codes.items():print(k,len(v),f'{len(v)/74*100:.1f}%')
Path('.presentation-build/coding-audit.json').write_text(json.dumps({'n':74,'method':'Manual multi-label coding of Q3 and Q5; each response counted once per theme. All submissions retained, including repeated text. Counts describe submitted answers, not verified unique people.','codes':codes},indent=2))
Path('.presentation-build/research.json').write_text(json.dumps({'questions':[rows0 for rows0 in list(csv.reader(open('/Users/jeiwinfrey/Downloads/Untitled form.csv')))[0][3:8]],'stats':{k:{'count':len(v),'pct':round(len(v)/74*100,1)} for k,v in codes.items()}}))

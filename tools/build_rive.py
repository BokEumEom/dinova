"""Write a small original Rive 7 animation using the official runtime schema.

The image asset is replaced by the shared dinosaur WebP at load time. This
preserves the supplied art exactly across the collection, focus and garden.
Schema: https://github.com/rive-app/rive-runtime/tree/main/include/rive/generated
"""
from pathlib import Path
import struct

ROOT=Path(__file__).resolve().parent.parent
def uint(n):
    result=bytearray()
    while n>127: result.append((n&127)|128);n>>=7
    result.append(n);return bytes(result)
def value(v):
    if isinstance(v,str):
        b=v.encode();return uint(len(b))+b
    if isinstance(v,float):return struct.pack('<f',v)
    return uint(v)
def obj(kind,**props):
    return uint(kind)+b''.join(uint(int(k))+value(v) for k,v in props.items())+b'\0'
def keyframes(prop,values):
    data=obj(26,**{'53':prop})
    for frame,v in values:data+=obj(30,**{'67':frame,'68':1,'70':float(v)})
    return data
data=b'RIVE'+uint(7)+uint(0)+uint(0)+uint(0)
data+=obj(23) # Backboard
data+=obj(105,**{'203':'dinosaur','204':0,'208':550.0,'207':550.0})
data+=obj(1,**{'4':'Dinosaur','7':650.0,'8':650.0})
data+=obj(100,**{'4':'Original artwork','5':0,'206':0,'13':325.0,'14':325.0})
for name,duration,tracks in [
 ('idle',180,{17:[(0,1),(90,1.018),(180,1)],14:[(0,325),(90,321),(180,325)],15:[(0,-.008),(90,.008),(180,-.008)]}),
 ('walk',240,{13:[(0,290),(120,360),(240,290)],14:[(i,325-(7 if i%30==15 else 0)) for i in range(0,241,15)],15:[(i,.025 if i%60==30 else -.025) for i in range(0,241,30)]}),
 ('happy',60,{14:[(0,325),(15,298),(30,325),(45,307),(60,325)],15:[(0,0),(15,-.05),(30,.03),(45,-.03),(60,0)]})
]:
    data+=obj(31,**{'55':name,'56':60,'57':duration,'59':0 if name=='happy' else 1})
    data+=obj(25,**{'51':1})
    for prop,frames in tracks.items():data+=keyframes(prop,frames)
out=ROOT/'public/rive/dinosaur.riv';out.parent.mkdir(exist_ok=True,parents=True);out.write_bytes(data)
print('Created original Rive asset:',out,len(data),'bytes')

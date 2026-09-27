"""Author an editable RML source: shared original art, deforming mesh, six states.

Compile with the official Rive CLI. No scripts, account, CDN or publish needed.
The four anatomical profiles deform neck/head, tail and alternate feet separately.
"""
from pathlib import Path
import math, base64
from xml.sax.saxutils import escape

ROOT=Path(__file__).resolve().parent.parent
def varuint(n):
    b=[]
    while n>127:b.append((n&127)|128);n>>=7
    return bytes(b+[n])
def smooth(a,b,v):
    t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)

N=12
triangles=[]
for y in range(N):
    for x in range(N):
        a=y*(N+1)+x;b=a+1;c=a+N+1;d=c+1
        triangles += [a,b,d,a,d,c]
encoded=base64.b64encode(b''.join(varuint(i) for i in triangles)).decode()
states=['idle','walk','look','eat','happy','sleep']
durations=[180,72,180,120,72,240]
r=['<Rive version="1" kind="fragment">', '<ImageAsset id="0:1" name="Shared dinosaur artwork" width="550" height="550" file="../../public/images/reference-01.webp"/>']

for family,profile in enumerate(['LongNeck','Quadruped','Biped','Flying'],1):
    ns=family
    rid=lambda n:f'{ns}:{n}'
    r.append(f'<Artboard id="{rid(1)}" name="{profile}" x="{(family-1)*750}" y="0" styleId="{rid(3)}" width="650" height="650" defaultStateMachineId="{rid(10)}"><LayoutComponentStyle id="{rid(3)}" name="Artboard Style"/>')
    r.append(f'<Image id="{rid(2)}" name="Original artwork mesh" assetId="0:1" x="325" y="325"><Mesh name="Anatomical deformation" triangleIndexBytes="{encoded}">')
    vertices=[]
    for row in range(N+1):
        for col in range(N+1):
            x=col/N*550;y=row/N*550;ident=1000+len(vertices);vertices.append((x,y,ident))
            r.append(f'<MeshVertex id="{rid(ident)}" name="v{col}_{row}" x="{x-275:.4f}" y="{y-275:.4f}" u="{col/N:.6f}" v="{row/N:.6f}"/>')
    r.append('</Mesh></Image>')
    for state,duration in zip(states,durations):
        sid=states.index(state)
        r.append(f'<LinearAnimation id="{rid(100+sid)}" name="{state}" fps="60" duration="{duration}" loopValue="loop">')
        for x,y,ident in vertices:
            # Smooth weights avoid tears or cut-out seams in the supplied artwork.
            head=(1-smooth(190,325,x))*(1-smooth(300 if profile=='Quadruped' else 200,400 if profile=='Quadruped' else 335,y))
            tail=smooth(325,500,x)*(1-smooth(420,510,y))
            feet=smooth(365,485,y)
            neck=head if profile!='Flying' else 0
            phase=0 if x<285 else math.pi
            tracks=[[],[]]
            for step in range(9):
                u=step/8;wave=math.sin(u*math.tau);breath=(1-math.cos(u*math.tau))*.5
                dx=dy=0
                if state=='idle':
                    dx=neck*2.5*wave;dy=-3.5*breath*(1-feet)+tail*3*wave
                elif state=='walk':
                    dx=feet*12*math.sin(u*math.tau+phase)+head*2*wave
                    dy=-feet*max(0,math.sin(u*math.tau+phase))*8-(1-feet)*2*breath+tail*5*wave
                elif state=='look':dx=head*13*wave;dy=-head*7*breath+tail*2*wave
                elif state=='eat':dx=-head*12*breath;dy=head*(28+7*wave)+tail*3*wave
                elif state=='happy':dx=head*5*wave+tail*9*wave;dy=-math.sin(u*math.pi)**2*15-head*5*breath
                elif state=='sleep':
                    dy=(500-y)*.16+head*28+(1-feet)*2*breath;dx=head*9
                if profile=='Flying':
                    wing=smooth(60,220,abs(x-275))*(1-smooth(280,420,y))
                    dy+=wing*wave*(25 if state=='walk' else 6)
                tracks[0].append((round(u*duration),x-275+dx))
                tracks[1].append((round(u*duration),y-275+dy))
            r.append(f'<KeyedObject objectId="{rid(ident)}">')
            for prop,frames in zip([24,25],tracks):
                if max(v for _,v in frames)-min(v for _,v in frames)<.00001:frames=frames[:1]
                r.append(f'<KeyedProperty propertyKey="{prop}">')
                r.extend(f'<KeyFrameDouble frame="{frame}" value="{value:.4f}" interpolationType="linear"/>' for frame,value in frames)
                r.append('</KeyedProperty>')
            r.append('</KeyedObject>')
        r.append('</LinearAnimation>')
    r.append(f'<StateMachine id="{rid(10)}" name="Dinosaur">')
    for name,num,typ in [('isWalking',20,'Bool'),('isEating',21,'Bool'),('isSleeping',22,'Bool'),('isHappy',23,'Trigger'),('lookaround',24,'Trigger')]:
        r.append(f'<StateMachine{typ} id="{rid(num)}" name="{name}"/>')
    r.append(f'<StateMachineLayer name="Behaviour"><AnyState x="0" y="-160"/><ExitState x="300" y="-160"/><EntryState x="-200" y="0"><StateTransition stateToId="{rid(200)}"/></EntryState>')
    for index,state in enumerate(states):
        r.append(f'<AnimationState id="{rid(200+index)}" animationId="{rid(100+index)}" x="{index%3*220}" y="{index//3*180}" reset="true">')
        # Every state can react immediately, boolean priorities: sleep > eat > walk.
        for target,inputid in [(5,22),(3,21),(1,20)]:
            if target==index:continue
            r.append(f'<StateTransition stateToId="{rid(200+target)}" duration="220"><TransitionBoolCondition inputId="{rid(inputid)}" opValue="equal"/>')
            for higher in range(inputid+1,23):r.append(f'<TransitionBoolCondition inputId="{rid(higher)}" opValue="notEqual"/>')
            r.append('</StateTransition>')
        for target,inputid in [(4,23),(2,24)]:
            if target==index:continue
            r.append(f'<StateTransition stateToId="{rid(200+target)}" duration="180"><TransitionTriggerCondition inputId="{rid(inputid)}"/></StateTransition>')
        if index:
            exitflag=' enableExitTime="true" exitTimeIsPercetange="true" exitTime="100"' if state in ['happy','look'] else ''
            r.append(f'<StateTransition stateToId="{rid(200)}" duration="250"{exitflag}>')
            for inputid in [20,21,22]:r.append(f'<TransitionBoolCondition inputId="{rid(inputid)}" opValue="notEqual"/>')
            r.append('</StateTransition>')
        r.append('</AnimationState>')
    r.append('</StateMachineLayer></StateMachine></Artboard>')
r.append('</Rive>')
(ROOT/'tools/rive-dinosaurs/scene.rml').write_text('\n'.join(r),encoding='utf-8')
print('Wrote four anatomical profiles, six mesh animations each, five state-machine inputs.')

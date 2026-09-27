from pathlib import Path
import subprocess, imageio_ffmpeg
from PIL import Image, ImageDraw
root=Path.cwd()
ff=imageio_ffmpeg.get_ffmpeg_exe()
for n,p in enumerate(sorted(root.glob('*.mp4'))):
    subprocess.run([ff,'-y','-i',str(p),'-vf','fps=1/3,scale=400:-1','-frames:v','8',str(root/'artifacts'/f'video{n}-%02d.jpg')],capture_output=True)
frames=sorted((root/'artifacts').glob('video*.jpg'))
sheet=Image.new('RGB',(1600,600*((len(frames)+3)//4)), '#e9eeee')
d=ImageDraw.Draw(sheet)
for i,p in enumerate(frames):
    im=Image.open(p); im.thumbnail((400,560)); x=(i%4)*400;y=(i//4)*600
    sheet.paste(im,(x,y));d.text((x+10,y+565),p.name,fill='black')
sheet.save(root/'artifacts/video-sheet.jpg')
print('frames',len(frames))
for i,p in enumerate(sorted(root.glob('*.png'))):
    im=Image.open(p).convert('RGBA'); im.thumbnail((550,650))
    print(i+1,im.size,im.getpixel((0,0)))
    im.save(root/'public/images'/f'reference-{i+1:02}.webp')

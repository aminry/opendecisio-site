#!/usr/bin/env python3
"""Render the original 54-second captioned fast-path explainer.
Requires ffmpeg on PATH and Python pillow, fonttools and brotli.
Run from the repository root: python3 scripts/render-fast-path-video.py
Temporary font/frame files use DECISIO_VIDEO_CACHE or the user cache.
"""
from pathlib import Path
import hashlib, json, math, os, subprocess
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path.cwd()
CACHE = Path(os.environ.get('DECISIO_VIDEO_CACHE', str(Path.home()/'.cache/decisio-video')))
CACHE.mkdir(parents=True, exist_ok=True)
OUT = ROOT/'public/media'
OUT.mkdir(parents=True, exist_ok=True)
BUDGET = json.loads((ROOT/'src/data/fast-path-timing.json').read_text())
CPU, MODEL, SHARE = BUDGET['cpuMs'], BUDGET['modelMs'], BUDGET['fastShare']
MEAN = CPU + (1-SHARE/100)*MODEL
W,H,FPS,DURATION = 1280,720,24,54
BG,WHITE,INK,MUTED,LINE,AMBER,PALE = '#f4f6fa','#ffffff','#101b2c','#475973','#c7d0de','#b96a00','#fff0d6'
CHAPTERS = [
 (0,7,'A fast path for recurring decisions','Give recurring choices a faster route. The model stays available for everything the fast path passes on.'),
 (7,15,'Teach. Certify. Activate.','Teach from human labels, or learn from decisio’s answers. Certify on separate examples and check the saving before serving.'),
 (15,23,'Keep the policy. Send new facts.','Register shared rules once as context. Each state contains the facts that change. The model keeps both.'),
 (23,31,'An eligible answer skips the model',f'The default static embedding plus classifier costs about {CPU} ms, or {CPU*1000:g} microseconds, for short texts. No neural network runs on the CPU.'),
 (31,39,'Keep decisio for the rest',f'A fallback pays for the static check, then the model read. With an illustrative {MODEL} ms model budget, that is about {CPU+MODEL:.2f} ms.'),
 (39,47,'The share answered makes the saving',f'Assume {SHARE}% of requests skip a {MODEL} ms model read. The estimated mean is {MEAN:.2f} ms. This share and model budget are assumptions, not a combined benchmark.'),
 (47,54,'One pattern. Many recurring choices.','Use it for support routing, moderation or refund eligibility. Enable fast_table, then measure and certify on your task and host.'),
]
for weight in (400,650):
 path=CACHE/f'geist-{weight}.ttf'
 if not path.exists():
  font=TTFont(ROOT/'node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')
  font=instantiateVariableFont(font, {'wght':weight}, inplace=True)
  font.flavor=None; font.save(path)
FONTS={}
def font(size,bold=False):
 key=(size,bold)
 if key not in FONTS:FONTS[key]=ImageFont.truetype(str(CACHE/f'geist-{650 if bold else 400}.ttf'),size)
 return FONTS[key]
def text(d,xy,s,size=26,fill=INK,bold=False):d.text(xy,s,font=font(size,bold),fill=fill)
def wrap(d,s,x,y,width,size=26,fill=INK,bold=False,leading=1.35):
 words=s.split(); line=''
 for word in words:
  trial=(line+' '+word).strip()
  if d.textlength(trial,font=font(size,bold))>width and line:
   text(d,(x,y),line,size,fill,bold);y+=size*leading;line=word
  else:line=trial
 if line:text(d,(x,y),line,size,fill,bold);y+=size*leading
 return y
def box(d,rect,accent=False):d.rounded_rectangle(rect,radius=14,fill=WHITE,outline=AMBER if accent else LINE,width=3 if accent else 2)
def arrow(d,a,b,color=AMBER):
 d.line([a,b],fill=color,width=3)
 angle=math.atan2(b[1]-a[1],b[0]-a[0])
 for da in (-.55,.55):d.line([b,(b[0]-13*math.cos(angle+da),b[1]-13*math.sin(angle+da))],fill=color,width=3)
def packet(d,a,b,progress):
 x=a[0]+(b[0]-a[0])*progress;y=a[1]+(b[1]-a[1])*progress
 d.ellipse((x-6,y-6,x+6,y+6),fill=AMBER)
def card(d,x,y,w,h,title,body,accent=False):
 box(d,(x,y,x+w,y+h),accent);text(d,(x+24,y+20),title,25,INK,True)
 wrap(d,body,x+24,y+64,w-48,23,MUTED)
def frame(t):
 index=next((i for i,c in enumerate(CHAPTERS) if c[0]<=t<c[1]),len(CHAPTERS)-1)
 start,end,title,caption=CHAPTERS[index];u=t-start;phase=(u%2)/2
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 text(d,(64,30),'Decisio',26,INK,True);text(d,(895,35),'Decision fast path',20,MUTED)
 d.line((64,84,1216,84),fill=LINE,width=2)
 text(d,(64,112),title,43,INK,True)
 wrap(d,caption,64,176,1152,21,MUTED,leading=1.2)
 if index==0:
  messages=['I was charged twice.','Where is my refund?','I cannot sign in.','Please update my invoice.']
  for i,msg in enumerate(messages):
   box(d,(72,230+i*76,555,292+i*76),i==int(u)%4);text(d,(94,246+i*76),msg,24)
  card(d,790,285,400,185,'decisio model','Reads each request and returns a typed answer.',True)
  arrow(d,(575,350),(770,350));packet(d,(575,350),(770,350),phase)
  text(d,(798,489),'Can familiar decisions skip this read?',22,MUTED)
 elif index==1:
  card(d,72,245,310,215,'Examples','Human-labelled requests, or answers supplied by decisio.')
  card(d,488,245,300,215,'Certify + time','Check separate examples. Require a saving on this host.',True)
  card(d,894,245,314,215,'Activate if qualified','Otherwise, keep the model path available.')
  for a,b in [((394,350),(475,350)),((801,350),(881,350))]:arrow(d,a,b);packet(d,a,b,phase)
  text(d,(72,501),'Model agreement concerns matching the model, including its mistakes.',24,MUTED)
 elif index==2:
  card(d,72,230,480,268,'context · shared rules','Support ownership and routing policy. Register once; keep it fixed.',True)
  card(d,728,230,480,268,'state · changing facts',['I was charged twice.','I cannot sign in.'][int(u/2)%2])
  text(d,(752,414),'Send one new request at a time.',22,MUTED)
  text(d,(601,339),'+',46,MUTED)
  text(d,(72,530),'Static classifier reads state. Model reads context + state.',27,INK,True)
 elif index==3:
  card(d,72,235,530,290,'CPU static fast path','Token vectors / embedding / classifier',True)
  text(d,(98,354),f'~{CPU*1000:g} µs',65,INK,True);text(d,(100,440),'Short-text embedding + classifier',23,MUTED)
  card(d,790,235,414,290,'Eligible answer','Illustrative support team:')
  text(d,(816,355),'billing',53,INK,True);text(d,(816,444),'Model read skipped',25,AMBER,True)
  arrow(d,(620,375),(772,375));packet(d,(620,375),(772,375),phase)
  text(d,(72,544),'Published static p50: 0.05 ms on short texts. Longer texts cost more.',21,MUTED)
 elif index==4:
  card(d,72,245,485,245,'Static fast path','No eligible answer for this illustrative request.')
  card(d,744,245,464,245,'decisio model','Reads the registered policy and these facts.',True)
  text(d,(98,399),f'~{CPU} ms check',28,INK,True);text(d,(770,399),f'~{MODEL} ms budget',28,INK,True)
  arrow(d,(578,365),(724,365));packet(d,(578,365),(724,365),phase)
  text(d,(72,526),f'Fallback estimate: {CPU} + {MODEL} = {CPU+MODEL:.2f} ms',29,INK,True)
 elif index==5:
  for row in range(5):
   for col in range(20):
    x=78+col*37;y=241+row*36
    d.rounded_rectangle((x,y,x+23,y+23),radius=5,fill=AMBER if row*20+col<SHARE else MUTED)
  text(d,(72,450),f'Assume {SHARE}% fast answers',27,INK,True)
  text(d,(72,496),f'{CPU} ms + {100-SHARE}% × {MODEL} ms = {MEAN:.2f} ms',30,INK,True)
  box(d,(915,245,1205,460),True);text(d,(942,275),f'{MEAN:.2f} ms',51,INK,True)
  wrap(d,'Estimated mean processing time',942,352,240,24,MUTED)
  text(d,(72,548),'Example inputs, not measured coverage. Network and queueing excluded.',22,MUTED)
 elif index==6:
  for i,(a,b) in enumerate([('Support routing','billing / access / other'),('Moderation','allow / review / block'),('Refund eligibility','yes / no')]):
   card(d,72+i*390,242,366,192,a,b,i==int(u)%3)
  box(d,(72,475,1208,563),True)
  text(d,(96,499),'Enable fast_table. Certify and measure on your own host.',29,INK,True)
 for i,c in enumerate(CHAPTERS):
  x=64+i*166;d.rounded_rectangle((x,711,x+148,715),radius=2,fill=AMBER if i<=index else LINE)
 # Short cross-fades between complete, readable scenes.
 if u<.3 and index>0:
  alpha=u/.3;im=Image.blend(frame(start-.001),im,alpha)
 return im

video=OUT/'decision-fast-path.mp4'
proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(video)],stdin=subprocess.PIPE)
try:
 for i in range(DURATION*FPS):
  proc.stdin.write(frame(i/FPS).tobytes())
  if i%(FPS*8)==0: print(f'render: {i//FPS}/{DURATION}s',flush=True)
 proc.stdin.close();code=proc.wait()
 if code:raise RuntimeError(f'ffmpeg exit {code}')
except BaseException:
 proc.stdin.close();proc.wait();raise
poster=OUT/'decision-fast-path.webp';frame(26).save(poster,'WEBP',quality=88)
# A time-aligned text equivalent. All narration is also visible in the frames.
def stamp(seconds):return f'00:{seconds//60:02}:{seconds%60:02}.000'
vtt=OUT/'decision-fast-path.vtt'
vtt.write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(a)} --> {stamp(b)}\n{caption}' for a,b,_,caption in CHAPTERS)+'\n')
for i,(start,_,_,_) in enumerate(CHAPTERS):frame(start+2).save(CACHE/f'chapter-{i+1}.png')
assets={p.suffix[1:]:{'path':'/media/'+p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [video,poster,vtt]}
meta={'title':'Give recurring decisions a fast path','duration':DURATION,'width':W,'height':H,'fps':FPS,'silent':True,'timingSha256':hashlib.sha256((ROOT/'src/data/fast-path-timing.json').read_bytes()).hexdigest(),'assets':assets,'chapters':[{'start':a,'end':b,'title':title,'text':caption} for a,b,title,caption in CHAPTERS]}
(ROOT/'src/data/fast-path-film.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n')
print(f'render: complete, {video.stat().st_size:,} bytes',flush=True)

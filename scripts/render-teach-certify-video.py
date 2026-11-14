#!/usr/bin/env python3
"""Render the source-backed Teach & Certify film, captions and original music.
Uses the same Pillow/ffmpeg and Kokoro environment as the fast-path film.
Set DECISIO_VIDEO_CACHE for intermediates and DECISIO_NARRATOR_DIR for the
Apache-2.0 kokoro-v1.0.onnx and voices-v1.0.bin weights (MIT runtime).
"""
from pathlib import Path
import hashlib, json, math, os, re, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path.cwd();CACHE=Path(os.environ.get('DECISIO_VIDEO_CACHE',str(Path.home()/'.cache/decisio-teach-film')))
CACHE.mkdir(parents=True,exist_ok=True);OUT=ROOT/'public/media';OUT.mkdir(parents=True,exist_ok=True)
RAW=subprocess.check_output(['node','--input-type=module','-e',"import {teachFilmStory} from './src/lib/teach-certify-film.mjs';console.log(JSON.stringify(teachFilmStory()))"],cwd=ROOT).strip()
STORY=json.loads(RAW);CHAPTERS=STORY['chapters'];L=STORY['learning'];P=STORY['population']
W,H,FPS,DURATION,SR=1280,720,24,STORY['duration'],48000
BG,PANEL,INK,MUTED,LINE,GOLD,BLUE='#000000','#0b1221','#e5e5e5','#b7c7dc','#46566f','#fca311','#8fb3d9'
for weight in (400,650):
 p=CACHE/f'geist-{weight}.ttf'
 if not p.exists():
  f=TTFont(ROOT/'node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')
  f=instantiateVariableFont(f,{'wght':weight},inplace=True);f.flavor=None;f.save(p)
FONTS={}
def font(n,b=False):
 if (n,b) not in FONTS:FONTS[n,b]=ImageFont.truetype(str(CACHE/f'geist-{650 if b else 400}.ttf'),n)
 return FONTS[n,b]
def text(d,xy,s,n=28,color=INK,b=False):d.text(xy,str(s),font=font(n,b),fill=color)
def wrap(d,s,x,y,w,n=28,color=INK,b=False):
 line=''
 for word in s.split():
  trial=(line+' '+word).strip()
  if d.textlength(trial,font=font(n,b))>w and line:text(d,(x,y),line,n,color,b);y+=n*1.28;line=word
  else:line=trial
 if line:text(d,(x,y),line,n,color,b);y+=n*1.28
 return y
def box(d,r,active=False,color=GOLD):
 x,y,x2,y2=r
 d.rounded_rectangle((x+7,y+7,x2+7,y2+7),radius=14,fill='#14213d')
 d.rounded_rectangle(r,radius=14,fill=PANEL,outline=color if active else LINE,width=3 if active else 2)
 if active:d.rounded_rectangle((x+4,y+4,x2-4,y2-4),radius=11,outline='#66471b',width=1)
def arrow(d,a,b,color=GOLD):
 d.line([a,b],fill=color,width=3);angle=math.atan2(b[1]-a[1],b[0]-a[0])
 for delta in [-.6,.6]:d.line([b,(b[0]-13*math.cos(angle+delta),b[1]-13*math.sin(angle+delta))],fill=color,width=3)
def packet(d,a,b,p,color=GOLD):
 x=a[0]+(b[0]-a[0])*p;y=a[1]+(b[1]-a[1])*p;d.rounded_rectangle((x-7,y-5,x+7,y+5),radius=2,fill=color)
def lock(d,x,y):
 d.arc((x+5,y,x+29,y+30),180,360,fill=BLUE,width=4);d.rounded_rectangle((x,y+15,x+34,y+43),radius=5,fill='#14213d',outline=BLUE,width=3);d.line((x+17,y+24,x+17,y+33),fill=BLUE,width=3)
def footer(d,i):
 scope='BANKING77 (PolyAI, CC BY 4.0) · Gemma 4 31B FP8 · RTX PRO 6000 Blackwell'
 text(d,(64,597),scope,19,MUTED)
 text(d,(64,624),f"decisio {STORY['release']} · {STORY['date']} · 10 teaching examples per category · draw 1",18,MUTED)
 for j in range(5):
  x=64+j*235;d.rounded_rectangle((x,696,x+215,700),radius=2,fill=GOLD if j<=i else LINE)
def frame(t):
 i=min(4,int(t//8));u=t-i*8
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 for x in range(0,W,64):d.line((x,0,x,H),fill='#111827',width=1)
 for y in range(0,H,64):d.line((0,y,W,y),fill='#111827',width=1)
 text(d,(64,29),'Decisio',28,INK,True);text(d,(948,35),f'Teach & Certify · {i+1}/5',22,MUTED)
 d.line((64,81,1216,81),fill=LINE,width=1)
 title=CHAPTERS[i]['title'];size=49
 while d.textlength(title,font=font(size,True))>1152:size-=1
 text(d,(64,112),title,size,INK,True)
 if i==0:
  labels=['card arrival','exchange rate','lost or stolen card']
  for j,label in enumerate(labels):
   phase=(u/1.6-j*.21)%1;dx=round(8*math.sin(phase*math.pi))
   y=229+j*93;box(d,(64+dx,y,592+dx,y+73),phase<.45)
   text(d,(84+dx,y+9),'Message + correct category',19,MUTED)
   text(d,(84+dx,y+34),label,29,INK,True)
  text(d,(64,526),f"{L['examples']} labelled examples · {L['labels']} categories",26,MUTED)
  box(d,(772,219,1216,521),True);lock(d,805,241)
  text(d,(860,247),'Base model stays fixed',26,BLUE,True)
  d.line((792,308,1196,308),fill=LINE,width=1)
  for k in range(12):
   x=812+k%6*59;y=337+k//6*45;on=math.sin(u*4-k*.65)>-.2
   d.rounded_rectangle((x,y,x+37,y+28),radius=4,fill=GOLD if on else '#453416',outline='#8c6528',width=1)
  text(d,(812,443),'Small task head learns',30,GOLD,True)
  arrow(d,(620,391),(755,391));packet(d,(620,391),(755,391),(u*.8)%1)
 elif i==1:
  text(d,(64,207),'Recorded test accuracy',29,MUTED)
  for j,(label,value,color) in enumerate([('Before teaching',L['before'],BLUE),('After teaching',L['after'],GOLD)]):
   x=64+j*592;box(d,(x,260,x+560,487),j==1)
   text(d,(x+25,282),label,28,MUTED)
   text(d,(x+25,326),f'{value*100:.1f}%',91,color,True)
   d.rounded_rectangle((x+26,450,x+534,460),radius=4,fill='#263247')
   shown=value if j==0 else L['before']+(value-L['before'])*min(1,max(0,u-.6)/2.6)
   d.rounded_rectangle((x+26,450,x+26+508*shown,460),radius=4,fill=color)
  text(d,(64,524),'Same banking task. Same base model.',32,INK,True)
  text(d,(872,524),f"+{(L['after']-L['before'])*100:.1f} points",32,GOLD,True)
 elif i==2:
  box(d,(64,232,540,516),True,BLUE)
  text(d,(89,254),'Held back from teaching',30,BLUE,True)
  for j in range(3):
   y=324+j*48;d.rounded_rectangle((90,y,510,y+34),radius=5,fill='#14213d',outline=BLUE,width=1)
   text(d,(105,y+4),'Different message + correct category',21,INK)
  arrow(d,(562,376),(695,376),BLUE);packet(d,(562,376),(695,376),(u*.7)%1,BLUE)
  box(d,(720,232,1216,516),u>1.3)
  text(d,(749,254),'Check an error target',30,INK,True)
  text(d,(749,306),f"{STORY['target']*100:.0f}%",88,GOLD,True)
  text(d,(749,415),f"{STORY['confidence']*100:.0f}% confidence",30,MUTED)
  text(d,(64,541),'For traffic like your examples. Separate labels never fit the head.',29,INK,True)
 elif i==3:
  case=STORY['cases'][0 if u<4 else 1];local=u%4;eligible=case['eligible']
  box(d,(64,217,1216,347),local<.55)
  text(d,(88,230),'NEW MESSAGE · '+('1 / 2' if u<4 else '2 / 2'),20,GOLD,True)
  wrap(d,'“'+case['text']+'”',88,267,1080,32,INK,True)
  text(d,(64,373),'Prediction: '+case['answerName'],30,INK,True)
  for j,(label,sub) in enumerate([('Route automatically','Correctness certificate qualifies'),('Human review','Keep the model’s suggestion')]):
   x=64+j*592;active=j==(0 if eligible else 1)
   box(d,(x,437,x+560,553),active,GOLD if j==0 else BLUE)
   text(d,(x+22,453),label,32,GOLD if active and j==0 else BLUE if active else MUTED,True)
   text(d,(x+22,501),sub,22,MUTED)
  arrow(d,(640,407),(344 if eligible else 936,431),GOLD if eligible else BLUE)
 elif i==4:
  share=P['certified']/P['total'];text(d,(64,207),'In the recorded test inbox',29,MUTED)
  text(d,(64,249),f'{share*100:.1f}%',98,GOLD,True)
  text(d,(421,292),'certified for automatic routing',36,INK,True)
  x,y,width=64,386,1152;correct=width*P['correct']/P['total'];wrong=width*P['wrong']/P['total']
  d.rounded_rectangle((x,y,x+width,y+34),radius=5,fill=BLUE)
  d.rectangle((x,y,x+correct+wrong,y+34),fill=GOLD)
  d.rectangle((x+correct,y,x+correct+wrong,y+34),fill='#3a2711')
  for k in range(0,34,7):d.line((x+correct,y+k,x+correct+wrong,y+min(34,k+12)),fill=GOLD,width=2)
  text(d,(64,443),f"{P['certified']:,} certified",35,GOLD,True)
  text(d,(672,443),f"{P['review']:,} for review",35,BLUE,True)
  text(d,(64,495),f"{P['wrong']} certified predictions were wrong · {P['total']:,} test messages",26,MUTED)
  text(d,(64,548),'Teach one task. Keep a review path.',32,INK,True)
 footer(d,i)
 if i>0 and u<.2:im=Image.blend(frame(i*8-.001),im,u/.2)
 return im

def music():
 """Original 120 BPM electronic instrumental, without third-party samples."""
 n=DURATION*SR;out=np.zeros((n,2),dtype=np.float32);rng=np.random.default_rng(917)
 def add(start,sample,level,pan=0):
  k=int(start*SR);length=min(len(sample),n-k)
  if length<=0:return
  out[k:k+length,0]+=sample[:length]*level*math.sqrt((1-pan)/2)
  out[k:k+length,1]+=sample[:length]*level*math.sqrt((1+pan)/2)
 def tone(midi,duration,pluck=False):
  t=np.arange(int(duration*SR),dtype=np.float32)/SR;f=440*2**((midi-69)/12)
  sig=np.sin(2*np.pi*f*t)+.2*np.sin(4*np.pi*f*t)+.07*np.sin(6*np.pi*f*t)
  env=np.minimum(1,t/.015)*np.minimum(1,(duration-t)/.08)*np.exp(-t*(4.5 if pluck else .8))
  return (sig*env).astype(np.float32)
 chords=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]]
 for bar in range(DURATION//2):
  start=bar*2;chord=chords[bar%4];energy=.72 if bar<4 else 1
  for note in chord:add(start,tone(note,2.1),.035*energy,.25 if note%2 else -.25)
  for step in range(8):add(start+step*.25,tone(chord[(step*2)%3]+12,.45,True),.035*energy,.45 if step%2 else -.45)
  for beat in range(4):
   t=np.arange(int(.32*SR),dtype=np.float32)/SR;kick=np.sin(2*np.pi*(45*t+75*(1-np.exp(-t*28))/28))*np.exp(-t*16)
   add(start+beat*.5,kick,.25*energy)
   if bar>=4:add(start+beat*.5,tone(chord[0]-12,.42,True),.12)
   if beat%2:
    tt=np.arange(int(.18*SR),dtype=np.float32)/SR;noise=rng.standard_normal(len(tt)).astype(np.float32)
    add(start+beat*.5,(noise*.4+np.sin(2*np.pi*180*tt)*.25)*np.exp(-tt*24),.1*energy,.1)
  for step in range(8):
   tt=np.arange(int(.07*SR),dtype=np.float32)/SR;noise=np.diff(rng.standard_normal(len(tt)).astype(np.float32),prepend=0)
   add(start+step*.25,noise*np.exp(-tt*90),.02*energy,.4 if step%2 else -.4)
 out[:SR]*=np.linspace(0,1,SR)[:,None];out[-3*SR:]*=np.linspace(1,0,3*SR)[:,None]
 return out

def soundtrack():
 from kokoro_onnx import Kokoro
 narrator=Path(os.environ.get('DECISIO_NARRATOR_DIR',str(CACHE)))
 kokoro=Kokoro(str(narrator/'kokoro-v1.0.onnx'),str(narrator/'voices-v1.0.bin'))
 voice=np.zeros(DURATION*SR,dtype=np.float32);cues=[]
 for i,chapter in enumerate(CHAPTERS):
  cursor=i*8+.25;parts=re.split(r'(?<=[.!?]) +',chapter['text'])
  for j,line in enumerate(parts):
   samples,rate=kokoro.create(line,voice='af_heart',speed=1.0,lang='en-us',sentence_pause=.24,clause_pause=.1)
   audible=np.flatnonzero(np.abs(samples)>.004)
   if len(audible):samples=samples[max(0,audible[0]-int(.08*rate)):min(len(samples),audible[-1]+int(.18*rate))]
   seconds=len(samples)/rate
   if cursor+seconds>i*8+7.85:raise RuntimeError(f'Chapter {i+1} narration is too long: {cursor+seconds-i*8:.2f}s; shorten the words')
   samples=np.interp(np.arange(round(seconds*SR))*rate/SR,np.arange(len(samples)),samples).astype(np.float32)
   samples=samples/max(.01,float(np.max(np.abs(samples))))*.42
   start=round(cursor*SR);voice[start:start+len(samples)]=samples
   cues.append((cursor,cursor+seconds,line));cursor+=seconds+.12
  print(f'narration: {i+1}/5 · {cursor-i*8:.2f}s',flush=True)
 score=music();window=SR//10;levels=np.repeat([np.max(np.abs(voice[j:j+window])) for j in range(0,len(voice),window)],window)[:len(voice)]
 mixed=score*np.where(levels>.02,.3,.6)[:,None]+voice[:,None]*.9
 mixed/=max(1,float(np.max(np.abs(mixed)))/.92)
 audio=CACHE/'soundtrack.wav'
 with wave.open(str(audio),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mixed*32767).astype('<i2').tobytes())
 return audio,cues

def stamp(s):
 millis=round(s*1000);return f'{millis//3600000:02}:{millis//60000%60:02}:{millis//1000%60:02}.{millis%1000:03}'
if __name__=='__main__':
 audio,cues=soundtrack();video=OUT/'teach-and-certify.mp4'
 proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-i',str(audio),'-c:v','libx264','-threads','4','-preset','medium','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ar',str(SR),'-movflags','+faststart','-t',str(DURATION),str(video)],stdin=subprocess.PIPE)
 try:
  for j in range(DURATION*FPS):
   proc.stdin.write(frame(j/FPS).tobytes())
   if j%(FPS*8)==0:print(f'render: {j//FPS}/{DURATION}s',flush=True)
  proc.stdin.close();code=proc.wait()
  if code:raise RuntimeError(f'ffmpeg exit {code}')
 except BaseException:
  proc.stdin.close();proc.wait();raise
 poster=OUT/'teach-and-certify.webp';frame(13.0).save(poster,'WEBP',quality=90)
 vtt=OUT/'teach-and-certify.vtt';vtt.write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(a)} --> {stamp(b)} line:88%\n'+('[Upbeat instrumental music]\n' if j==0 else '')+line for j,(a,b,line) in enumerate(cues))+'\n')
 for i in range(5):frame(i*8+5).save(CACHE/f'chapter-{i+1}.png')
 assets={p.suffix[1:]:{'path':'/media/'+p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [video,poster,vtt]}
 meta={'title':STORY['title'],'duration':DURATION,'width':W,'height':H,'fps':FPS,'silent':False,'hasMusic':True,'hasNarration':True,'narration':{'model':'Kokoro v1.0','voice':'af_heart','modelLicense':'Apache-2.0','runtimeLicense':'MIT','modelSource':'https://huggingface.co/hexgrad/Kokoro-82M','runtimeSource':'https://github.com/thewh1teagle/kokoro-onnx'},'storySha256':hashlib.sha256(RAW).hexdigest(),'assets':assets,'chapters':CHAPTERS}
 (ROOT/'src/data/teach-certify-film.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n')
 print(f'render: complete, {video.stat().st_size:,} bytes, narration + original music',flush=True)

import sys, wave, numpy as np
from scipy.signal import spectrogram
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
files=sys.argv[2:]; fig,ax=plt.subplots(len(files),1,figsize=(14,2.6*len(files)),squeeze=False)
for i,f in enumerate(files):
    w=wave.open(f); x=np.frombuffer(w.readframes(w.getnframes()),'<i2').reshape(-1,2).mean(1)/32768; sr=w.getframerate()
    fr,t,S=spectrogram(x,sr,nperseg=2048,noverlap=1024)
    ax[i,0].pcolormesh(t,fr,10*np.log10(S+1e-12),vmin=-95,vmax=-30,shading='auto'); ax[i,0].set_ylim(0,8000)
    rms=20*np.log10(np.sqrt(np.mean(x**2))); seam=abs(x[0]-x[-1])
    ax[i,0].set_title('%s  rms %.1f dB  peak %.2f  seam %.4f  %.0fs'%(f.split('/')[-1],rms,np.abs(x).max(),seam,len(x)/sr),fontsize=9)
plt.tight_layout(); plt.savefig(sys.argv[1],dpi=70)

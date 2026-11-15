"""Pull the edited image out of a saved tool result: python3 extract.py result.txt out.png"""
import sys, re, base64, io
from PIL import Image
s = open(sys.argv[1]).read()
m = re.search(r'(iVBOR[A-Za-z0-9+/=]+|/9j/[A-Za-z0-9+/=]+|UklGR[A-Za-z0-9+/=]+)', s)
Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGB').save(sys.argv[2]); print(sys.argv[2])

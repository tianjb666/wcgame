#PNGLib
A PNG lib for Node.js

 A handy class to calculate color values.

```
 version 1.0
 author Robert Eisele <robert@xarg.org>
 copyright Copyright (c) 2010, Robert Eisele
 link http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
 license http://www.opensource.org/licenses/bsd-license.php BSD License
```
Modified by George Chan <gchan@21cn.com>

##Install
```
npm install pnglib
```

##Examples
```javascript
var pnglib = require('pnglib');
var p = new pnglib(300,100,8);
var lineIndex = p.index(10,25);
p.buffer[lineIndex+j]='\x01';
p.color(0, 0, 0, 0);  // First color: background (red, green, blue, alpha)
p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)
```

More example see:
https://github.com/GeorgeChan/captchapng
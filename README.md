# Fork Info
This is a fork of RenderTom's [Convert to Binary](https://bitbucket.org/rendertom/convert-to-binary/src/master/) script. This fork adds new "Convert Directory To Binary" function to the script. The function runs the conversion on all files in a directiory and all it's subdirectories recursively. The output is a text file with all files converted to strings and declared as vars and placed in an object which copies the directory structure.

# Convert to Binary #

Script for After Effects and Photoshop to convert files into binary strings. Output files will be saved to same location as original files, and will have .txt extension.

## Installation ##

Clone or download this repository. Rename **index.js** to something that makes more sense, like **Convert to Binary.jsx**.

**After Effects** - copy **Convert to Binary.jsx** and **lib** folder into ScriptUI Panels folder:

* **Windows**: Program Files\Adobe\Adobe After Effects <version>\- Support Files\Scripts
* **Mac OS**: Applications/Adobe After Effects <version>/Scripts

Once Installation is finished run the script in After Effects by clicking Window -> **Convert to Binary**

**Photoshop** - copy **Convert to Binary.jsx** script and **lib** folder into Photoshop’s Scripts folder: ```Adobe Photoshop CC 20XX -> Presets -> Scripts -> Convert to Binary.jsx```

Restart Photoshop to access script from File -> Scripts -> **Convert to Binary**

## License ##

**Convert to Binary** uses [pngquant](https://github.com/kornelski/pngquant) library to compress png images. Pngquant is distributed under **GPL v3** or later with an additional [copyright notice](https://github.com/kornelski/pngquant/blob/master/COPYRIGHT) that must be kept for the older parts of the code.

---------

Developed by Tomas Šinkūnas
www.rendertom.com

---------
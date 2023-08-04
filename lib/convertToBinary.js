var convertToBinary = (function () {
  var module = {};

  module.main = function () {
    var sourceFiles,
      numSourceFiles,
      finalString,
      binaryString,
      binaryStringDeclarations,
      fileObjectDeclarations;

    try {
      sourceFiles = getFiles();
      if (!sourceFiles) return;

      if (options.singleFile) {
        binaryStringDeclarations = [];
        fileObjectDeclarations = [];
        numSourceFiles = sourceFiles.length;
        ArrayEx.forEach(sourceFiles, function (file, index) {
          writeLn("Converting " + (index + 1) + " out of " + numSourceFiles);
          generateDeclarations(
            binaryStringDeclarations,
            fileObjectDeclarations,
            file
          );
        });

        finalString = buildString(
          binaryStringDeclarations,
          fileObjectDeclarations
        );

        FileEx.writeFile(sourceFiles[0].path + "/ALL.txt", finalString);
      } else {
        ArrayEx.forEach(sourceFiles, function (file) {
          binaryString = module.getBinaryString(file);
          FileEx.writeFile(file.fsName + ".txt", binaryString);
        });
      }

      alert("Done");
    } catch (error) {
      handleError(error);
    }
  };

  module.directory = function () {
    try {
      dir = getDirectory();
      if (!dir) return;

      var binStrObj = module.directoryToBinString(dir);

      FileEx.writeFile(
        dir.path + "/ALL.txt",
        binStrObj.varsStr + "var dirStructure = " + binStrObj.structureStr
      );

      alert("Done");
    } catch (error) {
      handleError(error);
    }
  };

  module.directoryToBinString = function (dir, depth, varNamesArr) {
    depth = depth || 1;
    varNamesArr = varNamesArr || [];

    var varsStr = "";
    var structureStr = "{\n";
    var filesArr = dir.getFiles();

    var addTabIndent = function (str, numSpaces) {
      for (var j = 0; j < numSpaces; j++) {
        str += " ";
      }

      return str;
    };

    for (var i = 0; i < filesArr.length; i++) {
      structureStr = addTabIndent(structureStr, depth * 2);

      if (filesArr[i] instanceof File) {
        var varName = getVariableName(
          filesArr[i],
          options.binaryVariablePrefix,
          options.binaryVariableSuffix
        );

        // check if the same variable name already exists
        for (var j = 0; j < varNamesArr.length; j++) {
          if (varName === varNamesArr[j]) {
            varName += "_2";
          }
        }

        varNamesArr.push(varName);
        varsStr += "var " + varName + " = " + module.getBinaryString(filesArr[i]) + "\n\n";

        structureStr +=
          '"' + FileEx.getNameWithExtension(filesArr[i]) + '": ' + varName;
      } else if (filesArr[i] instanceof Folder) {
        structureStr += '"' + filesArr[i].name + '": ';

        var dirBinStr = module.directoryToBinString(filesArr[i], depth + 1, varNamesArr);

        varsStr += dirBinStr.varsStr;
        structureStr += dirBinStr.structureStr;
      }

      structureStr += ",\n";
    }

    structureStr = addTabIndent(structureStr, (depth - 1) * 2);
    structureStr += "}";

    return { varsStr: varsStr, structureStr: structureStr };
  };

  module.getBinaryString = function (file) {
    var binaryString, compressedPNG;
    try {
      if (
        options.compressPNG &&
        FileEx.getExtension(file).toLowerCase() === "png"
      ) {
        compressedPNG = module.compressPNG(file, options.pathToPngquant);
        binaryString = FileEx.convertToBinary(compressedPNG);
        if (options.removeCompressedPNG) {
          compressedPNG.remove();
        }
      } else {
        binaryString = FileEx.convertToBinary(file);
      }

      return binaryString;
    } catch (error) {
      handleError(error);
    }
  };

  module.compressPNG = function (file, pathToPngquant) {
    var pngquant, pngquantOptions, cmd, error, compressedPNG;

    try {
      Folder.current = File($.fileName).parent;
      pngquant = File(pathToPngquant);
      if (!pngquant.exists) {
        throw new Error(
          "Unable to find pngquant executable at path " + pngquant.fsName
        );
      }

      pngquantOptions = {
        quality: "0-95",
        overwrite: true,
        saveInPlace: false, // will add suffix '-or8.png' or '-fs8.png' if not saving in place
        speed: 4, // 1-11. 1 (slowest, highest quality, smallest files) to 11 (fastest, less consistent quality, light comperssion),
        get: function () {
          var quality, overwrite, saveInPlace, speed;

          quality = "--quality=" + this.quality;

          overwrite = "";
          if (this.overwrite) {
            overwrite = "--force";
          }

          saveInPlace = "";
          if (this.saveInPlace) {
            saveInPlace = "--ext=.png";
          }

          speed = "--speed " + this.speed;

          return [quality, overwrite, saveInPlace, speed].join(" ");
        },
      };

      cmd =
        '"' +
        pngquant.fsName +
        '" ' +
        pngquantOptions.get() +
        ' "' +
        file.fsName +
        '"';

      error = system.callSystem(cmd);
      if (error) {
        throw new Error("pngquant" + error);
      }

      if (pngquantOptions.saveInPlace) {
        compressedPNG = file;
      } else {
        compressedPNG = FileEx.changeName(file, FileEx.getName(file) + "-fs8");
        if (!compressedPNG.exists) {
          compressedPNG = FileEx.changeName(
            file,
            FileEx.getName(file) + "-or8"
          );
        }

        if (!compressedPNG.exists) {
          throw new Error(
            "Could not get compressed file at path " + file.fsName
          );
        }
      }

      return compressedPNG;
    } catch (error) {
      handleError(error);
    }
  };

  return module;

  function getBinaryStringDeclaration(file) {
    var binaryStringVariableName, binaryStringDeclaration;

    binaryStringVariableName = getVariableName(
      file,
      options.binaryVariablePrefix,
      options.binaryVariableSuffix
    );

    binaryStringDeclaration =
      "var " + binaryStringVariableName + " = " + module.getBinaryString(file);

    return binaryStringDeclaration;
  }

  function getFileObjectDeclaration(file) {
    var variableName,
      binaryStringVariableName,
      fileNameWithExtension,
      fileObjectVariableName,
      fileObjectDeclaration;

    binaryStringVariableName = getVariableName(
      file,
      options.binaryVariablePrefix,
      options.binaryVariableSuffix
    );

    fileNameWithExtension = FileEx.getNameWithExtension(file);

    fileObjectVariableName = getVariableName(
      file,
      options.fileVariablePrefix,
      options.fileVariableSuffix
    );

    fileObjectDeclaration =
      "var " +
      fileObjectVariableName +
      ' = createResourceFile("' +
      fileNameWithExtension +
      '", ' +
      binaryStringVariableName +
      ");";

    return fileObjectDeclaration;
  }

  function getVariableName(file, prefix, suffix) {
    var fileName, variableName;

    fileName = FileEx.getName(file);
    variableName = toVariableName(fileName);

    if (prefix) {
      variableName = options.binaryVariablePrefix + variableName;
    }

    if (suffix) {
      variableName += options.binaryVariableSuffix;
    }

    return variableName;
  }

  function generateDeclarations(
    binaryStringDeclarations,
    fileObjectDeclarations,
    file
  ) {
    var binaryStringDeclaration, fileObjectDeclaration;

    binaryStringDeclaration = getBinaryStringDeclaration(file);
    binaryStringDeclarations.push(binaryStringDeclaration);

    fileObjectDeclaration = getFileObjectDeclaration(file);
    fileObjectDeclarations.push(fileObjectDeclaration);
  }

  function getFiles() {
    var files = File.openDialog(
      "Select files to convert to binary",
      undefined,
      {
        multiSelect: true,
      }
    );

    if (files) {
      files.sort(function (a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase();
      });
    }

    return files;
  }

  function getDirectory() {
    var dir = Folder.selectDialog("Select a directory to convert to binary");

    return dir;
  }

  function buildString(binaryStringDeclarations, fileObjectDeclarations) {
    var finalString = "";

    if (options.fileAfterBinary) {
      ArrayEx.forEach(
        binaryStringDeclarations,
        function (binaryStringDeclaration, index) {
          finalString += binaryStringDeclaration + "\n";
          if (options.addFileDeclaration) {
            finalString += fileObjectDeclarations[index] + "\n\n";
          }
        }
      );
    } else {
      finalString = binaryStringDeclarations.join("\n") + "\n\n";

      if (options.addFileDeclaration) {
        finalString += fileObjectDeclarations.join("\n") + "\n\n";
      }
    }

    if (options.addFileDeclaration) {
      finalString +=
        "function createResourceFile(fileName, binaryString) {\n" +
        "\tvar resourceFolder, fileObject;\n" +
        "\n" +
        '\tresourceFolder = "~/Desktop/";\n' +
        '\tfileObject = new File(resourceFolder + "/" + fileName);\n' +
        "\tif (!File(fileObject).exists) {\n" +
        '\t\tfileObject.encoding = "BINARY";\n' +
        '\t\tfileObject.open("w");\n' +
        "\t\tfileObject.write(binaryString);\n" +
        "\t\tfileObject.close();\n" +
        "\t}\n" +
        "\treturn fileObject;\n" +
        "}";
    }

    return finalString;
  }

  function toVariableName(string) {
    var varName = string;

    // Remove leading characters until we find a letter
    varName = varName.replace(/^[^A-Za-z]*/, "");
    if (varName.length === 0) {
      varName = "undef_" + string;
    }

    // Remove invalid characters and replace them with a temporary character
    varName = varName.replace(/[^A-Za-z0-9]+/gi, "-");

    // Capitalise first letters of each word
    varName = varName.replace(/\w*/g, function (string) {
      return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
    });

    // Remove temporary character
    varName = varName.replace(/-/gi, "");

    // lowercase first letter
    varName = varName.charAt(0).toLowerCase() + varName.substr(1);

    return varName;
  }
})();

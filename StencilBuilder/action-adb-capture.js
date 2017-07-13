var tmp = require("tmp");
var path = require("path");
var fs = require("fs");
var exec = require("child_process").execSync;

var fileName = "qc-capture.png";
var remotePath = "/sdcard/" + fileName;
var localPath = tmp.tmpNameSync();
fs.mkdirSync(localPath);

this.setProperty("infoText", new RichText("Capturing..."));
this.setProperty("bitmap0ImageData", new ImageData(0, 0, ""));

var thiz = this;

window.setTimeout(function () {
    try {
        var adbPath = Config.get(Config.DEVICE_ADB_PATH, "adb");

        exec(adbPath + " shell screencap -p " + remotePath);
        exec(adbPath + " pull " + remotePath + " " + localPath);
        exec(adbPath + " shell rm " + remotePath);
        var localFilePath = path.join(localPath, fileName);
        ImageData.fromExternalToImageData(localFilePath, function (imageData) {
            fs.unlinkSync(localFilePath);
            fs.rmdirSync(localPath);

            thiz.setProperty("bitmap0ImageData", imageData);
            var box = thiz.getProperty("box");
            var r = box.h / imageData.h;
            box.w = Math.round(imageData.w * r);
            thiz.setProperty("box", box);
        });

        var props = exec(adbPath + " shell getprop", {encoding: "UTF-8"});
        if (props) {
            var lines = props.split(/[\r\n]+/);
            var map = {};
            for (var line of lines) {
                if (line.match(/^\[([^\]]+)\]: \[([^\]]+)\][\r\n \t]*$/)) {
                    var name = RegExp.$1;
                    var value = RegExp.$2;
                    map[name] = value;
                } else {
                    console.log("Invalid line: ", line);
                }
            }

            console.log(map);

            var info = "<div>Android: <strong>" + map["ro.build.version.release"] + "</strong> / API: <strong>" + map["ro.build.version.sdk"] + "</strong>";
            info += " / Device: <strong>" + map["ro.product.manufacturer"] + " " + map["ro.product.model"] + "</strong>";
            info += "<br/>" + new Date();
            info += "</div>";

            thiz.setProperty("infoText", new RichText(info));
        }

    } catch (error) {
        Dialog.error("ADB capturing error: " + error);
        return;
    }
}, 10);

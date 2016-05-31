var fs = require('fs');
var path = require('path');
var relative = require('require-relative');

var ROOT = null;
var cachePkgs = {};
var cacheFiles = {};

function resolvePkg(id, refFile) {
    var sysPath = null,
        isAbsolute = id.match(/^[^\.]/),
        refModules = resolveSelf(refFile);
    // 非相对路径的可以使用缓存
    if (isAbsolute && !refModules && cachePkgs[id]) {
        return cachePkgs[id];
    }
    try {
        sysPath = relative.resolve(id, refModules && refModules.dir || refFile.fullname);
    } catch (ex) { 
    }
    if (sysPath && sysPath.match(/([\\\/]node_modules\b.*)$/)) {
        // 创建node_modules文件
        var subpath = RegExp.$1,
            inProject = sysPath.indexOf(ROOT) === 0,
            file = null;
        if (!cacheFiles[subpath]) {
            if (inProject) {
                // 文件在项目下
                file = fis.uri(sysPath);
            } else {
                // 不在项目下
                file = fis.file(
                    fis.project.getProjectPath(), 
                    subpath
                );
                file.setContent(fs.readFileSync(sysPath).toString());
            }
            // node_modules标志
            file._node_modules = {
                fullpath: sysPath,
                dir: path.dirname(sysPath)
            };
            if (!inProject) {
                // 必须先设置_node_modules
                fis.compile(file);
            }
            cacheFiles[subpath] = file;
        } else {
            file = cacheFiles[subpath];
        }
        var ret = {
            id: subpath,
            file: file
        };
        if (isAbsolute) {
            cachePkgs[id] = ret;
        }
        return ret;
    }
    return null;
}

function resolveSelf(file) {
    return file._node_modules || null;
};

function init(options) {
    ROOT = fis.project.getProjectPath();
}

function clearCache() {
    cachePkgs = {};
    cacheFiles = {};
}

exports.resolvePkg = resolvePkg;
exports.resolveSelf = resolveSelf;
exports.init = init;
exports.clearCache = clearCache;

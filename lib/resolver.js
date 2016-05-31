var fs = require('fs');
var path = require('path');
var relative = require('require-relative');

var ROOT = null;
var cachePkgs = {};
var cacheFiles = {};
var cacheBrowser = {};

function resolveNodeRequire(id, refDir) {
    var sysPath = null,
        isMain = !!id.match(/^[\w\-]+$/);
    try {
        sysPath = relative.resolve(id, refDir);
    } catch (ex) { 
    }
    // node系统组件
    if (sysPath && sysPath.match(/^[\w\-]+$/)) {
        sysPath = null;
    }
    if (sysPath && isMain 
        && sysPath.match(/^(.*[\\\/]node_modules[\\\/]([^\/\\])+)/)
    ) {
        // 处理package.json browser
        var root = RegExp.$1,
            pkg = fis.util(root, 'package.json');
        if (!cacheBrowser[sysPath]) {
            try {
                var json = fs.existsSync(pkg) 
                    && JSON.parse(fs.readFileSync(pkg).toString());
                if (json && json.browser) {
                    // set browser
                    cacheBrowser[sysPath] = fis.util(root, json.browser);
                }
            } catch (ex) {
            }
        }
        sysPath = cacheBrowser[sysPath] || sysPath; 
    }
    return sysPath;
}

function resolvePkg(id, refFile) {
    var sysPath = null,
        isAbsolute = id.match(/^[^\.]/),
        refModules = resolveSelf(refFile);
    // 非相对路径的可以使用缓存
    if (isAbsolute && !refModules && cachePkgs[id]) {
        return cachePkgs[id];
    }
    sysPath = resolveNodeRequire(id, refModules && refModules.dir || refFile.fullname);
    if (sysPath && sysPath.match(/([\\\/]node_modules\b.*)$/)) {
        // 创建node_modules文件
        var subpath = RegExp.$1,
            inProject = sysPath.indexOf(ROOT) === 0,
            file = null;

        if (!cacheFiles[subpath]) {
            if (inProject) {
                // 文件在项目下
                file = fis.uri(path.basename(sysPath), path.dirname(sysPath)).file;
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

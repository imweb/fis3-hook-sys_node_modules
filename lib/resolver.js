var fs = require('fs'),
    path = require('path'),
    assign = require('object-assign'),
    relative = require('require-relative');

var ROOT = null,
    packages = {
        process: '*',
        buffer: '*'
    },
    options = null;

var cachePkgs = {},
    cacheFiles = {},
    cacheBrowser = {};

function resolveNodeRequire(id, refDir) {
    var sysPath = null;
    try {
        sysPath = relative.resolve(id, refDir);
    } catch (ex) { 
    }
    // node内置模块
    if (sysPath && sysPath.match(/^[\w\-]+$/)) {
        sysPath = null;
    }
    if (sysPath && sysPath.match(/^(.*[\\\/]node_modules[\\\/][^\/\\]+)[\\\/](.+?)$/)) {
        // 处理package.json browser
        var root = RegExp.$1,
            path = './' + RegExp.$2.replace(/\\/g, '\/'),
            pkg = fis.util(root, 'package.json');
        if (!cacheBrowser[sysPath]) {
            var json = null,
                browser = null;
            try {
                json = fs.existsSync(pkg) 
                    && JSON.parse(fs.readFileSync(pkg).toString());
            } catch (ex) {
            }
            if (json && json.browser) {
                if (typeof json.browser === 'string' && id.match(/^[\w-]+$/)) {
                    browser = json.browser;
                } else if (typeof json.browser === 'object') {
                    if (json.browser[path]) {
                        browser = json.browser[path];
                    }
                }
            }
            [
                options.browser[id] || null,
                options.tryMin && 'dist/' + id + '.min.js',
                browser
            ].every(function(sub) {
                if (sub) {
                    var fullpath = fis.util(root, sub);
                    if (fs.existsSync(fullpath)) {
                        sysPath = fullpath;
                        return false;
                    }
                }
                return true;
            });

            cacheBrowser[sysPath] = sysPath;
        } else {
            sysPath = cacheBrowser[sysPath] || sysPath; 
        }
    }
    return sysPath;
}

function resolvePkg(id, refFile) {
    var sysPath = null,
        pkgName = id.match(/^([\w\-]+)/) && RegExp.$1 || null,
        isAbsolute = !!pkgName,
        refModules = resolveSelf(refFile);
    // 必须在packages.json里声明
    if (isAbsolute && !refModules && !packages[pkgName]) {
        return;
    }
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

function init(_options) {
    ROOT = fis.project.getProjectPath();
    options = _options;

    // 读取运行环境的packages.json
    var pkgFile = fis.util(process.cwd(), 'package.json'),
        pkgJson = null;
    if (fs.existsSync(pkgFile)) {
        try {
            pkgJson = JSON.parse(fs.readFileSync(pkgFile).toString());
        } catch (ex) {
        }
        pkgJson = pkgJson || {};
        packages = assign(packages, pkgJson.peerDependencie || {}, pkgJson.dependencies || {});
    }
}

function clearCache() {
    cachePkgs = {};
    cacheFiles = {};
    cacheBrowser = {};
}

exports.resolvePkg = resolvePkg;
exports.resolveSelf = resolveSelf;
exports.init = init;
exports.clearCache = clearCache;


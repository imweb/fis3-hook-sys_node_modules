var path = require('path');
var fs = require('fs');
var lookup = fis.require('hook-commonjs/lookup.js');
var resolver = require('./lib/resolver.js');
var browserify = require('./lib/browserify.js');

function tryNpmLookUp(info, file, opts) {
    var id = info.rest || '';

    if (id.match(/^[^:?]+$/) // ignore data:
        && (id.match(/^[^\.]/) || resolver.resolveSelf(file))
    ) {
        var ret = resolver.resolvePkg(id, file);
        if (ret) {
            return ret;
        }
    }
}

// 最后一个响应函数。
function onFileLookUp2(info, file) {
    var id = info.rest;

    if (/^([a-zA-Z0-9@][a-zA-Z0-9@\.\-_]*)(?:\/([a-zA-Z0-9@\/\.\-_]*))?$/.test(id) && !info.file && !info.isFISID) {
        var prefix = RegExp.$1;
        var key = file.subpath + id;
        if (!notified[key]) {
            notified[key] = true;
            fis.log.warn('Can\'t resolve `%s` in file [%s], did you miss `npm install %s`?', id, file.subpath, prefix);
        }
    }
}

function onJsStandard(file) {
    if (!file.isText() || !file.isJsLike || !file.isMod || file.skipBrowserify) {
        return;
    }

    // 如果不是 npm 包,那就直接跳过.
    var pkg = resolver.resolveSelf(file);
    if (!pkg) {
        return;
    }

    file.setContent(browserify(file.getContent(), file));
}

var entry = module.exports = function (fis, opts) {
    resolver.init(opts);
    browserify.init(opts);

    lookup.lookupList = [
        lookup.tryFisIdLookUp,
        lookup.tryPathsLookUp,
        lookup.tryPackagesLookUp,
        tryNpmLookUp,
        lookup.tryFolderLookUp,
        lookup.tryNoExtLookUp,
        lookup.tryBaseUrlLookUp,
        lookup.tryRootLookUp
    ];

    //fis.on('lookup:file', onFileLookUp);
    fis.on('compile:standard', onJsStandard);
    fis.on('release:end', function() {
        resolver.clearCache();
    });

    // 在编译之前才注册事件，应该比所有的 hook 都注册得晚。
    opts.shutup || fis.on('release:start', function() {
        notified = {};
        fis.removeListener('lookup:file', onFileLookUp2);
        fis.on('lookup:file', onFileLookUp2);
    });

    fis.set('component.type', 'node_modules');
};

entry.defaultOptions = {
};


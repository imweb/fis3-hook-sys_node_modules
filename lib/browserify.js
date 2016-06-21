var rRequireNull = /\brequire\s*\(\s*('|")this_should_be_null\1\s*\)/ig;
var rComment = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(\/\/[^\r\n\f]+|\/\*[\s\S]+?(?:\*\/|$))/;
var opts = {};

var vars = {
    'Buffer': function() {
        return 'var Buffer = require("buffer").Buffer;';
    },
    'Buffer.isBuffer': function() {
        return 'Buffer.isBuffer = require("is-buffer");';
    },
    process: function () {
        return 'var process = require(\'process/browser\');';
    }
};

var replaceVars = {
    __filename: function (file, basedir) {
        var filename = file.subpath;
        return JSON.stringify(filename);
    },
    __dirname: function (file, basedir) {
        var dir = file.subdirname;
        return JSON.stringify(dir);
    }
}

module.exports = function(content, file) {
    content = content.replace(rRequireNull, 'null');

    function append(str) {
        content = [content, str].join('\n');
    }

    function prepend(str) {
        content = [str, content].join('\n');
    }

    Object.keys(replaceVars).forEach(function (name) {
        var reg = new RegExp(fis.util.escapeReg(name), 'g');
        content = content.replace(reg, typeof replaceVars[name] === 'function' ? replaceVars[name](file) : replaceVars[name]);
    });

    Object.keys(vars).forEach(function (name) {
        var reg = new RegExp(rComment.source + '|[^\\.]\\b(' + name + ')\\b', 'g');
        var attched = false;

        // 避免模块内部自己 require 自己
        if (file.subpath.match(new RegExp('node_modules\/' + name + '\\b'))) {
            return;
        }

        // 过滤掉在注释中的情况.
        content.replace(reg, function(_, comment, matched) {
            if (matched && !attched) {
                prepend(vars[name](file));
                attched = true;
            }
        });
    });

    // process 设置process.env.NODE_ENV
    if (file.subpath.match(/node_modules\/process\/browser\b/)) {
        var env = opts.env || (fis.project.currentMedia().match(/^dev/) ? 'development' : 'production');
        append('process.env.NODE_ENV = "' + env + '"');
    }

    return content;
}

module.exports.init = function(options) {
    opts = options || {};
};


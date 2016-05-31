# fis3-hook-sys_node_modules

fis3 对npm的node_modules模块的支持(使用node运行环境的node_modules)

# Install

```bash
npm install fis3-hook-sys_node_modules -g
```

# Dependencies

+ fis3-hook-commonjs
+ mod.js

# Usage

添加commonjs支持 (需要先安装fis3-hook-commonjs)

```js
fis.hook('commonjs', {
    extList: ['.js', '.jsx', '.es', '.ts', '.tsx']
})
```

禁用fis3默认的`fis-hook-components`
```js
fis.unhook('components')
```

使用node_modules
```js
fis.hook('sys_node_modules')
```

为node_modules文件添加针对mod.js的转换
```js
fis.match('/node_modules/**.js', {
    isMod: true
});
```

取消node_modules下min文件的babel/uglify
```js
fis.match('/node_modules/**.min.js', {
    optimizer: null, 
    parser: null
})
```

## 配置项说明

* `isDist` 默认为`false` 是否是发布模式, 否则是开发模式
* `browser` `{Object}` 非dist模式时使用的browser映射, 相当于覆盖package.json中的browser
    * 例如直接使用react.min.js {react: 'dist/react.min.js'}
* `distBrowser` `{Object}` dist模式时使用的browser映射
* `tryDistMin` 默认为`true` dist时是否尝试使用dist/XX.min.js, 加快编译速度


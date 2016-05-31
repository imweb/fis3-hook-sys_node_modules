# fis3-hook-node_modules

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

为node_modules文件添加针对mod.js的转换
```js
fis.match('/{node_modules}/**.js', {
    isMod: true
});
```

禁用fis3默认的`fis-hook-components`
```js
fis.unhook('components')
fis.hook('node_modules')
```

## 配置项说明


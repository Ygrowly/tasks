// babel-preset-taro 更多选项和默认值：
// https://docs.taro.zone/docs/next/babel-config
module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: true,
      compiler: 'vite',
      useBuiltIns: process.env.TARO_ENV === 'h5' ? 'usage' : false
      // 移除targets配置，让babel使用package.json中的browserslist配置
    }]
  ]
}

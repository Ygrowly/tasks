export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/home/index',
    'pages/tasks/index',
    'pages/quantify/index',
    'pages/stats/index'
  ],
  tabBar: {
    color: '#6c757d',
    selectedColor: '#4a6fa5',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '今日聚焦'
      },
      {
        pagePath: 'pages/tasks/index',
        text: '任务管理'
      },
      {
        pagePath: 'pages/quantify/index',
        text: '任务量化'
      },
      {
        pagePath: 'pages/stats/index',
        text: '数据统计'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4a6fa5',
    navigationBarTitleText: '番茄时钟',
    navigationBarTextStyle: 'white'
  }
})

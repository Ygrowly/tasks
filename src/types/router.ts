export interface RouteParams {
  [key: string]: string | undefined
}

export interface NavigationOptions {
  url: string
  params?: RouteParams
  replace?: boolean
  reLaunch?: boolean
}

export type PagePath = 
  | '/pages/index/index'
  | '/pages/home/index'
  | '/pages/tasks/index'
  | '/pages/quantify/index'
  | '/pages/stats/index'

export interface TabBarItem {
  pagePath: string
  text: string
  iconPath: string
  selectedIconPath: string
}

export interface AppConfig {
  pages: string[]
  tabBar?: {
    color: string
    selectedColor: string
    backgroundColor: string
    borderStyle: string
    list: TabBarItem[]
  }
  window: {
    backgroundTextStyle: string
    navigationBarBackgroundColor: string
    navigationBarTitleText: string
    navigationBarTextStyle: string
  }
}
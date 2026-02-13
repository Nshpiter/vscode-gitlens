## 当前行 Blame

<p align="center">
  <img src="../../../images/docs/current-line-blame.png" alt="当前行 Blame" />
</p>

GitLens 在当前行末尾添加一个不显眼的 Git blame 注释，显示当前行最近一次提交的作者、日期和消息。

💡 使用命令面板中的 [切换行 Blame](command:workbench.action.quickOpen?%22>GitLens%3A%20Toggle%20Line%20Blame%22) 命令来开启或关闭该注释。

⚙️ 使用设置编辑器自定义 [当前行注释](command:gitlens.showSettingsPage?%22current-line%22 '跳转至当前行 Blame 设置')。

## 悬停提示 (Hovers)

<p align="center">
  <img src="../../../images/docs/hovers-current-line.png" alt="当前行 Blame 悬停提示" />
</p>

将鼠标悬停在这些 blame 注释上将揭示更多详情和探索链接。**详情**悬停提示（顶部区域）提供许多提交详情和操作（包括提交消息中的自动链接），而**变更**悬停提示（底部区域）显示当前行与其先前版本的差异以及相关操作。

⚙️ 使用设置编辑器自定义 [悬停提示](command:gitlens.showSettingsPage?%22hovers%22 '跳转至悬停提示设置')。

## 状态栏 Blame

<p align="center">
  <img src="../../../images/docs/status-bar.png" alt="状态栏 Blame" />
</p>

GitLens 还会将关于当前行的 Git blame 信息添加到状态栏中。

⚙️ 使用设置编辑器自定义 [状态栏](command:gitlens.showSettingsPage?%22status-bar%22 '跳转至状态栏设置')。

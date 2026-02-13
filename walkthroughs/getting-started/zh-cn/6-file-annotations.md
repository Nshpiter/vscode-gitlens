## 文件注释

<p align="center">
  <img src="../../../images/docs/gutter-toggle.png" alt="切换文件注释" />
</p>

GitLens 直接在编辑器的滚动条和侧栏区域（行号旁边的空间）添加按需生成的文件注释，帮助您获得更多关于代码的见解。

### 文件 Blame (File Blame)

<p align="center">
  <img src="../../../images/docs/gutter-blame.png" alt="侧栏 Blame" />
</p>

激活后，GitLens 会展开侧栏区域，显示文件每一行的提交和作者，类似于当前行 blame。在侧栏右侧边缘显示一个时间指示器（热点图），让您一眼就能看出各行最近被更改的情况（详见下文“热点图”）。此外，指示器还会高亮显示作为当前行提交的一部分而更改的其他行，并在最左侧边缘和滚动条上同时显示。

💡 在活动文件上，使用命令面板中的 [切换文件 Blame](command:workbench.action.quickOpen?%22>GitLens%3A%20Toggle%20File%20Blame%22) 命来开启或关闭注释。

⚙️ 使用设置编辑器自定义 [文件 blame](command:gitlens.showSettingsPage?%22blame%22 '跳转至侧栏 Blame 设置')。

### 文件变更 (File Changes)

<p align="center">
  <img src="../../../images/docs/gutter-changes.png" alt="侧栏变更" />
</p>

激活后，侧栏左侧边缘会显示指示器，高亮显示任何本地、未发布的更改或由最近一次提交更改的行。

💡 在活动文件上，使用命令面板中的 [切换文件变更](command:workbench.action.quickOpen?%22>GitLens%3A%20Toggle%20File%20Changes%22) 命令来开启或关闭注释。

⚙️ 使用设置编辑器自定义 [文件变更](command:gitlens.showSettingsPage?%22changes%22 '跳转至侧栏变更设置')。

### 热点图 (Heatmap)

<p align="center">
  <img src="../../../images/docs/gutter-heatmap.png" alt="侧栏热点图" />
</p>

激活后，侧栏左侧边缘会显示一条彩色编码的指示线，显示各行相对于文件中所有其他更改的最近更改情况。颜色范围从“热”（橙色）到“冷”（蓝色），取决于最近一次更改的时间。90 天后的更改被视为“冷”。

💡 在活动文件上，使用命令面板中的 [切换文件热点图](command:workbench.action.quickOpen?%22>GitLens%3A%20Toggle%20File%20Heatmap%22) 命令来开启或关闭注释。

⚙️ 使用设置编辑器自定义 [文件热点图](command:gitlens.showSettingsPage?%22heatmap%22 '跳转至侧栏热点图设置')。

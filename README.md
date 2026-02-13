[English](./README.en.md) | 简体中文

<p align="center">
  <br />
  <a title="了解更多关于 GitLens 的信息" href="https://gitlens.amod.io"><img src="./images/docs/gitlens-logo-anybg.png" alt="GitLens Logo" /></a>
</p>

> GitLens **增强**了 VS Code 内部的 Git 功能。它通过 Git blame 注释和 CodeLens 帮助您一眼**可视化代码作者身份**，**无缝导航和探索** Git 仓库，通过丰富的可视化和强大的比较命令**获得有价值的洞察**，等等。

<p align="center">
  <br />
  <a title="GitLens 12 新特性" href="https://gitkraken.com/blog/gitlens-12"><img width="600px" src="./src/webviews/apps/media/gitlens-12-card.png" alt="打开 GitLens 12 新特性" /></a>
  <br/>
</p>

<p align="center">
  <a title="GitLens 12 新特性" href="https://gitkraken.com/blog/gitlens-12"><img src="./images/docs/whats-new-button.png" alt="打开 GitLens 12 新特性" /></a>
  <br/>
  或者阅读 <a href="https://gitlens.amod.io/#whats-new">发布说明</a>
</p>

# GitLens

[GitLens](https://gitlens.amod.io '了解更多关于 GitLens 的信息') 是 [Visual Studio Code](https://code.visualstudio.com) 的一款[开源](https://github.com/gitkraken/vscode-gitlens '在 GitHub 上打开 GitLens')扩展。

GitLens 简单地帮助您**更好地理解代码**。快速查看一行或一个代码块是谁在什么时候因为什么原因更改的。回顾历史以**获得进一步的洞察**，了解代码是如何以及为什么要演进的。毫不费力地探索代码库的历史和演变。

GitLens **功能强大**、**特性丰富**且[高度可定制](#gitlens-设置- '跳转到 GitLens 设置文档')，以满足您的需求。您是否觉得 CodeLens 太碍眼，或者觉得当前行 blame 注释分散注意力 &mdash; 没问题，通过交互式的[_GitLens 设置_编辑器](#配置 '跳转到配置')快速关闭它们或更改它们的行为。对于高级自定义，请参阅 [GitLens 文档](#gitlens-设置- '跳转到 GitLens 设置')并编辑您的[用户设置](https://code.visualstudio.com/docs/getstarted/settings '打开用户设置')。

以下是 GitLens 提供的一些**特性**：

- 毫不费力地在文件历史中进行[**版本导航**](#版本导航- '跳转到版本导航')（后退和前进）
- 行末不显眼的[**当前行 blame**](#当前行-blame- '跳转到当前行 blame') 注释，显示最后修改该行的提交和作者，通过[**悬停**](#悬停- '跳转到悬停')可访问更详细的 blame 信息
- [**作者身份 CodeLens**](#git-codelens- '跳转到 Git CodeLens') 在文件顶部和/或代码块上显示最近的提交和作者数量
- [**状态栏 blame**](#状态栏-blame- '跳转到状态栏 blame') 注释显示最后修改当前行的提交和作者
- 在编辑器侧栏（Gutter）按需显示**文件注释**，包括：
  - [**Blame**](#侧栏-blame- '跳转到侧栏 blame') &mdash; 显示文件中每一行最后修改的提交和作者
  - [**更改 (Changes)**](#侧栏-更改- '跳转到侧栏更改') &mdash; 高亮显示任何本地（未发布）的更改或由最近提交更改的行
  - [**热度图 (Heatmap)**](#侧栏-热度图- '跳转到侧栏热度图') &mdash; 显示行更改的最近程度，相对于文件中所有其他更改以及现在（热 vs 冷）
- 许多丰富的**侧边栏视图**：
  - [**“提交 (Commits)”视图**](#提交视图- '跳转到提交视图') &mdash; 可视化、探索和管理 Git 提交
  - [**“仓库 (Repositories)”视图**](#仓库视图- '跳转到仓库视图') &mdash; 可视化、探索和管理 Git 仓库
  - [**“文件历史 (File History)”视图**](#文件历史视图- '跳转到文件历史视图') &mdash; 可视化、导航和探索当前文件或当前文件所选行的修订历史
  - [**“行历史 (Line History)”视图**](#行历史视图- '跳转到行历史视图') &mdash; 可视化、导航和探索当前文件所选行的修订历史
  - [**“分支 (Branches)”视图**](#分支视图- '跳转到分支视图') &mdash; 可视化、探索和管理 Git 分支
  - [**“远程 (Remotes)”视图**](#远程视图- '跳转到远程视图') &mdash; 可视化、探索和管理 Git 远程仓库和远程分支
  - [**“暂存 (Stashes)”视图**](#暂存视图- '跳转到暂存视图') &mdash; 可视化、探索和管理 Git 暂存
  - [**“标签 (Tags)”视图**](#标签视图- '跳转到标签视图') &mdash; 可视化、探索和管理 Git 标签
  - [**“贡献者 (Contributors)”视图**](#贡献者视图- '跳转到贡献者视图') &mdash; 可视化、导航和探索贡献者
  - [**“搜索与比较 (Search & Compare)”视图**](#搜索与比较视图- '跳转到搜索与比较视图') &mdash; 按消息、作者、文件、ID 等搜索和探索提交历史，或可视化分支、标签、提交等之间的比较
- [**Git 命令面板**](#git-命令面板- '跳转到 Git 命令面板') &mdash; 提供许多常用 Git 命令的引导式（逐步）访问，以及快速访问：
  - [提交](#快速访问提交- '跳转到快速访问提交') &mdash; 历史和搜索
  - [暂存](#快速访问暂存- '跳转到快速访问暂存')
  - [状态](#快速访问状态- '跳转到快速访问状态') &mdash; 当前分支和工作区状态
- 用户友好的[**交互式变基 (Rebase) 编辑器**](#交互式变基编辑器- '跳转到交互式变基编辑器') &mdash; 轻松配置交互式变基会话
- [**终端链接**](#终端链接- '跳转到终端链接') &mdash; `Ctrl+点击` 集成终端中的自动链接，快速跳转到提交、分支、标签等的详细信息
- 丰富的[**远程托管商集成**](#远程托管商集成- '跳转到远程托管商集成') &mdash; GitHub, GitLab, Gitea, Gerrit, Bitbucket, Azure DevOps
  - 问题 (Issue) 和拉取请求 (Pull Request) 自动链接
  - 为链接的问题和拉取请求提供丰富的悬停信息（仅限 GitHub）
  - 将拉取请求与分支和提交关联（仅限 GitHub）
- 许多[**强大的命令**](#强大的命令- '跳转到强大的命令')用于导航和比较版本等
- 可自定义的[**菜单和工具栏**](#菜单和工具栏- '跳转到菜单和工具栏')，用于控制菜单和工具栏项的显示位置
- 用户定义的[**模式 (Modes)**](#模式- '跳转到模式')，用于在设置集之间快速切换
- 以及更多 😁

# GitLens+ 介绍 [#](#gitlens+-特性介绍- 'GitLens+ 特性')

GitLens+ 添加了全新的、完全可选的特性，当您使用免费帐户登录时，这些特性会增强您当前的 GitLens 体验。免费的 GitLens+ 帐户允许您在公共仓库上访问这些新的 GitLens+ 特性，而付费帐户则允许您在私有仓库上使用它们。了解更多关于 [GitLens+ 特性](https://gitkraken.com/gitlens/plus-features)的信息。

🛈 所有其他 GitLens 特性始终无需帐户即可访问，并将继续演进和投入。

## 这会影响现有特性吗？

不会，GitLens+ 的引入对现有的 GitLens 特性没有影响，因此您不会失去对您熟悉和喜爱的任何 GitLens 特性的访问权限。事实上，我们正在大力投入通过增强和扩展 GitLens 特性集。创建一个帐户只是让您能够访问这些新特性子集，这将使您能够更好地在 VS Code 中利用 Git！

## 可视化文件历史试图 [#](#可视化文件历史视图- '可视化文件历史视图')

<p align="center">
  <img src="./images/docs/visual-file-history-hover.png" alt="可视化文件历史视图" />
</p>

可视化文件历史视图允许您快速查看文件的演变过程，包括何时进行了更改、更改幅度有多大以及是谁进行的更改。

为文件贡献过更改的作者位于左侧 Y 轴上，以创建随时间变化（X 轴）的提交泳道。提交被绘制为按作者着色的气泡，其大小代表更改的相对规模。

此外，每个提交的添加和删除都被可视化为颜色编码的堆叠垂直条，其高度代表受影响的行数（右侧 Y 轴）。增加的行显示为绿色，而删除的行显示为红色。

## 工作区 (Worktrees) 视图 [#](#工作区视图- '工作区视图')

<p align="center">
  <img src="./images/docs/worktrees-view.png" alt="工作区视图" />
</p>

工作区允许您轻松地同时在仓库的不同分支上工作。您可以创建多个工作区，每个工作区都可以在单独的窗口中打开，也可以在单个工作区中放在一起。

# 特性

## 版本导航 [#](#版本导航- '版本导航')

<p align="center">
  <img src="./images/docs/revision-navigation.gif" alt="版本导航" />
</p>

- 添加 _与上一版本打开更改_ 命令 (`gitlens.diffWithPrevious`)，将当前文件或版本与上一个提交版本进行比较
- 添加 _与下一版本打开更改_ 命令 (`gitlens.diffWithNext`)，将当前文件或版本与下一个提交版本进行比较
- 添加 _与上一行版本打开更改_ 命令 (`gitlens.diffLineWithPrevious`)，将当前文件或版本与上一行提交版本进行比较
- 添加 _与工作区文件打开更改_ 命令 (`gitlens.diffWithWorking`)，将当前版本的或当前文件最近的提交版本与工作区进行比较
- 添加 _与工作区文件打开行更改_ 命令 (`gitlens.diffLineWithWorking`)，将当前行的提交版本与工作区进行比较
- 添加 _与分支或标签打开更改..._ 命令 (`gitlens.diffWithRevisionFrom`)，将当前文件或版本与所选引用的同一文件的另一个版本进行比较
- 添加 _与版本打开更改..._ 命令 (`gitlens.diffWithRevision`)，将当前文件或版本与同一文件的另一个版本进行比较

## 当前行 Blame [#](#当前行-blame- '当前行 Blame')

<p align="center">
  <img src="./images/docs/current-line-blame.png" alt="当前行 Blame" />
</p>

- 在当前行末尾添加一个不显眼的、[可自定义](#当前行-blame-设置- '跳转到当前行 blame 设置')且[支持主题样式](#支持主题的颜色- '跳转到支持主题的颜色')的 **Blame 注释**
  - 包含当前行最近提交的作者、日期和消息（[默认](#当前行-blame-设置- '跳转到当前行 blame 设置')）
  - 添加 _切换行 Blame_ 命令 (`gitlens.toggleLineBlame`)，用于切换 blame 注释的开启和关闭

## Git CodeLens [#](#git-codelens- 'Git CodeLens')

<p align="center">
  <img src="./images/docs/code-lens.png" alt="Git CodeLens" />
</p>

- 在文件顶部和代码块上添加 Git 作者身份 **CodeLens**（[可选](#git-codelens-设置- '跳转到 Git CodeLens 设置')，默认开启）

  - **最近的更改** &mdash; 文件或代码块最近一次提交的作者和日期
    - 点击 CodeLens 显示**提交文件详细信息快速挑选菜单**，其中包含用于比较、导航、探索提交等命令（[默认](#git-codelens-设置- '跳转到 Git CodeLens 设置')）
  - **作者数量** &mdash; 文件或代码块的作者数量和最主要的作者（如果超过一个）

    - 点击 CodeLens 切换整个文件的 Git blame 注释的开启和关闭（[默认](#git-codelens-设置- '跳转到 Git CodeLens 设置')）
    - 如果最近一个提交的作者也是该文件或块的唯一作者，则会被隐藏，以避免重复信息并减少视觉干扰

  - 为每个 CodeLens 提供[可自定义](#git-codelens-设置- '跳转到 Git CodeLens 设置')的点击行为 &mdash; 从以下选项中选择一个：
    - 切换文件 blame 注释开启和关闭
    - 将该提交与前一个提交进行比较
    - 显示包含该提交详细信息和命令的快速挑选菜单
    - 显示包含该提交的文件详细信息和命令的快速挑选菜单
    - 显示该文件的提交历史快速挑选菜单
    - 显示当前分支的提交历史快速挑选菜单

- 添加 _切换 Git CodeLens_ 命令 (`gitlens.toggleCodeLens`)，快捷键为 `Shift+Alt+B`，用于切换 CodeLens 的开启和关闭

## 状态栏 Blame [#](#状态栏-blame- '状态栏 Blame')

<p align="center">
  <img src="./images/docs/status-bar.png" alt="状态栏 Blame" />
</p>

- 在**状态栏**中添加一个[可自定义](#状态栏设置- '跳转到状态栏 blame 设置')的 **Git blame 注释**，显示最后修改当前行的提交和作者（[可选](#状态栏设置- '跳转到状态栏 blame 设置')，默认开启）

  - 包含提交作者和日期（[默认](#状态栏设置- '跳转到状态栏 blame 设置')）
  - 点击状态栏项显示**提交详细信息快速挑选菜单**，其中包含用于比较、导航、探索提交等命令（[默认](#状态栏设置- '跳转到状态栏 blame 设置')）

  - 提供[可自定义](#状态栏设置- '跳转到状态栏 blame 设置')的点击行为 &mdash; 从以下选项中选择一个：
    - 切换文件 blame 注释开启和关闭
    - 切换 CodeLens 开启和关闭
    - 将行提交与前一提交进行比较
    - 将行提交与工作区进行比较
    - 显示包含提交详细信息和命令的快速挑选菜单（默认）
    - 显示包含提交文件详细信息和命令的快速挑选菜单
    - 显示该文件的提交历史快速挑选菜单
    - 显示当前分支的提交历史快速挑选菜单

## 悬停 (Hovers) [#](#悬停- '悬停')

### 当前行悬停

<p align="center">
  <img src="./images/docs/hovers-current-line.png" alt="当前行悬停" />
</p>

- 添加[可自定义](#悬停设置- '跳转到悬停设置')的 Git blame 悬停，可在当前行上方访问

### 详细信息悬停

  <p align="center">
    <img src="./images/docs/hovers-current-line-details.png" alt="当前行详细信息悬停" />
  </p>

- 为当前行添加**详细信息悬停**注释，以显示更多提交详情（[可选](#悬停设置- '跳转到悬停设置')，默认开启）
  - 在提交消息中提供指向 Bitbucket, Gerrit, Gitea, GitHub, GitLab 和 Azure DevOps 的**自动问题链接**
  - 提供**快速访问命令栏**，包含 _打开更改_、_追溯上一修订版本_、_在远程打开_、_邀请参加 Live Share_（如果可用）和 _显示更多操作_ 命令按钮
  - 点击提交 SHA 执行 _显示提交_ 命令

### 更改 (diff) 悬停

<p align="center">
  <img src="./images/docs/hovers-current-line-changes.png" alt="当前行更改 (diff) 悬停" />
</p>

- 为当前行添加**更改 (diff) 悬停**注释，以显示该行的上一个版本（[可选](#悬停设置- '跳转到悬停设置')，默认开启）
  - 点击 **更改** 执行 _打开更改_ 命令
  - 点击当前和以前的提交 SHA 执行 _显示提交_ 命令

### 注释悬停

<p align="center">
  <img src="./images/docs/hovers-annotations.png" alt="注释悬停" />
</p>

- 添加[可自定义](#悬停设置- '跳转到悬停设置')的 Git blame 悬停，在查看注释时可用

### 详细信息悬停

  <p align="center">
    <img src="./images/docs/hovers-annotations-details.png" alt="注释详细信息悬停" />
  </p>

- 在查看注释时，为每一行添加**详细信息悬停**注释，以显示更多提交详情（[可选](#悬停设置- '跳转到悬停设置')，默认开启）
  - 在提交消息中提供指向 Bitbucket, Gerrit, Gitea, GitHub, GitLab 和 Azure DevOps 的**自动问题链接**
  - 提供**快速访问命令栏**，包含 _打开更改_、_追溯上一修订版本_、_在远程打开_、_邀请参加 Live Share_（如果可用）和 _显示更多操作_ 命令按钮
  - 点击提交 SHA 执行 _显示提交_ 命令

### 更改 (diff) 悬停

<p align="center">
  <img src="./images/docs/hovers-annotations-changes.png" alt="注释更改 (diff) 悬停" />
</p>

- 在查看注释时，为每一行添加**更改 (diff) 悬停**注释，以显示该行的上一个版本（[可选](#悬停设置- '跳转到悬停设置')，默认开启）
  - 点击 **更改** 执行 _打开更改_ 命令
  - 点击当前和以前的提交 SHA 执行 _显示提交_ 命令

## 侧栏 (Gutter) Blame [#](#侧栏-blame- '侧栏 Blame')

<p align="center">
  <img src="./images/docs/gutter-blame.png" alt="侧栏 Blame">
</p>

- 添加按需显示、[可自定义](#侧栏-blame-设置- '跳转到侧栏 blame 设置')且[支持主题样式](#支持主题的颜色- '跳转到支持主题的颜色')的 **侧栏 blame 注释**，显示文件中每一行最后修改的提交和作者
  - 默认包含提交消息和日期（[默认](#侧栏-blame-设置- '跳转到侧栏 blame 设置')）
  - 在侧栏右侧边缘添加**热度图**（时长）指示器（[默认](#侧栏-blame-设置- '跳转到侧栏 blame 设置')），提供一种简单直观的方法来判断行更改的最近程度（[可选](#侧栏-blame-设置- '跳转到侧栏 blame 设置')，默认开启）
    - 更多详情请参阅下面的[侧栏热度图](#侧栏-热度图- '跳转到侧栏热度图')部分
  - 添加 _切换文件 Blame_ 命令 (`gitlens.toggleFileBlame`)，快捷键为 `Alt+B`，用于切换 blame 注释的开启和关闭
  - 按 `Esc` 键关闭注释

## 侧栏更改 (Gutter Changes) [#](#侧栏-更改- '侧栏更改')

<p align="center">
  <img src="./images/docs/gutter-changes.png" alt="侧栏更改" />
</p>

- 添加按需显示、[可自定义](#侧栏-更改-设置- '跳转到侧栏更改设置')且[支持主题样式](#支持主题的颜色- '跳转到支持主题颜色')的 **侧栏更改注释**，高亮显示任何本地（未发布）的更改或由最近提交更改的行
  - 添加 _切换文件更改_ 命令 (`gitlens.toggleFileChanges`)，用于切换更改注释的开启和关闭
  - 按 `Esc` 键关闭注释

## 侧栏热度图 (Gutter Heatmap) [#](#侧栏-热度图- '侧栏热度图')

<p align="center">
  <img src="./images/docs/gutter-heatmap.png" alt="侧栏热度图" />
</p>

- 在侧栏边缘添加按需显示的**热度图**，以显示行更改的最近程度
  - 指示器的[可自定义](#侧栏-热度图-设置- '跳转到侧栏热度图设置')颜色将根据最近更改的时间长短显示为热或冷（[默认](#侧栏-热度图-设置- '跳转到侧栏热度图设置') 90 天后为冷）
  - 指示器的亮度根据相对时长从亮（较新）到暗（较旧）不等，相对时长是根据文件中所有更改的中值时长计算的
  - 添加 _切换文件热度图注释_ 命令 (`gitlens.toggleFileHeatmap`)，用于切换热度图的开启和关闭
  - 按 `Esc` 键关闭注释

## 侧边栏视图 (Side Bar Views) [#](#侧边栏视图- '侧边栏视图')

GitLens 提供了一系列强大的侧边栏视图，帮助您可视化、导航和探索 Git 仓库。

在 VS Code 侧边栏中通过 GitLens 图标或通过 _GitLens: 显示侧边栏_ 命令访问这些视图。

<p align="center">
  <img src="./images/docs/views.png" alt="侧边栏视图" />
</p>

### “提交 (Commits)”视图 [#](#提交视图- '提交视图')

<p align="center">
  <img src="./images/docs/commits-view.png" alt="“提交”视图" />
</p>

- 可视化、探索和管理 Git 提交
- 显示当前分支或选定引用的提交历史
- 查看提交的详细信息、更改的文件和差异

### “仓库 (Repositories)”视图 [#](#仓库视图- '仓库视图')

<p align="center">
  <img src="./images/docs/repositories-view.png" alt="“仓库”视图" />
</p>

- 可视化、探索和管理 Git 仓库
- 显示仓库的分支、远程、标签和暂存
- 快速切换分支、拉取/推送更改以及管理仓库设置

### “文件历史 (File History)”视图 [#](#文件历史视图- '文件历史视图')

<p align="center">
  <img src="./images/docs/file-history-view.png" alt="“文件历史”视图" />
</p>

- 可视化、导航和探索当前文件或当前文件所选行的修订历史
- 在不同版本之间快速切换
- 比较文件在不同提交中的差异

### “行历史 (Line History)”视图 [#](#行历史视图- '行历史视图')

<p align="center">
  <img src="./images/docs/line-history-view.png" alt="“行历史”视图" />
</p>

- 可视化、导航和探索当前文件所选行的修订历史
- 专注于代码特定部分的演变

### “分支 (Branches)”视图 [#](#分支视图- '分支视图')

<p align="center">
  <img src="./images/docs/branches-view.png" alt="“分支”视图" />
</p>

- 可视化、探索和管理 Git 分支
- 轻松创建、重命名、删除和切换分支
- 比较分支与当前分支或工作区的差异

### “远程 (Remotes)”视图 [#](#远程视图- '远程视图')

<p align="center">
  <img src="./images/docs/remotes-view.png" alt="“远程”视图" />
</p>

- 可视化、探索和管理 Git 远程仓库和远程分支
- 获取 (Fetch) 更改并可视化远程分支的状态

### “暂存 (Stashes)”视图 [#](#暂存视图- '暂存视图')

<p align="center">
  <img src="./images/docs/stashes-view.png" alt="“暂存”视图" />
</p>

- 可视化、探索和管理 Git 暂存
- 轻松查看暂存的内容、应用暂存或删除暂存

### “标签 (Tags)”视图 [#](#标签视图- '标签视图')

<p align="center">
  <img src="./images/docs/tags-view.png" alt="“标签”视图" />
</p>

- 可视化、探索和管理 Git 标签
- 快速导航到带标签的版本

### “贡献者 (Contributors)”视图 [#](#贡献者视图- '贡献者视图')

<p align="center">
  <img src="./images/docs/contributors-view.png" alt="“贡献者”视图" />
</p>

- 可视化、导航和探索贡献者
- 查看每个贡献者的提交活动和统计统计信息

### “搜索与比较 (Search & Compare)”视图 [#](#搜索与比较视图- '搜索与比较视图')

<p align="center">
  <img src="./images/docs/search-and-compare-view.png" alt="“搜索与比较”视图" />
</p>

- 按消息、作者、文件、ID 等搜索和探索提交历史
- 可视化分支、标签、提交等之间的比较

## Git 命令面板 [#](#git-命令面板- 'Git 命令面板')

<p align="center">
  <img src="./images/docs/git-command-palette.png" alt="Git 命令面板" />
</p>

- 添加 **Git 命令面板**命令 (`gitlens.gitCommands`)，快捷键为 `Ctrl+Alt+G`（macOS 上为 `Meta+Alt+G`）
  - 提供许多常用 Git 命令的引导式（逐步）访问
  - 减少了记住命令或标志的需求
  - 允许在执行命令之前预览其效果

### 快速访问提交 [#](#快速访问提交- '快速访问提交')

- 添加 _Git: 搜索提交..._ (`gitlens.showCommitSearch`) 和 _Git: 文件历史..._ (`gitlens.showQuickFileHistory`) 命令
  - 允许您通过消息、作者、提交 SHA、文件或包含特定更改的文件来搜索和发现提交
  - 可视化搜索结果并进一步探索和管理它们

### 快速访问暂存 [#](#快速访问暂存- '快速访问暂存')

- 添加 _Git: 暂存..._ (`gitlens.showQuickStashList`) 命令
  - 允许您可视化、探索和管理您的暂存

### 快速访问状态 [#](#快速访问状态- '快速访问状态')

- 添加 _Git: 状态..._ (`gitlens.showQuickRepoStatus`) 命令
  - 允许您可视化、探索和管理当前分支和工作区的状态

## 交互式变基 (Rebase) 编辑器 [#](#交互式变基编辑器- '交互式变基编辑器')

<p align="center">
  <img src="./images/docs/rebase.gif" alt="交互式变基编辑器" />
</p>

- 添加用户友好的 **交互式变基编辑器**
  - 在启动交互式变基时自动显示
  - 允许您直观地重新排列、挑选 (pick)、丢弃 (drop)、合并 (squash) 和重命名 (reword) 提交
  - 提供冲突警告和其他有用的提示来指导您完成变基过程

## 终端链接 [#](#终端链接- '终端链接')

<p align="center">
  <img src="./images/docs/terminal-links.gif" alt="终端链接" />
</p>

- 在集成终端中自动检测并链接提交 SHA、分支、标签等
- `Ctrl+点击` (macOS 上为 `Cmd+点击`) 链接可快速显示相关实体的详细信息和命令

## 远程托管商集成 [#](#远程托管商集成- '远程托管商集成')

- 强大的远程托管商集成 (GitHub, GitLab, Gitea, Gerrit, Bitbucket, Azure DevOps)
- 允许您直接在 VS Code 中浏览仓库、打开拉取请求、查看问题等
- 集成了自动链接、悬停详细信息和拉取请求关联等特性（各平台的详细程度可能有所不同）

## 强大的命令 [#](#强大的命令- '强大的命令')

GitLens 提供了许多强大的命令，通过命令面板或右键菜单访问。一些关键命令包括：

- _在远程查看..._ &mdash; 在 Web 浏览器中打开当前文件、行或提交的远程链接
- _复制远程链接..._ &mdash; 将当前文件、行或提交的远程链接复制到剪贴板
- _显示文件记录中的物理行..._ &mdash; 探索文件的演变
- _按 ID 或引用显示提交..._ &mdash; 快速查找特定提交
- 以及更多...

## 菜单和工具栏 [#](#菜单和工具栏- '菜单和工具栏')

- 提供[可自定义](#菜单和工具栏设置- '跳转到菜单和工具栏设置')的设置，以控制 GitLens 命令在 VS Code 菜单和工具栏中的显示位置

## 模式 (Modes) [#](#模式- '模式')

- 允许您定义自定义模式，这些模式可以快速切换一组 GitLens 设置
- 例如，可以有一个“极简”模式通过一个命令关闭所有不必要的 UI 元素

# GitLens 设置 [#](#gitlens-设置- 'GitLens 设置')

GitLens 提供了广泛的设置，允许您根据自己的喜好定制其行为。许多这些设置可以通过集成的 **GitLens 设置** 编辑器以交互方式进行配置。

## 配置 [#](#配置- '配置')

要配置 GitLens，请运行 _GitLens: 打开设置_ 命令。

<p align="center">
  <img src="./images/docs/settings.png" alt="GitLens 设置" />
</p>

此外，您还可以通过[用户设置](https://code.visualstudio.com/docs/getstarted/settings '打开用户设置')文件配置 GitLens。

## 常规设置 [#](#常规设置- '常规设置')

| 名称                             | 描述                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `gitlens.insiders`               | 指定是否订阅 GitLens 的开发者内部预览版 (Insiders)                            |
| `gitlens.showLabels`             | 指定是否在视图和菜单中显示标签                                                |
| `gitlens.statusBar.enabled`      | 指定是否启用 GitLens 状态栏项                                                 |
| `gitlens.views.repositories.location` | 指定 _仓库_ 视图在侧边栏中的位置                                         |

## 当前行 Blame 设置 [#](#当前行-blame-设置- '当前行 Blame 设置')

| 名称                           | 描述                                                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gitlens.currentLine.enabled`  | 指定是否在当前行末尾显示 blame 注释                                                                                                                                                                                            |
| `gitlens.currentLine.fontFamily` | 指定当前行 blame 注释的字体系列（如果未指定，则使用编辑器的字体系列）                                                                                                                                                       |
| `gitlens.currentLine.format`   | 指定当前行 blame 注释的格式。参见 GitLens 文档中的 [_提交令牌 (Commit Tokens)_](https://github.com/gitkraken/vscode-gitlens/wiki/Custom-Formatting#commit-tokens)。日期格式由 `gitlens.currentLine.dateFormat` 设置控制 |
| `gitlens.currentLine.dateFormat` | 指定如何格式化绝对日期（例如使用 `${date}` 令牌）。有关支持的格式，请参阅 [Moment.js 文档](https://momentjs.com/docs/#/displaying/format/)                                                                                 |
| `gitlens.currentLine.scrollable` | 指定当前行 blame 注释是否可随当前行滚动                                                                                                                                                                                      |

## Git CodeLens 设置 [#](#git-codelens-设置- 'Git CodeLens 设置')

| 名称                            | 描述                                                                                                                                                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.codeLens.enabled`      | 指定是否在编辑器中显示 Git 代码透镜 (CodeLens)                                                                                                                                                                                      |
| `gitlens.codeLens.recentChange.enabled` | 指定是否显示最近更改的代码透镜                                                                                                                                                                                                      |
| `gitlens.codeLens.recentChange.command` | 指定点击最近更改代码透镜时要运行的命令<br /><br />`null` &mdash; 不运行任何命令<br />`gitlens.showQuickCommitDetails` &mdash; 显示当前提交详情<br />`gitlens.diffWithPrevious` &mdash; 比较当前提交与上一个版本<br />以及更多... |
| `gitlens.codeLens.authors.enabled` | 指定是否显示作者数量的代码透镜                                                                                                                                                                                                      |
| `gitlens.codeLens.authors.command` | 指定点击作者数量代码透镜时要运行的命令<br /><br />`null` &mdash; 不运行任何命令<br />`gitlens.toggleFileBlame` &mdash; 切换文件 blame 注释<br />以及更多...                                                                        |
| `gitlens.codeLens.scopes`       | 指定在哪些作用域下显示 Git 代码透镜<br /><br />`document` &mdash; 仅在文件顶部显示<br />`containers` &mdash; 在类、模块等上显示<br />`blocks` &mdash; 在块（函数、方法等）上显示                                                 |

## 状态栏 Blame 设置 [#](#状态栏-blame-设置- '状态栏 Blame 设置')

| 名称                           | 描述                                                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gitlens.statusBar.enabled`    | 指定是否在状态栏中显示 blame 注释                                                                                                                                                                                              |
| `gitlens.statusBar.alignment`  | 指定状态栏 blame 注释的对齐方式<br /><br />`left` &mdash; 左对齐<br />`right` &mdash; 右对齐                                                                                                                                  |
| `gitlens.statusBar.command`    | 指定点击状态栏 blame 注释时要运行的命令<br /><br />`null` &mdash; 不运行任何命令<br />`gitlens.showQuickCommitDetails` &mdash; 显示当前提交详情（默认）<br />`gitlens.toggleFileBlame` &mdash; 切换文件 blame 注释<br />以及更多... |
| `gitlens.statusBar.format`     | 指定状态栏 blame 注释的格式。参见 GitLens 文档中的 [_提交令牌 (Commit Tokens)_](https://github.com/gitkraken/vscode-gitlens/wiki/Custom-Formatting#commit-tokens)。日期格式由 `gitlens.statusBar.dateFormat` 设置控制   |
| `gitlens.statusBar.dateFormat` | 指定如何格式化绝对日期（例如使用 `${date}` 令牌）。有关支持的格式，请参阅 [Moment.js 文档](https://momentjs.com/docs/#/displaying/format/)                                                                                 |

## 悬停设置 [#](#悬停设置- '悬停设置')

| 名称                           | 描述                                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.hovers.enabled`       | 指定是否在悬停中显示 blame 和差异信息                                                                                                                            |
| `gitlens.hovers.annotations.enabled` | 指定在查看 blame 或热度图注释时是否显示详情悬停                                                                                                            |
| `gitlens.hovers.annotations.changes` | 指定在查看注释时是否在悬停中显示更改 (diff) 指示器                                                                                                         |
| `gitlens.hovers.currentLine.enabled` | 指定在当前行悬停中是否显示详情信息                                                                                                                         |
| `gitlens.hovers.currentLine.changes` | 指定在当前行悬停中是否显示更改 (diff) 指示器                                                                                                               |
| `gitlens.hovers.avatars`       | 指定是否在悬停中显示作者头像                                                                                                                                     |
| `gitlens.hovers.pullRequests.enabled` | 指定是否在悬停中显示关联的拉取请求信息。需要连接到支持的远程服务（如 GitHub）                                                                              |

## 视图设置 [#](#视图设置- '视图设置')

| 名称                        | 描述                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.views.avatars`     | 指定是否在视图中显示作者头像                                                                                                 |
| `gitlens.views.formats.commits.label` | 指定提交在视图中的标签格式                                                                                        |
| `gitlens.views.formats.commits.description` | 指定提交在视图中的描述格式                                                                                  |
| `gitlens.views.formats.files.label` | 指定文件在视图中的标签格式                                                                                        |
| `gitlens.views.formats.files.description` | 指定文件在视图中的描述格式                                                                                  |

## 仓库视图设置 [#](#仓库视图设置- '仓库视图设置')

参见 [视图设置](#视图设置- '跳转到视图设置')

| 名称                                       | 描述                                                                                                                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.views.repositories.avatars`       | 指定是否在 _仓库_ 视图中显示头像图像，而不是提交（或状态）图标                                                                                                                                                         |
| `gitlens.views.repositories.autoRefresh`   | 指定当仓库或文件系统发生更改时，是否自动刷新 _仓库_ 视图                                                                                                                                                               |
| `gitlens.views.repositories.autoReveal`    | 指定在打开文件时是否自动在 _仓库_ 视图中展开并选中该仓库                                                                                                                                                             |
| `gitlens.views.repositories.branches.layout` | 指定 _仓库_ 视图如何显示分支<br /><br />`list` &mdash; 将分支显示为列表<br />`tree` &mdash; 当分支名称包含斜杠 `/` 时，将分支显示为树                                                                                |
| `gitlens.views.repositories.compact`       | 指定是否在 _仓库_ 视图中以紧凑密度显示                                                                                                                                                                                 |
| `gitlens.views.repositories.files.layout`  | 指定 _仓库_ 视图如何显示文件<br /><br />`auto` &mdash; 根据文件数量自动在 `tree` 或 `list` 之间切换<br />`list` &mdash; 将文件显示为列表<br />`tree` &mdash; 将文件显示为树                                            |
| `gitlens.views.repositories.showBranches`  | 指定是否在 _仓库_ 视图中显示每个仓库的分支                                                                                                                                                                             |
| `gitlens.views.repositories.showCommits`   | 指定是否在 _仓库_ 视图中显示每个仓库当前分支的提交                                                                                                                                                                     |
| `gitlens.views.repositories.showRemotes`   | 指定是否在 _仓库_ 视图中显示每个仓库的远程仓库                                                                                                                                                                         |
| `gitlens.views.repositories.showStashes`   | 指定是否在 _仓库_ 视图中显示每个仓库的暂存                                                                                                                                                                             |
| `gitlens.views.repositories.showTags`      | 指定是否在 _仓库_ 视图中显示每个仓库的标签                                                                                                                                                                             |

## 分支视图设置 [#](#分支视图设置- '分支视图设置')

参见 [视图设置](#视图设置- '跳转到视图设置')

| 名称                                  | 描述                                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gitlens.views.branches.avatars`      | 指定是否在 _分支_ 视图中显示头像图像，而不是提交（或状态）图标                                                                                               |
| `gitlens.views.branches.branches.layout` | 指定 _分支_ 视图如何显示分支<br /><br />`list` &mdash; 将分支显示为列表<br />`tree` &mdash; 将分支显示为树                                                  |
| `gitlens.views.branches.reveal`       | 指定是否在 _分支_ 视图中显示分支，否则它们将在 _仓库_ 视图中显示                                                                                             |

## 侧栏 Blame 设置 [#](#侧栏-blame-设置- '侧栏 Blame 设置')

| 名称                                | 描述                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gitlens.blame.avatars`             | 指定是否在侧栏 blame 注释中显示头像图像                                                                                                                                                                                        |
| `gitlens.blame.compact`             | 指定是否合并（去重）匹配的相邻侧栏 blame 注释                                                                                                                                                                                  |
| `gitlens.blame.dateFormat`          | 指定如何格式化绝对日期（例如使用 `${date}` 令牌）。有关支持的格式，请参阅 [Moment.js 文档](https://momentjs.com/docs/#/displaying/format/)                                                                                 |
| `gitlens.blame.format`              | 指定侧栏 blame 注释的格式。参见 GitLens 文档中的 [_提交令牌 (Commit Tokens)_](https://github.com/gitkraken/vscode-gitlens/wiki/Custom-Formatting#commit-tokens)。日期格式由 `gitlens.blame.dateFormat` 设置控制         |
| `gitlens.blame.heatmap.enabled`     | 指定是否在侧栏 blame 注释中提供热度图指示器                                                                                                                                                                                   |
| `gitlens.blame.toggleMode`          | 指定侧栏 blame 注释的切换方式<br /><br />`file` &mdash; 单独切换每个文件<br />`window` &mdash; 切换整个窗口，即一次切换所有文件                                                                                                |

## 侧栏更改设置 [#](#侧栏-更改-设置- '侧栏 更改 设置')

| 名称                         | 描述                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.changes.locations`  | 指定侧栏更改注释的指示器显示位置<br /><br />`gutter` &mdash; 添加侧栏指示器<br />`overview` &mdash; 在概览标尺（滚动条）中添加装饰              |
| `gitlens.changes.toggleMode` | 指定侧栏更改注释的切换方式<br /><br />`file` &mdash; 单独切换每个文件<br />`window` &mdash; 切换整个窗口，即一次切换所有文件                    |

## 侧栏热度图设置 [#](#侧栏-热度图-设置- '侧栏 热度图 设置')

| 名称                           | 描述                                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.heatmap.ageThreshold` | 指定最新更改的年龄（天数），超过该期限后侧栏热度图注释将显示为冷色而非热色                                                                                              |
| `gitlens.heatmap.locations`    | 指定侧栏热度图注释的指示器显示位置<br /><br />`gutter` &mdash; 添加侧栏指示器<br />`overview` &mdash; 在概览标尺（滚动条）中添加装饰                                     |
| `gitlens.heatmap.toggleMode`   | 指定侧栏热度图注释的切换方式<br /><br />`file` &mdash; 单独切换每个文件<br />`window` &mdash; 切换整个窗口，即一次切换所有文件                                          |

## Git 命令面板设置 [#](#git-命令面板-设置- 'Git 命令面板 设置')

| 名称                                              | 描述                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `gitlens.gitCommands.closeOnFocusOut`             | 指定在失去焦点时是否关闭 _Git 命令面板_ （如果不是，请按 `ESC` 关闭）                                 |
| `gitlens.gitCommands.sortBy`                      | 指定 Git 命令在 _Git 命令面板_ 中的排序方式<br /><br />`name` &mdash; 按名称排序<br />`usage` &mdash; 按最后使用日期排序 |

## 终端链接设置 [#](#终端链接-设置- '终端链接 设置')

| 名称                            | 描述                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.terminalLinks.enabled` | 指定是否启用终端链接 &mdash; 在集成终端中自动生成链接，以快速跳转到提交、分支、标签等的详细信息                               |

## 远程托管商集成设置 [#](#远程托管商集成-设置- '远程托管商集成 设置')

| 名称                           | 描述                                                                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.integrations.enabled` | 指定是否启用与任何支持的远程服务的丰富集成                                                                                                                                             |
| `gitlens.remotes`              | 指定自定义远程服务，以便与 Git 远程匹配，自动检测自定义域名或为自定义远程服务提供支持                                                                                                  |

## 日期和时间设置 [#](#日期和时间-设置- '日期和时间 设置')

| 名称                             | 描述                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.defaultDateFormat`      | 指定默认情况下绝对日期的格式格式。有关支持的格式，请参阅 [Moment.js 文档](https://momentjs.com/docs/#/displaying/format/)                                                                                                |
| `gitlens.defaultDateLocale`      | 指定用于日期格式化的语言环境（[BCP 47 语言标签](https://en.wikipedia.org/wiki/IETF_language_tag)），默认为 VS Code 语言环境。使用 `system` 随系统语言环境，或选择特定语言环境，如 `zh-CN` &mdash; 简体中文。 |
| `gitlens.defaultDateSource`      | 指定提交日期应使用作者日期还是提交日期                                                                                                                                                                                       |
| `gitlens.defaultDateStyle`       | 指定默认情况下日期的显示样式                                                                                                                                                                                                 |

## 键盘快捷键设置 [#](#键盘快捷键-设置- '键盘快捷键 设置')

| 名称             | 描述                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gitlens.keymap` | 指定用于 GitLens 快捷键的键映射<br /><br />`alternate` &mdash; 添加一组以 `Alt`（macOS 上为 `⌥`）开头的替代快捷键<br />`chorded` &mdash; 添加一组以 `Ctrl+Shift+G`（macOS 上为 `⇧⌘G`）开头的和弦快捷键<br />`none` &mdash; 禁用快捷键 |

## 模式设置 [#](#模式设置- '模式 设置')

| 名称                               | 描述                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| `gitlens.mode.active`              | 指定当前的活动 GitLens 模式（如果有）                           |
| `gitlens.modes`                    | 指定用户定义的 GitLens 模式                                     |

## 自动链接设置 [#](#自动链接设置- '自动链接 设置')

| 名称                | 描述                                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.autolinks` | 指定提交消息中指向外部资源的自动链接。使用 `<num>` 作为引用编号的变量。例如：`"gitlens.autolinks": [{ "prefix": "JIRA-", "url": "https://jira.company.com/issue?query=<num>" }]`                   |

## 杂项设置 [#](#杂项设置- '杂项 设置')

| 名称                                                             | 描述                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `gitlens.defaultGravatarsStyle`                                  | 指定 Gravatar 默认（备选）图像的样式                                                                                      |
| `gitlens.outputLevel`                                            | 指定发送到 GitLens 输出通道的信息级别                                                                                     |
| `gitlens.showWelcomeOnInstall`                                   | 指定是否在首次安装时显示欢迎（快速设置）体验                                                                              |
| `gitlens.showWhatsNewAfterUpgrades`                              | 指定是否在升级到新功能发布版本后显示“新特性”通知                                                                          |
| `gitlens.sortBranchesBy`                                         | 指定快速挑选菜单和视图中分支的排序方式                                                                                    |
| `gitlens.sortContributorsBy`                                     | 指定快速挑选菜单和视图中贡献者的排序方式                                                                                  |
| `gitlens.sortTagsBy`                                             | 指定快速挑选菜单和视图中标签的排序方式                                                                                    |
| `gitlens.advanced.abbreviatedShaLength`                          | 指定缩写的提交 SHA (shas) 的长度                                                                                          |
| `gitlens.advanced.quickPick.closeOnFocusOut`                     | 指定在失去焦点时是否关闭快速挑选菜单                                                                                      |
| `gitlens.advanced.repositorySearchDepth`                         | 指定搜索仓库的文件夹深度                                                                                                  |

## 支持主题的颜色 [#](#支持主题的颜色- '支持主题的颜色')

GitLens 定义了一组支持主题的颜色，可以由 VS Code 主题提供，或者由用户使用 [`workbench.colorCustomizations`](https://code.visualstudio.com/docs/getstarted/themes#_customize-a-color-theme) 直接提供。

| 名称                                       | 描述                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `gitlens.gutterBackgroundColor`            | 指定侧栏 blame 注释的背景颜色                                                      |
| `gitlens.gutterForegroundColor`            | 指定侧栏 blame 注释的前景颜色                                                      |
| `gitlens.gutterUncommittedForegroundColor` | 指定侧栏 blame 注释中未提交行的前景颜色                                            |
| `gitlens.trailingLineBackgroundColor`      | 指定行末 blame 注释的背景颜色                                                      |
| `gitlens.trailingLineForegroundColor`      | 指定行末 blame 注释的前景颜色                                                      |
| `gitlens.lineHighlightBackgroundColor`     | 指定 blame 注释中关联行高亮的背景颜色                                              |
| `gitlens.lineHighlightOverviewRulerColor`  | 指定 blame 注释中关联行高亮的概览标尺颜色                                          |

# 贡献者 &#x1F64F;&#x2764;

衷心感谢为这个项目做出贡献的人们：

- Zeeshan Adnan ([@zeeshanadnan](https://github.com/zeeshanadnan)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=zeeshanadnan)
- Alex ([@deadmeu](https://github.com/deadmeu)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=deadmeu)
- Abdulrahman (Abdu) Assabri ([@abdusabri](https://github.com/abdusabri)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=abdusabri)
- Grey Baker ([@greysteil](https://github.com/greysteil)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=greysteil)
- Loris Bettazza ([@Pustur](https://github.com/Pustur)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=Pustur)
- Brian Bolte ([@bolte-17](https://github.com/bolte-17)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=bolte-17)
- Zach Boyle ([@zaboyle](https://github.com/zaboyle)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=zaboyle)
- Tony Brix ([@UziTech](https://github.com/UziTech)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=UziTech)
- Lee Chang ([@MeltingMosaic](https://github.com/MeltingMosaic)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=MeltingMosaic)
- Amanda Cameron ([@AmandaCameron](https://github.com/AmandaCameron)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=AmandaCameron)
- Martin Campbell ([@martin-css](https://github.com/martin-css)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=martin-css)
- Brett Cannon ([@brettcannon](https://github.com/brettcannon)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=brettcannon)
- Andrea Cigana ([@ciganandrea](https://github.com/ciganandrea)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=ciganandrea)
- Ash Clarke ([@ashclarke](https://github.com/ashclarke)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=ashclarke)
- Travis Collins ([@TravisTX](https://github.com/TravisTX)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=TravisTX)
- Matt Cooper ([@vtbassmatt](https://github.com/vtbassmatt)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=vtbassmatt)
- Andrii Dieiev ([@IllusionMH](https://github.com/IllusionMH)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=IllusionMH)
- egfx-notifications ([@egfx-notifications](https://github.com/egfx-notifications)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=egfx-notifications)
- Segev Finer ([@segevfiner](https://github.com/segevfiner)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=segevfiner)
- Cory Forsyth ([@bantic](https://github.com/bantic)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=bantic)
- John Gee ([@shadowspawn](https://github.com/shadowspawn)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=shadowspawn)
- Geoffrey ([@g3offrey](https://github.com/g3offrey)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=g3offrey)
- Guillaume Rozan ([@grozan](https://github.com/grozan)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=grozan)
- Guillem González Vela ([@guillemglez](https://github.com/guillemglez)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=guillemglez)
- Vladislav Guleaev ([@vguleaev](https://github.com/vguleaev)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=vguleaev)
- Dmitry Gurovich ([@yrtimiD](https://github.com/yrtimiD)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=yrtimiD)
- Ken Hom ([@kh0m](https://github.com/kh0m)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=kh0m)
- Yukai Huang ([@Yukaii](https://github.com/Yukaii)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=Yukaii)
- Justin Hutchings ([@jhutchings1](https://github.com/jhutchings1)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=jhutchings1)
- Roy Ivy III ([@rivy](https://github.com/rivy)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=rivy)
- Helmut Januschka ([@hjanuschka](https://github.com/hjanuschka)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=hjanuschka)
- Nils K ([@septatrix](https://github.com/septatrix)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=septatrix)
- Chris Kaczor ([@ckaczor](https://github.com/ckaczor)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=ckaczor)
- Allan Karlson ([@bees4ever](https://github.com/bees4ever)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=bees4ever)
- Mathew King ([@MathewKing](https://github.com/MathewKing)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=MathewKing)
- Lior Kletter ([@Git-Lior](https://github.com/Git-Lior)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=Git-Lior)
- Andrei Korigodski ([@korigod](https://github.com/korigod)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=korigod)
- Kwok ([@mankwok](https://github.com/mankwok)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=mankwok)
- Marc Lasson ([@mlasson](https://github.com/mlasson)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=mlasson)
- John Letey ([@johnletey](https://github.com/johnletey)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=johnletey)
- Stanislav Lvovsky ([@slavik-lvovsky](https://github.com/slavik-lvovsky)) &mdash; [贡献]((https://github.com/gitkraken/vscode-gitlens/commits?author=slavik-lvovsky)
- Peng Lyu ([@rebornix](https://github.com/rebornix)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=rebornix)
- Cédric Malard ([@cmalard](https://github.com/cmalard)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=cmalard)
- Asif Kamran Malick ([@akmalick](https://github.com/akmalick)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=akmalick)
- Mark Molinaro ([@markjm](https://github.com/markjm)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=markjm)
- Ahmadou Waly Ndiaye ([@sir-kain](https://github.com/sir-kain)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=sir-kain)
- Nguyen Long Nhat ([@torn4dom4n](https://github.com/torn4dom4n)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=torn4dom4n)
- Aurelio Ogliari ([@nobitagit](https://github.com/nobitagit)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=nobitagit)
- Raaj Patil ([@arrpee](https://github.com/arrpee)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=arrpee)
- Connor Peet ([@connor4312](https://github.com/connor4312)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=connor4312)
- Maxim Pekurin ([@pmaxim25](https://github.com/pmaxim25)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=pmaxim25)
- Arunprasad Rajkumar ([@arajkumar](https://github.com/arajkumar)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=arajkumar)
- David Rees ([@studgeek](https://github.com/studgeek)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=studgeek)
- Rickard ([@rickardp](https://github.com/rickardp)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=rickardp)
- Johannes Rieken ([@jrieken](https://github.com/jrieken)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=jrieken)
- Guillaume Rozan ([@rozangu1](https://github.com/rozangu1)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=rozangu1)
- ryenus ([@ryenus](https://github.com/ryenus)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=ryenus)
- Andrew Savage ([@andrewsavage1](https://github.com/andrewsavage1)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=andrewsavage1)
- Zack Schuster ([@zackschuster](https://github.com/zackschuster)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=zackschuster)
- Ahmadali Shafiee ([@ahmadalli](https://github.com/ahmadalli)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=ahmadalli)
- Shashank Shastri ([@Shashank-Shastri](https://github.com/Shashank-Shastri)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=Shashank-Shastri)
- Oleg Solomka ([@legomushroom](https://github.com/legomushroom)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=legomushroom)
- Miguel Solorio ([@misolori](https://github.com/misolori)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=misolori)
- SpaceEEC ([@SpaceEEC](https://github.com/SpaceEEC)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=SpaceEEC)
- Skybbles ([@Luxray5474](https://github.com/Luxray5474)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=Luxray5474)
- Brendon Smith ([@br3ndonland](https://github.com/br3ndonland)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=br3ndonland)
- sueka ([@sueka](https://github.com/sueka)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=sueka)
- Mike Surcouf ([@mikes-gh](https://github.com/mikes-gh)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=mikes-gh)
- Alexey Svetliakov ([@asvetliakov](https://github.com/asvetliakov)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=asvetliakov)
- Takashi Tamura ([@tamuratak](https://github.com/tamuratak)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=tamuratak)
- Andy Tang ([@thewindsofwinter](https://github.com/thewindsofwinter)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=thewindsofwinter)
- Dmitry Ulupov ([@dimaulupov](https://github.com/dimaulupov)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=dimaulupov)
- Alexey Vasyukov ([@notmedia](https://github.com/notmedia)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=notmedia)
- Ivan Volzhev ([@ivolzhevbt](https://github.com/ivolzhevbt)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=ivolzhevbt)
- x13machine ([@x13machine](https://github.com/x13machine)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=x13machine)
- Alwin Wang ([@alwinw](https://github.com/alwinw)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=alwinw)
- Ian Wilkinson ([@sgtwilko](https://github.com/sgtwilko)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=sgtwilko)
- Adaex Yang ([@adaex](https://github.com/adaex)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=adaex)
- Yan Zhang ([@Eskibear](https://github.com/Eskibear)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=Eskibear)
- Zyck ([@qzyse2017](https://github.com/qzyse2017)) &mdash; [贡献](https://github.com/gitkraken/vscode-gitlens/commits?author=qzyse2017)

另外特别感谢提供支持、测试、头脑风暴等帮助的人们：

- Brian Canzanella ([@bcanzanella](https://github.com/bcanzanella))
- Matt King ([@KattMingMing](https://github.com/KattMingMing))

当然还有优秀的 [vscode](https://github.com/Microsoft/vscode/graphs/contributors) 团队！

# 许可证 (License)

此仓库包含 OSS 许可和非 OSS 许可的文件。

任何名为 "plus" 的目录中或其下的所有文件均受 LICENSE.plus 保护。

其余文件遵循 MIT 许可证。

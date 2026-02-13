[English](./README.md) | 简体中文

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

# GitLens

[GitLens](https://gitlens.amod.io) 是一个用于 [Visual Studio Code](https://code.visualstudio.com) 的[开源](https://github.com/gitkraken/vscode-gitlens)扩展。

GitLens 简单地帮助您**更好地理解代码**。快速窥见谁、为什么以及什么时候更改了一行或是一个代码块。追溯历史，**获得进一步的洞察**，了解代码是如何以及为什么演变的。毫不费力地探索代码库的历史和演变。

GitLens 极其**强大**、**功能丰富**，并且[高度可定制](#gitlens-%E8%AE%BE%E7%BD%AE)以满足您的需求。如果您觉得 CodeLens 太碍事，或者觉得当前行 blame 注释干扰视线 —— 没问题，您可以通过交互式的 [_GitLens 设置_ 编辑器](#%E9%85%8D%E7%BD%AE)轻松关闭它们或更改其行为。

以下是 GitLens 提供的一些**功能**：

- 轻松的[**修订版本导航**](#修订版本导航)（向前和向后）浏览文件历史记录
- 位于行末的、不引人注目的[**当前行 blame**](#当前行-blame)注释，显示最后修改该行的提交和作者，通过[**悬停**](#悬停)可访问更详细的 blame 信息
- [**作者身份 CodeLens**](#git-codelens)，在文件顶部和/或代码块上显示最近的提交和作者数量
- [**状态栏 blame**](#状态栏-blame)注释，显示最后修改当前行的提交和作者
- 按需在编辑器侧边栏显示的 **文件注释**，包括：
  - [**Blame**](#侧边栏-blame) —— 显示最后修改文件的每一行的提交和作者
  - [**更改**](#侧边栏更改) —— 高亮显示任何本地（未发布）的更改或由最近一次提交更改的行
  - [**热力图**](#侧边栏热力图) —— 显示行更改的时间远近（冷热程度）
- 许多丰富的 **侧边栏视图**：
  - [**_Commits_ 视图**](#commits-视图) —— 可视化、探索和管理 Git 提交
  - [**_Repositories_ 视图**](#repositories-视图) —— 可视化、探索和管理 Git 仓库
  - [**_File History_ 视图**](#file-history-视图) —— 可视化、导航和探索当前文件或所选行的修订历史
  - [**_Branches_ 视图**](#branches-视图) —— 可视化、探索和管理 Git 分支
  - [**Search & Compare 视图**](#search--compare-视图) —— 搜索和探索提交历史，或可视化分支、标签、提交之间的比较
- [**Git 命令面板**](#git-命令面板) —— 提供引导式（分步）访问许多常见的 Git 命令
- 用户友好的[**交互式变基 (rebase) 编辑器**](#交互式变基编辑器) —— 轻松配置交互式变基会话
- 以及更多 😁

# GitLens+ 介绍

当您使用免费账户登录时，GitLens+ 会添加全新的、完全可选的功能，增强您当前的 GitLens 体验。

## 可视化文件历史视图

<p align="center">
  <img src="./images/docs/visual-file-history-hover.png" alt="可视化文件历史视图" />
</p>

可视化文件历史视图允许您快速查看文件的演变，包括何时进行了更改、更改有多大以及谁进行了更改。

## 工作区 (Worktrees) 视图

<p align="center">
  <img src="./images/docs/worktrees-view.png" alt="工作区视图" />
</p>

工作区允许您轻松地同时处理仓库的不同分支。

# 配置

<p align="center">
  <img src="./images/docs/settings.png" alt="GitLens 交互式设置" />
</p>

GitLens 提供了一个丰富的**交互式设置编辑器**，这是一个易于使用的界面，用于配置 GitLens 的许多强大功能。可以通过 [_命令面板_](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) 中的 _GitLens: Open Settings_ (`gitlens.showSettingsPage`) 命令来访问它。

---

*注：本 README 还在持续汉化中，更多详细参数请参考英文原文。*

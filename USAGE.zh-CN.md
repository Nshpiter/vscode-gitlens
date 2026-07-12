# GitLens 个人版 · 使用说明（12.2.0）

在 GitLens **12 底盘**上，吸收官方 **v17–18** 里对个人有用的能力（含原 Plus 思路），并做中文引导。

## 安装

```powershell
code --install-extension ".\gitlens-12.2.0.vsix" --force
```

然后 `Developer: Reload Window`。扩展名：**GitLens 个人版**。

---

## 30 秒上手

1. **行追溯**：光标放在代码行 → 行尾灰字（谁 / 何时 / 说明）  
2. **提交历史**：侧栏「提交」→ **单击**打开详情  
3. **文件历史**：侧栏「文件历史」跟当前文件  

---

## 从官方抄来的实用能力（12.2）

| 能力 | 来源 | 怎么用 |
|------|------|--------|
| **复制提交补丁** | 官方 Copy Changes (Patch) | 详情页「复制补丁」或提交右键 / 命令面板 |
| **复制工作区补丁** | 官方 WIP Patch | 命令面板 / 源代码管理标题 / 首页链接 |
| **软撤销最近提交** | 官方 Graph Undo Commit | `git reset --soft HEAD~1`，改动留在暂存区 |
| **详情内打开/定位文件** | 官方 Inspect 文件操作 | 文件行旁「打开」「定位」 |
| **大仓库延迟加载文件详情** | 官方 17.1 | 默认开，列表更快 |
| **精简 activation** | 官方 18 | 启动更轻 |
| **无账号全功能门禁** | 个人版 | Timeline 等不锁 |

---

## 提交详情页

- 上一条 / 下一条 / 刷新  
- **复制 SHA / 复制说明 / 复制补丁**  
- 在远程打开  
- 文件列表：单击 = diff；「打开」= 工作区文件；「定位」= 资源管理器  

---

## 侧栏默认

| 视图 | 状态 |
|------|------|
| 提交、文件历史 | 展开 |
| 分支、贡献者、首页、可视化历史 | 折叠 |
| 其它 | 隐藏（可手动打开） |

---

## 命令面板搜这些中文

- `复制提交补丁` / `复制工作区变更补丁`  
- `软撤销最近提交`  
- `Git 命令面板`  
- `切换行追溯` / `切换 Git 代码透镜`  
- `显示提交详情`  

---

## 重打包

```powershell
node scripts/personalize-defaults.js
node scripts/localize-zh.js
node scripts/register-personal-features.js
npx --yes @vscode/vsce package --no-dependencies --no-yarn
```

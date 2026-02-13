## 可视化交互式变基

<p align="center">
  <img src="../../../images/docs/rebase.gif" alt="交互式变基编辑器"/>
</p>

只需拖拽即可重新排列提交，并选择您想要编辑 (edit)、合并 (squash) 或删除 (drop) 的提交。

要直接从终端使用此功能（例如运行 `git rebase -i` 时）：

- 将 VS Code 设置为您的默认 Git 编辑器
  - `git config --global core.editor "code --wait"`
- 或者，仅影响变基操作，将 VS Code 设置为您的 Git 变基编辑器
  - `git config --global sequence.editor "code --wait"`

> 要使用 VS Code 的 Insiders 版本，请将上述命令中的 `code` 替换为 `code-insiders`

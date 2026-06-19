# Git 压缩重复提交 (Squash Duplicate Commits)

## 场景

分支上有 3 个内容完全相同的 commit（`refactor: reorder helper functions`），需要压缩为 1 个。

```
a873d2a fix: find last non-empty text node
4b79ac2 refactor: reorder helper functions  ← 重复
f5abd15 refactor: reorder helper functions  ← 重复
878cb64 refactor: reorder helper functions  ← 保留 merge message
74ff460 test: add inline code edge case tests
```

## 思路

1. 确定 rebase 基点（通常是 `master` 或分支起点）
2. 用交互式 rebase 将重复提交标记为 `fixup`，会自动融合到前一个 pick
3. 用 `sed` 脚本化操作，避免手动编辑交互式编辑器

## 命令

```bash
# 查看当前分支所有 commit
git log --oneline master..HEAD

# squash：把 f5abd15 和 4b79ac2 标记为 fixup，融入 878cb64
GIT_SEQUENCE_EDITOR="sed -i \
  's/^pick f5abd15/fixup f5abd15/; \
   s/^pick 4b79ac2/fixup 4b79ac2/'" \
  git rebase -i master

# 验证结果
git log --oneline master..HEAD

# 推送到远程（rebase 后需要 force push）
git push --force-with-lease
```

## 结果

```
ddfbc18 fix: find last non-empty text node
8f8d57b refactor: reorder helper functions  ← 合并后保留一条
74ff460 test: add inline code edge case tests
94fc3da fix: skip inlineCode nodes
c1dd139 test: add backtick edge case tests
2769b84 feat: improve no-space-in-inline-code
```

## 原理

- `fixup` = 合并到上一个 commit，丢弃自己的 commit message
- `squash` = 合并到上一个 commit，保留并允许编辑 commit message
- `GIT_SEQUENCE_EDITOR` 环境变量覆盖交互式编辑器，用 `sed` 直接修改 rebase-todo 文件
- `--force-with-lease` 比 `--force` 更安全，会检查远程是否有其他人推送过

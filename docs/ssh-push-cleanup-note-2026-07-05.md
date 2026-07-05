# SSH Push 收尾备忘（2026-07-05）

## 现在是什么状态
- 这个仓库的 `origin` 已切到 SSH：`git@github.com:Baishijuju/duo-wish-board-app.git`
- 公司电脑本机已生成一把专用 SSH key：
	- 私钥：`C:\Users\YUETJ\.ssh\id_ed25519`
	- 公钥：`C:\Users\YUETJ\.ssh\id_ed25519.pub`
- 该公钥已经加到 GitHub 账号，可正常 `git push`

## 之后日常怎么用
- 继续开发时，直接正常使用：`git push`
- 如需先确认远端：`git remote -v`
- 如需确认 SSH 是否还有效：`ssh -T -i $HOME\.ssh\id_ed25519 git@github.com`

## 开发结束后要不要删
- 如果后面还会在这台电脑继续维护这个个人仓库：可以先保留
- 如果只是这次临时开发，用完建议删掉，避免公司电脑长期保留个人 SSH 凭据

## 最后怎么收尾
### 1. 先从 GitHub 删除这把 SSH key
- GitHub -> Settings -> SSH and GPG keys
- 找到这次新增的 key（建议名称类似：`company-laptop-2026-07-05`）
- 点击 Delete

### 2. 再删本机密钥文件
PowerShell：

```powershell
Remove-Item $HOME\.ssh\id_ed25519
Remove-Item $HOME\.ssh\id_ed25519.pub
```

### 3. 如需连已信任主机记录一起清理
这步不是必须，`known_hosts` 只记录你信任过 GitHub 主机，不等于登录凭据。

```powershell
Remove-Item $HOME\.ssh\known_hosts
```

## 判断有没有收尾干净
- GitHub 的 SSH keys 页面里，看不到这把 key
- 本机 `C:\Users\YUETJ\.ssh\` 里没有 `id_ed25519` 和 `id_ed25519.pub`
- 之后再执行 `git push` 会因为没有 SSH 凭据而失败，这说明本机凭据确实已撤销

## 这次为什么能 push 成功
- HTTPS 到 GitHub `443` 端口不通，所以之前 `git push` 一直超时 / reset
- SSH 到 GitHub `22` 端口是通的
- 最后改成 SSH remote 并配置本机专用 key 后，push 恢复正常

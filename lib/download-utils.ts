/**
 * 安全下载文件的工具函数
 * 处理各种浏览器兼容性问题和下载失败的情况
 */
export async function safeDownloadFile(blob: Blob, filename: string): Promise<boolean> {
  try {
    console.log(`准备下载文件: ${filename}, 大小: ${blob.size} 字节, 类型: ${blob.type}`)

    // 创建Blob URL
    const url = URL.createObjectURL(blob)

    // 方法1: 使用<a>元素下载
    try {
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.style.display = "none"
      document.body.appendChild(link)

      // 触发点击
      link.click()

      // 清理
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)

      return true
    } catch (error) {
      console.error("方法1下载失败，尝试备用方法:", error)

      // 方法2: 使用window.open
      try {
        const newWindow = window.open(url, "_blank")
        if (!newWindow) {
          throw new Error("无法打开新窗口")
        }

        // 清理
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)

        return true
      } catch (error2) {
        console.error("方法2下载失败:", error2)

        // 方法3: 使用iframe
        try {
          const iframe = document.createElement("iframe")
          iframe.style.display = "none"
          iframe.src = url
          document.body.appendChild(iframe)

          // 清理
          setTimeout(() => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(url)
          }, 1000)

          return true
        } catch (error3) {
          console.error("所有下载方法均失败:", error3)
          URL.revokeObjectURL(url)
          return false
        }
      }
    }
  } catch (error) {
    console.error("下载初始化失败:", error)
    return false
  }
}

/**
 * 创建备用下载按钮
 * 当自动下载失败时显示
 */
export function createBackupDownloadButton(blob: Blob, filename: string): void {
  // 创建Blob URL
  const url = URL.createObjectURL(blob)

  // 创建下载按钮
  const downloadButton = document.createElement("button")
  downloadButton.innerText = "点击此处下载文档"
  downloadButton.className = "bg-primary text-primary-foreground px-4 py-2 rounded-md mt-2"
  downloadButton.onclick = () => {
    window.open(url, "_blank")
  }

  // 显示备用下载按钮
  const downloadContainer = document.createElement("div")
  downloadContainer.id = "backup-download"
  downloadContainer.className = "fixed top-4 right-4 z-50 bg-background p-4 rounded-md shadow-lg border"
  downloadContainer.innerHTML = "<p class='mb-2'>自动下载失败，请使用手动下载：</p>"
  downloadContainer.appendChild(downloadButton)
  document.body.appendChild(downloadContainer)

  // 30秒后自动移除
  setTimeout(() => {
    if (document.body.contains(downloadContainer)) {
      document.body.removeChild(downloadContainer)
    }
    URL.revokeObjectURL(url)
  }, 30000)
}

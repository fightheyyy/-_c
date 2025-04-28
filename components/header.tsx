"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoonIcon, SunIcon, Menu, User } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-provider"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ApiStatusIndicator } from "@/components/api-status-indicator"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const routes = [
    {
      href: "/dashboard",
      label: "看板",
      active: pathname === "/dashboard",
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">巡检记录助手</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`transition-colors hover:text-foreground/80 ${
                  route.active ? "text-foreground" : "text-foreground/60"
                }`}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-xl">巡检记录助手</span>
            </Link>
            <nav className="mt-6 flex flex-col space-y-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`text-sm font-medium ${route.active ? "text-foreground" : "text-foreground/60"}`}
                  onClick={() => setOpen(false)}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="mr-6 flex items-center space-x-2 md:hidden">
              <span className="font-bold">巡检记录助手</span>
            </Link>
          </div>

          {/* 添加API状态指示器 */}
          <ApiStatusIndicator />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                {theme === "dark" ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>浅色</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>深色</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>系统</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <User className="h-4 w-4" />
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">登录</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

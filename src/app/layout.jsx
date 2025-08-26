import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Поддержка в Telegram за 30 секунд — бережный бот (анонимно)',
  description: 'Короткие практики, дыхание и диалог без осуждения. Анонимно, без регистрации.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

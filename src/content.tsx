// content.tsx
import { useEffect } from "react"

const Content = () => {
  useEffect(() => {
    document.body.style.border = "5px solid red"
  }, [])

  return null
}

export default Content
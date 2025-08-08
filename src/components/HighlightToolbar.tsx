// UI components for building the toolbar interface
// Removed shadcn/ui imports
// Icons for color selection and note adding
import { Move, Palette, StickyNote } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

/**
 * Props interface for the HighlightToolbar component
 * @interface HighlightToolbarProps
 */
interface HighlightToolbarProps {
  /** Whether the toolbar is currently visible */
  isVisible: boolean
  /** Currently selected highlight color */
  selectedColor: string
  /** Callback when color is changed */
  onColorChange: (color: string) => void
  /** Callback when note icon is clicked */
  onNoteClick: () => void
  /** Callback when toolbar is moved */
  onPositionChange?: (x: number, y: number) => void
}

// Available highlight colors
const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Pink", value: "#fce7f3" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Purple", value: "#e9d5ff" }
]

export function HighlightToolbar({
  isVisible,
  selectedColor,
  onColorChange,
  onNoteClick,
  onPositionChange
}: HighlightToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = toolbarRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  // Handle dragging
  useEffect(() => {
    const handleDrag = (e: MouseEvent) => {
      if (!isDragging) return
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      const maxX = window.innerWidth - 200
      const maxY = window.innerHeight - 100
      const boundedX = Math.max(0, Math.min(newX, maxX))
      const boundedY = Math.max(0, Math.min(newY, maxY))
      setPosition({ x: boundedX, y: boundedY })
      onPositionChange?.(boundedX, boundedY)
    }
    const handleDragEnd = () => setIsDragging(false)
    if (isDragging) {
      document.addEventListener("mousemove", handleDrag)
      document.addEventListener("mouseup", handleDragEnd)
    }
    return () => {
      document.removeEventListener("mousemove", handleDrag)
      document.removeEventListener("mouseup", handleDragEnd)
    }
  }, [isDragging, dragOffset, onPositionChange])

  if (!isVisible) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[10001] bg-white shadow-lg border-2 border-gray-200 rounded-lg p-2"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "default"
      }}>
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <div
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          onMouseDown={handleDragStart}
          title="Drag to move toolbar">
          <Move className="h-4 w-4 text-gray-500" />
        </div>

        {/* Color picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100"
            title="Select highlight color">
            <div
              className="w-5 h-5 rounded border-2 border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute top-10 left-0 bg-white border rounded-lg shadow-lg p-2 z-[10002]">
              <div className="grid grid-cols-3 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                      selectedColor === color.value
                        ? "border-gray-600"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      onColorChange(color.value)
                      setShowColorPicker(false)
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Note icon */}
        <button
          onClick={onNoteClick}
          className="p-1 h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100"
          title="Click to add note to selected text">
          <StickyNote className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}

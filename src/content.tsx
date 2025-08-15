import { HighlightOverlay } from "@/components/HighlightOverlay"
import { HighlightToolbar } from "@/components/HighlightToolbar"
import { HighlightTooltip } from "@/components/HighlightTooltip"
import { getElementByXPath, HighlightStorage } from "@/lib/storage"
import type { Highlight } from "@/lib/types"
// Adopt Tailwind CSS into the Shadow DOM so utility classes work inside Plasmo's content UI
import cssText from "data-text:~styles/globals.css"
import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { Storage as PlasmoStorage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

export const getStyle = () => {
  const style = document.createElement("style")
  // Ensure CSS variables scoped to the CSUI shadow root
  style.textContent = cssText.replaceAll(":root", ":host(plasmo-csui)")
  return style
}

// CSS class name used to identify highlighted text elements
const HIGHLIGHT_CLASS = "text-highlight-extension"
// Key for storing activation state in localStorage
const ACTIVATION_STATE_KEY = "highlighter_activated"

/**
 * Main content script component that handles text highlighting functionality
 * This component is injected into web pages and manages:
 * - Extension activation state persistence
 * - Draggable toolbar display
 * - Manual text selection for highlighting
 * - Highlight creation and rendering
 * - User interactions with highlights
 */
const Content = () => {
  // State management for extension activation and UI
  // Persist activation state in extension local storage via Plasmo Storage
  const [isActivated, setIsActivated] = useStorage<boolean>({
    key: ACTIVATION_STATE_KEY,
    instance: new PlasmoStorage({ area: "local" })
  })
  const [showToolbar, setShowToolbar] = useState(false) // Controls toolbar visibility
  const [showOverlay, setShowOverlay] = useState(false) // Controls highlight creation overlay visibility
  const [showTooltip, setShowTooltip] = useState(false) // Controls highlight tooltip visibility
  const [isSelectingForNote, setIsSelectingForNote] = useState(false) // True when user clicked note icon and is selecting text
  const [selectedText, setSelectedText] = useState("") // Stores currently selected text
  const [selectedColor, setSelectedColor] = useState("#fef08a") // Currently selected highlight color
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 }) // Position for highlight overlay
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }) // Position for highlight tooltip
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null) // Currently active highlight for tooltip

  useEffect(() => {
    // Sync toolbar visibility with stored activation state
    const activated = Boolean(isActivated)
    setShowToolbar(activated)

    // Always load and render existing highlights regardless of activation state
    renderHighlights()

    /**
     * Handles messages from the extension popup and background script
     * Supports toggling activation state and refreshing highlights
     * @param {any} message - Message object from popup or background
     */
    const handleMessage = (message: any) => {
      console.log("messageeeeeeeeeeeeeeee")
      if (message.type === "TOGGLE_ACTIVATION") {
        const newState = !Boolean(isActivated)
        setIsActivated(newState)
        setShowToolbar(newState)

        // Reset states when deactivating
        if (!newState) {
          setIsSelectingForNote(false)
          setShowOverlay(false)
          setShowTooltip(false)
        }
      } else if (message.type === "REFRESH_HIGHLIGHTS") {
        renderHighlights()
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    /**
     * Handles text selection changes on the page
     * Only updates selectedText state, does not create highlight
     */
    const handleSelectionChange = () => {
      if (!isActivated) return
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || selection.rangeCount === 0)
        return
      const text = selection.toString().trim()
      setSelectedText(text)
    }

    /**
     * Handles mouseup event to create highlight only if selection covers the entire text node
     */
    const handleMouseUp = () => {
      if (!isActivated) return
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || selection.rangeCount === 0)
        return
      const text = selection.toString().trim()
      if (text.length < 3) return
      const range = selection.getRangeAt(0)
      // Only highlight if selection covers the entire text node
      if (
        range.startContainer.nodeType === Node.TEXT_NODE &&
        range.startContainer === range.endContainer
      ) {
        console.log(
          text,
          selection,
          range,
          range.startContainer.nodeType,
          Node.TEXT_NODE,
          range.startContainer,
          range.endContainer
        )
        const xpath = generateXPath(range.commonAncestorContainer)
        handleSaveHighlight({
          url: window.location.href,
          text: text,
          note: "",
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          xpath
        })
      }
    }

    /**
     * Handles clicks on the page
     * Shows tooltip when clicking on highlighted text (regardless of activation state)
     * Hides tooltip when clicking elsewhere
     * @param {MouseEvent} e - Mouse click event
     */
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.classList.contains(HIGHLIGHT_CLASS)) {
        e.preventDefault()
        e.stopPropagation()

        const highlightId = target.getAttribute("data-highlight-id")
        if (highlightId) {
          const highlight = HighlightStorage.getAll().find(
            (h) => h.id === highlightId
          )
          if (highlight) {
            setActiveHighlight(highlight)
            setTooltipPosition({
              x: e.clientX + window.scrollX,
              y: e.clientY + window.scrollY
            })
            setShowTooltip(true)
          }
        }
      } else {
        setShowTooltip(false)
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("click", handleClick)

    /**
     * Cleanup function to remove event listeners and Chrome API handlers
     * Prevents memory leaks when component unmounts
     */
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
      document.removeEventListener("selectionchange", handleSelectionChange)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleClick)
    }
  }, [isActivated, isSelectingForNote])

  /**
   * Handles when user clicks the note icon in the toolbar
   * Activates text selection mode for adding notes
   */
  const handleNoteClick = () => {
    setIsSelectingForNote(true)
    // Clear any existing selection and prompt user to select text
    window.getSelection()?.removeAllRanges()
  }

  /**
   * Handles saving a new highlight to storage and updating the display
   * Creates a unique ID and timestamp for the highlight before saving
   * Uses the currently selected color from the toolbar
   * @param {Omit<Highlight, "id" | "timestamp" | "color">} highlightData - The highlight data without ID, timestamp, and color
   */
  const handleSaveHighlight = (
    highlightData: Omit<Highlight, "id" | "timestamp" | "color">
  ) => {
    const highlight: Highlight = {
      ...highlightData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      color: selectedColor
    }

    HighlightStorage.save(highlight)
    // setShowOverlay(false)
    // setIsSelectingForNote(false) // Exit note selection mode

    // Clear the current text selection
    // window.getSelection()?.removeAllRanges()

    // Re-render highlights with a small delay to ensure DOM is ready
    setTimeout(() => renderHighlights(), 100)
  }

  /**
   * Handles closing the overlay without saving
   * Exits note selection mode and clears the overlay
   */
  const handleCloseOverlay = () => {
    setShowOverlay(false)
    setIsSelectingForNote(false)
    window.getSelection()?.removeAllRanges()
  }

  /**
   * Handles updating an existing highlight with new data
   * Updates both storage and active highlight state if applicable
   * @param {string} id - The ID of the highlight to update
   * @param {Partial<Highlight>} updates - The partial data to update
   */
  const handleUpdateHighlight = (id: string, updates: Partial<Highlight>) => {
    HighlightStorage.update(id, updates)
    if (activeHighlight) {
      setActiveHighlight({ ...activeHighlight, ...updates })
    }
  }

  /**
   * Handles deleting a highlight from storage and updating the display
   * Removes the highlight from storage, hides tooltip, and re-renders the page
   * @param {string} id - The ID of the highlight to delete
   */
  const handleDeleteHighlight = (id: string) => {
    HighlightStorage.delete(id)
    setShowTooltip(false)
    renderHighlights()
  }

  /**
   * Loads all highlights from storage and renders them on the current page
   * This is the core rendering function that:
   * 1. Removes any existing highlight elements to prevent duplicates
   * 2. Retrieves highlights specific to the current page URL
   * 3. Attempts to restore each highlight using its stored XPath location
   * 4. Handles cases gracefully when elements can't be found (page changes)
   */
  const renderHighlights = () => {
    // Remove existing highlights and restore original text
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el)
        parent.normalize()
      }
    })

    // Get highlights for the current page only
    const highlights = HighlightStorage.getByUrl(window.location.href)

    // Attempt to restore each highlight
    highlights.forEach((highlight) => {
      try {
        const element = getElementByXPath(highlight.xpath)
        if (element) {
          highlightTextInElement(element, highlight)
        }
      } catch (error) {
        console.warn("Could not restore highlight:", error)
      }
    })
  }

  /**
   * Creates a visual highlight within a specific DOM element
   * Uses a tree walker to find text nodes and applies highlighting based on stored offsets
   * This function handles the complex task of:
   * 1. Walking through all text nodes in the element
   * 2. Finding the exact text range based on character offsets
   * 3. Splitting text nodes and inserting highlight spans
   * 4. Preserving the original text structure
   *
   * @param {Element} element - The DOM element containing the text to highlight
   * @param {Highlight} highlight - The highlight object with position and style data
   */
  const highlightTextInElement = (element: Element, highlight: Highlight) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)

    // Collect all text nodes in the element
    const textNodes: Text[] = []
    let node
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text)
    }

    // Track character offset across all text nodes
    let currentOffset = 0
    for (const textNode of textNodes) {
      const nodeLength = textNode.textContent?.length || 0
      const nodeStart = currentOffset
      const nodeEnd = currentOffset + nodeLength

      // Check if this text node contains our highlight range
      if (
        nodeStart <= highlight.startOffset &&
        highlight.endOffset <= nodeEnd
      ) {
        // Calculate offsets within this specific text node
        const startOffset = highlight.startOffset - nodeStart
        const endOffset = highlight.endOffset - nodeStart

        // Split the text into before, highlighted, and after sections
        const before = textNode.textContent?.substring(0, startOffset) || ""
        const highlighted =
          textNode.textContent?.substring(startOffset, endOffset) || ""
        const after = textNode.textContent?.substring(endOffset) || ""

        if (highlighted) {
          // Create the highlight span with styling and data attributes
          const span = document.createElement("span")
          span.className = `${HIGHLIGHT_CLASS} cursor-pointer transition-opacity hover:opacity-80`
          span.setAttribute("data-highlight-id", highlight.id)
          span.textContent = highlighted
          span.title = highlight.note || "Click to view note"

          // Apply the stored highlight color
          span.style.backgroundColor = highlight.color || "#fef08a"
          span.style.borderRadius = "2px"
          span.style.padding = "1px 2px"

          // Replace the original text node with the split text and highlight span
          const parent = textNode.parentNode
          if (parent) {
            if (before)
              parent.insertBefore(document.createTextNode(before), textNode)
            parent.insertBefore(span, textNode)
            if (after)
              parent.insertBefore(document.createTextNode(after), textNode)
            parent.removeChild(textNode)
          }
        }
        break
      }

      currentOffset = nodeEnd
    }
  }

  return (
    <>
      {/* Draggable toolbar for color selection and note creation */}
      <HighlightToolbar
        isVisible={showToolbar}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        onNoteClick={handleNoteClick}
      />

      {/* Overlay for creating new highlights when text is selected in note mode */}
      {showOverlay && (
        <></>
        // <HighlightOverlay
        //   selectedText={selectedText}
        //   position={overlayPosition}
        //   onSave={handleSaveHighlight}
        //   onClose={handleCloseOverlay}
        // />
      )}

      {/* Tooltip for viewing and editing existing highlights */}
      {showTooltip && activeHighlight && (
        <HighlightTooltip
          highlight={activeHighlight}
          position={tooltipPosition}
          onUpdate={handleUpdateHighlight}
          onDelete={handleDeleteHighlight}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </>
  )
}

export default Content

/**
 * Generates an XPath expression for a given DOM node
 *
 * XPath provides a reliable way to locate elements even after page changes.
 * This function creates a path from the root document to the target element
 * by traversing up the DOM tree and noting each element's position among siblings.
 *
 * The generated XPath format: /html[1]/body[1]/div[2]/p[1]
 * Numbers indicate the element's position among same-type siblings.
 *
 * @param {Node} element - The DOM node to generate XPath for
 * @returns {string} The XPath expression as a string
 */
function generateXPath(element: Node): string {
  // Handle text nodes by getting their parent element
  if (element.nodeType === Node.TEXT_NODE) {
    element = element.parentNode!
  }

  // Only process element nodes
  if (element.nodeType !== Node.ELEMENT_NODE) {
    return ""
  }

  const xpath: string[] = []
  let current = element as Element

  // Traverse up the DOM tree to build the path
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling = current.previousSibling

    // Count same-name siblings that come before this element
    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        sibling.nodeName === current.nodeName
      ) {
        index++
      }
      sibling = sibling.previousSibling
    }

    // Build path segment: tagname[position]
    const tagName = current.nodeName.toLowerCase()
    xpath.unshift(`${tagName}[${index}]`)
    current = current.parentNode as Element
  }

  // Return complete XPath starting with root slash
  return `/${xpath.join("/")}`
}

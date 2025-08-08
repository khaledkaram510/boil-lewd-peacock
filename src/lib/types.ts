/**
 * Core data structure representing a text highlight
 *
 * This interface defines all the properties needed to save, restore,
 * and display a text highlight across browser sessions. It includes
 * both the text content and positional information for accurate restoration.
 */
export interface Highlight {
  /** Unique identifier for the highlight */
  id: string
  /** URL of the page where the highlight was created */
  url: string
  /** The actual text content that was highlighted */
  text: string
  /** Optional user note/annotation for the highlight */
  note: string
  /** Character offset where the highlight starts within the text node */
  startOffset: number
  /** Character offset where the highlight ends within the text node */
  endOffset: number
  /** XPath expression to locate the element containing the highlighted text */
  xpath: string
  /** Unix timestamp when the highlight was created */
  timestamp: number
  /** Optional color for the highlight (defaults to yellow) */
  color?: string
}

/**
 * Interface for screen positioning coordinates
 *
 * Used for positioning floating UI elements like tooltips and overlays
 * relative to the user's cursor or selected text on the page.
 */
export interface HighlightPosition {
  /** Horizontal position in pixels from the left edge */
  x: number
  /** Vertical position in pixels from the top edge */
  y: number
  /** Width of the positioned element in pixels */
  width: number
  /** Height of the positioned element in pixels */
  height: number
}
